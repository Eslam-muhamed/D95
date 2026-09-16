import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { DBCustomer } from '@/types/database';

interface AuthState {
    session: Session | null;
    user: User | null;
    customerProfile: DBCustomer | null;
    isLoading: boolean;
    initialize: () => void;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
    session: null,
    user: null,
    customerProfile: null,
    isLoading: true,
    
    initialize: () => {
        // Initial session fetch
        supabase.auth.getSession().then(({ data: { session } }) => {
            set({ session, user: session?.user || null, isLoading: false });
            if (session?.user) {
                get().refreshProfile();
            }
        });

        // Listen for auth changes
        supabase.auth.onAuthStateChange((_event, session) => {
            set({ session, user: session?.user || null, isLoading: false });
            if (session?.user) {
                get().refreshProfile();
            } else {
                set({ customerProfile: null });
            }
        });
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null, customerProfile: null });
    },

    refreshProfile: async () => {
        const user = get().user;
        if (!user) return;

        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching customer profile:', error);
        } else {
            set({ customerProfile: data });
        }
    }
}));
