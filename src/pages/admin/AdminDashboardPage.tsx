import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Gamepad2,
    UtensilsCrossed,
    ShoppingBag,
    ExternalLink,
    LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import SimpleOperationsTab from '@/components/admin/SimpleOperationsTab';
import OrdersTab from '@/components/admin/OrdersTab';
import SimpleMenuSettingsTab from '@/components/admin/SimpleMenuSettingsTab';
import { supabase } from '@/lib/supabase';
import { playPs5NavigateSound } from '@/lib/sound';

type TabType = 'operations' | 'orders' | 'menu_settings';

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('operations');
    const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);

    // Auth verification: ensure active Supabase session or authenticated flag
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const hasLocalAuth = localStorage.getItem('d95_admin_auth') === 'authenticated';
            if (!session && !hasLocalAuth) {
                navigate('/admin/login');
            }
        });
    }, [navigate]);

    // Check pending orders count for badge
    useEffect(() => {
        const checkPendingOrders = async () => {
            try {
                const { count } = await supabase
                    .from('orders')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'pending');
                setPendingOrdersCount(count || 0);
            } catch {
                // Ignore silent failure
            }
        };
        checkPendingOrders();
        const interval = setInterval(checkPendingOrders, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error(e);
        }
        localStorage.removeItem('d95_admin_auth');
        localStorage.removeItem('d95_admin_auth_time');
        toast.info('تم تسجيل الخروج من لوحة التحكم');
        navigate('/admin/login');
    };

    const navItems: { id: TabType; label: string; icon: React.ReactNode; badgeCount?: number }[] = [
        {
            id: 'operations',
            label: 'الحجوزات والتشغيل',
            icon: <Gamepad2 className="w-4 h-4" />,
        },
        {
            id: 'orders',
            label: 'طلبات الكافيه',
            icon: <ShoppingBag className="w-4 h-4" />,
            badgeCount: pendingOrdersCount,
        },
        {
            id: 'menu_settings',
            label: 'المنيو والأسعار',
            icon: <UtensilsCrossed className="w-4 h-4" />,
        },
    ];

    return (
        <div className="min-h-screen w-full bg-[#0a0809] text-white font-body selection:bg-red-600 selection:text-white flex flex-col" dir="rtl">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-[#120c0f]/95 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between">
                {/* Brand & Connection Badge */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] border border-red-400/30">
                        <Gamepad2 className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-brush text-2xl text-red-500 font-bold leading-none">D95</span>
                            <span className="text-[10px] bg-red-950 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                                LOUNGE
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>متصل بالقاعدة (Supabase)</span>
                        </div>
                    </div>
                </div>

                {/* Desktop Tabs In Header */}
                <div className="hidden md:flex items-center gap-1.5 bg-[#181114] border border-white/10 p-1 rounded-2xl">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    playPs5NavigateSound();
                                    setActiveTab(item.id);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.35)] border border-red-500/40'
                                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-black animate-pulse">
                                        {item.badgeCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Right Actions: Public Site Link + Logout */}
                <div className="flex items-center gap-2">
                    <a
                        href="/menu"
                        target="_blank"
                        rel="noreferrer"
                        className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
                    >
                        <span>معاينة المنيو الحي</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors cursor-pointer"
                        title="تسجيل الخروج"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">خروج</span>
                    </button>
                </div>
            </header>

            {/* Mobile Top Sub-Header: Segmented Bar (For quick switching on small screens) */}
            <div className="md:hidden bg-[#140e11] border-b border-white/10 px-3 py-2">
                <div className="grid grid-cols-3 gap-1.5">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    playPs5NavigateSound();
                                    setActiveTab(item.id);
                                }}
                                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
                                    isActive
                                        ? 'bg-red-600 text-white shadow-md'
                                        : 'bg-white/5 text-neutral-400 hover:text-white'
                                }`}
                            >
                                {item.icon}
                                <span className="truncate">{item.label}</span>
                                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-bold flex items-center justify-center shrink-0">
                                        {item.badgeCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 pb-24 sm:pb-8">
                {activeTab === 'operations' && <SimpleOperationsTab />}
                {activeTab === 'orders' && <OrdersTab />}
                {activeTab === 'menu_settings' && <SimpleMenuSettingsTab />}
            </main>

            {/* Mobile Bottom Navigation Bar (Optimized for 1-Hand Phone Usage) */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#120c0f]/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 flex items-center justify-around shadow-[0_-10px_25px_rgba(0,0,0,0.6)]">
                <button
                    type="button"
                    onClick={() => {
                        playPs5NavigateSound();
                        setActiveTab('operations');
                    }}
                    className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                        activeTab === 'operations' ? 'text-red-500 font-bold scale-105' : 'text-neutral-400'
                    }`}
                >
                    <Gamepad2 className="w-5 h-5" />
                    <span className="text-[11px]">الحجوزات</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        playPs5NavigateSound();
                        setActiveTab('orders');
                    }}
                    className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition-all cursor-pointer relative ${
                        activeTab === 'orders' ? 'text-amber-400 font-bold scale-105' : 'text-neutral-400'
                    }`}
                >
                    <div className="relative">
                        <ShoppingBag className="w-5 h-5" />
                        {pendingOrdersCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        )}
                    </div>
                    <span className="text-[11px]">الكافيه</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        playPs5NavigateSound();
                        setActiveTab('menu_settings');
                    }}
                    className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                        activeTab === 'menu_settings' ? 'text-purple-400 font-bold scale-105' : 'text-neutral-400'
                    }`}
                >
                    <UtensilsCrossed className="w-5 h-5" />
                    <span className="text-[11px]">المنيو والأسعار</span>
                </button>
            </nav>
        </div>
    );
}
