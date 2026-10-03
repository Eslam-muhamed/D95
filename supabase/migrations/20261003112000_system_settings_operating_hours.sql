-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to system_settings"
    ON public.system_settings FOR SELECT
    USING (true);

CREATE POLICY "Allow staff to update system_settings"
    ON public.system_settings FOR UPDATE
    USING (public.is_staff());

CREATE POLICY "Allow staff to insert system_settings"
    ON public.system_settings FOR INSERT
    WITH CHECK (public.is_staff());

-- Insert default operating hours
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES ('operating_hours', '{"start_hour": 8, "closing_hour": 4}')
ON CONFLICT (setting_key) DO NOTHING;

-- Update get_booking_metrics_v2 to use dynamic closing_hour
CREATE OR REPLACE FUNCTION "public"."get_booking_metrics_v2"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_cairo_today DATE;
  v_total_count INT := 0;
  v_pending_count INT := 0;
  v_confirmed_count INT := 0;
  v_today_count INT := 0;
  v_total_revenue NUMERIC := 0.00;
  v_today_revenue NUMERIC := 0.00;
  v_recent_pending JSONB := '[]'::jsonb;
  v_pending_counts_by_date JSONB := '{}'::jsonb;
  v_closing_hour INT;
BEGIN
  -- Verify staff authorization
  IF NOT EXISTS (SELECT 1 FROM public.staff_users WHERE email = coalesce(auth.jwt() ->> 'email', '')) THEN
    RAISE EXCEPTION 'غير مصرح لك بالاطلاع على الإحصائيات' USING ERRCODE = '42501';
  END IF;

  -- Run automatic cleanup of expired pending bookings
  PERFORM public.auto_cancel_expired_pending_bookings();

  -- Get dynamic closing hour
  SELECT COALESCE((setting_value->>'closing_hour')::INT, 4) INTO v_closing_hour
  FROM public.system_settings WHERE setting_key = 'operating_hours';

  v_cairo_today := ((now() AT TIME ZONE 'Africa/Cairo') - (v_closing_hour || ' hours')::interval)::DATE;

  SELECT count(*) INTO v_total_count
  FROM public.ps_bookings
  WHERE status != 'cancelled';

  SELECT count(*) INTO v_pending_count
  FROM public.ps_bookings
  WHERE status = 'pending'
    AND end_datetime > now();

  SELECT count(*) INTO v_confirmed_count
  FROM public.ps_bookings
  WHERE status = 'confirmed';

  SELECT count(*) INTO v_today_count
  FROM public.ps_bookings
  WHERE booking_date = v_cairo_today;

  SELECT COALESCE(sum(total_amount), 0.00) INTO v_total_revenue
  FROM public.ps_bookings
  WHERE status = 'confirmed';

  SELECT COALESCE(sum(total_amount), 0.00) INTO v_today_revenue
  FROM public.ps_bookings
  WHERE booking_date = v_cairo_today
    AND status = 'confirmed';

  SELECT COALESCE(jsonb_agg(row_to_json(b)), '[]'::jsonb) INTO v_recent_pending
  FROM (
    SELECT * FROM public.ps_bookings
    WHERE status = 'pending'
      AND end_datetime > now()
    ORDER BY created_at DESC
    LIMIT 50
  ) b;

  SELECT COALESCE(jsonb_object_agg(booking_date::text, cnt), '{}'::jsonb) INTO v_pending_counts_by_date
  FROM (
    SELECT booking_date, count(*) as cnt
    FROM public.ps_bookings
    WHERE status = 'pending'
      AND end_datetime > now()
    GROUP BY booking_date
  ) p;

  RETURN jsonb_build_object(
    'totalCount', v_total_count,
    'pendingCount', v_pending_count,
    'confirmedCount', v_confirmed_count,
    'todayCount', v_today_count,
    'totalRevenue', v_total_revenue,
    'todayRevenue', v_today_revenue,
    'recentPending', v_recent_pending,
    'pendingCountsByDate', v_pending_counts_by_date
  );
END;
$$;

-- Update get_unified_revenue_metrics to use dynamic closing_hour
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
  v_closing_hour INT;
  v_today_date DATE;
BEGIN
  -- 1. Security Check: Staff verification
  IF public.is_staff() IS NOT TRUE THEN
    RAISE EXCEPTION 'غير مصرح لك بالاطلاع على الإحصائيات' USING ERRCODE = '42501';
  END IF;

  -- Get dynamic closing hour
  SELECT COALESCE((setting_value->>'closing_hour')::INT, 4) INTO v_closing_hour
  FROM public.system_settings WHERE setting_key = 'operating_hours';

  v_today_date := ((now() AT TIME ZONE 'Africa/Cairo') - (v_closing_hour || ' hours')::interval)::DATE;

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
    AND ((created_at AT TIME ZONE 'Africa/Cairo') - (v_closing_hour || ' hours')::interval)::DATE = v_today_date;

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
