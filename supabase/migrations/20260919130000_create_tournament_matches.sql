-- Migration: 20260919130000_create_tournament_matches.sql
-- Description: Create tournament matches table for bracket generation

CREATE TABLE IF NOT EXISTS public.tournament_matches (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
    round INTEGER NOT NULL, -- e.g., 1 for first round, 2 for quarter...
    match_number INTEGER NOT NULL, -- visual order in the round
    player1_id UUID REFERENCES public.tournament_participants(id) ON DELETE SET NULL,
    player2_id UUID REFERENCES public.tournament_participants(id) ON DELETE SET NULL,
    winner_id UUID REFERENCES public.tournament_participants(id) ON DELETE SET NULL,
    score1 INTEGER DEFAULT 0,
    score2 INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, active, completed
    next_match_id UUID REFERENCES public.tournament_matches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read tournament_matches" 
ON public.tournament_matches FOR SELECT 
USING (true);

CREATE POLICY "Allow staff write tournament_matches" 
ON public.tournament_matches TO "authenticated" 
USING (EXISTS (SELECT 1 FROM public.staff_users WHERE id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.staff_users WHERE id = auth.uid()));

-- Create indexes
CREATE INDEX idx_matches_tournament_id ON public.tournament_matches(tournament_id);
CREATE INDEX idx_matches_round ON public.tournament_matches(round);
