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
    RefreshCw,
    Sparkles,
    CheckSquare,
    Info
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
    createDateTimeFromBusinessDate,
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

// Popular quick start times for fast 1-click setting
const QUICK_START_PRESETS = [
    { label: '02:00 م', hour: 2, minute: 0, period: 'PM' as const },
    { label: '03:15 م', hour: 3, minute: 15, period: 'PM' as const },
    { label: '04:00 م', hour: 4, minute: 0, period: 'PM' as const },
    { label: '06:00 م', hour: 6, minute: 0, period: 'PM' as const },
    { label: '08:00 م', hour: 8, minute: 0, period: 'PM' as const },
    { label: '10:00 م', hour: 10, minute: 0, period: 'PM' as const },
    { label: '12:00 ص (سهرة)', hour: 12, minute: 0, period: 'AM' as const },
    { label: '02:00 ص (فجر)', hour: 2, minute: 0, period: 'AM' as const },
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

    // ─────────────────────────────────────────────────────────────
    // FREE TIME PICKER: CHOOSE ANY HOUR (1-12) & ANY MINUTE (0-59)
    // ─────────────────────────────────────────────────────────────
    const [selectedHour, setSelectedHour] = useState<number>(3);
    const [selectedMinute, setSelectedMinute] = useState<number>(13);
    const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM');

    const [occupiedIntervals, setOccupiedIntervals] = useState<BookingInterval[]>([]);
    const [loadingIntervals, setLoadingIntervals] = useState<boolean>(false);
    const [selectedSnacks, setSelectedSnacks] = useState<string[]>([]);

    // Convert picker selection into 24-hour time string (e.g. "15:13" or "01:30")
    const time24 = useMemo(() => {
        let h24 = selectedHour;
        if (selectedPeriod === 'PM' && selectedHour < 12) h24 += 12;
        if (selectedPeriod === 'AM' && selectedHour === 12) h24 = 0;
        return `${String(h24).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    }, [selectedHour, selectedMinute, selectedPeriod]);

    // Construct exact start datetime
    const startDateTime = useMemo(() => {
        return createDateTimeFromBusinessDate(selectedDate, time24);
    }, [selectedDate, time24]);

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

    // Sort booked intervals chronologically for display
    const sortedBookings = useMemo(() => {
        return [...occupiedIntervals].sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [occupiedIntervals]);

    // Dynamic continuous timeline segments
    const timelineSegments = useMemo(() => {
        return getTimelineSegments(selectedDate, occupiedIntervals);
    }, [selectedDate, occupiedIntervals]);

    // Evaluate availability for the freely picked start time & duration
    const currentAvailability = useMemo(() => {
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
            formattedStart: formatArabicTimeFromDate(startDateTime),
            formattedEnd: formatArabicTimeFromDate(endDateTime),
        };
    }, [startDateTime, durationHours, selectedDate, occupiedIntervals]);

    // Duration change
    const handleDurationChange = (newDuration: number) => {
        playPs5SelectSound();
        const clamped = Math.max(
            OPERATING_HOURS.MIN_DURATION_HOURS,
            Math.min(OPERATING_HOURS.MAX_DURATION_HOURS, newDuration)
        );
        setDurationHours(clamped);
    };

    // Quick Time Preset Click
    const handleQuickPreset = (preset: typeof QUICK_START_PRESETS[0]) => {
        playPs5NavigateSound();
        setSelectedHour(preset.hour);
        setSelectedMinute(preset.minute);
        setSelectedPeriod(preset.period);
    };

    // Hour Steppers
    const stepHour = (delta: number) => {
        playPs5NavigateSound();
        let newH = selectedHour + delta;
        if (newH > 12) newH = 1;
        if (newH < 1) newH = 12;
        setSelectedHour(newH);
    };

    // Minute Steppers
    const stepMinute = (delta: number) => {
        playPs5NavigateSound();
        let newM = selectedMinute + delta;
        let newH = selectedHour;
        let newP = selectedPeriod;

        if (newM >= 60) {
            newM = newM % 60;
            newH = newH + 1;
            if (newH > 12) {
                newH = 1;
            }
            if (newH === 12) {
                newP = newP === 'AM' ? 'PM' : 'AM';
            }
        } else if (newM < 0) {
            newM = 60 + newM;
            newH = newH - 1;
            if (newH < 1) {
                newH = 12;
            }
            if (newH === 11) {
                newP = newP === 'AM' ? 'PM' : 'AM';
            }
        }

        setSelectedHour(newH);
        setSelectedMinute(newM);
        setSelectedPeriod(newP);
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

    const isReadyToContinue = currentAvailability.isAvailable;

    const handleContinue = () => {
        if (!isReadyToContinue) {
            if (currentAvailability.reason === 'PAST_TIME') {
                toast.error('هذا الوقت قد مضى، يرجى اختيار موعد قادم ⏳');
            } else if (currentAvailability.reason === 'EXCEEDS_CLOSING') {
                toast.error('هذا الموعد مع المدة المحددة يتجاوز موعد إغلاق الصالة (04:00 ص) ⚠️');
            } else if (currentAvailability.reason === 'OVERLAP_CONFLICT') {
                const conf = currentAvailability.conflictingInterval;
                const confMsg = conf
                    ? `يتعارض مع حجز قائم من ${formatArabicTimeFromDate(conf.start)} إلى ${formatArabicTimeFromDate(conf.end)} 🔒`
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
                startDateTime: currentAvailability.startDateTime.toISOString(),
                endDateTime: currentAvailability.endDateTime.toISOString(),
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
                                حجز الغرفة والجدول الزمني المباشر
                            </h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-brush text-xs sm:text-sm text-red-600 dark:text-red-500 font-bold tracking-wider">D95</span>
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold tracking-widest uppercase">REAL-TIME TIMELINE</span>
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

                    <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-black">
                        <img
                            src={currentRoom.interiorImg}
                            alt={currentRoom.name}
                            className="w-full h-full object-cover brightness-95 contrast-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/30" />

                        <div className="absolute top-3 right-3 z-10 flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/85 border border-white/15 backdrop-blur-md shadow-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                            <span className="text-[11px] font-bold text-neutral-200 tracking-wide font-sans">
                                الغرفة متاحة افتراضياً طوال اليوم
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

                {/* ─────────────────────────────────────────────────────────────
                    PROMINENT SECTION: CURRENTLY BOOKED INTERVALS FOR TODAY
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] rounded-xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                            <Lock className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span>الأوقات المحجوزة مسبقاً في ({currentRoom.nameEn}) لهذا اليوم:</span>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/[0.04] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10 font-bold">
                            {sortedBookings.length} {sortedBookings.length === 1 ? 'فترة محجوزة' : 'فترات محجوزة'}
                        </span>
                    </div>

                    {sortedBookings.length === 0 ? (
                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-600/40 text-emerald-950 dark:text-emerald-200 text-xs flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div className="font-medium leading-relaxed">
                                🎉 <strong>الغرفة متاحة بالكامل طوال اليوم!</strong> لا يوجد أي حجز مسجل حتى الآن. يمكنك اختيار أي وقت تريده (مثلاً من 03:13 إلى 04:13 أو أي ساعة أخرى).
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {sortedBookings.map((b, bIdx) => (
                                    <div
                                        key={bIdx}
                                        className="p-2.5 rounded-lg bg-red-50 dark:bg-[#201013] border border-red-200 dark:border-red-900/50 flex items-center justify-between text-xs shadow-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Lock className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                                            <div className="flex flex-col">
                                                <span className="font-mono font-bold text-red-800 dark:text-red-200 text-[11px] sm:text-xs" dir="ltr">
                                                    {formatArabicTimeFromDate(b.start)} ➔ {formatArabicTimeFromDate(b.end)}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-mono font-bold bg-red-200/70 dark:bg-red-950 text-red-800 dark:text-red-300 px-1.5 py-0.5 rounded border border-red-300 dark:border-red-800/40">
                                            محجوز 🔒
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium px-1 flex items-center gap-1.5">
                                <Info size={13} className="text-neutral-400 shrink-0" />
                                <span>جميع أوقات اليوم الأخرى غير المذكورة أعلاه متاحة لك بالكامل ويمكنك حجزها فوراً.</span>
                            </p>
                        </div>
                    )}
                </section>

                {/* CONTINUOUS TIMELINE VISUALIZER (08:00 AM -> 04:00 AM) */}
                <section className="bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] rounded-xl p-3.5 sm:p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                            <Layers className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span>المخطط الزمني المباشر (20 ساعة عمل مستمرة):</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-mono">
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" /> متاح
                            </span>
                            <span className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                                <span className="w-2 h-2 rounded-full bg-red-600" /> محجوز
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
                                    className="absolute top-0 bottom-0 bg-red-600/90 border-x border-red-500 shadow-inner flex items-center justify-center text-[9px] font-mono font-bold text-white overflow-hidden"
                                >
                                    <span className="truncate px-1 opacity-90">محجوز 🔒</span>
                                </div>
                            );
                        })}

                        {/* Selected User Segment Overlay */}
                        {currentAvailability.isAvailable && (
                            (() => {
                                const { opening, closing } = getBusinessOperatingWindow(selectedDate);
                                const totalMs = closing.getTime() - opening.getTime();
                                const startMs = startDateTime.getTime() - opening.getTime();
                                const durationMs = durationHours * 3600 * 1000;
                                const leftPercent = Math.max(0, (startMs / totalMs) * 100);
                                const widthPercent = Math.min(100 - leftPercent, (durationMs / totalMs) * 100);

                                return (
                                    <div
                                        style={{
                                            left: `${leftPercent}%`,
                                            width: `${widthPercent}%`,
                                        }}
                                        className="absolute top-0 bottom-0 bg-white dark:bg-white text-black font-mono font-black text-[10px] border-2 border-red-600 z-10 flex items-center justify-center shadow-lg"
                                    >
                                        <span className="truncate px-1 font-bold">جلسة طلبك ⭐</span>
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
                        <span>12:00 AM</span>
                        <span>04:00 AM (Close)</span>
                    </div>
                </section>

                {/* STEP 3: DURATION SELECTOR */}
                <section className="bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] rounded-xl p-3.5 sm:p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-900 dark:text-white font-bold">
                            <Clock className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span>3. كم ساعة تريد أن تلعب؟ (الحد الأدنى: ساعة واحدة):</span>
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

                {/* ─────────────────────────────────────────────────────────────
                    STEP 4: EXACT FREE TIME PICKER (WRITE OR PICK ANY MINUTE)
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] rounded-xl p-3.5 sm:p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-white/[0.08]">
                        <div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-red-600 dark:text-red-500" />
                                <h2 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white font-body">
                                    4. حدد وقت بداية لعبك بحرية تامة (بالدقيقة التي تختارها):
                                </h2>
                            </div>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 font-medium">
                                اكتب أو اختر أي وقت يناسبك (مثلاً من 03:13 إلى 04:13) • النظام يفحص التوافر فوراً
                            </p>
                        </div>
                    </div>

                    {/* QUICK PRESETS ROW */}
                    <div>
                        <div className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-2 flex items-center gap-1.5">
                            <Sparkles size={13} className="text-red-600" />
                            <span>أوقات شائعة سريعة بلمسة واحدة:</span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                            {QUICK_START_PRESETS.map((preset, pIdx) => {
                                const isCurrent =
                                    selectedHour === preset.hour &&
                                    selectedMinute === preset.minute &&
                                    selectedPeriod === preset.period;

                                return (
                                    <button
                                        key={pIdx}
                                        onClick={() => handleQuickPreset(preset)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                                            isCurrent
                                                ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                                                : 'bg-neutral-50 dark:bg-[#181215] border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-white/20'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* TACTILE TIME CONSOLE WITH EXACT NUMERIC INPUTS */}
                    <div className="bg-neutral-50 dark:bg-[#151113] border border-neutral-200 dark:border-white/10 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
                        {/* Time Inputs Block */}
                        <div className="flex flex-col items-center gap-2 w-full md:w-auto">
                            <div className="flex items-center gap-3" dir="ltr">
                                {/* Hour Input & Steppers */}
                                <div className="flex flex-col items-center">
                                    <button
                                        onClick={() => stepHour(1)}
                                        className="w-10 h-7 flex items-center justify-center rounded bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-700 dark:text-white cursor-pointer transition-all active:scale-95 text-xs font-bold"
                                        aria-label="زيادة الساعة"
                                    >
                                        ▲
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max="12"
                                        value={selectedHour}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            if (isNaN(val)) {
                                                setSelectedHour(1);
                                            } else {
                                                setSelectedHour(Math.max(1, Math.min(12, val)));
                                            }
                                        }}
                                        className="w-16 h-16 sm:w-20 sm:h-20 my-1 text-center font-mono font-black text-2xl sm:text-4xl rounded-xl bg-white dark:bg-black/90 border-2 border-neutral-300 dark:border-white/20 focus:border-red-600 dark:focus:border-red-500 outline-none tabular-nums shadow-md text-neutral-900 dark:text-white"
                                    />
                                    <button
                                        onClick={() => stepHour(-1)}
                                        className="w-10 h-7 flex items-center justify-center rounded bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-700 dark:text-white cursor-pointer transition-all active:scale-95 text-xs font-bold"
                                        aria-label="تقليل الساعة"
                                    >
                                        ▼
                                    </button>
                                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-1 uppercase font-bold tracking-wider">الساعة (1-12)</span>
                                </div>

                                <span className="font-mono font-black text-3xl sm:text-4xl text-red-600 mb-6">:</span>

                                {/* Minute Input & Steppers (ANY MINUTE 00-59) */}
                                <div className="flex flex-col items-center">
                                    <button
                                        onClick={() => stepMinute(1)}
                                        className="w-10 h-7 flex items-center justify-center rounded bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-700 dark:text-white cursor-pointer transition-all active:scale-95 text-xs font-bold"
                                        aria-label="زيادة الدقيقة"
                                    >
                                        ▲
                                    </button>
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={selectedMinute}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            if (isNaN(val)) {
                                                setSelectedMinute(0);
                                            } else {
                                                setSelectedMinute(Math.max(0, Math.min(59, val)));
                                            }
                                        }}
                                        className="w-16 h-16 sm:w-20 sm:h-20 my-1 text-center font-mono font-black text-2xl sm:text-4xl rounded-xl bg-white dark:bg-black/90 border-2 border-neutral-300 dark:border-white/20 focus:border-red-600 dark:focus:border-red-500 outline-none tabular-nums shadow-md text-neutral-900 dark:text-white"
                                    />
                                    <button
                                        onClick={() => stepMinute(-1)}
                                        className="w-10 h-7 flex items-center justify-center rounded bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-700 dark:text-white cursor-pointer transition-all active:scale-95 text-xs font-bold"
                                        aria-label="تقليل الدقيقة"
                                    >
                                        ▼
                                    </button>
                                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-1 uppercase font-bold tracking-wider">الدقيقة (0-59)</span>
                                </div>

                                {/* AM / PM Toggle Box */}
                                <div className="flex flex-col gap-2 ml-2 mb-6">
                                    <button
                                        onClick={() => {
                                            setSelectedPeriod('PM');
                                            playPs5NavigateSound();
                                        }}
                                        className={`px-3.5 py-2.5 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer border ${
                                            selectedPeriod === 'PM'
                                                ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-600/30'
                                                : 'bg-white dark:bg-black/60 border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                                        }`}
                                    >
                                        مساءً (م)
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedPeriod('AM');
                                            playPs5NavigateSound();
                                        }}
                                        className={`px-3.5 py-2.5 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer border ${
                                            selectedPeriod === 'AM'
                                                ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-600/30'
                                                : 'bg-white dark:bg-black/60 border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                                        }`}
                                    >
                                        صباحاً (ص)
                                    </button>
                                </div>
                            </div>

                            {/* Browser Native Clock Sync Shortcut */}
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">أو اختر من ساعة جهازك:</span>
                                <input
                                    type="time"
                                    value={time24}
                                    onChange={(e) => {
                                        if (!e.target.value) return;
                                        const [hStr, mStr] = e.target.value.split(':');
                                        let h = parseInt(hStr, 10);
                                        const m = parseInt(mStr, 10);
                                        const p = h >= 12 ? 'PM' : 'AM';
                                        if (h > 12) h -= 12;
                                        if (h === 0) h = 12;
                                        setSelectedHour(h);
                                        setSelectedMinute(m);
                                        setSelectedPeriod(p);
                                    }}
                                    className="px-2.5 py-1 rounded bg-white dark:bg-black/60 border border-neutral-300 dark:border-white/15 text-xs font-mono font-bold cursor-pointer text-red-600 dark:text-red-400 outline-none"
                                />
                            </div>
                        </div>

                        {/* Visual Summary Calculation Panel */}
                        <div className="flex-1 w-full p-4 rounded-xl bg-white dark:bg-[#181215] border border-neutral-200 dark:border-white/10 flex flex-col justify-between space-y-3">
                            <div className="space-y-1 text-right">
                                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-bold">
                                    تفاصيل الجلسة المحسوبة تلقائياً:
                                </div>
                                <div className="flex items-baseline justify-between border-b border-neutral-200 dark:border-white/10 pb-2">
                                    <span className="text-xs text-neutral-600 dark:text-neutral-400">وقت البدء المختار:</span>
                                    <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                                        {currentAvailability.formattedStart}
                                    </span>
                                </div>
                                <div className="flex items-baseline justify-between border-b border-neutral-200 dark:border-white/10 pb-2">
                                    <span className="text-xs text-neutral-600 dark:text-neutral-400">مدة الجلسة:</span>
                                    <span className="font-mono font-bold text-sm text-red-600 dark:text-red-400">
                                        {durationHours} {durationHours === 1 ? 'ساعة' : 'ساعات'}
                                    </span>
                                </div>
                                <div className="flex items-baseline justify-between pt-1">
                                    <span className="text-xs font-bold text-neutral-900 dark:text-white">وقت الانتهاء المحسوب:</span>
                                    <span className="font-mono font-black text-base text-neutral-900 dark:text-white">
                                        {currentAvailability.formattedEnd}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* REAL-TIME AVAILABILITY NOTIFICATION CALLOUT */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${currentAvailability.isAvailable}-${currentAvailability.reason}-${startDateTime.getTime()}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                                currentAvailability.isAvailable
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600/40 text-emerald-950 dark:text-emerald-200'
                                    : currentAvailability.reason === 'PAST_TIME'
                                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-600/40 text-amber-950 dark:text-amber-200'
                                    : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-600/40 text-red-950 dark:text-red-200'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {currentAvailability.isAvailable ? (
                                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : (
                                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0" />
                                )}
                                <div>
                                    <div className="font-bold text-sm">
                                        {currentAvailability.isAvailable
                                            ? 'الموعد متاح بالكامل ومؤكد للحجز'
                                            : currentAvailability.reason === 'PAST_TIME'
                                            ? 'هذا التوقيت قد مضى بالفعل (يرجى اختيار موعد قادم)'
                                            : currentAvailability.reason === 'EXCEEDS_CLOSING'
                                            ? 'الموعد مع المدة المحددة يتجاوز موعد إغلاق الصالة (04:00 ص فجراً)'
                                            : currentAvailability.conflictingInterval
                                            ? `عذراً، هذا التوقيت يتعارض مع حجز قائم من ${formatArabicTimeFromDate(currentAvailability.conflictingInterval.start)} إلى ${formatArabicTimeFromDate(currentAvailability.conflictingInterval.end)}`
                                            : 'عذراً، هذا التوقيت يتعارض مع حجز قائم للغرفة'}
                                    </div>
                                    <div className="text-xs font-mono mt-0.5 opacity-90 flex items-center gap-2">
                                        <span>من: {currentAvailability.formattedStart}</span>
                                        <span>➔</span>
                                        <span>إلى: {currentAvailability.formattedEnd}</span>
                                        <span>({durationHours} {durationHours === 1 ? 'ساعة' : 'ساعات'})</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-left font-mono font-bold text-base shrink-0" dir="ltr">
                                {roomSubtotal} EGP
                            </div>
                        </motion.div>
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
                            <span className="text-[10px] font-mono font-bold text-red-700 dark:text-red-300 mr-1 bg-red-100 dark:bg-red-950/80 px-2 py-0.5 rounded border border-red-300 dark:border-red-600/40 whitespace-nowrap">
                                {durationHours} {durationHours === 1 ? 'HOUR' : 'HOURS'}
                            </span>
                        </div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5 font-medium">
                            <span className="font-mono font-bold text-neutral-900 dark:text-white uppercase">{currentRoom.nameEn}</span>
                            <span>•</span>
                            <div dir="rtl" className="flex items-center gap-1 text-red-600 dark:text-red-400 font-mono font-bold tabular-nums text-[11px]">
                                <span>{currentAvailability.formattedStart}</span>
                                <span>➔</span>
                                <span>{currentAvailability.formattedEnd}</span>
                            </div>
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
                        <span>{isReadyToContinue ? 'تأكيد الحجز والدفع' : 'الموعد غير متاح'}</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
}
