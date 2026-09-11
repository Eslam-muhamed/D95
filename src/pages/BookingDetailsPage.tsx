import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    ShoppingBag,
    Coffee,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    X,
    Gamepad2,
    Timer,
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
import { BookingTimelineSchedule } from '@/components/booking/BookingTimelineSchedule';

interface Room {
    id: string;
    name: string;
    nameEn: string;
    titleAr: string;
    rate: number;
    specs: string;
    interiorImg: string;
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

const DURATION_OPTIONS = [
    { value: 1, label: '1 h' },
    { value: 2, label: '2 h' },
    { value: 3, label: '3 h' },
    { value: 4, label: '4 h' },
    { value: 5, label: '5 h' },
    { value: 6, label: '6 h' },
];

function formatDurationLabel(hours: number | null): string {
    if (hours === null) return 'اختر المدة';
    return `${hours} h`;
}

const ARABIC_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const ARABIC_DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const WEEK_DAY_NAMES = ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];

// Helper: Format Arabic time clearly (e.g. "06:00 مساءً" or "01:30 صباحاً")
function formatArabicTimeDetailed(date: Date): string {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const period = hour >= 12 && hour < 24 ? 'مساءً' : 'صباحاً';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${String(h12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

const HOUR_WHEEL_ITEMS = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: String(i + 1).padStart(2, '0'),
}));

const MINUTE_WHEEL_ITEMS = Array.from({ length: 60 }, (_, i) => ({
    value: i,
    label: String(i).padStart(2, '0'),
}));

const PERIOD_WHEEL_ITEMS: { value: 'PM' | 'AM'; label: string }[] = [
    { value: 'PM', label: 'مساءً' },
    { value: 'AM', label: 'صباحاً' },
];

function DrumWheelColumn<T extends string | number>({
    items,
    selectedValue,
    onSelect,
    title,
    itemHeight = 40,
    visibleRows = 5,
}: {
    items: { value: T; label: string }[];
    selectedValue: T;
    onSelect: (val: T) => void;
    title: string;
    itemHeight?: number;
    visibleRows?: number;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const isUserScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const centerIndex = Math.floor(visibleRows / 2);
    const paddingHeight = centerIndex * itemHeight;

    const selectedIndex = items.findIndex((item) => item.value === selectedValue);

    useEffect(() => {
        if (isUserScrollingRef.current) return;
        if (selectedIndex >= 0 && scrollRef.current) {
            const targetScroll = selectedIndex * itemHeight;
            if (Math.abs(scrollRef.current.scrollTop - targetScroll) > 2) {
                scrollRef.current.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth',
                });
            }
        }
    }, [selectedIndex, itemHeight]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        isUserScrollingRef.current = true;
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

        const currentScroll = e.currentTarget.scrollTop;
        const index = Math.round(currentScroll / itemHeight);

        // Debounce selection commit to prevent 60+ re-renders per second while scrolling
        scrollTimeoutRef.current = setTimeout(() => {
            isUserScrollingRef.current = false;
            if (index >= 0 && index < items.length) {
                const item = items[index];
                if (item && item.value !== selectedValue) {
                    onSelect(item.value);
                }
            }
        }, 90);
    };

    return (
        <div className="flex-1 flex flex-col items-center min-w-0">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1 select-none">{title}</span>
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="w-full relative overflow-y-auto scrollbar-none snap-y snap-mandatory select-none touch-pan-y"
                style={{
                    height: `${itemHeight * visibleRows}px`,
                }}
            >
                <div style={{ height: `${paddingHeight}px` }} />
                {items.map((item, idx) => {
                    const isSelected = item.value === selectedValue;
                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => {
                                onSelect(item.value);
                                scrollRef.current?.scrollTo({
                                    top: idx * itemHeight,
                                    behavior: 'smooth',
                                });
                            }}
                            style={{ height: `${itemHeight}px` }}
                            className={`w-full flex items-center justify-center snap-center cursor-pointer transition-all duration-150 font-mono text-center outline-none ${
                                isSelected
                                    ? 'text-neutral-900 dark:text-white text-xl font-black scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-sm font-medium'
                            }`}
                        >
                            {item.label}
                        </button>
                    );
                })}
                <div style={{ height: `${paddingHeight}px` }} />
            </div>
        </div>
    );
}

export default function BookingDetailsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { items: cartItems, booking: cartBooking, cafeTotal, setBooking, openCart, itemCount } = useCart();

    // Initial room fallback from navigation state
    const initialRoom = location.state?.room || { name: 'غرفة 01 (Play Room)' };
    const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
        if (initialRoom.id) {
            if (initialRoom.id === 'room-2' || initialRoom.id.includes('02') || initialRoom.id.includes('stars')) return 'room-2';
            return 'room-1';
        }
        if (initialRoom.name && (initialRoom.name.includes('02') || initialRoom.name.includes('النجوم') || initialRoom.name.includes('VIP'))) return 'room-2';
        return 'room-1';
    });

    const [isRoomMenuOpen, setIsRoomMenuOpen] = useState(false);
    const roomMenuRef = useRef<HTMLDivElement>(null);

    // Close room dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (roomMenuRef.current && !roomMenuRef.current.contains(e.target as Node)) {
                setIsRoomMenuOpen(false);
            }
        };
        if (isRoomMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isRoomMenuOpen]);

    const currentRoom = useMemo(() => {
        return AVAILABLE_ROOMS.find((r) => r.id === selectedRoomId) || AVAILABLE_ROOMS[0];
    }, [selectedRoomId]);

    // Calendar state & ref: compact date picker
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(() => new Date());
    const calendarMenuRef = useRef<HTMLDivElement>(null);

    // Close calendar popover on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (calendarMenuRef.current && !calendarMenuRef.current.contains(e.target as Node)) {
                setIsCalendarOpen(false);
            }
        };
        if (isCalendarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isCalendarOpen]);

    // Duration dropdown state & ref
    const [isDurationMenuOpen, setIsDurationMenuOpen] = useState(false);
    const durationMenuRef = useRef<HTMLDivElement>(null);

    // Close duration dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (durationMenuRef.current && !durationMenuRef.current.contains(e.target as Node)) {
                setIsDurationMenuOpen(false);
            }
        };
        if (isDurationMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDurationMenuOpen]);

    // Booked appointments dropdown state & ref
    const [isBookedMenuOpen, setIsBookedMenuOpen] = useState(false);
    const bookedMenuRef = useRef<HTMLDivElement>(null);

    // Close booked dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (bookedMenuRef.current && !bookedMenuRef.current.contains(e.target as Node)) {
                setIsBookedMenuOpen(false);
            }
        };
        if (isBookedMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isBookedMenuOpen]);

    const getTodayIso = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const [selectedDate, setSelectedDate] = useState(getTodayIso);

    // Quick select shortcuts (اليوم، غداً، بعد غد)
    const quickShortcuts = useMemo(() => {
        const shortcuts = [];
        const now = new Date();
        for (let i = 0; i < 3; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const label = i === 0 ? 'اليوم' : i === 1 ? 'غداً' : 'بعد غد';
            shortcuts.push({
                iso,
                label,
                dayNumber: d.getDate(),
                monthName: ARABIC_MONTHS[d.getMonth()],
            });
        }
        return shortcuts;
    }, []);

    // Formatted selected date for display
    const formattedDate = useMemo(() => {
        const [y, m, d] = selectedDate.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(y, m - 1, d);
        target.setHours(0, 0, 0, 0);

        const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const dayName = ARABIC_DAY_NAMES[date.getDay()];
        const monthName = ARABIC_MONTHS[m - 1];

        if (diffDays === 0) {
            return { tag: 'اليوم', full: `اليوم، ${d} ${monthName}`, dayName, d, monthName };
        }
        if (diffDays === 1) {
            return { tag: 'غداً', full: `غداً، ${d} ${monthName}`, dayName, d, monthName };
        }
        return { tag: dayName, full: `${dayName}، ${d} ${monthName}`, dayName, d, monthName };
    }, [selectedDate]);

    // Month grid generator for custom calendar popup
    const monthDaysGrid = useMemo(() => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
        // Week starts Saturday:
        const emptyCount = (firstDayOfWeek + 1) % 7;
        const totalDays = new Date(year, month + 1, 0).getDate();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const cells: Array<{
            iso: string;
            dayNumber: number;
            isPast: boolean;
            isToday: boolean;
        } | null> = [];

        for (let i = 0; i < emptyCount; i++) {
            cells.push(null);
        }

        for (let d = 1; d <= totalDays; d++) {
            const cellDate = new Date(year, month, d);
            cellDate.setHours(0, 0, 0, 0);
            const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            cells.push({
                iso,
                dayNumber: d,
                isPast: cellDate.getTime() < today.getTime(),
                isToday: cellDate.getTime() === today.getTime(),
            });
        }

        return cells;
    }, [calendarMonth]);

    const canGoPrevMonth = useMemo(() => {
        const today = new Date();
        return (
            calendarMonth.getFullYear() > today.getFullYear() ||
            (calendarMonth.getFullYear() === today.getFullYear() && calendarMonth.getMonth() > today.getMonth())
        );
    }, [calendarMonth]);

    const toggleCalendar = () => {
        const [y, m] = selectedDate.split('-').map(Number);
        setCalendarMonth(new Date(y, m - 1, 1));
        setIsCalendarOpen((prev) => !prev);
        setIsDurationMenuOpen(false);
        setIsBookedMenuOpen(false);
        playPs5NavigateSound();
    };

    // =========================================================================
    // TIME & DURATION STATE: Defaulting to 1h and 05:00 PM
    // =========================================================================
    const [durationHours, setDurationHours] = useState<number>(1);
    const [selectedHour, setSelectedHour] = useState<number>(5);
    const [selectedMinute, setSelectedMinute] = useState<number>(0);
    const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM');

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

    // Combine database occupied intervals with current cart booking (if in same room and date)
    const effectiveOccupiedIntervals = useMemo<BookingInterval[]>(() => {
        const intervals = [...occupiedIntervals];
        if (
            cartBooking &&
            cartBooking.roomId === currentRoom.id &&
            cartBooking.date === selectedDate
        ) {
            let start: Date | null = null;
            let end: Date | null = null;
            if (cartBooking.startDateTime && cartBooking.endDateTime) {
                start = new Date(cartBooking.startDateTime);
                end = new Date(cartBooking.endDateTime);
            } else if (cartBooking.startTime) {
                start = createDateTimeFromBusinessDate(cartBooking.date, cartBooking.startTime);
                end = calculateEndDateTime(start, cartBooking.durationHours || 1);
            }
            if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const alreadyExists = intervals.some(
                    inv => Math.abs(inv.start.getTime() - start!.getTime()) < 60000 &&
                           Math.abs(inv.end.getTime() - end!.getTime()) < 60000
                );
                if (!alreadyExists) {
                    intervals.push({ start, end, status: 'in_cart', id: 'cart-booking' });
                }
            }
        }
        return intervals;
    }, [occupiedIntervals, cartBooking, currentRoom.id, selectedDate]);

    // Sorted active booked intervals (blocking)
    const sortedBookings = useMemo(() => {
        return [...effectiveOccupiedIntervals].sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [effectiveOccupiedIntervals]);

    const activeDuration = durationHours || 1.0;


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
            effectiveOccupiedIntervals
        );

        return {
            ...result,
            startDateTime,
            endDateTime,
            formattedStart: formatArabicTimeDetailed(startDateTime),
            formattedEnd: formatArabicTimeDetailed(endDateTime),
        };
    }, [startDateTime, durationHours, selectedDate, effectiveOccupiedIntervals]);

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
                <div className="h-16 px-4 sm:px-6 flex items-center justify-between max-w-2xl mx-auto">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <Link
                            to="/playstation"
                            aria-label="الرجوع للغرف"
                            className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-white transition-all active:scale-95 border border-neutral-200/80 dark:border-white/10 shrink-0"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white leading-tight">
                                حجز موعد اللعب
                            </h1>
                            {/* Room Indicator & Quick Switcher */}
                            <div className="relative mt-0.5" ref={roomMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsRoomMenuOpen((prev) => !prev)}
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                                        selectedRoomId === 'room-1'
                                            ? 'bg-emerald-600/10 dark:bg-emerald-600/15 border-emerald-600/20 hover:border-emerald-600/40 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-red-600/10 dark:bg-red-600/15 border-red-600/20 hover:border-red-600/40 text-red-600 dark:text-red-400'
                                    }`}
                                    title="اضغط لتغيير الغرفة"
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${selectedRoomId === 'room-1' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    <span>{currentRoom.titleAr}</span>
                                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-normal">({currentRoom.rate} ج.م/س)</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isRoomMenuOpen ? 'rotate-180' : 'text-neutral-400'}`} />
                                </button>

                                {isRoomMenuOpen && (
                                    <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-[#140e10] border border-neutral-200 dark:border-white/10 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                                        <div className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 px-2 py-1">
                                            اختر الغرفة المراد حجزها:
                                        </div>
                                        {AVAILABLE_ROOMS.map((room) => {
                                            const isSelected = selectedRoomId === room.id;
                                            const isRoomOne = room.id === 'room-1';
                                            return (
                                                <button
                                                    key={room.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedRoomId(room.id);
                                                        setIsRoomMenuOpen(false);
                                                        playPs5NavigateSound();
                                                    }}
                                                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-right text-xs transition-colors cursor-pointer ${
                                                        isSelected
                                                            ? (isRoomOne ? 'bg-emerald-600 text-white font-bold' : 'bg-red-600 text-white font-bold')
                                                            : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.06]'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Gamepad2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : (isRoomOne ? 'text-emerald-500' : 'text-red-500')}`} />
                                                        <span>{room.titleAr}</span>
                                                    </div>
                                                    <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                                                        {room.rate} ج.م/س
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => openCart('playstation')}
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

                {/* ========================================================= */}
                {/* TIME & DURATION SELECTOR (EFFORTLESS ONE-TAP SLOTS)       */}
                {/* ========================================================= */}
                <div className="bg-white dark:bg-[#120e10] border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                    {/* Header with Title and Left-Corner Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2.5 border-b border-neutral-100 dark:border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-600 dark:text-red-500 shrink-0" />
                            <span className="font-bold text-sm text-neutral-900 dark:text-white">
                                وقت البدء ومدة الجلسة
                            </span>
                        </div>

                        {/* Controls Group: Mobile-First Prioritized (Order: 1. المدة, 2. اليوم, 3. المحجوز) */}
                        <div className="relative flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
                            {/* Mobile Overlay Backdrop for easy tap-outside */}
                            {(isDurationMenuOpen || isCalendarOpen || isBookedMenuOpen) && (
                                <div
                                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 sm:hidden"
                                    onClick={() => {
                                        setIsDurationMenuOpen(false);
                                        setIsCalendarOpen(false);
                                        setIsBookedMenuOpen(false);
                                    }}
                                />
                            )}

                            {/* 1. المدة: Duration Dropdown Button */}
                            <div className="relative flex-1 sm:flex-initial" ref={durationMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDurationMenuOpen(!isDurationMenuOpen);
                                        setIsCalendarOpen(false);
                                        setIsBookedMenuOpen(false);
                                        playPs5NavigateSound();
                                    }}
                                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer group shadow-2xs whitespace-nowrap ${
                                        hasSelectedDuration
                                            ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20'
                                            : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border-neutral-200/80 dark:border-white/10 text-neutral-800 dark:text-neutral-200'
                                    }`}
                                    title="اختر مدة الجلسة بالساعات"
                                >
                                    <Timer className="w-3.5 h-3.5 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform shrink-0" />
                                    <span className="text-red-600 dark:text-red-400 font-extrabold hidden sm:inline">المدة:</span>
                                    <span className="font-mono">{hasSelectedDuration ? formatDurationLabel(durationHours) : 'المدة'}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 shrink-0 ${isDurationMenuOpen ? 'rotate-180 text-red-600' : ''}`} />
                                </button>

                                {/* Duration Dropdown Popover */}
                                <AnimatePresence>
                                    {isDurationMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-full mt-2 w-48 p-1.5 bg-white dark:bg-[#181416] border border-neutral-200/90 dark:border-white/10 rounded-2xl shadow-2xl z-40 space-y-1"
                                        >
                                            <div className="px-2.5 py-1.5 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-white/[0.06] flex items-center justify-between">
                                                <span>اختر مدة الجلسة</span>
                                                <span className="font-mono">{currentRoom.rate} ج.م/س</span>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto space-y-0.5 pt-0.5">
                                                {DURATION_OPTIONS.map((opt) => {
                                                    const isSelected = durationHours === opt.value;
                                                    return (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            onClick={() => {
                                                                setDurationHours(opt.value);
                                                                setIsDurationMenuOpen(false);
                                                                playPs5SelectSound();
                                                            }}
                                                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                                isSelected
                                                                    ? 'bg-red-600 text-white shadow-xs'
                                                                    : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.06]'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : 'border border-neutral-300 dark:border-neutral-600'}`} />
                                                                <span className="font-mono font-bold text-xs">{opt.label}</span>
                                                            </div>
                                                            <span className={`font-mono text-[11px] font-bold shrink-0 ${isSelected ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'}`}>
                                                                {Math.round(opt.value * currentRoom.rate)} ج.م
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* 2. اليوم: Calendar Dropdown Button */}
                            <div className="relative flex-1 sm:flex-initial" ref={calendarMenuRef}>
                                <button
                                    type="button"
                                    onClick={toggleCalendar}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-neutral-200/80 dark:border-white/10 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-all active:scale-95 cursor-pointer group shadow-2xs whitespace-nowrap"
                                    title="اضغط لتغيير يوم الحجز"
                                >
                                    <Calendar className="w-3.5 h-3.5 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform shrink-0" />
                                    <span className="hidden sm:inline">{formattedDate.full}</span>
                                    <span className="sm:hidden">{formattedDate.tag}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 shrink-0 ${isCalendarOpen ? 'rotate-180 text-red-600' : ''}`} />
                                </button>

                                {/* Compact Calendar Popover */}
                                <AnimatePresence>
                                    {isCalendarOpen && (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none sm:pointer-events-auto sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 sm:p-0 sm:flex-initial sm:block">
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                transition={{ duration: 0.15 }}
                                                className="pointer-events-auto w-full max-w-[320px] sm:w-72 p-3.5 bg-white dark:bg-[#181416] border border-neutral-200/90 dark:border-white/10 rounded-2xl shadow-2xl space-y-2.5 text-right"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {/* Header with Title and Close button */}
                                                <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 dark:border-white/[0.06]">
                                                    <span className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
                                                        <span>اختر يوم الحجز</span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsCalendarOpen(false)}
                                                        className="w-6 h-6 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                                        aria-label="إغلاق"
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                </div>

                                                {/* Quick select shortcuts: اليوم، غداً، بعد غد */}
                                                <div className="flex items-center gap-1.5 justify-between">
                                                    {quickShortcuts.slice(0, 3).map((sc) => {
                                                        const isSelected = selectedDate === sc.iso;
                                                        return (
                                                            <button
                                                                key={sc.iso}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedDate(sc.iso);
                                                                    playPs5SelectSound();
                                                                    setIsCalendarOpen(false);
                                                                }}
                                                                className={`flex-1 py-1.5 px-1 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                                                                    isSelected
                                                                        ? 'bg-red-600 border-red-600 text-white shadow-xs'
                                                                        : 'bg-neutral-50 dark:bg-white/[0.04] border-neutral-200/70 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.08]'
                                                                }`}
                                                            >
                                                                {sc.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Month header & navigation */}
                                                <div className="flex items-center justify-between px-1 text-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (canGoPrevMonth) {
                                                                setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                                                                playPs5NavigateSound();
                                                            }
                                                        }}
                                                        disabled={!canGoPrevMonth}
                                                        className="p-1 rounded-lg border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                        title="الشهر السابق"
                                                    >
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </button>

                                                    <span className="font-bold text-neutral-900 dark:text-white">
                                                        {ARABIC_MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                                                            playPs5NavigateSound();
                                                        }}
                                                        className="p-1 rounded-lg border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                                                        title="الشهر القادم"
                                                    >
                                                        <ChevronLeft className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Days of week header */}
                                                <div className="grid grid-cols-7 gap-1 text-center">
                                                    {['سبت', 'أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع'].map((name, idx) => (
                                                        <div key={idx} className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 py-0.5">
                                                            {name}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Calendar Grid of Day Cells */}
                                                <div className="grid grid-cols-7 gap-1">
                                                    {monthDaysGrid.map((cell, idx) => {
                                                        if (!cell) {
                                                            return <div key={`empty-${idx}`} className="h-7" />;
                                                        }
                                                        const isSelected = selectedDate === cell.iso;
                                                        return (
                                                            <button
                                                                key={cell.iso}
                                                                type="button"
                                                                disabled={cell.isPast}
                                                                onClick={() => {
                                                                    setSelectedDate(cell.iso);
                                                                    playPs5SelectSound();
                                                                    setIsCalendarOpen(false);
                                                                }}
                                                                className={`h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                                                    cell.isPast
                                                                        ? 'text-neutral-300 dark:text-neutral-600 opacity-40 cursor-not-allowed'
                                                                        : isSelected
                                                                        ? 'bg-red-600 text-white shadow-xs scale-105 z-10'
                                                                        : cell.isToday
                                                                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20 cursor-pointer'
                                                                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.08] cursor-pointer'
                                                                }`}
                                                            >
                                                                <span>{cell.dayNumber}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* 3. المحجوز: Booked Appointments Dropdown */}
                            <div className="relative flex-1 sm:flex-initial" ref={bookedMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsBookedMenuOpen((prev) => !prev);
                                        setIsDurationMenuOpen(false);
                                        setIsCalendarOpen(false);
                                        playPs5NavigateSound();
                                    }}
                                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer group shadow-2xs whitespace-nowrap ${
                                        sortedBookings.length > 0
                                            ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20'
                                            : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-300'
                                    }`}
                                    title="المواعيد المحجوزة اليوم"
                                >
                                    <Lock className={`w-3.5 h-3.5 shrink-0 ${sortedBookings.length > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
                                    <span className="hidden sm:inline">المحجوز:</span>
                                    <span className={`font-mono text-[11px] px-1 rounded ${
                                        sortedBookings.length > 0 ? 'bg-red-500/20 text-red-600 dark:text-red-300 font-bold' : 'text-neutral-500'
                                    }`}>
                                        {sortedBookings.length}
                                    </span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 shrink-0 ${isBookedMenuOpen ? 'rotate-180 text-red-600' : ''}`} />
                                </button>

                                {/* Dropdown Popover */}
                                <AnimatePresence>
                                    {isBookedMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute left-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] p-2.5 bg-white dark:bg-[#181416] border border-neutral-200/90 dark:border-white/10 rounded-2xl shadow-2xl z-40 space-y-2"
                                        >
                                            <div className="flex items-center justify-between px-1 pb-1.5 border-b border-neutral-100 dark:border-white/[0.06]">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                                                    <Lock className="w-3.5 h-3.5 text-red-500" />
                                                    <span>المواعيد المحجوزة اليوم ({currentRoom.nameEn})</span>
                                                </div>
                                                <span className="text-[10px] text-neutral-400 font-medium">غير متاحة</span>
                                            </div>

                                            {sortedBookings.length > 0 ? (
                                                <div className="max-h-56 overflow-y-auto space-y-1.5 py-0.5">
                                                    {sortedBookings.map((b, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-red-200/60 dark:border-red-900/30 text-xs font-mono"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Lock className="w-3 h-3 text-red-500 shrink-0" />
                                                                <span className="font-semibold text-neutral-900 dark:text-white">
                                                                    {formatArabicTimeDetailed(b.start)}
                                                                </span>
                                                            </div>
                                                            <span className="text-neutral-400 text-[10px]">إلى</span>
                                                            <span className="font-semibold text-neutral-900 dark:text-white">
                                                                {formatArabicTimeDetailed(b.end)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs">
                                                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    <span>الغرفة متاحة بالكامل اليوم! لا توجد أي حجوزات مسبقة.</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Time Counter (Start Time) & Calculated End Time (Side by Side) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-stretch pt-1">
                        {/* 1. عداد وقت البدء */}
                        <div className="relative bg-neutral-50 dark:bg-neutral-950/80 rounded-2xl p-3 border border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden shadow-inner flex flex-col justify-center">
                            <div className="flex items-center justify-between text-xs px-1 mb-1 text-neutral-500 dark:text-neutral-400">
                                <span className="font-bold flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                                    <Clock className={`w-3.5 h-3.5 transition-colors duration-300 ${
                                        currentAvailability.isAvailable ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-600 dark:text-red-500'
                                    }`} />
                                    <span>وقت بدء الحجز</span>
                                </span>
                                <span className="text-[10px] text-neutral-400">اسحب للأعلى أو الأسفل</span>
                            </div>

                            <div className="relative overflow-hidden rounded-xl bg-white dark:bg-black/40 border border-neutral-200/60 dark:border-white/[0.06] p-1">
                                {/* Center Highlight Lens (Across all 3 drums) */}
                                <div
                                    className={`pointer-events-none absolute inset-x-1 rounded-lg border-y transition-all duration-300 z-0 ${
                                        currentAvailability.isAvailable
                                            ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-500/5 via-emerald-500/15 to-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                            : 'border-red-500/40 bg-gradient-to-r from-red-500/5 via-red-500/15 to-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                                    }`}
                                    style={{
                                        top: 'calc(1.25rem + 80px)',
                                        height: '40px',
                                    }}
                                />

                                {/* Top and Bottom gradient masks */}
                                <div className="pointer-events-none absolute inset-x-0 top-5 h-16 bg-gradient-to-b from-white dark:from-[#0d0a0b] via-white/80 dark:via-[#0d0a0b]/80 to-transparent z-10" />
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white dark:from-[#0d0a0b] via-white/80 dark:via-[#0d0a0b]/80 to-transparent z-10" />

                                {/* 3 Drums */}
                                <div className="flex items-center justify-around gap-1 relative z-20">
                                    <DrumWheelColumn
                                        title="الساعة"
                                        items={HOUR_WHEEL_ITEMS}
                                        selectedValue={selectedHour}
                                        onSelect={(h) => {
                                            setSelectedHour(h);
                                            playPs5NavigateSound();
                                        }}
                                    />

                                    <div className="text-neutral-400 dark:text-neutral-600 font-bold text-xl pt-4">:</div>

                                    <DrumWheelColumn
                                        title="الدقيقة"
                                        items={MINUTE_WHEEL_ITEMS}
                                        selectedValue={selectedMinute}
                                        onSelect={(m) => {
                                            setSelectedMinute(m);
                                            playPs5NavigateSound();
                                        }}
                                    />

                                    <DrumWheelColumn
                                        title="الفترة"
                                        items={PERIOD_WHEEL_ITEMS}
                                        selectedValue={selectedPeriod}
                                        onSelect={(p) => {
                                            setSelectedPeriod(p);
                                            playPs5NavigateSound();
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. وقت نهاية الحجز */}
                        <div className={`relative rounded-2xl p-4 sm:p-5 border shadow-inner flex flex-col items-center justify-center text-center transition-all duration-300 ${
                            currentAvailability.isAvailable
                                ? 'bg-emerald-500/[0.04] dark:bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.12)]'
                                : 'bg-red-500/[0.04] dark:bg-red-950/20 border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.12)]'
                        }`}>
                            <div className={`flex items-center gap-1.5 text-xs font-bold mb-2 transition-colors duration-300 ${
                                currentAvailability.isAvailable
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-red-600 dark:text-red-400'
                            }`}>
                                <Timer className={`w-3.5 h-3.5 transition-colors duration-300 ${
                                    currentAvailability.isAvailable
                                        ? 'text-emerald-500 dark:text-emerald-400'
                                        : 'text-red-500 dark:text-red-400'
                                }`} />
                                <span>وقت نهاية الحجز</span>
                            </div>

                            {/* Big End Time Display */}
                            <div className="my-2">
                                <div className={`font-mono font-black text-3xl sm:text-4xl tracking-tight transition-all duration-300 ${
                                    currentAvailability.isAvailable
                                        ? 'text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                                        : 'text-red-600 dark:text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.35)]'
                                }`}>
                                    {currentAvailability.formattedEnd}
                                </div>
                                <div className={`text-[11px] font-medium mt-1 transition-colors duration-300 ${
                                    currentAvailability.isAvailable
                                        ? 'text-emerald-600/80 dark:text-emerald-400/80'
                                        : 'text-red-600/80 dark:text-red-400/80'
                                }`}>
                                    من {currentAvailability.formattedStart} إلى {currentAvailability.formattedEnd}
                                </div>
                            </div>

                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                مدة الجلسة: <strong className="text-neutral-900 dark:text-neutral-100 font-bold font-mono">{durationHours} {durationHours === 1 ? 'ساعة' : 'ساعات'}</strong>
                            </p>

                            {/* Availability Status Badge */}
                            <div className="mt-3">
                                {currentAvailability.isAvailable ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30 shadow-xs">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span>الموعد متاح للحجز</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold border border-red-500/30 shadow-xs">
                                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                        <span>
                                            {currentAvailability.reason === 'PAST_TIME'
                                                ? 'هذا الوقت قد مضى'
                                                : currentAvailability.reason === 'EXCEEDS_CLOSING'
                                                ? 'يتجاوز موعد الإغلاق (04:00 ص)'
                                                : currentAvailability.conflictingInterval
                                                ? `يتعارض مع حجز آخر (${formatArabicTimeDetailed(currentAvailability.conflictingInterval.start)})`
                                                : 'غير متاح'}
                                        </span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* COLLAPSIBLE BOOKING TIMELINE SCHEDULE (مخطط المواعيد)      */}
                {/* ========================================================= */}
                <BookingTimelineSchedule
                    selectedDate={selectedDate}
                    currentRoom={currentRoom}
                    availableRooms={AVAILABLE_ROOMS}
                    onSelectRoom={(roomId) => {
                        setSelectedRoomId(roomId);
                        playPs5NavigateSound();
                    }}
                    occupiedIntervals={effectiveOccupiedIntervals}
                    userStartDateTime={startDateTime}
                    userEndDateTime={currentAvailability.endDateTime}
                    onSelectTimeSlot={(hour12, minute, period) => {
                        setSelectedHour(hour12);
                        setSelectedMinute(minute);
                        setSelectedPeriod(period);
                        toast.success(`تم اختيار وقت البدء: ${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period === 'PM' ? 'م' : 'ص'} 🎮`);
                    }}
                />

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
                            onClick={() => openCart('cafe')}
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
                            className={`py-3 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border ${
                                isReadyToContinue
                                    ? 'bg-red-600 hover:bg-red-500 border-red-500 text-white shadow-md shadow-red-600/25 active:scale-95'
                                    : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.08] dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-white/10'
                            }`}
                        >
                            <span>
                                {!hasSelectedTime || !hasSelectedDuration
                                    ? 'حدد الوقت والمدة للمتابعة'
                                    : isReadyToContinue
                                    ? 'تأكيد ومتابعة الحجز'
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
