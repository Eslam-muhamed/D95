-- Migration: 20260919120000_fix_tournaments_rls.sql
-- Description: Fix RLS policies to match staff_users by email

DROP POLICY IF EXISTS "Allow staff write tournaments" ON public.tournaments;
CREATE POLICY "Allow staff write tournaments" 
ON public.tournaments TO "authenticated" 
USING (EXISTS (SELECT 1 FROM public.staff_users WHERE email = auth.jwt()->>'email'))
WITH CHECK (EXISTS (SELECT 1 FROM public.staff_users WHERE email = auth.jwt()->>'email'));

DROP POLICY IF EXISTS "Allow staff access participants" ON public.tournament_participants;
CREATE POLICY "Allow staff access participants" 
ON public.tournament_participants TO "authenticated" 
USING (EXISTS (SELECT 1 FROM public.staff_users WHERE email = auth.jwt()->>'email'));
