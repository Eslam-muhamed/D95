-- Migration: 20260916180000_secure_order_booking_inserts.sql
-- Description: Prevent direct public inserts on orders and ps_bookings. Force usage of RPCs.

-- 1. Drop the insecure public insert policies
DROP POLICY IF EXISTS "Allow public insert orders" ON "public"."orders";
DROP POLICY IF EXISTS "Allow public insert bookings" ON "public"."ps_bookings";

-- 2. Add secure policies for staff members who might need to insert manually from dashboard
CREATE POLICY "Staff can insert orders directly" ON "public"."orders" 
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.staff_users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Staff can insert bookings directly" ON "public"."ps_bookings" 
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.staff_users WHERE email = auth.jwt()->>'email'));
