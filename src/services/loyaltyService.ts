import { supabase } from '@/lib/supabase';
import type { DBCustomer, DBLoyaltyTransaction } from '@/types/database';

export interface PaginatedCustomersResult {
    customers: DBCustomer[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export async function fetchPaginatedCustomers(options?: {
    page?: number;
    pageSize?: number;
    search?: string;
}): Promise<PaginatedCustomersResult> {
    const page = Math.max(1, options?.page || 1);
    const pageSize = Math.max(5, Math.min(100, options?.pageSize || 10));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
        let query = supabase
            .from('customers')
            .select('*', { count: 'exact' })
            .order('loyalty_points_balance', { ascending: false });

        if (options?.search && options.search.trim()) {
            const s = options.search.trim();
            query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone_number.ilike.%${s}%`);
        }

        const { data, count, error } = await query.range(from, to);

        if (error) {
            console.error('Error fetching paginated customers:', error);
            throw error;
        }

        const totalCount = count || 0;
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

        return {
            customers: (data || []) as DBCustomer[],
            totalCount,
            page,
            pageSize,
            totalPages,
        };
    } catch (err) {
        console.error('Exception in fetchPaginatedCustomers:', err);
        throw err;
    }
}

export async function fetchAllCustomers(): Promise<DBCustomer[]> {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('loyalty_points_balance', { ascending: false });

    if (error) {
        console.error('Error fetching customers:', error);
        throw error;
    }
    return data as DBCustomer[];
}

export async function getCustomerLoyaltyInfo(phone: string): Promise<{
    exists: boolean;
    customer?: DBCustomer;
    history?: DBLoyaltyTransaction[];
}> {
    const { data, error } = await supabase.rpc('get_customer_loyalty_info', { p_phone: phone });
    
    if (error) {
        console.error('Error fetching customer loyalty info:', error);
        throw error;
    }
    return data;
}

export async function adminAdjustPoints(customerId: string, points: number, reason: string): Promise<void> {
    const { error } = await supabase.rpc('admin_adjust_points', {
        p_customer_id: customerId,
        p_points: points,
        p_reason: reason
    });

    if (error) {
        console.error('Error adjusting points:', error);
        throw error;
    }
}

export async function getPointsPerEgp(): Promise<number> {
    const { data, error } = await supabase
        .from('loyalty_settings')
        .select('value')
        .eq('key', 'points_per_egp')
        .single();
        
    if (error) {
        return 1; // Default
    }
    return Number(data.value);
}

export async function updatePointsPerEgp(value: number): Promise<void> {
    const { error } = await supabase
        .from('loyalty_settings')
        .upsert({ key: 'points_per_egp', value });
        
    if (error) {
        console.error('Error updating points rate:', error);
        throw error;
    }
}
