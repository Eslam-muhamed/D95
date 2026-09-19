import { supabase } from '../lib/supabase';
import { DBTournament, DBTournamentParticipant, DBTournamentMatch } from '../types/database';

export const tournamentService = {
  // === Admin Methods ===
  
  async fetchAllTournaments(): Promise<DBTournament[]> {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createTournament(
    tournament: Omit<DBTournament, 'id' | 'created_at' | 'updated_at'>
  ): Promise<DBTournament> {
    const { data, error } = await supabase
      .from('tournaments')
      .insert(tournament)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTournament(
    id: string,
    updates: Partial<Omit<DBTournament, 'id' | 'created_at'>>
  ): Promise<DBTournament> {
    const { data, error } = await supabase
      .from('tournaments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTournament(id: string): Promise<void> {
    const { error } = await supabase.from('tournaments').delete().eq('id', id);
    if (error) throw error;
  },

  async fetchParticipants(tournamentId: string): Promise<DBTournamentParticipant[]> {
    const { data, error } = await supabase
      .from('tournament_participants')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateParticipantStatus(id: string, status: 'pending' | 'confirmed'): Promise<void> {
    const { error } = await supabase
      .from('tournament_participants')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteParticipant(id: string): Promise<void> {
    const { error } = await supabase.from('tournament_participants').delete().eq('id', id);
    if (error) throw error;
  },

  // === Client Methods ===

  async fetchActiveTournaments(): Promise<DBTournament[]> {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('is_active_in_ui', true)
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getTournamentById(id: string): Promise<DBTournament | null> {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  async registerParticipant(
    participant: Omit<DBTournamentParticipant, 'id' | 'created_at' | 'status'>
  ): Promise<void> {
    const { error } = await supabase
      .from('tournament_participants')
      .insert({ ...participant, status: 'pending' });

    if (error) throw error;
  },

  // === Matches Methods ===

  async fetchMatches(tournamentId: string): Promise<DBTournamentMatch[]> {
    const { data, error } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true })
      .order('match_number', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async fetchPublicParticipants(tournamentId: string): Promise<{id: string, player_name: string, status: string}[]> {
    const { data, error } = await supabase.rpc('get_tournament_public_participants', { p_tournament_id: tournamentId });
    if (error) {
        console.error("Error fetching public participants:", error);
        return [];
    }
    return data || [];
  },

  async generateRandomMatches(tournamentId: string): Promise<void> {
    const participants = await this.fetchParticipants(tournamentId);
    const confirmed = participants.filter(p => p.status === 'confirmed');

    if (confirmed.length < 2) {
      throw new Error('يجب أن يكون هناك لاعبان على الأقل لإنشاء بطولة');
    }
    if (confirmed.length % 2 !== 0) {
      throw new Error('يجب أن يكون عدد اللاعبين المؤكدين زوجياً (مثلاً 2, 4, 8, 16...) لإنشاء القرعة');
    }

    // Shuffle players
    const shuffled = [...confirmed].sort(() => Math.random() - 0.5);

    // Delete existing matches first
    await supabase.from('tournament_matches').delete().eq('tournament_id', tournamentId);

    // Create First Round matches (Round 1)
    const matchesToInsert = [];
    let matchNumber = 1;
    for (let i = 0; i < shuffled.length; i += 2) {
      matchesToInsert.push({
        tournament_id: tournamentId,
        round: 1,
        match_number: matchNumber++,
        player1_id: shuffled[i].id,
        player2_id: shuffled[i + 1].id,
        status: 'pending'
      });
    }

    const { error } = await supabase.from('tournament_matches').insert(matchesToInsert);
    if (error) throw error;
  },

  async clearMatches(tournamentId: string): Promise<void> {
    const { error } = await supabase.from('tournament_matches').delete().eq('tournament_id', tournamentId);
    if (error) throw error;
  },

  async updateMatch(id: string, updates: Partial<DBTournamentMatch>): Promise<void> {
    const { error } = await supabase
      .from('tournament_matches')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async advanceWinner(matchId: string, winnerId: string, tournamentId: string, currentRound: number, currentMatchNumber: number): Promise<void> {
    const nextRound = currentRound + 1;
    const nextMatchNumber = Math.ceil(currentMatchNumber / 2);

    let { data: nextMatch } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('round', nextRound)
      .eq('match_number', nextMatchNumber)
      .single();

    if (!nextMatch) {
      const { data: newMatch, error } = await supabase
        .from('tournament_matches')
        .insert({
          tournament_id: tournamentId,
          round: nextRound,
          match_number: nextMatchNumber,
          player1_id: winnerId,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      nextMatch = newMatch;
    } else {
      const slot = nextMatch.player1_id ? 'player2_id' : 'player1_id';
      await supabase
        .from('tournament_matches')
        .update({ [slot]: winnerId })
        .eq('id', nextMatch.id);
    }

    await this.updateMatch(matchId, { 
      winner_id: winnerId,
      status: 'completed',
      next_match_id: nextMatch.id
    });
  }
};
