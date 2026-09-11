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
    Check,
    X,
    List,
    ChevronDown,
    ChevronUp,
    Info,
    ExternalLink,
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
    // Current Business Date (Cairo-pinned)
    const todayStr = useMemo(() => getCairoTodayDateString(), []);
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);

    // Active View Mode: 'today' (Daily Schedule) vs 'archive' (All Bookings)
    const [activeView, setActiveView] = useState<'today' | 'archive'>('today');

    // Data State
    const [loading, setLoading] = useState<boolean>(true);
    const [todayBookings, setTodayBookings] = useState<DBBooking[]>([]);
    const [pendingBookings, setPendingBookings] = useState<DBBooking[]>([]);
    const [showPendingDrawer, setShowPendingDrawer] = useState<boolean>(true);

    // Modals
    const [activeDetailBooking, setActiveDetailBooking] = useState<DBBooking | null>(null);
    const [showRatesModal, setShowRatesModal] = useState<boolean>(false);

    // Rates State
    const [, setRoomRates] = useState<RoomRates>({ 'room-1': 100, 'room-2': 100 });
    const [rateRoom1, setRateRoom1] = useState<number>(100);
    const [rateRoom2, setRateRoom2] = useState<number>(100);
    const [savingRates, setSavingRates] = useState<boolean>(false);

    // Filters for Daily Schedule
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
            const [metrics, dayData, rates] = await Promise.all([
                fetchBookingMetrics(),
                fetchBookingsForDate(selectedDate),
                fetchRoomRates(),
            ]);

            setPendingBookings(metrics.recentPending);
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

    // 2. Load Archive data
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

    // Quick Action: Confirm
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
            setPendingBookings(prev => prev.filter(item => item.id !== b.id));
            setTodayBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'confirmed' } : item));
        } catch {
            toast.error('تعذر تأكيد الحجز');
        }
    };

    // Quick Action: Reject
    const handleQuickReject = async (b: DBBooking) => {
        playPs5NavigateSound();
        if (!confirm(`هل أنت متأكد من رفض وإلغاء حجز ${b.customer_name}؟`)) return;
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
            toast.success('تم حفظ وتحديث أسعار الغرف بنجاح!');
        } catch {
            toast.error('تعذر حفظ أسعار الغرف');
        } finally {
            setSavingRates(false);
        }
    };

    // Derived: Active Ongoing Sessions
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
        <div className="space-y-4 max-w-7xl mx-auto" dir="rtl">
            {/* 1. UNIFIED MINIMAL CONTROL BAR (Replaces 4 stacked rows) */}
            <div className="bg-[#120d0f] border border-white/10 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                {/* Right: Date Navigator with arrows */}
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

                {/* Center: View Switcher (Today vs Archive) & Room Filter */}
                <div className="flex items-center gap-2">
                    {/* View Switch */}
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 text-xs">
                        <button
                            type="button"
                            onClick={() => { playPs5NavigateSound(); setActiveView('today'); }}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                                activeView === 'today'
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            مواعيد اليوم
                        </button>
                        <button
                            type="button"
                            onClick={() => { playPs5NavigateSound(); setActiveView('archive'); }}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                                activeView === 'archive'
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            كل الحجوزات
                        </button>
                    </div>

                    {/* Room Selector Filter (Only in Today view) */}
                    {activeView === 'today' && (
                        <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 text-xs">
                            <button
                                type="button"
                                onClick={() => setRoomFilter('all')}
                                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                                    roomFilter === 'all' ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
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
                                        roomFilter === r ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Left: Quick Status Indicators & Settings */}
                <div className="flex items-center gap-2.5 mr-auto sm:mr-0 text-xs">
                    {/* Live playing badge */}
                    <div className="flex items-center gap-1.5 text-neutral-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>شغال الآن:</span>
                        <span className="font-mono font-bold text-white">{ongoingBookings.length}</span>
                    </div>

                    <span className="text-neutral-600">|</span>

                    {/* Pending badge */}
                    {pendingBookings.length > 0 ? (
                        <button
                            type="button"
                            onClick={() => setShowPendingDrawer(true)}
                            className="flex items-center gap-1 text-amber-400 font-bold bg-amber-950/40 hover:bg-amber-900/60 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-colors"
                        >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{pendingBookings.length} معلق</span>
                        </button>
                    ) : (
                        <span className="text-neutral-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>لا معلق</span>
                        </span>
                    )}

                    <span className="text-neutral-600">|</span>

                    {/* Room Rates Settings */}
                    <button
                        type="button"
                        onClick={() => setShowRatesModal(true)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                        title="تعديل أسعار ساعات الغرف"
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>

                    {/* Refresh */}
                    <button
                        type="button"
                        onClick={loadOperationsData}
                        disabled={loading}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                        title="تحديث"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : ''}`} />
                    </button>
                </div>
            </div>

            {/* 2. COMPACT PENDING BOOKINGS LIST (Replaces giant 6-card grid) */}
            {pendingBookings.length > 0 && (
                <div className="bg-[#140e11] border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            <h3 className="text-xs sm:text-sm font-bold text-amber-300">
                                طلبات حجز معلقة بانتظار الموافقة ({pendingBookings.length})
                            </h3>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowPendingDrawer(!showPendingDrawer)}
                            className="text-neutral-400 hover:text-white text-xs font-semibold flex items-center gap-1"
                        >
                            <span>{showPendingDrawer ? 'طي القائمة' : 'عرض الطلبات'}</span>
                            {showPendingDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>

                    {showPendingDrawer && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead>
                                    <tr className="border-b border-white/10 text-neutral-400">
                                        <th className="pb-2 font-medium">العميل</th>
                                        <th className="pb-2 font-medium">الغرفة</th>
                                        <th className="pb-2 font-medium">التاريخ والتوقيت</th>
                                        <th className="pb-2 font-medium">المبلغ</th>
                                        <th className="pb-2 text-left font-medium">الإجراء السريع</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {pendingBookings.map((b) => (
                                        <tr key={b.id} className="hover:bg-white/[0.03] transition-colors">
                                            {/* Client */}
                                            <td className="py-2.5">
                                                <div className="font-bold text-white flex items-center gap-2">
                                                    <span>{b.customer_name}</span>
                                                    <span className="text-[10px] text-neutral-500 font-mono">#{b.reservation_id}</span>
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
                                            <td className="py-2.5 text-neutral-300 font-medium">
                                                {b.room_name}
                                            </td>

                                            {/* Time */}
                                            <td className="py-2.5">
                                                <div className="font-mono text-white text-xs">{b.start_time} - {b.end_time}</div>
                                                <div className="text-[10px] text-neutral-500 font-mono">{b.booking_date} ({b.duration_hours}س)</div>
                                            </td>

                                            {/* Amount */}
                                            <td className="py-2.5 font-bold font-mono text-emerald-400">
                                                {b.total_amount} ج.م
                                            </td>

                                            {/* Actions */}
                                            <td className="py-2.5 text-left">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuickConfirm(b)}
                                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
                                                    >
                                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                        <span>قبول</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuickReject(b)}
                                                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-colors"
                                                        title="رفض"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveDetailBooking(b)}
                                                        className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors text-[11px]"
                                                    >
                                                        تفاصيل
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* 3. TODAY'S VIEW: SLIM TIMELINE + CLIENTS LIST */}
            {activeView === 'today' && (
                <div className="space-y-4">
                    {/* Slim Timeline Strip (Height reduced from 100px to ~38px) */}
                    <div className="bg-[#120d0f] border border-white/10 rounded-2xl p-3 space-y-2">
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

                        {/* 20 Slim Horizontal Segments */}
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

                    {/* Today's Bookings List (Clean Executive Table) */}
                    <div className="bg-[#120d0f] border border-white/10 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-red-500" />
                                <h3 className="text-sm font-bold text-white">
                                    حجوزات اليوم ({filteredDailyBookings.length})
                                </h3>
                            </div>

                            {/* Compact Search */}
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
                                            <th className="pb-2.5 text-left font-medium">تفاصيل</th>
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

                                                    {/* Action */}
                                                    <td className="py-3 text-left">
                                                        <span className="text-neutral-400 group-hover:text-white underline text-[11px]">
                                                            عرض
                                                        </span>
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

            {/* 4. ARCHIVE VIEW: ALL BOOKINGS LIST */}
            {activeView === 'archive' && (
                <div className="bg-[#120d0f] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="relative flex-1">
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
                        <div className="flex items-center gap-1 overflow-x-auto text-xs">
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
                                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {archiveLoading ? (
                        <div className="py-12 flex justify-center">
                            <RefreshCw className="w-5 h-5 animate-spin text-red-500" />
                        </div>
                    ) : archiveBookings.length === 0 ? (
                        <div className="py-10 text-center text-xs text-neutral-400 border border-dashed border-white/10 rounded-xl">
                            لا توجد نتائج في الأرشيف.
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
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {archiveBookings.map((b) => (
                                        <tr
                                            key={b.id}
                                            onClick={() => setActiveDetailBooking(b)}
                                            className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                                        >
                                            <td className="py-2.5 font-mono text-neutral-400">#{b.reservation_id}</td>
                                            <td className="py-2.5">
                                                <div className="font-bold text-white group-hover:text-red-400 transition-colors">
                                                    {b.customer_name}
                                                </div>
                                                <span className="text-[11px] text-neutral-400 font-mono" dir="ltr">
                                                    {b.customer_phone}
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-neutral-300">{b.room_name}</td>
                                            <td className="py-2.5 font-mono">
                                                <div>{b.booking_date}</div>
                                                <div className="text-neutral-400 text-[10px]">{b.start_time} - {b.end_time}</div>
                                            </td>
                                            <td className="py-2.5 font-bold font-mono text-emerald-400">{b.total_amount} ج.م</td>
                                            <td className="py-2.5">
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {archiveTotalPages > 1 && (
                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-neutral-400">
                            <span>صفحة {archivePage} من {archiveTotalPages} ({archiveTotalCount} حجز)</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setArchivePage(p => Math.max(1, p - 1))}
                                    disabled={archivePage <= 1}
                                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30"
                                >
                                    السابق
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setArchivePage(p => Math.min(archiveTotalPages, p + 1))}
                                    disabled={archivePage >= archiveTotalPages}
                                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30"
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
                        className="bg-[#140e11] border border-white/15 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                            <div className="flex items-center gap-2">
                                <Settings2 className="w-4 h-4 text-amber-400" />
                                <h3 className="text-sm font-bold text-white">أسعار ساعات الغرف</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowRatesModal(false)}
                                className="p-1 rounded-lg text-neutral-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-neutral-300 block mb-1">
                                    سعر ساعة الغرفة 1 (Room 1):
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={rateRoom1}
                                        onChange={(e) => setRateRoom1(Number(e.target.value))}
                                        className="w-full bg-[#1c1417] text-white font-mono font-bold text-sm rounded-xl px-3 py-2 border border-white/15 outline-none focus:border-red-500"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">ج.م / س</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-neutral-300 block mb-1">
                                    سعر ساعة الغرفة 2 (Room 2):
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={rateRoom2}
                                        onChange={(e) => setRateRoom2(Number(e.target.value))}
                                        className="w-full bg-[#1c1417] text-white font-mono font-bold text-sm rounded-xl px-3 py-2 border border-white/15 outline-none focus:border-red-500"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">ج.م / س</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <button
                                type="button"
                                onClick={handleSaveRates}
                                disabled={savingRates}
                                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                            >
                                {savingRates ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                <span>حفظ الأسعار</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowRatesModal(false)}
                                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 text-xs font-semibold"
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
