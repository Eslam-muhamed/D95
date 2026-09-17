import { supabase } from '@/lib/supabase';

export interface UnifiedRevenueMetrics {
    totalAllTime: number;
    totalToday: number;
    psAllTime: number;
    psToday: number;
    psCount: number;
    cafeAllTime: number;
    cafeToday: number;
    cafeCount: number;
}

const CACHE_KEY = 'd95_unified_revenue_cache';
let memCache: UnifiedRevenueMetrics | null = null;

export function getCachedUnifiedRevenueMetrics(): UnifiedRevenueMetrics | null {
    if (memCache) return memCache;
    try {
        const stored = sessionStorage.getItem(CACHE_KEY);
        if (stored) {
            memCache = JSON.parse(stored);
            return memCache;
        }
    } catch {
        // Ignore session storage errors
    }
    return null;
}

export async function fetchUnifiedRevenueMetrics(): Promise<UnifiedRevenueMetrics> {
    try {
        const { data, error } = await supabase.rpc('get_unified_revenue_metrics');
        if (error) throw error;

        const metrics: UnifiedRevenueMetrics = {
            totalAllTime: Number(data?.total_all_time || 0),
            totalToday: Number(data?.total_today || 0),
            psAllTime: Number(data?.ps_all_time || 0),
            psToday: Number(data?.ps_today || 0),
            psCount: Number(data?.ps_count || 0),
            cafeAllTime: Number(data?.cafe_all_time || 0),
            cafeToday: Number(data?.cafe_today || 0),
            cafeCount: Number(data?.cafe_count || 0),
        };

        memCache = metrics;
        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(metrics));
        } catch {
            // Ignore session storage errors
        }

        return metrics;
    } catch (err) {
        console.error('Error fetching unified revenue metrics:', err);
        return memCache || {
            totalAllTime: 0,
            totalToday: 0,
            psAllTime: 0,
            psToday: 0,
            psCount: 0,
            cafeAllTime: 0,
            cafeToday: 0,
            cafeCount: 0,
        };
    }
}

