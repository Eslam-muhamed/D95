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
    OPERATING_HOURS,
    createDateTimeFromBusinessDate,
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

    // Current Cairo Date
    const todayStr = useMemo(() => getCairoTodayDateString(), []);
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);

    // Data State
    const [loading, setLoading] = useState<boolean>(true);
    const [todayBookings, setTodayBookings] = useState<DBBooking[]>([]);
    const [allPendingBookings, setAllPendingBookings] = useState<DBBooking[]>([]);
    const [todayCount, setTodayCount] = useState<number>(0);
    const [confirmedCount, setConfirmedCount] = useState<number>(0);

    // Modals
    const [activeDetailBooking, setActiveDetailBooking] = useState<DBBooking | null>(null);

    // Policy & Rates State
    const [policy, setPolicy] = useState<BookingPolicy | null>(null);
    const [isSavingPolicy, setIsSavingPolicy] = useState<boolean>(false);
    const [roomRates, setRoomRates] = useState<RoomRates>({ 'room-1': 100, 'room-2': 100 });
    const [rateRoom1, setRateRoom1] = useState<number>(100);
    const [rateRoom2, setRateRoom2] = useState<number>(100);
    const [savingRates, setSavingRates] = useState<boolean>(false);

    // Filters for Daily Schedule
    const [roomFilter, setRoomFilter] = useState<string>('all');
    const [dailySearch, setDailySearch] = useState<string>('');

    // Accordion State for Conflict Groups
    const [expandedConflictIds, setExpandedConflictIds] = useState<Record<string, boolean>>({});

    // Archive / All Bookings State (for Details sub-tab)
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

    // 1. Load Daily Operations & Policy & Rates
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
            setConfirmedCount(metrics.confirmedCount);
            setTodayCount(metrics.todayCount);
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

    // 2. Load Archive Data (for Details sub-tab)
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
            setConfirmedCount(prev => prev + 1);
        } catch {
            toast.error('تعذر تأكيد الحجز');
        }
    };

    // Fast Shortcut: Cancel / Reject Booking
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

    // Conflict Resolution: Confirm Winner and Auto-Cancel Competitors
    const handleConfirmConflictWinner = async (winnerBooking: DBBooking, group: ConflictGroup) => {
        playPs5SelectSound();
        try {
            const { cancelledIds } = await confirmBookingAndResolveConflicts(winnerBooking.id, true);
            toast.success(`تم اعتماد حجز ${winnerBooking.customer_name} بنجاح! تم إلغاء الطلبات المتنافسة الأخرى تلقائياً. ✅`);

            // Refresh local state
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

    // Save Policy Mode (10-Min Hold vs Admin Approval)
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

    // Conflict Groups (10-min overlapping pending bookings)
    const conflictGroups = useMemo(() => {
        return groupConflictingPendingBookings(allPendingBookings);
    }, [allPendingBookings]);

    const toggleConflictGroup = (groupId: string) => {
        setExpandedConflictIds(prev => ({
            ...prev,
            [groupId]: prev[groupId] === undefined ? false : !prev[groupId]
        }));
    };

    // Derived: Active Ongoing Sessions in lounge
    const ongoingBookings = useMemo(() => {
        const nowMs = Date.now();
        return todayBookings.filter(b => {
            if (b.status !== 'confirmed') return false;
            const { start, end } = getBookingDates(b);
            return start.getTime() <= nowMs && end.getTime() > nowMs;
        });
    }, [todayBookings]);

    // Derived: Today's Expected Revenue
    const todayRevenue = useMemo(() => {
        return todayBookings
            .filter(b => b.status === 'confirmed' || b.status === 'completed')
            .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
    }, [todayBookings]);

    // Derived: Filtered Daily Bookings
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

    // Date formatted
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

    // Calculate 20 Hourly Slots for selected date
    const timelineSlots = useMemo(() => {
        const slots = [];
        const now = Date.now();

        for (let i = 0; i < 20; i++) {
            const slotHour = (OPERATING_HOURS.START_HOUR + i) % 24;
            const endHour = (OPERATING_HOURS.START_HOUR + i + 1) % 24;

            const time24 = `${String(slotHour).padStart(2, '0')}:00`;
            const start = createDateTimeFromBusinessDate(selectedDate, time24);
            const end = new Date(start.getTime() + 60 * 60 * 1000);

            const period = slotHour >= 12 && slotHour < 24 ? 'م' : 'ص';
            const h12 = slotHour % 12 === 0 ? 12 : slotHour % 12;
            const label = `${h12}${period}`;

            const isPast = end.getTime() <= now;

            const activeBookings = todayBookings.filter(b => {
                if (b.status !== 'confirmed' && b.status !== 'pending') return false;
                if (roomFilter !== 'all' && b.room_name !== roomFilter) return false;
                const { start: bStart, end: bEnd } = getBookingDates(b);
                return Math.max(start.getTime(), bStart.getTime()) < Math.min(end.getTime(), bEnd.getTime());
            });

            let bookedMinutes = 0;
            for (let m = 0; m < 60; m++) {
                const minuteTime = start.getTime() + m * 60 * 1000;
                const isMinuteBooked = activeBookings.some(b => {
                    const { start: bStart, end: bEnd } = getBookingDates(b);
                    return minuteTime >= bStart.getTime() && minuteTime < bEnd.getTime();
                });
                if (isMinuteBooked) bookedMinutes++;
            }

            let status: 'available' | 'booked' | 'partial' | 'past' = 'available';
            if (isPast && bookedMinutes === 0) status = 'past';
            else if (bookedMinutes === 60) status = 'booked';
            else if (bookedMinutes > 0) status = 'partial';

            slots.push({
                index: i,
                label,
                status,
                bookedMinutes,
                activeBookings,
                isPast,
            });
        }
        return slots;
    }, [selectedDate, todayBookings, roomFilter]);

    return (
        <div className="space-y-5 max-w-7xl mx-auto" dir="rtl">
            {/* SUB-TABS NAVIGATION (Exactly styled like the Menu page sub-tabs) */}
            <div className="bg-[#140e11] border border-white/10 rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2 shadow-md">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto">
                    {/* 1. Dashboard & Today */}
                    <button
                        type="button"
                        onClick={() => {
                            playPs5NavigateSound();
                            setActiveSubTab('dashboard');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            activeSubTab === 'dashboard'
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>داشبورد وإحصائيات اليوم</span>
                        {allPendingBookings.length > 0 && (
                            <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center">
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
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            activeSubTab === 'details'
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
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
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            activeSubTab === 'settings'
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Settings2 className="w-4 h-4" />
                        <span>إعدادات الحجز</span>
                    </button>
                </div>

                {/* Clock & Refresh */}
                <div className="flex items-center gap-2 mr-auto sm:mr-0 text-xs">
                    <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-mono font-bold text-emerald-400">{currentTimeStr}</span>
                    </div>

                    <button
                        type="button"
                        onClick={loadOperationsData}
                        disabled={loading}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                        title="تحديث البيانات"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : ''}`} />
                    </button>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* SUB-TAB 1: DASHBOARD & TODAY'S OPERATIONS */}
            {/* ========================================================================= */}
            {activeSubTab === 'dashboard' && (
                <div className="space-y-4">
                    {/* General KPI Cards (إحصائيات عامة) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* 1. Today's Bookings */}
                        <div className="bg-[#140e11] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                                <span className="text-xs text-neutral-400 font-bold block">حجوزات اليوم</span>
                                <span className="font-bebas text-3xl font-black text-white mt-1 block">
                                    {todayBookings.length}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                                <Calendar className="w-5 h-5" />
                            </div>
                        </div>

                        {/* 2. Ongoing Gaming Now */}
                        <div className="bg-[#140e11] border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.08)]">
                            <div>
                                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                    <span>شغال الآن بالصالة</span>
                                </span>
                                <span className="font-bebas text-3xl font-black text-emerald-400 mt-1 block">
                                    {ongoingBookings.length}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                                <Gamepad2 className="w-5 h-5" />
                            </div>
                        </div>

                        {/* 3. Pending Bookings */}
                        <div className={`bg-[#140e11] border rounded-2xl p-4 flex items-center justify-between ${
                            allPendingBookings.length > 0 ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-white/10'
                        }`}>
                            <div>
                                <span className="text-xs text-amber-400 font-bold block">بانتظار التأكيد</span>
                                <span className="font-bebas text-3xl font-black text-amber-300 mt-1 block">
                                    {allPendingBookings.length}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                        </div>

                        {/* 4. Expected Revenue */}
                        <div className="bg-[#140e11] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                                <span className="text-xs text-neutral-400 font-bold block">إيرادات اليوم المتوقعة</span>
                                <span className="font-bebas text-3xl font-black text-emerald-400 mt-1 block">
                                    {todayRevenue} <span className="text-xs font-sans font-normal">ج.م</span>
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* CONFLICT DROPDOWN SECTION (نظام الـ 10 دقائق وتنافس المواعيد) */}
                    {conflictGroups.length > 0 && (
                        <div className="space-y-3 bg-[#181114] border-2 border-amber-500/60 rounded-2xl p-4 sm:p-5 shadow-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-amber-400 animate-pulse" />
                                    <div>
                                        <h3 className="text-sm sm:text-base font-black text-amber-300">
                                            ⚠️ مواعيد بها طلبات حجز متنافسة في نفس الوقت ({conflictGroups.length})
                                        </h3>
                                        <p className="text-[11px] text-amber-400/80">
                                            حجز أكثر من عميل نفس الموعد خلال نظام الـ 10 دقائق. اضغط على الموعد لفتح القائمة المنسدلة للعملاء واختيار الحجز المعتمد.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Dropdown Accordions for each conflicting time slot */}
                            <div className="space-y-3 pt-2">
                                {conflictGroups.map((group) => {
                                    const isExpanded = expandedConflictIds[group.id] ?? true;

                                    return (
                                        <div
                                            key={group.id}
                                            className="bg-[#140e11] border border-amber-500/40 rounded-xl overflow-hidden"
                                        >
                                            {/* Trigger Header */}
                                            <div
                                                onClick={() => toggleConflictGroup(group.id)}
                                                className="p-3.5 sm:p-4 bg-amber-950/30 hover:bg-amber-950/50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                                                        <Users className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-white text-sm">{group.roomName}</span>
                                                            <span className="text-xs text-amber-300 font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded">
                                                                ⏰ {group.formattedTimeRange}
                                                            </span>
                                                            <span className="text-xs text-neutral-400 font-mono">
                                                                📅 {group.bookingDate}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2.5">
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500 text-black">
                                                        {group.bookings.length} طلبات متنافسة
                                                    </span>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                                                </div>
                                            </div>

                                            {/* Dropdown List of Competing Bookings */}
                                            {isExpanded && (
                                                <div className="p-3 sm:p-4 border-t border-amber-500/20 space-y-2.5 bg-[#120c0f]">
                                                    <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 pb-1">
                                                        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                                        <span>الطلبات مرتبة حسب أسبقية وقت الإرسال. اعتماد أي حجز يلغي المتنافس الآخر تلقائياً ويقفل الموعد لصالحه.</span>
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
                                                                            ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                                                                            : 'bg-[#181114] border-white/10'
                                                                    }`}
                                                                >
                                                                    {/* Client Info */}
                                                                    <div className="flex items-center gap-3">
                                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                                                            isFirst ? 'bg-amber-500 text-black' : 'bg-white/10 text-neutral-300'
                                                                        }`}>
                                                                            {isFirst ? '🥇 الأسبق' : `🥈 متنافس #${idx + 1}`}
                                                                        </span>

                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <h4 className="text-sm font-bold text-white">{b.customer_name}</h4>
                                                                                <span className="text-[10px] text-neutral-400 font-mono">({timeAgo})</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                                                                                <span dir="ltr" className="font-mono">{b.customer_phone}</span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => openWhatsAppDirect(e, b)}
                                                                                    className="text-emerald-400 hover:underline text-[11px] inline-flex items-center gap-0.5 font-bold"
                                                                                >
                                                                                    <MessageCircle className="w-3 h-3" />
                                                                                    <span>واتساب</span>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Amount & Direct Actions */}
                                                                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                                                                        <span className="font-bold font-mono text-emerald-400 text-sm">
                                                                            {b.total_amount} ج.م
                                                                        </span>

                                                                        <div className="flex items-center gap-1.5">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleConfirmConflictWinner(b, group)}
                                                                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                                                                                title="اعتماد وتأكيد هذا الحجز وإلغاء المنافس الآخر"
                                                                            >
                                                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                                                <span>تأكيد واعتماد الحجز</span>
                                                                            </button>

                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleQuickReject(b)}
                                                                                className="px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 text-xs font-bold transition-colors cursor-pointer"
                                                                                title="إلغاء هذا الحجز"
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
                    <div className="bg-[#140e11] border border-white/10 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                        {/* Date Selector */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setSelectedDate(prev => addDaysToDateString(prev, -1))}
                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                                    title="اليوم السابق"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>

                                <div className="relative flex items-center px-3 py-1 cursor-pointer">
                                    <span className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">
                                        {formattedDateTitle}
                                        {selectedDate === todayStr && (
                                            <span className="mr-1.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
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
                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                                    title="اليوم التالي"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                            </div>

                            {selectedDate !== todayStr && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedDate(todayStr)}
                                    className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-bold transition-colors"
                                >
                                    الرجوع لليوم
                                </button>
                            )}
                        </div>

                        {/* Room Filter Pills */}
                        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-0.5 text-xs">
                            <button
                                type="button"
                                onClick={() => setRoomFilter('all')}
                                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                                    roomFilter === 'all' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
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
                                        roomFilter === r ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Slim 20-Hour Timeline Strip */}
                    <div className="bg-[#140e11] border border-white/10 rounded-2xl p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                            <span className="font-bold text-neutral-300">مخطط ساعات اليوم (من 08:00 ص إلى 04:00 ص):</span>
                            <div className="flex items-center gap-3 text-[11px]">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-white/10 border border-white/20" />
                                    <span>متاح</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-600" />
                                    <span>محجوز</span>
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-10 sm:grid-cols-20 gap-1">
                            {timelineSlots.map((slot) => {
                                const isBooked = slot.status === 'booked';
                                const isPartial = slot.status === 'partial';
                                const hasCustomer = slot.activeBookings.length > 0;

                                return (
                                    <div
                                        key={slot.index}
                                        title={`${slot.label}: ${isBooked ? 'محجوز' : isPartial ? `${slot.bookedMinutes}د محجوزة` : 'متاح'}${hasCustomer ? ` (${slot.activeBookings[0].customer_name})` : ''}`}
                                        className={`h-9 rounded-lg border flex flex-col items-center justify-center transition-all cursor-default text-[10px] font-mono select-none ${
                                            isBooked
                                                ? 'bg-red-600 border-red-500 text-white font-bold'
                                                : isPartial
                                                ? 'bg-gradient-to-l from-red-600 to-[#1e1518] border-red-500/70 text-white'
                                                : slot.isPast
                                                ? 'bg-white/[0.02] border-white/5 text-neutral-600'
                                                : 'bg-white/5 border-white/10 text-neutral-400 hover:border-white/20'
                                        }`}
                                    >
                                        <span className="leading-none">{slot.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Today's Bookings Table with [تأكيد] / [إلغاء] Fast Shortcuts */}
                    <div className="bg-[#140e11] border border-white/10 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-red-500" />
                                <h3 className="text-sm font-bold text-white">
                                    حجوزات اليوم ({filteredDailyBookings.length})
                                </h3>
                            </div>

                            {/* Search */}
                            <div className="relative w-48 sm:w-60">
                                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                                <input
                                    type="text"
                                    placeholder="بحث باسم العميل أو الهاتف..."
                                    value={dailySearch}
                                    onChange={(e) => setDailySearch(e.target.value)}
                                    className="w-full bg-[#181114] text-white text-xs rounded-xl pr-8 pl-3 py-1.5 border border-white/10 outline-none focus:border-red-500"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-12 flex justify-center">
                                <RefreshCw className="w-5 h-5 animate-spin text-red-500" />
                            </div>
                        ) : filteredDailyBookings.length === 0 ? (
                            <div className="py-10 text-center text-xs text-neutral-400 border border-dashed border-white/10 rounded-xl">
                                لا توجد حجوزات مسجلة لهذا التاريخ.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead>
                                        <tr className="border-b border-white/10 text-neutral-400">
                                            <th className="pb-2.5 font-medium">الموعد</th>
                                            <th className="pb-2.5 font-medium">العميل</th>
                                            <th className="pb-2.5 font-medium">الغرفة</th>
                                            <th className="pb-2.5 font-medium">المبلغ</th>
                                            <th className="pb-2.5 font-medium">الحالة</th>
                                            <th className="pb-2.5 text-left font-medium">إجراء فوري (تأكيد / إلغاء)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
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
                                                    className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                                                >
                                                    {/* Time */}
                                                    <td className="py-3">
                                                        <div className="font-bold text-white font-mono text-xs">
                                                            {b.start_time} - {b.end_time}
                                                        </div>
                                                        <span className="text-[10px] text-neutral-400 font-mono">({b.duration_hours} س)</span>
                                                    </td>

                                                    {/* Client */}
                                                    <td className="py-3">
                                                        <div className="font-bold text-white group-hover:text-red-400 transition-colors">
                                                            {b.customer_name}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                                                            <span dir="ltr" className="font-mono">{b.customer_phone}</span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => openWhatsAppDirect(e, b)}
                                                                className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                                                            >
                                                                <MessageCircle className="w-3 h-3" />
                                                                <span>واتساب</span>
                                                            </button>
                                                        </div>
                                                    </td>

                                                    {/* Room */}
                                                    <td className="py-3 text-neutral-200 font-medium">
                                                        {b.room_name}
                                                    </td>

                                                    {/* Amount */}
                                                    <td className="py-3 font-bold font-mono text-emerald-400">
                                                        {b.total_amount} ج.م
                                                    </td>

                                                    {/* Status */}
                                                    <td className="py-3">
                                                        {isOngoing ? (
                                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1 shadow-sm">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                                                <span>شغال الآن 🎮</span>
                                                            </span>
                                                        ) : b.status === 'confirmed' ? (
                                                            isEnded ? (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400">
                                                                    انتهى ⌛
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                                    مؤكد 🔒
                                                                </span>
                                                            )
                                                        ) : b.status === 'pending' ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                                معلق ⏳
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400">
                                                                {b.status === 'completed' ? 'مكتمل' : 'ملغي'}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Immediate Shortcuts: Confirm / Cancel / Details */}
                                                    <td className="py-3 text-left" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {b.status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQuickConfirm(b)}
                                                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                                                                        title="تأكيد الحجز فوراً"
                                                                    >
                                                                        <Check className="w-3 h-3 stroke-[3]" />
                                                                        <span>تأكيد</span>
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQuickReject(b)}
                                                                        className="px-2 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/20 text-[11px] font-bold transition-colors cursor-pointer"
                                                                        title="إلغاء الحجز"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                        <span>إلغاء</span>
                                                                    </button>
                                                                </>
                                                            )}

                                                            <button
                                                                type="button"
                                                                onClick={() => setActiveDetailBooking(b)}
                                                                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-[11px] transition-colors cursor-pointer"
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
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 2: DETAILED BOOKINGS (الأرشيف الكامل والبحث المتقدم) */}
            {/* ========================================================================= */}
            {activeSubTab === 'details' && (
                <div className="bg-[#140e11] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                    {/* Search & Filters Bar */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input
                                type="text"
                                placeholder="ابحث باسم العميل أو الهاتف أو كود الحجز..."
                                value={archiveSearch}
                                onChange={(e) => {
                                    setArchiveSearch(e.target.value);
                                    setArchivePage(1);
                                }}
                                className="w-full bg-[#181114] text-white text-xs rounded-xl pr-9 pl-3 py-2 border border-white/10 outline-none focus:border-red-500"
                            />
                        </div>

                        {/* Status Filter Pills */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-0.5">
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
                                                ? 'bg-red-600 text-white'
                                                : 'text-neutral-400 hover:text-white'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Date Filter */}
                            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1">
                                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                                <input
                                    type="date"
                                    value={archiveDateFilter}
                                    onChange={(e) => {
                                        setArchiveDateFilter(e.target.value);
                                        setArchivePage(1);
                                    }}
                                    className="bg-transparent text-white text-xs outline-none cursor-pointer font-mono"
                                />
                                {archiveDateFilter && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setArchiveDateFilter('');
                                            setArchivePage(1);
                                        }}
                                        className="text-neutral-400 hover:text-white font-bold ml-1 text-xs"
                                        title="مسح فلتر التاريخ"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Archive Table */}
                    {archiveLoading ? (
                        <div className="py-16 flex justify-center">
                            <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
                        </div>
                    ) : archiveBookings.length === 0 ? (
                        <div className="py-12 text-center text-xs text-neutral-400 border border-dashed border-white/10 rounded-xl">
                            لا توجد حجوزات مطابقة لمعايير البحث في الأرشيف.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead>
                                    <tr className="border-b border-white/10 text-neutral-400">
                                        <th className="pb-2.5 font-medium">كود الحجز</th>
                                        <th className="pb-2.5 font-medium">العميل</th>
                                        <th className="pb-2.5 font-medium">الغرفة</th>
                                        <th className="pb-2.5 font-medium">التاريخ والتوقيت</th>
                                        <th className="pb-2.5 font-medium">المبلغ</th>
                                        <th className="pb-2.5 font-medium">الحالة</th>
                                        <th className="pb-2.5 text-left font-medium">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {archiveBookings.map((b) => (
                                        <tr
                                            key={b.id}
                                            onClick={() => setActiveDetailBooking(b)}
                                            className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                                        >
                                            <td className="py-3 font-mono text-neutral-400">#{b.reservation_id}</td>
                                            <td className="py-3">
                                                <div className="font-bold text-white group-hover:text-red-400 transition-colors">
                                                    {b.customer_name}
                                                </div>
                                                <span className="text-[11px] text-neutral-400 font-mono" dir="ltr">
                                                    {b.customer_phone}
                                                </span>
                                            </td>
                                            <td className="py-3 text-neutral-200 font-medium">{b.room_name}</td>
                                            <td className="py-3 font-mono">
                                                <div>{b.booking_date}</div>
                                                <div className="text-neutral-400 text-[10px]">{b.start_time} - {b.end_time}</div>
                                            </td>
                                            <td className="py-3 font-bold font-mono text-emerald-400">{b.total_amount} ج.م</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    b.status === 'confirmed'
                                                        ? 'bg-emerald-500/20 text-emerald-300'
                                                        : b.status === 'pending'
                                                        ? 'bg-amber-500/20 text-amber-300'
                                                        : 'bg-neutral-800 text-neutral-400'
                                                }`}>
                                                    {b.status === 'confirmed' ? 'مؤكد' : b.status === 'pending' ? 'معلق' : b.status === 'completed' ? 'مكتمل' : 'ملغي'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-left" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveDetailBooking(b)}
                                                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-[11px]"
                                                    >
                                                        تفاصيل
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteBooking(b.id, b.customer_name)}
                                                        className="p-1 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-950/40"
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
                        <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-neutral-400">
                            <span>صفحة {archivePage} من {archiveTotalPages} ({archiveTotalCount} حجز)</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setArchivePage(p => Math.max(1, p - 1))}
                                    disabled={archivePage <= 1}
                                    className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 cursor-pointer"
                                >
                                    السابق
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setArchivePage(p => Math.min(archiveTotalPages, p + 1))}
                                    disabled={archivePage >= archiveTotalPages}
                                    className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 cursor-pointer"
                                >
                                    التالي
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 3: SETTINGS & POLICIES (إعدادات الحجز وسياسة الـ 10 دقائق وأسعار الغرف) */}
            {/* ========================================================================= */}
            {activeSubTab === 'settings' && (
                <div className="space-y-5">
                    {/* Booking Policy Mode Selector */}
                    <div className="bg-[#140e11] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">سياسة وقفل مواعيد الحجز</h3>
                                    <p className="text-xs text-neutral-400">
                                        اختر كيف يتعامل الموقع مع المواعيد عند قيام الزبائن بطلب حجز غرف البلايستيشن
                                    </p>
                                </div>
                            </div>

                            {isSavingPolicy && (
                                <div className="flex items-center gap-1 text-xs text-amber-400 animate-pulse">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>جاري الحفظ في قاعدة البيانات...</span>
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
                                        ? 'bg-red-950/40 border-red-500 text-white shadow-sm ring-1 ring-red-500/50'
                                        : 'bg-[#181114] border-white/10 hover:border-white/20 text-neutral-300'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${policy?.mode === 'admin_approval_only' ? 'bg-red-600 text-white' : 'bg-white/5 text-neutral-400'}`}>
                                            <Unlock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm text-white block">النظام الأول: الموافقة المسبقة للإدارة</span>
                                            <span className="text-[10px] text-amber-400 font-mono">الموعد يظل متاحاً حتى تعتمده الإدارة</span>
                                        </div>
                                    </div>
                                    {policy?.mode === 'admin_approval_only' && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                                            النشط حالياً
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-neutral-400 leading-relaxed">
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
                                        ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/50'
                                        : 'bg-[#181114] border-white/10 hover:border-white/20 text-neutral-300'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${policy?.mode === 'temporary_hold' ? 'bg-amber-500 text-black' : 'bg-white/5 text-neutral-400'}`}>
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm text-white block">النظام الثاني: قفل مؤقت لمدة 10 دقائق</span>
                                            <span className="text-[10px] text-emerald-400 font-mono">قفل فوري ينفك تلقائياً بعد 10 دقائق</span>
                                        </div>
                                    </div>
                                    {policy?.mode === 'temporary_hold' && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black">
                                            النشط حالياً
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-neutral-400 leading-relaxed">
                                    الموعد يُقفل فوراً في الموقع بمجرد أن يرسل العميل طلبه لمدة 10 دقائق. إذا لم تؤكده خلال الـ 10 دقائق ينفك القفل تلقائياً ويعود متاحاً للعامة.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Room Hourly Rates Configuration */}
                    <div className="max-w-xl bg-[#140e11] border border-white/10 rounded-2xl p-5 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                            <Gamepad2 className="w-5 h-5 text-red-500" />
                            <h3 className="text-sm sm:text-base font-bold text-white">أسعار ساعات اللعب للغرف</h3>
                        </div>

                        <p className="text-xs text-neutral-400 leading-relaxed">
                            حدد سعر الساعة (ج.م) لكل غرفة. يتم تطبيق هذا السعر فوراً في صفحة الحجز لحساب التكلفة الإجمالية للزبائن.
                        </p>

                        <div className="space-y-3 pt-1">
                            <div>
                                <label className="text-xs font-bold text-neutral-300 block mb-1">
                                    سعر ساعة الغرفة 1 (PLAY ROOM 01):
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={rateRoom1}
                                        onChange={(e) => setRateRoom1(Number(e.target.value))}
                                        className="w-full bg-[#1c1417] text-white font-mono font-bold text-sm rounded-xl px-3 py-2.5 border border-white/15 outline-none focus:border-red-500"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">ج.م / ساعة</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-neutral-300 block mb-1">
                                    سعر ساعة الغرفة 2 (PLAY ROOM 02):
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={rateRoom2}
                                        onChange={(e) => setRateRoom2(Number(e.target.value))}
                                        className="w-full bg-[#1c1417] text-white font-mono font-bold text-sm rounded-xl px-3 py-2.5 border border-white/15 outline-none focus:border-red-500"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">ج.م / ساعة</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleSaveRoomRates}
                                disabled={savingRates}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                            >
                                {savingRates ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                <span>حفظ الأسعار وتطبيقها فوراً</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Comprehensive Booking Details Modal */}
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
