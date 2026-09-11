/**
 * PlayStation Booking DateTime, Operating Hours, and Dynamic Availability Engine.
 * 
 * Operating hours:
 * 08:00 AM -> 04:00 AM the following calendar day (20 continuous hours).
 * 
 * Timeline:
 * 08:00 AM (Day 1) ────────────────────────────── 04:00 AM (Day 2)
 * 
 * Availability is continuous: rooms are AVAILABLE by default, and become unavailable
 * ONLY during the exact intervals occupied by confirmed/pending customer bookings.
 * 
 * Conflict condition:
 * (newStart < existingEnd) && (newEnd > existingStart)
 */

export const OPERATING_HOURS = {
    START_HOUR: 8,      // 08:00 AM
    START_MINUTE: 0,
    CLOSING_HOUR: 4,    // 04:00 AM next day
    CLOSING_MINUTE: 0,
    TOTAL_OPERATING_HOURS: 20,
    INTERVAL_MINUTES: 15,
    MIN_DURATION_HOURS: 1.0,
    MAX_DURATION_HOURS: 12.0,
};

export interface BookingInterval {
    start: Date;
    end: Date;
    status?: string;
    id?: string;
}

export interface TimeOption {
    time24: string;           // "08:15", "14:30", "01:15"
    displayTime: string;      // "08:15 ص", "02:30 م", "01:15 ص"
    periodName: string;       // "الفترة الصباحية", "فترة السهرة", etc.
    hour24: number;
    minute: number;
    isNextDay: boolean;       // true if between 00:00 and 04:00 AM
    startDateTime: Date;      // Full Date object for this business date
}

export interface AvailabilityResult {
    isAvailable: boolean;
    reason?: 'PAST_TIME' | 'INVALID_DURATION' | 'EXCEEDS_CLOSING' | 'OVERLAP_CONFLICT';
    conflictingInterval?: BookingInterval;
}

/**
 * Helper to add days to a YYYY-MM-DD string.
 */
export function addDaysToDateString(dateStr: string, days: number): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().split('T')[0];
}

/**
 * Helper to get the UTC offset in minutes for Africa/Cairo on a specific date.
 * Handles Egypt DST changes accurately.
 */
export function getCairoOffsetMinutes(d: Date): number {
    try {
        const str = d.toLocaleString('en-US', { timeZone: 'Africa/Cairo', timeZoneName: 'shortOffset' });
        const match = str.match(/GMT([+-]\d+)(?::(\d+))?/);
        if (match) {
            const hours = parseInt(match[1], 10);
            const mins = match[2] ? parseInt(match[2], 10) : 0;
            return (hours * 60) + (hours < 0 ? -mins : mins);
        }
    } catch {
        // Fallback: Egypt is UTC+3 in summer (Apr-Oct), UTC+2 in winter
    }
    const month = d.getUTCMonth();
    return (month >= 3 && month <= 9) ? 180 : 120;
}

/**
 * Format Arabic time display (e.g. 14:30 -> "02:30 م", 01:15 -> "01:15 ص").
 */
export function formatArabicTime(hour24: number, minute: number): string {
    const period = hour24 >= 12 && hour24 < 24 ? 'م' : 'ص';
    const displayHour = hour24 % 12 === 0 ? 12 : hour24 % 12;
    return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

/**
 * Format Arabic time from Date object pinned to Africa/Cairo timezone.
 */
export function formatArabicTimeFromDate(d: Date): string {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Africa/Cairo',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        });
        const parts = formatter.formatToParts(d);
        let h = 0;
        let m = 0;
        for (const part of parts) {
            if (part.type === 'hour') h = parseInt(part.value, 10);
            if (part.type === 'minute') m = parseInt(part.value, 10);
        }
        return formatArabicTime(h, m);
    } catch {
        return formatArabicTime(d.getHours(), d.getMinutes());
    }
}

/**
 * Period name based on 24-hour hour.
 */
export function getPeriodName(hour24: number): string {
    if (hour24 >= 6 && hour24 < 12) return 'الفترة الصباحية';
    if (hour24 >= 12 && hour24 < 16) return 'فترة الظهيرة';
    if (hour24 >= 16 && hour24 < 19) return 'فترة العصر';
    if (hour24 >= 19 && hour24 < 24) return 'الفترة المسائية';
    return 'فترة السهرة والليل';
}

/**
 * Convert a businessDate and a time24 string (e.g. "23:30" or "01:15") into an exact Date object in Cairo time.
 * If hour < 8 (e.g. 00:00 to 04:00), it belongs to the next calendar day.
 */
export function createDateTimeFromBusinessDate(businessDate: string, time24: string): Date {
    const [hStr, mStr] = time24.split(':');
    const hour = parseInt(hStr, 10);
    const minute = parseInt(mStr, 10);

    const isNextDay = hour < OPERATING_HOURS.START_HOUR;
    const targetDateStr = isNextDay ? addDaysToDateString(businessDate, 1) : businessDate;

    const [y, m, d] = targetDateStr.split('-').map(Number);
    const approx = new Date(Date.UTC(y, m - 1, d, hour, minute));
    const offsetMins = getCairoOffsetMinutes(approx);
    const utcTimestamp = Date.UTC(y, m - 1, d, hour, minute, 0, 0) - (offsetMins * 60 * 1000);
    return new Date(utcTimestamp);
}

/**
 * Get opening and closing Date objects for a business date pinned to Cairo time.
 * Opening: businessDate 08:00:00
 * Closing: (businessDate + 1 day) 04:00:00
 */
export function getBusinessOperatingWindow(businessDate: string): { opening: Date; closing: Date } {
    const opening = createDateTimeFromBusinessDate(businessDate, '08:00');
    const closing = createDateTimeFromBusinessDate(businessDate, '04:00');
    return { opening, closing };
}

/**
 * Generate all 15-minute start time options throughout the 20-hour operating window.
 * From 08:00 AM of businessDate up to 03:45 AM of next calendar day.
 */
export function generateStartTimeOptions(businessDate: string): TimeOption[] {
    const options: TimeOption[] = [];
    const totalMinutes = OPERATING_HOURS.TOTAL_OPERATING_HOURS * 60; // 1200 mins

    for (let offset = 0; offset < totalMinutes; offset += OPERATING_HOURS.INTERVAL_MINUTES) {
        const totalStartMinutes = (OPERATING_HOURS.START_HOUR * 60) + offset;
        const hour24 = Math.floor(totalStartMinutes / 60) % 24;
        const minute = totalStartMinutes % 60;

        const time24 = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const isNextDay = hour24 < OPERATING_HOURS.START_HOUR;
        const startDateTime = createDateTimeFromBusinessDate(businessDate, time24);

        options.push({
            time24,
            displayTime: formatArabicTime(hour24, minute),
            periodName: getPeriodName(hour24),
            hour24,
            minute,
            isNextDay,
            startDateTime,
        });
    }

    return options;
}

/**
 * Calculate the latest start time for a given duration so booking does not exceed closing (04:00 AM next day).
 * latestStartTime = closing - duration.
 */
export function getLatestAllowedStartTime(businessDate: string, durationHours: number): Date {
    const { closing } = getBusinessOperatingWindow(businessDate);
    return new Date(closing.getTime() - durationHours * 3600 * 1000);
}

/**
 * Calculate the end Date from start Date and duration in hours.
 */
export function calculateEndDateTime(startDateTime: Date, durationHours: number): Date {
    return new Date(startDateTime.getTime() + durationHours * 3600 * 1000);
}

/**
 * Core mathematical overlap detection:
 * Conflict exists IF AND ONLY IF:
 * newStart < existingEnd AND newEnd > existingStart
 */
export function doesIntervalOverlap(
    newStart: Date,
    newEnd: Date,
    existingStart: Date,
    existingEnd: Date
): boolean {
    return newStart.getTime() < existingEnd.getTime() && newEnd.getTime() > existingStart.getTime();
}

/**
 * Check availability of a proposed booking window against:
 * 1. Minimum duration
 * 2. Operating hours boundary (closing at 04:00 AM next day)
 * 3. Past time (if start is in the past)
 * 4. Existing bookings overlap
 */
export function checkAvailability(
    startDateTime: Date,
    durationHours: number,
    businessDate: string,
    existingBookings: BookingInterval[],
    now: Date = new Date()
): AvailabilityResult {
    if (durationHours < OPERATING_HOURS.MIN_DURATION_HOURS) {
        return { isAvailable: false, reason: 'INVALID_DURATION' };
    }

    // 1. Past time check
    // Allow 3 minutes of clock leeway for slow submitters
    if (startDateTime.getTime() < (now.getTime() - 3 * 60 * 1000)) {
        return { isAvailable: false, reason: 'PAST_TIME' };
    }

    const { opening, closing } = getBusinessOperatingWindow(businessDate);
    const endDateTime = calculateEndDateTime(startDateTime, durationHours);

    // 2. Must be within operating hours
    if (startDateTime.getTime() < opening.getTime() || endDateTime.getTime() > closing.getTime()) {
        return { isAvailable: false, reason: 'EXCEEDS_CLOSING' };
    }

    // 3. Overlap check against all blocking bookings
    for (const booking of existingBookings) {
        // Skip cancelled or non-blocking bookings if marked
        if (booking.status && booking.status === 'cancelled') {
            continue;
        }

        if (doesIntervalOverlap(startDateTime, endDateTime, booking.start, booking.end)) {
            return {
                isAvailable: false,
                reason: 'OVERLAP_CONFLICT',
                conflictingInterval: booking,
            };
        }
    }

    return { isAvailable: true };
}

/**
 * Get continuous free (available) and busy (booked) segments for timeline visualization.
 */
export function getTimelineSegments(
    businessDate: string,
    existingBookings: BookingInterval[]
): Array<{ start: Date; end: Date; isBooked: boolean; percentStart: number; percentWidth: number }> {
    const { opening, closing } = getBusinessOperatingWindow(businessDate);
    const totalDurationMs = closing.getTime() - opening.getTime();

    // Filter and clamp active bookings to this operating window
    const validBookings = existingBookings
        .filter(b => (!b.status || b.status !== 'cancelled') && b.start < closing && b.end > opening)
        .map(b => ({
            start: new Date(Math.max(b.start.getTime(), opening.getTime())),
            end: new Date(Math.min(b.end.getTime(), closing.getTime()))
        }))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

    // Merge any overlapping or contiguous booked intervals
    const mergedBookings: { start: Date; end: Date }[] = [];
    for (const b of validBookings) {
        if (mergedBookings.length === 0) {
            mergedBookings.push(b);
        } else {
            const last = mergedBookings[mergedBookings.length - 1];
            if (b.start.getTime() <= last.end.getTime()) {
                last.end = new Date(Math.max(last.end.getTime(), b.end.getTime()));
            } else {
                mergedBookings.push(b);
            }
        }
    }

    // Build alternating free and booked segments
    const segments: Array<{ start: Date; end: Date; isBooked: boolean; percentStart: number; percentWidth: number }> = [];
    let current = opening;

    for (const b of mergedBookings) {
        if (b.start.getTime() > current.getTime()) {
            const percentStart = ((current.getTime() - opening.getTime()) / totalDurationMs) * 100;
            const percentWidth = ((b.start.getTime() - current.getTime()) / totalDurationMs) * 100;
            segments.push({ start: current, end: b.start, isBooked: false, percentStart, percentWidth });
        }
        const percentStart = ((b.start.getTime() - opening.getTime()) / totalDurationMs) * 100;
        const percentWidth = ((b.end.getTime() - b.start.getTime()) / totalDurationMs) * 100;
        segments.push({ start: b.start, end: b.end, isBooked: true, percentStart, percentWidth });
        current = b.end;
    }

    if (current.getTime() < closing.getTime()) {
        const percentStart = ((current.getTime() - opening.getTime()) / totalDurationMs) * 100;
        const percentWidth = ((closing.getTime() - current.getTime()) / totalDurationMs) * 100;
        segments.push({ start: current, end: closing, isBooked: false, percentStart, percentWidth });
    }

    return segments;
}
