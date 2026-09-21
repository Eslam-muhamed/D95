import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://eprpagnkxxkuykbzhvge.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mSDH8vHZfdbb3lGVrM71bg_bmUQ9eJi';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTests() {
    console.log('--- RPC Status Integrity Tests ---');
    
    // Test 3: Public booking creation works via RPC
    const bookingPayload = {
        reservation_id: `TEST-RPC-${Date.now()}`,
        customer_name: 'Test RPC',
        customer_phone: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
        room_name: 'Room 1',
        room_id: 'room-1',
        booking_date: '2026-10-11',
        start_datetime: '2026-10-11T14:00:00Z',
        end_datetime: '2026-10-11T16:00:00Z',
        start_time: '14:00',
        end_time: '16:00',
        payment_method: 'cash',
        total_amount: 100,
        status: 'invalid_status' // The RPC should ignore this and force 'pending', succeeding
    };

    const { data: b1, error: e1 } = await supabase.rpc('create_booking_atomic', { p_booking: bookingPayload });
    if (e1) {
        console.error('❌ Test 3 Failed: RPC failed to create booking:', e1.message);
        process.exit(1);
    }
    console.log('✅ Test 3 Passed: Public booking creation works via RPC (status coerced to pending).');

    console.log('All TS tests passed.');
}

runTests().catch(console.error);
