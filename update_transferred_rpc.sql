CREATE OR REPLACE FUNCTION public.confirm_payment_transfer(p_reservation_id text, p_payment_transferred boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ps_bookings
  SET payment_transferred = p_payment_transferred
  WHERE reservation_id = UPPER(TRIM(p_reservation_id))
    AND status = 'pending';
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_payment_transfer(text, boolean) TO anon, authenticated;
