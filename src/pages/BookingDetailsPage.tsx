import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowRight,
    Calendar,
    Clock,
    Coffee,
    Check,
    Lock,
    DoorClosed,
    Zap,
    Droplets,
    Sun,
    Moon,
    AlertCircle,
    Plus,
    Minus,
    Layers,
    CheckCircle2,
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import room01InteriorImg from '@/assets/doors/room-01-interior.jpg';
import room02InteriorImg from '@/assets/doors/room-02-interior.jpg';
import { useTheme } from '@/stores/themeStore';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';
import {
    OPERATING_HOURS,
    BookingInterval,
    TimeOption,
    generateStartTimeOptions,
    calculateEndDateTime,
    formatArabicTimeFromDate,
    getBusinessOperatingWindow,
    checkAvailability,
    getTimelineSegments,
    formatArabicTime
} from '@/lib/bookingDatetime';
import { fetchRoomOccupiedIntervals } from '@/services/bookingService';

interface SnackAddon {
    id: string;
    name: string;
    price: number;
    description: string;
    iconType: 'zap' | 'coffee' | 'water';
}

const SNACK_OPTIONS: SnackAddon[] = [
    {
        id: 'redbull_combo',
        name: 'كومبو الجيمرز (ريدبول + سناك)',
        price: 55,
        description: 'طاقة وتركيز للجلسات التنافسية الطويلة',
        iconType: 'zap',
    },
    {
        id: 'coffee_specialty',
        name: 'قهوة سبيشالتي دبل إسبريسو',
        price: 40,
        description: 'بُن برازيلي فاخر محمص طازجاً',
        iconType: 'coffee',
    },
    {
        id: 'water_cold',
        name: 'مياه معدنية مثلجة (كبير)',
        price: 15,
        description: 'انتعاش مستمر أثناء جلسة اللعب',
        iconType: 'water',
    },
];

const AVAILABLE_ROOMS = [
    {
        id: 'room-1',
        name: 'غرفة 01 (Play Room)',
        nameEn: 'ROOM 01',
        titleAr: 'غرفة الأبطال (THE ARENA)',
        code: 'SUITE-01',
        rate: 100,
        specs: 'شاشة 65 بوصة 4K 120Hz • 4 دراعات PS5 • ساوند بار سينمائي',
        interiorImg: room01InteriorImg,
    },
    {
        id: 'room-2',
        name: 'غرفة 02 (Play Room)',
        nameEn: 'ROOM 02',
        titleAr: 'غرفة النجوم (VIP SUITE)',
        code: 'SUITE-02',
        rate: 100,
        specs: 'شاشة 65 بوصة 4K 120Hz • 4 دراعات PS5 • سقف نجوم وعزل صوتي',
        interiorImg: room02InteriorImg,
    },
];

const DURATION_PRESETS = [1, 1.5, 2, 2.5, 3, 4, 5, 6];

const PERIOD_FILTERS = [
    { id: 'all', label: 'كل الفترات (08:00 ص - 04:00 ص)' },
    { id: 'morning', label: 'صباحية (08:00 ص - 12:00 م)', startH: 8, endH: 12 },
    { id: 'afternoon', label: 'ظهيرة وعصر (12:00 م - 07:00 م)', startH: 12, endH: 19 },
    { id: 'evening', label: 'مسائية (07:00 م - 12:00 ص)', startH: 19, endH: 24 },
    { id: 'night', label: 'سهرة وليل (12:00 ص - 04:00 ص)', startH: 0, endH: 4 },
];

export default function BookingDetailsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

    // Read room details from router state or fallback to Room 1
    const initialRoom = location.state?.room || {
        name: 'غرفة 01 (Play Room)',
        type: 'standard',
        rate: 100,
    };

    const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
        if (initialRoom.name && initialRoom.name.includes('02')) return 'room-2';
        return 'room-1';
    });

    const currentRoom = useMemo(() => {
        return AVAILABLE_ROOMS.find((r) => r.id === selectedRoomId) || AVAILABLE_ROOMS[0];
    }, [selectedRoomId]);

    // Generate 7-day calendar
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
    const [durationHours, setDurationHours] = useState<number>(1);
    const [selectedTimeOption, setSelectedTimeOption] = useState<TimeOption | null>(null);
    const [occupiedIntervals, setOccupiedIntervals] = useState<BookingInterval[]>([]);
    const [loadingIntervals, setLoadingIntervals] = useState<boolean>(false);
    const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('all');
    const [selectedSnacks, setSelectedSnacks] = useState<string[]>([]);

    // ─────────────────────────────────────────────────────────────
    // FETCH REAL OCCUPIED INTERVALS FROM SUPABASE
    // ─────────────────────────────────────────────────────────────
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

    // Reset or validate selected time when room, date, or duration changes
    useEffect(() => {
        setSelectedTimeOption(null);
    }, [selectedRoomId, selectedDate]);

    // Generate all 15-minute start time options for the 20-hour window
    const allStartTimes = useMemo(() => {
        return generateStartTimeOptions(selectedDate);
    }, [selectedDate]);

    // Filter start times by active period tab
    const filteredStartTimes = useMemo(() => {
        if (selectedPeriodFilter === 'all') return allStartTimes;
        const period = PERIOD_FILTERS.find((p) => p.id === selectedPeriodFilter);
        if (!period || period.startH === undefined || period.endH === undefined) return allStartTimes;

        return allStartTimes.filter((opt) => {
            if (period.id === 'night') {
                return opt.hour24 >= 0 && opt.hour24 < 4;
            }
            return opt.hour24 >= period.startH! && opt.hour24 < period.endH!;
        });
    }, [allStartTimes, selectedPeriodFilter]);

    // Dynamic continuous timeline segments
    const timelineSegments = useMemo(() => {
        return getTimelineSegments(selectedDate, occupiedIntervals);
    }, [selectedDate, occupiedIntervals]);

    // Computed end date and check availability for currently selected start time
    const currentSelectionAvailability = useMemo(() => {
        if (!selectedTimeOption) return null;
        const endDateTime = calculateEndDateTime(selectedTimeOption.startDateTime, durationHours);
        const result = checkAvailability(
            selectedTimeOption.startDateTime,
            durationHours,
            selectedDate,
            occupiedIntervals
        );
        return {
            ...result,
            endDateTime,
            formattedEnd: formatArabicTimeFromDate(endDateTime),
            formattedStart: selectedTimeOption.displayTime,
        };
    }, [selectedTimeOption, durationHours, selectedDate, occupiedIntervals]);

    // Helper to evaluate each 15-min start time option
    const evaluateTimeOption = useCallback((option: TimeOption) => {
        return checkAvailability(option.startDateTime, durationHours, selectedDate, occupiedIntervals);
    }, [durationHours, selectedDate, occupiedIntervals]);

    // Handle Start Time click
    const handleStartTimeClick = (option: TimeOption) => {
        const avail = evaluateTimeOption(option);
        if (!avail.isAvailable) {
            if (avail.reason === 'PAST_TIME') {
                toast.error('هذا الوقت قد مضى، يرجى اختيار موعد قادم ⏳');
            } else if (avail.reason === 'EXCEEDS_CLOSING') {
                toast.error('هذا التوقيت مع المدة المحددة يتجاوز موعد إغلاق الصالة (04:00 ص) ⚠️');
            } else if (avail.reason === 'OVERLAP_CONFLICT') {
                toast.error('هذا التوقيت يتعارض مع حجز قائم للغرفة 🔒');
            }
            return;
        }

        playPs5NavigateSound();
        setSelectedTimeOption(option);
    };

    // Duration handlers
    const handleDurationChange = (newDuration: number) => {
        playPs5SelectSound();
        const clamped = Math.max(
            OPERATING_HOURS.MIN_DURATION_HOURS,
            Math.min(OPERATING_HOURS.MAX_DURATION_HOURS, newDuration)
        );
        setDurationHours(clamped);

        // If a start time was already picked, check if it's still available with new duration
        if (selectedTimeOption) {
            const avail = checkAvailability(selectedTimeOption.startDateTime, clamped, selectedDate, occupiedIntervals);
            if (!avail.isAvailable) {
                toast.warning('تم إلغاء تحديد الموعد لأن المدة الجديدة تتجاوز وقت الإغلاق أو تتعارض مع حجز آخر');
                setSelectedTimeOption(null);
            }
        }
    };

    const toggleSnack = (id: string) => {
        playPs5NavigateSound();
        setSelectedSnacks((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const roomSubtotal = Math.round(durationHours * currentRoom.rate);

    const snacksTotal = useMemo(() => {
        return selectedSnacks.reduce((sum, sId) => {
            const item = SNACK_OPTIONS.find((s) => s.id === sId);
            return sum + (item ? item.price : 0);
        }, 0);
    }, [selectedSnacks]);

    const grandTotal = roomSubtotal + snacksTotal;

    const isReadyToContinue = selectedTimeOption !== null && currentSelectionAvailability?.isAvailable === true;

    const handleContinue = () => {
        if (!isReadyToContinue || !selectedTimeOption || !currentSelectionAvailability) {
            toast.error('يرجى تحديد وقت بداية الجلسة والتأكد من توافرها 🎮');
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
                startTime: currentSelectionAvailability.formattedStart,
                endTime: currentSelectionAvailability.formattedEnd,
                startDateTime: selectedTimeOption.startDateTime.toISOString(),
                endDateTime: currentSelectionAvailability.endDateTime.toISOString(),
                durationHours,
                roomSubtotal,
                snacks: selectedSnacks.map((sId) => SNACK_OPTIONS.find((s) => s.id === sId)),
                snacksTotal,
                total: grandTotal,
            },
        });
    };

    return (
        <div className="min-h-screen w-full bg-[#F6F5F2] dark:bg-[#080607] text-neutral-900 dark:text-[#e8e4e6] font-body text-sm flex flex-col selection:bg-red-600 selection:text-white relative select-none transition-colors duration-200">
            {/* Ambient Lighting & Textures */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[420px] bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(220,38,38,0.14)_0%,transparent_70%)] blur-[70px]" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-red-950/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:40px_40px] opacity-60" />
            </div>

            {/* Top Navigation Bar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-white/95 dark:bg-[#0c090b]/95 backdrop-blur-md pt-safe border-b border-neutral-200 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_25px_rgba(0,0,0,0.85)] transition-colors duration-200">
                <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/playstation"
                            aria-label="الرجوع للغرف"
                            className="w-9 h-9 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] flex items-center justify-center text-neutral-800 dark:text-neutral-300 hover:text-red-600 dark:hover:text-white transition-all active:scale-95 cursor-pointer border border-neutral-200 dark:border-white/10 shadow-sm"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <div className="flex flex-col text-right">
                            <h1 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white leading-tight font-body tracking-wide">
                                حجز الغرفة والجدول الزمني
                            </h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-brush text-xs sm:text-sm text-red-600 dark:text-red-500 font-bold tracking-wider">D95</span>
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold tracking-widest uppercase">DYNAMIC AVAILABILITY</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 shadow-sm active:scale-95"
                            aria-label="تبديل المظهر"
                        >
                            {theme === 'dark' ? (
                                <Sun size={15} className="text-amber-400" />
                            ) : (
                                <Moon size={15} className="text-neutral-800" />
                            )}
                        </button>

                        <button
                            onClick={loadOccupiedIntervals}
                            disabled={loadingIntervals}
                            title="تحديث الحجوزات الحالية"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-300 text-xs font-mono hover:bg-neutral-200 dark:hover:bg-white/[0.06] transition-all cursor-pointer active:scale-95"
                        >
                            <RefreshCw size={12} className={`text-emerald-500 ${loadingIntervals ? 'animate-spin' : ''}`} />
                            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide">LIVE</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative z-10 w-full pt-20 pb-36 px-3.5 sm:px-6 max-w-4xl mx-auto space-y-4" dir="rtl">
                
                {/* HERO BANNER: CURRENT ROOM */}
                <section className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-white/[0.12] bg-white dark:bg-[#120e10] shadow-md dark:shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent z-20" />

                    <div className="relative h-40 sm:h-48 w-full overflow-hidden bg-black">
                        <img
                            src={currentRoom.interiorImg}
                            alt={currentRoom.name}
                            className="w-full h-full object-cover brightness-95 contrast-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/30" />

                        <div className="absolute top-3 right-3 z-10 flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/85 border border-white/15 backdrop-blur-md shadow-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                            <span className="text-[11px] font-bold text-neutral-200 tracking-wide font-sans">
                                الدخول متاح ومباشر
                            </span>
                        </div>

                        <div className="absolute bottom-3 inset-x-3 sm:inset-x-5 z-10 flex items-end justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono font-black tracking-widest uppercase px-2 py-0.5 rounded bg-red-950/80 border border-red-600/50 text-red-300">
                                        {currentRoom.nameEn}
                                    </span>
                                    <span className="text-[11px] font-bold text-white font-sans">
                                        ساعات العمل: 08:00 ص ➔ 04:00 ص فجراً
                                    </span>
                                </div>
                                <h2 className="font-brush text-xl sm:text-2xl text-white font-bold tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                                    {currentRoom.titleAr}
                                </h2>
                                <p className="text-[11px] sm:text-xs text-neutral-300 font-medium leading-relaxed max-w-xl">
                                    {currentRoom.specs}
                                </p>
                            </div>

                            <div className="text-left bg-black/90 px-3.5 py-2 rounded-lg border border-white/15 shrink-0 hidden xs:block shadow-lg" dir="ltr">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">HOURLY RATE</div>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-sans font-black text-lg sm:text-xl text-white tabular-nums">
                                        {currentRoom.rate}
                                    </span>
                                    <span className="text-[11px] text-red-400 font-bold">EGP / HR</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* STEP 1: ROOM SELECTION */}
                <section className="bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] rounded-xl p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center justify-between px-1 mb-2.5">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                            <DoorClosed className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span>1. تحديد الغرفة:</span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-white/[0.04] px-2.5 py-0.5 rounded border border-neutral-200 dark:border-white/10">
                            100 EGP / HOUR
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {AVAILABLE_ROOMS.map((room) => {
                            const isSelected = selectedRoomId === room.id;
                            return (
                                <button
                                    key={room.id}
                                    onClick={() => {
                                        setSelectedRoomId(room.id);
                                        playPs5NavigateSound();
                                    }}
                                    className={`relative p-3 rounded-lg border text-right transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group ${
                                        isSelected
                                            ? 'bg-gradient-to-b from-red-50 to-red-100/60 dark:from-[#241216] dark:to-[#150d0f] border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.18)]'
                                            : 'bg-neutral-50 dark:bg-[#151113] border-neutral-200 dark:border-white/[0.08] text-neutral-800 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-white/20 hover:bg-neutral-100 dark:hover:bg-[#1b1518]'
                                    }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-0 inset-x-0 h-[2px] bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.6)]" />
                                    )}

                                    <div className="flex items-center justify-between w-full mb-2">
                                        <div
                                            className={`w-7 h-7 rounded flex items-center justify-center shrink-0 border transition-colors ${
                                                isSelected
                                                    ? 'bg-red-600 border-red-500 text-white shadow-sm'
                                                    : 'bg-neutral-100 dark:bg-white/[0.04] border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white'
                                            }`}
                                        >
                                            <DoorClosed className="w-3.5 h-3.5" />
                                        </div>

                                        <div className="text-left" dir="ltr">
                                            <span
                                                className={`text-[11px] font-mono font-bold tabular-nums px-2 py-0.5 rounded ${
                                                    isSelected
                                                        ? 'bg-red-100 dark:bg-red-950/90 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-600/40'
                                                        : 'bg-white dark:bg-black/50 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10'
                                                }`}
                                            >
                                                {room.rate} EGP
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-black text-sm sm:text-base text-neutral-900 dark:text-white tracking-wider">
                                                {room.nameEn}
                                            </span>
                                            {isSelected && (
                                                <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest font-mono">
                                                    SELECTED
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5">
                                            {room.id === 'room-1' ? 'غرفة 01 VIP (The Arena)' : 'غرفة 02 VIP (VIP Suite)'}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* STEP 2: DATE SELECTOR (7 DAYS) */}
                <section className="bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] rounded-xl p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-900 dark:text-white font-bold">
                            <Calendar className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span>2. تاريخ يوم العمل:</span>
                        </div>
                        <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                            يوم العمل يمتد حتى 04:00 ص فجر اليوم التالي
                        </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                        {calendarDays.map((d, dIdx) => {
                            const active = selectedDate === d.iso;
                            return (
                                <motion.button
                                    key={d.iso}
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() => {
                                        setSelectedDate(d.iso);
                                        playPs5NavigateSound(dIdx);
                                    }}
                                    className={`relative shrink-0 py-2.5 px-3 rounded-lg border text-center transition-all cursor-pointer min-w-[68px] sm:min-w-[76px] overflow-hidden ${
                                        active
                                            ? 'bg-gradient-to-b from-red-50 to-red-100/60 dark:from-[#251216] dark:to-[#150d0f] border-red-600 shadow-[0_0_18px_rgba(220,38,38,0.2)]'
                                            : 'bg-neutral-50 dark:bg-[#151113] border-neutral-200 dark:border-white/[0.08] text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-white/20 hover:bg-neutral-100 dark:hover:bg-[#1b1518]'
                                    }`}
                                >
                                    {active && (
                                        <div className="absolute top-0 inset-x-0 h-[2px] bg-red-600" />
                                    )}

                                    <div className={`text-[11px] font-bold ${active ? 'text-red-600 dark:text-red-300' : 'text-neutral-500 dark:text-neutral-400'}`}>
                                        {d.dayName}
                                    </div>
                                    <div className="text-lg sm:text-xl font-black font-sans tabular-nums my-0.5 text-neutral-900 dark:text-white">
                                        {d.dayNumber}
                                    </div>
                                    <div className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                                        {d.monthName}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </section>

                {/* STEP 3: DURATION SELECTOR */}
                <section className="bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] rounded-xl p-3.5 sm:p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-900 dark:text-white font-bold">
                            <Clock className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span>3. مدة الجلسة (الحد الأدنى: ساعة واحدة):</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleDurationChange(durationHours - 0.5)}
                                disabled={durationHours <= 1}
                                className="w-7 h-7 rounded bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/10 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/[0.1] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                                aria-label="تقليل المدة"
                            >
                                <Minus size={14} />
                            </button>
                            <span className="font-mono font-bold text-sm px-2 text-red-600 dark:text-red-400 tabular-nums">
                                {durationHours} {durationHours === 1 ? 'ساعة' : 'ساعات'}
                            </span>
                            <button
                                onClick={() => handleDurationChange(durationHours + 0.5)}
                                disabled={durationHours >= 12}
                                className="w-7 h-7 rounded bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/10 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/[0.1] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                                aria-label="زيادة المدة"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                        {DURATION_PRESETS.map((preset) => {
                            const isSelected = durationHours === preset;
                            return (
                                <button
                                    key={preset}
                                    onClick={() => handleDurationChange(preset)}
                                    className={`px-3 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                                        isSelected
                                            ? 'bg-red-600 border-red-500 text-white shadow-[0_0_12px_rgba(220,38,38,0.4)]'
                                            : 'bg-neutral-50 dark:bg-[#151113] border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-white/20'
                                    }`}
                                >
                                    {preset} {preset === 1 ? 'ساعة' : 'ساعات'}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* CONTINUOUS TIMELINE VISUALIZER (08:00 AM -> 04:00 AM) */}
                <section className="bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] rounded-xl p-3.5 sm:p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                            <Layers className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span>الجدول الزمني التفاعلي (متاح بالكامل افتراضياً):</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-mono">
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" /> متاح
                            </span>
                            <span className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                                <span className="w-2 h-2 rounded-full bg-red-600" /> محجوز مسبقاً
                            </span>
                        </div>
                    </div>

                    {/* Timeline Graphic Bar */}
                    <div className="relative h-8 rounded-lg bg-emerald-500/20 dark:bg-emerald-950/40 border border-emerald-500/30 overflow-hidden flex items-center">
                        {/* Occupied Segments */}
                        {timelineSegments.map((seg, idx) => {
                            if (!seg.isBooked) return null;
                            return (
                                <div
                                    key={idx}
                                    title={`محجوز: ${formatArabicTimeFromDate(seg.start)} إلى ${formatArabicTimeFromDate(seg.end)}`}
                                    style={{
                                        left: `${seg.percentStart}%`,
                                        width: `${seg.percentWidth}%`,
                                    }}
                                    className="absolute top-0 bottom-0 bg-red-600/85 border-x border-red-500 shadow-inner flex items-center justify-center text-[9px] font-mono font-bold text-white overflow-hidden"
                                >
                                    <span className="truncate px-1 opacity-90">محجوز 🔒</span>
                                </div>
                            );
                        })}

                        {/* Selected User Segment Overlay */}
                        {selectedTimeOption && currentSelectionAvailability?.isAvailable && (
                            (() => {
                                const { opening, closing } = getBusinessOperatingWindow(selectedDate);
                                const totalMs = closing.getTime() - opening.getTime();
                                const startMs = selectedTimeOption.startDateTime.getTime() - opening.getTime();
                                const durationMs = durationHours * 3600 * 1000;
                                const leftPercent = Math.max(0, (startMs / totalMs) * 100);
                                const widthPercent = Math.min(100 - leftPercent, (durationMs / totalMs) * 100);

                                return (
                                    <div
                                        style={{
                                            left: `${leftPercent}%`,
                                            width: `${widthPercent}%`,
                                        }}
                                        className="absolute top-0 bottom-0 bg-white dark:bg-white text-black font-mono font-black text-[10px] border-2 border-red-600 z-10 flex items-center justify-center shadow-lg animate-pulse"
                                    >
                                        <span className="truncate px-1">جلستك ⭐</span>
                                    </div>
                                );
                            })()
                        )}
                    </div>

                    {/* Timeline Axis Labels */}
                    <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-1 px-1" dir="ltr">
                        <span>08:00 AM</span>
                        <span>02:00 PM</span>
                        <span>08:00 PM</span>
                        <span>12:00 AM (Midnight)</span>
                        <span>04:00 AM (Close)</span>
                    </div>
                </section>

                {/* STEP 4: 15-MINUTE START TIME PICKER */}
                <section className="bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] rounded-xl p-3.5 sm:p-5 shadow-sm">
                    {/* Header: Title + Period Filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-200 dark:border-white/[0.08]">
                        <div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-red-600 dark:text-red-500" />
                                <h2 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white font-body">
                                    4. اختيار وقت بداية الجلسة (بفواصل 15 دقيقة)
                                </h2>
                            </div>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 font-medium">
                                اختر أي توقيت يناسبك • تُحسب الإتاحة ديناميكياً بناءً على عدم التعارض مع الحجوزات
                            </p>
                        </div>

                        {/* Period Filter Tabs */}
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1 bg-neutral-100 dark:bg-black/60 p-1 rounded-lg border border-neutral-200 dark:border-white/10">
                            {PERIOD_FILTERS.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        setSelectedPeriodFilter(p.id);
                                        playPs5NavigateSound();
                                    }}
                                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                                        selectedPeriodFilter === p.id
                                            ? 'bg-red-600 text-white font-bold shadow-sm'
                                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                    }`}
                                >
                                    {p.label.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status Legend */}
                    <div className="flex items-center gap-4 text-xs mb-3 px-1 font-mono flex-wrap">
                        <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                            <span className="w-2 h-2 rounded-sm bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                            <span className="text-[11px]">متاح للبدء</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold">
                            <span className="w-2 h-2 rounded-sm bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.8)]" />
                            <span className="text-[11px]">التوقيت المحدد</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500">
                            <span className="w-2 h-2 rounded-sm bg-neutral-300 dark:bg-neutral-800" />
                            <span className="text-[11px]">غير متاح / محجوز / مضى</span>
                        </div>
                    </div>

                    {/* 15-MINUTE START TIME GRID */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {filteredStartTimes.map((option) => {
                            const avail = evaluateTimeOption(option);
                            const isSelected = selectedTimeOption?.time24 === option.time24;
                            const isPast = avail.reason === 'PAST_TIME';
                            const isExceeds = avail.reason === 'EXCEEDS_CLOSING';
                            const isConflict = avail.reason === 'OVERLAP_CONFLICT';
                            const isBlocked = !avail.isAvailable;

                            return (
                                <motion.button
                                    key={option.time24}
                                    whileTap={!isBlocked ? { scale: 0.95 } : undefined}
                                    onClick={() => handleStartTimeClick(option)}
                                    disabled={isBlocked}
                                    className={`relative p-2.5 rounded-lg border text-center transition-all duration-150 flex flex-col justify-between overflow-hidden cursor-pointer ${
                                        isBlocked
                                            ? 'bg-neutral-100 dark:bg-black/40 border-neutral-200 dark:border-white/[0.04] text-neutral-400 dark:text-neutral-600 opacity-40 cursor-not-allowed'
                                            : isSelected
                                            ? 'bg-gradient-to-b from-red-50 to-red-100/70 dark:from-[#2a1317] dark:to-[#170d10] border-red-600 shadow-[0_0_18px_rgba(220,38,38,0.25)] ring-1 ring-red-500'
                                            : 'bg-neutral-50 dark:bg-[#151113] border-neutral-200 dark:border-white/[0.08] hover:border-red-500/60 hover:bg-neutral-100 dark:hover:bg-[#1b1518] text-neutral-900 dark:text-white'
                                    }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-0 inset-x-0 h-[2px] bg-red-600" />
                                    )}

                                    {/* Period Tag / Badge */}
                                    <div className="flex items-center justify-between text-[10px] w-full mb-1">
                                        <span className="font-mono text-[9px] text-neutral-400 dark:text-neutral-500">
                                            {option.isNextDay ? 'فجر غد' : 'اليوم'}
                                        </span>
                                        {isSelected ? (
                                            <span className="text-[9px] font-bold text-red-600 dark:text-red-400 font-mono">
                                                SELECTED
                                            </span>
                                        ) : isPast ? (
                                            <span className="text-[9px] text-neutral-400 dark:text-neutral-500">مضى</span>
                                        ) : isConflict ? (
                                            <span className="text-[9px] text-red-500 dark:text-red-400">محجوز</span>
                                        ) : isExceeds ? (
                                            <span className="text-[9px] text-amber-500">إغلاق</span>
                                        ) : (
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        )}
                                    </div>

                                    {/* Main Time Readout */}
                                    <div className={`font-mono text-xs sm:text-sm font-bold tabular-nums my-0.5 ${
                                        isSelected
                                            ? 'text-red-600 dark:text-red-400 font-black'
                                            : isBlocked
                                            ? 'line-through text-neutral-400 dark:text-neutral-600'
                                            : 'text-neutral-900 dark:text-white'
                                    }`}>
                                        {option.displayTime}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Active Selection Details Callout */}
                    <AnimatePresence>
                        {selectedTimeOption && currentSelectionAvailability && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className={`mt-4 p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                    currentSelectionAvailability.isAvailable
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600/40 text-emerald-950 dark:text-emerald-200'
                                        : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-600/40 text-red-950 dark:text-red-200'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    {currentSelectionAvailability.isAvailable ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                                    )}
                                    <div>
                                        <div className="font-bold text-xs sm:text-sm">
                                            {currentSelectionAvailability.isAvailable
                                                ? 'الموعد المحدد متاح بالكامل ومؤكد للحجز'
                                                : 'الموعد المحدد غير متاح'}
                                        </div>
                                        <div className="text-[11px] font-mono mt-0.5 opacity-90 flex items-center gap-1.5">
                                            <span>من {currentSelectionAvailability.formattedStart}</span>
                                            <span>➔</span>
                                            <span>إلى {currentSelectionAvailability.formattedEnd}</span>
                                            <span>({durationHours} {durationHours === 1 ? 'ساعة' : 'ساعات'})</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-left font-mono font-bold text-sm sm:text-base shrink-0" dir="ltr">
                                    {roomSubtotal} EGP
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* STEP 5: SNACKS & RECHARGE ADDONS */}
                <section className="bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] rounded-xl p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-900 dark:text-white font-bold">
                            <Zap className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span>5. سناكس ومشروبات الطاقة والتركيز (اختياري)</span>
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-white/[0.04] px-2.5 py-0.5 rounded border border-neutral-200 dark:border-white/10">
                            IN-SUITE SERVICE
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {SNACK_OPTIONS.map((snack) => {
                            const isChecked = selectedSnacks.includes(snack.id);
                            return (
                                <div
                                    key={snack.id}
                                    onClick={() => toggleSnack(snack.id)}
                                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all duration-150 ${
                                        isChecked
                                            ? 'bg-gradient-to-b from-red-50 to-red-100/60 dark:from-[#241216] dark:to-[#150d0f] border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.18)]'
                                            : 'bg-neutral-50 dark:bg-[#151113] border-neutral-200 dark:border-white/[0.08] text-neutral-800 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                                isChecked
                                                    ? 'bg-red-600 border-red-500 text-white'
                                                    : 'border-neutral-300 dark:border-white/20 bg-white dark:bg-black/50'
                                            }`}
                                        >
                                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
                                                {snack.iconType === 'zap' && <Zap className="w-3.5 h-3.5 text-amber-500" />}
                                                {snack.iconType === 'coffee' && <Coffee className="w-3.5 h-3.5 text-amber-600" />}
                                                {snack.iconType === 'water' && <Droplets className="w-3.5 h-3.5 text-blue-500" />}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                                                    {snack.name}
                                                </div>
                                                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                                                    {snack.description}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-mono font-bold text-xs text-red-600 dark:text-red-400 shrink-0 ml-2" dir="ltr">
                                        +{snack.price} EGP
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* FIXED BOTTOM SUMMARY & CONFIRM BAR */}
            <div className="fixed bottom-0 inset-x-0 z-40 bg-white/98 dark:bg-[#0c090b]/98 border-t border-neutral-200 dark:border-white/[0.12] backdrop-blur-xl p-3 sm:p-4 pb-safe shadow-lg dark:shadow-[0_-10px_35px_rgba(0,0,0,0.95)]">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    {/* Financial & Time Summary */}
                    <div className="flex flex-col text-right">
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-sans font-black text-2xl sm:text-3xl tabular-nums text-neutral-900 dark:text-white tracking-tight">
                                {grandTotal}
                            </span>
                            <span className="text-xs text-neutral-700 dark:text-neutral-300 font-bold">ج.م</span>
                            {selectedTimeOption ? (
                                <span className="text-[10px] font-mono font-bold text-red-700 dark:text-red-300 mr-1 bg-red-100 dark:bg-red-950/80 px-2 py-0.5 rounded border border-red-300 dark:border-red-600/40 whitespace-nowrap">
                                    {durationHours} {durationHours === 1 ? 'HOUR' : 'HOURS'}
                                </span>
                            ) : (
                                <span className="text-[10px] font-mono font-semibold text-neutral-500 dark:text-neutral-400 mr-1 bg-neutral-100 dark:bg-white/[0.04] px-2 py-0.5 rounded border border-neutral-200 dark:border-white/10 whitespace-nowrap">
                                    اختر وقت البداية
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5 font-medium">
                            <span className="font-mono font-bold text-neutral-900 dark:text-white uppercase">{currentRoom.nameEn}</span>
                            <span>•</span>
                            {selectedTimeOption && currentSelectionAvailability ? (
                                <div dir="rtl" className="flex items-center gap-1 text-red-600 dark:text-red-400 font-mono font-bold tabular-nums text-[11px]">
                                    <span>{currentSelectionAvailability.formattedStart}</span>
                                    <span>➔</span>
                                    <span>{currentSelectionAvailability.formattedEnd}</span>
                                </div>
                            ) : (
                                <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                                    حدد موعد بداية الجلسة (بفواصل 15 دقيقة)
                                </span>
                            )}
                        </div>
                    </div>

                    {/* High-Performance Checkout CTA */}
                    <button
                        onClick={handleContinue}
                        disabled={!isReadyToContinue}
                        className={`py-3 px-6 sm:px-8 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all uppercase tracking-wide font-sans shrink-0 border ${
                            isReadyToContinue
                                ? 'bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-600/30 active:scale-95 cursor-pointer border-red-500/60'
                                : 'bg-neutral-200 dark:bg-neutral-800/80 text-neutral-400 dark:text-neutral-500 border-neutral-300 dark:border-white/5 cursor-not-allowed opacity-75'
                        }`}
                    >
                        <span>{isReadyToContinue ? 'تأكيد الحجز والدفع' : 'اختر وقت البداية'}</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
}
