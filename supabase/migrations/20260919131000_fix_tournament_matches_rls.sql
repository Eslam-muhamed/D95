-- Migration: 20260919131000_fix_tournament_matches_rls.sql
-- Description: Fix RLS policies for tournament matches to match staff_users by email

DROP POLICY IF EXISTS "Allow staff write tournament_matches" ON public.tournament_matches;

CREATE POLICY "Allow staff write tournament_matches" 
ON public.tournament_matches TO "authenticated" 
USING (EXISTS (SELECT 1 FROM public.staff_users WHERE email = auth.jwt()->>'email'))
WITH CHECK (EXISTS (SELECT 1 FROM public.staff_users WHERE email = auth.jwt()->>'email'));
