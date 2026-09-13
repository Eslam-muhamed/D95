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
}): Promise<PaginatedOrdersResult> {
    const page = Math.max(1, filter?.page || 1);
    const pageSize = Math.max(5, Math.min(100, filter?.pageSize || 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
        let query = supabase
            .from('orders')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (filter?.status && filter.status !== 'all') {
            query = query.eq('status', filter.status);
        }

        if (filter?.search) {
            const s = filter.search.trim();
            query = query.or(`order_number.ilike.%${s}%,customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%,table_number.ilike.%${s}%`);
        }

        const { data, count, error } = await query.range(from, to);

        if (error) {
            console.error('Error fetching orders:', error);
            return { orders: [], totalCount: 0, page, pageSize, totalPages: 1 };
        }

        const totalCount = count || 0;
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

        return {
            orders: (data || []) as DBOrder[],
            totalCount,
            page,
            pageSize,
            totalPages,
        };
    } catch (err) {
        console.error('Exception in fetchPaginatedOrders:', err);
        return { orders: [], totalCount: 0, page, pageSize, totalPages: 1 };
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

export async function fetchOrderMetrics(): Promise<{
    pendingOrdersCount: number;
    todayOrdersCount: number;
    todayOrdersRevenue: number;
}> {
    try {
        const { data, error } = await supabase.rpc('get_order_metrics_v2');
        if (!error && data) {
            return {
                pendingOrdersCount: Number(data.pendingOrdersCount) || 0,
                todayOrdersCount: Number(data.todayOrdersCount) || 0,
                todayOrdersRevenue: Number(data.todayOrdersRevenue) || 0,
            };
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

        return {
            pendingOrdersCount: pendingRes.count || 0,
            todayOrdersCount: todayRes.data?.length || 0,
            todayOrdersRevenue: Math.round(todayRevenue),
        };
    } catch (err) {
        console.error('Error fetching order metrics:', err);
        return { pendingOrdersCount: 0, todayOrdersCount: 0, todayOrdersRevenue: 0 };
    }
}
