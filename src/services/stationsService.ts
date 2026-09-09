import { supabase } from '@/lib/supabase';

export interface GamingStation {
    id: string;
    name: string;
    category: 'console' | 'recreation' | string;
    device_type: 'PS5' | 'PS4' | 'BILLIARDS' | 'VR' | 'PINGPONG' | string;
    rate_per_hour: number;
    multi_rate_per_hour: number;
    rate_per_match: number;
    status: 'available' | 'busy' | 'paused';
    display_order: number;
    created_at?: string;
}

export interface SessionOrderItem {
    id: string;
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    added_at: string;
}

export interface StationSession {
    id: string;
    station_id: string;
    customer_name: string;
    customer_phone?: string | null;
    pricing_mode: 'hourly' | 'match';
    time_system: 'open' | 'fixed';
    target_minutes?: number | null;
    is_multi: boolean;
    started_by: string;
    start_time: string;
    pause_time?: string | null;
    elapsed_seconds: number;
    status: 'active' | 'paused' | 'completed';
    notes: string;
    hourly_rate: number;
    orders: SessionOrderItem[];
    total_time_cost: number;
    orders_total: number;
    discount_amount: number;
    grand_total: number;
    payment_method?: string | null;
    ended_at?: string | null;
    created_at?: string;
}

// Fallback initial stations if offline or fresh install
const DEFAULT_STATIONS: GamingStation[] = [
    {
        id: 'room-1',
        name: 'Room 1',
        category: 'console',
        device_type: 'PS5',
        rate_per_hour: 50,
        multi_rate_per_hour: 70,
        rate_per_match: 0,
        status: 'available',
        display_order: 1,
    },
    {
        id: 'room-2',
        name: 'Room 2',
        category: 'console',
        device_type: 'PS5',
        rate_per_hour: 50,
        multi_rate_per_hour: 70,
        rate_per_match: 0,
        status: 'available',
        display_order: 2,
    },
    {
        id: 'billiards-1',
        name: 'Billiards',
        category: 'recreation',
        device_type: 'BILLIARDS',
        rate_per_hour: 60,
        multi_rate_per_hour: 60,
        rate_per_match: 30,
        status: 'available',
        display_order: 3,
    },
];

const LOCAL_SESSIONS_KEY = 'd95_active_station_sessions';
const LOCAL_STATIONS_KEY = 'd95_cached_stations';

// Fetch all gaming stations
export async function fetchGamingStations(): Promise<GamingStation[]> {
    try {
        const { data, error } = await supabase
            .from('gaming_stations')
            .select('*')
            .order('display_order', { ascending: true });

        if (error || !data || data.length === 0) {
            const cached = localStorage.getItem(LOCAL_STATIONS_KEY);
            return cached ? JSON.parse(cached) : DEFAULT_STATIONS;
        }

        const stations: GamingStation[] = data.map((row) => ({
            id: row.id,
            name: row.name,
            category: row.category,
            device_type: row.device_type,
            rate_per_hour: Number(row.rate_per_hour),
            multi_rate_per_hour: Number(row.multi_rate_per_hour || row.rate_per_hour),
            rate_per_match: Number(row.rate_per_match || 0),
            status: row.status,
            display_order: row.display_order,
            created_at: row.created_at,
        }));

        localStorage.setItem(LOCAL_STATIONS_KEY, JSON.stringify(stations));
        return stations;
    } catch (e) {
        console.error('Failed to fetch stations:', e);
        const cached = localStorage.getItem(LOCAL_STATIONS_KEY);
        return cached ? JSON.parse(cached) : DEFAULT_STATIONS;
    }
}

// Fetch all active sessions
export async function fetchActiveSessions(): Promise<Record<string, StationSession>> {
    try {
        const { data, error } = await supabase
            .from('station_sessions')
            .select('*')
            .in('status', ['active', 'paused']);

        if (error || !data) {
            const cached = localStorage.getItem(LOCAL_SESSIONS_KEY);
            return cached ? JSON.parse(cached) : {};
        }

        const sessionsMap: Record<string, StationSession> = {};
        for (const row of data) {
            sessionsMap[row.station_id] = {
                id: row.id,
                station_id: row.station_id,
                customer_name: row.customer_name || 'عميل عام',
                customer_phone: row.customer_phone,
                pricing_mode: row.pricing_mode || 'hourly',
                time_system: row.time_system || 'open',
                target_minutes: row.target_minutes,
                is_multi: Boolean(row.is_multi),
                started_by: row.started_by || 'المدير',
                start_time: row.start_time,
                pause_time: row.pause_time,
                elapsed_seconds: Number(row.elapsed_seconds || 0),
                status: row.status,
                notes: row.notes || '',
                hourly_rate: Number(row.hourly_rate || 50),
                orders: Array.isArray(row.orders) ? row.orders : [],
                total_time_cost: Number(row.total_time_cost || 0),
                orders_total: Number(row.orders_total || 0),
                discount_amount: Number(row.discount_amount || 0),
                grand_total: Number(row.grand_total || 0),
                payment_method: row.payment_method,
                created_at: row.created_at,
            };
        }

        localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(sessionsMap));
        return sessionsMap;
    } catch (e) {
        console.error('Failed to fetch active sessions:', e);
        const cached = localStorage.getItem(LOCAL_SESSIONS_KEY);
        return cached ? JSON.parse(cached) : {};
    }
}

// Start a new session
export async function startStationSession(params: {
    station_id: string;
    customer_name?: string;
    pricing_mode: 'hourly' | 'match';
    time_system: 'open' | 'fixed';
    target_minutes?: number;
    is_multi: boolean;
    started_by?: string;
    hourly_rate: number;
}): Promise<StationSession> {
    const newSession = {
        station_id: params.station_id,
        customer_name: params.customer_name || 'عميل عام',
        pricing_mode: params.pricing_mode,
        time_system: params.time_system,
        target_minutes: params.target_minutes || null,
        is_multi: params.is_multi,
        started_by: params.started_by || 'المدير',
        start_time: new Date().toISOString(),
        elapsed_seconds: 0,
        status: 'active' as const,
        notes: '',
        hourly_rate: params.hourly_rate,
        orders: [] as SessionOrderItem[],
        total_time_cost: 0,
        orders_total: 0,
        discount_amount: 0,
        grand_total: 0,
    };

    try {
        const { data, error } = await supabase
            .from('station_sessions')
            .insert([newSession])
            .select()
            .single();

        if (error || !data) {
            throw error || new Error('Failed to insert session');
        }

        // Update station status to busy
        await supabase
            .from('gaming_stations')
            .update({ status: 'busy' })
            .eq('id', params.station_id);

        return {
            ...data,
            orders: data.orders || [],
        };
    } catch (err) {
        console.warn('Supabase session insert fallback to local:', err);
        const fallbackSession: StationSession = {
            id: 'local_' + Date.now(),
            ...newSession,
        };
        return fallbackSession;
    }
}

// Pause session
export async function pauseStationSession(sessionId: string, stationId: string, currentElapsedSeconds: number) {
    try {
        await supabase
            .from('station_sessions')
            .update({
                status: 'paused',
                pause_time: new Date().toISOString(),
                elapsed_seconds: currentElapsedSeconds,
            })
            .eq('id', sessionId);

        await supabase
            .from('gaming_stations')
            .update({ status: 'paused' })
            .eq('id', stationId);
    } catch (e) {
        console.error('Pause session failed:', e);
    }
}

// Resume session
export async function resumeStationSession(sessionId: string, stationId: string) {
    try {
        await supabase
            .from('station_sessions')
            .update({
                status: 'active',
                pause_time: null,
                start_time: new Date().toISOString(), // resets reference point with elapsed preserved
            })
            .eq('id', sessionId);

        await supabase
            .from('gaming_stations')
            .update({ status: 'busy' })
            .eq('id', stationId);
    } catch (e) {
        console.error('Resume session failed:', e);
    }
}

// Update session notes
export async function updateSessionNotes(sessionId: string, notes: string) {
    try {
        await supabase
            .from('station_sessions')
            .update({ notes })
            .eq('id', sessionId);
    } catch (e) {
        console.error('Update notes failed:', e);
    }
}

// Update session mode (single vs multi)
export async function toggleSessionMulti(sessionId: string, is_multi: boolean, newRate: number) {
    try {
        await supabase
            .from('station_sessions')
            .update({ is_multi, hourly_rate: newRate })
            .eq('id', sessionId);
    } catch (e) {
        console.error('Toggle multi failed:', e);
    }
}

// Add order to session
export async function addOrderToSession(sessionId: string, currentOrders: SessionOrderItem[], newOrder: SessionOrderItem) {
    const updatedOrders = [...currentOrders, newOrder];
    const ordersTotal = updatedOrders.reduce((sum, item) => sum + item.price * item.quantity, 0);

    try {
        await supabase
            .from('station_sessions')
            .update({
                orders: updatedOrders,
                orders_total: ordersTotal,
            })
            .eq('id', sessionId);

        return { orders: updatedOrders, ordersTotal };
    } catch (e) {
        console.error('Add order failed:', e);
        return { orders: updatedOrders, ordersTotal };
    }
}

// Transfer session to another station
export async function transferStationSession(
    sessionId: string,
    currentStationId: string,
    targetStationId: string
) {
    try {
        // Move session to target station
        await supabase
            .from('station_sessions')
            .update({ station_id: targetStationId })
            .eq('id', sessionId);

        // Free previous station
        await supabase
            .from('gaming_stations')
            .update({ status: 'available' })
            .eq('id', currentStationId);

        // Mark target station busy
        await supabase
            .from('gaming_stations')
            .update({ status: 'busy' })
            .eq('id', targetStationId);
    } catch (e) {
        console.error('Transfer session failed:', e);
        throw e;
    }
}

// Complete / Checkout session
export async function completeStationSession(params: {
    sessionId: string;
    stationId: string;
    elapsedSeconds: number;
    timeCost: number;
    ordersTotal: number;
    discountAmount: number;
    grandTotal: number;
    paymentMethod: string;
}) {
    try {
        await supabase
            .from('station_sessions')
            .update({
                status: 'completed',
                elapsed_seconds: params.elapsedSeconds,
                total_time_cost: params.timeCost,
                orders_total: params.ordersTotal,
                discount_amount: params.discountAmount,
                grand_total: params.grandTotal,
                payment_method: params.paymentMethod,
                ended_at: new Date().toISOString(),
            })
            .eq('id', params.sessionId);

        // Reset station status back to available
        await supabase
            .from('gaming_stations')
            .update({ status: 'available' })
            .eq('id', params.stationId);
    } catch (e) {
        console.error('Complete session failed:', e);
        throw e;
    }
}

// Create new station
export async function createGamingStation(station: Omit<GamingStation, 'id'>) {
    const id = station.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4);
    const { data, error } = await supabase
        .from('gaming_stations')
        .insert([{ id, ...station }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Delete station
export async function deleteGamingStation(id: string) {
    const { error } = await supabase
        .from('gaming_stations')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
