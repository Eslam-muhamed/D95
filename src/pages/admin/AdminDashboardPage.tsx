import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Gamepad2,
    UtensilsCrossed,
    FolderTree,
    Flame,
    ExternalLink,
    LogOut,
    Database,
    Shield,
    Menu,
    X,
    Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import OverviewTab from '@/components/admin/OverviewTab';
import BookingsTab from '@/components/admin/BookingsTab';
import ProductsTab from '@/components/admin/ProductsTab';
import CategoriesTab from '@/components/admin/CategoriesTab';
import OffersTab from '@/components/admin/OffersTab';
import LiveStationsTab from '@/components/admin/LiveStationsTab';

import { supabase } from '@/lib/supabase';

type TabType = 'pos' | 'overview' | 'bookings' | 'products' | 'categories' | 'offers';

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('pos');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Auth verification: ensure active Supabase session
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate('/admin/login');
            }
        });
    }, [navigate]);

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

    const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
        { id: 'pos', label: 'التحكم بالأجهزة (Gaming POS)', icon: <Gamepad2 className="w-4 h-4 text-red-500" /> },
        { id: 'overview', label: 'نظرة عامة', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'bookings', label: 'حجوزات البلايستيشن', icon: <Calendar className="w-4 h-4" /> },
        { id: 'products', label: 'المنتجات والأسعار', icon: <UtensilsCrossed className="w-4 h-4" /> },
        { id: 'categories', label: 'أقسام المنيو', icon: <FolderTree className="w-4 h-4" /> },
        { id: 'offers', label: 'العروض الترويجية', icon: <Flame className="w-4 h-4" /> },
    ];

    return (
        <div className="min-h-screen w-full bg-[#0a0809] text-white font-body selection:bg-red-600 selection:text-white flex flex-col" dir="rtl">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-[#120c0f]/95 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between">
                {/* Brand & Connection Badge */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] border border-red-400/30">
                        <Gamepad2 className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-brush text-2xl font-bold leading-none tracking-tight">
                                <span className="text-white">D</span><span className="text-red-500">95</span>
                            </span>
                            <span className="text-[10px] bg-red-950 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                                DASHBOARD
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>متصل بقاعدة d95 (Supabase)</span>
                        </div>
                    </div>
                </div>

                {/* Right Actions: Public Site Link + Logout */}
                <div className="flex items-center gap-2">
                    <a
                        href="/menu"
                        target="_blank"
                        rel="noreferrer"
                        className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
                    >
                        <span>معاينة المنيو الحي</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors cursor-pointer"
                        title="تسجيل الخروج"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">خروج</span>
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-xl bg-white/5 sm:hidden text-neutral-300"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Desktop Tabs Navigation Bar */}
            <div className="bg-[#140e11]/80 border-b border-white/10 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-none">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.35)] border border-red-500/40'
                                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Dropdown Nav */}
            {mobileMenuOpen && (
                <div className="sm:hidden bg-[#140e11] border-b border-white/10 p-3 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                                setActiveTab(item.id);
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-right ${
                                activeTab === item.id ? 'bg-red-600 text-white' : 'text-neutral-300 hover:bg-white/5'
                            }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                    <div className="pt-2 border-t border-white/10">
                        <a
                            href="/menu"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between px-3.5 py-2 text-xs text-neutral-300"
                        >
                            <span>معاينة المنيو الحي للزبائن</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                {activeTab === 'pos' && <LiveStationsTab />}
                {activeTab === 'overview' && <OverviewTab onSwitchTab={(t: TabType) => setActiveTab(t)} />}
                {activeTab === 'bookings' && <BookingsTab />}
                {activeTab === 'products' && <ProductsTab />}
                {activeTab === 'categories' && <CategoriesTab />}
                {activeTab === 'offers' && <OffersTab />}
            </main>
        </div>
    );
}
