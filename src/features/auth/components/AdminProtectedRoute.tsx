import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { isStaff, setRoleCache } from '@/lib/authRoles';
import { getCurrentUserRole } from '@/services/staffService';
import { Gamepad2 } from 'lucide-react';
import D95MiniLogo from '@/components/brand/D95MiniLogo';

interface Props {
    children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: Props) {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const location = useLocation();

    useEffect(() => {
        let mounted = true;

        const loadAuthAndRole = async (session: any) => {
            if (!session?.user?.email) {
                if (mounted) {
                    setRoleCache(null);
                    setIsAuthenticated(false);
                    setLoading(false);
                }
                return;
            }

            try {
                const role = await getCurrentUserRole(session.user.email);
                if (mounted) {
                    setRoleCache(role);
                    setIsAuthenticated(role !== null);
                    setLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setRoleCache(null);
                    setIsAuthenticated(false);
                    setLoading(false);
                }
            }
        };

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                await loadAuthAndRole(session);
            } catch (err) {
                if (mounted) {
                    setIsAuthenticated(false);
                    setLoading(false);
                }
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'INITIAL_SESSION') return; // Handled by initializeAuth
            
            if (event === 'SIGNED_OUT') {
                if (mounted) {
                    setRoleCache(null);
                    setIsAuthenticated(false);
                    setLoading(false);
                }
                return;
            }

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                // When auth state changes to a valid session, reload role
                await loadAuthAndRole(session);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-[#0a0809] flex flex-col items-center justify-center text-white p-4" dir="rtl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.5)] mb-4 border border-red-400/30 animate-pulse">
                    <Gamepad2 className="w-9 h-9" />
                </div>
                <div className="flex items-center gap-2.5 mb-2">
                    <D95MiniLogo size="md" />
                    <span className="text-xs bg-red-950 text-red-400 font-bold px-2.5 py-0.5 rounded-full border border-red-500/30 font-bebas tracking-wider">
                        ADMIN
                    </span>
                </div>
                <p className="text-xs text-neutral-400 font-mono">جاري التحقق من الصلاحيات المشفرة...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
