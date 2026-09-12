/**
 * Comprehensive Test Suite for PlayStation Booking Dynamic Availability Engine.
 * Covers all 6 Prompt Examples and all 20 Edge Cases.
 */

import {
    OPERATING_HOURS,
    createDateTimeFromBusinessDate,
    calculateEndDateTime,
    doesIntervalOverlap,
    checkAvailability,
    getBusinessOperatingWindow,
    generateStartTimeOptions,
    formatArabicTimeFromDate,
    BookingInterval,
} from '../src/lib/bookingDatetime';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eprpagnkxxkuykbzhvge.supabase.co';
const supabaseKey = 'sb_publishable_mSDH8vHZfdbb3lGVrM71bg_bmUQ9eJi';
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_DATE = '2026-09-09';
// Fixed reference "now" well before any bookings for deterministic testing: 2026-09-09 08:00 AM
const FIXED_NOW = new Date(2026, 8, 9, 8, 0, 0);

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passedCount++;
    } else {
        console.error(`  ❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
        failedCount++;
    }
}

async function runAllTests() {
    console.log('====================================================');
    console.log('PART 1: VERIFYING THE 6 MANDATORY USER PROMPT EXAMPLES');
    console.log('====================================================');

    // Example 1: Existing: 02:00 PM -> 03:00 PM, Requested: 03:30 PM -> 04:30 PM => AVAILABLE
    {
        const existing: BookingInterval[] = [{
            start: createDateTimeFromBusinessDate(TEST_DATE, '14:00'),
            end: createDateTimeFromBusinessDate(TEST_DATE, '15:00'),
        }];
        const reqStart = createDateTimeFromBusinessDate(TEST_DATE, '15:30');
        const res = checkAvailability(reqStart, 1, TEST_DATE, existing, FIXED_NOW);
        assert(res.isAvailable === true, 'Example 1: 02:00-03:00 PM vs requested 03:30-04:30 PM is AVAILABLE');
    }

    // Example 2: Existing: 02:00 PM -> 03:00 PM, Requested: 02:30 PM -> 03:30 PM => UNAVAILABLE
    {
        const existing: BookingInterval[] = [{
            start: createDateTimeFromBusinessDate(TEST_DATE, '14:00'),
            end: createDateTimeFromBusinessDate(TEST_DATE, '15:00'),
        }];
        const reqStart = createDateTimeFromBusinessDate(TEST_DATE, '14:30');
        const res = checkAvailability(reqStart, 1, TEST_DATE, existing, FIXED_NOW);
        assert(res.isAvailable === false && res.reason === 'OVERLAP_CONFLICT', 'Example 2: 02:00-03:00 PM vs requested 02:30-03:30 PM is UNAVAILABLE');
    }

    // Example 3: Existing: 02:00 PM -> 03:00 PM, Requested: 03:00 PM -> 04:00 PM => AVAILABLE
    {
        const existing: BookingInterval[] = [{
            start: createDateTimeFromBusinessDate(TEST_DATE, '14:00'),
            end: createDateTimeFromBusinessDate(TEST_DATE, '15:00'),
        }];
        const reqStart = createDateTimeFromBusinessDate(TEST_DATE, '15:00');
        const res = checkAvailability(reqStart, 1, TEST_DATE, existing, FIXED_NOW);
        assert(res.isAvailable === true, 'Example 3: 02:00-03:00 PM vs requested 03:00-04:00 PM (touching edge) is AVAILABLE');
    }

    // Example 4: Existing: 11:30 PM -> 12:30 AM, Requested: 12:30 AM -> 01:30 AM => AVAILABLE
    {
        const existing: BookingInterval[] = [{
            start: createDateTimeFromBusinessDate(TEST_DATE, '23:30'),
            end: createDateTimeFromBusinessDate(TEST_DATE, '00:30'),
        }];
        const reqStart = createDateTimeFromBusinessDate(TEST_DATE, '00:30');
        const res = checkAvailability(reqStart, 1, TEST_DATE, existing, FIXED_NOW);
        assert(res.isAvailable === true, 'Example 4: 11:30 PM-12:30 AM vs requested 12:30-01:30 AM is AVAILABLE');
    }

    // Example 5: Existing: 11:30 PM -> 12:30 AM, Requested: 12:15 AM -> 01:15 AM => UNAVAILABLE
    {
        const existing: BookingInterval[] = [{
            start: createDateTimeFromBusinessDate(TEST_DATE, '23:30'),
            end: createDateTimeFromBusinessDate(TEST_DATE, '00:30'),
        }];
        const reqStart = createDateTimeFromBusinessDate(TEST_DATE, '00:15');
        const res = checkAvailability(reqStart, 1, TEST_DATE, existing, FIXED_NOW);
        assert(res.isAvailable === false && res.reason === 'OVERLAP_CONFLICT', 'Example 5: 11:30 PM-12:30 AM vs requested 12:15-01:15 AM is UNAVAILABLE');
    }

    // Example 6: Existing: 02:00 AM -> 03:00 AM, Requested: 03:00 AM -> 04:00 AM => AVAILABLE
    {
        const existing: BookingInterval[] = [{
            start: createDateTimeFromBusinessDate(TEST_DATE, '02:00'),
            end: createDateTimeFromBusinessDate(TEST_DATE, '03:00'),
        }];
        const reqStart = createDateTimeFromBusinessDate(TEST_DATE, '03:00');
        const res = checkAvailability(reqStart, 1, TEST_DATE, existing, FIXED_NOW);
        assert(res.isAvailable === true, 'Example 6: 02:00-03:00 AM vs requested 03:00-04:00 AM (ending at closing) is AVAILABLE');
    }

    console.log('\n====================================================');
    console.log('PART 2: TESTING ALL 20 SPECIFIED EDGE CASES');
    console.log('====================================================');

    // Edge Case 1: No existing bookings
    {
        const existing: BookingInterval[] = [];
        const reqStart = createDateTimeFromBusinessDate(TEST_DATE, '10:00');
        const res = checkAvailability(reqStart, 2, TEST_DATE, existing, FIXED_NOW);
        assert(res.isAvailable === true, 'Edge Case 1: No existing bookings -> whole day available by default');
    }

    // Edge Case 2: One booking in the middle of the day
    {
        const existing: BookingInterval[] = [{
            start: createDateTimeFromBusinessDate(TEST_DATE, '14:00'),
            end: createDateTimeFromBusinessDate(TEST_DATE, '16:00'),
        }];
        const beforeRes = checkAvailability(createDateTimeFromBusinessDate(TEST_DATE, '11:00'), 2, TEST_DATE, existing, FIXED_NOW);
        const afterRes = checkAvailability(createDateTimeFromBusinessDate(TEST_DATE, '17:00'), 2, TEST_DATE, existing, FIXED_NOW);
        assert(beforeRes.isAvailable && afterRes.isAvailable, 'Edge Case 2: Available before and after single middle-of-day booking');
    }

    // Edge Case 3: Booking immediately before another booking (newEnd == existingStart)
    {
        const existing: BookingInterval[] = [{
            start: createDateTimeFromBusinessDate(TEST_DATE, '16:00'),
            end: createDateTimeFromBusinessDate(TEST_DATE, '18:00'),
        }];
        const reqStart = createDateTimeFromBusinessDate(TEST_DATE, '14:00'); // 14:00 -> 16:00
        const res = checkAvailability(reqStart, 2, TEST_DATE, existing, FIXED_NOW);
        assert(res.isAvailable === true, 'Edge Case 3: Booking immediately before another booking (14:00-16:00 before 16:00-18:00) is AVAILABLE');
    }

    // Edge Case 4: Booking immediately after another booking (newStart == existingEnd)
    {
        const existing: BookingInterval[] = [{
            start: createDateTimeFromBusinessDate(TEST_DATE, '16:00'),
            end: createDateTimeFromBusinessDate(TEST_DATE, '18:00'),
        }];
        const reqStart = createDateTimeFromBusinessDate(TEST_DATE, '18:00'); // 18:00 -> 20:00
        const res = checkAvailability(reqStart, 2, TEST_DATE, existing, FIXED_NOW);
        assert(res.isAvailable === true, 'Edge Case 4: Booking immediately after another booking (18:00-20:00 after 16:00-18:00) is AVAILABLE');
    }

    // Edge Case 5: Partial overlap
    {
        const existing: BookingInterval[] = [{
            start: createDateTimeFromBusinessDate(TEST_DATE, '14:00'),
            end: createDateTimeFromBusinessDate(TEST_DATE, '16:00'),
        }];
        // Starts before existing, ends inside existing: 13:00 -> 15:00
        const res1 = checkAvailability(createDateTimeFromBusinessDate(TEST_DATE, '13:00'), 2, TEST_DATE, existing, FIXED_NOW);
        // Starts inside existing, ends after existing: 15:00 -> 17:00
        const res2 = checkAvailability(createDateTimeFromBusinessDate(TEST_DATE, '15:00'), 2, TEST_DATE, existing, FIXED_NOW);
        assert(!res1.isAvailable && !res2.isAvailable, 'Edge Case 5: Partial overlaps in both directions correctly detected as UNAVAILABLE');
    }

    // Edge Case 6: Complete overlap (exact same time range)
    {
        const existing: BookingInterval[] = [{
            start: createDateTimeFromBusinessDate(TEST_DATE, '15:00'),
            end: createDateTimeFromBusinessDate(TEST_DATE, '17:00'),
        }];
        const res = checkAvailability(createDateTimeFromBusinessDate(TEST_DATE, '15:00'), 2, TEST_DATE, existing, FIXED_NOW);
        assert(res.isAvailable === false && res.reason === 'OVERLAP_CONFLICT', 'Edge Case 6: Exact same time range is UNAVAILABLE');
    }

    // Edge Case 7: Booking containing another booking
    {
        const existing: BookingInterval[] = [{
            start: createDateTimeFromBusinessDate(TEST_DATE, '15:00'),
            end: createDateTimeFromBusinessDate(TEST_DATE, '16:00'),
        }];
        // Requested: 14:00 -> 17:00 (encompasses 15:00-16:00)
        const res = checkAvailability(createDateTimeFromBusinessDate(TEST_DATE, '14:00'), 3, TEST_DATE, existing, FIXED_NOW);
        assert(res.isAvailable === false && res.reason === 'OVERLAP_CONFLICT', 'Edge Case 7: Request containing existing booking is UNAVAILABLE');
    }

    // Edge Case 8: Multiple existing bookings
    {
        const existing: BookingInterval[] = [
            { start: createDateTimeFromBusinessDate(TEST_DATE, '10:00'), end: createDateTimeFromBusinessDate(TEST_DATE, '12:00') },
            { start: createDateTimeFromBusinessDate(TEST_DATE, '14:00'), end: createDateTimeFromBusinessDate(TEST_DATE, '16:00') },
            { start: createDateTimeFromBusinessDate(TEST_DATE, '18:00'), end: createDateTimeFromBusinessDate(TEST_DATE, '20:00') },
        ];
        // In gap: 12:00 -> 14:00
        const gapRes = checkAvailability(createDateTimeFromBusinessDate(TEST_DATE, '12:00'), 2, TEST_DATE, existing, FIXED_NOW);
        // Overlap across gap: 11:30 -> 14:30
        const badRes = checkAvailability(createDateTimeFromBusinessDate(TEST_DATE, '11:30'), 3, TEST_DATE, existing, FIXED_NOW);
        assert(gapRes.isAvailable && !badRes.isAvailable, 'Edge Case 8: Multiple bookings - exact gap is AVAILABLE, bridging gap is UNAVAILABLE');
    }

    // Edge Case 9: Booking crossing midnight (e.g. 23:30 -> 01:30)
    {
        const s = createDateTimeFromBusinessDate(TEST_DATE, '23:30');
        const e = calculateEndDateTime(s, 2);
        // End date should belong to next day (10th) at 01:30
        const isNextCalendarDay = e.getDate() === 10 && e.getHours() === 1 && e.getMinutes() === 30;
        const res = checkAvailability(s, 2, TEST_DATE, [], FIXED_NOW);
        assert(isNextCalendarDay && res.isAvailable, 'Edge Case 9: Midnight crossing (11:30 PM -> 01:30 AM next day) properly calculated and AVAILABLE');
    }

    // Edge Case 10: Booking ending exactly at 04:00 AM
    {
        // 03:00 AM + 1 hour = 04:00 AM
        const s = createDateTimeFromBusinessDate(TEST_DATE, '03:00');
        const res1 = checkAvailability(s, 1, TEST_DATE, [], FIXED_NOW);
        // 02:00 AM + 2 hours = 04:00 AM
        const s2 = createDateTimeFromBusinessDate(TEST_DATE, '02:00');
        const res2 = checkAvailability(s2, 2, TEST_DATE, [], FIXED_NOW);
        assert(res1.isAvailable && res2.isAvailable, 'Edge Case 10: Bookings ending exactly at 04:00 AM are AVAILABLE');
    }

    // Edge Case 11: Attempt to go beyond 04:00 AM
    {
        // 03:15 AM + 1 hour = 04:15 AM (past closing)
        const s1 = createDateTimeFromBusinessDate(TEST_DATE, '03:15');
        const res1 = checkAvailability(s1, 1, TEST_DATE, [], FIXED_NOW);
        // 02:15 AM + 2 hours = 04:15 AM
        const s2 = createDateTimeFromBusinessDate(TEST_DATE, '02:15');
        const res2 = checkAvailability(s2, 2, TEST_DATE, [], FIXED_NOW);
        assert(!res1.isAvailable && res1.reason === 'EXCEEDS_CLOSING' && !res2.isAvailable, 'Edge Case 11: Booking extending past 04:00 AM is rejected with EXCEEDS_CLOSING');
    }

    // Edge Case 12: Attempt to book a past time
    {
        // Reference time is 08:00 AM; requesting 07:00 AM or yesterday
        const pastStart = new Date(FIXED_NOW.getTime() - 60 * 60 * 1000);
        const res = checkAvailability(pastStart, 1, TEST_DATE, [], FIXED_NOW);
        assert(!res.isAvailable && res.reason === 'PAST_TIME', 'Edge Case 12: Attempt to book past time is rejected with PAST_TIME');
    }

    // Edge Case 13: Duplicate booking submission (RPC / Exclusion Constraint)
    {
        const testRoomDup = `dup-room-${Date.now()}`;
        const testResId = `DUP-TEST-${Date.now()}`;
        const startDt = new Date(Date.UTC(2027, 0, 10, 12, 0, 0)).toISOString();
        const endDt = new Date(Date.UTC(2027, 0, 10, 14, 0, 0)).toISOString();

        const payload = {
            reservation_id: testResId,
            customer_name: 'Test Customer',
            customer_phone: '01012345678',
            room_id: testRoomDup,
            room_name: 'غرفة تجريبية',
            booking_date: '2027-01-10',
            start_datetime: startDt,
            end_datetime: endDt,
            start_time: '12:00 م',
            end_time: '02:00 م',
            duration_hours: 2,
            total_amount: 200,
            payment_method: 'cash',
            status: 'confirmed',
        };

        // First insert (should succeed)
        const { data: firstData, error: firstErr } = await supabase.rpc('create_booking_atomic', { p_booking: payload });
        
        // Second identical insert (must be rejected by exclusion constraint / overlap check)
        const { data: secondData, error: secondErr } = await supabase.rpc('create_booking_atomic', { p_booking: payload });

        const duplicateBlocked = !firstErr && secondErr !== null;
        assert(duplicateBlocked, 'Edge Case 13: Duplicate booking submission rejected by database atomic RPC');

        // Cleanup
        await supabase.from('ps_bookings').delete().eq('room_id', testRoomDup);
    }

    // Edge Case 14: Two simultaneous booking attempts (Race condition protection)
    {
        const roomSim = `room-sim-${Date.now()}`;
        const startDt = new Date(Date.UTC(2027, 0, 11, 14, 0, 0)).toISOString();
        const endDt = new Date(Date.UTC(2027, 0, 11, 16, 0, 0)).toISOString();

        const p1 = {
            reservation_id: `SIM-1-${Date.now()}`,
            customer_name: 'User 1',
            customer_phone: '01011111111',
            room_id: roomSim,
            room_name: 'Sim Room',
            booking_date: '2027-01-11',
            start_datetime: startDt,
            end_datetime: endDt,
            start_time: '02:00 م',
            end_time: '04:00 م',
            duration_hours: 2,
            total_amount: 200,
            status: 'confirmed',
        };

        const p2 = {
            reservation_id: `SIM-2-${Date.now()}`,
            customer_name: 'User 2',
            customer_phone: '01022222222',
            room_id: roomSim,
            room_name: 'Sim Room',
            booking_date: '2027-01-11',
            start_datetime: startDt,
            end_datetime: endDt,
            start_time: '02:00 م',
            end_time: '04:00 م',
            duration_hours: 2,
            total_amount: 200,
            status: 'confirmed',
        };

        // Launch both concurrently via Promise.all
        const [res1, res2] = await Promise.all([
            supabase.rpc('create_booking_atomic', { p_booking: p1 }),
            supabase.rpc('create_booking_atomic', { p_booking: p2 }),
        ]);

        const successes = [res1, res2].filter(r => !r.error).length;
        const errors = [res1, res2].filter(r => r.error).length;

        assert(successes === 1 && errors === 1, 'Edge Case 14: Concurrent simultaneous race condition - EXACTLY ONE succeeds, ONE is blocked');

        // Cleanup
        await supabase.from('ps_bookings').delete().eq('room_id', roomSim);
    }

    // Edge Case 15: Different stations (rooms) at the same time
    {
        const roomA = `station-A-${Date.now()}`;
        const roomB = `station-B-${Date.now()}`;
        const startDt = new Date(Date.UTC(2027, 0, 12, 18, 0, 0)).toISOString();
        const endDt = new Date(Date.UTC(2027, 0, 12, 20, 0, 0)).toISOString();

        const [r1, r2] = await Promise.all([
            supabase.rpc('create_booking_atomic', { p_booking: {
                reservation_id: `ROOM-A-${Date.now()}`,
                customer_name: 'User A',
                customer_phone: '01033333333',
                room_id: roomA,
                room_name: 'Station A',
                booking_date: '2027-01-12',
                start_datetime: startDt,
                end_datetime: endDt,
                start_time: '06:00 م',
                end_time: '08:00 م',
                duration_hours: 2,
                total_amount: 200,
                status: 'confirmed',
            }}),
            supabase.rpc('create_booking_atomic', { p_booking: {
                reservation_id: `ROOM-B-${Date.now()}`,
                customer_name: 'User B',
                customer_phone: '01044444444',
                room_id: roomB,
                room_name: 'Station B',
                booking_date: '2027-01-12',
                start_datetime: startDt,
                end_datetime: endDt,
                start_time: '06:00 م',
                end_time: '08:00 م',
                duration_hours: 2,
                total_amount: 200,
                status: 'confirmed',
            }}),
        ]);

        assert(!r1.error && !r2.error, 'Edge Case 15: Different stations at the exact same time both succeed');

        // Cleanup
        await supabase.from('ps_bookings').delete().in('room_id', [roomA, roomB]);
    }

    // Edge Case 16: Same station at different times
    {
        const roomDiff = `room-diff-${Date.now()}`;
        const s1 = new Date(Date.UTC(2027, 0, 13, 10, 0, 0)).toISOString();
        const e1 = new Date(Date.UTC(2027, 0, 13, 12, 0, 0)).toISOString();
        const s2 = new Date(Date.UTC(2027, 0, 13, 14, 0, 0)).toISOString();
        const e2 = new Date(Date.UTC(2027, 0, 13, 16, 0, 0)).toISOString();

        const [r1, r2] = await Promise.all([
            supabase.rpc('create_booking_atomic', { p_booking: {
                reservation_id: `DIFF-1-${Date.now()}`,
                customer_name: 'User 1',
                customer_phone: '01055555555',
                room_id: roomDiff,
                room_name: 'Diff Room',
                booking_date: '2027-01-13',
                start_datetime: s1,
                end_datetime: e1,
                start_time: '10:00 ص',
                end_time: '12:00 م',
                duration_hours: 2,
                total_amount: 200,
                status: 'confirmed',
            }}),
            supabase.rpc('create_booking_atomic', { p_booking: {
                reservation_id: `DIFF-2-${Date.now()}`,
                customer_name: 'User 2',
                customer_phone: '01066666666',
                room_id: roomDiff,
                room_name: 'Diff Room',
                booking_date: '2027-01-13',
                start_datetime: s2,
                end_datetime: e2,
                start_time: '02:00 م',
                end_time: '04:00 م',
                duration_hours: 2,
                total_amount: 200,
                status: 'confirmed',
            }}),
        ]);

        assert(!r1.error && !r2.error, 'Edge Case 16: Same station at different non-overlapping times both succeed');

        // Cleanup
        await supabase.from('ps_bookings').delete().eq('room_id', roomDiff);
    }

    // Edge Case 17: Cancelled booking does NOT block availability
    {
        const existingWithCancelled: BookingInterval[] = [
            {
                start: createDateTimeFromBusinessDate(TEST_DATE, '14:00'),
                end: createDateTimeFromBusinessDate(TEST_DATE, '16:00'),
                status: 'cancelled',
            }
        ];
        const res = checkAvailability(createDateTimeFromBusinessDate(TEST_DATE, '14:00'), 2, TEST_DATE, existingWithCancelled, FIXED_NOW);
        assert(res.isAvailable === true, 'Edge Case 17: Cancelled bookings are ignored and slot remains AVAILABLE');
    }

    // Edge Case 18: Invalid duration (< 1 hour)
    {
        const res = checkAvailability(createDateTimeFromBusinessDate(TEST_DATE, '14:00'), 0.5, TEST_DATE, [], FIXED_NOW);
        assert(!res.isAvailable && res.reason === 'INVALID_DURATION', 'Edge Case 18: Duration < 1 hour is rejected with INVALID_DURATION');
    }

    // Edge Case 19: Invalid start time (outside 08:00 AM -> 04:00 AM window)
    {
        // 05:00 AM on a future business date (outside 08:00 AM -> 04:00 AM window)
        const futureDate = '2026-09-15';
        const outsideStart = new Date(2026, 8, 15, 5, 0, 0); // 05:00 AM on Sep 15
        const res = checkAvailability(outsideStart, 1, futureDate, [], FIXED_NOW);
        assert(!res.isAvailable && res.reason === 'EXCEEDS_CLOSING', 'Edge Case 19: Start time outside operating hours is rejected with EXCEEDS_CLOSING');
    }

    // Edge Case 20: Manipulated frontend request (e.g. negative duration, missing name, end < start)
    {
        const badPayload = {
            reservation_id: `BAD-${Date.now()}`,
            customer_name: 'A', // too short (< 2)
            customer_phone: '123', // invalid phone (< 10)
            room_id: 'room-1',
            booking_date: '2027-01-14',
            start_datetime: new Date(Date.UTC(2027, 0, 14, 16, 0, 0)).toISOString(),
            end_datetime: new Date(Date.UTC(2027, 0, 14, 14, 0, 0)).toISOString(), // end < start!
            duration_hours: -2, // negative duration!
            total_amount: -50,
        };

        const { error } = await supabase.rpc('create_booking_atomic', { p_booking: badPayload });
        assert(error !== null, 'Edge Case 20: Manipulated frontend request is strictly caught and rejected by backend RPC');
    }

    // Clean up any test database records
    try {
        await supabase.rpc('cleanup_test_bookings');
    } catch {
        // Ignore silent cleanup failure
    }

    console.log('\n====================================================');
    console.log(`TEST RESULTS SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('====================================================');

    if (failedCount > 0) {
        process.exit(1);
    }
}

runAllTests().catch(err => {
    console.error('Fatal test runner error:', err);
    process.exit(1);
});
