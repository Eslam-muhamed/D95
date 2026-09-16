-- 1. Add booking_id column to loyalty_transactions
ALTER TABLE loyalty_transactions ADD COLUMN IF NOT EXISTS booking_id TEXT;

-- 2. Update the trigger function to use booking_id
CREATE OR REPLACE FUNCTION process_booking_loyalty() RETURNS trigger AS $$
DECLARE
    v_customer_id UUID;
    v_points_rate NUMERIC;
    v_earned_points INTEGER;
    v_existing_earn_id UUID;
    v_customer_phone TEXT;
BEGIN
    -- Only act if status changed
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    -- Clean the phone number
    v_customer_phone := NULLIF(NEW.customer_phone, '');

    -- If booking is Confirmed or Completed, give points (if not already given)
    IF NEW.status IN ('confirmed', 'completed') AND v_customer_phone IS NOT NULL THEN
        -- Check if points already awarded for this booking
        SELECT id INTO v_existing_earn_id FROM loyalty_transactions WHERE booking_id = NEW.id::TEXT AND type = 'EARN';
        
        IF v_existing_earn_id IS NULL THEN
            -- Get or create customer
            SELECT id INTO v_customer_id FROM customers WHERE phone_number = v_customer_phone;
            
            IF v_customer_id IS NULL THEN
                INSERT INTO customers (phone_number, full_name) 
                VALUES (v_customer_phone, NEW.customer_name)
                RETURNING id INTO v_customer_id;
            END IF;

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

    -- If cancelled after being confirmed/completed, refund points
    ELSIF NEW.status = 'cancelled' AND OLD.status IN ('confirmed', 'completed') AND v_customer_phone IS NOT NULL THEN
        -- Check if points were awarded
        SELECT id, customer_id, points INTO v_existing_earn_id, v_customer_id, v_earned_points 
        FROM loyalty_transactions WHERE booking_id = NEW.id::TEXT AND type = 'EARN' LIMIT 1;
        
        IF v_existing_earn_id IS NOT NULL THEN
            -- Check if REFUND already exists
            IF NOT EXISTS (SELECT 1 FROM loyalty_transactions WHERE booking_id = NEW.id::TEXT AND type = 'REFUND') THEN
                INSERT INTO loyalty_transactions (customer_id, booking_id, points, type, description)
                VALUES (v_customer_id, NEW.id::TEXT, -v_earned_points, 'REFUND', 'استرجاع نقاط بسبب إلغاء حجز ' || COALESCE(NEW.room_name, 'غرفة'));
                UPDATE customers SET loyalty_points_balance = loyalty_points_balance - v_earned_points WHERE id = v_customer_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
