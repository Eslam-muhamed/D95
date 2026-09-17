import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/authRoles';

export interface StaffUser {
    email: string;
    role: 'admin';
    created_at?: string;
}

export async function fetchStaffUsers(): Promise<StaffUser[]> {
    if (!isAdmin()) {
        console.warn('Unauthorized attempt to fetch staff users');
        return [];
    }

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

export async function addStaffUser(email: string): Promise<StaffUser> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
        throw new Error('يرجى إدخال بريد إلكتروني صحيح');
    }

    const { data, error } = await supabase
        .from('staff_users')
        .upsert({ email: cleanEmail, role: 'admin' })
        .select()
        .single();

    if (error) {
        console.error('Error adding admin user:', error);
        throw error;
    }
    return data as StaffUser;
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

export async function getCurrentUserRole(email: string): Promise<'admin' | null> {
    try {
        const { data, error } = await supabase
            .from('staff_users')
            .select('role')
            .eq('email', email.trim().toLowerCase())
            .maybeSingle();

        if (!error && data) {
            return data.role as 'admin';
        }
        return null;
    } catch (err) {
        console.error('Exception fetching current user role:', err);
        return null;
    }
}
