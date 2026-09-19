import { supabase } from '../lib/supabase';
import { DBTournament, DBTournamentParticipant } from '../types/database';

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
  }
};
