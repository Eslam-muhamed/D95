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
    ChevronDown,
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
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

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
        const curMin = selectedMinute ?? 0;

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

    // Select an available slot and auto-set start time to slot start
    const selectSlot = useCallback((slotIdx: number, segment: DaySegment) => {
        if (segment.type !== 'available') return;
        setSelectedSlotIndex(slotIdx);
        // Auto-set start time to slot start
        const h24 = segment.start.getHours();
        const m = segment.start.getMinutes();
        const period: 'AM' | 'PM' = h24 >= 12 && h24 < 24 ? 'PM' : 'AM';
        const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
        setSelectedHour(h12);
        setSelectedMinute(m);
        setSelectedPeriod(period);
        // Reset duration so user picks fresh
        setDurationHours(null);
        playPs5SelectSound();
    }, []);

    // Reset slot selection when date or room changes
    useEffect(() => {
        setSelectedSlotIndex(null);
        setDurationHours(null);
        setSelectedHour(null);
        setSelectedMinute(null);
        setSelectedPeriod(null);
    }, [selectedDate, selectedRoomId]);

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
                onClick: () => openCart('playstation'),
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
                                D95 Gaming Lounge
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => openCart('playstation')}
                            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-neutral-200/80 dark:border-white/10 text-neutral-800 dark:text-neutral-200"
                            aria-label="السلة"
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
            <main className="flex-1 flex flex-col relative z-10 w-full pt-4 pb-32 px-4 sm:px-6 max-w-2xl mx-auto space-y-3" dir="rtl">

                {/* ═══════════════════════════════════════════════════════ */}
                {/* CARD 1: ROOM + DATE (Merged)                          */}
                {/* ═══════════════════════════════════════════════════════ */}
                <div className="bg-white dark:bg-[#120e10] border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
                    {/* Room Tabs */}
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
                                    className={`py-2.5 px-3 rounded-xl text-center transition-all cursor-pointer border ${
                                        isSelected
                                            ? 'bg-red-600 border-red-600 text-white shadow-md shadow-red-600/25'
                                            : 'bg-neutral-50 dark:bg-white/[0.03] border-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06]'
                                    }`}
                                >
                                    <div className="font-bold text-xs sm:text-sm">{room.titleAr}</div>
                                    <div className={`text-[11px] font-mono mt-0.5 ${isSelected ? 'text-red-100' : 'text-neutral-500'}`}>
                                        {room.rate} ج.م / ساعة
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-neutral-100 dark:border-white/[0.06]" />

                    {/* Date Picker */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-0.5">
                        {calendarDays.map((d, idx) => {
                            const active = selectedDate === d.iso;
                            return (
                                <button
                                    key={d.iso}
                                    onClick={() => {
                                        setSelectedDate(d.iso);
                                        playPs5NavigateSound(idx);
                                    }}
                                    className={`shrink-0 py-2 px-3 rounded-xl border text-center transition-all cursor-pointer min-w-[60px] ${
                                        active
                                            ? 'bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white text-white dark:text-neutral-950 font-bold shadow-sm'
                                            : 'bg-neutral-50 dark:bg-white/[0.03] border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-white/20'
                                    }`}
                                >
                                    <div className="text-[10px] font-medium">{d.dayName}</div>
                                    <div className="text-base font-black tabular-nums my-0.5">{d.dayNumber}</div>
                                    <div className="text-[9px] opacity-75">{d.monthName}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════ */}
                {/* CARD 2: AVAILABLE SLOTS (The Core Simplification)      */}
                {/* ═══════════════════════════════════════════════════════ */}
                <div className="bg-white dark:bg-[#120e10] border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl p-3 sm:p-4 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
                                اختار وقت اللعب
                            </span>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono">
                            08:00 ص → 04:00 ص
                        </span>
                    </div>

                    {loadingIntervals ? (
                        <div className="py-8 text-center text-xs text-neutral-400">
                            <div className="w-5 h-5 border-2 border-neutral-300 border-t-red-600 rounded-full animate-spin mx-auto mb-2" />
                            جاري تحميل المواعيد...
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {dayScheduleSegments.map((seg, idx) => {
                                if (seg.type === 'occupied') {
                                    // Occupied: minimal gray line
                                    return (
                                        <div
                                            key={`occ-${idx}`}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-neutral-50 dark:bg-white/[0.03] border border-neutral-100 dark:border-white/[0.05]"
                                        >
                                            <Lock className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                                            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
                                                {formatArabicTimeDetailed(seg.start)} → {formatArabicTimeDetailed(seg.end)} • محجوز
                                            </span>
                                        </div>
                                    );
                                }

                                // Available: tappable slot card
                                const isExpanded = selectedSlotIndex === idx;
                                const maxHoursInSlot = seg.durationHours;

                                return (
                                    <div key={`avail-${idx}`} className="space-y-0">
                                        {/* Slot Header (always visible, tappable) */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (isExpanded) {
                                                    setSelectedSlotIndex(null);
                                                } else {
                                                    selectSlot(idx, seg);
                                                }
                                            }}
                                            className={`w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl border text-right transition-all cursor-pointer ${
                                                isExpanded
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-600/40 shadow-sm'
                                                    : 'bg-emerald-50/50 dark:bg-emerald-950/15 border-emerald-200/60 dark:border-emerald-700/25 hover:border-emerald-300 dark:hover:border-emerald-600/40'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-2 h-2 rounded-full shrink-0 ${isExpanded ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-400'}`} />
                                                <div className="min-w-0">
                                                    <div className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
                                                        {formatArabicTimeDetailed(seg.start)} → {formatArabicTimeDetailed(seg.end)}
                                                    </div>
                                                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                        {maxHoursInSlot >= 1
                                                            ? `${maxHoursInSlot} ${maxHoursInSlot === 1 ? 'ساعة' : 'ساعات'} متاحة`
                                                            : `${Math.round(maxHoursInSlot * 60)} دقيقة متاحة`}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronDown className={`w-4 h-4 text-emerald-500 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Expanded: Duration + Time Fine-tune */}
                                        {isExpanded && (
                                            <div className="px-3.5 py-3 border border-t-0 border-emerald-200 dark:border-emerald-700/30 rounded-b-xl bg-white dark:bg-[#120e10] space-y-3 -mt-1">
                                                {/* Duration Buttons */}
                                                <div>
                                                    <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300 block mb-2">
                                                        اختار مدة الجلسة:
                                                    </span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {DURATION_PRESETS.map((hrs) => {
                                                            const fits = hrs <= maxHoursInSlot;
                                                            const isSelected = durationHours === hrs;
                                                            return (
                                                                <button
                                                                    key={hrs}
                                                                    type="button"
                                                                    disabled={!fits}
                                                                    onClick={() => {
                                                                        setDurationHours(hrs);
                                                                        playPs5NavigateSound();
                                                                    }}
                                                                    className={`py-2 px-3.5 rounded-lg font-bold text-xs transition-all border ${
                                                                        isSelected
                                                                            ? 'bg-red-600 border-red-600 text-white shadow-xs'
                                                                            : fits
                                                                            ? 'bg-neutral-50 dark:bg-white/[0.04] border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-red-300 cursor-pointer'
                                                                            : 'bg-neutral-50/50 dark:bg-white/[0.02] border-transparent text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                                                                    }`}
                                                                >
                                                                    {hrs} {hrs === 1 ? 'ساعة' : 'ساعات'}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Fine-tune start time (compact) */}
                                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-white/[0.06]">
                                                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>
                                                            بداية: <strong className="text-neutral-900 dark:text-white">{hasSelectedTime ? currentAvailability.formattedStart : '--:--'}</strong>
                                                        </span>
                                                        {hasSelectedDuration && (
                                                            <>
                                                                <span>→</span>
                                                                <span>
                                                                    نهاية: <strong className="text-neutral-900 dark:text-white">{currentAvailability.formattedEnd}</strong>
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <label className="relative cursor-pointer text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 py-1 px-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors">
                                                        <Smartphone size={12} />
                                                        <span>تعديل الوقت</span>
                                                        <input
                                                            type="time"
                                                            value={time24 || ''}
                                                            onChange={(e) => handleNativeTimeChange(e.target.value)}
                                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                        />
                                                    </label>
                                                </div>

                                                {/* Availability Result */}
                                                {hasSelectedTime && hasSelectedDuration && (
                                                    <div
                                                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                                                            currentAvailability.isAvailable
                                                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-600/40 text-emerald-900 dark:text-emerald-200'
                                                                : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-600/40 text-red-900 dark:text-red-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {currentAvailability.isAvailable ? (
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                            ) : (
                                                                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                                                            )}
                                                            <span className="font-bold">
                                                                {currentAvailability.isAvailable
                                                                    ? 'الموعد متاح ✓'
                                                                    : currentAvailability.reason === 'PAST_TIME'
                                                                    ? 'هذا الوقت مضى'
                                                                    : currentAvailability.reason === 'EXCEEDS_CLOSING'
                                                                    ? 'يتجاوز موعد الإغلاق'
                                                                    : 'تعارض مع حجز قائم'}
                                                            </span>
                                                        </div>
                                                        <span className="font-mono font-bold shrink-0">
                                                            {roomSubtotal} ج.م
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* All-clear message when no bookings */}
                            {sortedBookings.length === 0 && dayScheduleSegments.length === 1 && (
                                <p className="text-center text-[11px] text-emerald-600 dark:text-emerald-400 font-medium py-1">
                                    🎉 الغرفة فاضية بالكامل — اختار أي فترة تعجبك!
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* ═══════════════════════════════════════════════════════ */}
                {/* CARD 3: CAFÉ CROSS-SELL (Compact)                      */}
                {/* ═══════════════════════════════════════════════════════ */}
                {cartItems.length > 0 ? (
                    <div className="bg-amber-50/80 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                                سلة الكافيه: {cartItems.length} {cartItems.length === 1 ? 'صنف' : 'أصناف'} (+{cafeTotal} ج.م)
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => openCart('cafe')}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold shrink-0 transition-all cursor-pointer"
                        >
                            تعديل
                        </button>
                    </div>
                ) : (
                    <Link
                        to="/menu"
                        className="flex items-center justify-between gap-2 bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/[0.06] rounded-xl p-3 hover:border-neutral-300 dark:hover:border-white/10 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Coffee className="w-4 h-4 text-neutral-400" />
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                أضف مشروبات وسناكس مع الجلسة (اختياري)
                            </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-400 rotate-180" />
                    </Link>
                )}
            </main>

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0c090a]/95 border-t border-neutral-200 dark:border-white/10 backdrop-blur-xl p-3 sm:p-4 pb-safe shadow-xl">
                <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
                    {/* Price & Summary */}
                    <div className="flex flex-col text-right min-w-0">
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-mono font-black text-xl sm:text-2xl tabular-nums text-neutral-900 dark:text-white">
                                {roomSubtotal > 0 ? (roomSubtotal + cafeTotal) : currentRoom.rate}
                            </span>
                            <span className="text-xs text-neutral-500 font-bold">
                                {roomSubtotal > 0 ? 'ج.م' : 'ج.م / س'}
                            </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium truncate">
                            {hasSelectedTime && hasSelectedDuration
                                ? `${currentRoom.titleAr.split('•')[0].trim()} • ${currentAvailability.formattedStart} → ${currentAvailability.formattedEnd}`
                                : `${currentRoom.titleAr.split('•')[0].trim()} • اختار فترة من الأعلى`}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            disabled={!isReadyToContinue}
                            title="أضف الجلسة إلى السلة"
                            className={`px-3 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
                                isReadyToContinue
                                    ? 'bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-900 dark:text-white border-neutral-300 dark:border-white/10 active:scale-95 cursor-pointer'
                                    : 'bg-neutral-100/50 dark:bg-white/[0.02] text-neutral-400 dark:text-neutral-600 border-transparent cursor-not-allowed opacity-60'
                            }`}
                        >
                            <ShoppingBag className="w-4 h-4" />
                        </button>

                        <button
                            type="button"
                            onClick={handleContinue}
                            className={`py-3 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all border ${
                                isReadyToContinue
                                    ? 'bg-red-600 hover:bg-red-500 border-red-500 text-white shadow-md shadow-red-600/25 active:scale-95 cursor-pointer'
                                    : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.08] dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-white/10 cursor-pointer'
                            }`}
                        >
                            <span>
                                {!hasSelectedTime || !hasSelectedDuration
                                    ? 'اختار وقت الجلسة'
                                    : isReadyToContinue
                                    ? 'تأكيد الحجز ←'
                                    : 'الموعد غير متاح'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
