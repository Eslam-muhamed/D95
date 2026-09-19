import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Gamepad2,
    UtensilsCrossed,
    ShoppingBag,
    Wallet,
    Users,
    Star,
    ExternalLink,
    LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import SimpleOperationsTab from '@/features/admin/components/SimpleOperationsTab';
import OrdersTab from '@/features/admin/components/OrdersTab';
import SimpleMenuSettingsTab from '@/features/admin/components/SimpleMenuSettingsTab';
import PaymentSettingsTab from '@/features/admin/components/PaymentSettingsTab';
import LoyaltyTab from '@/features/admin/components/LoyaltyTab';
import VenueStatusControl from '@/features/admin/components/VenueStatusControl';
import UnifiedRevenueCard from '@/features/admin/components/UnifiedRevenueCard';
import TournamentsTab from '@/features/admin/components/TournamentsTab';
import SectionErrorBoundary from '@/components/features/SectionErrorBoundary';
import { supabase } from '@/lib/supabase';
import { playPs5NavigateSound } from '@/lib/sound';
import { Trophy } from 'lucide-react';

type TabType = 'operations' | 'orders' | 'menu_settings' | 'payment_settings' | 'loyalty' | 'tournaments';

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('operations');
    const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
    const [userEmail, setUserEmail] = useState<string>('');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.email) {
                setUserEmail(session.user.email);
            }
        });
    }, []);

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
            label: 'منيو وأسعار الكافيه',
            icon: <UtensilsCrossed className="w-4 h-4" />,
        },
        {
            id: 'loyalty',
            label: 'الولاء والنقاط',
            icon: <Star className="w-4 h-4" />,
        },
        {
            id: 'tournaments',
            label: 'البطولات',
            icon: <Trophy className="w-4 h-4" />,
        },
        {
            id: 'payment_settings',
            label: 'إعدادات الدفع والمحافظ',
            icon: <Wallet className="w-4 h-4" />,
        },
    ];

    return (
        <div className="min-h-screen w-full bg-slate-100/70 text-slate-900 font-body selection:bg-red-600 selection:text-white flex flex-col" dir="rtl">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs">
                {/* Brand & Connection Badge */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm">
                        <Gamepad2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-slate-900 tracking-wide">D95 Lounge</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                                لوحة الإدارة
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>متصل بالقاعدة السحابية</span>
                        </div>
                    </div>
                </div>

                {/* Desktop Tabs In Header */}
                <div className="hidden md:flex items-center gap-1 bg-slate-100/90 border border-slate-200 p-1 rounded-xl">
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
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-red-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                                }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
                                        {item.badgeCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Right Actions: Public Site Link + Logout */}
                <div className="flex items-center gap-2">
                    <VenueStatusControl userEmail={userEmail} variant="badge" />

                    <a
                        href="/menu"
                        target="_blank"
                        rel="noreferrer"
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                        <span>معاينة المنيو</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                        title="تسجيل الخروج"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">خروج</span>
                    </button>
                </div>
            </header>

            {/* Mobile Top Sub-Header: Smooth Horizontal Scrollable Pills */}
            <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-2.5 py-2 sticky top-[53px] z-30 shadow-2xs">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 px-0.5">
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
                                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 ${
                                    isActive
                                        ? 'bg-red-600 text-white shadow-xs'
                                        : 'bg-slate-100/90 text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {item.icon}
                                <span className="whitespace-nowrap">{item.label}</span>
                                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                                    <span className={`w-4 h-4 rounded-full text-[9px] font-mono font-bold flex items-center justify-center shrink-0 ${
                                        isActive ? 'bg-white text-red-600' : 'bg-amber-400 text-slate-950'
                                    }`}>
                                        {item.badgeCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 pb-28 sm:pb-8 space-y-4 sm:space-y-6">
                {/* Unified Revenue Overview (PS + Cafe) */}
                <UnifiedRevenueCard />

                <SectionErrorBoundary>
                    <div className={activeTab === 'operations' ? 'block' : 'hidden'}>
                        <SimpleOperationsTab userEmail={userEmail} />
                    </div>
                    <div className={activeTab === 'orders' ? 'block' : 'hidden'}>
                        <OrdersTab />
                    </div>
                    {activeTab === 'menu_settings' && <SimpleMenuSettingsTab />}
                    {activeTab === 'payment_settings' && <PaymentSettingsTab />}
                    {activeTab === 'loyalty' && <LoyaltyTab />}
                    {activeTab === 'tournaments' && <TournamentsTab />}
                </SectionErrorBoundary>
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
                <button
                    type="button"
                    onClick={() => {
                        playPs5NavigateSound();
                        setActiveTab('operations');
                    }}
                    className={`flex-1 flex flex-col items-center gap-1 py-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
                        activeTab === 'operations' ? 'text-red-600 font-bold' : 'text-slate-500'
                    }`}
                >
                    <Gamepad2 className="w-5 h-5" />
                    <span className="text-[10px]">الحجوزات</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        playPs5NavigateSound();
                        setActiveTab('orders');
                    }}
                    className={`flex-1 flex flex-col items-center gap-1 py-1 rounded-xl transition-all cursor-pointer relative ${
                        activeTab === 'orders' ? 'text-amber-600 font-bold' : 'text-slate-500'
                    }`}
                >
                    <div className="relative">
                        <ShoppingBag className="w-5 h-5" />
                        {pendingOrdersCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        )}
                    </div>
                    <span className="text-[10px]">الكافيه</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        playPs5NavigateSound();
                        setActiveTab('menu_settings');
                    }}
                    className={`flex-1 flex flex-col items-center gap-1 py-1 rounded-xl transition-all cursor-pointer ${
                        activeTab === 'menu_settings' ? 'text-purple-600 font-bold' : 'text-slate-500'
                    }`}
                >
                    <UtensilsCrossed className="w-5 h-5" />
                    <span className="text-[10px]">المنيو</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        playPs5NavigateSound();
                        setActiveTab('payment_settings');
                    }}
                    className={`flex-1 flex flex-col items-center gap-1 py-1 rounded-xl transition-all cursor-pointer ${
                        activeTab === 'payment_settings' ? 'text-emerald-600 font-bold' : 'text-slate-500'
                    }`}
                >
                    <Wallet className="w-5 h-5" />
                    <span className="text-[10px]">المحافظ</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        playPs5NavigateSound();
                        setActiveTab('loyalty');
                    }}
                    className={`flex-1 flex flex-col items-center gap-1 py-1 rounded-xl transition-all cursor-pointer ${
                        activeTab === 'loyalty' ? 'text-amber-500 font-bold' : 'text-slate-500'
                    }`}
                >
                    <Star className="w-5 h-5" />
                    <span className="text-[10px]">الولاء</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        playPs5NavigateSound();
                        setActiveTab('tournaments');
                    }}
                    className={`flex-1 flex flex-col items-center gap-1 py-1 rounded-xl transition-all cursor-pointer ${
                        activeTab === 'tournaments' ? 'text-red-600 font-bold' : 'text-slate-500'
                    }`}
                >
                    <Trophy className="w-5 h-5" />
                    <span className="text-[10px]">البطولات</span>
                </button>
            </nav>
        </div>
    );
}
