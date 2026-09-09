import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowRight,
    Calendar,
    Clock,
    Lock,
    Sun,
    Moon,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    Check,
    Smartphone,
    ShoppingBag,
    Coffee,
} from 'lucide-react';
import { toast } from 'sonner';

import room01InteriorImg from '@/assets/doors/room-01-interior.jpg';
import room02InteriorImg from '@/assets/doors/room-02-interior.jpg';
import { useTheme } from '@/stores/themeStore';
import { useCart } from '@/stores/cartStore';
import { getItemUnitPrice } from '@/lib/cartUtils';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';
import {
    BookingInterval,
    createDateTimeFromBusinessDate,
    calculateEndDateTime,
    getBusinessOperatingWindow,
    checkAvailability,
    OPERATING_HOURS,
} from '@/lib/bookingDatetime';
import { fetchRoomOccupiedIntervals } from '@/services/bookingService';

interface Room {
    id: string;
    name: string;
    nameEn: string;
    titleAr: string;
    rate: number;
    specs: string;
    interiorImg: string;
}

interface DaySegment {
    type: 'available' | 'occupied';
    start: Date;
    end: Date;
    durationHours: number;
}

const AVAILABLE_ROOMS: Room[] = [
    {
        id: 'room-1',
        name: 'غرفة 01 (Play Room)',
        nameEn: 'ROOM 01',
        titleAr: 'غرفة 01 • The Arena',
        rate: 100,
        specs: 'شاشة 65 بوصة 4K • 4 دراعات PS5 • ساوند بار سينمائي',
        interiorImg: room01InteriorImg,
    },
    {
        id: 'room-2',
        name: 'غرفة 02 (Play Room)',
        nameEn: 'ROOM 02',
        titleAr: 'غرفة 02 • VIP Suite',
        rate: 100,
        specs: 'شاشة 65 بوصة 4K • 4 دراعات PS5 • سقف نجوم وعزل تام',
        interiorImg: room02InteriorImg,
    },
];

const DURATION_PRESETS = [1, 1.5, 2, 3, 4];

// Helper: Format Arabic time clearly (e.g. "06:00 مساءً" or "01:30 صباحاً")
function formatArabicTimeDetailed(date: Date): string {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const period = hour >= 12 && hour < 24 ? 'مساءً' : 'صباحاً';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${String(h12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

export default function BookingDetailsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { items: cartItems, cafeTotal, setBooking, openCart, itemCount } = useCart();

    // Initial room fallback from navigation state
    const initialRoom = location.state?.room || { name: 'غرفة 01 (Play Room)' };
    const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
        if (initialRoom.name && initialRoom.name.includes('02')) return 'room-2';
        return 'room-1';
    });

    const currentRoom = useMemo(() => {
        return AVAILABLE_ROOMS.find((r) => r.id === selectedRoomId) || AVAILABLE_ROOMS[0];
    }, [selectedRoomId]);

    // 7-day calendar generator
    const calendarDays = useMemo(() => {
        const days = [];
        const arabicDayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const arabicMonths = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
        ];

        const now = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const dayName = i === 0 ? 'اليوم' : i === 1 ? 'غداً' : arabicDayNames[d.getDay()];
            const dayNumber = d.getDate();
            const monthName = arabicMonths[d.getMonth()];
            days.push({ iso, dayName, dayNumber, monthName });
        }
        return days;
    }, []);

    const [selectedDate, setSelectedDate] = useState(calendarDays[0].iso);

    // =========================================================================
    // MOBILE-FIRST STATE: Free, non-forced initial selection
    // =========================================================================
    const [durationHours, setDurationHours] = useState<number | null>(null);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM' | null>(null);

    const [occupiedIntervals, setOccupiedIntervals] = useState<BookingInterval[]>([]);
    const [loadingIntervals, setLoadingIntervals] = useState<boolean>(false);

    const hasSelectedTime = selectedHour !== null && selectedMinute !== null && selectedPeriod !== null;
    const hasSelectedDuration = durationHours !== null;

    // Convert picker selection into 24-hour time string
    const time24 = useMemo(() => {
        if (!hasSelectedTime) return null;
        let h24 = selectedHour;
        if (selectedPeriod === 'PM' && selectedHour < 12) h24 += 12;
        if (selectedPeriod === 'AM' && selectedHour === 12) h24 = 0;
        return `${String(h24).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    }, [hasSelectedTime, selectedHour, selectedMinute, selectedPeriod]);

    // Handle setting time from Date object (e.g. when tapping an available gap)
    const setTimeFromDate = useCallback((date: Date) => {
        const hour = date.getHours();
        const min = date.getMinutes();
        const p: 'AM' | 'PM' = hour >= 12 && hour < 24 ? 'PM' : 'AM';
        const h12 = hour % 12 === 0 ? 12 : hour % 12;

        setSelectedHour(h12);
        setSelectedMinute(min);
        setSelectedPeriod(p);
        if (durationHours === null) {
            setDurationHours(1);
        }
        playPs5SelectSound();
    }, [durationHours]);

    // Handle HTML5 native time picker input
    const handleNativeTimeChange = (val: string) => {
        if (!val) return;
        const parts = val.split(':');
        if (parts.length < 2) return;
        let h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (isNaN(h) || isNaN(m)) return;

        const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
        if (h === 0) h = 12;
        else if (h > 12) h -= 12;

        setSelectedHour(h);
        setSelectedMinute(m);
        setSelectedPeriod(period);
        if (durationHours === null) {
            setDurationHours(1);
        }
        playPs5SelectSound();
    };

    // Quick time adjustments
    const addMinutesToTime = (minsToAdd: number) => {
        playPs5NavigateSound();
        let h24 = selectedHour ?? 18;
        let curMin = selectedMinute ?? 0;

        if (selectedPeriod === 'PM' && h24 < 12) h24 += 12;
        if (selectedPeriod === 'AM' && h24 === 12) h24 = 0;

        let totalMins = h24 * 60 + curMin + minsToAdd;
        totalMins = (totalMins + 1440) % 1440;

        const newH24 = Math.floor(totalMins / 60);
        const newMin = totalMins % 60;
        const newPeriod: 'AM' | 'PM' = newH24 >= 12 && newH24 < 24 ? 'PM' : 'AM';
        const newH12 = newH24 % 12 === 0 ? 12 : newH24 % 12;

        setSelectedHour(newH12);
        setSelectedMinute(newMin);
        setSelectedPeriod(newPeriod);
        if (durationHours === null) {
            setDurationHours(1);
        }
    };

    // Construct start datetime
    const startDateTime = useMemo(() => {
        if (!time24) return null;
        return createDateTimeFromBusinessDate(selectedDate, time24);
    }, [selectedDate, time24]);

    // Fetch occupied intervals from database
    const loadOccupiedIntervals = useCallback(async () => {
        setLoadingIntervals(true);
        try {
            const { opening, closing } = getBusinessOperatingWindow(selectedDate);
            const intervals = await fetchRoomOccupiedIntervals(currentRoom.id, selectedDate, opening, closing);
            setOccupiedIntervals(intervals);
        } catch (err) {
            console.error('Failed to load room occupied intervals:', err);
        } finally {
            setLoadingIntervals(false);
        }
    }, [currentRoom.id, selectedDate]);

    useEffect(() => {
        loadOccupiedIntervals();
    }, [loadOccupiedIntervals]);

    // Sorted active booked intervals
    const sortedBookings = useMemo(() => {
        return [...occupiedIntervals].sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [occupiedIntervals]);

    // =========================================================================
    // MOBILE EXPERIENCE: Dynamic calculation of all Free vs Occupied segments
    // =========================================================================
    const dayScheduleSegments = useMemo<DaySegment[]>(() => {
        const { opening, closing } = getBusinessOperatingWindow(selectedDate);
        if (sortedBookings.length === 0) {
            const diffHours = (closing.getTime() - opening.getTime()) / (3600 * 1000);
            return [{ type: 'available', start: opening, end: closing, durationHours: diffHours }];
        }

        const segments: DaySegment[] = [];
        let currentPointer = opening.getTime();

        for (const b of sortedBookings) {
            const bStart = Math.max(opening.getTime(), b.start.getTime());
            const bEnd = Math.min(closing.getTime(), b.end.getTime());

            // Free gap before this booking
            if (bStart > currentPointer) {
                const gapHours = Math.round(((bStart - currentPointer) / (3600 * 1000)) * 10) / 10;
                if (gapHours > 0) {
                    segments.push({
                        type: 'available',
                        start: new Date(currentPointer),
                        end: new Date(bStart),
                        durationHours: gapHours,
                    });
                }
            }

            // The occupied booking
            const occHours = Math.round(((bEnd - bStart) / (3600 * 1000)) * 10) / 10;
            segments.push({
                type: 'occupied',
                start: new Date(bStart),
                end: new Date(bEnd),
                durationHours: occHours,
            });

            currentPointer = Math.max(currentPointer, bEnd);
        }

        // Free gap after last booking until closing
        if (currentPointer < closing.getTime()) {
            const remainingHours = Math.round(((closing.getTime() - currentPointer) / (3600 * 1000)) * 10) / 10;
            if (remainingHours > 0) {
                segments.push({
                    type: 'available',
                    start: new Date(currentPointer),
                    end: closing,
                    durationHours: remainingHours,
                });
            }
        }

        return segments;
    }, [selectedDate, sortedBookings]);

    // Filter available gaps only for quick touch selection
    const availableGaps = useMemo(() => {
        return dayScheduleSegments.filter((s) => s.type === 'available');
    }, [dayScheduleSegments]);

    // Real-time availability evaluation
    const currentAvailability = useMemo(() => {
        if (!startDateTime || durationHours === null) {
            return {
                isAvailable: false,
                reason: 'NOT_SELECTED',
                conflictingInterval: undefined as BookingInterval | undefined,
                startDateTime: null,
                endDateTime: null,
                formattedStart: '--:--',
                formattedEnd: '--:--',
            };
        }

        const endDateTime = calculateEndDateTime(startDateTime, durationHours);
        const result = checkAvailability(
            startDateTime,
            durationHours,
            selectedDate,
            occupiedIntervals
        );

        return {
            ...result,
            startDateTime,
            endDateTime,
            formattedStart: formatArabicTimeDetailed(startDateTime),
            formattedEnd: formatArabicTimeDetailed(endDateTime),
        };
    }, [startDateTime, durationHours, selectedDate, occupiedIntervals]);

    // Timeline calculation helper: minutes from 08:00 AM (0 to 1200 mins)
    const getTimelinePercent = useCallback((date: Date): number => {
        const [y, m, d] = selectedDate.split('-').map(Number);
        const opening = new Date(y, m - 1, d, OPERATING_HOURS.START_HOUR, 0, 0, 0);
        const diffMs = date.getTime() - opening.getTime();
        const diffMins = Math.floor(diffMs / (60 * 1000));
        return Math.max(0, Math.min(100, (diffMins / 1200) * 100));
    }, [selectedDate]);

    // Proposed session segment on timeline
    const proposedTimeline = useMemo(() => {
        if (!startDateTime || durationHours === null) return null;
        const left = getTimelinePercent(startDateTime);
        const end = calculateEndDateTime(startDateTime, durationHours);
        const right = getTimelinePercent(end);
        const width = Math.max(2, right - left);
        return { left, width };
    }, [startDateTime, durationHours, getTimelinePercent]);

    // Tap on timeline to select time directly
    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, clickX / rect.width));

        const totalMinsFrom8AM = Math.round(percent * 1200);
        const roundedMins = Math.round(totalMinsFrom8AM / 15) * 15;
        const absoluteHour24 = (OPERATING_HOURS.START_HOUR + Math.floor(roundedMins / 60)) % 24;
        const minute = roundedMins % 60;
        const period: 'AM' | 'PM' = absoluteHour24 >= 12 && absoluteHour24 < 24 ? 'PM' : 'AM';
        const h12 = absoluteHour24 % 12 === 0 ? 12 : absoluteHour24 % 12;

        setSelectedHour(h12);
        setSelectedMinute(minute);
        setSelectedPeriod(period);
        if (durationHours === null) {
            setDurationHours(1);
        }
        playPs5NavigateSound();
    };

    const roomSubtotal = hasSelectedDuration ? Math.round((durationHours || 0) * currentRoom.rate) : 0;
    const isReadyToContinue = hasSelectedTime && hasSelectedDuration && currentAvailability.isAvailable;

    const handleAddToCart = () => {
        if (!hasSelectedTime || !hasSelectedDuration) {
            toast.info('يرجى تحديد وقت البدء ومدة الجلسة أولاً 🎮');
            return;
        }

        if (!isReadyToContinue) {
            if (currentAvailability.reason === 'PAST_TIME') {
                toast.error('هذا الوقت قد مضى، يرجى اختيار موعد قادم ⏳');
            } else if (currentAvailability.reason === 'EXCEEDS_CLOSING') {
                toast.error('الموعد مع المدة المحددة يتجاوز موعد إغلاق الصالة (04:00 ص) ⚠️');
            } else if (currentAvailability.reason === 'OVERLAP_CONFLICT') {
                const conf = 'conflictingInterval' in currentAvailability ? currentAvailability.conflictingInterval : undefined;
                const confMsg = conf
                    ? `يتعارض مع حجز قائم من ${formatArabicTimeDetailed(conf.start)} إلى ${formatArabicTimeDetailed(conf.end)} 🔒`
                    : 'هذا التوقيت يتعارض مع حجز قائم للغرفة 🔒';
                toast.error(confMsg);
            } else {
                toast.error('يرجى تحديد موعد متاح للجلسة 🎮');
            }
            return;
        }

        setBooking({
            roomId: currentRoom.id,
            roomName: currentRoom.name,
            roomNameEn: currentRoom.nameEn,
            date: selectedDate,
            startTime: currentAvailability.formattedStart,
            endTime: currentAvailability.formattedEnd,
            startDateTime: currentAvailability.startDateTime?.toISOString(),
            endDateTime: currentAvailability.endDateTime?.toISOString(),
            durationHours: durationHours || 1,
            rate: currentRoom.rate,
            subtotal: roomSubtotal,
        });

        playPs5SelectSound();
        toast.success(`تمت إضافة ${currentRoom.name} إلى السلة بنجاح! 🎮🛒`, {
            action: {
                label: 'عرض السلة',
                onClick: () => openCart(),
            },
        });
    };

    const handleContinue = () => {
        if (!hasSelectedTime || !hasSelectedDuration) {
            toast.info('يرجى تحديد وقت البدء ومدة الجلسة أولاً 🎮');
            return;
        }

        if (!isReadyToContinue) {
            if (currentAvailability.reason === 'PAST_TIME') {
                toast.error('هذا الوقت قد مضى، يرجى اختيار موعد قادم ⏳');
            } else if (currentAvailability.reason === 'EXCEEDS_CLOSING') {
                toast.error('الموعد مع المدة المحددة يتجاوز موعد إغلاق الصالة (04:00 ص) ⚠️');
            } else if (currentAvailability.reason === 'OVERLAP_CONFLICT') {
                const conf = currentAvailability.conflictingInterval;
                const confMsg = conf
                    ? `يتعارض مع حجز قائم من ${formatArabicTimeDetailed(conf.start)} إلى ${formatArabicTimeDetailed(conf.end)} 🔒`
                    : 'هذا التوقيت يتعارض مع حجز قائم للغرفة 🔒';
                toast.error(confMsg);
            } else {
                toast.error('يرجى تحديد موعد متاح للجلسة 🎮');
            }
            return;
        }

        playPs5SelectSound();
        navigate('/playstation/payment', {
            state: {
                room: {
                    id: currentRoom.id,
                    name: currentRoom.name,
                    nameEn: currentRoom.nameEn,
                    rate: currentRoom.rate,
                },
                date: selectedDate,
                startTime: currentAvailability.formattedStart,
                endTime: currentAvailability.formattedEnd,
                startDateTime: currentAvailability.startDateTime?.toISOString(),
                endDateTime: currentAvailability.endDateTime?.toISOString(),
                durationHours: durationHours || 1,
                roomSubtotal,
                snacks: cartItems.map(item => ({
                    id: item.id,
                    name: `${item.name}${item.customization.quantity > 1 ? ` × ${item.customization.quantity}` : ''}`,
                    price: getItemUnitPrice(item) * item.customization.quantity,
                    quantity: item.customization.quantity,
                })),
                snacksTotal: cafeTotal,
                total: roomSubtotal + cafeTotal,
            },
        });
    };

    return (
        <div className="min-h-screen w-full bg-[#f8f9fb] dark:bg-[#090708] text-neutral-900 dark:text-[#eae6e8] font-body text-sm flex flex-col selection:bg-red-600 selection:text-white relative select-none transition-colors duration-200">
            {/* Header */}
            <header className="sticky top-0 inset-x-0 z-50 bg-white/90 dark:bg-[#0c090a]/90 backdrop-blur-md border-b border-neutral-200 dark:border-white/[0.08] shadow-xs">
                <div className="h-15 px-4 sm:px-6 flex items-center justify-between max-w-2xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/playstation"
                            aria-label="الرجوع للغرف"
                            className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-white transition-all active:scale-95 border border-neutral-200/80 dark:border-white/10"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="font-bold text-base text-neutral-900 dark:text-white leading-tight">
                                حجز موعد اللعب
                            </h1>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                                صالة D95 Gaming Lounge
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={openCart}
                            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-neutral-200/80 dark:border-white/10 text-neutral-800 dark:text-neutral-200"
                            aria-label="السلة"
                            title="عرض السلة"
                        >
                            <ShoppingBag size={16} />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                                    {itemCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={toggleTheme}
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-neutral-200/80 dark:border-white/10 text-neutral-800 dark:text-neutral-200"
                            aria-label="تبديل المظهر"
                        >
                            {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-neutral-800" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative z-10 w-full pt-4 pb-32 px-4 sm:px-6 max-w-2xl mx-auto space-y-4" dir="rtl">

                {/* 1. ROOM SELECTOR */}
                <div className="bg-white dark:bg-[#120e10] border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl p-2 shadow-xs">
                    <div className="grid grid-cols-2 gap-2">
                        {AVAILABLE_ROOMS.map((room) => {
                            const isSelected = selectedRoomId === room.id;
                            return (
                                <button
                                    key={room.id}
                                    onClick={() => {
                                        setSelectedRoomId(room.id);
                                        playPs5NavigateSound();
                                    }}
                                    className={`py-3 px-3.5 rounded-xl text-center transition-all cursor-pointer border ${
                                        isSelected
                                            ? 'bg-red-600 border-red-600 text-white shadow-md shadow-red-600/25'
                                            : 'bg-neutral-50 dark:bg-white/[0.03] border-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06]'
                                    }`}
                                >
                                    <div className="font-bold text-xs sm:text-sm">
                                        {room.titleAr}
                                    </div>
                                    <div className={`text-[11px] font-mono mt-0.5 ${isSelected ? 'text-red-100' : 'text-neutral-500'}`}>
                                        {room.rate} ج.م / ساعة
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. DATE SELECTOR */}
                <div className="bg-white dark:bg-[#120e10] border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
                                اختيار يوم الحجز
                            </span>
                        </div>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                            ساعات العمل: 08:00 ص ➔ 04:00 ص
                        </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                        {calendarDays.map((d, idx) => {
                            const active = selectedDate === d.iso;
                            return (
                                <button
                                    key={d.iso}
                                    onClick={() => {
                                        setSelectedDate(d.iso);
                                        playPs5NavigateSound(idx);
                                    }}
                                    className={`shrink-0 py-2.5 px-3.5 rounded-xl border text-center transition-all cursor-pointer min-w-[68px] ${
                                        active
                                            ? 'bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white text-white dark:text-neutral-950 font-bold shadow-sm'
                                            : 'bg-neutral-50 dark:bg-white/[0.03] border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-white/20'
                                    }`}
                                >
                                    <div className="text-[10px] font-medium">{d.dayName}</div>
                                    <div className="text-base sm:text-lg font-black tabular-nums my-0.5">{d.dayNumber}</div>
                                    <div className="text-[9px] opacity-75">{d.monthName}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ========================================================= */}
                {/* 3. MOBILE-PRIORITY: ULTRA-CLEAR SCHEDULE & AVAILABILITY   */}
                {/* ========================================================= */}
                <div className="bg-white dark:bg-[#120e10] border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                    {/* Header & Status Summary */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <h2 className="font-bold text-sm text-neutral-900 dark:text-white">
                                جدول مواعيد اليوم ({currentRoom.nameEn})
                            </h2>
                        </div>

                        <div className="flex items-center gap-2">
                            {sortedBookings.length > 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span>يوجد {sortedBookings.length} موعد محجوز</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span>الغرفة متاحة طوال اليوم</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Interactive 24h Timeline Bar */}
                    <div className="space-y-2">
                        <div
                            onClick={handleTimelineClick}
                            className="relative w-full h-9 sm:h-10 bg-neutral-100 dark:bg-[#060810] border border-neutral-200 dark:border-white/15 rounded-xl overflow-hidden shadow-inner cursor-pointer active:scale-[0.99] transition-transform"
                            title="المس أو اضغط على أي وقت على الشريط لاختياره مباشرة"
                        >
                            {/* Hour Grid Markers */}
                            <div className="absolute inset-0 flex justify-between px-2 pointer-events-none opacity-20">
                                {[0, 20, 40, 60, 80, 100].map((pos) => (
                                    <div key={pos} className="w-[1px] h-full bg-neutral-400 dark:bg-white" />
                                ))}
                            </div>

                            {/* Booked Intervals (Red Striped Blocks) */}
                            {sortedBookings.map((b, idx) => {
                                const left = getTimelinePercent(b.start);
                                const right = getTimelinePercent(b.end);
                                const width = Math.max(2, right - left);
                                return (
                                    <div
                                        key={idx}
                                        style={{ left: `${left}%`, width: `${width}%` }}
                                        className="absolute top-0 bottom-0 bg-red-600/80 border-x border-red-400 flex items-center justify-center text-[10px] text-white font-mono font-bold overflow-hidden shadow-sm pointer-events-none"
                                        title={`محجوز من ${formatArabicTimeDetailed(b.start)} إلى ${formatArabicTimeDetailed(b.end)}`}
                                    >
                                        <Lock className="w-3.5 h-3.5 text-white shrink-0 drop-shadow-sm" />
                                    </div>
                                );
                            })}

                            {/* Customer's Proposed Selection (Green/Cyan or Warning Red) */}
                            {proposedTimeline && (
                                <div
                                    style={{ left: `${proposedTimeline.left}%`, width: `${proposedTimeline.width}%` }}
                                    className={`absolute top-0 bottom-0 transition-all border-2 flex items-center justify-center text-[10px] font-bold shadow-md z-10 pointer-events-none ${
                                        currentAvailability.isAvailable
                                            ? 'bg-emerald-500/85 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                                            : 'bg-red-500/85 border-amber-300 text-white animate-pulse'
                                    }`}
                                >
                                    <span className="truncate px-1 font-mono text-[10px]">
                                        {currentAvailability.isAvailable ? 'جلستك' : 'تعارض'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Timeline Labels */}
                        <div className="flex justify-between text-[10px] font-mono text-neutral-400 px-1" dir="ltr">
                            <span>08:00 ص</span>
                            <span>12:00 م</span>
                            <span>04:00 م</span>
                            <span>08:00 م</span>
                            <span>12:00 ص</span>
                            <span>04:00 ص</span>
                        </div>
                    </div>

                    {/* SECTION A: OCCUPIED SLOTS (High-Contrast & Unmistakable) */}
                    {sortedBookings.length > 0 ? (
                        <div className="space-y-2.5 pt-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                                    <Lock className="w-4 h-4" />
                                    <span>المواعيد المحجوزة مسبقاً (غير متاحة):</span>
                                </span>
                                <span className="text-[11px] text-neutral-500">
                                    مغلقة بالكامل لعملاء آخرين
                                </span>
                            </div>

                            <div className="space-y-2">
                                {sortedBookings.map((b, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-between shadow-xs"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/70 border border-red-300 dark:border-red-500/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                                                <Lock className="w-4 h-4" />
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-sm text-neutral-900 dark:text-white">
                                                    من {formatArabicTimeDetailed(b.start)} إلى {formatArabicTimeDetailed(b.end)}
                                                </div>
                                                <div className="text-xs text-red-600/90 dark:text-red-400 font-medium mt-0.5">
                                                    محجوز مسبقاً • غير متاح للحجز
                                                </div>
                                            </div>
                                        </div>

                                        <span className="px-2.5 py-1 rounded-md bg-red-600/10 dark:bg-red-950 border border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 font-bold text-xs shrink-0 font-mono">
                                            محجوز ✕
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-600/40 flex items-center gap-3 text-emerald-900 dark:text-emerald-300 text-xs">
                            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div>
                                <div className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                                    الغرفة متاحة بالكامل طوال اليوم!
                                </div>
                                <div className="text-xs text-emerald-700 dark:text-emerald-400/90 mt-0.5">
                                    لا يوجد أي حجز مسبق. يمكنك اختيار أي موعد تريده بحرية تامة من 08:00 ص حتى 04:00 ص.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION B: OPEN AVAILABLE INTERVALS (Touch-friendly quick select for mobile) */}
                    {sortedBookings.length > 0 && availableGaps.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-white/[0.06]">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>الفترات المتاحة للعب اليوم (اضغط لاختيار الموعد):</span>
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {availableGaps.map((gap, gIdx) => (
                                    <button
                                        key={gIdx}
                                        type="button"
                                        onClick={() => setTimeFromDate(gap.start)}
                                        className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-600/30 flex items-center justify-between text-right transition-all cursor-pointer active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                            <div>
                                                <div className="font-bold text-xs text-neutral-900 dark:text-white">
                                                    من {formatArabicTimeDetailed(gap.start)}
                                                </div>
                                                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                    إلى {formatArabicTimeDetailed(gap.end)} ({gap.durationHours} س)
                                                </div>
                                            </div>
                                        </div>

                                        <span className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[10px] shrink-0">
                                            احجز هنا
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ========================================================= */}
                {/* 4. TIME & DURATION SELECTOR (MOBILE-FIRST CONTROLS)       */}
                {/* ========================================================= */}
                <div className="bg-white dark:bg-[#120e10] border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
                                وقت البدء ومدة الجلسة
                            </span>
                        </div>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            اكتب أو حدد أي دقيقة تناسبك
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                        {/* Digital Time Picker Card */}
                        <div className="bg-neutral-50 dark:bg-[#151113] border border-neutral-200/80 dark:border-white/10 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-neutral-700 dark:text-neutral-300">وقت البدء:</span>
                                <label className="relative cursor-pointer text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40">
                                    <Smartphone size={13} />
                                    <span>ساعة الهاتف</span>
                                    <input
                                        type="time"
                                        value={time24 || ''}
                                        onChange={(e) => handleNativeTimeChange(e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                </label>
                            </div>

                            {/* Digital Display & Large Touch Inputs */}
                            <div className="flex items-center justify-center gap-2.5 py-2" dir="ltr">
                                {/* Hour Picker */}
                                <div className="flex flex-col items-center">
                                    <input
                                        type="number"
                                        min="1"
                                        max="12"
                                        placeholder="--"
                                        value={selectedHour !== null ? String(selectedHour).padStart(2, '0') : ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                setSelectedHour(null);
                                                return;
                                            }
                                            const num = parseInt(val, 10);
                                            if (!isNaN(num)) {
                                                setSelectedHour(Math.max(1, Math.min(12, num)));
                                            }
                                        }}
                                        className="w-16 h-13 text-center font-mono font-black text-2xl sm:text-3xl rounded-xl bg-white dark:bg-black/80 border border-neutral-300 dark:border-white/20 focus:border-red-600 outline-none text-neutral-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-xs"
                                    />
                                    <span className="text-[11px] text-neutral-500 font-bold mt-1">ساعة</span>
                                </div>

                                <span className="font-mono font-black text-2xl sm:text-3xl text-neutral-400 mb-5">:</span>

                                {/* Minute Picker */}
                                <div className="flex flex-col items-center">
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        placeholder="--"
                                        value={selectedMinute !== null ? String(selectedMinute).padStart(2, '0') : ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                setSelectedMinute(null);
                                                return;
                                            }
                                            const num = parseInt(val, 10);
                                            if (!isNaN(num)) {
                                                setSelectedMinute(Math.max(0, Math.min(59, num)));
                                            }
                                        }}
                                        className="w-16 h-13 text-center font-mono font-black text-2xl sm:text-3xl rounded-xl bg-white dark:bg-black/80 border border-neutral-300 dark:border-white/20 focus:border-red-600 outline-none text-neutral-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-xs"
                                    />
                                    <span className="text-[11px] text-neutral-500 font-bold mt-1">دقيقة</span>
                                </div>

                                {/* AM / PM Switcher (Touch-friendly height) */}
                                <div className="flex flex-col gap-1.5 ml-1 mb-5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPeriod('PM');
                                            playPs5NavigateSound();
                                        }}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                            selectedPeriod === 'PM'
                                                ? 'bg-red-600 text-white shadow-xs'
                                                : 'bg-white dark:bg-black/50 border border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400'
                                        }`}
                                    >
                                        م
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPeriod('AM');
                                            playPs5NavigateSound();
                                        }}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                            selectedPeriod === 'AM'
                                                ? 'bg-red-600 text-white shadow-xs'
                                                : 'bg-white dark:bg-black/50 border border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400'
                                        }`}
                                    >
                                        ص
                                    </button>
                                </div>
                            </div>

                            {/* Quick Time Adjustment Pills */}
                            <div className="flex items-center justify-center gap-1.5 pt-1 border-t border-neutral-200/50 dark:border-white/5">
                                <button
                                    type="button"
                                    onClick={() => addMinutesToTime(15)}
                                    className="px-2.5 py-1 rounded-md bg-neutral-200/70 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-300 cursor-pointer transition-all"
                                >
                                    +15 دقيقة
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addMinutesToTime(30)}
                                    className="px-2.5 py-1 rounded-md bg-neutral-200/70 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-300 cursor-pointer transition-all"
                                >
                                    +30 دقيقة
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addMinutesToTime(60)}
                                    className="px-2.5 py-1 rounded-md bg-neutral-200/70 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-300 cursor-pointer transition-all"
                                >
                                    +1 ساعة
                                </button>
                            </div>
                        </div>

                        {/* Duration Selector Card */}
                        <div className="bg-neutral-50 dark:bg-[#151113] border border-neutral-200/80 dark:border-white/10 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                مدة الجلسة:
                            </span>

                            <div className="grid grid-cols-3 gap-1.5">
                                {DURATION_PRESETS.map((hrs) => {
                                    const isSelected = durationHours === hrs;
                                    return (
                                        <button
                                            key={hrs}
                                            type="button"
                                            onClick={() => {
                                                setDurationHours(hrs);
                                                playPs5NavigateSound();
                                            }}
                                            className={`py-2.5 px-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer border ${
                                                isSelected
                                                    ? 'bg-red-600 border-red-600 text-white shadow-xs'
                                                    : 'bg-white dark:bg-black/50 border-neutral-300/80 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                                            }`}
                                        >
                                            {hrs} {hrs === 1 ? 'ساعة' : 'ساعات'}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-between pt-1 border-t border-neutral-200/60 dark:border-white/[0.05]">
                                <span>ينتهي في:</span>
                                <span className="font-bold text-neutral-900 dark:text-white">
                                    {hasSelectedTime && hasSelectedDuration ? currentAvailability.formattedEnd : '--:--'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Real-Time Availability Inline Feedback */}
                    {hasSelectedTime && hasSelectedDuration ? (
                        <div
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                                currentAvailability.isAvailable
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-600/40 text-emerald-950 dark:text-emerald-200'
                                    : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-600/40 text-red-950 dark:text-red-200'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                {currentAvailability.isAvailable ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                                )}
                                <div className="text-right">
                                    <div className="font-bold text-xs sm:text-sm">
                                        {currentAvailability.isAvailable
                                            ? `الموعد متاح للحجز مؤكداً`
                                            : currentAvailability.reason === 'PAST_TIME'
                                            ? 'هذا الوقت قد مضى بالفعل، يرجى اختيار موعد قادم'
                                            : currentAvailability.reason === 'EXCEEDS_CLOSING'
                                            ? 'يتجاوز موعد إغلاق الصالة (04:00 ص فجراً)'
                                            : currentAvailability.conflictingInterval
                                            ? `يتعارض مع حجز قائم من ${formatArabicTimeDetailed(currentAvailability.conflictingInterval.start)} إلى ${formatArabicTimeDetailed(currentAvailability.conflictingInterval.end)}`
                                            : 'هذا الوقت غير متاح'}
                                    </div>
                                    <div className="text-[11px] opacity-80 mt-0.5">
                                        من {currentAvailability.formattedStart} إلى {currentAvailability.formattedEnd} ({durationHours} {durationHours === 1 ? 'ساعة' : 'ساعات'})
                                    </div>
                                </div>
                            </div>

                            <span className="font-mono font-bold text-xs sm:text-sm shrink-0" dir="ltr">
                                {roomSubtotal} ج.م
                            </span>
                        </div>
                    ) : (
                        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/10 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                                <span>يرجى اختيار وقت بدء الجلسة ومدتها لتأكيد الحجز</span>
                            </div>
                            <span className="font-mono text-[11px]">
                                {currentRoom.rate} ج.م/س
                            </span>
                        </div>
                    )}
                </div>

                {/* Cafe Cross-sell / Live Cart Status Banner */}
                {cartItems.length > 0 ? (
                    <div className="bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <Coffee className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                    <span>سلة الكافيه مدمجة ({cartItems.length} {cartItems.length === 1 ? 'صنف' : 'أصناف'})</span>
                                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                                        +{cafeTotal} ج.م
                                    </span>
                                </div>
                                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    سيتم إرسال طلب المشروبات والسناكس مع حجز الغرفة كفاتورة موحدة
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => openCart()}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0 transition-all cursor-pointer shadow-xs"
                        >
                            تعديل السلة
                        </button>
                    </div>
                ) : (
                    <div className="bg-neutral-100/80 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shrink-0">
                                <Coffee className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-200">
                                    تريد مشروبات وسناكس مع اللعب؟
                                </div>
                                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                    اختر من المنيو وستُضاف لسلتك مع حجز الجلسة في فاتورة موحدة
                                </div>
                            </div>
                        </div>
                        <Link
                            to="/menu"
                            className="px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 text-xs font-bold shrink-0 transition-all"
                        >
                            تصفح المنيو
                        </Link>
                    </div>
                )}
            </main>

            {/* Sticky Mobile-First Bottom Bar */}
            <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0c090a]/95 border-t border-neutral-200 dark:border-white/10 backdrop-blur-xl p-3 sm:p-4 pb-safe shadow-xl">
                <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
                    {/* Price & Summary */}
                    <div className="flex flex-col text-right min-w-0">
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-mono font-black text-xl sm:text-2xl tabular-nums text-neutral-900 dark:text-white">
                                {roomSubtotal > 0 ? (roomSubtotal + cafeTotal) : currentRoom.rate}
                            </span>
                            <span className="text-xs text-neutral-500 font-bold">
                                {roomSubtotal > 0 ? 'ج.م إجمالي' : 'ج.م / س'}
                            </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 font-medium truncate">
                            {cafeTotal > 0 && roomSubtotal > 0 ? (
                                <span>جلسة {roomSubtotal} + كافيه {cafeTotal} ج.م</span>
                            ) : (
                                <>
                                    <span className="truncate">{currentRoom.titleAr.split('•')[0].trim()}</span>
                                    <span>•</span>
                                    <span>
                                        {hasSelectedTime && hasSelectedDuration
                                            ? `${currentAvailability.formattedStart} - ${currentAvailability.formattedEnd}`
                                            : 'لم تحدد الموعد بعد'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons: Add to Cart & Direct Checkout */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            disabled={!isReadyToContinue}
                            title="أضف الجلسة إلى السلة وتابع التصفح"
                            className={`px-3 sm:px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                                isReadyToContinue
                                    ? 'bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-900 dark:text-white border-neutral-300 dark:border-white/10 active:scale-95'
                                    : 'bg-neutral-100/50 dark:bg-white/[0.02] text-neutral-400 dark:text-neutral-600 border-transparent cursor-not-allowed opacity-60'
                            }`}
                        >
                            <ShoppingBag className="w-4 h-4" />
                            <span className="hidden sm:inline">أضف للسلة</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleContinue}
                            disabled={!isReadyToContinue}
                            className={`py-3 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border ${
                                isReadyToContinue
                                    ? 'bg-red-600 hover:bg-red-500 border-red-500 text-white shadow-md shadow-red-600/25 active:scale-95'
                                    : 'bg-neutral-200 dark:bg-white/[0.05] text-neutral-400 dark:text-neutral-500 border-transparent cursor-not-allowed'
                            }`}
                        >
                            <span>
                                {!hasSelectedTime || !hasSelectedDuration
                                    ? 'اختر الوقت والمدة'
                                    : isReadyToContinue
                                    ? 'متابعة الحجز'
                                    : 'الموعد غير متاح'}
                            </span>
                            <ArrowRight className="w-4 h-4 rotate-180" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
