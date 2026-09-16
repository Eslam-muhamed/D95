-- 1. Enable RLS on Orders and Add Staff Policies
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;

-- Ensure customers can still view their orders
DROP POLICY IF EXISTS "Customers can view their own orders" ON "public"."orders";
CREATE POLICY "Customers can view their own orders" ON "public"."orders"
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Staff can do everything on orders
DROP POLICY IF EXISTS "Staff can manage orders" ON "public"."orders";
CREATE POLICY "Staff can manage orders" ON "public"."orders"
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "public"."staff_users"
            WHERE email = auth.jwt()->>'email'
        )
    );

-- 2. Fix Hardcoded Admin Emails in Loyalty and Customers
DROP POLICY IF EXISTS "Admins can do everything on customers" ON "public"."customers";
CREATE POLICY "Admins can do everything on customers" ON "public"."customers"
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "public"."staff_users"
            WHERE email = auth.jwt()->>'email'
        )
    );

DROP POLICY IF EXISTS "Admins can do everything on loyalty_transactions" ON "public"."loyalty_transactions";
CREATE POLICY "Admins can do everything on loyalty_transactions" ON "public"."loyalty_transactions"
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "public"."staff_users"
            WHERE email = auth.jwt()->>'email'
        )
    );

DROP POLICY IF EXISTS "Admins can update loyalty_settings" ON "public"."loyalty_settings";
CREATE POLICY "Admins can update loyalty_settings" ON "public"."loyalty_settings"
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "public"."staff_users"
            WHERE email = auth.jwt()->>'email'
        )
    );

-- 3. Fix Overly Permissive staff_users Policy
DROP POLICY IF EXISTS "Allow authenticated read staff_users" ON "public"."staff_users";

-- Staff can read their OWN row
CREATE POLICY "Staff can read their own row" ON "public"."staff_users"
    FOR SELECT TO authenticated
    USING (email = auth.jwt()->>'email');

-- Admins can read ALL rows
CREATE POLICY "Admins can read all staff rows" ON "public"."staff_users"
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "public"."staff_users" su
            WHERE su.email = auth.jwt()->>'email' AND su.role = 'admin'
        )
    );
