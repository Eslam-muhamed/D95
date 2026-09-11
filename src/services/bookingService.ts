import { supabase } from '@/lib/supabase';
import type { DBBooking, BookingPolicy } from '@/types/database';
import {
    type BookingInterval,
    createDateTimeFromBusinessDate,
    calculateEndDateTime,
    getBusinessOperatingWindow,
    formatArabicTimeFromDate,
} from '@/lib/bookingDatetime';

export async function fetchRoomOccupiedIntervals(
    roomId: string,
    businessDate: string,
    windowStart?: Date,
    windowEnd?: Date
): Promise<BookingInterval[]> {
    try {
        const { data, error } = await supabase.rpc('get_room_occupied_intervals', {
            p_room_id: roomId,
            p_business_date: businessDate,
            p_window_start: windowStart ? windowStart.toISOString() : null,
            p_window_end: windowEnd ? windowEnd.toISOString() : null
        });

        if (!error && Array.isArray(data)) {
            return data.map((item: { start_datetime: string; end_datetime: string }) => ({
                start: new Date(item.start_datetime),
                end: new Date(item.end_datetime),
            }));
        }

        // Fallback: direct table select for anon/authenticated if RPC fails
        let query = supabase
            .from('ps_bookings')
            .select('start_datetime, end_datetime, status')
            .eq('room_id', roomId)
            .in('status', ['confirmed', 'completed']);

        if (windowStart && windowEnd) {
            query = query
                .lt('start_datetime', windowEnd.toISOString())
                .gt('end_datetime', windowStart.toISOString());
        } else {
            query = query.eq('booking_date', businessDate);
        }

        const { data: fallbackData, error: fallbackError } = await query;
        if (fallbackError) {
            console.error('Error fetching room intervals fallback:', fallbackError);
            return [];
        }

        return (fallbackData || []).map((item: { start_datetime: string; end_datetime: string; status?: string }) => ({
            start: new Date(item.start_datetime),
            end: new Date(item.end_datetime),
            status: item.status
        }));
    } catch (err) {
        console.error('Exception fetching room intervals:', err);
        return [];
    }
}

export async function createBooking(booking: Omit<DBBooking, 'id' | 'created_at'>): Promise<DBBooking> {
    const cleanBooking = {
        ...booking,
        customer_name: booking.customer_name.trim(),
        customer_phone: booking.customer_phone.replace(/\D/g, ''),
        notes: booking.notes?.trim() || null,
        reservation_id: booking.reservation_id.trim().toUpperCase(),
        room_id: booking.room_id || 'room-1',
    };

    // Try atomic RPC first for complete server-side validation & exclusion protection
    try {
        const { data, error } = await supabase.rpc('create_booking_atomic', {
            p_booking: cleanBooking
        });

        if (error) {
            console.warn('RPC create_booking_atomic failed, inspecting error:', error);
            if (error.code === '23P01' || error.message.includes('23P01') || error.message.includes('تعارض') || error.message.includes('محجوز')) {
                throw new Error('عذراً، هذا الموعد تم حجزه للتو أو يتعارض مع حجز قائم. يرجى اختيار موعد آخر.');
            }
            if (error.message.includes('الحد الأدنى') || error.message.includes('ساعة واحدة')) {
                throw new Error('الحد الأدنى للحجز هو ساعة واحدة.');
            }
            if (error.message.includes('مضى')) {
                throw new Error('لا يمكن حجز موعد في الماضي.');
            }
            // If it's a general server error or permission, fallback to direct insert protected by Exclusion Constraint
            throw error;
        }

        if (data) {
            return data as DBBooking;
        }
    } catch (rpcErr: unknown) {
        const errMsg = rpcErr instanceof Error ? rpcErr.message : String(rpcErr);
        // If error was an explicit conflict or validation, rethrow immediately
        if (
            errMsg.includes('تم حجزه') || 
            errMsg.includes('تعارض') || 
            errMsg.includes('الحد الأدنى') ||
            errMsg.includes('الماضي')
        ) {
            throw rpcErr;
        }

        // Otherwise fallback to direct insert which is STILL strictly protected by the Postgres Exclusion Constraint
        const { data, error } = await supabase
            .from('ps_bookings')
            .insert([cleanBooking])
            .select()
            .single();

        if (error) {
            console.error('Direct insert failed:', error);
            if (error.code === '23P01' || error.message.includes('no_overlapping_bookings') || error.message.includes('exclusion')) {
                throw new Error('عذراً، هذا الموعد تم حجزه للتو أو يتعارض مع حجز قائم. يرجى اختيار موعد آخر.');
            }
            throw new Error(error.message || 'فشل تسجيل الحجز في قاعدة البيانات');
        }

        return data as DBBooking;
    }

    throw new Error('تعذر إتمام الحجز');
}

export async function fetchBookings(filter?: {
    status?: string;
    date?: string;
    search?: string;
}): Promise<DBBooking[]> {
    try {
        let query = supabase
            .from('ps_bookings')
            .select('*')
            .order('created_at', { ascending: false });

        if (filter?.status && filter.status !== 'all') {
            query = query.eq('status', filter.status);
        }

        if (filter?.date) {
            query = query.eq('booking_date', filter.date);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching bookings:', error);
            return [];
        }

        let bookings = (data || []) as DBBooking[];

        if (filter?.search) {
            const s = filter.search.toLowerCase();
            bookings = bookings.filter(b =>
                b.customer_name.toLowerCase().includes(s) ||
                b.customer_phone.includes(s) ||
                b.reservation_id.toLowerCase().includes(s) ||
                b.room_name.toLowerCase().includes(s)
            );
        }

        return bookings;
    } catch (err) {
        console.error('Exception fetching bookings:', err);
        return [];
    }
}

export async function updateBookingStatus(
    id: string,
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
): Promise<DBBooking> {
    const { data, error } = await supabase
        .from('ps_bookings')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating booking status:', error);
        if (error.code === '23P01' || error.message.includes('no_overlapping_bookings') || error.message.includes('exclusion')) {
            throw new Error('تعذر تأكيد هذا الحجز: يوجد حجز مؤكد آخر يتعارض معه في نفس الغرفة والموعد 🔒');
        }
        throw error;
    }
    return data as DBBooking;
}

export async function deleteBooking(id: string): Promise<void> {
    const { error } = await supabase
        .from('ps_bookings')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export interface ConflictingBookingShiftInfo {
    booking: DBBooking;
    currentStart: Date;
    currentEnd: Date;
    shiftedStart: Date;
    shiftedEnd: Date;
    shiftedStartTimeStr: string;
    shiftedEndTimeStr: string;
}

export interface ExtensionPreviewInfo {
    currentStart: Date;
    currentEnd: Date;
    newEnd: Date;
    newEndTimeStr: string;
    newDurationHours: number;
    hourlyRate: number;
    suggestedExtraPrice: number;
    conflictingBookings: ConflictingBookingShiftInfo[];
    exceedsClosing: boolean;
}

export interface ExtendBookingResult {
    success: boolean;
    extendedBooking: DBBooking;
    shiftedBookings: DBBooking[];
}

export function parseTimeTo24(timeStr: string): string {
    if (!timeStr) return '00:00';
    const isPM = timeStr.includes('م') || timeStr.toLowerCase().includes('pm');
    const isAM = timeStr.includes('ص') || timeStr.toLowerCase().includes('am');

    const clean = timeStr.replace(/[^\d:]/g, '').trim();
    const parts = clean.split(':');
    let h = parseInt(parts[0] || '0', 10);
    const m = parseInt(parts[1] || '0', 10);

    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getBookingDates(b: DBBooking): { start: Date; end: Date } {
    let start = b.start_datetime ? new Date(b.start_datetime) : null;
    let end = b.end_datetime ? new Date(b.end_datetime) : null;

    if (!start || isNaN(start.getTime())) {
        const time24 = parseTimeTo24(b.start_time);
        start = createDateTimeFromBusinessDate(b.booking_date, time24);
    }
    if (!end || isNaN(end.getTime())) {
        end = calculateEndDateTime(start, b.duration_hours || 1);
    }
    return { start, end };
}

export function calculateBookingExtensionInfo(
    targetBooking: DBBooking,
    allSameRoomBookings: DBBooking[],
    extensionMinutes: number
): ExtensionPreviewInfo {
    const { start: currentStart, end: currentEnd } = getBookingDates(targetBooking);
    const newEnd = new Date(currentEnd.getTime() + extensionMinutes * 60 * 1000);
    const newEndTimeStr = formatArabicTimeFromDate(newEnd);

    const duration = targetBooking.duration_hours || 1;
    const hourlyRate = (targetBooking.subtotal || targetBooking.total_amount || 100) / duration;
    const suggestedExtraPrice = Math.round(hourlyRate * (extensionMinutes / 60));
    const newDurationHours = Number((duration + extensionMinutes / 60).toFixed(2));

    // Operating window closing check (04:00 AM next day)
    const { closing } = getBusinessOperatingWindow(targetBooking.booking_date);
    const exceedsClosing = newEnd.getTime() > closing.getTime();

    // Check chained conflicts
    const conflictingBookings: ConflictingBookingShiftInfo[] = [];
    let currentThreshold = newEnd;

    const otherBookings = allSameRoomBookings
        .filter(b => b.id !== targetBooking.id && ['pending', 'confirmed', 'completed'].includes(b.status))
        .map(b => {
            const dates = getBookingDates(b);
            return { booking: b, ...dates };
        })
        .sort((a, b) => a.start.getTime() - b.start.getTime());

    for (const item of otherBookings) {
        // If this booking starts before the current threshold and ends after currentEnd
        if (item.start.getTime() >= currentEnd.getTime() - 60000 && item.start.getTime() < currentThreshold.getTime()) {
            const shiftedStart = new Date(item.start.getTime() + extensionMinutes * 60 * 1000);
            const shiftedEnd = new Date(item.end.getTime() + extensionMinutes * 60 * 1000);
            conflictingBookings.push({
                booking: item.booking,
                currentStart: item.start,
                currentEnd: item.end,
                shiftedStart,
                shiftedEnd,
                shiftedStartTimeStr: formatArabicTimeFromDate(shiftedStart),
                shiftedEndTimeStr: formatArabicTimeFromDate(shiftedEnd),
            });
            // Extend threshold for cascading shifts
            currentThreshold = shiftedEnd;
        }
    }

    return {
        currentStart,
        currentEnd,
        newEnd,
        newEndTimeStr,
        newDurationHours,
        hourlyRate,
        suggestedExtraPrice,
        conflictingBookings,
        exceedsClosing,
    };
}

export async function extendBookingAndShiftConflicting(
    bookingId: string,
    extensionMinutes: number,
    extraPrice: number,
    autoShift: boolean
): Promise<ExtendBookingResult> {
    // 1. Fetch target booking
    const { data: targetBooking, error: fetchErr } = await supabase
        .from('ps_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

    if (fetchErr || !targetBooking) {
        throw new Error('تعذر العثور على بيانات الحجز في قاعدة البيانات');
    }

    // 2. Fetch other bookings in the same room on the same date
    const { data: sameRoomBookings, error: roomErr } = await supabase
        .from('ps_bookings')
        .select('*')
        .eq('room_id', targetBooking.room_id)
        .in('status', ['pending', 'confirmed', 'completed']);

    if (roomErr) throw roomErr;

    const preview = calculateBookingExtensionInfo(
        targetBooking as DBBooking,
        (sameRoomBookings || []) as DBBooking[],
        extensionMinutes
    );

    if (preview.conflictingBookings.length > 0 && !autoShift) {
        throw new Error('يوجد تعارض مع حجوزات تالية. يرجى تفعيل خيار ترحيل الحجز التالي.');
    }

    // 3. Prepare atomic payload for PostgreSQL RPC
    const newSubtotal = Number(((targetBooking.subtotal || 0) + extraPrice).toFixed(2));
    const newTotal = Number(((targetBooking.total_amount || 0) + extraPrice).toFixed(2));

    const shiftsPayload = preview.conflictingBookings.map(item => ({
        id: item.booking.id,
        start_datetime: item.shiftedStart.toISOString(),
        end_datetime: item.shiftedEnd.toISOString(),
        start_time: item.shiftedStartTimeStr,
        end_time: item.shiftedEndTimeStr,
    }));

    const targetUpdatesPayload = {
        end_datetime: preview.newEnd.toISOString(),
        end_time: preview.newEndTimeStr,
        duration_hours: preview.newDurationHours,
        subtotal: newSubtotal,
        total_amount: newTotal,
    };

    // Try atomic RPC in a single transaction
    const { data: atomicData, error: atomicErr } = await supabase.rpc('extend_booking_atomic', {
        p_booking_id: bookingId,
        p_target_updates: targetUpdatesPayload,
        p_shifts: shiftsPayload,
    });

    if (!atomicErr && atomicData) {
        // Construct shifted objects for UI state update
        const shiftedBookings: DBBooking[] = preview.conflictingBookings.map(item => ({
            ...item.booking,
            start_datetime: item.shiftedStart.toISOString(),
            end_datetime: item.shiftedEnd.toISOString(),
            start_time: item.shiftedStartTimeStr,
            end_time: item.shiftedEndTimeStr,
        }));

        return {
            success: true,
            extendedBooking: atomicData as DBBooking,
            shiftedBookings,
        };
    }

    if (atomicErr) {
        console.warn('extend_booking_atomic RPC failed, trying fallback:', atomicErr.message);
    }

    // Fallback: reverse order updates
    const shiftedResults: DBBooking[] = [];
    for (let i = preview.conflictingBookings.length - 1; i >= 0; i--) {
        const item = preview.conflictingBookings[i];
        const { data: updatedShifted, error: shiftErr } = await supabase
            .from('ps_bookings')
            .update({
                start_datetime: item.shiftedStart.toISOString(),
                end_datetime: item.shiftedEnd.toISOString(),
                start_time: item.shiftedStartTimeStr,
                end_time: item.shiftedEndTimeStr,
            })
            .eq('id', item.booking.id)
            .select()
            .single();

        if (shiftErr) {
            console.error('Error shifting conflicting booking:', shiftErr);
            throw new Error(`تعذر ترحيل حجز ${item.booking.customer_name}: ${shiftErr.message}`);
        }
        shiftedResults.unshift(updatedShifted as DBBooking);
    }

    const { data: updatedTarget, error: updateErr } = await supabase
        .from('ps_bookings')
        .update(targetUpdatesPayload)
        .eq('id', bookingId)
        .select()
        .single();

    if (updateErr) {
        console.error('Error extending target booking:', updateErr);
        throw new Error(`تعذر تمديد الحجز: ${updateErr.message}`);
    }

    return {
        success: true,
        extendedBooking: updatedTarget as DBBooking,
        shiftedBookings: shiftedResults,
    };
}

export async function fetchBookingPolicy(): Promise<BookingPolicy> {
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'booking_policy')
            .maybeSingle();

        if (!error && data?.value) {
            return data.value as BookingPolicy;
        }
    } catch (err) {
        console.error('Error fetching booking policy:', err);
    }
    return { mode: 'temporary_hold', hold_minutes: 10 };
}

export async function updateBookingPolicy(policy: BookingPolicy): Promise<BookingPolicy> {
    const { error } = await supabase
        .from('app_settings')
        .upsert({
            key: 'booking_policy',
            value: policy,
            updated_at: new Date().toISOString(),
        });

    if (error) {
        console.error('Error updating booking policy:', error);
        throw error;
    }
    return policy;
}

export async function confirmBookingAndResolveConflicts(
    bookingId: string,
    autoCancelConflicts: boolean = true
): Promise<{ confirmedBooking: DBBooking; cancelledIds: string[] }> {
    try {
        const { data, error } = await supabase.rpc('confirm_booking_and_resolve_conflicts', {
            p_booking_id: bookingId,
            p_auto_cancel_conflicts: autoCancelConflicts,
        });

        if (error) {
            if (
                error.code === '23P01' ||
                error.message.includes('23P01') ||
                error.message.includes('تعارض') ||
                error.message.includes('مؤكد بالفعل')
            ) {
                throw new Error('لا يمكن تأكيد الحجز لوجود حجز آخر مؤكد بالفعل في نفس التوقيت');
            }
            throw error;
        }

        return {
            confirmedBooking: data.confirmed_booking as DBBooking,
            cancelledIds: (data.cancelled_conflict_ids || []) as string[],
        };
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes('مؤكد بالفعل') || errMsg.includes('23P01')) {
            throw err;
        }
        console.warn('RPC confirm_booking_and_resolve_conflicts fallback:', err);
        const confirmed = await updateBookingStatus(bookingId, 'confirmed');
        return { confirmedBooking: confirmed, cancelledIds: [] };
    }
}

export interface ConflictGroup {
    id: string;
    roomId: string;
    roomName: string;
    bookingDate: string;
    formattedTimeRange: string;
    bookings: DBBooking[];
}

export function groupConflictingPendingBookings(allBookings: DBBooking[]): ConflictGroup[] {
    const pendingList = allBookings.filter((b) => b.status === 'pending');
    if (pendingList.length < 2) return [];

    const getRange = (b: DBBooking) => {
        let start: Date;
        let end: Date;
        if (b.start_datetime && b.end_datetime) {
            start = new Date(b.start_datetime);
            end = new Date(b.end_datetime);
        } else {
            start = createDateTimeFromBusinessDate(b.booking_date, b.start_time);
            end = calculateEndDateTime(start, b.duration_hours || 1);
        }
        return { start, end };
    };

    const isOverlap = (a: DBBooking, b: DBBooking) => {
        const roomIdA = a.room_id || 'room-1';
        const roomIdB = b.room_id || 'room-1';
        if (roomIdA !== roomIdB) return false;

        const rangeA = getRange(a);
        const rangeB = getRange(b);
        return rangeA.start < rangeB.end && rangeA.end > rangeB.start;
    };

    const visited = new Set<string>();
    const groups: ConflictGroup[] = [];

    for (let i = 0; i < pendingList.length; i++) {
        const b = pendingList[i];
        if (visited.has(b.id)) continue;

        const cluster: DBBooking[] = [b];
        visited.add(b.id);
        const queue: DBBooking[] = [b];

        while (queue.length > 0) {
            const curr = queue.shift()!;
            for (const other of pendingList) {
                if (!visited.has(other.id) && isOverlap(curr, other)) {
                    visited.add(other.id);
                    cluster.push(other);
                    queue.push(other);
                }
            }
        }

        if (cluster.length >= 2) {
            // Sort cluster by created_at ascending (earliest requester first)
            cluster.sort((x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime());

            let minStart = getRange(cluster[0]).start;
            let maxEnd = getRange(cluster[0]).end;
            for (const item of cluster) {
                const { start, end } = getRange(item);
                if (start < minStart) minStart = start;
                if (end > maxEnd) maxEnd = end;
            }

            const formattedTimeRange = `${formatArabicTimeFromDate(minStart)} - ${formatArabicTimeFromDate(maxEnd)}`;

            groups.push({
                id: `conflict-${cluster[0].room_id || 'room-1'}-${cluster[0].booking_date}-${minStart.getTime()}`,
                roomId: cluster[0].room_id || 'room-1',
                roomName: cluster[0].room_name,
                bookingDate: cluster[0].booking_date,
                formattedTimeRange,
                bookings: cluster,
            });
        }
    }

    return groups;
}
