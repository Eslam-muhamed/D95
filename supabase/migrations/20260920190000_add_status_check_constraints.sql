-- Migration: 20260920190000_add_status_check_constraints.sql
-- Description: Enforce exact string matches for status fields to prevent data corruption by authenticated updates.

ALTER TABLE public.ps_bookings 
  ADD CONSTRAINT check_ps_bookings_status 
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

ALTER TABLE public.orders 
  ADD CONSTRAINT check_orders_status 
  CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled'));

ALTER TABLE public.tournaments 
  ADD CONSTRAINT check_tournaments_status 
  CHECK (status IN ('upcoming', 'active', 'completed'));

-- Add for participants to be exhaustive
ALTER TABLE public.tournament_participants 
  ADD CONSTRAINT check_tournament_participants_status 
  CHECK (status IN ('pending', 'confirmed'));
