-- Migration: 20260917053500_harden_security_and_dos_protection.sql
-- Description: Server-authoritative user identification, DoS / Slot exhaustion protection, and product availability checks

-- 1. Update create_booking_atomic with Anti-Spoofing, Anti-Hoarding, and Product Availability
CREATE OR REPLACE FUNCTION public.create_booking_atomic(p_booking jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
  v_user_id UUID;
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
  
  -- Anti-Spoofing: Authoritative user verification
  IF public.is_staff() IS TRUE THEN
    IF p_booking->>'user_id' IS NOT NULL AND p_booking->>'user_id' != '' THEN
      v_user_id := (p_booking->>'user_id')::UUID;
    ELSE
      v_user_id := auth.uid();
    END IF;
  ELSE
    v_user_id := auth.uid();
  END IF;

  -- 2. Basic validations
  IF v_customer_name IS NULL OR length(v_customer_name) < 2 THEN
    RAISE EXCEPTION 'اسم العميل مطلوب ولا يقل عن حرفين' USING ERRCODE = '22023';
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

  -- Anti-Hoarding / Slot Exhaustion Protection:
  -- Limit concurrent pending holds to max 1 active hold per customer phone or account
  IF public.is_staff() IS NOT TRUE THEN
    IF v_user_id IS NOT NULL THEN
      IF EXISTS (
        SELECT 1 FROM public.ps_bookings 
        WHERE user_id = v_user_id 
          AND status = 'pending' 
          AND created_at > (now() - (v_hold_minutes || ' minutes')::INTERVAL)
      ) THEN
        RAISE EXCEPTION 'لديك حجز معلق بالفعل قيد المراجعة. يرجى انتظار اعتماده أو انتهاء صلاحيته قبل عمل حجز جديد.' USING ERRCODE = '23P01';
      END IF;
    END IF;

    IF v_customer_phone IS NOT NULL AND v_customer_phone != '' THEN
      IF EXISTS (
        SELECT 1 FROM public.ps_bookings 
        WHERE customer_phone = v_customer_phone 
          AND status = 'pending' 
          AND created_at > (now() - (v_hold_minutes || ' minutes')::INTERVAL)
      ) THEN
        RAISE EXCEPTION 'لديك حجز معلق بالفعل قيد المراجعة بنفس رقم الهاتف. يرجى انتظار اعتماده أو انتهاء صلاحيته.' USING ERRCODE = '23P01';
      END IF;
    END IF;
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

  -- Snacks recalculation from database with availability verification
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
        WHERE (id::text = v_snack_item.id OR slug = v_snack_item.id)
          AND COALESCE(is_available, true) IS TRUE
        LIMIT 1;
      END IF;

      IF v_db_price IS NULL THEN
        RAISE EXCEPTION 'أحد الأصناف المختارة غير متوفر حالياً في الكافيه' USING ERRCODE = '22023';
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
    notes,
    user_id
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
    v_notes,
    v_user_id
  )
  RETURNING * INTO v_new_booking;

  RETURN row_to_json(v_new_booking)::jsonb;
END;
$function$;


-- 2. Update create_order_atomic with Anti-Spoofing, Flood Protection, and Product Availability
CREATE OR REPLACE FUNCTION public.create_order_atomic(p_order jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  v_user_id UUID;
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
  
  -- Anti-Spoofing: Authoritative user verification
  IF public.is_staff() IS TRUE THEN
    IF p_order->>'user_id' IS NOT NULL AND p_order->>'user_id' != '' THEN
      v_user_id := (p_order->>'user_id')::UUID;
    ELSE
      v_user_id := auth.uid();
    END IF;
  ELSE
    v_user_id := auth.uid();
  END IF;

  -- Anti-Spam / Flood Protection: limit pending orders from same customer
  IF public.is_staff() IS NOT TRUE AND v_user_id IS NOT NULL THEN
    IF (SELECT COUNT(*) FROM public.orders WHERE user_id = v_user_id AND status = 'pending' AND created_at > now() - INTERVAL '5 minutes') >= 5 THEN
      RAISE EXCEPTION 'لديك عدة طلبات قيد الانتظار حالياً. يرجى الانتظار حتى اعتمادها قبل إرسال طلب جديد.' USING ERRCODE = '23P01';
    END IF;
  END IF;

  IF jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'لا يمكن إنشاء طلب فارغ' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM public.orders WHERE order_number = v_order_number) THEN
    v_order_number := v_order_number || '-' || floor(random() * 900 + 100)::text;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) AS elem
  LOOP
    v_qty := GREATEST(1, COALESCE((v_item.value->>'quantity')::INT, 1));
    v_customization := COALESCE(v_item.value->'customization', '{}'::jsonb);
    v_extra_price := 0.00;

    IF (v_customization->>'extraShot')::BOOLEAN IS TRUE THEN
      v_extra_price := v_extra_price + 15.00;
    END IF;

    v_unit_price := NULL;
    IF (v_item.value->>'id') IS NOT NULL THEN
      SELECT price INTO v_product FROM public.products
      WHERE (id::text = (v_item.value->>'id') OR slug = (v_item.value->>'id'))
        AND COALESCE(is_available, true) IS TRUE
      LIMIT 1;

      IF FOUND THEN
        v_unit_price := v_product.price;
      END IF;
    END IF;

    IF v_unit_price IS NULL THEN
      RAISE EXCEPTION 'أحد الأصناف المطلوبة غير متوفر حالياً في الكافيه' USING ERRCODE = '22023';
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
    notes,
    user_id
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
    v_notes,
    v_user_id
  )
  RETURNING * INTO v_new_order;

  RETURN row_to_json(v_new_order)::jsonb;
END;
$function$;
