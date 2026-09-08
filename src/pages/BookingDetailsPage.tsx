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
    Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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
        nameEn: 'ROOM 1',
        rate: 100,
        specs: 'شاشة 65 بوصة 4K 120Hz • 4 دراعات PS5',
        bookedSlotsIndices: [2, 5], // Mock occupied slots
    },
    {
        id: 'room-2',
        name: 'غرفة 02 (Play Room)',
        nameEn: 'ROOM 2',
        rate: 100,
        specs: 'شاشة 65 بوصة 4K 120Hz • 4 دراعات PS5',
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
        // Generate 12 slots for a compact, fast-scanning grid
        const count = 12;

        for (let i = 0; i < count; i++) {
            const startH = (baseHour + i) % 24;
            const endH = (baseHour + i + 1) % 24;
            const endM = (baseMinute - 1 + 60) % 60;

            const startDisplay = formatArabicTime(startH, baseMinute);
            const endDisplay = formatArabicTime(endH, endM);

            // Mock occupied slot check based on room
            const isBooked = currentRoom.bookedSlotsIndices.includes(i);

            slots.push({
                id: `${currentRoom.id}-${selectedDate}-slot-${i}`,
                index: i,
                startDisplay,
                endDisplay,
                periodName: getPeriodName(startH),
                isBooked,
                startHour: startH,
                startMinute: baseMinute,
                endHour: endH,
                endMinute: endM,
            });
        }

        return slots;
    }, [isToday, selectedDate, currentRoom]);

    // Selected Slot Indices (Array of numbers for multi-hour selection)
    const [selectedSlotIndices, setSelectedSlotIndices] = useState<number[]>([0]);
    const [selectedSnacks, setSelectedSnacks] = useState<string[]>([]);

    // If slots regenerate and current selected slot is booked, default to first available
    useEffect(() => {
        const firstAvailable = generatedSlots.find((s) => !s.isBooked);
        if (firstAvailable && (!selectedSlotIndices.length || selectedSlotIndices.some((idx) => generatedSlots[idx]?.isBooked))) {
            setSelectedSlotIndices([firstAvailable.index]);
        }
    }, [generatedSlots]);

    // Multi-slot selection handler
    const handleSlotClick = (slot: DynamicSlot) => {
        if (slot.isBooked) {
            toast.error('هذا الوقت محجوز مسبقاً، يرجى اختيار وقت آخر متاح 🔒');
            return;
        }

        // If clicking already selected single slot, keep it
        if (selectedSlotIndices.length === 1 && selectedSlotIndices[0] === slot.index) {
            return;
        }

        // If slot is already selected, allow shrinking or toggling
        if (selectedSlotIndices.includes(slot.index)) {
            const remaining = selectedSlotIndices.filter((idx) => idx < slot.index);
            if (remaining.length > 0) {
                setSelectedSlotIndices(remaining);
            } else {
                setSelectedSlotIndices([slot.index]);
            }
            return;
        }

        // If selecting a new slot:
        const minIdx = Math.min(...selectedSlotIndices);
        const maxIdx = Math.max(...selectedSlotIndices);

        if (slot.index > maxIdx) {
            // Select all consecutive available slots up to this slot
            const newRange: number[] = [];
            let hasBlocked = false;
            for (let i = minIdx; i <= slot.index; i++) {
                if (generatedSlots[i]?.isBooked) {
                    hasBlocked = true;
                    break;
                }
                newRange.push(i);
            }
            if (hasBlocked) {
                toast.warning('لا يمكن اختيار أوقات يتخللها وقت محجوز');
                setSelectedSlotIndices([slot.index]);
            } else {
                setSelectedSlotIndices(newRange);
            }
        } else {
            // Set as the new single starting slot
            setSelectedSlotIndices([slot.index]);
        }
    };

    // Quick Duration Pills (1, 2, 3, 4 Hours)
    const handleQuickDuration = (hours: number) => {
        const startIdx = selectedSlotIndices.length ? Math.min(...selectedSlotIndices) : 0;
        const newIndices: number[] = [];

        for (let i = 0; i < hours; i++) {
            const targetIdx = startIdx + i;
            if (targetIdx >= generatedSlots.length || generatedSlots[targetIdx]?.isBooked) {
                toast.warning(`متاح فقط ${newIndices.length} ساعة متتالية بدون تعارض`);
                break;
            }
            newIndices.push(targetIdx);
        }

        if (newIndices.length > 0) {
            setSelectedSlotIndices(newIndices);
        }
    };

    // Derived Booking Calculations
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
        <div className="min-h-screen w-full bg-[#0d0709] text-[#f5ece8] font-body text-sm flex flex-col selection:bg-red-500/40 relative select-none">
            {/* ─────────────────────────────────────────────────────────────
                VIBRANT, ILLUMINATED AMBIENT ATMOSPHERE (WARM CRIMSON GLOW)
               ───────────────────────────────────────────────────────────── */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                {/* Luminous Top Spotlight Arc */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[420px] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(225,29,72,0.30)_0%,rgba(155,28,45,0.12)_45%,transparent_80%)] blur-[60px]" />
                {/* Left Warm Amber Accent */}
                <div className="absolute top-20 left-[5%] w-[400px] h-[350px] bg-[radial-gradient(circle,rgba(212,160,23,0.12)_0%,transparent_70%)] blur-[70px]" />
                {/* Right Soft Rose Accent */}
                <div className="absolute top-20 right-[5%] w-[400px] h-[350px] bg-[radial-gradient(circle,rgba(244,194,200,0.12)_0%,transparent_70%)] blur-[70px]" />
                {/* Center Subsurface Glow */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-red-950/25 blur-[120px] rounded-full" />
            </div>

            {/* Top Navigation Bar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-[#14080b]/95 backdrop-blur-xl pt-safe border-b border-red-900/30 shadow-[0_4px_25px_rgba(0,0,0,0.7)]">
                <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/playstation"
                            aria-label="الرجوع للغرف"
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:text-red-400 hover:bg-white/15 transition-all active:scale-95 cursor-pointer border border-white/15 shadow-sm"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div className="flex flex-col text-right">
                            <h1 className="font-bold text-base text-white leading-tight font-body">
                                حجز الغرفة ومواعيد اليوم
                            </h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-brush text-sm text-red-500 font-bold">D95</span>
                                <span className="text-[11px] text-red-200/70 font-semibold">GAMING &amp; CAFÉ</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>مواعيد ديناميكية حية</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area (Bright, Illuminated, High-Contrast Grid) */}
            <main className="flex-1 flex flex-col relative z-10 w-full pt-20 pb-32 px-3.5 sm:px-6 max-w-4xl mx-auto space-y-3.5" dir="rtl">
                {/* ─────────────────────────────────────────────────────────────
                    SECTION 1: COMPACT ILLUMINATED ROOM SELECTOR
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-[#1c0c11]/95 border-2 border-red-600/35 rounded-2xl p-3 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(196,30,58,0.12)] backdrop-blur-md">
                    <div className="flex items-center justify-between px-2 mb-2 text-xs">
                        <span className="text-white font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                            <DoorClosed className="w-4 h-4 text-red-400" />
                            <span>اختر الغرفة المراد حجزها:</span>
                        </span>
                        <span className="text-red-300 font-bold text-xs bg-red-950/80 px-2.5 py-0.5 rounded-full border border-red-600/40">
                            100 ج.م / ساعة
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        {AVAILABLE_ROOMS.map((room) => {
                            const isSelected = selectedRoomId === room.id;
                            return (
                                <button
                                    key={room.id}
                                    onClick={() => setSelectedRoomId(room.id)}
                                    className={`relative py-2.5 px-3.5 sm:px-4 rounded-xl border-2 flex items-center justify-between transition-all duration-200 cursor-pointer ${
                                        isSelected
                                            ? 'bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-[#881337] border-white text-white shadow-[0_0_25px_rgba(225,29,72,0.65)] scale-[1.01]'
                                            : 'bg-[#261016] border-red-500/25 text-neutral-200 hover:text-white hover:bg-[#32151d] hover:border-red-400/70 shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-black/30 text-white shadow-inner' : 'bg-red-950/60 text-red-300 border border-red-700/40'}`}>
                                            <DoorClosed className="w-4 h-4" />
                                        </div>
                                        <div className="text-right">
                                            <div className="font-brush text-sm sm:text-base leading-tight font-bold text-white">
                                                {room.nameEn}
                                            </div>
                                            <div className={`text-[11px] font-semibold leading-tight mt-0.5 ${isSelected ? 'text-red-100' : 'text-neutral-300'}`}>
                                                {room.name}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-left" dir="ltr">
                                        <span className="font-brush text-base sm:text-lg font-bold text-white">
                                            {room.rate}
                                        </span>
                                        <span className={`text-[10px] font-bold ml-1 ${isSelected ? 'text-white/90' : 'text-red-300'}`}>
                                            EGP/HR
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    SECTION 2: BRIGHT 7-DAY CALENDAR SELECTOR
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-[#1c0c11]/95 border-2 border-red-600/35 rounded-2xl p-3 sm:p-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(196,30,58,0.12)] backdrop-blur-md">
                    <div className="flex items-center justify-between mb-2.5 px-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-white font-bold">
                            <Calendar className="w-4 h-4 text-red-400" />
                            <span>تاريخ الحجز:</span>
                        </div>
                        {isToday && (
                            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/50 flex items-center gap-1.5 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                يبدأ فوراً من الوقت الحالي
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                        {calendarDays.map((d) => {
                            const active = selectedDate === d.iso;
                            return (
                                <button
                                    key={d.iso}
                                    onClick={() => setSelectedDate(d.iso)}
                                    className={`shrink-0 py-2 px-3.5 rounded-xl border-2 text-center transition-all cursor-pointer min-w-[72px] ${
                                        active
                                            ? 'bg-gradient-to-b from-[#E11D48] via-[#BE123C] to-[#881337] border-white text-white shadow-[0_0_22px_rgba(225,29,72,0.7)] scale-105'
                                            : 'bg-[#261016] border-red-500/25 text-neutral-200 hover:text-white hover:border-red-400/70 hover:bg-[#32151d] shadow-sm'
                                    }`}
                                >
                                    <div className={`text-[11px] font-bold ${active ? 'text-white' : 'text-red-200/90'}`}>
                                        {d.dayName}
                                    </div>
                                    <div className="text-lg font-black font-brush my-0.5 text-white">
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
                    SECTION 3: ILLUMINATED, HIGH-CONTRAST 4-COLUMN SLOTS GRID
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-[#1c0c11]/95 border-2 border-red-600/40 rounded-2xl p-3.5 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(196,30,58,0.15)] backdrop-blur-md">
                    {/* Header: Title + Quick Duration Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-3 border-b border-red-900/40">
                        <div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-red-400" />
                                <h2 className="font-bold text-sm sm:text-base text-white">
                                    الأوقات المتاحة للحجز اليوم ({currentRoom.nameEn})
                                </h2>
                            </div>
                            <p className="text-xs text-neutral-300 mt-0.5">
                                انقر لاختيار ساعة أو أكثر متتالية • الحساب ديناميكي يبدأ من الوقت الحالي
                            </p>
                        </div>

                        {/* Quick Duration Pills */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#261016] p-1 rounded-xl border border-red-500/30 shadow-inner">
                            <span className="text-[11px] text-red-200/90 px-1 font-bold">المدة:</span>
                            {[1, 2, 3, 4].map((h) => (
                                <button
                                    key={h}
                                    onClick={() => handleQuickDuration(h)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        durationHours === h
                                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md border border-red-300'
                                            : 'text-neutral-300 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {h} س
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Slots Legend */}
                    <div className="flex items-center gap-4 text-xs mb-3 px-1">
                        <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                            <span>متاح للحجز</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white font-bold">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_#ef4444]" />
                            <span>محدد لحجزك</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
                            <span>محجوز 🔒</span>
                        </div>
                    </div>

                    {/* THE COMPACT 4-COLUMN GRID (ILLUMINATED & CRYSTAL CLEAR) */}
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
                                            ? 'bg-[#140b0e]/70 border-neutral-800 text-neutral-500 opacity-50 cursor-not-allowed'
                                            : isSelected
                                            ? 'bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-[#881337] border-white text-white shadow-[0_0_24px_rgba(225,29,72,0.75)] scale-[1.03]'
                                            : 'bg-[#251016] border-red-500/30 hover:border-red-400 hover:bg-[#32151e] text-neutral-100 shadow-sm'
                                    }`}
                                >
                                    {/* Top Line: Period Badge + Status */}
                                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                                        <span className={`font-semibold ${isSelected ? 'text-white' : 'text-red-200/90'}`}>
                                            {slot.periodName}
                                        </span>
                                        {isBooked ? (
                                            <span className="flex items-center gap-1 text-neutral-400 font-bold text-[10px]">
                                                <Lock className="w-3 h-3" />
                                                <span>محجوز</span>
                                            </span>
                                        ) : isSelected ? (
                                            <span className="flex items-center gap-1 text-white font-bold text-[10px] bg-black/40 px-2 py-0.5 rounded-full border border-white/30">
                                                <Check className="w-3 h-3 stroke-[3]" />
                                                <span>محدد</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-emerald-300 font-bold text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/50">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                <span>متاح</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Center: Crystal-Clear Time Range with Arrow (Direction-Safe) */}
                                    <div className="text-center my-1">
                                        <div
                                            dir="rtl"
                                            className={`font-body font-bold text-xs sm:text-sm tracking-normal flex items-center justify-center gap-1.5 ${
                                                isBooked
                                                    ? 'text-neutral-500 line-through'
                                                    : isSelected
                                                    ? 'text-white'
                                                    : 'text-white'
                                            }`}
                                        >
                                            <span className="tabular-nums font-extrabold">{slot.startDisplay}</span>
                                            <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-red-400'}`}>←</span>
                                            <span className="tabular-nums font-extrabold">{slot.endDisplay}</span>
                                        </div>
                                    </div>

                                    {/* Bottom Info: 60 minutes & rate */}
                                    <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-white/10 text-[11px]">
                                        <span className={isSelected ? 'text-white/90' : 'text-neutral-300 font-medium'}>
                                            جلسة 60 دقيقة
                                        </span>
                                        <span className={`font-bold ${isSelected ? 'text-white' : 'text-[#F4C2C8]'}`}>
                                            {currentRoom.rate} ج.م
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    SECTION 4: ILLUMINATED SNACKS & DRINKS (OPTIONAL ADDONS)
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-[#1c0c11]/95 border-2 border-red-600/35 rounded-2xl p-3 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(196,30,58,0.12)] backdrop-blur-md">
                    <div className="flex items-center justify-between mb-2.5 px-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-white font-bold">
                            <Coffee className="w-4 h-4 text-amber-400" />
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
                                            ? 'bg-gradient-to-r from-red-950 to-[#5a0f1c] border-red-400 text-white shadow-md'
                                            : 'bg-[#261016] border-red-500/25 text-neutral-200 hover:text-white hover:border-red-400/60 shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${
                                                isChecked
                                                    ? 'bg-red-600 border-white text-white shadow-sm'
                                                    : 'border-red-400/40 bg-black/40'
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
                                    <div className="font-bold text-xs text-amber-300 shrink-0 font-body">
                                        +{snack.price} ج.م
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* ─────────────────────────────────────────────────────────────
                FIXED BOTTOM STICKY SUMMARY BAR (LUMINOUS & BOLD)
               ───────────────────────────────────────────────────────────── */}
            <div className="fixed bottom-0 inset-x-0 z-40 bg-[#16080b]/98 border-t-2 border-red-600/40 backdrop-blur-2xl p-3 sm:p-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.9)]">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    {/* Financial & Time Summary */}
                    <div className="flex flex-col text-right">
                        <div className="flex items-baseline gap-2">
                            <span className="font-brush text-3xl sm:text-4xl font-black text-white drop-shadow-[0_2px_10px_rgba(225,29,72,0.6)]">
                                {grandTotal}
                            </span>
                            <span className="text-xs text-neutral-200 font-bold">ج.م</span>
                            <span className="text-xs text-red-300 font-bold mr-1.5 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-600/40">
                                ({durationHours} {durationHours === 1 ? 'ساعة' : durationHours === 2 ? 'ساعتان' : 'ساعات'})
                            </span>
                        </div>
                        <div className="text-xs text-neutral-300 flex items-center gap-1.5 mt-0.5 font-medium">
                            <span className="font-bold text-white">{currentRoom.nameEn}</span>
                            <span>•</span>
                            <div dir="rtl" className="flex items-center gap-1 text-red-200 font-bold">
                                <span>{startDisplayTime}</span>
                                <span>←</span>
                                <span>{endDisplayTime}</span>
                            </div>
                        </div>
                    </div>

                    {/* Continue CTA */}
                    <button
                        onClick={handleContinue}
                        className="py-3 px-6 sm:px-8 rounded-xl bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-[#991B1B] hover:from-[#F43F5E] hover:to-[#BE123C] text-white font-bold text-sm flex items-center gap-2 shadow-[0_0_25px_rgba(225,29,72,0.65)] active:scale-95 transition-all cursor-pointer shrink-0 border border-red-300/40"
                    >
                        <span>تأكيد الحجز والدفع</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
}
