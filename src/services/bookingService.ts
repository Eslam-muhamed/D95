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

export interface PaginatedBookingsResult {
    bookings: DBBooking[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export async function fetchPaginatedBookings(filter?: {
    status?: string;
    date?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}): Promise<PaginatedBookingsResult> {
    const page = Math.max(1, filter?.page || 1);
    const pageSize = Math.max(5, Math.min(100, filter?.pageSize || 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
        // Automatically auto-cancel any expired pending bookings first
        if (!filter?.status || filter.status === 'pending' || filter.status === 'all') {
            await autoCancelExpiredPendingBookings();
        }

        let query = supabase
            .from('ps_bookings')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (filter?.status && filter.status !== 'all') {
            query = query.eq('status', filter.status);
            // If filtering specifically by pending, only include future appointments
            if (filter.status === 'pending') {
                query = query.gt('end_datetime', new Date().toISOString());
            }
        }

        if (filter?.date) {
            query = query.eq('booking_date', filter.date);
        }

        if (filter?.search) {
            const s = filter.search.trim();
            query = query.or(`customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%,reservation_id.ilike.%${s}%,room_name.ilike.%${s}%`);
        }

        const { data, count, error } = await query.range(from, to);

        if (error) {
            console.error('Error fetching paginated bookings:', error);
            return { bookings: [], totalCount: 0, page, pageSize, totalPages: 1 };
        }

        const totalCount = count || 0;
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

        return {
            bookings: (data || []) as DBBooking[],
            totalCount,
            page,
            pageSize,
            totalPages,
        };
    } catch (err) {
        console.error('Exception in fetchPaginatedBookings:', err);
        return { bookings: [], totalCount: 0, page, pageSize, totalPages: 1 };
    }
}

export async function autoCancelExpiredPendingBookings(): Promise<number> {
    try {
        const { data, error } = await supabase.rpc('auto_cancel_expired_pending_bookings');
        if (error) {
            console.warn('RPC auto_cancel_expired_pending_bookings error, running fallback:', error);
            const nowIso = new Date().toISOString();
            const { data: expired } = await supabase
                .from('ps_bookings')
                .select('id')
                .eq('status', 'pending')
                .lte('end_datetime', nowIso);
            if (expired && expired.length > 0) {
                const ids = expired.map(x => x.id);
                await supabase
                    .from('ps_bookings')
                    .update({
                        status: 'cancelled',
                        notes: 'تم الإلغاء تلقائياً لانتهاء وقت الموعد دون اعتماد',
                    })
                    .in('id', ids);
                return ids.length;
            }
            return 0;
        }
        return Number(data || 0);
    } catch (e) {
        console.warn('Exception in autoCancelExpiredPendingBookings:', e);
        return 0;
    }
}

export async function fetchBookingMetrics(): Promise<{
    totalCount: number;
    pendingCount: number;
    confirmedCount: number;
    todayCount: number;
    totalRevenue: number;
    todayRevenue: number;
    recentPending: DBBooking[];
    pendingCountsByDate: Record<string, number>;
}> {
    try {
        // Automatically auto-cancel any expired pending bookings first
        await autoCancelExpiredPendingBookings();

        const todayStr = new Date().toISOString().split('T')[0];
        const nowIso = new Date().toISOString();

        const [
            totalRes,
            pendingRes,
            confirmedRes,
            todayRes,
            revenueRes,
            todayRevenueRes,
            recentRes,
            pendingDatesRes,
        ] = await Promise.all([
            supabase.from('ps_bookings').select('id', { count: 'exact', head: true }).neq('status', 'cancelled'),
            supabase.from('ps_bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending').gt('end_datetime', nowIso),
            supabase.from('ps_bookings').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
            supabase.from('ps_bookings').select('id', { count: 'exact', head: true }).eq('booking_date', todayStr),
            supabase.from('ps_bookings').select('total_amount').eq('status', 'confirmed'),
            supabase.from('ps_bookings').select('total_amount').eq('booking_date', todayStr).eq('status', 'confirmed'),
            supabase.from('ps_bookings').select('*').eq('status', 'pending').gt('end_datetime', nowIso).order('created_at', { ascending: false }).limit(50),
            supabase.from('ps_bookings').select('booking_date').eq('status', 'pending').gt('end_datetime', nowIso),
        ]);

        const totalRevenue = (revenueRes.data || []).reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
        const todayRevenue = (todayRevenueRes.data || []).reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

        const pendingCountsByDate: Record<string, number> = {};
        (pendingDatesRes.data || []).forEach((item: { booking_date: string }) => {
            if (item.booking_date) {
                pendingCountsByDate[item.booking_date] = (pendingCountsByDate[item.booking_date] || 0) + 1;
            }
        });

        return {
            totalCount: totalRes.count || 0,
            pendingCount: pendingRes.count || 0,
            confirmedCount: confirmedRes.count || 0,
            todayCount: todayRes.count || 0,
            totalRevenue: Math.round(totalRevenue),
            todayRevenue: Math.round(todayRevenue),
            recentPending: (recentRes.data || []) as DBBooking[],
            pendingCountsByDate,
        };
    } catch (err) {
        console.error('Error fetching booking metrics:', err);
        return {
            totalCount: 0,
            pendingCount: 0,
            confirmedCount: 0,
            todayCount: 0,
            totalRevenue: 0,
            todayRevenue: 0,
            recentPending: [],
            pendingCountsByDate: {},
        };
    }
}

export async function fetchPendingCountsByDate(): Promise<Record<string, number>> {
    try {
        const nowIso = new Date().toISOString();
        const { data, error } = await supabase
            .from('ps_bookings')
            .select('booking_date')
            .eq('status', 'pending')
            .gt('end_datetime', nowIso);
        if (error) {
            console.error('Error fetching pending counts by date:', error);
            return {};
        }
        const counts: Record<string, number> = {};
        (data || []).forEach((item: { booking_date: string }) => {
            if (item.booking_date) {
                counts[item.booking_date] = (counts[item.booking_date] || 0) + 1;
            }
        });
        return counts;
    } catch (err) {
        console.error('Exception in fetchPendingCountsByDate:', err);
        return {};
    }
}

export async function fetchBookings(filter?: {
    status?: string;
    date?: string;
    search?: string;
}): Promise<DBBooking[]> {
    const res = await fetchPaginatedBookings({ ...filter, page: 1, pageSize: 50 });
    return res.bookings;
}

/**
 * Fetch all bookings for a specific calendar date, chronologically sorted by start time.
 */
export async function fetchBookingsForDate(dateStr: string): Promise<DBBooking[]> {
    try {
        const { data, error } = await supabase
            .from('ps_bookings')
            .select('*')
            .eq('booking_date', dateStr);

        if (error) {
            console.error('Error fetching bookings for date:', error);
            return [];
        }

        const list = (data || []) as DBBooking[];
        return list.sort((a, b) => {
            const timeA = getBookingDates(a).start.getTime();
            const timeB = getBookingDates(b).start.getTime();
            return timeA - timeB;
        });
    } catch (err) {
        console.error('Exception in fetchBookingsForDate:', err);
        return [];
    }
}

/**
 * Fetch recent incoming bookings, optionally filtered by date or status, ordered by created_at DESC.
 */
export async function fetchRecentBookings(options?: {
    date?: string;
    status?: string;
    limit?: number;
}): Promise<DBBooking[]> {
    try {
        await autoCancelExpiredPendingBookings();
        let query = supabase
            .from('ps_bookings')
            .select('*')
            .order('created_at', { ascending: false });

        if (options?.date) {
            query = query.eq('booking_date', options.date);
        }
        if (options?.status && options.status !== 'all') {
            query = query.eq('status', options.status);
            if (options.status === 'pending') {
                query = query.gt('end_datetime', new Date().toISOString());
            }
        }
        query = query.limit(options?.limit || 50);

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching recent bookings:', error);
            return [];
        }
        return (data || []) as DBBooking[];
    } catch (err) {
        console.error('Exception in fetchRecentBookings:', err);
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
    isPastEnd: boolean;
    isNewEndPast: boolean;
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

    const now = Date.now();
    const isPastEnd = currentEnd.getTime() <= now;
    const isNewEndPast = newEnd.getTime() <= now;

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
        isPastEnd,
        isNewEndPast,
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

    if (preview.isNewEndPast) {
        throw new Error(`تعذر تمديد الحجز: وقت الانتهاء المقترح (${preview.newEndTimeStr}) يقع في الماضي بالفعل! لا يمكن تمديد حجز في الماضي.`);
    }

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
    const now = Date.now();
    const pendingList = allBookings.filter((b) => {
        if (b.status !== 'pending') return false;
        const { end } = getBookingDates(b);
        return end.getTime() > now;
    });
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

export interface RoomRates {
    'room-1': number;
    'room-2': number;
    [roomId: string]: number;
}

export async function fetchRoomRates(): Promise<RoomRates> {
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'room_rates')
            .maybeSingle();

        if (!error && data?.value) {
            return data.value as RoomRates;
        }
    } catch (err) {
        console.error('Error fetching room rates:', err);
    }
    return { 'room-1': 100, 'room-2': 100 };
}

export async function updateRoomRates(rates: RoomRates): Promise<RoomRates> {
    const { error } = await supabase
        .from('app_settings')
        .upsert({
            key: 'room_rates',
            value: rates,
            updated_at: new Date().toISOString(),
        });

    if (error) {
        console.error('Error updating room rates:', error);
        throw error;
    }
    return rates;
}
