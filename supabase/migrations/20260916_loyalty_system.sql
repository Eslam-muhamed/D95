-- 20260916_loyalty_system.sql
-- Create Loyalty System Tables and Functions

-- 1. Customers Table (if not exists)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT UNIQUE NOT NULL,
    full_name TEXT,
    loyalty_points_balance INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can do everything on customers" ON customers;
CREATE POLICY "Admins can do everything on customers" ON customers FOR ALL TO authenticated USING (auth.jwt()->>'email' IN ('admin@d95.com', 'cashier@d95.com'));

-- 2. Loyalty Transactions
DO $$ BEGIN
    CREATE TYPE loyalty_transaction_type AS ENUM ('EARN', 'REDEEM', 'ADJUSTMENT', 'REFUND');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    points INTEGER NOT NULL,
    type loyalty_transaction_type NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
-- RLS
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can do everything on loyalty_transactions" ON loyalty_transactions;
CREATE POLICY "Admins can do everything on loyalty_transactions" ON loyalty_transactions FOR ALL TO authenticated USING (auth.jwt()->>'email' IN ('admin@d95.com', 'cashier@d95.com'));

-- 3. Loyalty Settings
CREATE TABLE IF NOT EXISTS loyalty_settings (
    key TEXT PRIMARY KEY,
    value NUMERIC NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO loyalty_settings (key, value) VALUES ('points_per_egp', 1) ON CONFLICT (key) DO NOTHING;

-- RLS
-- RLS
ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read loyalty_settings" ON loyalty_settings;
CREATE POLICY "Public can read loyalty_settings" ON loyalty_settings FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins can update loyalty_settings" ON loyalty_settings;
CREATE POLICY "Admins can update loyalty_settings" ON loyalty_settings FOR ALL TO authenticated USING (auth.jwt()->>'email' IN ('admin@d95.com', 'cashier@d95.com'));

-- 4. Order Trigger Logic
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

    IF NEW.status = 'completed' AND NEW.customer_phone IS NOT NULL AND NEW.customer_phone != '' THEN
        -- Check if points already awarded for this order
        SELECT id INTO v_existing_earn_id FROM loyalty_transactions WHERE order_id = NEW.id AND type = 'EARN';
        
        IF v_existing_earn_id IS NULL THEN
            -- Get or create customer
            SELECT id INTO v_customer_id FROM customers WHERE phone_number = NEW.customer_phone;
            
            IF v_customer_id IS NULL THEN
                INSERT INTO customers (phone_number, full_name) 
                VALUES (NEW.customer_phone, NEW.customer_name)
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
                VALUES (v_customer_id, NEW.id, v_earned_points, 'EARN', 'نقاط مكتسبة من طلب #' || NEW.order_number);
                
                -- Update balance
                UPDATE customers SET loyalty_points_balance = loyalty_points_balance + v_earned_points WHERE id = v_customer_id;
            END IF;
        END IF;

    ELSIF NEW.status = 'cancelled' AND OLD.status = 'completed' AND NEW.customer_phone IS NOT NULL THEN
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

-- Drop trigger if exists to recreate
DROP TRIGGER IF EXISTS on_order_status_completed_or_cancelled ON orders;

CREATE TRIGGER on_order_status_completed_or_cancelled
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION process_order_loyalty();

-- 5. Admin Manual Adjust RPC
CREATE OR REPLACE FUNCTION admin_adjust_points(p_customer_id UUID, p_points INTEGER, p_reason TEXT)
RETURNS void AS $$
BEGIN
    IF p_points = 0 THEN
        RAISE EXCEPTION 'Points must be non-zero';
    END IF;
    
    INSERT INTO loyalty_transactions (customer_id, points, type, description)
    VALUES (p_customer_id, p_points, 'ADJUSTMENT', p_reason);
    
    UPDATE customers SET loyalty_points_balance = loyalty_points_balance + p_points WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Customer Lookup RPC
CREATE OR REPLACE FUNCTION get_customer_loyalty_info(p_phone TEXT)
RETURNS json AS $$
DECLARE
    v_customer RECORD;
    v_history JSON;
BEGIN
    SELECT * INTO v_customer FROM customers WHERE phone_number = p_phone;
    
    IF v_customer.id IS NULL THEN
        RETURN json_build_object('exists', false);
    END IF;
    
    SELECT json_agg(row_to_json(t)) INTO v_history
    FROM (
        SELECT points, type, description, created_at, order_id
        FROM loyalty_transactions
        WHERE customer_id = v_customer.id
        ORDER BY created_at DESC
        LIMIT 50
    ) t;
    
    RETURN json_build_object(
        'exists', true,
        'customer', row_to_json(v_customer),
        'history', COALESCE(v_history, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
