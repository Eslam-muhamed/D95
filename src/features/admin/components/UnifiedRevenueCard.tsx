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
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

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
        <div className="bg-gradient-to-br from-white via-slate-50/80 to-slate-100/60 border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs relative overflow-hidden transition-all" dir="rtl">
            {/* Top Row: Title, Period Toggle, Refresh, Collapse */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${!isCollapsed ? 'pb-4 border-b border-slate-200/70' : ''}`}>
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                                إجمالي الإيرادات الموحدة
                            </h2>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                كافيه + بلايستيشن
                            </span>
                        </div>
                        {isCollapsed ? (
                            <div className="flex items-center gap-3 text-xs mt-1">
                                <span className="font-bold text-emerald-700 font-mono">
                                    {totalAmount.toLocaleString()} ج.م
                                </span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500 text-[11px]">
                                    (PS: <strong className="font-mono text-blue-700">{psAmount.toLocaleString()}</strong> | كافيه: <strong className="font-mono text-amber-700">{cafeAmount.toLocaleString()}</strong>)
                                </span>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                {isToday ? 'صافي المبيعات والحجوزات المسجلة اليوم' : 'إجمالي الدخل التاريخي التراكمي في النظام'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Period Controls & Quick Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <div className="bg-slate-200/70 p-1 rounded-xl flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => {
                                playPs5SelectSound();
                                setPeriod('today');
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                !isToday
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            الإجمالي العام
                        </button>
                    </div>

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
                        onClick={() => {
                            playPs5NavigateSound();
                            setIsCollapsed(!isCollapsed);
                        }}
                        title={isCollapsed ? 'توسيع الكارت والتفاصيل' : 'تصغير الكارت'}
                        className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Collapsible Stats Grid */}
            {!isCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
                    {/* 1. Grand Total Card */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-600">
                                {isToday ? 'إجمالي دخل اليوم الموحد' : 'إجمالي الدخل الكلي'}
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="my-3">
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-mono text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight">
                                    {loading ? '...' : totalAmount.toLocaleString()}
                                </span>
                                <span className="text-sm font-bold text-slate-500">ج.م</span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block">
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

                    {/* 2. PlayStation Revenue Card */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                                    <Gamepad2 className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-slate-700">دخل البلايستيشن</span>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                                {psPercent}%
                            </span>
                        </div>
                        <div className="my-3">
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-mono text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
                                    {loading ? '...' : psAmount.toLocaleString()}
                                </span>
                                <span className="text-xs font-bold text-slate-500">ج.م</span>
                            </div>
                            <span className="text-[11px] text-slate-500 mt-1 block">
                                حجوزات وجلسات الغرف المؤكدة
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span>العمليات:</span>
                            <span className="font-mono font-bold text-slate-700">{metrics?.psCount || 0} حجز</span>
                        </div>
                    </div>

                    {/* 3. Cafe Revenue Card */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-amber-200 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                                    <Coffee className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-slate-700">دخل الكافيه والسناكس</span>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                                {cafePercent}%
                            </span>
                        </div>
                        <div className="my-3">
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-mono text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
                                    {loading ? '...' : cafeAmount.toLocaleString()}
                                </span>
                                <span className="text-xs font-bold text-slate-500">ج.م</span>
                            </div>
                            <span className="text-[11px] text-slate-500 mt-1 block">
                                طلبات المشروبات والمأكولات المكتملة
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span>الطلبات:</span>
                            <span className="font-mono font-bold text-slate-700">{metrics?.cafeCount || 0} طلب</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
