import { supabase } from '@/lib/supabase';

export interface StaffUser {
    email: string;
    role: 'admin' | 'cashier';
    created_at?: string;
}

export async function fetchStaffUsers(): Promise<StaffUser[]> {
    try {
        const { data, error } = await supabase
            .from('staff_users')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching staff users:', error);
            return [];
        }
        return data as StaffUser[];
    } catch (err) {
        console.error('Exception fetching staff users:', err);
        return [];
    }
}

export async function addStaffUser(email: string, role: 'admin' | 'cashier'): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase
        .from('staff_users')
        .upsert({ email: cleanEmail, role });

    if (error) {
        console.error('Error adding staff user:', error);
        throw error;
    }
    return true;
}

export async function removeStaffUser(email: string): Promise<boolean> {
    const { error } = await supabase
        .from('staff_users')
        .delete()
        .eq('email', email.trim().toLowerCase());

    if (error) {
        console.error('Error removing staff user:', error);
        throw error;
    }
    return true;
}

export async function getCurrentUserRole(email: string): Promise<'admin' | 'cashier' | null> {
    try {
        const { data, error } = await supabase
            .from('staff_users')
            .select('role')
            .eq('email', email.trim().toLowerCase())
            .maybeSingle();

        if (!error && data) {
            return data.role as 'admin' | 'cashier';
        }
        return null;
    } catch (err) {
        console.error('Exception fetching current user role:', err);
        return null;
    }
}
