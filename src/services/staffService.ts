import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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

export async function addStaffUser(email: string, role: 'admin' | 'cashier', password?: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    
    // Create Auth user first using a non-persisted client so it doesn't log the current admin out
    if (password) {
        const tempSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });
        
        const { error: signUpError } = await tempSupabase.auth.signUp({
            email: cleanEmail,
            password: password
        });
        
        if (signUpError && signUpError.message !== 'User already registered') {
            console.error('Error creating Auth user:', signUpError);
            throw new Error(`فشل إنشاء الحساب: ${signUpError.message}`);
        }
    }

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
