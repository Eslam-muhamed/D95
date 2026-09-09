import { supabase } from '@/lib/supabase';
import type { DBBooking } from '@/types/database';
import type { BookingInterval } from '@/lib/bookingDatetime';

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
            .in('status', ['pending', 'confirmed', 'completed']);

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

    if (error) throw error;
    return data as DBBooking;
}

export async function deleteBooking(id: string): Promise<void> {
    const { error } = await supabase
        .from('ps_bookings')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
