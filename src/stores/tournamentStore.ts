import { create } from 'zustand';
import { DBTournament } from '../types/database';
import { tournamentService } from '../services/tournamentService';

interface TournamentState {
  activeTournaments: DBTournament[];
  isLoading: boolean;
  error: string | null;
  fetchActiveTournaments: () => Promise<void>;
  hasActiveTournament: () => boolean;
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  activeTournaments: [],
  isLoading: false,
  error: null,

  fetchActiveTournaments: async () => {
    set({ isLoading: true, error: null });
    try {
      const tournaments = await tournamentService.fetchActiveTournaments();
      set({ activeTournaments: tournaments, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch tournaments', isLoading: false });
    }
  },

  hasActiveTournament: () => {
    return get().activeTournaments.length > 0;
  }
}));
