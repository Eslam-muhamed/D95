import { supabase } from '@/lib/supabase';
import type { DBOrder } from '@/types/database';

export interface PaginatedOrdersResult {
    orders: DBOrder[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export async function fetchPaginatedOrders(filter?: {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    date?: string;
}): Promise<PaginatedOrdersResult> {
    const page = Math.max(1, filter?.page || 1);
    const pageSize = Math.max(5, Math.min(100, filter?.pageSize || 20));

    try {
        // 1. Fetch from regular orders
        let ordersQuery = supabase.from('orders').select('*');
        if (filter?.status && filter.status !== 'all') {
            ordersQuery = ordersQuery.eq('status', filter.status);
        }
        if (filter?.date) {
            const startOfDay = new Date(filter.date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(filter.date);
            endOfDay.setHours(23, 59, 59, 999);
            ordersQuery = ordersQuery.gte('created_at', startOfDay.toISOString());
            ordersQuery = ordersQuery.lte('created_at', endOfDay.toISOString());
        }

        // 2. Fetch from ps_bookings that have snacks
        let psQuery = supabase.from('ps_bookings').select('*').gt('snacks_total', 0);
        if (filter?.status && filter.status !== 'all') {
            psQuery = psQuery.eq('status', filter.status);
        }
        if (filter?.date) {
            const startOfDay = new Date(filter.date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(filter.date);
            endOfDay.setHours(23, 59, 59, 999);
            psQuery = psQuery.gte('created_at', startOfDay.toISOString());
            psQuery = psQuery.lte('created_at', endOfDay.toISOString());
        }

        const [ordersRes, psRes] = await Promise.all([
            ordersQuery,
            psQuery
        ]);

        if (ordersRes.error) console.error('Error fetching orders:', ordersRes.error);
        if (psRes.error) console.error('Error fetching ps bookings for cafe:', psRes.error);

        let mergedOrders: DBOrder[] = (ordersRes.data || []) as DBOrder[];

        // Transform PS Bookings into pseudo-orders
        if (psRes.data) {
            const psPseudoOrders: DBOrder[] = psRes.data.map(ps => ({
                id: ps.id,
                order_number: `PS-${ps.reservation_id}`,
                customer_name: ps.customer_name,
                customer_phone: ps.customer_phone,
                order_type: 'dine',
                table_number: ps.room_name,
                delivery_address: null,
                payment_method: ps.payment_method,
                items: Array.isArray(ps.snacks) ? ps.snacks.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    price: s.price,
                    quantity: s.quantity || 1
                })) : [],
                subtotal: ps.snacks_total || 0,
                total_amount: ps.snacks_total || 0,
                status: ps.status,
                notes: `تابع لحجز البلايستيشن: ${ps.reservation_id}`,
                user_id: ps.user_id,
                created_at: ps.created_at
            }));
            mergedOrders = [...mergedOrders, ...psPseudoOrders];
        }

        // Search filtering (since we do it in memory now to cover both)
        if (filter?.search) {
            const s = filter.search.toLowerCase().trim();
            mergedOrders = mergedOrders.filter(o => 
                (o.order_number && o.order_number.toLowerCase().includes(s)) ||
                (o.customer_name && o.customer_name.toLowerCase().includes(s)) ||
                (o.customer_phone && o.customer_phone.toLowerCase().includes(s)) ||
                (o.table_number && o.table_number.toLowerCase().includes(s))
            );
        }

        // Sort by created_at descending
        mergedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const totalCount = mergedOrders.length;
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        const paginatedOrders = mergedOrders.slice(from, to);

        return {
            orders: paginatedOrders,
            totalCount,
            page,
            pageSize,
            totalPages,
        };
    } catch (err) {
        console.error('Exception in fetchPaginatedOrders:', err);
        return { orders: [], totalCount: 0, page, pageSize: 20, totalPages: 1 };
    }
}

export async function updateOrderStatus(
    id: string,
    status: 'pending' | 'preparing' | 'completed' | 'cancelled' | string
): Promise<DBOrder> {
    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating order status:', error);
        throw error;
    }

    return data as DBOrder;
}

export async function deleteOrder(id: string): Promise<void> {
    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting order:', error);
        throw error;
    }
}

export async function createOrder(orderData: {
    order_number?: string;
    customer_name?: string | null;
    customer_phone?: string | null;
    order_type?: string;
    table_number?: string | null;
    delivery_address?: string | null;
    payment_method?: string | null;
    items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
        customization?: Record<string, unknown>;
    }>;
    notes?: string | null;
    user_id?: string | null;
}): Promise<DBOrder> {
    const { data, error } = await supabase.rpc('create_order_atomic', {
        p_order: orderData,
    });

    if (error) {
        console.error('Error creating order atomic:', error);
        throw new Error(error.message || 'فشل تسجيل الطلب');
    }

    return data as DBOrder;
}

export interface CafeOrderMetrics {
    pendingOrdersCount: number;
    todayOrdersCount: number;
    todayOrdersRevenue: number;
}

const ORDER_METRICS_CACHE_KEY = 'd95_cafe_order_metrics_cache';
let memOrderMetricsCache: CafeOrderMetrics | null = null;

export function getCachedOrderMetrics(): CafeOrderMetrics | null {
    if (memOrderMetricsCache) return memOrderMetricsCache;
    try {
        const stored = sessionStorage.getItem(ORDER_METRICS_CACHE_KEY);
        if (stored) {
            memOrderMetricsCache = JSON.parse(stored);
            return memOrderMetricsCache;
        }
    } catch {
        // Ignore session storage errors
    }
    return null;
}

export async function fetchOrderMetrics(): Promise<CafeOrderMetrics> {
    try {
        const { data, error } = await supabase.rpc('get_order_metrics_v2');
        if (!error && data) {
            const metrics: CafeOrderMetrics = {
                pendingOrdersCount: Number(data.pendingOrdersCount) || 0,
                todayOrdersCount: Number(data.todayOrdersCount) || 0,
                todayOrdersRevenue: Number(data.todayOrdersRevenue) || 0,
            };
            memOrderMetricsCache = metrics;
            try {
                sessionStorage.setItem(ORDER_METRICS_CACHE_KEY, JSON.stringify(metrics));
            } catch (_e) {
                // Ignore storage quota or disabled errors
            }
            return metrics;
        }

        // Fallback in case RPC is unavailable
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [pendingRes, todayRes] = await Promise.all([
            supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase
                .from('orders')
                .select('total_amount, status')
                .gte('created_at', todayStart.toISOString())
                .neq('status', 'cancelled'),
        ]);

        const todayRevenue = (todayRes.data || []).reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

        const metrics: CafeOrderMetrics = {
            pendingOrdersCount: pendingRes.count || 0,
            todayOrdersCount: todayRes.data?.length || 0,
            todayOrdersRevenue: Math.round(todayRevenue),
        };

        memOrderMetricsCache = metrics;
        try {
            sessionStorage.setItem(ORDER_METRICS_CACHE_KEY, JSON.stringify(metrics));
        } catch (_e) {
            // Ignore storage quota or disabled errors
        }

        return metrics;
    } catch (err) {
        console.error('Error fetching order metrics:', err);
        return memOrderMetricsCache || { pendingOrdersCount: 0, todayOrdersCount: 0, todayOrdersRevenue: 0 };
    }
}
