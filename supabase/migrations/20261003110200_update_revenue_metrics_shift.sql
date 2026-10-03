-- Update get_unified_revenue_metrics to use Shift Logic (Business Day)
CREATE OR REPLACE FUNCTION public.get_unified_revenue_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_ps_all_time NUMERIC;
  v_ps_today NUMERIC;
  v_ps_count INT;
  v_cafe_all_time NUMERIC;
  v_cafe_today NUMERIC;
  v_cafe_count INT;
  -- Business day ends at 4:00 AM. Rollback 4 hours to align dates.
  v_today_date DATE := ((now() AT TIME ZONE 'Africa/Cairo') - interval '4 hours')::DATE;
BEGIN
  -- 1. Security Check: Staff verification
  IF public.is_staff() IS NOT TRUE THEN
    RAISE EXCEPTION 'غير مصرح لك بالاطلاع على الإحصائيات' USING ERRCODE = '42501';
  END IF;

  -- 2. PlayStation Revenue (confirmed or completed)
  SELECT 
    COALESCE(SUM(total_amount), 0),
    COUNT(*)
  INTO v_ps_all_time, v_ps_count
  FROM public.ps_bookings
  WHERE status IN ('confirmed', 'completed');

  SELECT 
    COALESCE(SUM(total_amount), 0)
  INTO v_ps_today
  FROM public.ps_bookings
  WHERE status IN ('confirmed', 'completed')
    AND booking_date = v_today_date;

  -- 3. Cafe Revenue (completed)
  SELECT 
    COALESCE(SUM(total_amount), 0),
    COUNT(*)
  INTO v_cafe_all_time, v_cafe_count
  FROM public.orders
  WHERE status = 'completed';

  SELECT 
    COALESCE(SUM(total_amount), 0)
  INTO v_cafe_today
  FROM public.orders
  WHERE status = 'completed'
    AND ((created_at AT TIME ZONE 'Africa/Cairo') - interval '4 hours')::DATE = v_today_date;

  RETURN jsonb_build_object(
    'total_all_time', (v_ps_all_time + v_cafe_all_time),
    'total_today', (v_ps_today + v_cafe_today),
    'ps_all_time', v_ps_all_time,
    'ps_today', v_ps_today,
    'ps_count', v_ps_count,
    'cafe_all_time', v_cafe_all_time,
    'cafe_today', v_cafe_today,
    'cafe_count', v_cafe_count
  );
END;
$$;
