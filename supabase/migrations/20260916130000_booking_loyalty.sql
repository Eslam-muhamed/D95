-- Trigger to add loyalty points for PlayStation/Room Bookings

CREATE OR REPLACE FUNCTION process_booking_loyalty() RETURNS trigger AS $$
DECLARE
    v_customer_id UUID;
    v_points_rate NUMERIC;
    v_earned_points INTEGER;
    v_existing_earn_id UUID;
    v_customer_phone TEXT;
BEGIN
    -- Only act if status changed to 'completed' or 'cancelled'
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    -- Clean the phone number (remove non-digits, etc if necessary, but assume it's clean enough)
    v_customer_phone := NULLIF(NEW.customer_phone, '');

    IF NEW.status = 'completed' AND v_customer_phone IS NOT NULL THEN
        -- Check if points already awarded for this booking
        -- We'll use the description to distinguish booking from cafe order if needed, but the order_id field is UUID.
        -- Wait, ps_bookings id is UUID, orders id is UUID. We can just use the same order_id column for now.
        -- But to be safe, let's prefix the description and check if a transaction exists for this booking ID.
        SELECT id INTO v_existing_earn_id FROM loyalty_transactions WHERE order_id = NEW.id AND type = 'EARN';
        
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
                INSERT INTO loyalty_transactions (customer_id, order_id, points, type, description)
                VALUES (v_customer_id, NEW.id, v_earned_points, 'EARN', 'نقاط مكتسبة من حجز ' || NEW.room_name);
                
                -- Update balance
                UPDATE customers SET loyalty_points_balance = loyalty_points_balance + v_earned_points WHERE id = v_customer_id;
            END IF;
        END IF;

    ELSIF NEW.status = 'cancelled' AND OLD.status = 'completed' AND v_customer_phone IS NOT NULL THEN
        -- Check if points were awarded
        SELECT id, customer_id, points INTO v_existing_earn_id, v_customer_id, v_earned_points 
        FROM loyalty_transactions 
        WHERE order_id = NEW.id AND type = 'EARN' LIMIT 1;
        
        IF v_existing_earn_id IS NOT NULL THEN
            -- Check if REFUND already exists for this order
            IF NOT EXISTS (SELECT 1 FROM loyalty_transactions WHERE order_id = NEW.id AND type = 'REFUND') THEN
                -- Insert refund transaction (negative points)
                INSERT INTO loyalty_transactions (customer_id, order_id, points, type, description)
                VALUES (v_customer_id, NEW.id, -v_earned_points, 'REFUND', 'استرجاع نقاط بسبب إلغاء حجز ' || NEW.room_name);
                
                -- Update balance
                UPDATE customers SET loyalty_points_balance = loyalty_points_balance - v_earned_points WHERE id = v_customer_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Drop trigger if exists to recreate
DROP TRIGGER IF EXISTS on_booking_status_completed_or_cancelled ON ps_bookings;

CREATE TRIGGER on_booking_status_completed_or_cancelled
    AFTER UPDATE OF status ON ps_bookings
    FOR EACH ROW
    EXECUTE FUNCTION process_booking_loyalty();
