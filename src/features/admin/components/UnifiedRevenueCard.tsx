import { useState, useEffect, useCallback } from 'react';
import {
    DollarSign,
    Gamepad2,
    Coffee,
    TrendingUp,
    RefreshCw,
    Calendar,
    Sparkles,
    CheckCircle2,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
    fetchUnifiedRevenueMetrics,
    getCachedUnifiedRevenueMetrics,
    type UnifiedRevenueMetrics,
} from '@/services/revenueService';
import { playPs5SelectSound, playPs5NavigateSound } from '@/lib/sound';

export default function UnifiedRevenueCard() {
    const [period, setPeriod] = useState<'today' | 'allTime'>('today');
    const [metrics, setMetrics] = useState<UnifiedRevenueMetrics | null>(() => getCachedUnifiedRevenueMetrics());
    const [loading, setLoading] = useState<boolean>(() => !getCachedUnifiedRevenueMetrics());
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem('d95_revenue_card_collapsed');
            if (saved !== null) return saved === 'true';
        } catch {
            // Ignore localStorage errors
        }
        return true; // Default collapsed (ملموم) as requested
    });

    const toggleCollapse = () => {
        playPs5NavigateSound();
        setIsCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('d95_revenue_card_collapsed', String(next));
            } catch {
                // Ignore localStorage errors
            }
            return next;
        });
    };

    const loadMetrics = useCallback(async (silent = false) => {
        if (!silent && !getCachedUnifiedRevenueMetrics()) setLoading(true);
        else setRefreshing(true);

        try {
            const data = await fetchUnifiedRevenueMetrics();
            setMetrics(data);
        } catch {
            toast.error('تعذر جلب إحصائيات الإيرادات الموحدة');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadMetrics();

        // Realtime sync on orders and bookings updates
        const channel = supabase
            .channel('realtime_revenue_tracker')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => loadMetrics(true)
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'ps_bookings' },
                () => loadMetrics(true)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadMetrics]);

    const isToday = period === 'today';
    const totalAmount = isToday ? (metrics?.totalToday || 0) : (metrics?.totalAllTime || 0);
    const psAmount = isToday ? (metrics?.psToday || 0) : (metrics?.psAllTime || 0);
    const cafeAmount = isToday ? (metrics?.cafeToday || 0) : (metrics?.cafeAllTime || 0);

    const psPercent = totalAmount > 0 ? Math.round((psAmount / totalAmount) * 100) : 0;
    const cafePercent = totalAmount > 0 ? Math.round((cafeAmount / totalAmount) * 100) : 0;

    return (
        <div className="bg-gradient-to-br from-white via-slate-50/80 to-slate-100/60 border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs relative overflow-hidden transition-all" dir="rtl">
            {/* Top Row: Title, Period Toggle, Refresh, Collapse */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 ${!isCollapsed ? 'pb-3.5 sm:pb-4 border-b border-slate-200/70' : ''}`}>
                {/* Brand Title & Amount Summary */}
                <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <h2 className="text-xs sm:text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                                    إجمالي الإيرادات الموحدة
                                </h2>
                                <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                                    <span>كافيه + PS</span>
                                </span>
                            </div>
                            {isCollapsed ? (
                                <div className="flex items-center gap-1.5 sm:gap-3 text-xs mt-0.5 flex-wrap">
                                    <span className="font-bold text-emerald-700 font-mono text-sm sm:text-base">
                                        {totalAmount.toLocaleString()} ج.م
                                    </span>
                                    <span className="text-slate-300 hidden sm:inline">•</span>
                                    <span className="text-slate-500 text-[10px] sm:text-[11px] truncate">
                                        (PS: <strong className="font-mono text-blue-700">{psAmount.toLocaleString()}</strong> | كافيه: <strong className="font-mono text-amber-700">{cafeAmount.toLocaleString()}</strong>)
                                    </span>
                                </div>
                            ) : (
                                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium">
                                    {isToday ? 'صافي المبيعات والحجوزات المسجلة اليوم' : 'إجمالي الدخل التاريخي التراكمي في النظام'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Mobile-only Quick Action Buttons (Collapse & Refresh) */}
                    <div className="flex sm:hidden items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                playPs5SelectSound();
                                loadMetrics(true);
                            }}
                            disabled={refreshing || loading}
                            title="تحديث الأرقام لحظياً"
                            className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
                        </button>
                        <button
                            type="button"
                            onClick={toggleCollapse}
                            title={isCollapsed ? 'توسيع الكارت والتفاصيل' : 'تصغير الكارت'}
                            className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                        >
                            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Period Controls & Desktop Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-0.5 sm:pt-0">
                    <div className="bg-slate-200/70 p-0.5 sm:p-1 rounded-xl flex items-center gap-1 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => {
                                playPs5SelectSound();
                                setPeriod('today');
                            }}
                            className={`flex-1 sm:flex-none px-3 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer active:scale-95 ${
                                isToday
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            اليوم
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                playPs5SelectSound();
                                setPeriod('allTime');
                            }}
                            className={`flex-1 sm:flex-none px-3 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer active:scale-95 ${
                                !isToday
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            الإجمالي العام
                        </button>
                    </div>

                    {/* Desktop-only action buttons */}
                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                playPs5SelectSound();
                                loadMetrics(true);
                            }}
                            disabled={refreshing || loading}
                            title="تحديث الأرقام لحظياً"
                            className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
                        </button>

                        <button
                            type="button"
                            onClick={toggleCollapse}
                            title={isCollapsed ? 'توسيع الكارت والتفاصيل' : 'تصغير الكارت'}
                            className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Collapsible Stats Grid: 2 columns on mobile, 3 columns on desktop */}
            {!isCollapsed && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 pt-3.5 sm:pt-5">
                    {/* 1. Grand Total Card (spans full width on mobile) */}
                    <div className="col-span-2 md:col-span-1 bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-600">
                                {isToday ? 'إجمالي دخل اليوم الموحد' : 'إجمالي الدخل الكلي'}
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="my-2.5 sm:my-3">
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-mono text-2xl sm:text-4xl font-black text-emerald-600 tracking-tight">
                                    {loading ? '...' : totalAmount.toLocaleString()}
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-slate-500">ج.م</span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 block">
                                {isToday ? 'مجموع إيرادات الغرف ومبيعات الكافيه اليوم' : 'الدخل التراكمي الشامل لكافة العمليات'}
                            </span>
                        </div>
                        {/* Visual Ratio Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex mt-1">
                            <div
                                style={{ width: `${psPercent}%` }}
                                className="bg-blue-600 transition-all duration-500"
                                title={`بلايستيشن: ${psPercent}%`}
                            />
                            <div
                                style={{ width: `${cafePercent}%` }}
                                className="bg-amber-500 transition-all duration-500"
                                title={`كافيه: ${cafePercent}%`}
                            />
                        </div>
                    </div>

                    {/* 2. PlayStation Revenue Card (1 column on mobile) */}
                    <div className="col-span-1 bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-5 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                                    <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </div>
                                <span className="text-[11px] sm:text-xs font-bold text-slate-700 truncate">دخل البلايستيشن</span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-blue-200/60 shrink-0">
                                {psPercent}%
                            </span>
                        </div>
                        <div className="my-2 sm:my-3">
                            <div className="flex items-baseline gap-1">
                                <span className="font-mono text-lg sm:text-3xl font-black text-blue-600 tracking-tight">
                                    {loading ? '...' : psAmount.toLocaleString()}
                                </span>
                                <span className="text-[10px] sm:text-xs font-bold text-slate-500">ج.م</span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 block truncate">
                                حجوزات الغرف المؤكدة
                            </span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span>العمليات:</span>
                            <span className="font-mono font-bold text-slate-700">{metrics?.psCount || 0} حجز</span>
                        </div>
                    </div>

                    {/* 3. Cafe Revenue Card (1 column on mobile) */}
                    <div className="col-span-1 bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-5 shadow-xs flex flex-col justify-between hover:border-amber-200 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                                    <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </div>
                                <span className="text-[11px] sm:text-xs font-bold text-slate-700 truncate">دخل الكافيه</span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-amber-200/60 shrink-0">
                                {cafePercent}%
                            </span>
                        </div>
                        <div className="my-2 sm:my-3">
                            <div className="flex items-baseline gap-1">
                                <span className="font-mono text-lg sm:text-3xl font-black text-amber-600 tracking-tight">
                                    {loading ? '...' : cafeAmount.toLocaleString()}
                                </span>
                                <span className="text-[10px] sm:text-xs font-bold text-slate-500">ج.م</span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 block truncate">
                                المشروبات والسناكس
                            </span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span>الطلبات:</span>
                            <span className="font-mono font-bold text-slate-700">{metrics?.cafeCount || 0} طلب</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
