


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "btree_gist" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."auto_cancel_expired_pending_bookings"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    cancelled_count integer;
BEGIN
    UPDATE public.ps_bookings
    SET status = 'cancelled',
        notes = COALESCE(notes || E'\n', '') || 'تم الإلغاء تلقائياً لانتهاء وقت الموعد دون اعتماد'
    WHERE status = 'pending'
      AND end_datetime <= NOW();
      
    GET DIAGNOSTICS cancelled_count = ROW_COUNT;
    RETURN cancelled_count;
END;
$$;


ALTER FUNCTION "public"."auto_cancel_expired_pending_bookings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_test_bookings"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    deleted_count integer;
BEGIN
    -- Verify staff authorization
    IF NOT EXISTS (SELECT 1 FROM public.staff_users WHERE email = coalesce(auth.jwt() ->> 'email', '')) THEN
      RAISE EXCEPTION 'غير مصرح لك بمسح حجوزات الاختبار' USING ERRCODE = '42501';
    END IF;

    DELETE FROM public.ps_bookings
    WHERE room_id LIKE 'dup-room-%'
       OR room_id LIKE 'room-sim-%'
       OR room_id LIKE 'station-A-%'
       OR room_id LIKE 'station-B-%'
       OR room_id LIKE 'room-diff-%'
       OR room_id LIKE 'room-cancel-%'
       OR room_id LIKE 'test-%'
       OR reservation_id LIKE 'DUP-TEST-%'
       OR reservation_id LIKE 'SIM-%'
       OR reservation_id LIKE 'DIFF-%'
       OR reservation_id LIKE 'CANCEL-%';
       
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_test_bookings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."confirm_booking_and_resolve_conflicts"("p_booking_id" "uuid", "p_auto_cancel_conflicts" boolean DEFAULT false) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_target public.ps_bookings;
  v_conflict_confirmed_id UUID;
  v_cancelled_ids UUID[] := ARRAY[]::UUID[];
  v_row RECORD;
BEGIN
  -- 0. Security Verification: Allow authenticated admin or cashier
  IF NOT EXISTS (SELECT 1 FROM public.staff_users WHERE email = coalesce(auth.jwt() ->> 'email', '')) THEN
    RAISE EXCEPTION 'غير مصرح لك بتأكيد الحجوزات' USING ERRCODE = '42501';
  END IF;

  -- 1. Fetch target booking
  SELECT * INTO v_target
  FROM public.ps_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الحجز غير موجود' USING ERRCODE = 'P0002';
  END IF;

  -- 2. Advisory lock on room
  PERFORM pg_advisory_xact_lock(hashtext('booking_' || v_target.room_id));

  -- 3. Check if another confirmed/completed booking conflicts
  SELECT id INTO v_conflict_confirmed_id
  FROM public.ps_bookings
  WHERE room_id = v_target.room_id
    AND id != v_target.id
    AND status IN ('confirmed', 'completed')
    AND v_target.start_datetime < end_datetime
    AND v_target.end_datetime > start_datetime
  LIMIT 1;

  IF v_conflict_confirmed_id IS NOT NULL THEN
    RAISE EXCEPTION 'لا يمكن تأكيد الحجز لوجود حجز آخر مؤكد بالفعل في نفس التوقيت' USING ERRCODE = '23P01';
  END IF;

  -- 4. Confirm target booking
  UPDATE public.ps_bookings
  SET status = 'confirmed',
      updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_target;

  -- 5. Auto cancel other overlapping pending bookings if requested
  IF p_auto_cancel_conflicts THEN
    FOR v_row IN
      SELECT id
      FROM public.ps_bookings
      WHERE room_id = v_target.room_id
        AND id != v_target.id
        AND status = 'pending'
        AND v_target.start_datetime < end_datetime
        AND v_target.end_datetime > start_datetime
    LOOP
      UPDATE public.ps_bookings
      SET status = 'cancelled',
          updated_at = now(),
          notes = TRIM(COALESCE(notes || ' | ', '') || 'تم الإلغاء لتأكيد الحجز المتنافس #' || v_target.reservation_id)
      WHERE id = v_row.id;

      v_cancelled_ids := array_append(v_cancelled_ids, v_row.id);
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'confirmed_booking', row_to_json(v_target),
    'cancelled_conflict_ids', to_jsonb(v_cancelled_ids)
  );
END;
$$;


ALTER FUNCTION "public"."confirm_booking_and_resolve_conflicts"("p_booking_id" "uuid", "p_auto_cancel_conflicts" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_booking_atomic"("p_booking" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_room_id TEXT;
  v_room_name TEXT;
  v_booking_date DATE;
  v_start_datetime TIMESTAMPTZ;
  v_end_datetime TIMESTAMPTZ;
  v_duration_hours NUMERIC;
  v_customer_name TEXT;
  v_customer_phone TEXT;
  v_payment_method TEXT;
  v_status TEXT;
  v_snacks JSONB;
  v_notes TEXT;
  v_room_rate NUMERIC := 100.00;
  v_subtotal NUMERIC;
  v_snacks_total NUMERIC := 0.00;
  v_discount_amount NUMERIC := 0.00;
  v_total_amount NUMERIC;
  v_reservation_id TEXT;
  v_start_time TEXT;
  v_end_time TEXT;
  v_promo_code TEXT;
  v_conflict_id UUID;
  v_new_booking public.ps_bookings;
  v_snack_item RECORD;
  v_db_price NUMERIC;
  v_policy_mode TEXT := 'temporary_hold';
  v_hold_minutes INT := 10;
  v_policy_setting JSONB;
  v_rates_setting JSONB;
BEGIN
  v_room_id := COALESCE(p_booking->>'room_id', 'room-1');
  
  -- 1. Acquire transaction-level advisory lock on room to serialize concurrent bookings
  PERFORM pg_advisory_xact_lock(hashtext('booking_' || v_room_id));

  -- Read booking policy
  SELECT value INTO v_policy_setting FROM public.app_settings WHERE key = 'booking_policy';
  IF v_policy_setting IS NOT NULL THEN
    v_policy_mode := COALESCE(v_policy_setting->>'mode', 'temporary_hold');
    v_hold_minutes := GREATEST(1, COALESCE((v_policy_setting->>'hold_minutes')::INT, 10));
  END IF;

  -- Read dynamic room rates from app_settings
  SELECT value INTO v_rates_setting FROM public.app_settings WHERE key = 'room_rates';
  IF v_rates_setting IS NOT NULL AND v_rates_setting ? v_room_id THEN
    v_room_rate := GREATEST(0.00, COALESCE((v_rates_setting->>v_room_id)::NUMERIC, 100.00));
  END IF;

  v_room_name := COALESCE(p_booking->>'room_name', 'غرفة بلايستيشن');
  v_booking_date := (p_booking->>'booking_date')::DATE;
  v_start_datetime := (p_booking->>'start_datetime')::TIMESTAMPTZ;
  v_end_datetime := (p_booking->>'end_datetime')::TIMESTAMPTZ;
  v_duration_hours := COALESCE((p_booking->>'duration_hours')::NUMERIC, 1);
  v_customer_name := TRIM(COALESCE(p_booking->>'customer_name', ''));
  v_customer_phone := REGEXP_REPLACE(COALESCE(p_booking->>'customer_phone', ''), '[^0-9]', '', 'g');
  v_payment_method := COALESCE(p_booking->>'payment_method', 'instapay');
  v_status := 'pending';
  v_snacks := COALESCE(p_booking->'snacks', '[]'::jsonb);
  v_notes := NULLIF(TRIM(p_booking->>'notes'), '');
  v_reservation_id := UPPER(TRIM(COALESCE(p_booking->>'reservation_id', 'D95-PS-' || floor(random() * 9000 + 1000)::text)));
  v_start_time := COALESCE(p_booking->>'start_time', '');
  v_end_time := COALESCE(p_booking->>'end_time', '');
  v_promo_code := UPPER(TRIM(COALESCE(p_booking->>'promo_code', '')));

  -- 2. Basic validations
  IF v_customer_name IS NULL OR length(v_customer_name) < 2 THEN
    RAISE EXCEPTION 'اسم العميل مطلوب ولا يقل عن حرفين' USING ERRCODE = '22023';
  END IF;

  IF v_customer_phone IS NULL OR length(v_customer_phone) < 10 THEN
    RAISE EXCEPTION 'رقم الهاتف غير صحيح' USING ERRCODE = '22023';
  END IF;

  IF v_end_datetime <= v_start_datetime THEN
    RAISE EXCEPTION 'وقت انتهاء الحجز يجب أن يكون بعد وقت البدء' USING ERRCODE = '22023';
  END IF;

  IF v_duration_hours < 1.0 THEN
    RAISE EXCEPTION 'الحد الأدنى للحجز هو ساعة واحدة' USING ERRCODE = '22023';
  END IF;

  IF (EXTRACT(EPOCH FROM (v_end_datetime - v_start_datetime)) / 3600.0) > 20.0 THEN
    RAISE EXCEPTION 'لا يمكن أن يتجاوز الحجز مدة العمل اليومية' USING ERRCODE = '22023';
  END IF;

  -- 3. Check for existing reservation ID collision
  IF EXISTS (SELECT 1 FROM public.ps_bookings WHERE reservation_id = v_reservation_id) THEN
    v_reservation_id := v_reservation_id || '-' || floor(random() * 900 + 100)::text;
  END IF;

  -- 4. Check overlap based on active policy
  IF v_policy_mode = 'admin_approval_only' THEN
    SELECT id INTO v_conflict_id
    FROM public.ps_bookings
    WHERE room_id = v_room_id
      AND status IN ('confirmed', 'completed')
      AND v_start_datetime < end_datetime
      AND v_end_datetime > start_datetime
    LIMIT 1;

    IF v_conflict_id IS NOT NULL THEN
      RAISE EXCEPTION 'عذراً، هذا الموعد تم حجزه وتأكيده بالفعل. يرجى اختيار موعد آخر.' USING ERRCODE = '23P01';
    END IF;
  ELSE
    SELECT id INTO v_conflict_id
    FROM public.ps_bookings
    WHERE room_id = v_room_id
      AND (
        status IN ('confirmed', 'completed')
        OR (status = 'pending' AND created_at > (now() - (v_hold_minutes || ' minutes')::INTERVAL))
      )
      AND v_start_datetime < end_datetime
      AND v_end_datetime > start_datetime
    LIMIT 1;

    IF v_conflict_id IS NOT NULL THEN
      RAISE EXCEPTION 'عذراً، هذا الموعد تم حجزه للتو وهو مقفول حالياً في انتظار المراجعة. يرجى اختيار موعد آخر.' USING ERRCODE = '23P01';
    END IF;
  END IF;

  -- 5. Server-Authoritative Price Calculation with Dynamic Room Rate
  v_subtotal := round(v_duration_hours * v_room_rate, 2);

  -- Snacks recalculation from database with quantity support
  IF v_snacks IS NOT NULL AND jsonb_array_length(v_snacks) > 0 THEN
    FOR v_snack_item IN 
      SELECT 
        item->>'id' AS id,
        COALESCE((item->>'price')::NUMERIC, 0) AS declared_price,
        GREATEST(1, COALESCE((item->>'quantity')::INT, 1)) AS quantity
      FROM jsonb_array_elements(v_snacks) AS item
    LOOP
      v_db_price := NULL;
      IF v_snack_item.id IS NOT NULL THEN
        SELECT price INTO v_db_price 
        FROM public.products 
        WHERE id::text = v_snack_item.id OR slug = v_snack_item.id
        LIMIT 1;
      END IF;

      IF v_db_price IS NULL THEN
        RAISE EXCEPTION 'منتج غير صالح' USING ERRCODE = '22023';
      END IF;
      
      v_snacks_total := v_snacks_total + (v_db_price * v_snack_item.quantity);
    END LOOP;
  END IF;

  -- Promo code check
  IF v_promo_code IN ('D95VIP', 'GAMER10', 'D95') THEN
    v_discount_amount := round((v_subtotal + v_snacks_total) * 0.10, 2);
  END IF;

  v_total_amount := GREATEST(0.00, v_subtotal + v_snacks_total - v_discount_amount);

  -- 6. Insert new booking
  INSERT INTO public.ps_bookings (
    reservation_id,
    customer_name,
    customer_phone,
    room_id,
    room_name,
    booking_date,
    start_datetime,
    end_datetime,
    start_time,
    end_time,
    duration_hours,
    subtotal,
    snacks_total,
    discount_amount,
    total_amount,
    payment_method,
    status,
    snacks,
    notes
  ) VALUES (
    v_reservation_id,
    v_customer_name,
    v_customer_phone,
    v_room_id,
    v_room_name,
    v_booking_date,
    v_start_datetime,
    v_end_datetime,
    v_start_time,
    v_end_time,
    v_duration_hours,
    v_subtotal,
    v_snacks_total,
    v_discount_amount,
    v_total_amount,
    v_payment_method,
    v_status,
    v_snacks,
    v_notes
  )
  RETURNING * INTO v_new_booking;

  RETURN row_to_json(v_new_booking)::jsonb;
END;
$$;


ALTER FUNCTION "public"."create_booking_atomic"("p_booking" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_order_atomic"("p_order" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_order_number TEXT;
  v_customer_name TEXT;
  v_customer_phone TEXT;
  v_order_type TEXT;
  v_table_number TEXT;
  v_delivery_address TEXT;
  v_payment_method TEXT;
  v_items JSONB;
  v_notes TEXT;
  v_sanitized_items JSONB := '[]'::jsonb;
  v_item RECORD;
  v_product RECORD;
  v_unit_price NUMERIC;
  v_qty INT;
  v_customization JSONB;
  v_extra_price NUMERIC;
  v_subtotal NUMERIC := 0.00;
  v_total NUMERIC := 0.00;
  v_new_order public.orders;
BEGIN
  v_order_number := UPPER(TRIM(COALESCE(p_order->>'order_number', 'D95-ORD-' || floor(random() * 90000 + 10000)::text)));
  v_customer_name := TRIM(COALESCE(p_order->>'customer_name', 'عميل'));
  v_customer_phone := NULLIF(REGEXP_REPLACE(COALESCE(p_order->>'customer_phone', ''), '[^0-9]', '', 'g'), '');
  v_order_type := COALESCE(p_order->>'order_type', 'dine');
  v_table_number := NULLIF(TRIM(COALESCE(p_order->>'table_number', '')), '');
  v_delivery_address := NULLIF(TRIM(COALESCE(p_order->>'delivery_address', '')), '');
  v_payment_method := COALESCE(p_order->>'payment_method', 'wallet');
  v_items := COALESCE(p_order->'items', '[]'::jsonb);
  v_notes := NULLIF(TRIM(COALESCE(p_order->>'notes', '')), '');

  IF jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'لا يمكن إنشاء طلب فارغ' USING ERRCODE = '22023';
  END IF;

  -- Verify unique order_number collision
  IF EXISTS (SELECT 1 FROM public.orders WHERE order_number = v_order_number) THEN
    v_order_number := v_order_number || '-' || floor(random() * 900 + 100)::text;
  END IF;

  -- Authoritative Price Calculation from products table
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) AS elem
  LOOP
    v_qty := GREATEST(1, COALESCE((v_item.value->>'quantity')::INT, 1));
    v_customization := COALESCE(v_item.value->'customization', '{}'::jsonb);
    v_extra_price := 0.00;

    -- Extra shot adds 15 EGP
    IF (v_customization->>'extraShot')::BOOLEAN IS TRUE THEN
      v_extra_price := v_extra_price + 15.00;
    END IF;

    -- Lookup product in products table
    v_unit_price := NULL;
    IF (v_item.value->>'id') IS NOT NULL THEN
      SELECT price INTO v_product FROM public.products
      WHERE id::text = (v_item.value->>'id') OR slug = (v_item.value->>'id')
      LIMIT 1;

      IF FOUND THEN
        v_unit_price := v_product.price;
      END IF;
    END IF;

    -- Reject invalid products strictly
    IF v_unit_price IS NULL THEN
      RAISE EXCEPTION 'منتج غير صالح' USING ERRCODE = '22023';
    END IF;

    v_unit_price := v_unit_price + v_extra_price;
    v_subtotal := v_subtotal + (v_unit_price * v_qty);

    v_sanitized_items := v_sanitized_items || jsonb_build_object(
      'id', COALESCE(v_item.value->>'id', 'custom'),
      'name', COALESCE(v_item.value->>'name', 'صنف'),
      'price', v_unit_price,
      'quantity', v_qty,
      'customization', v_customization
    );
  END LOOP;

  v_total := ROUND(v_subtotal, 2);

  INSERT INTO public.orders (
    order_number,
    customer_name,
    customer_phone,
    order_type,
    table_number,
    delivery_address,
    payment_method,
    items,
    subtotal,
    total_amount,
    status,
    notes
  ) VALUES (
    v_order_number,
    v_customer_name,
    v_customer_phone,
    v_order_type,
    v_table_number,
    v_delivery_address,
    v_payment_method,
    v_sanitized_items,
    v_total,
    v_total,
    'pending',
    v_notes
  )
  RETURNING * INTO v_new_order;

  RETURN row_to_json(v_new_order)::jsonb;
END;
$$;


ALTER FUNCTION "public"."create_order_atomic"("p_order" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ps_bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reservation_id" "text" NOT NULL,
    "customer_name" "text" NOT NULL,
    "customer_phone" "text" NOT NULL,
    "room_name" "text" NOT NULL,
    "booking_date" "date" NOT NULL,
    "start_time" "text" NOT NULL,
    "end_time" "text" NOT NULL,
    "duration_hours" numeric(4,1) DEFAULT 1,
    "subtotal" numeric(10,2) DEFAULT 0,
    "snacks_total" numeric(10,2) DEFAULT 0,
    "discount_amount" numeric(10,2) DEFAULT 0,
    "total_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "payment_method" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "snacks" "jsonb" DEFAULT '[]'::"jsonb",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "room_id" "text" DEFAULT 'room-1'::"text" NOT NULL,
    "start_datetime" timestamp with time zone NOT NULL,
    "end_datetime" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ps_bookings" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_ps_booking_atomic"("p_reservation_id" "text", "p_room_id" "text", "p_room_name" "text", "p_customer_name" "text", "p_customer_phone" "text", "p_booking_date" "date", "p_start_datetime" timestamp with time zone, "p_duration_hours" numeric, "p_payment_method" "text", "p_snacks" "jsonb" DEFAULT '[]'::"jsonb", "p_notes" "text" DEFAULT NULL::"text", "p_promo_code" "text" DEFAULT NULL::"text") RETURNS "public"."ps_bookings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_end_datetime TIMESTAMPTZ;
  v_start_display TEXT;
  v_end_display TEXT;
  v_room_rate NUMERIC := 100.00;
  v_subtotal NUMERIC;
  v_snacks_total NUMERIC := 0.00;
  v_discount NUMERIC := 0.00;
  v_total NUMERIC;
  v_snack RECORD;
  v_overlap_count INT;
  v_open_datetime TIMESTAMPTZ;
  v_close_datetime TIMESTAMPTZ;
  v_new_booking public.ps_bookings;
  v_clean_phone TEXT;
BEGIN
  -- 1. Check for duplicate reservation ID
  IF EXISTS (SELECT 1 FROM public.ps_bookings WHERE reservation_id = trim(upper(p_reservation_id))) THEN
    RAISE EXCEPTION 'تم إرسال هذا الحجز مسبقاً بالفعل (DUPLICATE_SUBMISSION)';
  END IF;

  -- 2. Validate inputs
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) < 3 THEN
    RAISE EXCEPTION 'اسم العميل غير صالح (يجب أن يكون 3 أحرف على الأقل)';
  END IF;

  v_clean_phone := regexp_replace(p_customer_phone, '[^0-9]', '', 'g');
  IF length(v_clean_phone) < 10 THEN
    RAISE EXCEPTION 'رقم الهاتف غير صالح (يجب أن يحتوي على 10 أرقام على الأقل)';
  END IF;

  -- 3. Validate duration (min 1.0 hour)
  IF p_duration_hours IS NULL OR p_duration_hours < 1.0 THEN
    RAISE EXCEPTION 'مدة الحجز يجب ألا تقل عن ساعة واحدة (1.0)';
  END IF;

  -- 4. Calculate exact end datetime
  v_end_datetime := p_start_datetime + (p_duration_hours * interval '1 hour');

  -- 5. Validate not in the past (allow small 5-minute clock drift)
  IF p_start_datetime < (now() - interval '5 minutes') THEN
    RAISE EXCEPTION 'لا يمكن حجز موعد قد فات بالفعل';
  END IF;

  -- 6. Validate business hours (8:00 AM to 4:00 AM following day in Africa/Cairo)
  v_open_datetime := (p_booking_date::text || ' 08:00:00 Africa/Cairo')::TIMESTAMPTZ;
  v_close_datetime := ((p_booking_date + 1)::text || ' 04:00:00 Africa/Cairo')::TIMESTAMPTZ;

  IF p_start_datetime < v_open_datetime THEN
    RAISE EXCEPTION 'يبدأ وقت العمل في الصالة من الساعة 8:00 صباحاً';
  END IF;

  IF v_end_datetime > v_close_datetime THEN
    RAISE EXCEPTION 'ينتهي وقت العمل في الصالة الساعة 4:00 فجراً، لا يمكن تجاوز وقت الإغلاق';
  END IF;

  -- 7. Overlap rule check: newStart < existingEnd AND newEnd > existingStart
  -- Lock conflicting rows if any to serialize concurrent attempts
  SELECT count(*) INTO v_overlap_count
  FROM public.ps_bookings
  WHERE room_id = p_room_id
    AND status != 'cancelled'
    AND start_datetime < v_end_datetime
    AND end_datetime > p_start_datetime
  FOR UPDATE;

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION 'عذراً، هذا الوقت يتعارض مع حجز قائم بالفعل. يرجى اختيار وقت آخر.';
  END IF;

  -- 8. Calculate server-authoritative financials
  v_subtotal := round(p_duration_hours * v_room_rate, 2);

  IF p_snacks IS NOT NULL AND jsonb_array_length(p_snacks) > 0 THEN
    FOR v_snack IN SELECT * FROM jsonb_to_recordset(p_snacks) AS (id text, price numeric)
    LOOP
      v_snacks_total := v_snacks_total + coalesce(v_snack.price, 0);
    END LOOP;
  END IF;

  IF p_promo_code IS NOT NULL AND upper(trim(p_promo_code)) IN ('D95VIP', 'GAMER10', 'D95') THEN
    v_discount := round((v_subtotal + v_snacks_total) * 0.10, 2);
  END IF;

  v_total := greatest(0.00, v_subtotal + v_snacks_total - v_discount);

  -- 9. Format localized display strings
  v_start_display := to_char(p_start_datetime AT TIME ZONE 'Africa/Cairo', 'HH12:MI') || ' ' || 
    CASE WHEN to_char(p_start_datetime AT TIME ZONE 'Africa/Cairo', 'AM') = 'PM' THEN 'م' ELSE 'ص' END;
  v_end_display := to_char(v_end_datetime AT TIME ZONE 'Africa/Cairo', 'HH12:MI') || ' ' || 
    CASE WHEN to_char(v_end_datetime AT TIME ZONE 'Africa/Cairo', 'AM') = 'PM' THEN 'م' ELSE 'ص' END;

  -- 10. Atomic insert
  INSERT INTO public.ps_bookings (
    reservation_id,
    room_id,
    room_name,
    customer_name,
    customer_phone,
    booking_date,
    start_datetime,
    end_datetime,
    start_time,
    end_time,
    duration_hours,
    subtotal,
    snacks_total,
    discount_amount,
    total_amount,
    payment_method,
    status,
    snacks,
    notes
  ) VALUES (
    trim(upper(p_reservation_id)),
    p_room_id,
    p_room_name,
    trim(p_customer_name),
    v_clean_phone,
    p_booking_date,
    p_start_datetime,
    v_end_datetime,
    v_start_display,
    v_end_display,
    p_duration_hours,
    v_subtotal,
    v_snacks_total,
    v_discount,
    v_total,
    p_payment_method,
    'pending',
    coalesce(p_snacks, '[]'::jsonb),
    trim(p_notes)
  )
  RETURNING * INTO v_new_booking;

  RETURN v_new_booking;
END;
$$;


ALTER FUNCTION "public"."create_ps_booking_atomic"("p_reservation_id" "text", "p_room_id" "text", "p_room_name" "text", "p_customer_name" "text", "p_customer_phone" "text", "p_booking_date" "date", "p_start_datetime" timestamp with time zone, "p_duration_hours" numeric, "p_payment_method" "text", "p_snacks" "jsonb", "p_notes" "text", "p_promo_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."extend_booking_atomic"("p_booking_id" "uuid", "p_target_updates" "jsonb", "p_shifts" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_shift_item RECORD;
  v_updated_target public.ps_bookings;
BEGIN
  -- Verify admin or cashier role
  IF NOT EXISTS (SELECT 1 FROM public.staff_users WHERE email = coalesce(auth.jwt() ->> 'email', '')) THEN
    RAISE EXCEPTION 'غير مصرح لك بتمديد الحجوزات' USING ERRCODE = '42501';
  END IF;

  -- 1. Shift conflicting bookings
  IF p_shifts IS NOT NULL AND jsonb_array_length(p_shifts) > 0 THEN
    FOR v_shift_item IN 
      SELECT 
        (s->>'id')::uuid AS id,
        (s->>'start_datetime')::timestamptz AS start_dt,
        (s->>'end_datetime')::timestamptz AS end_dt,
        s->>'start_time' AS start_t,
        s->>'end_time' AS end_t
      FROM jsonb_array_elements(p_shifts) AS s
    LOOP
      UPDATE public.ps_bookings
      SET 
        start_datetime = v_shift_item.start_dt,
        end_datetime = v_shift_item.end_dt,
        start_time = v_shift_item.start_t,
        end_time = v_shift_item.end_t
      WHERE id = v_shift_item.id;
    END LOOP;
  END IF;

  -- 2. Update target extended booking
  UPDATE public.ps_bookings
  SET
    end_datetime = (p_target_updates->>'end_datetime')::timestamptz,
    end_time = p_target_updates->>'end_time',
    duration_hours = (p_target_updates->>'duration_hours')::numeric,
    subtotal = (p_target_updates->>'subtotal')::numeric,
    total_amount = (p_target_updates->>'total_amount')::numeric
  WHERE id = p_booking_id
  RETURNING * INTO v_updated_target;

  RETURN row_to_json(v_updated_target)::jsonb;
END;
$$;


ALTER FUNCTION "public"."extend_booking_atomic"("p_booking_id" "uuid", "p_target_updates" "jsonb", "p_shifts" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_booking_by_reservation_id"("p_reservation_id" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_booking RECORD;
BEGIN
  SELECT 
    id,
    reservation_id,
    customer_name,
    customer_phone,
    room_id,
    room_name,
    booking_date,
    start_time,
    end_time,
    start_datetime,
    end_datetime,
    duration_hours,
    subtotal,
    snacks_total,
    discount_amount,
    total_amount,
    payment_method,
    status,
    snacks,
    notes,
    created_at
  INTO v_booking
  FROM public.ps_bookings
  WHERE reservation_id = UPPER(TRIM(p_reservation_id))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN row_to_json(v_booking)::jsonb;
END;
$$;


ALTER FUNCTION "public"."get_booking_by_reservation_id"("p_reservation_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_booking_metrics_v2"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_cairo_today DATE;
  v_total_count INT := 0;
  v_pending_count INT := 0;
  v_confirmed_count INT := 0;
  v_today_count INT := 0;
  v_total_revenue NUMERIC := 0.00;
  v_today_revenue NUMERIC := 0.00;
  v_recent_pending JSONB := '[]'::jsonb;
  v_pending_counts_by_date JSONB := '{}'::jsonb;
BEGIN
  -- Verify staff authorization
  IF NOT EXISTS (SELECT 1 FROM public.staff_users WHERE email = coalesce(auth.jwt() ->> 'email', '')) THEN
    RAISE EXCEPTION 'غير مصرح لك بالاطلاع على الإحصائيات' USING ERRCODE = '42501';
  END IF;

  -- Run automatic cleanup of expired pending bookings
  PERFORM public.auto_cancel_expired_pending_bookings();

  v_cairo_today := (now() AT TIME ZONE 'Africa/Cairo')::DATE;

  SELECT count(*) INTO v_total_count
  FROM public.ps_bookings
  WHERE status != 'cancelled';

  SELECT count(*) INTO v_pending_count
  FROM public.ps_bookings
  WHERE status = 'pending'
    AND end_datetime > now()
    AND booking_date >= v_cairo_today;

  SELECT count(*) INTO v_confirmed_count
  FROM public.ps_bookings
  WHERE status = 'confirmed';

  SELECT count(*) INTO v_today_count
  FROM public.ps_bookings
  WHERE booking_date = v_cairo_today;

  SELECT COALESCE(sum(total_amount), 0.00) INTO v_total_revenue
  FROM public.ps_bookings
  WHERE status = 'confirmed';

  SELECT COALESCE(sum(total_amount), 0.00) INTO v_today_revenue
  FROM public.ps_bookings
  WHERE booking_date = v_cairo_today
    AND status = 'confirmed';

  SELECT COALESCE(jsonb_agg(row_to_json(b)), '[]'::jsonb) INTO v_recent_pending
  FROM (
    SELECT * FROM public.ps_bookings
    WHERE status = 'pending'
      AND end_datetime > now()
      AND booking_date >= v_cairo_today
    ORDER BY created_at DESC
    LIMIT 50
  ) b;

  SELECT COALESCE(jsonb_object_agg(booking_date::text, cnt), '{}'::jsonb) INTO v_pending_counts_by_date
  FROM (
    SELECT booking_date, count(*) as cnt
    FROM public.ps_bookings
    WHERE status = 'pending'
      AND end_datetime > now()
      AND booking_date >= v_cairo_today
    GROUP BY booking_date
  ) p;

  RETURN jsonb_build_object(
    'totalCount', v_total_count,
    'pendingCount', v_pending_count,
    'confirmedCount', v_confirmed_count,
    'todayCount', v_today_count,
    'totalRevenue', ROUND(v_total_revenue),
    'todayRevenue', ROUND(v_today_revenue),
    'recentPending', v_recent_pending,
    'pendingCountsByDate', v_pending_counts_by_date
  );
END;
$$;


ALTER FUNCTION "public"."get_booking_metrics_v2"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_order_metrics_v2"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_pending_count INT := 0;
  v_today_count INT := 0;
  v_today_revenue NUMERIC := 0.00;
  v_cairo_today_start TIMESTAMPTZ;
BEGIN
  -- Verify staff authorization
  IF NOT EXISTS (SELECT 1 FROM public.staff_users WHERE email = coalesce(auth.jwt() ->> 'email', '')) THEN
    RAISE EXCEPTION 'غير مصرح لك بالاطلاع على الإحصائيات' USING ERRCODE = '42501';
  END IF;

  -- Beginning of today in Cairo timezone
  v_cairo_today_start := ((now() AT TIME ZONE 'Africa/Cairo')::DATE::text || ' 00:00:00 Africa/Cairo')::TIMESTAMPTZ;

  SELECT count(*) INTO v_pending_count
  FROM public.orders
  WHERE status = 'pending';

  SELECT count(*), COALESCE(sum(total_amount), 0.00)
  INTO v_today_count, v_today_revenue
  FROM public.orders
  WHERE created_at >= v_cairo_today_start
    AND status != 'cancelled';

  RETURN jsonb_build_object(
    'pendingOrdersCount', v_pending_count,
    'todayOrdersCount', v_today_count,
    'todayOrdersRevenue', ROUND(v_today_revenue)
  );
END;
$$;


ALTER FUNCTION "public"."get_order_metrics_v2"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_room_occupied_intervals"("p_room_id" "text", "p_business_date" "date") RETURNS TABLE("start_datetime" timestamp with time zone, "end_datetime" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT * FROM public.get_room_occupied_intervals(p_room_id, p_business_date, NULL::timestamptz, NULL::timestamptz);
$$;


ALTER FUNCTION "public"."get_room_occupied_intervals"("p_room_id" "text", "p_business_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_room_occupied_intervals"("p_room_id" "text", "p_business_date" "date", "p_window_start" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_window_end" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("start_datetime" timestamp with time zone, "end_datetime" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_policy_mode TEXT := 'temporary_hold';
  v_hold_minutes INT := 10;
  v_policy_setting JSONB;
BEGIN
  SELECT value INTO v_policy_setting FROM public.app_settings WHERE key = 'booking_policy';
  IF v_policy_setting IS NOT NULL THEN
    v_policy_mode := COALESCE(v_policy_setting->>'mode', 'temporary_hold');
    v_hold_minutes := GREATEST(1, COALESCE((v_policy_setting->>'hold_minutes')::INT, 10));
  END IF;

  IF v_policy_mode = 'admin_approval_only' THEN
    -- In admin approval only mode: only confirmed and completed bookings occupy the slot
    IF p_window_start IS NOT NULL AND p_window_end IS NOT NULL THEN
      RETURN QUERY
      SELECT b.start_datetime, b.end_datetime
      FROM public.ps_bookings b
      WHERE b.room_id = p_room_id
        AND b.status IN ('confirmed', 'completed')
        AND b.start_datetime < p_window_end
        AND b.end_datetime > p_window_start
      ORDER BY b.start_datetime ASC;
    ELSE
      RETURN QUERY
      SELECT b.start_datetime, b.end_datetime
      FROM public.ps_bookings b
      WHERE b.room_id = p_room_id
        AND b.booking_date = p_business_date
        AND b.status IN ('confirmed', 'completed')
      ORDER BY b.start_datetime ASC;
    END IF;
  ELSE
    -- In temporary hold mode (default 10 mins): confirmed/completed OR pending within hold_minutes
    IF p_window_start IS NOT NULL AND p_window_end IS NOT NULL THEN
      RETURN QUERY
      SELECT b.start_datetime, b.end_datetime
      FROM public.ps_bookings b
      WHERE b.room_id = p_room_id
        AND (
          b.status IN ('confirmed', 'completed')
          OR (b.status = 'pending' AND b.created_at > (now() - (v_hold_minutes || ' minutes')::INTERVAL))
        )
        AND b.start_datetime < p_window_end
        AND b.end_datetime > p_window_start
      ORDER BY b.start_datetime ASC;
    ELSE
      RETURN QUERY
      SELECT b.start_datetime, b.end_datetime
      FROM public.ps_bookings b
      WHERE b.room_id = p_room_id
        AND b.booking_date = p_business_date
        AND (
          b.status IN ('confirmed', 'completed')
          OR (b.status = 'pending' AND b.created_at > (now() - (v_hold_minutes || ' minutes')::INTERVAL))
        )
      ORDER BY b.start_datetime ASC;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_room_occupied_intervals"("p_room_id" "text", "p_business_date" "date", "p_window_start" timestamp with time zone, "p_window_end" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "text"
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text" DEFAULT '☕'::"text",
    "description" "text",
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gaming_stations" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" DEFAULT 'console'::"text" NOT NULL,
    "device_type" "text" DEFAULT 'PS5'::"text" NOT NULL,
    "rate_per_hour" numeric DEFAULT 50 NOT NULL,
    "multi_rate_per_hour" numeric DEFAULT 70,
    "rate_per_match" numeric DEFAULT 0,
    "status" "text" DEFAULT 'available'::"text" NOT NULL,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."gaming_stations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "detail" "text",
    "badge" "text",
    "price" "text",
    "original_price" "text",
    "icon" "text" DEFAULT '🎮'::"text",
    "highlight" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_number" "text" NOT NULL,
    "customer_name" "text",
    "customer_phone" "text",
    "order_type" "text" DEFAULT 'dine'::"text" NOT NULL,
    "table_number" "text",
    "delivery_address" "text",
    "payment_method" "text" DEFAULT 'wallet'::"text",
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "subtotal" numeric DEFAULT 0 NOT NULL,
    "total_amount" numeric DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text",
    "category_id" "text",
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "original_price" numeric(10,2),
    "currency" "text" DEFAULT 'ج.م'::"text",
    "image_url" "text",
    "badge" "text",
    "is_available" boolean DEFAULT true,
    "is_hot" boolean DEFAULT false,
    "is_cold" boolean DEFAULT false,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_users" (
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "staff_users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'cashier'::"text"])))
);


ALTER TABLE "public"."staff_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."station_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "station_id" "text" NOT NULL,
    "customer_name" "text" DEFAULT 'عميل عام'::"text",
    "customer_phone" "text",
    "pricing_mode" "text" DEFAULT 'hourly'::"text" NOT NULL,
    "time_system" "text" DEFAULT 'open'::"text" NOT NULL,
    "target_minutes" integer,
    "is_multi" boolean DEFAULT false,
    "started_by" "text" DEFAULT 'المدير'::"text",
    "start_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pause_time" timestamp with time zone,
    "elapsed_seconds" integer DEFAULT 0,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "notes" "text" DEFAULT ''::"text",
    "hourly_rate" numeric DEFAULT 50 NOT NULL,
    "orders" "jsonb" DEFAULT '[]'::"jsonb",
    "total_time_cost" numeric DEFAULT 0,
    "orders_total" numeric DEFAULT 0,
    "discount_amount" numeric DEFAULT 0,
    "grand_total" numeric DEFAULT 0,
    "payment_method" "text",
    "ended_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."station_sessions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gaming_stations"
    ADD CONSTRAINT "gaming_stations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ps_bookings"
    ADD CONSTRAINT "no_overlapping_bookings" EXCLUDE USING "gist" ("room_id" WITH =, "tstzrange"("start_datetime", "end_datetime", '[)'::"text") WITH &&) WHERE (("status" = ANY (ARRAY['confirmed'::"text", 'completed'::"text"])));



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."ps_bookings"
    ADD CONSTRAINT "ps_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ps_bookings"
    ADD CONSTRAINT "ps_bookings_reservation_id_key" UNIQUE ("reservation_id");



ALTER TABLE ONLY "public"."staff_users"
    ADD CONSTRAINT "staff_users_pkey" PRIMARY KEY ("email");



ALTER TABLE ONLY "public"."station_sessions"
    ADD CONSTRAINT "station_sessions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_bookings_date" ON "public"."ps_bookings" USING "btree" ("booking_date");



CREATE INDEX "idx_bookings_status" ON "public"."ps_bookings" USING "btree" ("status");



CREATE INDEX "idx_gaming_stations_display_order" ON "public"."gaming_stations" USING "btree" ("display_order");



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_products_category" ON "public"."products" USING "btree" ("category_id");



CREATE INDEX "idx_ps_bookings_room_dates" ON "public"."ps_bookings" USING "btree" ("room_id", "booking_date", "status");



CREATE INDEX "idx_ps_bookings_time_range" ON "public"."ps_bookings" USING "btree" ("room_id", "start_datetime", "end_datetime");



CREATE INDEX "idx_station_sessions_station_id" ON "public"."station_sessions" USING "btree" ("station_id");



CREATE INDEX "idx_station_sessions_status_station" ON "public"."station_sessions" USING "btree" ("status", "station_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ps_bookings"
    ADD CONSTRAINT "ps_bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."gaming_stations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."station_sessions"
    ADD CONSTRAINT "station_sessions_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "public"."gaming_stations"("id") ON DELETE RESTRICT;



CREATE POLICY "Allow admin delete staff_users" ON "public"."staff_users" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."staff_users" "su"
  WHERE (("su"."email" = ("auth"."jwt"() ->> 'email'::"text")) AND ("su"."role" = 'admin'::"text")))));



CREATE POLICY "Allow admin insert staff_users" ON "public"."staff_users" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."staff_users" "su"
  WHERE (("su"."email" = ("auth"."jwt"() ->> 'email'::"text")) AND ("su"."role" = 'admin'::"text")))));



CREATE POLICY "Allow admin update staff_users" ON "public"."staff_users" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."staff_users" "su"
  WHERE (("su"."email" = ("auth"."jwt"() ->> 'email'::"text")) AND ("su"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."staff_users" "su"
  WHERE (("su"."email" = ("auth"."jwt"() ->> 'email'::"text")) AND ("su"."role" = 'admin'::"text")))));



CREATE POLICY "Allow admin write categories" ON "public"."categories" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."staff_users"
  WHERE (("staff_users"."email" = ("auth"."jwt"() ->> 'email'::"text")) AND ("staff_users"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."staff_users"
  WHERE (("staff_users"."email" = ("auth"."jwt"() ->> 'email'::"text")) AND ("staff_users"."role" = 'admin'::"text")))));



CREATE POLICY "Allow admin write offers" ON "public"."offers" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."staff_users"
  WHERE (("staff_users"."email" = ("auth"."jwt"() ->> 'email'::"text")) AND ("staff_users"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."staff_users"
  WHERE (("staff_users"."email" = ("auth"."jwt"() ->> 'email'::"text")) AND ("staff_users"."role" = 'admin'::"text")))));



CREATE POLICY "Allow admin write products" ON "public"."products" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."staff_users"
  WHERE (("staff_users"."email" = ("auth"."jwt"() ->> 'email'::"text")) AND ("staff_users"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."staff_users"
  WHERE (("staff_users"."email" = ("auth"."jwt"() ->> 'email'::"text")) AND ("staff_users"."role" = 'admin'::"text")))));



CREATE OR REPLACE FUNCTION public.is_staff() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public
    AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM staff_users WHERE email = auth.jwt()->>'email');
END;
$$;

CREATE POLICY "Allow authenticated read staff_users" ON "public"."staff_users" FOR SELECT TO "authenticated" USING (is_staff());



CREATE POLICY "Allow public insert bookings" ON "public"."ps_bookings" FOR INSERT TO "authenticated", "anon" WITH CHECK ((("status" = 'pending'::"text") AND ("duration_hours" >= (1)::numeric) AND ("total_amount" >= (0)::numeric) AND ("length"(TRIM(BOTH FROM "customer_name")) >= 2) AND ("length"("regexp_replace"("customer_phone", '[^0-9]'::"text", ''::"text", 'g'::"text")) >= 10)));



CREATE POLICY "Allow public insert orders" ON "public"."orders" FOR INSERT TO "authenticated", "anon" WITH CHECK ((("status" = 'pending'::"text") AND ("total_amount" >= (0)::numeric) AND ("subtotal" >= (0)::numeric) AND ("length"(TRIM(BOTH FROM "order_number")) >= 5) AND ("jsonb_typeof"("items") = 'array'::"text") AND ("jsonb_array_length"("items") > 0)));



CREATE POLICY "Allow public read categories" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Allow public read offers" ON "public"."offers" FOR SELECT USING (true);



CREATE POLICY "Allow public read products" ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "Allow public select app_settings" ON "public"."app_settings" FOR SELECT USING (true);



CREATE POLICY "Allow staff access bookings" ON "public"."ps_bookings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."staff_users"
  WHERE ("staff_users"."email" = ("auth"."jwt"() ->> 'email'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."staff_users"
  WHERE ("staff_users"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "Allow staff access orders" ON "public"."orders" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."staff_users"
  WHERE ("staff_users"."email" = ("auth"."jwt"() ->> 'email'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."staff_users"
  WHERE ("staff_users"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public
    AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM staff_users WHERE email = auth.jwt()->>'email' AND role = 'admin');
END;
$$;

CREATE POLICY "Allow admin update app_settings" ON "public"."app_settings" TO "authenticated" USING (is_admin()) WITH CHECK (is_admin());



CREATE POLICY "Allow staff write gaming_stations" ON "public"."gaming_stations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."staff_users"
  WHERE ("staff_users"."email" = ("auth"."jwt"() ->> 'email'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."staff_users"
  WHERE ("staff_users"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "Allow staff write station_sessions" ON "public"."station_sessions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."staff_users"
  WHERE ("staff_users"."email" = ("auth"."jwt"() ->> 'email'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."staff_users"
  WHERE ("staff_users"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "Public read gaming_stations" ON "public"."gaming_stations" FOR SELECT USING (true);



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gaming_stations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ps_bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staff_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."station_sessions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."orders";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."ps_bookings";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."auto_cancel_expired_pending_bookings"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."auto_cancel_expired_pending_bookings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_cancel_expired_pending_bookings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "postgres";
GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "anon";
GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_test_bookings"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_test_bookings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_test_bookings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."confirm_booking_and_resolve_conflicts"("p_booking_id" "uuid", "p_auto_cancel_conflicts" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."confirm_booking_and_resolve_conflicts"("p_booking_id" "uuid", "p_auto_cancel_conflicts" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."confirm_booking_and_resolve_conflicts"("p_booking_id" "uuid", "p_auto_cancel_conflicts" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_booking_atomic"("p_booking" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_booking_atomic"("p_booking" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_booking_atomic"("p_booking" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_order_atomic"("p_order" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_order_atomic"("p_order" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_order_atomic"("p_order" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."ps_bookings" TO "anon";
GRANT ALL ON TABLE "public"."ps_bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."ps_bookings" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_ps_booking_atomic"("p_reservation_id" "text", "p_room_id" "text", "p_room_name" "text", "p_customer_name" "text", "p_customer_phone" "text", "p_booking_date" "date", "p_start_datetime" timestamp with time zone, "p_duration_hours" numeric, "p_payment_method" "text", "p_snacks" "jsonb", "p_notes" "text", "p_promo_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_ps_booking_atomic"("p_reservation_id" "text", "p_room_id" "text", "p_room_name" "text", "p_customer_name" "text", "p_customer_phone" "text", "p_booking_date" "date", "p_start_datetime" timestamp with time zone, "p_duration_hours" numeric, "p_payment_method" "text", "p_snacks" "jsonb", "p_notes" "text", "p_promo_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_ps_booking_atomic"("p_reservation_id" "text", "p_room_id" "text", "p_room_name" "text", "p_customer_name" "text", "p_customer_phone" "text", "p_booking_date" "date", "p_start_datetime" timestamp with time zone, "p_duration_hours" numeric, "p_payment_method" "text", "p_snacks" "jsonb", "p_notes" "text", "p_promo_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "postgres";
GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "anon";
GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "service_role";



REVOKE ALL ON FUNCTION "public"."extend_booking_atomic"("p_booking_id" "uuid", "p_target_updates" "jsonb", "p_shifts" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."extend_booking_atomic"("p_booking_id" "uuid", "p_target_updates" "jsonb", "p_shifts" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."extend_booking_atomic"("p_booking_id" "uuid", "p_target_updates" "jsonb", "p_shifts" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "postgres";
GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "anon";
GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "service_role";



GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_booking_by_reservation_id"("p_reservation_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_booking_by_reservation_id"("p_reservation_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_booking_by_reservation_id"("p_reservation_id" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_booking_metrics_v2"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_booking_metrics_v2"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_booking_metrics_v2"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_order_metrics_v2"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_order_metrics_v2"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_order_metrics_v2"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_room_occupied_intervals"("p_room_id" "text", "p_business_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_room_occupied_intervals"("p_room_id" "text", "p_business_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_room_occupied_intervals"("p_room_id" "text", "p_business_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_room_occupied_intervals"("p_room_id" "text", "p_business_date" "date", "p_window_start" timestamp with time zone, "p_window_end" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_room_occupied_intervals"("p_room_id" "text", "p_business_date" "date", "p_window_start" timestamp with time zone, "p_window_end" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_room_occupied_intervals"("p_room_id" "text", "p_business_date" "date", "p_window_start" timestamp with time zone, "p_window_end" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "postgres";
GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "service_role";



GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "postgres";
GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "postgres";
GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "anon";
GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "authenticated";
GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "service_role";



GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "postgres";
GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "anon";
GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "service_role";


















GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."gaming_stations" TO "anon";
GRANT ALL ON TABLE "public"."gaming_stations" TO "authenticated";
GRANT ALL ON TABLE "public"."gaming_stations" TO "service_role";



GRANT ALL ON TABLE "public"."offers" TO "anon";
GRANT ALL ON TABLE "public"."offers" TO "authenticated";
GRANT ALL ON TABLE "public"."offers" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."staff_users" TO "anon";
GRANT ALL ON TABLE "public"."staff_users" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_users" TO "service_role";



GRANT ALL ON TABLE "public"."station_sessions" TO "anon";
GRANT ALL ON TABLE "public"."station_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."station_sessions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";

CREATE OR REPLACE FUNCTION "public"."get_unified_revenue_metrics"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_ps_all_time NUMERIC;
  v_ps_today NUMERIC;
  v_ps_count INT;
  v_cafe_all_time NUMERIC;
  v_cafe_today NUMERIC;
  v_cafe_count INT;
  v_today_date DATE := CURRENT_DATE;
BEGIN
  IF public.is_staff() IS NOT TRUE THEN
    RAISE EXCEPTION 'غير مصرح لك بالاطلاع على الإحصائيات' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(SUM(total_amount), 0), COUNT(*)
  INTO v_ps_all_time, v_ps_count
  FROM public.ps_bookings
  WHERE status IN ('confirmed', 'completed');

  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_ps_today
  FROM public.ps_bookings
  WHERE status IN ('confirmed', 'completed')
    AND (booking_date = v_today_date OR start_datetime::DATE = v_today_date);

  SELECT COALESCE(SUM(total_amount), 0), COUNT(*)
  INTO v_cafe_all_time, v_cafe_count
  FROM public.orders
  WHERE status = 'completed';

  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_cafe_today
  FROM public.orders
  WHERE status = 'completed'
    AND created_at::DATE = v_today_date;

  RETURN jsonb_build_object(
    'total_all_time', (v_ps_all_time + v_cafe_all_time),
    'total_today', (v_ps_today + v_cafe_today),
    'ps_all_time', v_ps_all_time,
    'ps_today', v_ps_today,
    'ps_count', v_ps_count,
    'cafe_all_time', v_cafe_all_time,
    'cafe_today', v_cafe_today,
    'cafe_count', v_cafe_count
  );
END;
$$;

REVOKE ALL ON FUNCTION "public"."get_unified_revenue_metrics"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."get_unified_revenue_metrics"() FROM "anon";
GRANT ALL ON FUNCTION "public"."get_unified_revenue_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unified_revenue_metrics"() TO "service_role";




































