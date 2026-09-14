import { supabase } from '@/lib/supabase';

export interface VenueStatus {
    isOpen: boolean;
    statusText: string;
    updatedAt?: string;
    updatedBy?: string;
}

export const DEFAULT_VENUE_STATUS: VenueStatus = {
    isOpen: true,
    statusText: 'مفتوح الآن',
};

const CACHE_KEY = 'd95_venue_status_cache';

export async function fetchVenueStatus(): Promise<VenueStatus> {
    // 1. Instant response from local cache to avoid layout shift
    let cached: VenueStatus = DEFAULT_VENUE_STATUS;
    try {
        const item = localStorage.getItem(CACHE_KEY);
        if (item) {
            const parsed = JSON.parse(item);
            if (typeof parsed?.isOpen === 'boolean') {
                cached = parsed;
            }
        }
    } catch {
        // Ignore storage errors
    }

    // 2. Fetch fresh status from Supabase
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value, updated_at, updated_by')
            .eq('key', 'venue_status')
            .maybeSingle();

        if (!error && data?.value && typeof data.value.isOpen === 'boolean') {
            const status: VenueStatus = {
                isOpen: data.value.isOpen,
                statusText: data.value.isOpen ? 'مفتوح الآن' : 'مغلق الآن',
                updatedAt: data.updated_at,
                updatedBy: data.updated_by || (data.value.updatedBy ?? undefined),
            };
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(status));
            } catch {
                // Ignore
            }
            return status;
        }
    } catch (err) {
        console.error('Error fetching venue status:', err);
    }

    return cached;
}

export async function updateVenueStatus(isOpen: boolean, updatedBy?: string): Promise<VenueStatus> {
    const statusText = isOpen ? 'مفتوح الآن' : 'مغلق الآن';
    const nowIso = new Date().toISOString();
    const payload = {
        isOpen,
        statusText,
        updatedBy: updatedBy || 'staff',
    };

    // Optimistically update local cache
    const optimisticStatus: VenueStatus = {
        isOpen,
        statusText,
        updatedAt: nowIso,
        updatedBy: payload.updatedBy,
    };
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(optimisticStatus));
        window.dispatchEvent(new CustomEvent('d95_venue_status_changed', { detail: optimisticStatus }));
    } catch {
        // Ignore
    }

    const { error } = await supabase
        .from('app_settings')
        .upsert({
            key: 'venue_status',
            value: payload,
            updated_at: nowIso,
            updated_by: payload.updatedBy,
        });

    if (error) {
        console.error('Error updating venue status:', error);
        throw error;
    }

    return optimisticStatus;
}

export function subscribeVenueStatus(callback: (status: VenueStatus) => void) {
    // Listen for local tab events
    const handleLocalChange = (e: Event) => {
        const customEvent = e as CustomEvent<VenueStatus>;
        if (customEvent.detail) {
            callback(customEvent.detail);
        }
    };
    window.addEventListener('d95_venue_status_changed', handleLocalChange);

    // Supabase Realtime channel for cross-device updates
    const channel = supabase
        .channel('realtime_venue_status')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'app_settings',
                filter: 'key=eq.venue_status',
            },
            (payload) => {
                const row = payload.new as { value?: { isOpen?: boolean }; updated_at?: string; updated_by?: string };
                if (row?.value && typeof row.value.isOpen === 'boolean') {
                    const status: VenueStatus = {
                        isOpen: row.value.isOpen,
                        statusText: row.value.isOpen ? 'مفتوح الآن' : 'مغلق الآن',
                        updatedAt: row.updated_at,
                        updatedBy: row.updated_by,
                    };
                    try {
                        localStorage.setItem(CACHE_KEY, JSON.stringify(status));
                    } catch {
                        // Ignore
                    }
                    callback(status);
                }
            }
        )
        .subscribe();

    return () => {
        window.removeEventListener('d95_venue_status_changed', handleLocalChange);
        supabase.removeChannel(channel);
    };
}
