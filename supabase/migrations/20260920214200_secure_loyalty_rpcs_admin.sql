-- Migration: 20260920214200_secure_loyalty_rpcs_admin.sql
-- Description: Hardens admin_adjust_points and get_customer_loyalty_info RPCs against unauthorized execution. 
-- Restricts them to authenticated Admin users only and sets secure search_path.

-- 1. Secure admin_adjust_points
CREATE OR REPLACE FUNCTION public.admin_adjust_points(p_customer_id UUID, p_points INTEGER, p_reason TEXT)
RETURNS void AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can adjust loyalty points' USING ERRCODE = '42501';
    END IF;

    IF p_points = 0 THEN
        RAISE EXCEPTION 'Points must be non-zero';
    END IF;
    
    INSERT INTO public.loyalty_transactions (customer_id, points, type, description)
    VALUES (p_customer_id, p_points, 'ADJUSTMENT', p_reason);
    
    UPDATE public.customers SET loyalty_points_balance = loyalty_points_balance + p_points WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.admin_adjust_points(UUID, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_adjust_points(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_points(UUID, INTEGER, TEXT) TO service_role;

-- 2. Secure get_customer_loyalty_info
CREATE OR REPLACE FUNCTION public.get_customer_loyalty_info(p_phone TEXT)
RETURNS json AS $$
DECLARE
    v_customer RECORD;
    v_history JSON;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can lookup customer loyalty info' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_customer FROM public.customers WHERE phone_number = p_phone;
    
    IF v_customer.id IS NULL THEN
        RETURN json_build_object('exists', false);
    END IF;
    
    SELECT json_agg(row_to_json(t)) INTO v_history
    FROM (
        SELECT points, type, description, created_at, order_id
        FROM public.loyalty_transactions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_customer_loyalty_info(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_customer_loyalty_info(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_loyalty_info(TEXT) TO service_role;
