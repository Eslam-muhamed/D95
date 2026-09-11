import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Calendar,
    Clock,
    Search,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Phone,
    User,
    Gamepad2,
    MessageCircle,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    LayoutGrid,
    List,
    DollarSign,
    Layers,
    Timer,
    ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    fetchBookingsForDate,
    updateBookingStatus,
    getBookingDates,
} from '@/services/bookingService';
import {
    getCairoTodayDateString,
    addDaysToDateString,
    formatArabicTimeFromDate,
} from '@/lib/bookingDatetime';
import type { DBBooking } from '@/types/database';
import BookingDetailsModal from './BookingDetailsModal';

interface DailyScheduleTabProps {
    onSwitchToBookingsTab?: (booking?: DBBooking) => void;
}

export default function DailyScheduleTab({ onSwitchToBookingsTab }: DailyScheduleTabProps) {
    const todayStr = useMemo(() => getCairoTodayDateString(), []);
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);
    const [bookings, setBookings] = useState<DBBooking[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roomFilter, setRoomFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'timeline' | 'rooms'>('timeline');

    // Selected booking for detailed view modal
    const [activeDetailBooking, setActiveDetailBooking] = useState<DBBooking | null>(null);

    // Live clock pinned to Africa/Cairo
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

    // Load bookings for selected date
    const loadDayBookings = useCallback(async (date: string) => {
        setLoading(true);
        try {
            const data = await fetchBookingsForDate(date);
            setBookings(data);
        } catch {
            toast.error('تعذر جلب جدول مواعيد اليوم');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDayBookings(selectedDate);
    }, [selectedDate, loadDayBookings]);

    // Fast status update from modal
    const handleStatusUpdate = async (id: string, newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
        try {
            const updated = await updateBookingStatus(id, newStatus);
            toast.success(`تم تحديث حالة الحجز إلى: ${newStatus === 'confirmed' ? 'مؤكد' : newStatus === 'completed' ? 'مكتمل' : 'ملغي'}`);
            setBookings(prev => prev.map(b => b.id === id ? updated : b));
            if (activeDetailBooking && activeDetailBooking.id === id) {
                setActiveDetailBooking(updated);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'تعذر تحديث حالة الحجز';
            toast.error(msg);
            throw err;
        }
    };

    // Quick date shifts
    const handleShiftDate = (offsetDays: number) => {
        setSelectedDate(prev => addDaysToDateString(prev, offsetDays));
    };

    // Derived room options
    const roomOptions = useMemo(() => {
        const rooms = new Set<string>();
        bookings.forEach(b => {
            if (b.room_name) rooms.add(b.room_name);
        });
        return Array.from(rooms);
    }, [bookings]);

    // Filtered bookings
    const filteredBookings = useMemo(() => {
        const nowMs = Date.now();
        return bookings.filter(b => {
            const { start: bStart, end: bEnd } = getBookingDates(b);
            const isEnded = bEnd.getTime() <= nowMs;
            const isStarted = bStart.getTime() <= nowMs;
            const isOngoing = isStarted && !isEnded;

            // Status filter
            if (statusFilter === 'ongoing' && !(b.status === 'confirmed' && isOngoing)) return false;
            if (statusFilter === 'confirmed' && !(b.status === 'confirmed' && !isEnded && !isOngoing)) return false;
            if (statusFilter === 'pending' && b.status !== 'pending') return false;
            if (statusFilter === 'completed' && b.status !== 'completed') return false;
            if (statusFilter === 'ended' && !(b.status === 'confirmed' && isEnded)) return false;
            if (statusFilter === 'cancelled' && b.status !== 'cancelled') return false;

            // Room filter
            if (roomFilter !== 'all' && b.room_name !== roomFilter) return false;

            // Search filter
            if (search.trim()) {
                const s = search.toLowerCase();
                const matchName = b.customer_name?.toLowerCase().includes(s);
                const matchPhone = b.customer_phone?.includes(s);
                const matchCode = b.reservation_id?.toLowerCase().includes(s);
                const matchRoom = b.room_name?.toLowerCase().includes(s);
                if (!matchName && !matchPhone && !matchCode && !matchRoom) return false;
            }

            return true;
        });
    }, [bookings, statusFilter, roomFilter, search]);

    // Metrics for the selected date
    const dayMetrics = useMemo(() => {
        const nowMs = Date.now();
        let ongoing = 0;
        let upcoming = 0;
        let pending = 0;
        let ended = 0;
        let totalRevenue = 0;

        bookings.forEach(b => {
            const { start: bStart, end: bEnd } = getBookingDates(b);
            const isEnded = bEnd.getTime() <= nowMs;
            const isStarted = bStart.getTime() <= nowMs;
            const isOngoing = isStarted && !isEnded;

            if (b.status === 'confirmed') {
                if (isOngoing) ongoing++;
                else if (isEnded) ended++;
                else upcoming++;
                totalRevenue += Number(b.total_amount) || 0;
            } else if (b.status === 'completed') {
                ended++;
                totalRevenue += Number(b.total_amount) || 0;
            } else if (b.status === 'pending') {
                pending++;
            }
        });

        return {
            total: bookings.length,
            ongoing,
            upcoming,
            pending,
            ended,
            totalRevenue,
        };
    }, [bookings]);

    // Formatted date title in Arabic
    const formattedDateTitle = useMemo(() => {
        try {
            const [y, m, d] = selectedDate.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            return new Intl.DateTimeFormat('ar-EG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }).format(dateObj);
        } catch {
            return selectedDate;
        }
    }, [selectedDate]);

    // WhatsApp quick opener
    const openWhatsAppDirect = (e: React.MouseEvent, b: DBBooking) => {
        e.stopPropagation();
        let phone = b.customer_phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
            phone = '2' + phone;
        } else if (!phone.startsWith('20')) {
            phone = '20' + phone;
        }
        const text = `أهلاً بحضرتك يا أستاذ ${b.customer_name} 👋\nمعاك إدارة D95 Gaming Lounge 🎮\n\nبخصوص حجزك رقم (${b.reservation_id}):\n📍 الغرفة: ${b.room_name}\n📅 التاريخ: ${b.booking_date}\n⏰ التوقيت: ${b.start_time} - ${b.end_time} (${b.duration_hours} س)\n\nجاهزين لاستقبالك وفي انتظارك تنورنا!`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Top Header & Live Clock */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#1c1215] via-[#140e11] to-[#120c0f] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                                <span>جدول مواعيد اليوم</span>
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                                    DAILY TIMELINE
                                </span>
                            </h1>
                            <p className="text-xs text-neutral-400">
                                استعراض شامل لجميع العملاء الذين حجزوا خلال اليوم بالاسم والرقم والموعد مع التفاصيل الكاملة
                            </p>
                        </div>
                    </div>
                </div>

                {/* Clock & Refresh */}
                <div className="flex items-center gap-3">
                    <div className="bg-black/50 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-neutral-400">التوقيت الآن:</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">{currentTimeStr}</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => loadDayBookings(selectedDate)}
                        disabled={loading}
                        className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                        title="تحديث البيانات"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Date Navigator Bar */}
            <div className="bg-[#140e11]/90 border border-white/10 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-md">
                {/* Quick Day Switchers */}
                <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                    <button
                        type="button"
                        onClick={() => handleShiftDate(-1)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        title="اليوم السابق"
                    >
                        <ChevronRight className="w-4 h-4" />
                        <span className="hidden sm:inline">السابق</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedDate(addDaysToDateString(todayStr, -1))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            selectedDate === addDaysToDateString(todayStr, -1)
                                ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                                : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        أمس
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedDate(todayStr)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                            selectedDate === todayStr
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400/50'
                                : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>اليوم (الحالي)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedDate(addDaysToDateString(todayStr, 1))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            selectedDate === addDaysToDateString(todayStr, 1)
                                ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                                : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        غداً
                    </button>

                    <button
                        type="button"
                        onClick={() => handleShiftDate(1)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        title="اليوم التالي"
                    >
                        <span className="hidden sm:inline">التالي</span>
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>

                {/* Selected Date Indicator & Picker */}
                <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                    <div className="text-right">
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-red-500" />
                            <span>{formattedDateTitle}</span>
                        </div>
                        <span className="text-[11px] text-neutral-400 font-mono" dir="ltr">
                            {selectedDate}
                        </span>
                    </div>

                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                        className="bg-[#1c1417] text-white text-xs border border-white/15 rounded-xl px-3 py-2 outline-none focus:border-red-500 cursor-pointer font-mono"
                    />
                </div>
            </div>

            {/* Daily Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-[#140e11] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-neutral-400">إجمالي حجوزات اليوم</span>
                    <div className="mt-2 flex items-baseline justify-between">
                        <span className="font-bebas text-3xl font-black text-white">{dayMetrics.total}</span>
                        <Layers className="w-4 h-4 text-neutral-500" />
                    </div>
                </div>

                <div className="bg-[#140e11] border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-[0_0_15px_rgba(16,185,129,0.08)]">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>جاري اللعب الآن</span>
                    </span>
                    <div className="mt-2 flex items-baseline justify-between">
                        <span className="font-bebas text-3xl font-black text-emerald-400">{dayMetrics.ongoing}</span>
                        <Gamepad2 className="w-4 h-4 text-emerald-500" />
                    </div>
                </div>

                <div className="bg-[#140e11] border border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-purple-400">حجوزات قادمة اليوم</span>
                    <div className="mt-2 flex items-baseline justify-between">
                        <span className="font-bebas text-3xl font-black text-purple-300">{dayMetrics.upcoming}</span>
                        <Clock className="w-4 h-4 text-purple-400" />
                    </div>
                </div>

                <div className="bg-[#140e11] border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-neutral-400">انتهت أو اكتملت</span>
                    <div className="mt-2 flex items-baseline justify-between">
                        <span className="font-bebas text-3xl font-black text-neutral-300">{dayMetrics.ended}</span>
                        <CheckCircle2 className="w-4 h-4 text-neutral-500" />
                    </div>
                </div>

                <div className="bg-[#140e11] border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-bold text-amber-400">إيرادات اليوم المتوقعة</span>
                    <div className="mt-2 flex items-baseline justify-between">
                        <span className="font-bebas text-3xl font-black text-amber-300">{dayMetrics.totalRevenue} <span className="text-xs font-normal font-sans">ج.م</span></span>
                        <DollarSign className="w-4 h-4 text-amber-400" />
                    </div>
                </div>
            </div>

            {/* Filter & View Mode Controls */}
            <div className="bg-[#140e11]/90 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="ابحث باسم العميل، رقم الهاتف، كود الحجز..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#1c1417] text-white text-xs rounded-xl pr-10 pl-4 py-2.5 border border-white/10 outline-none focus:border-red-500 transition-colors"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
                            >
                                مسح
                            </button>
                        )}
                    </div>

                    {/* Room Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400 shrink-0">الغرفة:</span>
                        <select
                            value={roomFilter}
                            onChange={(e) => setRoomFilter(e.target.value)}
                            className="bg-[#1c1417] text-white text-xs border border-white/10 rounded-xl px-3 py-2 outline-none cursor-pointer"
                        >
                            <option value="all">جميع الغرف</option>
                            {roomOptions.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>

                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-[#1c1417] border border-white/10 rounded-xl p-1 shrink-0">
                            <button
                                type="button"
                                onClick={() => setViewMode('timeline')}
                                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                    viewMode === 'timeline'
                                        ? 'bg-red-600 text-white shadow-sm'
                                        : 'text-neutral-400 hover:text-white'
                                }`}
                                title="مخطط زمني تسلسلي"
                            >
                                <List className="w-4 h-4" />
                                <span className="hidden sm:inline">تسلسلي</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('rooms')}
                                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                    viewMode === 'rooms'
                                        ? 'bg-red-600 text-white shadow-sm'
                                        : 'text-neutral-400 hover:text-white'
                                }`}
                                title="عرض حسب الغرف"
                            >
                                <LayoutGrid className="w-4 h-4" />
                                <span className="hidden sm:inline">الغرف</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status Badges Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                    {[
                        { id: 'all', label: 'الكل' },
                        { id: 'ongoing', label: '🟢 جاري اللعب الآن' },
                        { id: 'confirmed', label: '🔒 مؤكد وقادم' },
                        { id: 'pending', label: '⏳ معلق' },
                        { id: 'ended', label: '⌛ انتهى وقته' },
                        { id: 'completed', label: '✅ مكتمل' },
                        { id: 'cancelled', label: '❌ ملغي' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                                statusFilter === tab.id
                                    ? 'bg-white/15 text-white border border-white/20'
                                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content: Timeline or Room Grid */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
                    <span className="text-xs text-neutral-400">جاري تحميل جدول مواعيد {formattedDateTitle}...</span>
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl p-8 space-y-3 bg-[#140e11]/40">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-neutral-500">
                        <Clock className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-white">لا توجد حجوزات مسجلة لهذا اليوم</h3>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto">
                        لم يتم العثور على أي حجوزات تطابق الفلاتر المحددة في تاريخ {selectedDate}. يمكنك الانتقال إلى تاريخ آخر أو إزالة الفلاتر.
                    </p>
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedDate(todayStr);
                                setStatusFilter('all');
                                setRoomFilter('all');
                                setSearch('');
                            }}
                            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                            الرجوع لمواعيد اليوم وإعادة ضبط الفلاتر
                        </button>
                    </div>
                </div>
            ) : viewMode === 'timeline' ? (
                /* 1. TIMELINE / CHRONOLOGICAL VIEW */
                <div className="space-y-3">
                    <div className="text-xs text-neutral-400 font-semibold px-1 flex items-center justify-between">
                        <span>قائمة العملاء ومواعيدهم بالترتيب الزمني ({filteredBookings.length}):</span>
                        <span className="text-[11px] text-red-400">اضغط على أي حجز لعرض التفاصيل الكاملة 🔍</span>
                    </div>

                    <div className="space-y-2.5">
                        {filteredBookings.map((b) => {
                            const { start: bStart, end: bEnd } = getBookingDates(b);
                            const nowMs = Date.now();
                            const isEnded = bEnd.getTime() <= nowMs;
                            const isStarted = bStart.getTime() <= nowMs;
                            const isOngoing = isStarted && !isEnded;

                            return (
                                <div
                                    key={b.id}
                                    onClick={() => setActiveDetailBooking(b)}
                                    className={`relative group rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                        isOngoing
                                            ? 'bg-[#181114] border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:border-emerald-400'
                                            : b.status === 'pending'
                                            ? 'bg-[#181114] border-amber-500/40 hover:border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                                            : isEnded
                                            ? 'bg-[#120d0f] border-neutral-800/80 opacity-85 hover:opacity-100 hover:border-white/20'
                                            : 'bg-[#140e11] border-white/10 hover:border-white/25 hover:shadow-lg'
                                    }`}
                                >
                                    {/* Ongoing Indicator Strip */}
                                    {isOngoing && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-r-2xl" />
                                    )}

                                    {/* Client & Booking Main Info */}
                                    <div className="flex items-start sm:items-center gap-3.5">
                                        {/* Avatar / Number Icon */}
                                        <div
                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                                                isOngoing
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-inner'
                                                    : b.status === 'pending'
                                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                                    : 'bg-white/5 text-neutral-300 border-white/10'
                                            }`}
                                        >
                                            <User className="w-5 h-5" />
                                        </div>

                                        {/* Name & Phone & Code */}
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                                                    {b.customer_name}
                                                </h3>
                                                <span className="text-[11px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                                    #{b.reservation_id}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-neutral-400 flex-wrap">
                                                {/* Phone with quick call & WhatsApp */}
                                                <div className="flex items-center gap-1 font-mono text-neutral-300" dir="ltr">
                                                    <Phone className="w-3.5 h-3.5 text-neutral-500" />
                                                    <span>{b.customer_phone}</span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={(e) => openWhatsAppDirect(e, b)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                                                    title="محادثة واتساب سريعة"
                                                >
                                                    <MessageCircle className="w-3 h-3" />
                                                    <span>واتساب</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timing & Room Information */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                                        {/* Time Slot */}
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] text-neutral-500 font-semibold block">المعاد والتوقيت:</span>
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                                                <Clock className="w-4 h-4 text-red-500 shrink-0" />
                                                <span className="font-mono">{b.start_time} - {b.end_time}</span>
                                            </div>
                                            <span className="text-[11px] text-neutral-400 block font-mono">
                                                المدة: {b.duration_hours} ساعة
                                            </span>
                                        </div>

                                        {/* Room */}
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] text-neutral-500 font-semibold block">الغرفة:</span>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-200">
                                                <Gamepad2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                                <span>{b.room_name}</span>
                                            </div>
                                            <span className="text-[11px] text-emerald-400 font-mono font-bold block">
                                                {b.total_amount} ج.م
                                            </span>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                                            {isOngoing ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                                    <span>جاري اللعب الآن 🎮</span>
                                                </span>
                                            ) : b.status === 'confirmed' ? (
                                                isEnded ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-800 text-neutral-400 border border-white/10 flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-neutral-500" />
                                                        <span>انتهى الموعد ⌛</span>
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3 text-purple-400" />
                                                        <span>مؤكد وقادم 🔒</span>
                                                    </span>
                                                )
                                            ) : b.status === 'pending' ? (
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                                                    معلق بانتظار التأكيد ⏳
                                                </span>
                                            ) : b.status === 'completed' ? (
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3 text-blue-400" />
                                                    <span>مكتمل 🎮</span>
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                                                    ملغي ❌
                                                </span>
                                            )}

                                            <span className="text-[10px] text-neutral-500 group-hover:text-red-400 transition-colors flex items-center gap-1">
                                                <span>عرض التفاصيل</span>
                                                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-[-2px] transition-transform" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* 2. ROOM-BY-ROOM LANES VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roomOptions.map((roomName) => {
                        const roomBookings = filteredBookings.filter(b => b.room_name === roomName);
                        return (
                            <div
                                key={roomName}
                                className="bg-[#140e11] border border-white/10 rounded-2xl p-4 space-y-3 flex flex-col"
                            >
                                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                                            <Gamepad2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{roomName}</h4>
                                            <span className="text-[10px] text-neutral-400">{roomBookings.length} حجز اليوم</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                                    {roomBookings.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-neutral-500">
                                            لا توجد حجوزات مسجلة لهذه الغرفة اليوم
                                        </div>
                                    ) : (
                                        roomBookings.map(b => {
                                            const { start: bStart, end: bEnd } = getBookingDates(b);
                                            const nowMs = Date.now();
                                            const isEnded = bEnd.getTime() <= nowMs;
                                            const isStarted = bStart.getTime() <= nowMs;
                                            const isOngoing = isStarted && !isEnded;

                                            return (
                                                <div
                                                    key={b.id}
                                                    onClick={() => setActiveDetailBooking(b)}
                                                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                                        isOngoing
                                                            ? 'bg-emerald-950/30 border-emerald-500/50 hover:border-emerald-400'
                                                            : 'bg-[#1a1215] border-white/10 hover:border-white/20'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="font-bold text-white text-xs truncate">{b.customer_name}</span>
                                                        <span className="text-[10px] font-mono text-red-400">{b.start_time} - {b.end_time}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1" dir="ltr">
                                                        <span>{b.customer_phone}</span>
                                                        <span className="text-emerald-400 font-bold">{b.total_amount} ج.م</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Comprehensive Booking Details Modal */}
            {activeDetailBooking && (
                <BookingDetailsModal
                    booking={activeDetailBooking}
                    onClose={() => setActiveDetailBooking(null)}
                    onStatusChange={handleStatusUpdate}
                    onSwitchToBookingsTab={(b) => {
                        setActiveDetailBooking(null);
                        if (onSwitchToBookingsTab) {
                            onSwitchToBookingsTab(b);
                        }
                    }}
                />
            )}
        </div>
    );
}
