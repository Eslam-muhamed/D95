import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
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
    ArrowUpRight,
    Check,
    X,
    Layers,
    DollarSign,
    SlidersHorizontal,
    List,
    ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    fetchBookingsForDate,
    fetchPaginatedBookings,
    fetchBookingMetrics,
    updateBookingStatus,
    fetchRoomRates,
    updateRoomRates,
    getBookingDates,
    type RoomRates,
} from '@/services/bookingService';
import {
    getCairoTodayDateString,
    addDaysToDateString,
    formatArabicTimeFromDate,
    OPERATING_HOURS,
    createDateTimeFromBusinessDate,
} from '@/lib/bookingDatetime';
import type { DBBooking } from '@/types/database';
import BookingDetailsModal from './BookingDetailsModal';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';

export default function SimpleOperationsTab() {
    // Current Business Date (Pinned to Cairo)
    const todayStr = useMemo(() => getCairoTodayDateString(), []);
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);

    // Active View Mode: 'today' (Daily Schedule) vs 'archive' (All Bookings Search)
    const [activeView, setActiveView] = useState<'today' | 'archive'>('today');

    // Data State
    const [loading, setLoading] = useState<boolean>(true);
    const [todayBookings, setTodayBookings] = useState<DBBooking[]>([]);
    const [pendingBookings, setPendingBookings] = useState<DBBooking[]>([]);
    const [todayCount, setTodayCount] = useState<number>(0);
    const [confirmedCount, setConfirmedCount] = useState<number>(0);

    // Modal state
    const [activeDetailBooking, setActiveDetailBooking] = useState<DBBooking | null>(null);
    const [showRatesModal, setShowRatesModal] = useState<boolean>(false);

    // Rates State
    const [roomRates, setRoomRates] = useState<RoomRates>({ 'room-1': 100, 'room-2': 100 });
    const [rateRoom1, setRateRoom1] = useState<number>(100);
    const [rateRoom2, setRateRoom2] = useState<number>(100);
    const [savingRates, setSavingRates] = useState<boolean>(false);

    // Filter state for Daily view
    const [roomFilter, setRoomFilter] = useState<string>('all');
    const [dailySearch, setDailySearch] = useState<string>('');

    // Archive / All Bookings state
    const [archivePage, setArchivePage] = useState<number>(1);
    const [archiveTotalPages, setArchiveTotalPages] = useState<number>(1);
    const [archiveTotalCount, setArchiveTotalCount] = useState<number>(0);
    const [archiveSearch, setArchiveSearch] = useState<string>('');
    const [archiveStatusFilter, setArchiveStatusFilter] = useState<string>('all');
    const [archiveBookings, setArchiveBookings] = useState<DBBooking[]>([]);
    const [archiveLoading, setArchiveLoading] = useState<boolean>(false);

    // Live Cairo Clock
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

    // 1. Load Daily Operations & Metrics
    const loadOperationsData = useCallback(async () => {
        setLoading(true);
        try {
            const [metrics, dayData, rates] = await Promise.all([
                fetchBookingMetrics(),
                fetchBookingsForDate(selectedDate),
                fetchRoomRates(),
            ]);

            setPendingBookings(metrics.recentPending);
            setConfirmedCount(metrics.confirmedCount);
            setTodayCount(metrics.todayCount);
            setTodayBookings(dayData);

            setRoomRates(rates);
            setRateRoom1(rates['room-1'] || 100);
            setRateRoom2(rates['room-2'] || 100);
        } catch {
            toast.error('تعذر جلب بيانات الحجوزات');
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        loadOperationsData();
    }, [loadOperationsData]);

    // 2. Load Archive data on view switch or filter changes
    const loadArchiveData = useCallback(async (targetPage = archivePage) => {
        if (activeView !== 'archive') return;
        setArchiveLoading(true);
        try {
            const res = await fetchPaginatedBookings({
                status: archiveStatusFilter !== 'all' ? archiveStatusFilter : undefined,
                search: archiveSearch || undefined,
                page: targetPage,
                pageSize: 15,
            });
            setArchiveBookings(res.bookings);
            setArchiveTotalCount(res.totalCount);
            setArchiveTotalPages(res.totalPages);
            setArchivePage(targetPage);
        } catch {
            toast.error('تعذر جلب أرشيف الحجوزات');
        } finally {
            setArchiveLoading(false);
        }
    }, [activeView, archiveStatusFilter, archiveSearch, archivePage]);

    useEffect(() => {
        if (activeView === 'archive') {
            loadArchiveData(archivePage);
        }
    }, [activeView, archivePage, loadArchiveData]);

    // Fast Confirm Booking
    const handleQuickConfirm = async (b: DBBooking) => {
        playPs5SelectSound();
        const { end } = getBookingDates(b);
        if (end.getTime() <= Date.now()) {
            toast.error('لا يمكن تأكيد هذا الحجز لأن موعده قد انتهى بالفعل');
            return;
        }
        try {
            await updateBookingStatus(b.id, 'confirmed');
            toast.success(`تم تأكيد حجز ${b.customer_name} بنجاح! 🎮`);
            setPendingBookings(prev => prev.filter(item => item.id !== b.id));
            setTodayBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'confirmed' } : item));
            setConfirmedCount(prev => prev + 1);
        } catch {
            toast.error('تعذر تأكيد الحجز');
        }
    };

    // Fast Reject Booking
    const handleQuickReject = async (b: DBBooking) => {
        playPs5NavigateSound();
        if (!confirm(`هل أنت متأكد من رفض حجز ${b.customer_name}؟`)) return;
        try {
            await updateBookingStatus(b.id, 'cancelled');
            toast.info(`تم إلغاء حجز ${b.customer_name}`);
            setPendingBookings(prev => prev.filter(item => item.id !== b.id));
            setTodayBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'cancelled' } : item));
        } catch {
            toast.error('تعذر إلغاء الحجز');
        }
    };

    // Save Room Rates
    const handleSaveRates = async () => {
        setSavingRates(true);
        try {
            const updated = await updateRoomRates({
                'room-1': Number(rateRoom1) || 100,
                'room-2': Number(rateRoom2) || 100,
            });
            setRoomRates(updated);
            setShowRatesModal(false);
            toast.success('تم تحديث وحفظ أسعار ساعات الغرف بنجاح! 🎮');
        } catch {
            toast.error('تعذر حفظ أسعار الغرف');
        } finally {
            setSavingRates(false);
        }
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

    // Unique Room Options in today's bookings
    const roomOptions = useMemo(() => {
        const set = new Set<string>();
        todayBookings.forEach(b => { if (b.room_name) set.add(b.room_name); });
        return Array.from(set);
    }, [todayBookings]);

    // Date title in friendly Arabic
    const formattedDateTitle = useMemo(() => {
        try {
            const [y, m, d] = selectedDate.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            return new Intl.DateTimeFormat('ar-EG', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
            }).format(dateObj);
        } catch {
            return selectedDate;
        }
    }, [selectedDate]);

    // WhatsApp quick link opener
    const openWhatsAppDirect = (e: React.MouseEvent, b: DBBooking) => {
        e.stopPropagation();
        let phone = b.customer_phone.replace(/\D/g, '');
        if (phone.startsWith('0')) phone = '2' + phone;
        else if (!phone.startsWith('20')) phone = '20' + phone;
        const text = `أهلاً بحضرتك يا أستاذ ${b.customer_name} 👋\nمعاك إدارة D95 Gaming Lounge 🎮\n\nبخصوص حجزك (${b.reservation_id}):\n📍 الغرفة: ${b.room_name}\n📅 التاريخ: ${b.booking_date}\n⏰ التوقيت: ${b.start_time} - ${b.end_time} (${b.duration_hours} س)\n\nفي انتظارك تنورنا!`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    // Calculate 20 Hourly Slots for selected date with minutes precision
    const timelineSlots = useMemo(() => {
        const slots = [];
        const now = Date.now();

        for (let i = 0; i < 20; i++) {
            const slotHour = (OPERATING_HOURS.START_HOUR + i) % 24;
            const endHour = (OPERATING_HOURS.START_HOUR + i + 1) % 24;

            const time24 = `${String(slotHour).padStart(2, '0')}:00`;
            const start = createDateTimeFromBusinessDate(selectedDate, time24);
            const end = new Date(start.getTime() + 60 * 60 * 1000);

            // Period & 12h formatting
            const period = slotHour >= 12 && slotHour < 24 ? 'م' : 'ص';
            const h12 = slotHour % 12 === 0 ? 12 : slotHour % 12;
            const nextPeriod = endHour >= 12 && endHour < 24 ? 'م' : 'ص';
            const nextH12 = endHour % 12 === 0 ? 12 : endHour % 12;
            const label = `${h12} ${period}`;
            const rangeLabel = `${h12}:00 ${period} - ${nextH12}:00 ${nextPeriod}`;

            const isPast = end.getTime() <= now;

            // Find overlapping confirmed/pending bookings
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

            const freeMinutes = 60 - bookedMinutes;
            const bookedPercentage = Math.round((bookedMinutes / 60) * 100);

            let status: 'available' | 'booked' | 'partial' | 'past' = 'available';
            if (isPast && bookedMinutes === 0) status = 'past';
            else if (bookedMinutes === 60) status = 'booked';
            else if (bookedMinutes > 0) status = 'partial';

            let gradientStyle: React.CSSProperties | undefined;
            if (status === 'partial') {
                const redColor = '#dc2626';
                const emptyColor = isPast ? '#1f191c' : '#140e11';
                gradientStyle = {
                    background: `linear-gradient(to left, ${redColor} 0%, ${redColor} ${bookedPercentage}%, ${emptyColor} ${bookedPercentage}%, ${emptyColor} 100%)`,
                };
            }

            slots.push({
                index: i,
                label,
                rangeLabel,
                status,
                bookedMinutes,
                freeMinutes,
                bookedPercentage,
                activeBookings,
                gradientStyle,
                isPast,
            });
        }
        return slots;
    }, [selectedDate, todayBookings, roomFilter]);

    return (
        <div className="space-y-6" dir="rtl">
            {/* Top Quick Status & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#1a1114] via-[#140e11] to-[#120c0f] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md">
                {/* 3 Quick Stat Badges */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {/* Stat 1: Pending Bookings */}
                    <div
                        onClick={() => {
                            if (pendingBookings.length > 0) {
                                document.getElementById('pending-section')?.scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                        className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                            pendingBookings.length > 0
                                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                : 'bg-white/5 border-white/10 text-neutral-400'
                        }`}
                        title="حجوزات معلقة تنتظر الموافقة"
                    >
                        <AlertCircle className={`w-4 h-4 ${pendingBookings.length > 0 ? 'text-amber-400 animate-pulse' : 'text-neutral-500'}`} />
                        <div className="text-xs font-bold">
                            <span className="text-white font-mono font-black text-sm ml-1.5">{pendingBookings.length}</span>
                            <span>بانتظار الموافقة</span>
                        </div>
                    </div>

                    {/* Stat 2: Active Ongoing Sessions */}
                    <div className="px-3.5 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <div className="text-xs font-bold">
                            <span className="text-white font-mono font-black text-sm ml-1.5">{ongoingBookings.length}</span>
                            <span>شغال الآن بالصالة</span>
                        </div>
                    </div>

                    {/* Stat 3: Today's Total Bookings */}
                    <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-neutral-300 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-red-400" />
                        <div className="text-xs font-bold">
                            <span className="text-white font-mono font-black text-sm ml-1.5">{todayBookings.length}</span>
                            <span>حجوزات مسجلة</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Clock & Quick Settings */}
                <div className="flex items-center gap-2 justify-between sm:justify-end">
                    <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-mono font-bold text-emerald-400">{currentTimeStr}</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowRatesModal(true)}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="تعديل أسعار ساعات الغرف"
                    >
                        <Settings2 className="w-4 h-4 text-amber-400" />
                        <span className="hidden sm:inline">أسعار الغرف</span>
                    </button>

                    <button
                        type="button"
                        onClick={loadOperationsData}
                        disabled={loading}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                        title="تحديث البيانات"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Urgent Pending Bookings Section (Only shown if pending exist) */}
            {pendingBookings.length > 0 && (
                <div id="pending-section" className="bg-gradient-to-br from-amber-950/40 via-[#1c1417] to-[#140e11] border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(245,158,11,0.15)] space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                            <h2 className="text-sm sm:text-base font-black text-amber-300">
                                ⚡ طلبات حجز جديدة تنتظر موافقتك ({pendingBookings.length})
                            </h2>
                        </div>
                        <span className="text-[11px] text-amber-400/80 font-bold">مراجعة فورية</span>
                    </div>

                    {/* Pending Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {pendingBookings.map((b) => (
                            <div
                                key={b.id}
                                className="bg-[#120d0f] border border-amber-500/30 hover:border-amber-400/60 rounded-xl p-3.5 space-y-3 shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 className="text-sm font-bold text-white">{b.customer_name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                                            <span dir="ltr" className="font-mono text-neutral-300">{b.customer_phone}</span>
                                            <button
                                                type="button"
                                                onClick={(e) => openWhatsAppDirect(e, b)}
                                                className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold inline-flex items-center gap-0.5 cursor-pointer"
                                            >
                                                <MessageCircle className="w-3 h-3" />
                                                <span>واتساب</span>
                                            </button>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        معلق ⏳
                                    </span>
                                </div>

                                <div className="bg-black/40 rounded-lg p-2 flex items-center justify-between text-xs border border-white/5">
                                    <div>
                                        <span className="text-neutral-400 text-[10px] block">الغرفة والموعد:</span>
                                        <span className="text-white font-bold">{b.room_name}</span>
                                        <span className="text-red-400 font-mono text-[11px] block">{b.booking_date} • {b.start_time} - {b.end_time}</span>
                                    </div>
                                    <div className="text-left">
                                        <span className="text-neutral-400 text-[10px] block">المبلغ:</span>
                                        <span className="text-emerald-400 font-bold font-mono text-sm">{b.total_amount} ج.م</span>
                                    </div>
                                </div>

                                {/* Action Buttons: Quick Confirm vs Quick Reject */}
                                <div className="flex items-center gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => handleQuickConfirm(b)}
                                        className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-md shadow-emerald-900/30"
                                    >
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        <span>تأكيد الحجز</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleQuickReject(b)}
                                        className="px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-500/30 text-red-300 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                                        title="رفض الحجز"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveDetailBooking(b)}
                                        className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                                        title="عرض التفاصيل الكاملة"
                                    >
                                        تفاصيل
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Mode Switcher: Daily Schedule vs All Bookings Archive */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center bg-[#140e11] border border-white/10 rounded-xl p-1 gap-1">
                    <button
                        type="button"
                        onClick={() => {
                            playPs5NavigateSound();
                            setActiveView('today');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                            activeView === 'today'
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                                : 'text-neutral-400 hover:text-white'
                        }`}
                    >
                        <Clock className="w-4 h-4" />
                        <span>جدول مواعيد اليوم (التشغيل)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            playPs5NavigateSound();
                            setActiveView('archive');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                            activeView === 'archive'
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                                : 'text-neutral-400 hover:text-white'
                        }`}
                    >
                        <List className="w-4 h-4" />
                        <span>أرشيف وبحث كل الحجوزات</span>
                    </button>
                </div>

                <span className="text-xs text-neutral-400 hidden sm:inline">
                    {activeView === 'today' ? `مواعيد: ${formattedDateTitle}` : `إجمالي الحجوزات: ${archiveTotalCount}`}
                </span>
            </div>

            {/* VIEW 1: DAILY SCHEDULE (TIMELINE & TODAY'S CLIENTS) */}
            {activeView === 'today' && (
                <div className="space-y-5">
                    {/* Date Switcher & Room Filter Bar */}
                    <div className="bg-[#140e11] border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
                        {/* Day switchers */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                            <button
                                type="button"
                                onClick={() => setSelectedDate(prev => addDaysToDateString(prev, -1))}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 text-xs font-semibold cursor-pointer"
                                title="اليوم السابق"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedDate(addDaysToDateString(todayStr, -1))}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    selectedDate === addDaysToDateString(todayStr, -1)
                                        ? 'bg-red-600 text-white shadow-sm'
                                        : 'bg-white/5 text-neutral-400 hover:text-white'
                                }`}
                            >
                                أمس
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedDate(todayStr)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    selectedDate === todayStr
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                                        : 'bg-white/5 text-neutral-400 hover:text-white'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>اليوم (الحالي)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedDate(addDaysToDateString(todayStr, 1))}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    selectedDate === addDaysToDateString(todayStr, 1)
                                        ? 'bg-red-600 text-white shadow-sm'
                                        : 'bg-white/5 text-neutral-400 hover:text-white'
                                }`}
                            >
                                غداً
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedDate(prev => addDaysToDateString(prev, 1))}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 text-xs font-semibold cursor-pointer"
                                title="اليوم التالي"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Date Picker & Room Filter */}
                        <div className="flex items-center gap-3 justify-between md:justify-end">
                            {/* Room Filter Pills */}
                            <div className="flex items-center gap-1 bg-[#1a1215] border border-white/10 rounded-xl p-1 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setRoomFilter('all')}
                                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                                        roomFilter === 'all' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
                                    }`}
                                >
                                    جميع الغرف
                                </button>
                                {roomOptions.map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRoomFilter(r)}
                                        className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                                            roomFilter === r ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>

                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                                className="bg-[#1c1417] text-white text-xs border border-white/15 rounded-xl px-2.5 py-1.5 outline-none focus:border-red-500 cursor-pointer font-mono"
                            />
                        </div>
                    </div>

                    {/* 20-Square Visual Schedule Timeline */}
                    <div className="bg-[#140e11] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-red-500" />
                                <h3 className="text-sm font-bold text-white">مخطط ساعات التشغيل اليومية (20 ساعة)</h3>
                                <span className="text-[10px] text-neutral-400 font-mono">08:00 ص → 04:00 ص</span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                                <span className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded bg-white/10 border border-white/20" />
                                    <span>متاح</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded bg-red-600 border border-red-500" />
                                    <span>محجوز</span>
                                </span>
                            </div>
                        </div>

                        {/* 20 Slots Grid */}
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-1.5 sm:gap-2">
                            {timelineSlots.map((slot) => {
                                const hasBookings = slot.activeBookings.length > 0;
                                return (
                                    <div
                                        key={slot.index}
                                        title={`${slot.rangeLabel}\n${slot.status === 'booked' ? 'محجوز بالكامل' : slot.status === 'partial' ? `محجوز ${slot.bookedMinutes} دقيقة` : 'متاح'}`}
                                        className={`relative rounded-xl p-2 flex flex-col justify-between border transition-all text-center min-h-[64px] ${
                                            slot.status === 'booked'
                                                ? 'bg-red-950/70 border-red-500 text-white shadow-sm'
                                                : slot.status === 'partial'
                                                ? 'border-red-400 text-white'
                                                : slot.isPast
                                                ? 'bg-[#120d0f] border-white/5 text-neutral-500'
                                                : 'bg-[#181114] border-white/10 text-neutral-300 hover:border-white/25'
                                        }`}
                                        style={slot.gradientStyle}
                                    >
                                        <span className="text-[11px] font-bold font-mono block leading-tight">{slot.label}</span>

                                        <div className="mt-1">
                                            {slot.status === 'booked' ? (
                                                <span className="text-[10px] font-bold text-red-200 block">محجوز</span>
                                            ) : slot.status === 'partial' ? (
                                                <span className="text-[9px] font-bold text-amber-300 block">{slot.bookedMinutes}د</span>
                                            ) : (
                                                <span className="text-[10px] text-neutral-500 block">متاح</span>
                                            )}
                                        </div>

                                        {hasBookings && (
                                            <span className="text-[9px] text-neutral-300 font-mono truncate block mt-0.5">
                                                {slot.activeBookings[0].customer_name.split(' ')[0]}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Today's Client Bookings List */}
                    <div className="bg-[#140e11] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-red-500" />
                                <h3 className="text-sm font-bold text-white">
                                    قائمة حجوزات اليوم ({filteredDailyBookings.length} حجز)
                                </h3>
                            </div>

                            {/* Search within today */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="بحث باسم العميل أو الهاتف..."
                                    value={dailySearch}
                                    onChange={(e) => setDailySearch(e.target.value)}
                                    className="w-full bg-[#1c1417] text-white text-xs rounded-xl pr-9 pl-3 py-2 border border-white/10 outline-none focus:border-red-500"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-12 flex justify-center">
                                <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
                            </div>
                        ) : filteredDailyBookings.length === 0 ? (
                            <div className="py-12 text-center text-xs text-neutral-400 border border-dashed border-white/10 rounded-xl space-y-2">
                                <div>لا توجد حجوزات مسجلة لهذا التاريخ المطابق للبحث.</div>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedDate(todayStr); setDailySearch(''); setRoomFilter('all'); }}
                                    className="text-red-400 hover:text-red-300 underline font-bold cursor-pointer"
                                >
                                    إعادة ضبط التاريخ والبحث
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
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
                                            className={`rounded-xl border p-3.5 sm:p-4 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                                                isOngoing
                                                    ? 'bg-[#181114] border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:border-emerald-400'
                                                    : b.status === 'pending'
                                                    ? 'bg-[#181114] border-amber-500/40 hover:border-amber-400'
                                                    : isEnded
                                                    ? 'bg-[#120d0f] border-neutral-800/80 opacity-80 hover:opacity-100'
                                                    : 'bg-[#181114] border-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            {/* Client Info */}
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                                                        isOngoing
                                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                            : b.status === 'pending'
                                                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                                            : 'bg-white/5 text-neutral-300 border-white/10'
                                                    }`}
                                                >
                                                    <User className="w-4 h-4" />
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                                                            {b.customer_name}
                                                        </h4>
                                                        <span className="text-[10px] font-mono text-neutral-500">#{b.reservation_id}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 text-xs text-neutral-400 mt-0.5">
                                                        <span dir="ltr" className="font-mono">{b.customer_phone}</span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => openWhatsAppDirect(e, b)}
                                                            className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold inline-flex items-center gap-0.5 cursor-pointer"
                                                        >
                                                            <MessageCircle className="w-3 h-3" />
                                                            <span>واتساب</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Timing, Room & Status */}
                                            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                                                <div>
                                                    <span className="text-[10px] text-neutral-500 block">الموعد:</span>
                                                    <span className="text-xs font-bold font-mono text-white block">
                                                        {b.start_time} - {b.end_time}
                                                    </span>
                                                    <span className="text-[10px] text-neutral-400">({b.duration_hours} س)</span>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] text-neutral-500 block">الغرفة:</span>
                                                    <span className="text-xs font-bold text-purple-300 block">{b.room_name}</span>
                                                    <span className="text-xs font-mono text-emerald-400 font-bold block">{b.total_amount} ج.م</span>
                                                </div>

                                                <div className="text-left shrink-0">
                                                    {isOngoing ? (
                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1 shadow-sm">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                                            <span>شغال الآن 🎮</span>
                                                        </span>
                                                    ) : b.status === 'confirmed' ? (
                                                        isEnded ? (
                                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-white/10">
                                                                انتهى ⌛
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                                مؤكد 🔒
                                                            </span>
                                                        )
                                                    ) : b.status === 'pending' ? (
                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                            معلق ⏳
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400">
                                                            {b.status === 'completed' ? 'مكتمل' : 'ملغي'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VIEW 2: ARCHIVE & SEARCH ALL BOOKINGS */}
            {activeView === 'archive' && (
                <div className="bg-[#140e11] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-md">
                    {/* Filter & Search Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="ابحث باسم العميل، رقم الهاتف، أو كود الحجز..."
                                value={archiveSearch}
                                onChange={(e) => {
                                    setArchiveSearch(e.target.value);
                                    setArchivePage(1);
                                }}
                                className="w-full bg-[#1c1417] text-white text-xs rounded-xl pr-10 pl-3 py-2.5 border border-white/10 outline-none focus:border-red-500"
                            />
                        </div>

                        {/* Status Tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
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
                                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                                        archiveStatusFilter === tab.id
                                            ? 'bg-red-600 text-white'
                                            : 'bg-white/5 text-neutral-400 hover:text-white'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Archive List */}
                    {archiveLoading ? (
                        <div className="py-16 flex justify-center">
                            <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
                        </div>
                    ) : archiveBookings.length === 0 ? (
                        <div className="py-12 text-center text-xs text-neutral-400 border border-dashed border-white/10 rounded-xl">
                            لا توجد حجوزات مطابقة لمعايير البحث في الأرشيف.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {archiveBookings.map((b) => (
                                <div
                                    key={b.id}
                                    onClick={() => setActiveDetailBooking(b)}
                                    className="bg-[#181114] hover:bg-white/[0.04] border border-white/5 hover:border-white/15 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors cursor-pointer"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-white">{b.customer_name}</span>
                                            <span className="text-[10px] font-mono text-neutral-400">#{b.reservation_id}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5">
                                            <span dir="ltr" className="font-mono">{b.customer_phone}</span>
                                            <span>•</span>
                                            <span className="text-purple-300">{b.room_name}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                                        <div className="text-right">
                                            <span className="font-mono text-neutral-300 block">{b.booking_date}</span>
                                            <span className="font-mono text-red-400 text-[11px] block">{b.start_time} - {b.end_time}</span>
                                        </div>

                                        <span className="font-bold text-emerald-400 font-mono text-sm">{b.total_amount} ج.م</span>

                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                            b.status === 'confirmed'
                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                                : b.status === 'pending'
                                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                                        }`}>
                                            {b.status === 'confirmed' ? 'مؤكد' : b.status === 'pending' ? 'معلق' : b.status === 'completed' ? 'مكتمل' : 'ملغي'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {archiveTotalPages > 1 && (
                        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-neutral-400">
                            <span>صفحة {archivePage} من {archiveTotalPages} ({archiveTotalCount} حجز)</span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setArchivePage(p => Math.max(1, p - 1))}
                                    disabled={archivePage <= 1}
                                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 cursor-pointer"
                                >
                                    السابق
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setArchivePage(p => Math.min(archiveTotalPages, p + 1))}
                                    disabled={archivePage >= archiveTotalPages}
                                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 cursor-pointer"
                                >
                                    التالي
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Booking Details Modal */}
            {activeDetailBooking && (
                <BookingDetailsModal
                    booking={activeDetailBooking}
                    onClose={() => setActiveDetailBooking(null)}
                    onStatusChange={async (id, newStatus) => {
                        await updateBookingStatus(id, newStatus);
                        toast.success('تم تحديث حالة الحجز بنجاح');
                        setActiveDetailBooking(null);
                        loadOperationsData();
                        if (activeView === 'archive') loadArchiveData();
                    }}
                />
            )}

            {/* Simple Room Rates Modal */}
            {showRatesModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setShowRatesModal(false)}
                >
                    <div
                        className="bg-[#140e11] border border-white/15 rounded-3xl p-5 sm:p-6 w-full max-w-md space-y-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2">
                                <Settings2 className="w-5 h-5 text-amber-400" />
                                <h3 className="text-base font-bold text-white">إعدادات أسعار ساعات الغرف</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowRatesModal(false)}
                                className="p-1 rounded-lg text-neutral-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-neutral-400">
                            حدد سعر الساعة (ج.م) لكل غرفة. سيتم تطبيق السعر فوراً في الحسابات عند حجز الزبائن.
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-neutral-300 block mb-1">
                                    سعر ساعة الغرفة 1 (Room 1):
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
                                    سعر ساعة الغرفة 2 (Room 2):
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

                        <div className="flex items-center gap-2 pt-2">
                            <button
                                type="button"
                                onClick={handleSaveRates}
                                disabled={savingRates}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                            >
                                {savingRates ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                <span>حفظ الأسعار وتطبيقها</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowRatesModal(false)}
                                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
