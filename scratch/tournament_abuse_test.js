import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eprpagnkxxkuykbzhvge.supabase.co';
const supabaseKey = 'sb_publishable_mSDH8vHZfdbb3lGVrM71bg_bmUQ9eJi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testTournamentAbuse() {
    console.log('--- Testing Tournament Abuse ---');
    
    // Fetch an active tournament
    const { data: tournaments, error: tErr } = await supabase.from('tournaments').select('id').limit(1);
    if (tErr || !tournaments || tournaments.length === 0) {
        console.log(`Failed to fetch tournaments: ${tErr ? tErr.message : 'Empty'}`);
        return;
    }
    const tournamentId = tournaments[0].id;
    console.log(`Using real tournament: ${tournamentId}`);

    // Test 1: Register as participant
    const participantPayload = {
        tournament_id: tournamentId,
        player_name: 'Abuser Player',
        phone: '01011111111',
        status: 'pending'
    };
    
    const { data: data1, error: err1 } = await supabase.from('tournament_participants').insert(participantPayload);
    console.log(`[Register] Error: ${err1 ? err1.message : 'SUCCESS'}`);

    if (!err1) {
        // Test 2: Duplicate Registration
        const { data: data2, error: err2 } = await supabase.from('tournament_participants').insert(participantPayload);
        console.log(`[Duplicate Register] Error: ${err2 ? err2.message : 'SUCCESS - Duplicate allowed'}`);

        const { data: data4, error: err4 } = await supabase.from('tournaments').update({ status: 'completed' }).eq('id', tournamentId);
        
        const { data: checkData } = await supabase.from('tournaments').select('status').eq('id', tournamentId);
        console.log(`[Update Tournament Status] Updated Status in DB: ${checkData?.[0]?.status}`);
    }
}

testTournamentAbuse();
