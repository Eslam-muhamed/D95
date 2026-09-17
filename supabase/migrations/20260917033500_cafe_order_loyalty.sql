CREATE OR REPLACE FUNCTION process_order_loyalty() RETURNS trigger AS $$
DECLARE
    v_customer_id UUID;
    v_points_rate NUMERIC;
    v_earned_points INTEGER;
    v_existing_earn_id UUID;
    v_phone TEXT;
BEGIN
    -- Only act if status changed to 'completed' or 'cancelled'
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'completed' THEN
        -- Check if points already awarded for this order
        SELECT id INTO v_existing_earn_id FROM loyalty_transactions WHERE order_id = NEW.id AND type = 'EARN';
        
        IF v_existing_earn_id IS NULL THEN
            -- 1. Try finding customer by user_id
            IF NEW.user_id IS NOT NULL THEN
                SELECT id INTO v_customer_id FROM customers WHERE auth_user_id = NEW.user_id;
            END IF;

            -- 2. Clean phone number if present
            v_phone := NULLIF(TRIM(NEW.customer_phone), '');

            -- 3. If customer_id still not found, try by phone
            IF v_customer_id IS NULL AND v_phone IS NOT NULL THEN
                SELECT id INTO v_customer_id FROM customers WHERE phone_number = v_phone;
                
                -- If not found by phone, create a new customer record
                IF v_customer_id IS NULL THEN
                    INSERT INTO customers (phone_number, full_name) 
                    VALUES (v_phone, NEW.customer_name)
                    RETURNING id INTO v_customer_id;
                END IF;
            END IF;

            -- 4. If we successfully found or created a customer, proceed to award points
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

    ELSIF NEW.status = 'cancelled' AND OLD.status = 'completed' THEN
        -- Check if points were awarded
        SELECT id, customer_id, points INTO v_existing_earn_id, v_customer_id, v_earned_points 
        FROM loyalty_transactions WHERE order_id = NEW.id AND type = 'EARN' LIMIT 1;
        
        IF v_existing_earn_id IS NOT NULL THEN
            -- Check if REFUND already exists
            IF NOT EXISTS (SELECT 1 FROM loyalty_transactions WHERE order_id = NEW.id AND type = 'REFUND') THEN
                INSERT INTO loyalty_transactions (customer_id, order_id, points, type, description)
                VALUES (v_customer_id, NEW.id, -v_earned_points, 'REFUND', 'استرجاع نقاط بسبب إلغاء طلب #' || COALESCE(NEW.order_number, 'كافيه'));
                UPDATE customers SET loyalty_points_balance = loyalty_points_balance - v_earned_points WHERE id = v_customer_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
