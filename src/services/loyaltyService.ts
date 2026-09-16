import { supabase } from '@/lib/supabase';
import type { DBCustomer, DBLoyaltyTransaction } from '@/types/database';

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
