-- Migration: 20260919110500_create_tournaments.sql
-- Description: Create tournaments and tournament_participants tables

CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    game TEXT NOT NULL,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    entry_fee NUMERIC DEFAULT 0,
    prize TEXT,
    status TEXT DEFAULT 'upcoming', -- upcoming, active, completed
    is_active_in_ui BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tournament_participants (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, confirmed
    payment_method TEXT, -- cash, instapay
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

-- Tournaments Policies
CREATE POLICY "Allow public read tournaments" 
ON public.tournaments FOR SELECT 
USING (true);

CREATE POLICY "Allow staff write tournaments" 
ON public.tournaments TO "authenticated" 
USING (EXISTS (SELECT 1 FROM public.staff_users WHERE id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.staff_users WHERE id = auth.uid()));

-- Participants Policies
CREATE POLICY "Allow public insert participants" 
ON public.tournament_participants FOR INSERT 
TO "authenticated", "anon" 
WITH CHECK (
    status = 'pending' AND 
    length(trim(player_name)) >= 2 AND 
    length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 10
);

CREATE POLICY "Allow staff access participants" 
ON public.tournament_participants TO "authenticated" 
USING (EXISTS (SELECT 1 FROM public.staff_users WHERE id = auth.uid()));

-- Create indexes
CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_tournaments_ui_active ON public.tournaments(is_active_in_ui);
CREATE INDEX idx_participants_tournament_id ON public.tournament_participants(tournament_id);
