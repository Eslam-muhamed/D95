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
    Gamepad2,
    Tv,
    Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import room01InteriorImg from '@/assets/doors/room-01-interior.jpg';
import room02InteriorImg from '@/assets/doors/room-02-interior.jpg';

interface SnackAddon {
    id: string;
    name: string;
    price: number;
    description: string;
    icon: string;
}

const SNACK_OPTIONS: SnackAddon[] = [
    {
        id: 'redbull_combo',
        name: 'كومبو الجيمرز (ريدبول + سناك)',
        price: 55,
        description: 'طاقة وتركيز للجلسات الطويلة',
        icon: '⚡',
    },
    {
        id: 'coffee_specialty',
        name: 'قهوة سبيشالتي دبل إسبريسو',
        price: 40,
        description: 'بُن برازيلي فاخر محمص طازجاً',
        icon: '☕',
    },
    {
        id: 'water_cold',
        name: 'مياه معدنية مثلجة (كبير)',
        price: 15,
        description: 'انتعاش مستمر أثناء اللعب',
        icon: '💧',
    },
];

const AVAILABLE_ROOMS = [
    {
        id: 'room-1',
        name: 'غرفة 01 (Play Room)',
        nameEn: 'ROOM 01',
        titleAr: 'غرفة الأبطال (THE ARENA)',
        rate: 100,
        specs: 'شاشة 65 بوصة 4K 120Hz • 4 دراعات PS5 • ساوند بار سينمائي',
        accentColor: '#00d2ff',
        neonBorder: 'border-[#00d2ff]',
        neonGlow: 'shadow-[0_0_30px_rgba(0,210,255,0.35)]',
        interiorImg: room01InteriorImg,
        bookedSlotsIndices: [2, 5], // Mock occupied slots
    },
    {
        id: 'room-2',
        name: 'غرفة 02 (Play Room)',
        nameEn: 'ROOM 02',
        titleAr: 'غرفة النجوم (VIP SUITE)',
        rate: 100,
        specs: 'شاشة 65 بوصة 4K 120Hz • 4 دراعات PS5 • سقف نجوم وإضاءة نيون',
        accentColor: '#ff007f',
        neonBorder: 'border-[#ff007f]',
        neonGlow: 'shadow-[0_0_30px_rgba(255,0,127,0.35)]',
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
            const d = new Date(now.getTime() + i * 86400000);
            const iso = d.toISOString().split('T')[0];
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
            if (h >= 6 && h < 12) return 'صباحاً';
            if (h >= 12 && h < 16) return 'الظهيرة';
            if (h >= 16 && h < 19) return 'العصر';
            if (h >= 19 && h < 23) return 'ذروة الجيمرز 🔥';
            return 'سهرة الفجر 🌙';
        };

        const slots: DynamicSlot[] = [];
        const bookedIndices = currentRoom.bookedSlotsIndices || [];

        // Generate next 12 consecutive 1-hour slots
        for (let i = 0; i < 12; i++) {
            const startH = (baseHour + i) % 24;
            const startM = baseMinute;

            const endH = (baseHour + i + 1) % 24;
            const endM = (baseMinute + 59) % 60;

            const startStr = formatArabicTime(startH, startM);
            const endStr = formatArabicTime(endH, endM);

            slots.push({
                id: `slot-${i}-${startH}-${startM}`,
                index: i,
                startDisplay: startStr,
                endDisplay: endStr,
                periodName: getPeriodName(startH),
                isBooked: bookedIndices.includes(i),
                startHour: startH,
                startMinute: startM,
                endHour: endH,
                endMinute: endM,
            });
        }

        return slots;
    }, [isToday, currentRoom]);

    // Track selected slot indices
    const [selectedSlotIndices, setSelectedSlotIndices] = useState<number[]>([0]);
    const [selectedSnacks, setSelectedSnacks] = useState<string[]>([]);

    // Reset selection when room or date changes
    useEffect(() => {
        const firstAvailable = generatedSlots.findIndex((s) => !s.isBooked);
        setSelectedSlotIndices(firstAvailable !== -1 ? [firstAvailable] : []);
    }, [selectedRoomId, selectedDate]);

    // Handle single or multi-slot selection (Contiguous 1hr chunks)
    const handleSlotClick = (clickedSlot: DynamicSlot) => {
        if (clickedSlot.isBooked) {
            toast.error('هذا الوقت محجوز بالفعل، برجاء اختيار موعد آخر متاح');
            return;
        }

        const idx = clickedSlot.index;

        if (selectedSlotIndices.length === 0) {
            setSelectedSlotIndices([idx]);
            return;
        }

        // Toggle if only 1 slot is currently selected
        if (selectedSlotIndices.length === 1 && selectedSlotIndices[0] === idx) {
            return; // keep at least 1 slot
        }

        const minIdx = Math.min(...selectedSlotIndices);
        const maxIdx = Math.max(...selectedSlotIndices);

        // Click adjacent next slot
        if (idx === maxIdx + 1) {
            setSelectedSlotIndices((prev) => [...prev, idx].sort((a, b) => a - b));
            return;
        }

        // Click adjacent previous slot
        if (idx === minIdx - 1) {
            setSelectedSlotIndices((prev) => [idx, ...prev].sort((a, b) => a - b));
            return;
        }

        // Click within the selected range (shrink)
        if (idx === maxIdx && selectedSlotIndices.length > 1) {
            setSelectedSlotIndices((prev) => prev.filter((i) => i !== idx));
            return;
        }
        if (idx === minIdx && selectedSlotIndices.length > 1) {
            setSelectedSlotIndices((prev) => prev.filter((i) => i !== idx));
            return;
        }

        // Click outside: Range select or restart single slot
        if (idx > maxIdx) {
            // Check if any slot in between is booked
            let canExpand = true;
            const newRange: number[] = [];
            for (let k = minIdx; k <= idx; k++) {
                if (generatedSlots[k]?.isBooked) {
                    canExpand = false;
                    break;
                }
                newRange.push(k);
            }
            if (canExpand) {
                setSelectedSlotIndices(newRange);
                toast.success(`تم تمديد الحجز إلى ${newRange.length} ساعات متتالية 🎮`);
                return;
            }
        }

        // Reset to this slot
        setSelectedSlotIndices([idx]);
    };

    // Quick duration handler (e.g., 1 hour, 2 hours, 3 hours)
    const handleQuickDuration = (hours: number) => {
        const start = selectedSlotIndices.length > 0 ? selectedSlotIndices[0] : 0;
        const newIndices: number[] = [];

        for (let i = 0; i < hours; i++) {
            const candidateIdx = start + i;
            if (candidateIdx < generatedSlots.length && !generatedSlots[candidateIdx].isBooked) {
                newIndices.push(candidateIdx);
            } else {
                break;
            }
        }

        if (newIndices.length > 0) {
            setSelectedSlotIndices(newIndices);
        }
    };

    const durationHours = selectedSlotIndices.length;
    const sortedIndices = [...selectedSlotIndices].sort((a, b) => a - b);
    const firstSlot = generatedSlots[sortedIndices[0]];
    const lastSlot = generatedSlots[sortedIndices[sortedIndices.length - 1]];

    const startDisplayTime = firstSlot ? firstSlot.startDisplay : '--:--';
    const endDisplayTime = lastSlot ? lastSlot.endDisplay : '--:--';

    const roomSubtotal = durationHours * currentRoom.rate;

    const snacksTotal = useMemo(() => {
        return selectedSnacks.reduce((sum, id) => {
            const snack = SNACK_OPTIONS.find((s) => s.id === id);
            return sum + (snack ? snack.price : 0);
        }, 0);
    }, [selectedSnacks]);

    const grandTotal = roomSubtotal + snacksTotal;

    const toggleSnack = (id: string) => {
        setSelectedSnacks((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleContinue = () => {
        if (!durationHours) {
            toast.error('يرجى تحديد وقت الحجز');
            return;
        }

        const chosenSnacks = SNACK_OPTIONS.filter((s) => selectedSnacks.includes(s.id));

        navigate('/playstation/payment', {
            state: {
                room: {
                    name: currentRoom.name,
                    type: 'standard',
                    rate: currentRoom.rate,
                },
                date: selectedDate,
                startTime: startDisplayTime,
                endTime: endDisplayTime,
                durationHours,
                roomSubtotal,
                snacks: chosenSnacks,
                snacksTotal,
                total: grandTotal,
            },
        });
    };

    return (
        <div className="min-h-screen w-full bg-[#0a0809] text-white font-body text-sm flex flex-col selection:bg-red-600 selection:text-white relative select-none">
            {/* ─────────────────────────────────────────────────────────────
                AUTHENTIC D95 DARK GAMING ATMOSPHERE (YOUTHFUL, SPORTY & MASCHINE)
               ───────────────────────────────────────────────────────────── */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                {/* Overhead warm red spotlight glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[380px] bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(220,38,38,0.18)_0%,transparent_75%)] blur-[60px]" />
                <div className="absolute bottom-10 right-[-10%] w-[450px] h-[450px] bg-red-950/20 blur-[130px] rounded-full" />
                {/* Subtle dark texture */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
            </div>

            {/* Top Navigation Bar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-[#0e0a0c]/95 backdrop-blur-xl pt-safe border-b border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.7)]">
                <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/playstation"
                            aria-label="الرجوع للغرف"
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white hover:text-red-400 transition-all active:scale-95 cursor-pointer border border-white/15 shadow-sm"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div className="flex flex-col text-right">
                            <h1 className="font-bold text-base text-white leading-tight font-body">
                                حجز الغرفة ومواعيد اليوم
                            </h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-brush text-sm text-red-500 font-bold">D95</span>
                                <span className="text-[11px] text-neutral-400 font-semibold tracking-wider">GAMING &amp; CAFÉ</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>مواعيد حية</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative z-10 w-full pt-20 pb-32 px-3.5 sm:px-6 max-w-4xl mx-auto space-y-3.5" dir="rtl">
                {/* ─────────────────────────────────────────────────────────────
                    ENTERED ROOM SHOWCASE BANNER (SEAMLESS IMMERSION FROM 3D DOOR)
                   ───────────────────────────────────────────────────────────── */}
                <section
                    className={`relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 ${currentRoom.neonBorder} ${currentRoom.neonGlow} backdrop-blur-md shadow-2xl transition-all duration-500`}
                >
                    <div className="relative h-44 sm:h-56 w-full overflow-hidden">
                        <img
                            src={currentRoom.interiorImg}
                            alt={currentRoom.name}
                            className="w-full h-full object-cover brightness-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0809] via-black/45 to-transparent" />

                        {/* Status chip */}
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 border border-emerald-500/70 shadow-lg backdrop-blur-md">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs font-bold text-emerald-300 font-sans">
                                ✦ تم فتح الباب والدخول بنجاح
                            </span>
                        </div>

                        {/* Room Info */}
                        <div className="absolute bottom-3 inset-x-3 sm:inset-x-5 z-10 flex items-end justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] sm:text-xs font-brush tracking-wider uppercase px-2 py-0.5 rounded bg-black/75 border border-white/20 text-white">
                                        {currentRoom.nameEn}
                                    </span>
                                    <span className="text-[10px] font-bold text-neutral-300">
                                        PlayStation 5 Suite
                                    </span>
                                </div>
                                <h2 className="font-brush text-xl sm:text-2xl text-white font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                                    {currentRoom.titleAr}
                                </h2>
                                <p className="text-[11px] sm:text-xs text-neutral-300 font-medium">
                                    {currentRoom.specs}
                                </p>
                            </div>

                            <div className="text-left bg-black/85 px-3 py-1.5 rounded-xl border border-white/15 shrink-0 hidden xs:block" dir="ltr">
                                <span className="font-sans font-black text-base sm:text-lg text-white tabular-nums">
                                    {currentRoom.rate} EGP
                                </span>
                                <span className="text-[10px] text-neutral-400 font-bold ml-1">/ HR</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    SECTION 1: ATHLETIC ROOM SELECTOR TABS (ROOM 1 vs ROOM 2)
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-[#140e10]/95 border border-white/10 rounded-2xl p-3 shadow-xl backdrop-blur-md">
                    <div className="flex items-center justify-between px-2 mb-2 text-xs">
                        <span className="text-white font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                            <DoorClosed className="w-4 h-4 text-red-500" />
                            <span>اختر الغرفة المراد حجزها:</span>
                        </span>
                        <span className="text-red-300 font-bold text-xs bg-red-950/80 px-2.5 py-0.5 rounded-full border border-red-500/40">
                            100 ج.م / ساعة
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {AVAILABLE_ROOMS.map((room) => {
                            const isSelected = selectedRoomId === room.id;
                            return (
                                <button
                                    key={room.id}
                                    onClick={() => setSelectedRoomId(room.id)}
                                    className={`relative p-2.5 sm:p-3.5 rounded-xl border-2 flex flex-col justify-between text-right transition-all duration-200 cursor-pointer ${
                                        isSelected
                                            ? 'bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.35)] scale-[1.01]'
                                            : 'bg-[#1c1417]/80 border-white/10 text-neutral-300 hover:border-white/20 hover:bg-[#241a1e]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full mb-2">
                                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-white text-red-600 shadow-sm' : 'bg-white/10 text-neutral-300 border border-white/10'}`}>
                                            <DoorClosed className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </div>
                                        <div className="text-left" dir="ltr">
                                            <span className={`font-sans font-bold text-xs sm:text-sm tabular-nums px-2 py-0.5 rounded-md ${isSelected ? 'bg-black/30 text-white' : 'bg-red-950/80 text-red-300 border border-red-500/30'}`}>
                                                {room.rate} EGP/HR
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="font-bold text-sm sm:text-base text-white tracking-wide">
                                            {room.nameEn}
                                        </div>
                                        <div className={`text-[11px] font-medium leading-tight mt-0.5 truncate ${isSelected ? 'text-neutral-100' : 'text-neutral-400'}`}>
                                            {room.id === 'room-1' ? 'غرفة 01 VIP' : 'غرفة 02 VIP'}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    SECTION 2: CLEAN 7-DAY CALENDAR DATE SELECTOR
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-[#140e10]/95 border border-white/10 rounded-2xl p-3 sm:p-3.5 shadow-xl backdrop-blur-md">
                    <div className="flex items-center justify-between mb-2.5 px-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-white font-bold">
                            <Calendar className="w-4 h-4 text-red-500" />
                            <span>تاريخ الحجز:</span>
                        </div>
                        {isToday && (
                            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                يبدأ فوراً من الوقت الحالي
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-1">
                        {calendarDays.map((d) => {
                            const active = selectedDate === d.iso;
                            return (
                                <button
                                    key={d.iso}
                                    onClick={() => setSelectedDate(d.iso)}
                                    className={`shrink-0 py-2 px-2.5 sm:px-3.5 rounded-xl border-2 text-center transition-all cursor-pointer min-w-[64px] sm:min-w-[72px] ${
                                        active
                                            ? 'bg-red-600 border-red-500 text-white shadow-[0_0_18px_rgba(220,38,38,0.4)] scale-105'
                                            : 'bg-[#1c1417]/80 border-white/10 text-neutral-300 hover:text-white hover:border-white/20 hover:bg-[#241a1e]'
                                    }`}
                                >
                                    <div className={`text-[11px] font-bold ${active ? 'text-white' : 'text-neutral-400'}`}>
                                        {d.dayName}
                                    </div>
                                    <div className="text-base sm:text-lg font-extrabold font-sans tabular-nums my-0.5 text-white">
                                        {d.dayNumber}
                                    </div>
                                    <div className={`text-[10px] font-medium ${active ? 'text-white/90' : 'text-neutral-400'}`}>
                                        {d.monthName}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    SECTION 3: COMPACT 4-COLUMN SLOTS GRID (CLEAN DARK ATHLETIC)
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-[#140e10]/95 border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-xl backdrop-blur-md">
                    {/* Header: Title + Quick Duration Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-3 border-b border-white/10">
                        <div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-red-500" />
                                <h2 className="font-bold text-sm sm:text-base text-white font-body">
                                    الأوقات المتاحة للحجز اليوم ({currentRoom.nameEn})
                                </h2>
                            </div>
                            <p className="text-xs text-neutral-400 mt-0.5 font-medium">
                                انقر لاختيار ساعة أو أكثر متتالية • الحساب ديناميكي يبدأ من الوقت الحالي
                            </p>
                        </div>

                        {/* Quick Duration Pills */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-black/50 p-1 rounded-xl border border-white/10">
                            <span className="text-[11px] text-neutral-400 px-1 font-bold">المدة:</span>
                            {[1, 2, 3, 4].map((h) => (
                                <button
                                    key={h}
                                    onClick={() => handleQuickDuration(h)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        durationHours === h
                                            ? 'bg-red-600 text-white shadow-sm'
                                            : 'text-neutral-300 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {h} س
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Slots Legend */}
                    <div className="flex items-center gap-4 text-xs mb-3 px-1 font-medium">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                            <span>متاح للحجز</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-red-400 font-bold">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <span>محدد لحجزك</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-500">
                            <span className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
                            <span>محجوز 🔒</span>
                        </div>
                    </div>

                    {/* THE COMPACT 4-COLUMN GRID */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {generatedSlots.map((slot) => {
                            const isSelected = selectedSlotIndices.includes(slot.index);
                            const isBooked = slot.isBooked;

                            return (
                                <motion.div
                                    key={slot.id}
                                    whileTap={!isBooked ? { scale: 0.98 } : undefined}
                                    onClick={() => handleSlotClick(slot)}
                                    className={`relative p-2.5 rounded-xl border-2 transition-all duration-200 select-none cursor-pointer flex flex-col justify-between ${
                                        isBooked
                                            ? 'bg-black/30 border-white/5 text-neutral-600 opacity-40 cursor-not-allowed'
                                            : isSelected
                                            ? 'bg-red-600 border-red-500 text-white shadow-[0_0_25px_rgba(220,38,38,0.5)] scale-[1.03]'
                                            : 'bg-[#1c1417]/90 border-white/10 hover:border-red-500/60 hover:bg-[#261a1f] text-white shadow-sm'
                                    }`}
                                >
                                    {/* Top Line: Period Badge + Status */}
                                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                                        <span className={`font-semibold ${isSelected ? 'text-white' : 'text-neutral-400'}`}>
                                            {slot.periodName}
                                        </span>
                                        {isBooked ? (
                                            <span className="flex items-center gap-1 text-neutral-500 font-bold text-[10px]">
                                                <Lock className="w-3 h-3" />
                                                <span>محجوز</span>
                                            </span>
                                        ) : isSelected ? (
                                            <span className="flex items-center gap-1 text-white font-bold text-[10px] bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                                                <Check className="w-3 h-3 stroke-[3]" />
                                                <span>محدد</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-emerald-300 font-bold text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                <span>متاح</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Center: Crystal-Clear Time Range with Arrow */}
                                    <div className="text-center my-1">
                                        <div
                                            dir="rtl"
                                            className={`font-body font-bold text-xs sm:text-sm tracking-normal flex items-center justify-center gap-1.5 ${
                                                isBooked
                                                    ? 'text-neutral-600 line-through'
                                                    : isSelected
                                                    ? 'text-white'
                                                    : 'text-white'
                                            }`}
                                        >
                                            <span className="tabular-nums font-extrabold">{slot.startDisplay}</span>
                                            <span className={`text-xs font-bold ${isSelected ? 'text-white/90' : 'text-red-500'}`}>←</span>
                                            <span className="tabular-nums font-extrabold">{slot.endDisplay}</span>
                                        </div>
                                    </div>

                                    {/* Bottom Info: 60 minutes & rate */}
                                    <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-white/10 text-[11px]">
                                        <span className={isSelected ? 'text-white/90' : 'text-neutral-400 font-medium'}>
                                            جلسة 60 دقيقة
                                        </span>
                                        <span className={`font-bold ${isSelected ? 'text-white font-black' : 'text-red-400'}`}>
                                            {currentRoom.rate} ج.م
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    SECTION 4: SNACKS & DRINKS (OPTIONAL ADDONS)
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-[#140e10]/95 border border-white/10 rounded-2xl p-3 shadow-xl backdrop-blur-md">
                    <div className="flex items-center justify-between mb-2.5 px-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-white font-bold">
                            <Coffee className="w-4 h-4 text-amber-500" />
                            <span>سناكس ومشروبات أثناء اللعب (اختياري)</span>
                        </div>
                        <span className="text-xs text-amber-300 font-bold bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                            خدمة الضيافة للغرفة
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {SNACK_OPTIONS.map((snack) => {
                            const isChecked = selectedSnacks.includes(snack.id);
                            return (
                                <div
                                    key={snack.id}
                                    onClick={() => toggleSnack(snack.id)}
                                    className={`p-2.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                                        isChecked
                                            ? 'bg-red-950/50 border-red-500 text-white shadow-sm'
                                            : 'bg-[#1c1417]/80 border-white/10 text-neutral-300 hover:text-white hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${
                                                isChecked
                                                    ? 'bg-red-600 border-red-500 text-white shadow-sm'
                                                    : 'border-white/20 bg-black/40'
                                            }`}
                                        >
                                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold flex items-center gap-1 text-white">
                                                <span>{snack.icon}</span>
                                                <span className="truncate max-w-[130px]">{snack.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-xs text-red-400 shrink-0 font-body">
                                        +{snack.price} ج.م
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* ─────────────────────────────────────────────────────────────
                FIXED BOTTOM STICKY SUMMARY BAR (SLEEK DARK ATHLETIC)
               ───────────────────────────────────────────────────────────── */}
            <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0e0a0c]/98 border-t border-white/10 backdrop-blur-2xl p-3 sm:p-4 pb-safe shadow-[0_-10px_35px_rgba(0,0,0,0.9)]">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    {/* Financial & Time Summary */}
                    <div className="flex flex-col text-right">
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-sans font-extrabold text-2xl sm:text-3xl tabular-nums text-white tracking-tight">
                                {grandTotal}
                            </span>
                            <span className="text-xs text-neutral-300 font-bold">ج.م</span>
                            <span className="text-[11px] text-red-300 font-bold mr-1 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-500/40 whitespace-nowrap">
                                ({durationHours} {durationHours === 1 ? 'ساعة' : durationHours === 2 ? 'ساعتان' : 'ساعات'})
                            </span>
                        </div>
                        <div className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5 font-medium">
                            <span className="font-bold text-white">{currentRoom.nameEn}</span>
                            <span>•</span>
                            <div dir="rtl" className="flex items-center gap-1 text-red-400 font-bold tabular-nums">
                                <span>{startDisplayTime}</span>
                                <span>←</span>
                                <span>{endDisplayTime}</span>
                            </div>
                        </div>
                    </div>

                    {/* Continue CTA */}
                    <button
                        onClick={handleContinue}
                        className="py-3 px-5 sm:px-8 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-[0_0_25px_rgba(220,38,38,0.4)] active:scale-95 transition-all cursor-pointer shrink-0 border border-red-500/50"
                    >
                        <span>تأكيد الحجز والدفع</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
}
