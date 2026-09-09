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
} from 'lucide-react';
import { toast } from 'sonner';

import room01InteriorImg from '@/assets/doors/room-01-interior.jpg';
import room02InteriorImg from '@/assets/doors/room-02-interior.jpg';
import { useTheme } from '@/stores/themeStore';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';
import {
    BookingInterval,
    createDateTimeFromBusinessDate,
    calculateEndDateTime,
    formatArabicTimeFromDate,
    getBusinessOperatingWindow,
    checkAvailability,
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

export default function BookingDetailsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

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
    const [durationHours, setDurationHours] = useState<number>(1);

    // Exact Time Selection (Hour 1-12, Minute 0-59, Period AM/PM)
    const [selectedHour, setSelectedHour] = useState<number>(4);
    const [selectedMinute, setSelectedMinute] = useState<number>(0);
    const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM');

    const [occupiedIntervals, setOccupiedIntervals] = useState<BookingInterval[]>([]);
    const [loadingIntervals, setLoadingIntervals] = useState<boolean>(false);

    // Convert picker selection into 24-hour time string
    const time24 = useMemo(() => {
        let h24 = selectedHour;
        if (selectedPeriod === 'PM' && selectedHour < 12) h24 += 12;
        if (selectedPeriod === 'AM' && selectedHour === 12) h24 = 0;
        return `${String(h24).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    }, [selectedHour, selectedMinute, selectedPeriod]);

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
    };

    // Construct start datetime
    const startDateTime = useMemo(() => {
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

    // Real-time availability evaluation
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

    const roomSubtotal = Math.round(durationHours * currentRoom.rate);
    const isReadyToContinue = currentAvailability.isAvailable;

    const handleContinue = () => {
        if (!isReadyToContinue) {
            if (currentAvailability.reason === 'PAST_TIME') {
                toast.error('هذا الوقت قد مضى، يرجى اختيار موعد قادم ⏳');
            } else if (currentAvailability.reason === 'EXCEEDS_CLOSING') {
                toast.error('الموعد مع المدة المحددة يتجاوز موعد إغلاق الصالة (04:00 ص) ⚠️');
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
                snacks: [],
                snacksTotal: 0,
                total: roomSubtotal,
            },
        });
    };

    return (
        <div className="min-h-screen w-full bg-[#f8f9fb] dark:bg-[#090708] text-neutral-900 dark:text-[#eae6e8] font-body text-sm flex flex-col selection:bg-red-600 selection:text-white relative select-none transition-colors duration-200">
            {/* Minimal Header */}
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

                    <button
                        onClick={toggleTheme}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-neutral-200/80 dark:border-white/10 text-neutral-800 dark:text-neutral-200"
                        aria-label="تبديل المظهر"
                    >
                        {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-neutral-800" />}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative z-10 w-full pt-4 pb-32 px-4 sm:px-6 max-w-2xl mx-auto space-y-4" dir="rtl">

                {/* 1. ROOM SELECTOR (Sleek Segment Switcher) */}
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

                {/* 2. DATE SELECTOR (Clean Horizontal Calendar) */}
                <div className="bg-white dark:bg-[#120e10] border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
                                اختيار يوم الحجز
                            </span>
                        </div>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                            ساعات العمل: 08:00 ص - 04:00 ص
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

                    {/* Compact Booked Intervals (Only shown if reservations exist for this day) */}
                    {sortedBookings.length > 0 && (
                        <div className="pt-2 border-t border-neutral-100 dark:border-white/[0.05] flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0">
                                <Lock size={12} />
                                المواعيد المحجوزة اليوم:
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap" dir="ltr">
                                {sortedBookings.map((b, bIdx) => (
                                    <span
                                        key={bIdx}
                                        className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/10 text-[11px] font-mono font-medium text-neutral-600 dark:text-neutral-300"
                                    >
                                        {formatArabicTimeFromDate(b.start)} ➔ {formatArabicTimeFromDate(b.end)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. TIME & DURATION (Ultra-Clean & Precise) */}
                <div className="bg-white dark:bg-[#120e10] border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
                                وقت البدء ومدة الجلسة
                            </span>
                        </div>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            حدد أي وقت ودقيقة تناسبك
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                        {/* Elegant Digital Time Picker */}
                        <div className="bg-neutral-50 dark:bg-[#151113] border border-neutral-200/80 dark:border-white/10 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-neutral-700 dark:text-neutral-300">وقت البدء:</span>
                                <label className="relative cursor-pointer text-[11px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-medium">
                                    <Clock size={12} />
                                    <span>ساعة النظام</span>
                                    <input
                                        type="time"
                                        value={time24}
                                        onChange={(e) => handleNativeTimeChange(e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                </label>
                            </div>

                            {/* Digital Display & Steppers */}
                            <div className="flex items-center justify-center gap-2 py-1" dir="ltr">
                                {/* Hour Picker */}
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            min="1"
                                            max="12"
                                            value={selectedHour}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value, 10);
                                                setSelectedHour(isNaN(val) ? 1 : Math.max(1, Math.min(12, val)));
                                            }}
                                            className="w-15 h-12 text-center font-mono font-black text-xl rounded-xl bg-white dark:bg-black/70 border border-neutral-300 dark:border-white/20 focus:border-red-600 outline-none text-neutral-900 dark:text-white shadow-xs"
                                        />
                                    </div>
                                    <span className="text-[10px] text-neutral-400 font-medium mt-1">ساعة</span>
                                </div>

                                <span className="font-mono font-black text-xl text-neutral-400 mb-4">:</span>

                                {/* Minute Picker (Accepts ANY minute: 0 to 59) */}
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            min="0"
                                            max="59"
                                            value={selectedMinute}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value, 10);
                                                setSelectedMinute(isNaN(val) ? 0 : Math.max(0, Math.min(59, val)));
                                            }}
                                            className="w-15 h-12 text-center font-mono font-black text-xl rounded-xl bg-white dark:bg-black/70 border border-neutral-300 dark:border-white/20 focus:border-red-600 outline-none text-neutral-900 dark:text-white shadow-xs"
                                        />
                                    </div>
                                    <span className="text-[10px] text-neutral-400 font-medium mt-1">دقيقة</span>
                                </div>

                                {/* AM / PM Switcher */}
                                <div className="flex flex-col gap-1.5 ml-1 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPeriod('PM')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                            selectedPeriod === 'PM'
                                                ? 'bg-red-600 text-white shadow-xs'
                                                : 'bg-white dark:bg-black/50 border border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400'
                                        }`}
                                    >
                                        م
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPeriod('AM')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                            selectedPeriod === 'AM'
                                                ? 'bg-red-600 text-white shadow-xs'
                                                : 'bg-white dark:bg-black/50 border border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400'
                                        }`}
                                    >
                                        ص
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Duration Selector */}
                        <div className="bg-neutral-50 dark:bg-[#151113] border border-neutral-200/80 dark:border-white/10 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                مدة الجلسة:
                            </span>

                            <div className="grid grid-cols-3 gap-1.5">
                                {DURATION_PRESETS.map((hrs) => (
                                    <button
                                        key={hrs}
                                        type="button"
                                        onClick={() => setDurationHours(hrs)}
                                        className={`py-2 px-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer border ${
                                            durationHours === hrs
                                                ? 'bg-red-600 border-red-600 text-white shadow-xs'
                                                : 'bg-white dark:bg-black/50 border-neutral-300/80 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                                        }`}
                                    >
                                        {hrs} {hrs === 1 ? 'ساعة' : 'ساعات'}
                                    </button>
                                ))}
                            </div>

                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between pt-1 border-t border-neutral-200/60 dark:border-white/[0.05]">
                                <span>ينتهي في:</span>
                                <span className="font-mono font-bold text-neutral-900 dark:text-white" dir="ltr">
                                    {currentAvailability.formattedEnd}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Real-Time Availability Inline Feedback */}
                    <div
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                            currentAvailability.isAvailable
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-600/30 text-emerald-900 dark:text-emerald-300'
                                : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-600/40 text-red-900 dark:text-red-200'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {currentAvailability.isAvailable ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                            )}
                            <span className="font-medium">
                                {currentAvailability.isAvailable
                                    ? `الموعد متاح (${currentAvailability.formattedStart} ➔ ${currentAvailability.formattedEnd})`
                                    : currentAvailability.reason === 'PAST_TIME'
                                    ? 'هذا الوقت قد مضى بالفعل، يرجى اختيار موعد قادم'
                                    : currentAvailability.reason === 'EXCEEDS_CLOSING'
                                    ? 'يتجاوز موعد إغلاق الصالة (04:00 ص فجراً)'
                                    : currentAvailability.conflictingInterval
                                    ? `يتعارض مع حجز قائم (${formatArabicTimeFromDate(currentAvailability.conflictingInterval.start)} - ${formatArabicTimeFromDate(currentAvailability.conflictingInterval.end)})`
                                    : 'هذا الوقت غير متاح'}
                            </span>
                        </div>
                        <span className="font-mono font-bold text-xs shrink-0" dir="ltr">
                            {roomSubtotal} ج.م
                        </span>
                    </div>
                </div>

            </main>

            {/* Sticky Professional Bottom Bar */}
            <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0c090a]/95 border-t border-neutral-200 dark:border-white/10 backdrop-blur-xl p-3.5 pb-safe shadow-lg">
                <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
                    {/* Price & Summary */}
                    <div className="flex flex-col text-right">
                        <div className="flex items-baseline gap-1">
                            <span className="font-mono font-black text-2xl tabular-nums text-neutral-900 dark:text-white">
                                {roomSubtotal}
                            </span>
                            <span className="text-xs text-neutral-500 font-bold">ج.م</span>
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 font-medium">
                            <span>{currentRoom.titleAr.split('•')[0].trim()}</span>
                            <span>•</span>
                            <span dir="ltr" className="font-mono">
                                {currentAvailability.formattedStart} - {currentAvailability.formattedEnd}
                            </span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleContinue}
                        disabled={!isReadyToContinue}
                        className={`py-3 px-6 sm:px-8 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border ${
                            isReadyToContinue
                                ? 'bg-red-600 hover:bg-red-500 border-red-500 text-white shadow-md shadow-red-600/25 active:scale-98'
                                : 'bg-neutral-200 dark:bg-white/[0.05] text-neutral-400 dark:text-neutral-500 border-transparent cursor-not-allowed'
                        }`}
                    >
                        <span>{isReadyToContinue ? 'متابعة الحجز' : 'الموعد غير متاح'}</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
}
