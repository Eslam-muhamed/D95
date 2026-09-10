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
    Smartphone,
    ShoppingBag,
    Coffee,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    Timer,
    AlarmClock,
    X,
    Gamepad2,
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
    generateStartTimeOptions,
    TimeOption,
    OPERATING_HOURS,
    formatArabicTime,
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

const DURATION_OPTIONS = [
    { value: 1, label: '1 ساعة', shortLabel: 'ساعة' },
    { value: 1.5, label: '1.5 ساعة', shortLabel: '1.5 س' },
    { value: 2, label: 'ساعتان (2 ساعة)', shortLabel: 'ساعتان' },
    { value: 2.5, label: '2.5 ساعة', shortLabel: '2.5 س' },
    { value: 3, label: '3 ساعات', shortLabel: '3 ساعات' },
    { value: 3.5, label: '3.5 ساعات', shortLabel: '3.5 س' },
    { value: 4, label: '4 ساعات', shortLabel: '4 ساعات' },
    { value: 5, label: '5 ساعات', shortLabel: '5 ساعات' },
];

function getDurationLabel(hours: number | null): string {
    if (!hours) return 'حدد المدة';
    if (hours === 1) return 'ساعة واحدة';
    if (hours === 2) return 'ساعتان';
    if (hours % 1 === 0) return `${hours} ساعات`;
    return `${hours} ساعة`;
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

    const [isDurationMenuOpen, setIsDurationMenuOpen] = useState(false);
    const durationMenuRef = useRef<HTMLDivElement>(null);

    // Close room & duration dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (roomMenuRef.current && !roomMenuRef.current.contains(e.target as Node)) {
                setIsRoomMenuOpen(false);
            }
            if (durationMenuRef.current && !durationMenuRef.current.contains(e.target as Node)) {
                setIsDurationMenuOpen(false);
            }
        };
        if (isRoomMenuOpen || isDurationMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isRoomMenuOpen, isDurationMenuOpen]);

    const currentRoom = useMemo(() => {
        return AVAILABLE_ROOMS.find((r) => r.id === selectedRoomId) || AVAILABLE_ROOMS[0];
    }, [selectedRoomId]);

    // Calendar state: compact expandable date picker
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(() => new Date());

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
        playPs5NavigateSound();
    };

    // =========================================================================
    // MOBILE-FIRST STATE: Free, non-forced initial selection
    // =========================================================================
    const [durationHours, setDurationHours] = useState<number | null>(2);
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

    // Filter all 15-minute start times across the 20h operating window
    const allAvailableSlots = useMemo<TimeOption[]>(() => {
        const rawOptions = generateStartTimeOptions(selectedDate);
        const now = new Date();
        return rawOptions.filter((opt) => {
            const check = checkAvailability(
                opt.startDateTime,
                activeDuration,
                selectedDate,
                effectiveOccupiedIntervals,
                now
            );
            return check.isAvailable;
        });
    }, [selectedDate, activeDuration, effectiveOccupiedIntervals]);

    // Quick shortcut: earliest available slot for the selected business date
    const nextAvailableSlot = useMemo(() => {
        if (allAvailableSlots.length === 0) return null;
        return allAvailableSlots[0];
    }, [allAvailableSlots]);

    // Popular quick chips for fast 1-click selection
    const quickPresetSlots = useMemo(() => {
        const evening = allAvailableSlots.filter(s => s.hour24 >= 17 || s.hour24 < 3);
        const pool = evening.length > 0 ? evening : allAvailableSlots;
        return pool.slice(0, 6);
    }, [allAvailableSlots]);

    // Handle picking a slot
    const handleSelectSlot = (slot: TimeOption) => {
        const h12 = slot.hour24 % 12 === 0 ? 12 : slot.hour24 % 12;
        const period: 'AM' | 'PM' = slot.hour24 >= 12 && slot.hour24 < 24 ? 'PM' : 'AM';
        setSelectedHour(h12);
        setSelectedMinute(slot.minute);
        setSelectedPeriod(period);
        if (durationHours === null) {
            setDurationHours(2);
        }
        playPs5SelectSound();
    };

    const isSlotSelected = (slot: TimeOption) => {
        if (selectedHour === null || selectedMinute === null || selectedPeriod === null) return false;
        const h12 = slot.hour24 % 12 === 0 ? 12 : slot.hour24 % 12;
        const period: 'AM' | 'PM' = slot.hour24 >= 12 && slot.hour24 < 24 ? 'PM' : 'AM';
        return selectedHour === h12 && selectedMinute === slot.minute && selectedPeriod === period;
    };

    // Alarm Clock Steppers & Period Switchers
    const handleStepHour = (direction: 'up' | 'down') => {
        playPs5NavigateSound();
        if (selectedHour === null) {
            if (nextAvailableSlot) {
                handleSelectSlot(nextAvailableSlot);
                return;
            }
            setSelectedHour(6);
            setSelectedMinute(0);
            setSelectedPeriod('PM');
            if (durationHours === null) setDurationHours(2);
            return;
        }
        if (direction === 'up') {
            const nextH = (selectedHour % 12) + 1;
            setSelectedHour(nextH);
        } else {
            const prevH = selectedHour === 1 ? 12 : selectedHour - 1;
            setSelectedHour(prevH);
        }
    };

    const handleStepMinute = (direction: 'up' | 'down') => {
        playPs5NavigateSound();
        if (selectedMinute === null || selectedHour === null) {
            if (nextAvailableSlot) {
                handleSelectSlot(nextAvailableSlot);
                return;
            }
            setSelectedHour(6);
            setSelectedMinute(0);
            setSelectedPeriod('PM');
            if (durationHours === null) setDurationHours(2);
            return;
        }
        const step = 15;
        if (direction === 'up') {
            setSelectedMinute((selectedMinute + step) % 60);
        } else {
            setSelectedMinute((selectedMinute - step + 60) % 60);
        }
    };

    const handleTogglePeriod = (period: 'AM' | 'PM') => {
        playPs5NavigateSound();
        if (selectedHour === null) {
            setSelectedHour(6);
            setSelectedMinute(0);
            if (durationHours === null) setDurationHours(2);
        }
        setSelectedPeriod(period);
    };

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

    const endFormatted = useMemo(() => {
        if (!currentAvailability.endDateTime) return null;
        const end = currentAvailability.endDateTime;
        let h = end.getHours();
        const m = end.getMinutes();
        const period = h >= 12 && h < 24 ? 'مساءً' : 'صباحاً';
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return {
            h12: String(h12).padStart(2, '0'),
            m: String(m).padStart(2, '0'),
            period,
        };
    }, [currentAvailability.endDateTime]);

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
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600/10 dark:bg-red-600/15 border border-red-600/20 hover:border-red-600/40 text-red-600 dark:text-red-400 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                    title="اضغط لتغيير الغرفة"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <span>{currentRoom.titleAr}</span>
                                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-normal">({currentRoom.rate} ج.م/س)</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isRoomMenuOpen ? 'rotate-180 text-red-600' : 'text-neutral-400'}`} />
                                </button>

                                {isRoomMenuOpen && (
                                    <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-[#140e10] border border-neutral-200 dark:border-white/10 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                                        <div className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 px-2 py-1">
                                            اختر الغرفة المراد حجزها:
                                        </div>
                                        {AVAILABLE_ROOMS.map((room) => {
                                            const isSelected = selectedRoomId === room.id;
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
                                                            ? 'bg-red-600 text-white font-bold'
                                                            : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.06]'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
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
                {/* 1. BOOKED APPOINTMENTS SUMMARY (CLEAN & MINIMAL)           */}
                {/* ========================================================= */}
                <div className="bg-white dark:bg-[#120e10] border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
                    {/* Header & Status Summary */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                <Lock className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white leading-tight">
                                    المواعيد المحجوزة اليوم ({currentRoom.nameEn})
                                </h2>
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                    {sortedBookings.length > 0 ? 'غير متاحة للاختيار منعاً للتعارض' : 'جميع المواعيد متاحة للحجز'}
                                </p>
                            </div>
                        </div>

                        {sortedBookings.length > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                <span>{sortedBookings.length} {sortedBookings.length === 1 ? 'موعد محجوز' : sortedBookings.length === 2 ? 'موعدان محجوزان' : 'مواعيد محجوزة'}</span>
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                متاحة بالكامل
                            </span>
                        )}
                    </div>

                    {/* Booked Slots Display */}
                    {sortedBookings.length > 0 ? (
                        <div className="flex flex-wrap gap-2 pt-0.5">
                            {sortedBookings.map((b, idx) => (
                                <div
                                    key={idx}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-red-200/70 dark:border-red-900/40 text-neutral-800 dark:text-neutral-200 text-xs font-mono shadow-2xs"
                                >
                                    <Lock className="w-3 h-3 text-red-500 shrink-0" />
                                    <span className="font-semibold text-neutral-900 dark:text-white">
                                        {formatArabicTimeDetailed(b.start)}
                                    </span>
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
                </div>

                {/* ========================================================= */}
                {/* 2. TIME & DURATION SELECTOR (EFFORTLESS ONE-TAP SLOTS)    */}
                {/* ========================================================= */}
                <div className="bg-white dark:bg-[#120e10] border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                    {/* Header with Integrated Day and Duration Dropdowns */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-neutral-100 dark:border-white/[0.06]">
                        <div className="flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto flex-wrap">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-red-600 dark:text-red-500" />
                                <span className="font-bold text-sm text-neutral-900 dark:text-white">
                                    وقت البدء ومدة الجلسة
                                </span>
                            </div>

                            {/* Dropdown Controls: Day and Duration */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Small Day Selector Button */}
                                <button
                                    type="button"
                                    onClick={toggleCalendar}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-neutral-200/80 dark:border-white/10 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-all active:scale-95 cursor-pointer group shadow-2xs"
                                    title="اضغط لتغيير يوم الحجز"
                                >
                                    <Calendar className="w-3.5 h-3.5 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform shrink-0" />
                                    <span className="text-red-600 dark:text-red-400 font-extrabold">{formattedDate.tag}:</span>
                                    <span>{formattedDate.full}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isCalendarOpen ? 'rotate-180 text-red-600' : ''}`} />
                                </button>

                                {/* Small Duration Dropdown Button */}
                                <div className="relative" ref={durationMenuRef}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsDurationMenuOpen((prev) => !prev);
                                            playPs5NavigateSound();
                                        }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-neutral-200/80 dark:border-white/10 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-all active:scale-95 cursor-pointer group shadow-2xs"
                                        title="اضغط لتغيير مدة الجلسة"
                                    >
                                        <Timer className="w-3.5 h-3.5 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform shrink-0" />
                                        <span className="text-red-600 dark:text-red-400 font-extrabold">المدة:</span>
                                        <span>{getDurationLabel(durationHours)}</span>
                                        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isDurationMenuOpen ? 'rotate-180 text-red-600' : ''}`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isDurationMenuOpen && (
                                        <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-44 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                                            <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-neutral-800/60 mb-1">
                                                اختر مدة اللعب
                                            </div>
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
                                                        className={`w-full text-right px-3 py-1.5 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                                                                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/[0.05]'
                                                        }`}
                                                    >
                                                        <span>{opt.label}</span>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Selected Time Status Pill */}
                        {hasSelectedTime && hasSelectedDuration ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs self-start sm:self-auto">
                                <span>الموعد: {currentAvailability.formattedStart} - {currentAvailability.formattedEnd}</span>
                            </span>
                        ) : (
                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                                صالة الألعاب متاحة 20 ساعة يومياً (08:00 ص - 04:00 ص)
                            </span>
                        )}
                    </div>

                    {/* Expandable Calendar Drawer */}
                    <AnimatePresence>
                        {isCalendarOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                className="overflow-hidden p-3 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/10 space-y-3"
                            >
                                {/* Quick select shortcuts: اليوم، غداً، بعد غد */}
                                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-0.5">
                                    <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 shrink-0">
                                        اختيار سريع:
                                    </span>
                                    {quickShortcuts.map((sc) => {
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
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                                                    isSelected
                                                        ? 'bg-red-600 border-red-600 text-white shadow-xs'
                                                        : 'bg-white dark:bg-white/[0.05] border-neutral-200/60 dark:border-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.09]'
                                                }`}
                                            >
                                                {sc.label} ({sc.dayNumber} {sc.monthName})
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Month header & navigation */}
                                <div className="flex items-center justify-between px-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (canGoPrevMonth) {
                                                setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                                                playPs5NavigateSound();
                                            }
                                        }}
                                        disabled={!canGoPrevMonth}
                                        className="p-1.5 rounded-lg border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                        title="الشهر السابق"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>

                                    <div className="font-bold text-sm text-neutral-900 dark:text-white">
                                        {ARABIC_MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                                            playPs5NavigateSound();
                                        }}
                                        className="p-1.5 rounded-lg border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                                        title="الشهر القادم"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Days of week header */}
                                <div className="grid grid-cols-7 gap-1 text-center">
                                    {WEEK_DAY_NAMES.map((name, idx) => (
                                        <div key={idx} className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 py-1">
                                            {name}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Grid of Day Cells */}
                                <div className="grid grid-cols-7 gap-1">
                                    {monthDaysGrid.map((cell, idx) => {
                                        if (!cell) {
                                            return <div key={`empty-${idx}`} className="h-9" />;
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
                                                className={`h-9 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all relative ${
                                                    cell.isPast
                                                        ? 'text-neutral-300 dark:text-neutral-600 opacity-40 cursor-not-allowed'
                                                        : isSelected
                                                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30 scale-105 z-10'
                                                        : cell.isToday
                                                        ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20 cursor-pointer'
                                                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.08] cursor-pointer'
                                                }`}
                                            >
                                                <span>{cell.dayNumber}</span>
                                                {cell.isToday && !isSelected && (
                                                    <span className="w-1 h-1 rounded-full bg-red-500 -mt-0.5" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Close button */}
                                <div className="flex justify-end pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setIsCalendarOpen(false)}
                                        className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white font-medium px-2 py-1 cursor-pointer"
                                    >
                                        إغلاق التقويم ✕
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ALARM CLOCK FROM & TO (ساعة من وإلى زي بتاعت المنبه) */}
                    <div className="relative rounded-3xl bg-neutral-950 dark:bg-black/90 border border-neutral-800/90 p-4 sm:p-5 shadow-2xl overflow-hidden space-y-4 text-white">
                        {/* Soft ambient background glows */}
                        <div className="absolute -top-16 -right-16 w-36 h-36 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

                        {/* Top bar inside the Clock Widget */}
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center">
                                    <AlarmClock size={16} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                                        <span>منبه حجز الجلسة</span>
                                        <span className="text-[10px] font-normal text-neutral-400 font-mono">(ساعة من وإلى)</span>
                                    </h4>
                                    <p className="text-[11px] text-neutral-400">حدد وقت البدء وسيتم احتساب انتهاء الجلسة تلقائياً</p>
                                </div>
                            </div>

                            {/* Device time picker shortcut */}
                            <label className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs font-medium cursor-pointer transition-all shadow-inner">
                                <Smartphone size={13} className="text-red-400 shrink-0" />
                                <span>ساعة الهاتف</span>
                                <input
                                    type="time"
                                    value={time24 || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (!val) return;
                                        const parts = val.split(':');
                                        if (parts.length >= 2) {
                                            let h = parseInt(parts[0], 10);
                                            const m = parseInt(parts[1], 10);
                                            if (!isNaN(h) && !isNaN(m)) {
                                                const p: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
                                                if (h === 0) h = 12;
                                                else if (h > 12) h -= 12;
                                                setSelectedHour(h);
                                                setSelectedMinute(m);
                                                setSelectedPeriod(p);
                                                if (durationHours === null) setDurationHours(2);
                                            }
                                        }
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                            </label>
                        </div>

                        {/* Clock Dials: [من (وقت البدء)] <--- [المدة] ---> [إلى (وقت الانتهاء)] */}
                        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-3 sm:gap-4 py-1">
                            {/* FROM: START TIME */}
                            <div className="flex flex-col items-center p-3.5 sm:p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-inner space-y-2.5">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300">
                                    <Clock size={14} className="text-red-400" />
                                    <span>مِن (وقت البدء)</span>
                                </div>

                                {/* Digital Alarm Face */}
                                <div className="flex items-center gap-2">
                                    {/* Hour Dial */}
                                    <div className="flex flex-col items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleStepHour('up')}
                                            className="w-10 sm:w-12 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                                            title="زيادة ساعة"
                                        >
                                            <ChevronUp size={16} />
                                        </button>
                                        <div className="w-14 sm:w-16 h-12 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center font-mono text-2xl sm:text-3xl font-black text-red-400 shadow-inner select-none" dir="ltr">
                                            {selectedHour !== null ? String(selectedHour).padStart(2, '0') : '--'}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleStepHour('down')}
                                            className="w-10 sm:w-12 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                                            title="تقليل ساعة"
                                        >
                                            <ChevronDown size={16} />
                                        </button>
                                    </div>

                                    {/* Colon */}
                                    <span className="text-neutral-500 font-mono text-2xl sm:text-3xl font-bold animate-pulse -mt-4">:</span>

                                    {/* Minute Dial */}
                                    <div className="flex flex-col items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleStepMinute('up')}
                                            className="w-10 sm:w-12 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                                            title="زيادة 15 دقيقة"
                                        >
                                            <ChevronUp size={16} />
                                        </button>
                                        <div className="w-14 sm:w-16 h-12 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center font-mono text-2xl sm:text-3xl font-black text-red-400 shadow-inner select-none" dir="ltr">
                                            {selectedMinute !== null ? String(selectedMinute).padStart(2, '0') : '--'}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleStepMinute('down')}
                                            className="w-10 sm:w-12 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                                            title="تقليل 15 دقيقة"
                                        >
                                            <ChevronDown size={16} />
                                        </button>
                                    </div>

                                    {/* Period Pills (AM / PM) */}
                                    <div className="flex flex-col gap-1.5 -mt-4">
                                        <button
                                            type="button"
                                            onClick={() => handleTogglePeriod('PM')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                selectedPeriod === 'PM'
                                                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30 scale-105'
                                                    : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-400 border border-neutral-800'
                                            }`}
                                        >
                                            مساءً
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTogglePeriod('AM')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                selectedPeriod === 'AM'
                                                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30 scale-105'
                                                    : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-400 border border-neutral-800'
                                            }`}
                                        >
                                            صباحاً
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* CONNECTOR & DURATION PILL */}
                            <div className="flex md:flex-col items-center justify-center gap-2 py-1">
                                <button
                                    type="button"
                                    onClick={() => setIsDurationMenuOpen((prev) => !prev)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                                    title="اضغط لتغيير المدة"
                                >
                                    <Timer size={13} className="text-red-400" />
                                    <span>المدة: {getDurationLabel(durationHours)}</span>
                                    <ChevronDown size={12} className={`transition-transform duration-200 ${isDurationMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <div className="hidden md:flex items-center justify-center text-red-500/60">
                                    <ArrowLeft size={18} className="animate-pulse" />
                                </div>
                            </div>

                            {/* TO: END TIME */}
                            <div className="flex flex-col items-center p-3.5 sm:p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-inner space-y-2.5">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300">
                                    <CheckCircle2 size={14} className="text-emerald-400" />
                                    <span>إلى (وقت الانتهاء)</span>
                                </div>

                                {endFormatted ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-14 sm:w-16 h-12 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center font-mono text-2xl sm:text-3xl font-black text-emerald-400 shadow-inner select-none" dir="ltr">
                                            {endFormatted.h12}
                                        </div>
                                        <span className="text-neutral-500 font-mono text-2xl sm:text-3xl font-bold animate-pulse -mt-4">:</span>
                                        <div className="w-14 sm:w-16 h-12 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center font-mono text-2xl sm:text-3xl font-black text-emerald-400 shadow-inner select-none" dir="ltr">
                                            {endFormatted.m}
                                        </div>
                                        <span className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-emerald-300 text-xs font-bold -mt-4">
                                            {endFormatted.period}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="w-14 sm:w-16 h-12 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center font-mono text-2xl sm:text-3xl font-black text-neutral-600 shadow-inner select-none" dir="ltr">
                                            --
                                        </div>
                                        <span className="text-neutral-700 font-mono text-2xl sm:text-3xl font-bold -mt-4">:</span>
                                        <div className="w-14 sm:w-16 h-12 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center font-mono text-2xl sm:text-3xl font-black text-neutral-600 shadow-inner select-none" dir="ltr">
                                            --
                                        </div>
                                        <span className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-600 text-xs font-bold -mt-4">
                                            --
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Suggested Slots Bar */}
                        <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                            <span className="text-[11px] font-bold text-neutral-400 shrink-0">أوقات مقترحة:</span>
                            {nextAvailableSlot && (
                                <button
                                    type="button"
                                    onClick={() => handleSelectSlot(nextAvailableSlot)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                                >
                                    <Sparkles size={12} />
                                    <span>أقرب موعد ({nextAvailableSlot.displayTime})</span>
                                </button>
                            )}
                            {quickPresetSlots.map((slot) => {
                                const isSelected = isSlotSelected(slot);
                                return (
                                    <button
                                        key={slot.time24}
                                        type="button"
                                        onClick={() => handleSelectSlot(slot)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                                            isSelected
                                                ? 'bg-red-600 text-white border-red-500 shadow-xs scale-105'
                                                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                                        }`}
                                    >
                                        {slot.displayTime}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Live Availability Feedback Banner */}
                        {hasSelectedTime && hasSelectedDuration ? (
                            <div
                                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                                    currentAvailability.isAvailable
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    {currentAvailability.isAvailable ? (
                                        <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={16} />
                                        </div>
                                    ) : (
                                        <div className="w-7 h-7 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                                            <AlertCircle size={16} />
                                        </div>
                                    )}
                                    <div className="text-right">
                                        <div className="font-bold text-xs sm:text-sm">
                                            {currentAvailability.isAvailable
                                                ? `الموعد متاح للحجز مؤكداً`
                                                : currentAvailability.reason === 'PAST_TIME'
                                                ? 'هذا الوقت قد مضى بالفعل اليوم'
                                                : currentAvailability.reason === 'EXCEEDS_CLOSING'
                                                ? 'يتجاوز موعد إغلاق الصالة (04:00 ص فجراً)'
                                                : currentAvailability.conflictingInterval
                                                ? `يتعارض مع حجز قائم (${formatArabicTimeDetailed(currentAvailability.conflictingInterval.start)} إلى ${formatArabicTimeDetailed(currentAvailability.conflictingInterval.end)})`
                                                : 'هذا الوقت غير متاح'}
                                        </div>
                                        <div className="text-[11px] opacity-80 mt-0.5">
                                            {currentAvailability.isAvailable
                                                ? `من ${currentAvailability.formattedStart} حتى ${currentAvailability.formattedEnd} (${getDurationLabel(durationHours)})`
                                                : 'يرجى تغيير وقت البدء بالأسهم أعلاه أو اختيار موعد متاح'}
                                        </div>
                                    </div>
                                </div>

                                {currentAvailability.isAvailable ? (
                                    <span className="text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg shrink-0">
                                        {roomSubtotal} ج.م
                                    </span>
                                ) : nextAvailableSlot ? (
                                    <button
                                        type="button"
                                        onClick={() => handleSelectSlot(nextAvailableSlot)}
                                        className="text-[11px] font-bold text-red-400 hover:text-white underline cursor-pointer shrink-0"
                                    >
                                        أقرب موعد متاح
                                    </button>
                                ) : null}
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                                <Clock size={15} className="text-neutral-500" />
                                <span>اضغط على أسهم المنبه بالأعلى أو اختر من الأوقات المقترحة لبدء الجلسة</span>
                            </div>
                        )}
                    </div>
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
