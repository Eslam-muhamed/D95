import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eprpagnkxxkuykbzhvge.supabase.co';
const supabaseKey = 'sb_publishable_mSDH8vHZfdbb3lGVrM71bg_bmUQ9eJi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testBookingAbuse() {
    console.log('--- Testing Booking Anti-Hoarding Bypass ---');
    
    // Create 3 bookings with different phone numbers
    for (let i = 1; i <= 3; i++) {
        const fakePhone = '011' + String(Date.now()).slice(-8) + i;
        const payload = {
            customer_name: `Hoarder ${i}`,
            customer_phone: fakePhone,
            room_id: 'room-1',
            booking_date: '2026-12-01',
            start_datetime: `2026-12-01T1${i}:00:00Z`,
            end_datetime: `2026-12-01T1${i+1}:00:00Z`,
            duration_hours: 1,
            reservation_id: `ABUSE-${Date.now()}-${i}`
        };

        const { data, error } = await supabase.rpc('create_booking_atomic', { p_booking: payload });
        if (error) {
            console.log(`[Request ${i} Phone: ${fakePhone}] BLOCKED: ${error.message}`);
        } else {
            console.log(`[Request ${i} Phone: ${fakePhone}] SUCCESS! Booking ID: ${data.id}`);
        }
    }
}

testBookingAbuse();
