-- Migration: 20260919132000_tournament_public_participants.sql
-- Description: Create a secure function to fetch public participant details without exposing phone numbers

CREATE OR REPLACE FUNCTION get_tournament_public_participants(p_tournament_id UUID)
RETURNS TABLE (id UUID, player_name TEXT, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT t.id, t.player_name, t.status 
    FROM public.tournament_participants t 
    WHERE t.tournament_id = p_tournament_id;
END;
$$;
