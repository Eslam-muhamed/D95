import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowRight,
    Calendar,
    Clock,
    Coffee,
    Check,
    Lock,
    DoorClosed,
    Tv,
    Zap,
    Droplets,
    Radio,
    Shield,
    Sun,
    Moon,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import room01InteriorImg from '@/assets/doors/room-01-interior.jpg';
import room02InteriorImg from '@/assets/doors/room-02-interior.jpg';
import { useTheme } from '@/stores/themeStore';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';

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
        bookedSlotsIndices: [2, 5], // Mock occupied slots
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
        bookedSlotsIndices: [1, 4], // Mock occupied slots
    },
];

interface DynamicSlot {
    id: string;
    index: number;
    startDisplay: string;
    endDisplay: string;
    periodName: string;
    isBooked: boolean;
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
}

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

    // Generate 7-day dynamic calendar list
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
    const isToday = selectedDate === calendarDays[0].iso;

    // ─────────────────────────────────────────────────────────────
    // DYNAMIC 1-HOUR SLOTS GENERATOR (FROM EXACT CURRENT TIME)
    // ─────────────────────────────────────────────────────────────
    const generatedSlots = useMemo(() => {
        const now = new Date();
        let baseHour = now.getHours();
        let baseMinute = now.getMinutes();

        // If not today, slots start at venue opening time (08:00 AM)
        if (!isToday) {
            baseHour = 8;
            baseMinute = 0;
        }

        const formatArabicTime = (h: number, m: number) => {
            const period = h >= 12 && h < 24 ? 'م' : 'ص';
            const displayH = h % 12 === 0 ? 12 : h % 12;
            return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
        };

        const getPeriodName = (h: number) => {
            if (h >= 6 && h < 12) return 'الفترة الصباحية';
            if (h >= 12 && h < 16) return 'فترة الظهيرة';
            if (h >= 16 && h < 19) return 'فترة العصر';
            if (h >= 19 && h < 24) return 'الفترة المسائية';
            return 'فترة السهرة والليل';
        };

        const slots: DynamicSlot[] = [];
        const bookedSet = new Set(currentRoom.bookedSlotsIndices || []);

        // Generate next 12 consecutive 1-hour slots
        for (let i = 0; i < 12; i++) {
            const startTotalMinutes = (baseHour + i) * 60 + baseMinute;
            const endTotalMinutes = startTotalMinutes + 60;

            const slotStartHour = Math.floor(startTotalMinutes / 60) % 24;
            const slotStartMinute = startTotalMinutes % 60;
            const slotEndHour = Math.floor(endTotalMinutes / 60) % 24;
            const slotEndMinute = endTotalMinutes % 60;

            slots.push({
                id: `slot-${i}`,
                index: i,
                startDisplay: formatArabicTime(slotStartHour, slotStartMinute),
                endDisplay: formatArabicTime(slotEndHour, slotEndMinute),
                periodName: getPeriodName(slotStartHour),
                isBooked: bookedSet.has(i),
                startHour: slotStartHour,
                startMinute: slotStartMinute,
                endHour: slotEndHour,
                endMinute: slotEndMinute,
            });
        }

        return slots;
    }, [isToday, currentRoom]);

    // Track selected slot indices
    const [selectedSlotIndices, setSelectedSlotIndices] = useState<number[]>([0]);
    const [selectedSnacks, setSelectedSnacks] = useState<string[]>([]);

    // Reset selection when room or date changes
    useEffect(() => {
        const firstAvailable = generatedSlots.find((s) => !s.isBooked);
        if (firstAvailable) {
            setSelectedSlotIndices([firstAvailable.index]);
        }
    }, [generatedSlots]);

    // Handle single or multi-slot selection (Contiguous 1hr chunks)
    const handleSlotClick = (slot: DynamicSlot) => {
        if (slot.isBooked) {
            toast.error('هذا الوقت محجوز مسبقاً 🔒');
            return;
        }

        // Play authentic PS5 UI game browsing sound mapped to slot pitch
        playPs5NavigateSound(slot.index);

        if (selectedSlotIndices.length === 0) {
            setSelectedSlotIndices([slot.index]);
            return;
        }

        const minIdx = Math.min(...selectedSlotIndices);
        const maxIdx = Math.max(...selectedSlotIndices);

        if (slot.index === minIdx - 1) {
            setSelectedSlotIndices([slot.index, ...selectedSlotIndices].sort((a, b) => a - b));
            return;
        }

        if (slot.index === maxIdx + 1) {
            setSelectedSlotIndices([...selectedSlotIndices, slot.index].sort((a, b) => a - b));
            return;
        }

        if (selectedSlotIndices.includes(slot.index)) {
            if (selectedSlotIndices.length === 1) return;
            if (slot.index === minIdx) {
                setSelectedSlotIndices(selectedSlotIndices.filter((i) => i !== slot.index));
                return;
            }
            if (slot.index === maxIdx) {
                setSelectedSlotIndices(selectedSlotIndices.filter((i) => i !== slot.index));
                return;
            }
        }

        setSelectedSlotIndices([slot.index]);
    };

    // Quick duration handler
    const handleQuickDuration = (hours: number) => {
        playPs5SelectSound();
        const firstIdx = selectedSlotIndices[0] ?? 0;
        const newIndices: number[] = [];
        for (let i = 0; i < hours; i++) {
            const targetIdx = firstIdx + i;
            const targetSlot = generatedSlots.find((s) => s.index === targetIdx);
            if (targetSlot && !targetSlot.isBooked) {
                newIndices.push(targetIdx);
            } else {
                break;
            }
        }
        if (newIndices.length > 0) {
            setSelectedSlotIndices(newIndices);
        }
    };

    const toggleSnack = (id: string) => {
        playPs5NavigateSound();
        setSelectedSnacks((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const durationHours = selectedSlotIndices.length;
    const roomSubtotal = durationHours * currentRoom.rate;

    const snacksTotal = useMemo(() => {
        return selectedSnacks.reduce((sum, sId) => {
            const item = SNACK_OPTIONS.find((s) => s.id === sId);
            return sum + (item ? item.price : 0);
        }, 0);
    }, [selectedSnacks]);

    const grandTotal = roomSubtotal + snacksTotal;

    const startSlot = generatedSlots.find((s) => s.index === Math.min(...selectedSlotIndices));
    const endSlot = generatedSlots.find((s) => s.index === Math.max(...selectedSlotIndices));
    const startDisplayTime = startSlot?.startDisplay || '00:00';
    const endDisplayTime = endSlot?.endDisplay || '00:00';

    const handleContinue = () => {
        if (selectedSlotIndices.length === 0) {
            toast.error('برجاء اختيار وقت الجلسة');
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
                startTime: startDisplayTime,
                endTime: endDisplayTime,
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
            {/* ─────────────────────────────────────────────────────────────
                D95 RAW INDUSTRIAL TEXTURE & ATMOSPHERIC BACKDROP
               ───────────────────────────────────────────────────────────── */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[420px] bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(220,38,38,0.12)_0%,transparent_70%)] blur-[70px]" />
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
                                حجز الغرفة ومواعيد اليوم
                            </h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-brush text-xs sm:text-sm text-red-600 dark:text-red-500 font-bold tracking-wider">D95</span>
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold tracking-widest uppercase">ESPORTS LOUNGE</span>
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

                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-300 text-xs font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide">DISPATCH</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative z-10 w-full pt-20 pb-36 px-3.5 sm:px-6 max-w-4xl mx-auto space-y-4" dir="rtl">
                <section className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-white/[0.12] bg-white dark:bg-[#120e10] shadow-md dark:shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent z-20" />

                    <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-black">
                        <img
                            src={currentRoom.interiorImg}
                            alt={currentRoom.name}
                            className="w-full h-full object-cover brightness-95 contrast-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />

                        <div className="absolute top-3 right-3 z-10 flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/85 border border-white/15 backdrop-blur-md shadow-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                            <span className="text-[11px] font-bold text-neutral-200 tracking-wide font-sans">
                                تم فتح الباب والدخول بنجاح
                            </span>
                        </div>

                        <div className="absolute bottom-3 inset-x-3 sm:inset-x-5 z-10 flex items-end justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono font-black tracking-widest uppercase px-2 py-0.5 rounded bg-red-950/80 border border-red-600/50 text-red-300">
                                        {currentRoom.nameEn}
                                    </span>
                                    <span className="text-[11px] font-bold text-white font-sans">
                                        PlayStation 5 Suite
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
                {/* ─────────────────────────────────────────────────────────────
                    SECTION 1: TACTICAL ROOM SELECTOR TABS (ROOM 01 vs ROOM 02)
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] rounded-xl p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center justify-between px-1 mb-2.5">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                            <DoorClosed className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span>تحديد الغرفة:</span>
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
                                    {/* Active Top Accent Line */}
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

                {/* ─────────────────────────────────────────────────────────────
                    SECTION 2: COMPETITION FIXTURE DATE SELECTOR (7 DAYS)
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] rounded-xl p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-900 dark:text-white font-bold">
                            <Calendar className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span>تاريخ الجلسة:</span>
                        </div>
                        {isToday && (
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/40 flex items-center gap-1.5 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>يبدأ فوراً من الوقت الحالي</span>
                            </span>
                        )}
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
                                    {/* Top racing red accent */}
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
                    SECTION 3: TACTICAL 4-COLUMN TIME SLOTS DISPATCH BOARD
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] rounded-xl p-3.5 sm:p-5 shadow-sm">
                    {/* Header: Title + Tactical Duration Pills */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-200 dark:border-white/[0.08]">
                        <div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-red-600 dark:text-red-500" />
                                <h2 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white font-body">
                                    الأوقات المتاحة للحجز ({currentRoom.nameEn})
                                </h2>
                            </div>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 font-medium">
                                انقر لاختيار ساعة أو أكثر متتالية • الحساب ديناميكي يبدأ من التوقيت الفعلي
                            </p>
                        </div>

                        {/* Tactical Duration Switcher */}
                        <div className="flex items-center gap-1 self-start sm:self-auto bg-neutral-100 dark:bg-black/60 p-1 rounded-lg border border-neutral-200 dark:border-white/10">
                            <span className="text-[11px] font-mono uppercase text-neutral-500 dark:text-neutral-400 px-1.5 font-bold">المدة:</span>
                            {[1, 2, 3, 4].map((h) => (
                                <button
                                    key={h}
                                    onClick={() => handleQuickDuration(h)}
                                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                                        durationHours === h
                                            ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]'
                                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/[0.06]'
                                    }`}
                                >
                                    {h}H
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Technical Status Legend */}
                    <div className="flex items-center gap-4 text-xs mb-3 px-1 font-mono">
                        <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                            <span className="w-2 h-2 rounded-sm bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                            <span className="text-[11px]">متاح للحجز</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold">
                            <span className="w-2 h-2 rounded-sm bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.8)]" />
                            <span className="text-[11px]">محدد لجلستك</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500">
                            <span className="w-2 h-2 rounded-sm bg-neutral-300 dark:bg-neutral-700" />
                            <span className="text-[11px]">محجوز مسبقاً</span>
                        </div>
                    </div>

                    {/* 4-COLUMN DISPATCH GRID */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
                        {generatedSlots.map((slot) => {
                            const isSelected = selectedSlotIndices.includes(slot.index);
                            const isBooked = slot.isBooked;

                            return (
                                <motion.div
                                    key={slot.id}
                                    whileTap={!isBooked ? { scale: 0.98 } : undefined}
                                    onClick={() => handleSlotClick(slot)}
                                    className={`relative p-2.5 rounded-lg border transition-all duration-150 select-none cursor-pointer flex flex-col justify-between overflow-hidden ${
                                        isBooked
                                            ? 'bg-neutral-100 dark:bg-black/30 border-neutral-200 dark:border-white/[0.04] text-neutral-400 dark:text-neutral-600 opacity-40 cursor-not-allowed'
                                            : isSelected
                                            ? 'bg-gradient-to-b from-red-50 to-red-100/70 dark:from-[#2a1317] dark:to-[#170d10] border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.2)]'
                                            : 'bg-neutral-50 dark:bg-[#151113] border-neutral-200 dark:border-white/[0.08] hover:border-red-600/60 hover:bg-neutral-100 dark:hover:bg-[#1b1518] text-neutral-900 dark:text-white'
                                    }`}
                                >
                                    {/* Active Top Red Accent */}
                                    {isSelected && (
                                        <div className="absolute top-0 inset-x-0 h-[2px] bg-red-600" />
                                    )}

                                    {/* Top Line: Period Name + Status Tag */}
                                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                                        <span className={`font-semibold text-[10px] sm:text-[11px] ${isSelected ? 'text-red-700 dark:text-red-300 font-bold' : 'text-neutral-500 dark:text-neutral-400'}`}>
                                            {slot.periodName}
                                        </span>
                                        {isBooked ? (
                                            <span className="flex items-center gap-1 text-neutral-400 dark:text-neutral-500 font-mono text-[10px]">
                                                <Lock className="w-2.5 h-2.5" />
                                                <span>BOOKED</span>
                                            </span>
                                        ) : isSelected ? (
                                            <span className="flex items-center gap-1 text-red-700 dark:text-red-200 font-bold text-[10px] bg-red-100 dark:bg-red-950/80 px-1.5 py-0.2 rounded border border-red-300 dark:border-red-600/50">
                                                <Check className="w-2.5 h-2.5 stroke-[3] text-red-600 dark:text-red-400" />
                                                <span>محدد</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span>OPEN</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Center: Sharp Digital Time Readout */}
                                    <div className="text-center my-1">
                                        <div
                                            dir="rtl"
                                            className={`font-mono text-xs sm:text-sm flex items-center justify-center gap-1.5 ${
                                                isBooked
                                                    ? 'text-neutral-400 dark:text-neutral-600 line-through'
                                                    : isSelected
                                                    ? 'text-neutral-900 dark:text-white font-black'
                                                    : 'text-neutral-800 dark:text-neutral-200 font-bold'
                                            }`}
                                        >
                                            <span className="tabular-nums">{slot.startDisplay}</span>
                                            <span className={`text-[11px] ${isSelected ? 'text-red-600 dark:text-red-400 font-black' : 'text-neutral-400 dark:text-neutral-500'}`}>➔</span>
                                            <span className="tabular-nums">{slot.endDisplay}</span>
                                        </div>
                                    </div>

                                    {/* Bottom Line: Duration & Rate */}
                                    <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-neutral-200 dark:border-white/[0.06] text-[10px] sm:text-[11px]">
                                        <span className={isSelected ? 'text-neutral-700 dark:text-neutral-300 font-medium' : 'text-neutral-500 dark:text-neutral-400 font-medium'}>
                                            جلسة 60 دقيقة
                                        </span>
                                        <span className={`font-mono font-bold ${isSelected ? 'text-red-600 dark:text-red-400 font-black' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                            {currentRoom.rate} ج.م
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    SECTION 4: GAMING FUEL & ENERGY (RECHARGE ADDONS)
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] rounded-xl p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-900 dark:text-white font-bold">
                            <Zap className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span>سناكس ومشروبات الطاقة والتركيز (اختياري)</span>
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

            {/* ─────────────────────────────────────────────────────────────
                FIXED BOTTOM ATHLETIC SUMMARY BAR (HIGH-CONTRAST CHISELED)
               ───────────────────────────────────────────────────────────── */}
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
                                <span>{startDisplayTime}</span>
                                <span>➔</span>
                                <span>{endDisplayTime}</span>
                            </div>
                        </div>
                    </div>

                    {/* High-Performance Checkout CTA */}
                    <button
                        onClick={handleContinue}
                        className="py-3 px-6 sm:px-8 rounded-lg bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-red-600/30 active:scale-95 transition-all cursor-pointer shrink-0 border border-red-500/60 uppercase tracking-wide font-sans"
                    >
                        <span>تأكيد الحجز والدفع</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
}
