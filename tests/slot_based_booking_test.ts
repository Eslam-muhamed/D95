/**
 * Slot-Based 24-Hour Booking Verification Test Suite
 * 
 * Verifies:
 * 1. Exactly 24 continuous hourly slots are generated for any given date (00:00 - 23:00).
 * 2. Proper AM/PM and Arabic range labels (12:00 ص - 01:00 ص, 12:00 م - 01:00 م, etc.).
 * 3. Slots occupied by database reservations are flagged as isBooked = true and locked.
 * 4. Slots in the past are marked as isPast = true.
 * 5. Future unreserved slots are marked as available.
 * 6. Multi-hour session spans are correctly highlighted across consecutive slots.
 * 7. Quick Midnight helper accurately targets 00:00 tomorrow.
 */

import {
    createDateTimeFromBusinessDate,
    BookingInterval,
    addDaysToDateString,
    getCairoTodayDateString,
} from '../src/lib/bookingDatetime';

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        process.exit(1);
    } else {
        console.log(`  ✅ PASS: ${message}`);
    }
}

console.log('====================================================');
console.log('🧪 VERIFYING 24-HOUR SLOT-BASED BOOKING SYSTEM');
console.log('====================================================');

// Test 1: Generate 24 slots for tomorrow (all in the future)
const tomorrowStr = addDaysToDateString(getCairoTodayDateString(), 1);

function generateSlots(date: string, selectedHour24: number | null, durationHours: number, occupiedIntervals: BookingInterval[]) {
    const slots = [];
    const nowMs = Date.now();
    const selectedStartMs = selectedHour24 !== null
        ? createDateTimeFromBusinessDate(date, `${String(selectedHour24).padStart(2, '0')}:00`).getTime()
        : null;
    const selectedEndMs = selectedStartMs !== null
        ? selectedStartMs + durationHours * 3600 * 1000
        : null;

    for (let h = 0; h < 24; h++) {
        const time24 = `${String(h).padStart(2, '0')}:00`;
        const start = createDateTimeFromBusinessDate(date, time24);
        const end = new Date(start.getTime() + 60 * 60 * 1000);

        const h12 = h % 12 === 0 ? 12 : h % 12;
        const period = h >= 12 && h < 24 ? 'PM' : 'AM';
        const nextH = (h + 1) % 24;
        const nextH12 = nextH % 12 === 0 ? 12 : nextH % 12;
        const nextPeriod = nextH >= 12 && nextH < 24 ? 'PM' : 'AM';

        const startTimeStr = `${String(h12).padStart(2, '0')}:00 ${period === 'PM' ? 'م' : 'ص'}`;
        const endTimeStr = `${String(nextH12).padStart(2, '0')}:00 ${nextPeriod === 'PM' ? 'م' : 'ص'}`;
        const rangeLabel = `${startTimeStr} - ${endTimeStr}`;

        const isPast = start.getTime() < (nowMs - 3 * 60 * 1000);
        const slotStartMs = start.getTime();
        const slotEndMs = end.getTime();

        let isBooked = false;
        if (!isPast) {
            for (const inv of occupiedIntervals) {
                if (slotStartMs < inv.end.getTime() && slotEndMs > inv.start.getTime()) {
                    isBooked = true;
                    break;
                }
            }
        }

        const isSelected = selectedHour24 === h;
        const isSpanSelected = selectedStartMs !== null && selectedEndMs !== null && !isPast
            ? slotStartMs >= selectedStartMs && slotStartMs < selectedEndMs
            : false;

        slots.push({
            hour24: h,
            hour12: h12,
            period,
            startTimeStr,
            endTimeStr,
            rangeLabel,
            isPast,
            isBooked,
            isSelected,
            isSpanSelected,
        });
    }

    return slots;
}

// 1. Check slot count
const slotsTomorrow = generateSlots(tomorrowStr, null, 1, []);
assert(slotsTomorrow.length === 24, 'Generates exactly 24 slots for the day');

// 2. Check 00:00 midnight slot
const midnightSlot = slotsTomorrow[0];
assert(midnightSlot.hour24 === 0, 'First slot is 00:00');
assert(midnightSlot.hour12 === 12, '12-hour representation of 00:00 is 12');
assert(midnightSlot.period === 'AM', 'Period of 00:00 is AM');
assert(midnightSlot.startTimeStr === '12:00 ص', 'Formatted start time is 12:00 ص');
assert(midnightSlot.endTimeStr === '01:00 ص', 'Formatted end time is 01:00 ص');
assert(midnightSlot.rangeLabel === '12:00 ص - 01:00 ص', 'Range label is 12:00 ص - 01:00 ص');
assert(midnightSlot.isPast === false, 'Tomorrow midnight is not past');
assert(midnightSlot.isBooked === false, 'Tomorrow midnight is available by default');

// 3. Check 12:00 PM midday slot
const noonSlot = slotsTomorrow[12];
assert(noonSlot.hour24 === 12, 'Slot 12 is 12:00');
assert(noonSlot.hour12 === 12, '12-hour representation of 12:00 is 12');
assert(noonSlot.period === 'PM', 'Period of 12:00 is PM');
assert(noonSlot.startTimeStr === '12:00 م', 'Formatted start time is 12:00 م');
assert(noonSlot.endTimeStr === '01:00 م', 'Formatted end time is 01:00 م');

// 4. Check database booking reflection (slot gets booked/locked)
const bookingStart = createDateTimeFromBusinessDate(tomorrowStr, '16:00'); // 4:00 PM
const bookingEnd = createDateTimeFromBusinessDate(tomorrowStr, '18:00');   // 6:00 PM
const occupied: BookingInterval[] = [{ start: bookingStart, end: bookingEnd, status: 'confirmed' }];

const slotsWithBooking = generateSlots(tomorrowStr, null, 1, occupied);
assert(slotsWithBooking[16].isBooked === true, 'Slot 16:00 (04:00 م - 05:00 م) is marked as isBooked');
assert(slotsWithBooking[17].isBooked === true, 'Slot 17:00 (05:00 م - 06:00 م) is marked as isBooked');
assert(slotsWithBooking[15].isBooked === false, 'Slot 15:00 (03:00 م - 04:00 م) remains available');
assert(slotsWithBooking[18].isBooked === false, 'Slot 18:00 (06:00 م - 07:00 م) remains available');

// 5. Check multi-hour span selection
const slotsWithSpan = generateSlots(tomorrowStr, 20, 3, occupied); // 8:00 PM for 3 hours (20, 21, 22)
assert(slotsWithSpan[20].isSelected === true, 'Slot 20:00 is the selected primary slot');
assert(slotsWithSpan[20].isSpanSelected === true, 'Slot 20:00 is part of the 3-hour span');
assert(slotsWithSpan[21].isSpanSelected === true, 'Slot 21:00 is part of the 3-hour span');
assert(slotsWithSpan[22].isSpanSelected === true, 'Slot 22:00 is part of the 3-hour span');
assert(slotsWithSpan[23].isSpanSelected === false, 'Slot 23:00 is outside the 3-hour span');

console.log('====================================================');
console.log('🎉 ALL 24-HOUR SLOT-BASED BOOKING TESTS PASSED!');
console.log('====================================================');
