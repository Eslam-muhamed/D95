-- Migration: 20260917051500_optimize_loyalty_and_bookings_rls.sql
-- Description: Add missing performance indexes and customer RLS policy on ps_bookings

-- 1. Create missing performance indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer_id ON public.loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_order_id ON public.loyalty_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_ps_bookings_user_id ON public.ps_bookings(user_id);

-- 2. Add customer RLS policy on ps_bookings
DROP POLICY IF EXISTS "Customers can view their own bookings" ON public.ps_bookings;
CREATE POLICY "Customers can view their own bookings" 
ON public.ps_bookings 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);
