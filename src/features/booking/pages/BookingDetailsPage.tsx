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

import room01InteriorImg from '@/assets/doors/room-01-interior.webp';
import room02InteriorImg from '@/assets/doors/room-02-interior.webp';
import { useTheme } from '@/stores/themeStore';
import { useCart } from '@/features/cart/stores/cartStore';
import { getItemUnitPrice } from '@/lib/cartUtils';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';
import {
    BookingInterval,
    createDateTimeFromBusinessDate,
    calculateEndDateTime,
    getBusinessOperatingWindow,
    checkAvailability,
    formatArabicTime,
    formatArabicTimeFromDate,
    getCairoTodayDateString,
    addDaysToDateString,
    OPERATING_HOURS,
} from '@/lib/bookingDatetime';
import { fetchRoomOccupiedIntervals, fetchRoomRates, type RoomRates } from '@/features/booking/services/bookingService';
import HourlyBookingSlotsGrid from '../components/HourlyBookingSlotsGrid';

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
        name: 'غرفة 02 (Breaking Bad)',
        nameEn: 'ROOM 02 - Breaking Bad',
        titleAr: 'غرفة 02 • Breaking Bad',
        rate: 80,
        specs: 'شاشة 65" 4K • beIN SPORTS • NETFLIX • 4 دراعات PS5 • ساوند بار',
        interiorImg: room01InteriorImg,
    },
    {
        id: 'room-2',
        name: 'غرفة 01 (La Casa)',
        nameEn: 'ROOM 01 - La Casa',
        titleAr: 'غرفة 01 • La Casa',
        rate: 80,
        specs: 'شاشة 65" 4K • beIN SPORTS • NETFLIX • سقف نجوم وعزل صوتي VIP',
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

// Helper: Format Arabic time clearly pinned to Africa/Cairo (e.g. "06:00 مساءً" or "01:30 صباحاً")
function formatArabicTimeDetailed(date: Date): string {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Africa/Cairo',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        });
        const parts = formatter.formatToParts(date);
        let h = 0;
        let m = 0;
        for (const part of parts) {
            if (part.type === 'hour') h = parseInt(part.value, 10);
            if (part.type === 'minute') m = parseInt(part.value, 10);
        }
        const period = h >= 12 && h < 24 ? 'مساءً' : 'صباحاً';
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
    } catch {
        return formatArabicTimeFromDate(date);
    }
}

export default function BookingDetailsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { items: cartItems, booking: cartBooking, cafeTotal, setBooking, openCart, itemCount } = useCart();

    // Initial room fallback from URL query param or navigation state
    const queryRoom = new URLSearchParams(location.search).get('room');
    const initialRoom = location.state?.room || { name: 'غرفة 01 (Play Room)' };
    const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
        if (queryRoom) {
            if (queryRoom === 'room-2' || queryRoom.includes('02') || queryRoom.includes('stars') || queryRoom.includes('papel')) return 'room-2';
            if (queryRoom === 'room-1' || queryRoom.includes('01') || queryRoom.includes('breaking')) return 'room-1';
        }
        if (initialRoom.id) {
            if (initialRoom.id === 'room-2' || initialRoom.id.includes('02') || initialRoom.id.includes('stars') || initialRoom.id.includes('papel')) return 'room-2';
            return 'room-1';
        }
        if (initialRoom.name && (initialRoom.name.includes('02') || initialRoom.name.includes('النجوم') || initialRoom.name.includes('VIP') || initialRoom.name.includes('بابيل') || initialRoom.name.includes('Casa'))) return 'room-2';
        return 'room-1';
    });

    useEffect(() => {
        const param = new URLSearchParams(location.search).get('room');
        if (param) {
            if (param === 'room-2' || param.includes('02') || param.includes('stars') || param.includes('papel')) {
                setSelectedRoomId('room-2');
            } else if (param === 'room-1' || param.includes('01') || param.includes('breaking')) {
                setSelectedRoomId('room-1');
            }
        }
    }, [location.search]);

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

    // Dynamic room rates from database settings
    const [roomRates, setRoomRates] = useState<RoomRates>({ 'room-1': 80, 'room-2': 80 });

    useEffect(() => {
        fetchRoomRates().then(rates => {
            if (rates) setRoomRates(rates);
        }).catch(() => {
            // Keep default
        });
    }, []);

    const availableRooms: Room[] = useMemo(() => [
        {
            id: 'room-1',
            name: 'غرفة 02 (Play Room)',
            nameEn: 'ROOM 02',
            titleAr: 'غرفة 02 • The Arena',
            rate: roomRates['room-1'] || 80,
            specs: 'شاشة 65" 4K • beIN SPORTS • NETFLIX • 4 دراعات PS5 • ساوند بار',
            interiorImg: room01InteriorImg,
        },
        {
            id: 'room-2',
            name: 'غرفة 01 (Play Room)',
            nameEn: 'ROOM 01',
            titleAr: 'غرفة 01 • VIP Suite',
            rate: roomRates['room-2'] || 80,
            specs: 'شاشة 65" 4K • beIN SPORTS • NETFLIX • سقف نجوم وعزل صوتي VIP',
            interiorImg: room02InteriorImg,
        },
    ], [roomRates]);

    const currentRoom = useMemo(() => {
        return availableRooms.find((r) => r.id === selectedRoomId) || availableRooms[0];
    }, [selectedRoomId, availableRooms]);

    const [selectedDate, setSelectedDate] = useState(() => getCairoTodayDateString());


    // =========================================================================
    // TIME & DURATION STATE: 24-Hour Slot Selection
    // =========================================================================
    const [durationHours, setDurationHours] = useState<number>(1);
    const [selectedStartHour24, setSelectedStartHour24] = useState<number | null>(null);

    const [occupiedIntervals, setOccupiedIntervals] = useState<BookingInterval[]>([]);
    const [loadingIntervals, setLoadingIntervals] = useState<boolean>(false);

    const hasSelectedTime = selectedStartHour24 !== null;
    const hasSelectedDuration = durationHours !== null && durationHours > 0;

    const isLateNightHour = selectedStartHour24 !== null && selectedStartHour24 >= 24;
    const effectiveBookingDate = isLateNightHour 
        ? addDaysToDateString(selectedDate, 1) 
        : selectedDate;

    // Convert slot selection into 24-hour time string
    const time24 = useMemo(() => {
        if (!hasSelectedTime || selectedStartHour24 === null) return null;
        const h = selectedStartHour24 % 24;
        return `${String(h).padStart(2, '0')}:00`;
    }, [hasSelectedTime, selectedStartHour24]);

    // Construct start datetime
    const startDateTime = useMemo(() => {
        if (!time24 || selectedStartHour24 === null) return null;
        return createDateTimeFromBusinessDate(effectiveBookingDate, time24);
    }, [effectiveBookingDate, time24, selectedStartHour24]);

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
            effectiveBookingDate,
            effectiveOccupiedIntervals
        );

        return {
            ...result,
            startDateTime,
            endDateTime,
            formattedStart: formatArabicTimeDetailed(startDateTime),
            formattedEnd: formatArabicTimeDetailed(endDateTime),
        };
    }, [startDateTime, durationHours, effectiveBookingDate, effectiveOccupiedIntervals]);

    const roomSubtotal = hasSelectedDuration ? Math.round((durationHours || 0) * currentRoom.rate) : 0;
    const isReadyToContinue = hasSelectedTime && hasSelectedDuration && currentAvailability.isAvailable;

    const handleAddToCart = () => {
        if (!hasSelectedTime || !hasSelectedDuration) {
            toast.info('يرجى تحديد وقت البدء ومدة الجلسة أولاً 🎮');
            return;
        }

        if (!isReadyToContinue) {
            if (currentAvailability.reason === 'PAST_TIME') {
                const now = new Date();
                const diffMins = currentAvailability.startDateTime 
                    ? Math.ceil((now.getTime() - currentAvailability.startDateTime.getTime()) / 60000)
                    : 0;
                if (diffMins > 0 && diffMins <= 59) {
                    toast.error(`هذا الوقت قد مضى، يرجى التقديم بمقدار ${diffMins} دقيقة على الأقل ⏳`);
                } else {
                    toast.error('هذا الوقت قد مضى، يرجى اختيار موعد قادم ⏳');
                }
            } else if (currentAvailability.reason === 'EXCEEDS_CLOSING') {
                toast.error('الموعد مع المدة المحددة يتجاوز ساعات العمل المتاحة ⚠️');
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
            date: effectiveBookingDate,
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
                const now = new Date();
                const diffMins = currentAvailability.startDateTime 
                    ? Math.ceil((now.getTime() - currentAvailability.startDateTime.getTime()) / 60000)
                    : 0;
                if (diffMins > 0 && diffMins <= 59) {
                    toast.error(`هذا الوقت قد مضى، يرجى التقديم بمقدار ${diffMins} دقيقة على الأقل ⏳`);
                } else {
                    toast.error('هذا الوقت قد مضى، يرجى اختيار موعد قادم ⏳');
                }
            } else if (currentAvailability.reason === 'EXCEEDS_CLOSING') {
                toast.error('الموعد مع المدة المحددة يتجاوز ساعات العمل المتاحة ⚠️');
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
                                        {availableRooms.map((room) => {
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

                {/* 10-Minute Hold Cancellation Policy Notice */}
                <div className="bg-amber-500/10 dark:bg-amber-500/[0.08] border border-amber-500/30 dark:border-amber-500/25 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3 text-right shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Timer className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-300">
                            <span>تنبيه هام بشأن تأكيد الحجز</span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200">
                                مهلة ساعة
                            </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-amber-800/90 dark:text-amber-200/80 font-body leading-relaxed mt-1">
                            عند المتابعة لصفحة الدفع، يتم حجز وقت الغرفة مؤقتاً لمدة <strong>ساعة كاملة</strong> فقط لإتمام السداد، وفي حال عدم إتمام الدفع خلال هذه المدة يُلغى الحجز تلقائياً لإتاحة الموعد للعملاء الآخرين.
                        </p>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* 24-HOUR HOURLY BOOKING SLOTS GRID (خانات الـ 24 ساعة)       */}
                {/* ========================================================= */}
                <HourlyBookingSlotsGrid
                    selectedDate={selectedDate}
                    onChangeDate={setSelectedDate}
                    roomRate={currentRoom.rate}
                    occupiedIntervals={effectiveOccupiedIntervals}
                    selectedStartHour24={selectedStartHour24}
                    durationHours={durationHours}
                    onSelectSlot={(startHour24, newDuration) => {
                        setSelectedStartHour24(startHour24);
                        setDurationHours(newDuration);
                    }}
                    onChangeDuration={(newDuration) => {
                        setDurationHours(newDuration);
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

                {/* Developer Credit */}
                <div className="pt-4 pb-20 sm:pb-24 text-[10px] sm:text-[11px] text-neutral-500 font-body flex items-center justify-center gap-1 opacity-80 hover:opacity-100 transition-opacity" dir="ltr">
                    Developed by
                    <a 
                        href="https://wa.me/201090992723" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-bold text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                        title="Contact Developer on WhatsApp"
                    >
                        ESLAM
                    </a>
                </div>

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
                                            : 'اختر خانة الساعة للمتابعة'}
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
                                    ? 'اختر خانة الساعة للمتابعة'
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
