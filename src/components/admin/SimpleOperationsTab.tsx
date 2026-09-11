import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    LayoutDashboard,
    Clock,
    Gamepad2,
    Calendar,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Search,
    Phone,
    MessageCircle,
    User,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    Settings2,
    Check,
    X,
    List,
    ChevronDown,
    ChevronUp,
    Info,
    Trash2,
    DollarSign,
    ShieldCheck,
    Lock,
    Unlock,
    Users,
    Square,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    fetchBookingsForDate,
    fetchPaginatedBookings,
    fetchBookingMetrics,
    updateBookingStatus,
    deleteBooking,
    fetchBookingPolicy,
    updateBookingPolicy,
    fetchRoomRates,
    updateRoomRates,
    confirmBookingAndResolveConflicts,
    groupConflictingPendingBookings,
    getBookingDates,
    type RoomRates,
    type ConflictGroup,
} from '@/services/bookingService';
import {
    getCairoTodayDateString,
    addDaysToDateString,
    formatArabicTimeFromDate,
} from '@/lib/bookingDatetime';
import type { DBBooking, BookingPolicy } from '@/types/database';
import BookingDetailsModal from './BookingDetailsModal';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';

type SubTabType = 'dashboard' | 'details' | 'settings';

function formatTimeAgo(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
}

export default function SimpleOperationsTab() {
    const [activeSubTab, setActiveSubTab] = useState<SubTabType>('dashboard');

    // Cairo-pinned Date
    const todayStr = useMemo(() => getCairoTodayDateString(), []);
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);

    // Data State
    const [loading, setLoading] = useState<boolean>(true);
    const [todayBookings, setTodayBookings] = useState<DBBooking[]>([]);
    const [allPendingBookings, setAllPendingBookings] = useState<DBBooking[]>([]);

    // Modals
    const [activeDetailBooking, setActiveDetailBooking] = useState<DBBooking | null>(null);

    // Policy & Rates
    const [policy, setPolicy] = useState<BookingPolicy | null>(null);
    const [isSavingPolicy, setIsSavingPolicy] = useState<boolean>(false);
    const [, setRoomRates] = useState<RoomRates>({ 'room-1': 100, 'room-2': 100 });
    const [rateRoom1, setRateRoom1] = useState<number>(100);
    const [rateRoom2, setRateRoom2] = useState<number>(100);
    const [savingRates, setSavingRates] = useState<boolean>(false);

    // Filters for Daily Schedule
    const [roomFilter, setRoomFilter] = useState<string>('all');
    const [dailySearch, setDailySearch] = useState<string>('');

    // Accordion for Conflicting Bookings
    const [expandedConflictIds, setExpandedConflictIds] = useState<Record<string, boolean>>({});

    // Archive / Details State
    const [archivePage, setArchivePage] = useState<number>(1);
    const [archiveTotalPages, setArchiveTotalPages] = useState<number>(1);
    const [archiveTotalCount, setArchiveTotalCount] = useState<number>(0);
    const [archiveSearch, setArchiveSearch] = useState<string>('');
    const [archiveStatusFilter, setArchiveStatusFilter] = useState<string>('all');
    const [archiveDateFilter, setArchiveDateFilter] = useState<string>('');
    const [archiveBookings, setArchiveBookings] = useState<DBBooking[]>([]);
    const [archiveLoading, setArchiveLoading] = useState<boolean>(false);

    // Live Clock
    const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
    useEffect(() => {
        const updateClock = () => {
            try {
                setCurrentTimeStr(formatArabicTimeFromDate(new Date()));
            } catch {
                setCurrentTimeStr(new Date().toLocaleTimeString('ar-EG'));
            }
        };
        updateClock();
        const timer = setInterval(updateClock, 10000);
        return () => clearInterval(timer);
    }, []);

    // 1. Load Data
    const loadOperationsData = useCallback(async () => {
        setLoading(true);
        try {
            const [metrics, dayData, rates, pol] = await Promise.all([
                fetchBookingMetrics(),
                fetchBookingsForDate(selectedDate),
                fetchRoomRates(),
                fetchBookingPolicy(),
            ]);

            setAllPendingBookings(metrics.recentPending);
            setTodayBookings(dayData);
            setRoomRates(rates);
            setRateRoom1(rates['room-1'] || 100);
            setRateRoom2(rates['room-2'] || 100);
            setPolicy(pol);
        } catch {
            toast.error('تعذر جلب بيانات الحجوزات');
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        loadOperationsData();
    }, [loadOperationsData]);

    // 2. Load Archive Data
    const loadArchiveData = useCallback(async (targetPage = archivePage) => {
        if (activeSubTab !== 'details') return;
        setArchiveLoading(true);
        try {
            const res = await fetchPaginatedBookings({
                status: archiveStatusFilter !== 'all' ? archiveStatusFilter : undefined,
                date: archiveDateFilter || undefined,
                search: archiveSearch || undefined,
                page: targetPage,
                pageSize: 15,
            });
            setArchiveBookings(res.bookings);
            setArchiveTotalCount(res.totalCount);
            setArchiveTotalPages(res.totalPages);
            setArchivePage(targetPage);
        } catch {
            toast.error('تعذر جلب تفاصيل الحجوزات');
        } finally {
            setArchiveLoading(false);
        }
    }, [activeSubTab, archiveStatusFilter, archiveDateFilter, archiveSearch, archivePage]);

    useEffect(() => {
        if (activeSubTab === 'details') {
            loadArchiveData(archivePage);
        }
    }, [activeSubTab, archivePage, archiveDateFilter, loadArchiveData]);

    // Fast Shortcut: Confirm Booking
    const handleQuickConfirm = async (b: DBBooking) => {
        playPs5SelectSound();
        const { end } = getBookingDates(b);
        if (end.getTime() <= Date.now()) {
            toast.error('لا يمكن تأكيد هذا الحجز لأن موعده قد انتهى بالفعل');
            return;
        }
        try {
            await updateBookingStatus(b.id, 'confirmed');
            toast.success(`تم تأكيد حجز ${b.customer_name} بنجاح! ✅`);
            setAllPendingBookings(prev => prev.filter(item => item.id !== b.id));
            setTodayBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'confirmed' } : item));
        } catch {
            toast.error('تعذر تأكيد الحجز');
        }
    };

    // Fast Shortcut: Cancel Booking
    const handleQuickReject = async (b: DBBooking) => {
        playPs5NavigateSound();
        if (!confirm(`هل أنت متأكد من إلغاء حجز ${b.customer_name}؟`)) return;
        try {
            await updateBookingStatus(b.id, 'cancelled');
            toast.info(`تم إلغاء حجز ${b.customer_name}`);
            setAllPendingBookings(prev => prev.filter(item => item.id !== b.id));
            setTodayBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'cancelled' } : item));
        } catch {
            toast.error('تعذر إلغاء الحجز');
        }
    };

    // Fast Shortcut: Finish Ongoing Session Early
    const handleQuickFinish = async (b: DBBooking) => {
        playPs5SelectSound();
        if (!confirm(`هل تريد إنهاء جلسة ${b.customer_name} الآن وتفريغ الغرفة؟`)) return;
        try {
            await updateBookingStatus(b.id, 'completed');
            toast.success(`تم إنهاء جلسة ${b.customer_name} بنجاح ✅`);
            setTodayBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'completed' } : item));
        } catch {
            toast.error('تعذر إنهاء الجلسة');
        }
    };

    // Conflict Resolution: Confirm Winner and Auto-Cancel Competitors
    const handleConfirmConflictWinner = async (winnerBooking: DBBooking, group: ConflictGroup) => {
        playPs5SelectSound();
        try {
            const { cancelledIds } = await confirmBookingAndResolveConflicts(winnerBooking.id, true);
            toast.success(`تم اعتماد حجز ${winnerBooking.customer_name}! وتم إلغاء الطلبات المتنافسة الأخرى تلقائياً. ✅`);

            setAllPendingBookings(prev =>
                prev.filter(b => b.id !== winnerBooking.id && !cancelledIds.includes(b.id))
            );
            setTodayBookings(prev =>
                prev.map(b => {
                    if (b.id === winnerBooking.id) return { ...b, status: 'confirmed' };
                    if (cancelledIds.includes(b.id)) return { ...b, status: 'cancelled' };
                    return b;
                })
            );
            loadOperationsData();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'تعذر اعتماد الحجز';
            toast.error(msg);
        }
    };

    // Delete Booking from Archive
    const handleDeleteBooking = async (id: string, name: string) => {
        playPs5NavigateSound();
        if (!confirm(`هل أنت متأكد من حذف حجز "${name}" نهائياً؟`)) return;
        try {
            await deleteBooking(id);
            toast.success('تم حذف الحجز بنجاح');
            setArchiveBookings(prev => prev.filter(b => b.id !== id));
            setTodayBookings(prev => prev.filter(b => b.id !== id));
        } catch {
            toast.error('تعذر حذف الحجز');
        }
    };

    // Policy Switcher (10-Min Hold vs Admin Approval)
    const handlePolicySwitch = async (mode: 'admin_approval_only' | 'temporary_hold') => {
        if (!policy || policy.mode === mode) return;
        setIsSavingPolicy(true);
        playPs5SelectSound();
        try {
            const updated = await updateBookingPolicy({
                ...policy,
                mode,
            });
            setPolicy(updated);
            toast.success(
                mode === 'temporary_hold'
                    ? 'تم تفعيل نظام القفل المؤقت لمدة 10 دقائق بنجاح! 🔒'
                    : 'تم تفعيل نظام الموافقة المسبقة للإدارة بنجاح! 🔓'
            );
        } catch {
            toast.error('تعذر حفظ السياسة');
        } finally {
            setIsSavingPolicy(false);
        }
    };

    // Save Room Rates
    const handleSaveRoomRates = async () => {
        setSavingRates(true);
        playPs5SelectSound();
        try {
            const updated = await updateRoomRates({
                'room-1': Number(rateRoom1) || 100,
                'room-2': Number(rateRoom2) || 100,
            });
            setRoomRates(updated);
            toast.success('تم حفظ وتطبيق أسعار ساعات الغرف بنجاح! 🎮');
        } catch {
            toast.error('تعذر حفظ أسعار الغرف');
        } finally {
            setSavingRates(false);
        }
    };

    // Conflict Groups (overlapping pending bookings)
    const conflictGroups = useMemo(() => {
        return groupConflictingPendingBookings(allPendingBookings);
    }, [allPendingBookings]);

    const toggleConflictGroup = (groupId: string) => {
        setExpandedConflictIds(prev => ({
            ...prev,
            [groupId]: prev[groupId] === undefined ? false : !prev[groupId]
        }));
    };

    // Active Ongoing Sessions
    const ongoingBookings = useMemo(() => {
        const nowMs = Date.now();
        return todayBookings.filter(b => {
            if (b.status !== 'confirmed') return false;
            const { start, end } = getBookingDates(b);
            return start.getTime() <= nowMs && end.getTime() > nowMs;
        });
    }, [todayBookings]);

    // Today's Expected Revenue
    const todayRevenue = useMemo(() => {
        return todayBookings
            .filter(b => b.status === 'confirmed' || b.status === 'completed')
            .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
    }, [todayBookings]);

    // Filtered Daily Bookings
    const filteredDailyBookings = useMemo(() => {
        return todayBookings.filter(b => {
            if (roomFilter !== 'all' && b.room_name !== roomFilter) return false;
            if (dailySearch.trim()) {
                const s = dailySearch.toLowerCase();
                const matchName = b.customer_name?.toLowerCase().includes(s);
                const matchPhone = b.customer_phone?.includes(s);
                const matchCode = b.reservation_id?.toLowerCase().includes(s);
                if (!matchName && !matchPhone && !matchCode) return false;
            }
            return true;
        });
    }, [todayBookings, roomFilter, dailySearch]);

    // Room options
    const roomOptions = useMemo(() => {
        const set = new Set<string>();
        todayBookings.forEach(b => { if (b.room_name) set.add(b.room_name); });
        return Array.from(set);
    }, [todayBookings]);

    // Date formatted in clear Arabic
    const formattedDateTitle = useMemo(() => {
        try {
            const [y, m, d] = selectedDate.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            return new Intl.DateTimeFormat('ar-EG', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
            }).format(dateObj);
        } catch {
            return selectedDate;
        }
    }, [selectedDate]);

    // WhatsApp opener
    const openWhatsAppDirect = (e: React.MouseEvent, b: DBBooking) => {
        e.stopPropagation();
        let phone = b.customer_phone.replace(/\D/g, '');
        if (phone.startsWith('0')) phone = '2' + phone;
        else if (!phone.startsWith('20')) phone = '20' + phone;
        const text = `أهلاً بحضرتك يا أستاذ ${b.customer_name} 👋\nمعاك إدارة D95 Gaming Lounge 🎮\n\nبخصوص حجزك (${b.reservation_id}):\n📍 الغرفة: ${b.room_name}\n📅 التاريخ: ${b.booking_date}\n⏰ التوقيت: ${b.start_time} - ${b.end_time} (${b.duration_hours} س)\n\nفي انتظارك تنورنا!`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="space-y-4 max-w-7xl mx-auto" dir="rtl">
            {/* SUB-TABS NAVIGATION (Clean Light Executive Style) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto">
                    {/* 1. Dashboard & Today */}
                    <button
                        type="button"
                        onClick={() => {
                            playPs5NavigateSound();
                            setActiveSubTab('dashboard');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                            activeSubTab === 'dashboard'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>داشبورد وإحصائيات اليوم</span>
                        {allPendingBookings.length > 0 && (
                            <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                                {allPendingBookings.length}
                            </span>
                        )}
                    </button>

                    {/* 2. Detailed Bookings */}
                    <button
                        type="button"
                        onClick={() => {
                            playPs5NavigateSound();
                            setActiveSubTab('details');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                            activeSubTab === 'details'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <List className="w-4 h-4" />
                        <span>تفاصيل الحجوزات</span>
                    </button>

                    {/* 3. Settings */}
                    <button
                        type="button"
                        onClick={() => {
                            playPs5NavigateSound();
                            setActiveSubTab('settings');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                            activeSubTab === 'settings'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <Settings2 className="w-4 h-4" />
                        <span>إعدادات الحجز</span>
                    </button>
                </div>

                {/* Clock & Refresh */}
                <div className="flex items-center gap-2 mr-auto sm:mr-0 text-xs">
                    <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-mono font-bold text-slate-700">{currentTimeStr}</span>
                    </div>

                    <button
                        type="button"
                        onClick={loadOperationsData}
                        disabled={loading}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                        title="تحديث البيانات"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : ''}`} />
                    </button>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* SUB-TAB 1: DASHBOARD & TODAY'S OPERATIONS */}
            {/* ========================================================================= */}
            {activeSubTab === 'dashboard' && (
                <div className="space-y-4">
                    {/* 4 Professional Executive KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* 1. Today's Bookings */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
                            <div>
                                <span className="text-xs text-slate-500 font-bold block">حجوزات اليوم</span>
                                <span className="font-sans text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
                                    {todayBookings.length}
                                </span>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                                <Calendar className="w-5 h-5" />
                            </div>
                        </div>

                        {/* 2. Ongoing Gaming Now */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
                            <div>
                                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>شغال الآن بالصالة</span>
                                </span>
                                <span className="font-sans text-2xl sm:text-3xl font-black text-emerald-600 mt-1 block">
                                    {ongoingBookings.length}
                                </span>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                                <Gamepad2 className="w-5 h-5" />
                            </div>
                        </div>

                        {/* 3. Pending Bookings */}
                        <div className={`border rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs ${
                            allPendingBookings.length > 0 ? 'border-amber-300 bg-amber-50/40' : 'bg-white border-slate-200/90'
                        }`}>
                            <div>
                                <span className="text-xs text-amber-800 font-bold block">بانتظار التأكيد</span>
                                <span className="font-sans text-2xl sm:text-3xl font-black text-amber-600 mt-1 block">
                                    {allPendingBookings.length}
                                </span>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                        </div>

                        {/* 4. Expected Revenue */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
                            <div>
                                <span className="text-xs text-slate-500 font-bold block">إيرادات اليوم المتوقعة</span>
                                <span className="font-sans text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
                                    {todayRevenue} <span className="text-xs font-normal text-slate-500">ج.م</span>
                                </span>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* CONFLICT DROPDOWN LIST (نظام الـ 10 دقائق وتنافس المواعيد) */}
                    {conflictGroups.length > 0 && (
                        <div className="space-y-3 bg-amber-50/60 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                    <div>
                                        <h3 className="text-sm sm:text-base font-bold text-amber-900">
                                            مواعيد بها طلبات حجز متنافسة في نفس الوقت ({conflictGroups.length})
                                        </h3>
                                        <p className="text-xs text-amber-800/80 mt-0.5">
                                            حجز أكثر من عميل نفس الموعد خلال نظام الـ 10 دقائق. اضغط على الموعد لاختيار العميل المعتمد.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Dropdown Accordions for each conflict slot */}
                            <div className="space-y-2.5 pt-1">
                                {conflictGroups.map((group) => {
                                    const isExpanded = expandedConflictIds[group.id] ?? true;

                                    return (
                                        <div
                                            key={group.id}
                                            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
                                        >
                                            {/* Trigger Header */}
                                            <div
                                                onClick={() => toggleConflictGroup(group.id)}
                                                className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-xs">
                                                        <Users className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="flex items-center gap-2.5 flex-wrap">
                                                        <span className="font-bold text-slate-900 text-sm">{group.roomName}</span>
                                                        <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded">
                                                            ⏰ {group.formattedTimeRange}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            📅 {group.bookingDate}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-400 text-slate-950">
                                                        {group.bookings.length} متنافسين
                                                    </span>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                                </div>
                                            </div>

                                            {/* Dropdown Content */}
                                            {isExpanded && (
                                                <div className="p-3 sm:p-4 border-t border-slate-200 space-y-2 bg-slate-50/50">
                                                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pb-1">
                                                        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                        <span>الطلبات مرتبة حسب أسبقية وقت الإرسال. تأكيد أحد الحجزين يقفل الموعد لصالحه ويلغي المتنافس الآخر تلقائياً.</span>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {group.bookings.map((b, idx) => {
                                                            const isFirst = idx === 0;
                                                            const timeAgo = formatTimeAgo(b.created_at);

                                                            return (
                                                                <div
                                                                    key={b.id}
                                                                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                                                        isFirst
                                                                            ? 'bg-amber-50/60 border-amber-300'
                                                                            : 'bg-white border-slate-200'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                                                            isFirst ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-700'
                                                                        }`}>
                                                                            {isFirst ? '🥇 الأسبق' : `🥈 متنافس #${idx + 1}`}
                                                                        </span>

                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <h4 className="text-sm font-bold text-slate-900">{b.customer_name}</h4>
                                                                                <span className="text-[11px] text-slate-500">({timeAgo})</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                                                <span dir="ltr" className="font-mono text-slate-600">{b.customer_phone}</span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => openWhatsAppDirect(e, b)}
                                                                                    className="text-emerald-600 hover:underline text-[11px] inline-flex items-center gap-0.5 font-bold"
                                                                                >
                                                                                    <MessageCircle className="w-3 h-3" />
                                                                                    <span>واتساب</span>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                                                                        <span className="font-bold text-emerald-700 text-sm">
                                                                            {b.total_amount} ج.م
                                                                        </span>

                                                                        <div className="flex items-center gap-1.5">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleConfirmConflictWinner(b, group)}
                                                                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                                                                            >
                                                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                                                <span>تأكيد واعتماد الحجز</span>
                                                                            </button>

                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleQuickReject(b)}
                                                                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                                                                            >
                                                                                <X className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Date Navigator Bar & Room Filter */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                        {/* Date Selector */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setSelectedDate(prev => addDaysToDateString(prev, -1))}
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                                    title="اليوم السابق"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>

                                <div className="relative flex items-center px-3 py-1 cursor-pointer">
                                    <span className="text-xs sm:text-sm font-bold text-slate-900 whitespace-nowrap">
                                        {formattedDateTitle}
                                        {selectedDate === todayStr && (
                                            <span className="mr-1.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                                                اليوم
                                            </span>
                                        )}
                                    </span>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        title="اختر تاريخاً من التقويم"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSelectedDate(prev => addDaysToDateString(prev, 1))}
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                                    title="اليوم التالي"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                            </div>

                            {selectedDate !== todayStr && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedDate(todayStr)}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                                >
                                    الرجوع لليوم
                                </button>
                            )}
                        </div>

                        {/* Room Filter Pills */}
                        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-0.5 text-xs">
                            <button
                                type="button"
                                onClick={() => setRoomFilter('all')}
                                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                                    roomFilter === 'all' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                                }`}
                            >
                                كل الغرف
                            </button>
                            {roomOptions.map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRoomFilter(r)}
                                    className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                                        roomFilter === r ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Today's Bookings Section */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-red-600" />
                                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                    قائمة مواعيد اليوم ({filteredDailyBookings.length})
                                </h3>
                            </div>

                            {/* Search */}
                            <div className="relative w-48 sm:w-64">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="بحث بالاسم أو الهاتف..."
                                    value={dailySearch}
                                    onChange={(e) => setDailySearch(e.target.value)}
                                    className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl pr-9 pl-3 py-2 border border-slate-200 outline-none focus:bg-white focus:border-red-500 transition-colors"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-12 flex justify-center">
                                <RefreshCw className="w-5 h-5 animate-spin text-red-600" />
                            </div>
                        ) : filteredDailyBookings.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                                لا توجد حجوزات مسجلة لهذا التاريخ.
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-right text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80">
                                                <th className="py-3 px-3 font-semibold">الموعد والمدة</th>
                                                <th className="py-3 px-3 font-semibold">العميل</th>
                                                <th className="py-3 px-3 font-semibold">الغرفة</th>
                                                <th className="py-3 px-3 font-semibold">المبلغ</th>
                                                <th className="py-3 px-3 font-semibold">الحالة</th>
                                                <th className="py-3 px-3 text-left font-semibold">إجراء فوري (تأكيد / إلغاء)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredDailyBookings.map((b) => {
                                                const { start: bStart, end: bEnd } = getBookingDates(b);
                                                const nowMs = Date.now();
                                                const isEnded = bEnd.getTime() <= nowMs;
                                                const isStarted = bStart.getTime() <= nowMs;
                                                const isOngoing = isStarted && !isEnded && b.status === 'confirmed';

                                                return (
                                                    <tr
                                                        key={b.id}
                                                        onClick={() => setActiveDetailBooking(b)}
                                                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                                    >
                                                        {/* Time */}
                                                        <td className="py-3.5 px-3">
                                                            <div className="font-bold text-slate-900 text-xs">
                                                                {b.start_time} - {b.end_time}
                                                            </div>
                                                            <span className="text-[11px] text-slate-500">({b.duration_hours} س)</span>
                                                        </td>

                                                        {/* Client */}
                                                        <td className="py-3.5 px-3">
                                                            <div className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                                                                {b.customer_name}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                                                <span dir="ltr" className="font-mono text-slate-600">{b.customer_phone}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => openWhatsAppDirect(e, b)}
                                                                    className="text-emerald-600 hover:underline inline-flex items-center gap-0.5 font-bold"
                                                                >
                                                                    <MessageCircle className="w-3 h-3" />
                                                                    <span>واتساب</span>
                                                                </button>
                                                            </div>
                                                        </td>

                                                        {/* Room */}
                                                        <td className="py-3.5 px-3 text-slate-700 font-medium">
                                                            {b.room_name}
                                                        </td>

                                                        {/* Amount */}
                                                        <td className="py-3.5 px-3 font-bold text-emerald-700">
                                                            {b.total_amount} ج.م
                                                        </td>

                                                        {/* Status */}
                                                        <td className="py-3.5 px-3">
                                                            {isOngoing ? (
                                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                    <span>شغال الآن 🎮</span>
                                                                </span>
                                                            ) : b.status === 'confirmed' ? (
                                                                isEnded ? (
                                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                                        انتهى ⌛
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                                        مؤكد 🔒
                                                                    </span>
                                                                )
                                                            ) : b.status === 'pending' ? (
                                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                                    معلق ⏳
                                                                </span>
                                                            ) : (
                                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                                    {b.status === 'completed' ? 'مكتمل' : 'ملغي'}
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Immediate Shortcuts */}
                                                        <td className="py-3.5 px-3 text-left" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                {b.status === 'pending' && (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleQuickConfirm(b)}
                                                                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                                                                            title="تأكيد الحجز فوراً"
                                                                        >
                                                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                                            <span>تأكيد</span>
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleQuickReject(b)}
                                                                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                                                                            title="إلغاء الحجز"
                                                                        >
                                                                            <X className="w-3.5 h-3.5" />
                                                                            <span>إلغاء</span>
                                                                        </button>
                                                                    </>
                                                                )}

                                                                {isOngoing && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQuickFinish(b)}
                                                                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                                                        title="إنهاء الجلسة الآن"
                                                                    >
                                                                        <Square className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                                                                        <span>إنهاء الجلسة</span>
                                                                    </button>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() => setActiveDetailBooking(b)}
                                                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
                                                                >
                                                                    تفاصيل
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Responsive Cards View */}
                                <div className="md:hidden space-y-3">
                                    {filteredDailyBookings.map((b) => {
                                        const { start: bStart, end: bEnd } = getBookingDates(b);
                                        const nowMs = Date.now();
                                        const isEnded = bEnd.getTime() <= nowMs;
                                        const isStarted = bStart.getTime() <= nowMs;
                                        const isOngoing = isStarted && !isEnded && b.status === 'confirmed';

                                        return (
                                            <div
                                                key={b.id}
                                                onClick={() => setActiveDetailBooking(b)}
                                                className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-3 cursor-pointer shadow-xs"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-900">{b.customer_name}</h4>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                            <span dir="ltr" className="font-mono text-slate-600">{b.customer_phone}</span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => openWhatsAppDirect(e, b)}
                                                                className="text-emerald-600 text-[11px] font-bold"
                                                            >
                                                                واتساب
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        {isOngoing ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                شغال الآن 🎮
                                                            </span>
                                                        ) : b.status === 'confirmed' ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                                مؤكد 🔒
                                                            </span>
                                                        ) : b.status === 'pending' ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                                معلق ⏳
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                                {b.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-lg p-2.5 flex items-center justify-between text-xs border border-slate-200">
                                                    <div>
                                                        <span className="text-slate-500 text-[10px] block">الموعد والغرفة:</span>
                                                        <span className="text-slate-900 font-bold">{b.room_name}</span>
                                                        <span className="text-slate-600 text-[11px] block">{b.start_time} - {b.end_time} ({b.duration_hours} س)</span>
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="text-slate-500 text-[10px] block">المبلغ:</span>
                                                        <span className="text-emerald-700 font-bold text-sm">{b.total_amount} ج.م</span>
                                                    </div>
                                                </div>

                                                {/* Mobile Action Buttons */}
                                                <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                                                    {b.status === 'pending' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQuickConfirm(b)}
                                                                className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs"
                                                            >
                                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                                <span>تأكيد الحجز</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQuickReject(b)}
                                                                className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:text-rose-600 border border-slate-200 text-xs font-bold"
                                                            >
                                                                إلغاء
                                                            </button>
                                                        </>
                                                    )}

                                                    {isOngoing && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuickFinish(b)}
                                                            className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
                                                        >
                                                            <Square className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                                                            <span>إنهاء الجلسة</span>
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveDetailBooking(b)}
                                                        className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold text-center"
                                                    >
                                                        عرض التفاصيل
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 2: DETAILED BOOKINGS ARCHIVE */}
            {/* ========================================================================= */}
            {activeSubTab === 'details' && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                    {/* Search & Filters */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="ابحث باسم العميل أو الهاتف أو كود الحجز..."
                                value={archiveSearch}
                                onChange={(e) => {
                                    setArchiveSearch(e.target.value);
                                    setArchivePage(1);
                                }}
                                className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl pr-9 pl-3 py-2 border border-slate-200 outline-none focus:bg-white focus:border-red-500 transition-colors"
                            />
                        </div>

                        {/* Status Filter Pills */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-0.5">
                                {[
                                    { id: 'all', label: 'الكل' },
                                    { id: 'confirmed', label: 'مؤكد' },
                                    { id: 'pending', label: 'معلق' },
                                    { id: 'completed', label: 'مكتمل' },
                                    { id: 'cancelled', label: 'ملغي' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => {
                                            setArchiveStatusFilter(tab.id);
                                            setArchivePage(1);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                                            archiveStatusFilter === tab.id
                                                ? 'bg-red-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Date Filter */}
                            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <input
                                    type="date"
                                    value={archiveDateFilter}
                                    onChange={(e) => {
                                        setArchiveDateFilter(e.target.value);
                                        setArchivePage(1);
                                    }}
                                    className="bg-transparent text-slate-800 text-xs outline-none cursor-pointer font-mono"
                                />
                                {archiveDateFilter && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setArchiveDateFilter('');
                                            setArchivePage(1);
                                        }}
                                        className="text-slate-500 hover:text-slate-900 font-bold ml-1 text-xs"
                                        title="مسح فلتر التاريخ"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {archiveLoading ? (
                        <div className="py-16 flex justify-center">
                            <RefreshCw className="w-5 h-5 animate-spin text-red-600" />
                        </div>
                    ) : archiveBookings.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                            لا توجد نتائج مطابقة لمعايير البحث في الأرشيف.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80">
                                        <th className="py-3 px-3 font-semibold">كود الحجز</th>
                                        <th className="py-3 px-3 font-semibold">العميل</th>
                                        <th className="py-3 px-3 font-semibold">الغرفة</th>
                                        <th className="py-3 px-3 font-semibold">التاريخ والتوقيت</th>
                                        <th className="py-3 px-3 font-semibold">المبلغ</th>
                                        <th className="py-3 px-3 font-semibold">الحالة</th>
                                        <th className="py-3 px-3 text-left font-semibold">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {archiveBookings.map((b) => (
                                        <tr
                                            key={b.id}
                                            onClick={() => setActiveDetailBooking(b)}
                                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                        >
                                            <td className="py-3.5 px-3 font-mono text-slate-500">#{b.reservation_id}</td>
                                            <td className="py-3.5 px-3">
                                                <div className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                                                    {b.customer_name}
                                                </div>
                                                <span className="text-[11px] text-slate-500 font-mono" dir="ltr">
                                                    {b.customer_phone}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-3 text-slate-700">{b.room_name}</td>
                                            <td className="py-3.5 px-3">
                                                <div className="text-slate-900">{b.booking_date}</div>
                                                <div className="text-slate-500 text-[11px]">{b.start_time} - {b.end_time}</div>
                                            </td>
                                            <td className="py-3.5 px-3 font-bold text-emerald-700">{b.total_amount} ج.م</td>
                                            <td className="py-3.5 px-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    b.status === 'confirmed'
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        : b.status === 'pending'
                                                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                }`}>
                                                    {b.status === 'confirmed' ? 'مؤكد' : b.status === 'pending' ? 'معلق' : b.status === 'completed' ? 'مكتمل' : 'ملغي'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-3 text-left" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveDetailBooking(b)}
                                                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs"
                                                    >
                                                        تفاصيل
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteBooking(b.id, b.customer_name)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                        title="حذف الحجز"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {archiveTotalPages > 1 && (
                        <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs text-slate-500">
                            <span>صفحة {archivePage} من {archiveTotalPages} ({archiveTotalCount} حجز)</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setArchivePage(p => Math.max(1, p - 1))}
                                    disabled={archivePage <= 1}
                                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-30 cursor-pointer"
                                >
                                    السابق
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setArchivePage(p => Math.min(archiveTotalPages, p + 1))}
                                    disabled={archivePage >= archiveTotalPages}
                                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-30 cursor-pointer"
                                >
                                    التالي
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 3: SETTINGS (سياسة الـ 10 دقائق وأسعار الغرف) */}
            {/* ========================================================================= */}
            {activeSubTab === 'settings' && (
                <div className="space-y-4">
                    {/* Booking Policy Mode */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">سياسة وقفل مواعيد الحجز</h3>
                                    <p className="text-xs text-slate-500">
                                        اختر كيف يتعامل الموقع مع المواعيد عند قيام الزبائن بطلب حجز غرف البلايستيشن
                                    </p>
                                </div>
                            </div>

                            {isSavingPolicy && (
                                <div className="flex items-center gap-1 text-xs text-amber-600 animate-pulse">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>جاري الحفظ...</span>
                                </div>
                            )}
                        </div>

                        {/* 2 Policy Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {/* System 1: Admin Approval */}
                            <button
                                type="button"
                                onClick={() => handlePolicySwitch('admin_approval_only')}
                                disabled={isSavingPolicy}
                                className={`text-right p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                                    policy?.mode === 'admin_approval_only'
                                        ? 'bg-red-50/70 border-red-500 text-slate-900 shadow-xs ring-1 ring-red-500/40'
                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${policy?.mode === 'admin_approval_only' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                            <Unlock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm text-slate-900 block">النظام الأول: الموافقة المسبقة للإدارة</span>
                                            <span className="text-[11px] text-amber-700 font-medium">الموعد يظل متاحاً حتى تعتمده الإدارة</span>
                                        </div>
                                    </div>
                                    {policy?.mode === 'admin_approval_only' && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                                            النشط حالياً
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    الموعد لا يُقفل في الموقع إلا بعد تأكيدك. يمكن لعدة عملاء إرسال طلبات لنفس التوقيت، وستظهر لك في القائمة المنسدلة للمفاضلة واختيار العميل المعتمد.
                                </p>
                            </button>

                            {/* System 2: Temporary 10-Minute Hold */}
                            <button
                                type="button"
                                onClick={() => handlePolicySwitch('temporary_hold')}
                                disabled={isSavingPolicy}
                                className={`text-right p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                                    policy?.mode === 'temporary_hold'
                                        ? 'bg-amber-50/70 border-amber-500 text-slate-900 shadow-xs ring-1 ring-amber-500/40'
                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${policy?.mode === 'temporary_hold' ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-600'}`}>
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm text-slate-900 block">النظام الثاني: قفل مؤقت لمدة 10 دقائق</span>
                                            <span className="text-[11px] text-emerald-700 font-medium">قفل فوري ينفك تلقائياً بعد 10 دقائق</span>
                                        </div>
                                    </div>
                                    {policy?.mode === 'temporary_hold' && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">
                                            النشط حالياً
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    الموعد يُقفل فوراً في الموقع بمجرد أن يرسل العميل طلبه لمدة 10 دقائق. إذا لم تؤكده خلال الـ 10 دقائق ينفك القفل تلقائياً ويعود متاحاً للعامة.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Room Hourly Rates */}
                    <div className="max-w-xl bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                            <Gamepad2 className="w-5 h-5 text-red-600" />
                            <h3 className="text-sm sm:text-base font-bold text-slate-900">أسعار ساعات اللعب للغرف</h3>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed">
                            حدد سعر الساعة (ج.م) لكل غرفة. يتم تطبيق هذا السعر فوراً في صفحة الحجز لحساب التكلفة الإجمالية للزبائن.
                        </p>

                        <div className="space-y-3 pt-1">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                    سعر ساعة الغرفة 1 (PLAY ROOM 01):
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={rateRoom1}
                                        onChange={(e) => setRateRoom1(Number(e.target.value))}
                                        className="w-full bg-slate-50 text-slate-900 font-mono font-bold text-sm rounded-xl px-3 py-2.5 border border-slate-200 outline-none focus:bg-white focus:border-red-500 transition-colors"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">ج.م / ساعة</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                    سعر ساعة الغرفة 2 (PLAY ROOM 02):
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={rateRoom2}
                                        onChange={(e) => setRateRoom2(Number(e.target.value))}
                                        className="w-full bg-slate-50 text-slate-900 font-mono font-bold text-sm rounded-xl px-3 py-2.5 border border-slate-200 outline-none focus:bg-white focus:border-red-500 transition-colors"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">ج.م / ساعة</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleSaveRoomRates}
                                disabled={savingRates}
                                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                            >
                                {savingRates ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                <span>حفظ الأسعار وتطبيقها فوراً</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {activeDetailBooking && (
                <BookingDetailsModal
                    booking={activeDetailBooking}
                    onClose={() => setActiveDetailBooking(null)}
                    onStatusChange={async (id, newStatus) => {
                        await updateBookingStatus(id, newStatus);
                        toast.success('تم تحديث حالة الحجز بنجاح');
                        setActiveDetailBooking(null);
                        loadOperationsData();
                        if (activeSubTab === 'details') loadArchiveData();
                    }}
                />
            )}
        </div>
    );
}
