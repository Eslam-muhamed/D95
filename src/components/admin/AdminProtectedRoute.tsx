import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Gamepad2 } from 'lucide-react';

interface Props {
    children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: Props) {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const location = useLocation();

    useEffect(() => {
        let mounted = true;

        const checkAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.warn('Auth session error:', error.message);
                }
                if (mounted) {
                    const isAdmin = !!session?.user && session?.user?.email === 'admin@d95.com';
                    setIsAuthenticated(isAdmin);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Session check failed:', err);
                if (mounted) {
                    setIsAuthenticated(false);
                    setLoading(false);
                }
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                const isAdmin = !!session?.user && session?.user?.email === 'admin@d95.com';
                setIsAuthenticated(isAdmin);
                setLoading(false);
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
                <div className="flex items-center gap-2 mb-2">
                    <span className="font-brush text-2xl font-bold tracking-tight">
                        <span className="text-white">D</span><span className="text-red-500">95</span>
                    </span>
                    <span className="text-xs bg-red-950 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/30">
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
