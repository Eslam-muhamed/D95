import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eprpagnkxxkuykbzhvge.supabase.co';
const supabaseKey = 'sb_publishable_mSDH8vHZfdbb3lGVrM71bg_bmUQ9eJi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testBookingCapacity() {
    console.log('--- Testing Booking Capacity Exhaustion ---');
    const createdIds = [];
    
    // Booking 1: Phone A, Room 1, 10:00 - 11:00
    const p1 = {
        customer_name: 'Attacker A', customer_phone: '01000000001', room_id: 'room-1',
        booking_date: '2026-12-05', start_datetime: '2026-12-05T10:00:00Z', end_datetime: '2026-12-05T11:00:00Z',
        duration_hours: 1, reservation_id: `CAP-1-${Date.now()}`
    };
    const r1 = await supabase.rpc('create_booking_atomic', { p_booking: p1 });
    console.log(`[Slot 1 - 10:00 Phone A] ${r1.error ? 'BLOCKED: ' + r1.error.message : 'SUCCESS: ' + r1.data.id}`);
    if (r1.data) createdIds.push(r1.data.id);

    // Booking 2: Phone B, Room 1, 10:00 - 11:00 (Overlap test)
    const p2 = {
        customer_name: 'Attacker B', customer_phone: '01000000002', room_id: 'room-1',
        booking_date: '2026-12-05', start_datetime: '2026-12-05T10:00:00Z', end_datetime: '2026-12-05T11:00:00Z',
        duration_hours: 1, reservation_id: `CAP-2-${Date.now()}`
    };
    const r2 = await supabase.rpc('create_booking_atomic', { p_booking: p2 });
    console.log(`[Slot 1 - 10:00 Phone B] ${r2.error ? 'BLOCKED: ' + r2.error.message : 'SUCCESS: ' + r2.data.id}`);
    if (r2.data) createdIds.push(r2.data.id);

    // Booking 3: Phone B, Room 1, 11:00 - 12:00 (Adjacent slot test)
    const p3 = {
        customer_name: 'Attacker B', customer_phone: '01000000002', room_id: 'room-1',
        booking_date: '2026-12-05', start_datetime: '2026-12-05T11:00:00Z', end_datetime: '2026-12-05T12:00:00Z',
        duration_hours: 1, reservation_id: `CAP-3-${Date.now()}`
    };
    const r3 = await supabase.rpc('create_booking_atomic', { p_booking: p3 });
    console.log(`[Slot 2 - 11:00 Phone B] ${r3.error ? 'BLOCKED: ' + r3.error.message : 'SUCCESS: ' + r3.data.id}`);
    if (r3.data) createdIds.push(r3.data.id);

    // Booking 4: Phone C, Room 2, 10:00 - 11:00 (Cross room test)
    const p4 = {
        customer_name: 'Attacker C', customer_phone: '01000000003', room_id: 'room-2',
        booking_date: '2026-12-05', start_datetime: '2026-12-05T10:00:00Z', end_datetime: '2026-12-05T11:00:00Z',
        duration_hours: 1, reservation_id: `CAP-4-${Date.now()}`
    };
    const r4 = await supabase.rpc('create_booking_atomic', { p_booking: p4 });
    console.log(`[Slot 1 - 10:00 Phone C Room 2] ${r4.error ? 'BLOCKED: ' + r4.error.message : 'SUCCESS: ' + r4.data.id}`);
    if (r4.data) createdIds.push(r4.data.id);

    console.log(`\n--- Cleanup Phase ---`);
    for (const id of createdIds) {
        // We cannot delete via Supabase Client (Anon), because Anon has no DELETE access on ps_bookings!
        // The policy says customers can only SELECT their own.
        // Wait, I will need a staff/admin key to delete them, but I don't have one!
        // Instead, since it's just test data in the future ('2026-12-05'), it won't impact today's schedule, but I should probably leave them or use a SQL migration to delete them to prove cleanup.
        console.log(`Notice: Cannot cleanup ${id} via Anon API. Cleanup must be done via SQL.`);
    }
}

testBookingCapacity();
