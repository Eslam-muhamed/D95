-- 1. Add user_id to ps_bookings
ALTER TABLE public.ps_bookings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Update create_booking_atomic to handle user_id
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
  
  IF p_booking->>'user_id' IS NOT NULL AND p_booking->>'user_id' != '' THEN
      v_user_id := (p_booking->>'user_id')::UUID;
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

-- 3. Update process_booking_loyalty to ONLY use user_id
CREATE OR REPLACE FUNCTION process_booking_loyalty() RETURNS trigger AS $$
DECLARE
    v_customer_id UUID;
    v_points_rate NUMERIC;
    v_earned_points INTEGER;
    v_existing_earn_id UUID;
BEGIN
    -- Only act if status changed
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    -- If booking is Confirmed or Completed, give points ONLY if user_id is present
    IF NEW.status IN ('confirmed', 'completed') AND NEW.user_id IS NOT NULL THEN
        -- Check if points already awarded for this booking
        SELECT id INTO v_existing_earn_id FROM loyalty_transactions WHERE booking_id = NEW.id::TEXT AND type = 'EARN';
        
        IF v_existing_earn_id IS NULL THEN
            -- Get customer by user_id
            SELECT id INTO v_customer_id FROM customers WHERE auth_user_id = NEW.user_id;
            
            IF v_customer_id IS NOT NULL THEN
                -- Update customer name if it was empty before but now exists
                IF NEW.customer_name IS NOT NULL AND NEW.customer_name != '' THEN
                    UPDATE customers SET full_name = NEW.customer_name WHERE id = v_customer_id AND (full_name IS NULL OR full_name = '');
                END IF;

                -- Get points rate
                SELECT value INTO v_points_rate FROM loyalty_settings WHERE key = 'points_per_egp';
                v_points_rate := COALESCE(v_points_rate, 1);
                
                -- Calculate points
                v_earned_points := FLOOR(NEW.total_amount * v_points_rate);
                
                IF v_earned_points > 0 THEN
                    -- Insert transaction
                    INSERT INTO loyalty_transactions (customer_id, booking_id, points, type, description)
                    VALUES (v_customer_id, NEW.id::TEXT, v_earned_points, 'EARN', 'نقاط مكتسبة من حجز ' || COALESCE(NEW.room_name, 'غرفة'));
                    
                    -- Update balance
                    UPDATE customers SET loyalty_points_balance = loyalty_points_balance + v_earned_points WHERE id = v_customer_id;
                END IF;
            END IF;
        END IF;

    -- If cancelled after being confirmed/completed, refund points
    ELSIF NEW.status = 'cancelled' AND OLD.status IN ('confirmed', 'completed') AND NEW.user_id IS NOT NULL THEN
        SELECT id INTO v_customer_id FROM customers WHERE auth_user_id = NEW.user_id;
        
        IF v_customer_id IS NOT NULL THEN
            -- Check if points were awarded
            SELECT id, points INTO v_existing_earn_id, v_earned_points 
            FROM loyalty_transactions WHERE booking_id = NEW.id::TEXT AND type = 'EARN' AND customer_id = v_customer_id LIMIT 1;
            
            IF v_existing_earn_id IS NOT NULL THEN
                -- Check if REFUND already exists
                IF NOT EXISTS (SELECT 1 FROM loyalty_transactions WHERE booking_id = NEW.id::TEXT AND type = 'REFUND' AND customer_id = v_customer_id) THEN
                    INSERT INTO loyalty_transactions (customer_id, booking_id, points, type, description)
                    VALUES (v_customer_id, NEW.id::TEXT, -v_earned_points, 'REFUND', 'استرجاع نقاط بسبب إلغاء حجز ' || COALESCE(NEW.room_name, 'غرفة'));
                    UPDATE customers SET loyalty_points_balance = loyalty_points_balance - v_earned_points WHERE id = v_customer_id;
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update process_order_loyalty to ONLY use user_id
CREATE OR REPLACE FUNCTION process_order_loyalty() RETURNS trigger AS $$
DECLARE
    v_customer_id UUID;
    v_points_rate NUMERIC;
    v_earned_points INTEGER;
    v_existing_earn_id UUID;
BEGIN
    -- Only act if status changed to 'completed' or 'cancelled'
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'completed' AND NEW.user_id IS NOT NULL THEN
        -- Check if points already awarded for this order
        SELECT id INTO v_existing_earn_id FROM loyalty_transactions WHERE order_id = NEW.id AND type = 'EARN';
        
        IF v_existing_earn_id IS NULL THEN
            -- Find customer by user_id
            SELECT id INTO v_customer_id FROM customers WHERE auth_user_id = NEW.user_id;

            IF v_customer_id IS NOT NULL THEN
                -- Update customer name if it was empty before but now exists
                IF NEW.customer_name IS NOT NULL AND NEW.customer_name != '' THEN
                    UPDATE customers SET full_name = NEW.customer_name WHERE id = v_customer_id AND (full_name IS NULL OR full_name = '');
                END IF;

                -- Get points rate
                SELECT value INTO v_points_rate FROM loyalty_settings WHERE key = 'points_per_egp';
                v_points_rate := COALESCE(v_points_rate, 1);
                
                -- Calculate points
                v_earned_points := FLOOR(NEW.total_amount * v_points_rate);
                
                IF v_earned_points > 0 THEN
                    -- Insert transaction
                    INSERT INTO loyalty_transactions (customer_id, order_id, points, type, description)
                    VALUES (v_customer_id, NEW.id, v_earned_points, 'EARN', 'نقاط مكتسبة من طلب #' || COALESCE(NEW.order_number, 'كافيه'));
                    
                    -- Update balance
                    UPDATE customers SET loyalty_points_balance = loyalty_points_balance + v_earned_points WHERE id = v_customer_id;
                END IF;
            END IF;
        END IF;

    ELSIF NEW.status = 'cancelled' AND OLD.status = 'completed' AND NEW.user_id IS NOT NULL THEN
        SELECT id INTO v_customer_id FROM customers WHERE auth_user_id = NEW.user_id;

        IF v_customer_id IS NOT NULL THEN
            -- Check if points were awarded
            SELECT id, points INTO v_existing_earn_id, v_earned_points 
            FROM loyalty_transactions WHERE order_id = NEW.id AND type = 'EARN' AND customer_id = v_customer_id LIMIT 1;
            
            IF v_existing_earn_id IS NOT NULL THEN
                -- Check if REFUND already exists
                IF NOT EXISTS (SELECT 1 FROM loyalty_transactions WHERE order_id = NEW.id AND type = 'REFUND' AND customer_id = v_customer_id) THEN
                    INSERT INTO loyalty_transactions (customer_id, order_id, points, type, description)
                    VALUES (v_customer_id, NEW.id, -v_earned_points, 'REFUND', 'استرجاع نقاط بسبب إلغاء طلب #' || COALESCE(NEW.order_number, 'كافيه'));
                    UPDATE customers SET loyalty_points_balance = loyalty_points_balance - v_earned_points WHERE id = v_customer_id;
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
