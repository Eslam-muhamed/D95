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
    ChevronLeft,
    ChevronRight,
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

const DURATION_PRESETS = [1, 1.5, 2, 3, 4];

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


    // Custom Time Modal State
    const [isCustomTimeModalOpen, setIsCustomTimeModalOpen] = useState(false);
    const [tempHour, setTempHour] = useState<number>(6);
    const [tempMinute, setTempMinute] = useState<number>(0);
    const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>('PM');

    const hasCustomMinuteSelected = hasSelectedTime && selectedMinute !== 0;

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

    // Time slot picker helper state
    const [timePeriodTab, setTimePeriodTab] = useState<'evening' | 'morning'>('evening');
    const [showOccupiedDropdown, setShowOccupiedDropdown] = useState(false);

    const activeDuration = durationHours || 1.0;

    // Temporary modal calculated time and availability
    const tempH24 = useMemo(() => {
        let h24 = tempHour;
        if (tempPeriod === 'PM' && tempHour < 12) h24 += 12;
        if (tempPeriod === 'AM' && tempHour === 12) h24 = 0;
        return h24;
    }, [tempHour, tempPeriod]);

    const tempTime24 = useMemo(() => {
        return `${String(tempH24).padStart(2, '0')}:${String(tempMinute).padStart(2, '0')}`;
    }, [tempH24, tempMinute]);

    const tempStartDateTime = useMemo(() => {
        return createDateTimeFromBusinessDate(selectedDate, tempTime24);
    }, [selectedDate, tempTime24]);

    const tempAvailability = useMemo(() => {
        const end = calculateEndDateTime(tempStartDateTime, activeDuration);
        const result = checkAvailability(
            tempStartDateTime,
            activeDuration,
            selectedDate,
            effectiveOccupiedIntervals
        );
        return {
            ...result,
            startDateTime: tempStartDateTime,
            endDateTime: end,
            formattedStart: formatArabicTimeDetailed(tempStartDateTime),
            formattedEnd: formatArabicTimeDetailed(end),
        };
    }, [tempStartDateTime, activeDuration, selectedDate, effectiveOccupiedIntervals]);

    // Filter all 15-minute start times across the 20h operating window:
    // Only display start times that:
    // 1. Are NOT in the past (for today)
    // 2. Do NOT exceed the 04:00 AM closing boundary for the selected duration
    // 3. Do NOT overlap with ANY existing booking interval
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

    // Evening & Night: 05:00 PM (17:00) to 03:45 AM (next morning)
    const eveningAvailableSlots = useMemo(() => {
        return allAvailableSlots.filter((s) => s.hour24 >= 17 || s.hour24 < 8);
    }, [allAvailableSlots]);

    // Morning & Afternoon: 08:00 AM to 04:45 PM (16:45)
    const morningAvailableSlots = useMemo(() => {
        return allAvailableSlots.filter((s) => s.hour24 >= 8 && s.hour24 < 17);
    }, [allAvailableSlots]);

    const displayedSlots = timePeriodTab === 'evening' ? eveningAvailableSlots : morningAvailableSlots;

    // Quick shortcut: earliest available slot for the selected business date
    const nextAvailableSlot = useMemo(() => {
        if (allAvailableSlots.length === 0) return null;
        return allAvailableSlots[0];
    }, [allAvailableSlots]);

    // Handle picking a slot
    const handleSelectSlot = (slot: TimeOption) => {
        const h12 = slot.hour24 % 12 === 0 ? 12 : slot.hour24 % 12;
        const period: 'AM' | 'PM' = slot.hour24 >= 12 && slot.hour24 < 24 ? 'PM' : 'AM';
        setSelectedHour(h12);
        setSelectedMinute(slot.minute);
        setSelectedPeriod(period);
        if (durationHours === null) {
            setDurationHours(1);
        }
        if (slot.hour24 >= 17 || slot.hour24 < 8) {
            setTimePeriodTab('evening');
        } else {
            setTimePeriodTab('morning');
        }
        playPs5SelectSound();
    };

    const isSlotSelected = (slot: TimeOption) => {
        if (selectedHour === null || selectedMinute === null || selectedPeriod === null) return false;
        const h12 = slot.hour24 % 12 === 0 ? 12 : slot.hour24 % 12;
        const period: 'AM' | 'PM' = slot.hour24 >= 12 && slot.hour24 < 24 ? 'PM' : 'AM';
        return selectedHour === h12 && selectedMinute === slot.minute && selectedPeriod === period;
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

                {/* COMPACT EXPANDABLE DATE SELECTOR */}
                <div className="bg-white dark:bg-[#120e10] border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl p-3 sm:p-4 shadow-xs transition-all">
                    <div className="flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={toggleCalendar}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-white/[0.04] hover:bg-neutral-100 dark:hover:bg-white/[0.08] border border-neutral-200/80 dark:border-white/10 transition-all cursor-pointer group text-right active:scale-[0.98]"
                        >
                            <div className="w-8 h-8 rounded-lg bg-red-600/10 dark:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1.5">
                                    <span>يوم الحجز</span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-bold">
                                        {formattedDate.tag}
                                    </span>
                                </div>
                                <div className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                                    <span>{formattedDate.full}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isCalendarOpen ? 'rotate-180 text-red-500' : ''}`} />
                                </div>
                            </div>
                        </button>

                        <div className="text-left shrink-0">
                            <span className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 font-mono block" dir="ltr">
                                08:00 AM ➔ 04:00 AM
                            </span>
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block">
                                متاح 20 ساعة يومياً
                            </span>
                        </div>
                    </div>

                    {/* Expanded Calendar */}
                    <AnimatePresence>
                        {isCalendarOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                className="overflow-hidden pt-3 border-t border-neutral-100 dark:border-white/[0.06] mt-3 space-y-3"
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
                                                        : 'bg-neutral-100 dark:bg-white/[0.05] border-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/[0.09]'
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

                    {/* Collapsible Occupied Slots Dropdown */}
                    {sortedBookings.length > 0 ? (
                        <div className="rounded-2xl border border-red-200/80 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 overflow-hidden transition-all duration-200">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowOccupiedDropdown(prev => !prev);
                                    playPs5NavigateSound();
                                }}
                                className="w-full p-3.5 flex items-center justify-between gap-3 text-right cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/30 transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/60 border border-red-200 dark:border-red-800/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs text-red-900 dark:text-red-200">
                                                المواعيد المحجوزة مسبقاً (غير متاحة)
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full bg-red-600/10 dark:bg-red-900/60 text-red-600 dark:text-red-300 font-mono text-[10px] font-bold">
                                                {sortedBookings.length}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                                            {showOccupiedDropdown ? 'اضغط لطي القائمة' : 'اضغط لعرض تفاصيل المواعيد المغلقة'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 hidden sm:inline">
                                        {showOccupiedDropdown ? 'إخفاء' : 'عرض'}
                                    </span>
                                    <div className={`w-7 h-7 rounded-lg bg-white/80 dark:bg-white/5 border border-red-200/80 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 transition-transform duration-200 ${showOccupiedDropdown ? 'rotate-180' : ''}`}>
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                            </button>

                            {showOccupiedDropdown && (
                                <div className="p-3 pt-0 border-t border-red-200/50 dark:border-red-900/30 space-y-2 max-h-60 overflow-y-auto mt-2">
                                    {sortedBookings.map((b, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3 rounded-xl bg-white dark:bg-[#151012] border border-red-200/60 dark:border-red-900/40 flex items-center justify-between shadow-2xs"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                                                    <Lock className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-xs text-neutral-900 dark:text-white font-mono">
                                                        من {formatArabicTimeDetailed(b.start)} إلى {formatArabicTimeDetailed(b.end)}
                                                    </div>
                                                    <div className="text-[10px] text-red-500 font-medium">
                                                        محجوز مسبقاً • غير متاح للحجز
                                                    </div>
                                                </div>
                                            </div>

                                            <span className="px-2 py-0.5 rounded bg-red-500/10 dark:bg-red-950 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold text-[10px] shrink-0 font-mono">
                                                محجوز ✕
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
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


                </div>

                {/* ========================================================= */}
                {/* 4. TIME & DURATION SELECTOR (EFFORTLESS ONE-TAP SLOTS)    */}
                {/* ========================================================= */}
                <div className="bg-white dark:bg-[#120e10] border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span className="font-bold text-sm text-neutral-900 dark:text-white">
                                وقت البدء ومدة الجلسة
                            </span>
                        </div>

                        {/* Selected Time Status Pill */}
                        {hasSelectedTime ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs">
                                <span>الموعد المختار: {formatArabicTimeDetailed(startDateTime!)}</span>
                            </span>
                        ) : (
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                                اختر الموعد المناسب بنقرة واحدة من الخيارات بالأسفل 👇
                            </span>
                        )}
                    </div>

                    {/* Period Switcher Tabs & Quick "أقرب موعد متاح" button */}
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                        <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200/80 dark:border-white/10 gap-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setTimePeriodTab('evening');
                                    playPs5NavigateSound();
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    timePeriodTab === 'evening'
                                        ? 'bg-red-600 text-white shadow-xs'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                            >
                                <span>🌙 المساء والسهرة</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                                    timePeriodTab === 'evening'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-400'
                                }`}>
                                    {eveningAvailableSlots.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setTimePeriodTab('morning');
                                    playPs5NavigateSound();
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    timePeriodTab === 'morning'
                                        ? 'bg-red-600 text-white shadow-xs'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                            >
                                <span>☀️ الصباح والظهيرة</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                                    timePeriodTab === 'morning'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-400'
                                }`}>
                                    {morningAvailableSlots.length}
                                </span>
                            </button>
                        </div>

                        {/* Quick Shortcut: Next Available Slot */}
                        {nextAvailableSlot && (
                            <button
                                type="button"
                                onClick={() => handleSelectSlot(nextAvailableSlot)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>أقرب موعد متاح ({nextAvailableSlot.displayTime})</span>
                            </button>
                        )}
                    </div>

                    {/* Time Slots Grid (Only available slots are displayed) */}
                    {displayedSlots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {displayedSlots.map((slot) => {
                                const isSelected = isSlotSelected(slot);

                                return (
                                    <button
                                        key={slot.time24}
                                        type="button"
                                        onClick={() => handleSelectSlot(slot)}
                                        className={`py-2.5 px-1.5 rounded-xl text-center font-mono text-xs font-bold transition-all cursor-pointer relative border ${
                                            isSelected
                                                ? 'bg-red-600 border-red-600 text-white shadow-md shadow-red-600/30 scale-[1.03] z-10'
                                                : 'bg-neutral-50 dark:bg-white/[0.04] border-neutral-200/80 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-red-500/40 hover:bg-neutral-100 dark:hover:bg-white/[0.08] active:scale-[0.98]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            <span>{slot.displayTime}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl bg-neutral-100/70 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/10 text-center space-y-2">
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                                لا توجد مواعيد متاحة في هذه الفترة لطلب مدته {activeDuration} {activeDuration === 1 ? 'ساعة' : 'ساعات'}.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setTimePeriodTab(timePeriodTab === 'evening' ? 'morning' : 'evening');
                                    playPs5NavigateSound();
                                }}
                                className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                            >
                                الانتقال إلى فترة {timePeriodTab === 'evening' ? 'الصباح والظهيرة' : 'المساء والسهرة'} ({timePeriodTab === 'evening' ? morningAvailableSlots.length : eveningAvailableSlots.length} موعد متاح)
                            </button>
                        </div>
                    )}

                    {/* DURATION SELECTOR */}
                    <div className="pt-3 border-t border-neutral-100 dark:border-white/[0.06] space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                كم ساعة تريد اللعب؟ (مدة الجلسة):
                            </span>
                            {hasSelectedTime && hasSelectedDuration && (
                                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                                    تنتهي في: <strong className="text-neutral-900 dark:text-white font-mono">{currentAvailability.formattedEnd}</strong>
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
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
                                        className={`py-2.5 px-1 rounded-xl font-bold text-xs transition-all cursor-pointer border text-center ${
                                            isSelected
                                                ? 'bg-red-600 border-red-600 text-white shadow-md shadow-red-600/25 scale-[1.02]'
                                                : 'bg-neutral-50 dark:bg-white/[0.04] border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                                        }`}
                                    >
                                        <div>{hrs} {hrs === 1 ? 'ساعة' : 'ساعات'}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Time Picker Button */}
                    <div className="pt-2.5 border-t border-neutral-100 dark:border-white/[0.06] flex items-center justify-between gap-2 text-xs">
                        <span className="text-neutral-500 dark:text-neutral-400 font-medium text-[11px] sm:text-xs">
                            تريد وقتاً آخر غير معروض؟
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                setTempHour(selectedHour ?? 18);
                                setTempMinute(selectedMinute ?? 0);
                                setTempPeriod(selectedPeriod ?? 'PM');
                                setIsCustomTimeModalOpen(true);
                                playPs5NavigateSound();
                            }}
                            className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer ${
                                hasCustomMinuteSelected
                                    ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/25'
                                    : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-white/10 hover:border-red-500/40'
                            }`}
                        >
                            <Clock size={13} className={hasCustomMinuteSelected ? 'text-white' : 'text-red-500'} />
                            <span>وقت مخصص بالدقيقة</span>
                            {hasCustomMinuteSelected && selectedHour !== null && selectedMinute !== null && (
                                <span className="font-mono text-[11px] font-bold underline decoration-white/40 mr-0.5" dir="ltr">
                                    ({formatArabicTime(
                                        selectedPeriod === 'PM'
                                            ? (selectedHour < 12 ? selectedHour + 12 : 12)
                                            : (selectedHour === 12 ? 0 : selectedHour),
                                        selectedMinute
                                    )})
                                </span>
                            )}
                        </button>
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

            {/* Custom Time Selection Modal */}
            <AnimatePresence>
                {isCustomTimeModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsCustomTimeModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 12 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden text-neutral-100 flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
                                        <Clock size={16} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-white">تحديد وقت مخصص</h3>
                                        <p className="text-[11px] text-neutral-400">اختر وقت البداية بالساعة والدقيقة</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCustomTimeModalOpen(false)}
                                    className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
                                {/* Digital Clock Display */}
                                <div className="bg-neutral-950 rounded-2xl p-3.5 border border-neutral-800/80 flex items-center justify-between gap-3 shadow-inner">
                                    <div className="flex items-center gap-1 font-mono text-3xl font-black text-white" dir="ltr">
                                        <span className="bg-neutral-900/90 px-3 py-1.5 rounded-xl border border-neutral-800 text-red-400 shadow-inner">
                                            {String(tempHour).padStart(2, '0')}
                                        </span>
                                        <span className="text-neutral-500 animate-pulse font-sans">:</span>
                                        <span className="bg-neutral-900/90 px-3 py-1.5 rounded-xl border border-neutral-800 text-red-400 shadow-inner">
                                            {String(tempMinute).padStart(2, '0')}
                                        </span>
                                    </div>

                                    {/* Period Switcher AM/PM */}
                                    <div className="flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800 gap-1">
                                        <button
                                            type="button"
                                            onClick={() => { setTempPeriod('PM'); playPs5NavigateSound(); }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                tempPeriod === 'PM'
                                                    ? 'bg-red-600 text-white shadow-sm'
                                                    : 'text-neutral-400 hover:text-neutral-200'
                                            }`}
                                        >
                                            مساءً
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setTempPeriod('AM'); playPs5NavigateSound(); }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                tempPeriod === 'AM'
                                                    ? 'bg-red-600 text-white shadow-sm'
                                                    : 'text-neutral-400 hover:text-neutral-200'
                                            }`}
                                        >
                                            صباحاً
                                        </button>
                                    </div>
                                </div>

                                {/* Hour Selection (1 to 12) */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-neutral-300">الساعة:</span>
                                        <span className="font-mono text-neutral-400 text-[11px]">{tempHour}:00 {tempPeriod === 'PM' ? 'م' : 'ص'}</span>
                                    </div>
                                    <div className="grid grid-cols-6 gap-1.5">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => {
                                            const isSelected = tempHour === h;
                                            return (
                                                <button
                                                    key={h}
                                                    type="button"
                                                    onClick={() => {
                                                        setTempHour(h);
                                                        playPs5NavigateSound();
                                                    }}
                                                    className={`py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                                                        isSelected
                                                            ? 'bg-red-600 border-red-500 text-white shadow-sm shadow-red-600/30 scale-[1.03]'
                                                            : 'bg-neutral-800/70 hover:bg-neutral-800 border-neutral-700/60 text-neutral-300 hover:text-white'
                                                    }`}
                                                >
                                                    {h}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Minute Selection */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-neutral-300">الدقيقة:</span>
                                        <span className="font-mono text-neutral-400 text-[11px]">:{String(tempMinute).padStart(2, '0')}</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {[0, 15, 30, 45].map((m) => {
                                            const isSelected = tempMinute === m;
                                            return (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => {
                                                        setTempMinute(m);
                                                        playPs5NavigateSound();
                                                    }}
                                                    className={`py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                                                        isSelected
                                                            ? 'bg-red-600 border-red-500 text-white shadow-sm shadow-red-600/30 scale-[1.03]'
                                                            : 'bg-neutral-800/70 hover:bg-neutral-800 border-neutral-700/60 text-neutral-300 hover:text-white'
                                                    }`}
                                                >
                                                    :{String(m).padStart(2, '0')}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* 5-minute precision steppers */}
                                    <div className="flex items-center justify-between pt-1 text-xs">
                                        <span className="text-[11px] text-neutral-400">تعديل بالدقيقة:</span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTempMinute((prev) => (prev - 5 + 60) % 60);
                                                    playPs5NavigateSound();
                                                }}
                                                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 font-mono text-xs font-bold transition-all cursor-pointer active:scale-95"
                                            >
                                                -5 د
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTempMinute((prev) => (prev + 5) % 60);
                                                    playPs5NavigateSound();
                                                }}
                                                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 font-mono text-xs font-bold transition-all cursor-pointer active:scale-95"
                                            >
                                                +5 د
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Native Clock Option for supported devices */}
                                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                                    <span className="text-[11px]">أو من ساعة الهاتف / المتصفح:</span>
                                    <label className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 text-xs font-medium cursor-pointer transition-all">
                                        <Smartphone size={12} className="text-neutral-400" />
                                        <span>ساعة الجهاز</span>
                                        <input
                                            type="time"
                                            value={tempTime24}
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
                                                        setTempHour(h);
                                                        setTempMinute(m);
                                                        setTempPeriod(p);
                                                    }
                                                }
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                    </label>
                                </div>

                                {/* Live Availability Status Feedback */}
                                <div
                                    className={`p-3 rounded-xl border text-xs transition-all ${
                                        tempAvailability.isAvailable
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {tempAvailability.isAvailable ? (
                                            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                                        ) : (
                                            <AlertCircle size={15} className="text-red-400 shrink-0" />
                                        )}
                                        <div className="font-semibold text-xs leading-tight">
                                            {tempAvailability.isAvailable
                                                ? `الموعد متاح للحجز مؤكداً (${tempAvailability.formattedStart} إلى ${tempAvailability.formattedEnd})`
                                                : tempAvailability.reason === 'PAST_TIME'
                                                ? 'هذا الوقت قد مضى بالفعل، يرجى اختيار موعد قادم'
                                                : tempAvailability.reason === 'EXCEEDS_CLOSING'
                                                ? 'يتجاوز موعد إغلاق الصالة (04:00 ص فجراً)'
                                                : tempAvailability.conflictingInterval
                                                ? `يتعارض مع حجز قائم من ${formatArabicTimeDetailed(tempAvailability.conflictingInterval.start)} إلى ${formatArabicTimeDetailed(tempAvailability.conflictingInterval.end)}`
                                                : 'هذا الوقت غير متاح'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-neutral-800 bg-neutral-950/50 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCustomTimeModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-all cursor-pointer"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="button"
                                    disabled={!tempAvailability.isAvailable}
                                    onClick={() => {
                                        setSelectedHour(tempHour);
                                        setSelectedMinute(tempMinute);
                                        setSelectedPeriod(tempPeriod);
                                        if (durationHours === null) {
                                            setDurationHours(1);
                                        }
                                        setIsCustomTimeModalOpen(false);
                                        playPs5SelectSound();
                                    }}
                                    className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                        tempAvailability.isAvailable
                                            ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 active:scale-[0.98]'
                                            : 'bg-neutral-800 text-neutral-500 border border-neutral-700/50 cursor-not-allowed'
                                    }`}
                                >
                                    <Check size={14} />
                                    <span>تأكيد الموعد ({tempAvailability.formattedStart})</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
