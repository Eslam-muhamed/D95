-- 20260916_customer_auth_extension.sql

-- 1. Modify customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) UNIQUE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Make phone_number nullable for OAuth users
ALTER TABLE customers ALTER COLUMN phone_number DROP NOT NULL;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_phone_number_key;
DROP INDEX IF EXISTS customers_phone_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_number_idx ON customers (phone_number) WHERE phone_number IS NOT NULL;

-- Ensure a customer has either an auth_user_id or a phone_number (or both)
ALTER TABLE customers ADD CONSTRAINT customers_identity_chk CHECK (auth_user_id IS NOT NULL OR phone_number IS NOT NULL);

-- 2. Modify orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. Update the process_order_loyalty trigger to support user_id
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

    IF NEW.status = 'completed' AND (NEW.user_id IS NOT NULL OR (NEW.customer_phone IS NOT NULL AND NEW.customer_phone != '')) THEN
        -- Check if points already awarded for this order
        SELECT id INTO v_existing_earn_id FROM loyalty_transactions WHERE order_id = NEW.id AND type = 'EARN';
        
        IF v_existing_earn_id IS NULL THEN
            -- Get or create customer
            IF NEW.user_id IS NOT NULL THEN
                SELECT id INTO v_customer_id FROM customers WHERE auth_user_id = NEW.user_id;
                IF v_customer_id IS NULL THEN
                    INSERT INTO customers (auth_user_id, full_name, phone_number)
                    VALUES (NEW.user_id, NEW.customer_name, NULLIF(NEW.customer_phone, ''))
                    RETURNING id INTO v_customer_id;
                END IF;
            ELSE
                SELECT id INTO v_customer_id FROM customers WHERE phone_number = NEW.customer_phone;
                IF v_customer_id IS NULL THEN
                    INSERT INTO customers (phone_number, full_name) 
                    VALUES (NEW.customer_phone, NEW.customer_name)
                    RETURNING id INTO v_customer_id;
                END IF;
            END IF;

            -- Update customer name if it was empty before but now exists
            IF NEW.customer_name IS NOT NULL AND NEW.customer_name != '' THEN
                UPDATE customers SET full_name = NEW.customer_name WHERE id = v_customer_id AND (full_name IS NULL OR full_name = '');
            END IF;
            
            -- If user_id is NOT NULL but they ordered with a phone number, try to link it if the customer row doesn't have one
            IF NEW.user_id IS NOT NULL AND NEW.customer_phone IS NOT NULL AND NEW.customer_phone != '' THEN
                UPDATE customers SET phone_number = NEW.customer_phone WHERE id = v_customer_id AND phone_number IS NULL
                AND NOT EXISTS (SELECT 1 FROM customers WHERE phone_number = NEW.customer_phone AND id != v_customer_id);
            END IF;

            -- Get points rate
            SELECT value INTO v_points_rate FROM loyalty_settings WHERE key = 'points_per_egp';
            v_points_rate := COALESCE(v_points_rate, 1);
            
            -- Calculate points
            v_earned_points := FLOOR(NEW.total_amount * v_points_rate);
            
            IF v_earned_points > 0 THEN
                -- Insert transaction
                INSERT INTO loyalty_transactions (customer_id, order_id, points, type, description)
                VALUES (v_customer_id, NEW.id, v_earned_points, 'EARN', 'نقاط مكتسبة من طلب #' || NEW.order_number);
                
                -- Update balance
                UPDATE customers SET loyalty_points_balance = loyalty_points_balance + v_earned_points WHERE id = v_customer_id;
            END IF;
        END IF;

    ELSIF NEW.status = 'cancelled' AND OLD.status = 'completed' AND (NEW.user_id IS NOT NULL OR (NEW.customer_phone IS NOT NULL AND NEW.customer_phone != '')) THEN
        -- Check if points were awarded
        SELECT id, customer_id, points INTO v_existing_earn_id, v_customer_id, v_earned_points 
        FROM loyalty_transactions 
        WHERE order_id = NEW.id AND type = 'EARN' LIMIT 1;
        
        IF v_existing_earn_id IS NOT NULL THEN
            -- Check if REFUND already exists for this order
            IF NOT EXISTS (SELECT 1 FROM loyalty_transactions WHERE order_id = NEW.id AND type = 'REFUND') THEN
                -- Insert refund transaction (negative points)
                INSERT INTO loyalty_transactions (customer_id, order_id, points, type, description)
                VALUES (v_customer_id, NEW.id, -v_earned_points, 'REFUND', 'استرجاع نقاط بسبب إلغاء طلب #' || NEW.order_number);
                
                -- Update balance
                UPDATE customers SET loyalty_points_balance = loyalty_points_balance - v_earned_points WHERE id = v_customer_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Supabase Trigger to Auto-Create Customer on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.customers (auth_user_id, email, full_name)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'full_name'
    ) ON CONFLICT (auth_user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 5. RLS Policies
DROP POLICY IF EXISTS "Customers can view their own profile" ON customers;
CREATE POLICY "Customers can view their own profile" ON customers
    FOR SELECT TO authenticated USING (auth.uid() = auth_user_id);
    
DROP POLICY IF EXISTS "Customers can update their own profile" ON customers;
CREATE POLICY "Customers can update their own profile" ON customers
    FOR UPDATE TO authenticated USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Customers can view their own orders" ON orders;
CREATE POLICY "Customers can view their own orders" ON orders
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers can view their own transactions" ON loyalty_transactions;
CREATE POLICY "Customers can view their own transactions" ON loyalty_transactions
    FOR SELECT TO authenticated USING (customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()));

-- Link legacy accounts manually RPC
CREATE OR REPLACE FUNCTION link_phone_to_auth(p_phone TEXT)
RETURNS json AS $$
DECLARE
    v_existing_customer_id UUID;
    v_existing_auth UUID;
    v_current_auth UUID;
BEGIN
    v_current_auth := auth.uid();
    
    IF v_current_auth IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Look up if a customer exists with this phone
    SELECT id, auth_user_id INTO v_existing_customer_id, v_existing_auth 
    FROM customers WHERE phone_number = p_phone;
    
    IF v_existing_customer_id IS NOT NULL THEN
        IF v_existing_auth IS NOT NULL AND v_existing_auth != v_current_auth THEN
            RETURN json_build_object('success', false, 'message', 'هذا الرقم مربوط بحساب آخر بالفعل.');
        END IF;
        
        -- Link the phone to the currently authenticated customer record
        -- OR update the legacy customer record to have the auth_user_id
        
        -- To keep things simple, if the user was just created by `handle_new_user`, they have a separate record.
        -- We can delete the empty new record and update the old one with the auth_user_id, OR merge them.
        -- Let's just update the old one with auth_user_id, and if they already had a new one (created on signup), we delete the new one if it has no points.
        
        -- Delete the auto-created empty customer profile for this auth_user_id if it's different from the legacy one
        IF v_existing_customer_id != (SELECT id FROM customers WHERE auth_user_id = v_current_auth) THEN
             -- Only delete if it has 0 points
             DELETE FROM customers WHERE auth_user_id = v_current_auth AND loyalty_points_balance = 0;
             -- Set auth_user_id on legacy record
             UPDATE customers SET auth_user_id = v_current_auth WHERE id = v_existing_customer_id;
        END IF;
        
    ELSE
        -- Phone doesn't exist, just update current auth user's customer record with this phone
        UPDATE customers SET phone_number = p_phone WHERE auth_user_id = v_current_auth;
    END IF;

    RETURN json_build_object('success', true, 'message', 'تم ربط رقم الهاتف بنجاح!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
