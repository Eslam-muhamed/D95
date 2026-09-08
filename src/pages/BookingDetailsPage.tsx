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
        const count = 12;

        for (let i = 0; i < count; i++) {
            const startH = (baseHour + i) % 24;
            const endH = (baseHour + i + 1) % 24;
            const endM = (baseMinute - 1 + 60) % 60;

            const startDisplay = formatArabicTime(startH, baseMinute);
            const endDisplay = formatArabicTime(endH, endM);

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

    useEffect(() => {
        const firstAvailable = generatedSlots.find((s) => !s.isBooked);
        if (firstAvailable && (!selectedSlotIndices.length || selectedSlotIndices.some((idx) => generatedSlots[idx]?.isBooked))) {
            setSelectedSlotIndices([firstAvailable.index]);
        }
    }, [generatedSlots]);

    const handleSlotClick = (slot: DynamicSlot) => {
        if (slot.isBooked) {
            toast.error('هذا الوقت محجوز مسبقاً، يرجى اختيار وقت آخر متاح 🔒');
            return;
        }

        if (selectedSlotIndices.length === 1 && selectedSlotIndices[0] === slot.index) {
            return;
        }

        if (selectedSlotIndices.includes(slot.index)) {
            const remaining = selectedSlotIndices.filter((idx) => idx < slot.index);
            if (remaining.length > 0) {
                setSelectedSlotIndices(remaining);
            } else {
                setSelectedSlotIndices([slot.index]);
            }
            return;
        }

        const minIdx = Math.min(...selectedSlotIndices);
        const maxIdx = Math.max(...selectedSlotIndices);

        if (slot.index > maxIdx) {
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
            setSelectedSlotIndices([slot.index]);
        }
    };

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
        <div className="min-h-screen w-full bg-[#F4F1EA] text-neutral-900 font-body text-sm flex flex-col selection:bg-red-600 selection:text-white relative select-none">
            {/* ─────────────────────────────────────────────────────────────
                AUTHENTIC D95 LIGHT CONCRETE ATMOSPHERE (YOUTHFUL & SPORTY)
               ───────────────────────────────────────────────────────────── */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                {/* Overhead warm spotlight gradient */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[350px] bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(255,255,255,0.85)_0%,rgba(220,38,38,0.06)_50%,transparent_80%)] blur-[40px]" />
                {/* Subtle light concrete grid texture */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />
            </div>

            {/* Top Navigation Bar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl pt-safe border-b border-neutral-200/80 shadow-[0_2px_15px_rgba(0,0,0,0.05)]">
                <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/playstation"
                            aria-label="الرجوع للغرف"
                            className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-900 hover:text-red-600 transition-all active:scale-95 cursor-pointer border border-neutral-200 shadow-sm"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div className="flex flex-col text-right">
                            <h1 className="font-bold text-base text-neutral-950 leading-tight font-body">
                                حجز الغرفة ومواعيد اليوم
                            </h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-brush text-sm text-red-600 font-bold">D95</span>
                                <span className="text-[11px] text-neutral-500 font-semibold tracking-wider">GAMING &amp; CAFÉ</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>مواعيد ديناميكية حية</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area (Clean, Athletic, High-Contrast Light Mode) */}
            <main className="flex-1 flex flex-col relative z-10 w-full pt-20 pb-32 px-3.5 sm:px-6 max-w-4xl mx-auto space-y-3.5" dir="rtl">
                {/* ─────────────────────────────────────────────────────────────
                    SECTION 1: ATHLETIC ROOM SELECTOR TABS (ROOM 1 vs ROOM 2)
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-white border-2 border-neutral-200/90 rounded-2xl p-3 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between px-2 mb-2 text-xs">
                        <span className="text-neutral-900 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                            <DoorClosed className="w-4 h-4 text-red-600" />
                            <span>اختر الغرفة المراد حجزها:</span>
                        </span>
                        <span className="text-red-600 font-bold text-xs bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
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
                                            ? 'bg-neutral-950 border-neutral-950 text-white shadow-md scale-[1.01]'
                                            : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-white hover:border-neutral-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-neutral-700 border border-neutral-200'}`}>
                                            <DoorClosed className="w-4 h-4" />
                                        </div>
                                        <div className="text-right">
                                            <div className="font-brush text-sm sm:text-base leading-tight font-bold">
                                                {room.nameEn}
                                            </div>
                                            <div className={`text-[11px] font-semibold leading-tight mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                                {room.name}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-left" dir="ltr">
                                        <span className={`font-brush text-base sm:text-lg font-bold ${isSelected ? 'text-white' : 'text-red-600'}`}>
                                            {room.rate}
                                        </span>
                                        <span className={`text-[10px] font-bold ml-1 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                            EGP/HR
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    SECTION 2: CLEAN 7-DAY CALENDAR DATE SELECTOR
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-white border-2 border-neutral-200/90 rounded-2xl p-3 sm:p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-2.5 px-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-900 font-bold">
                            <Calendar className="w-4 h-4 text-red-600" />
                            <span>تاريخ الحجز:</span>
                        </div>
                        {isToday && (
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
                                            ? 'bg-red-600 border-red-600 text-white shadow-md shadow-red-600/30 scale-105'
                                            : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-white hover:border-neutral-300'
                                    }`}
                                >
                                    <div className={`text-[11px] font-bold ${active ? 'text-white' : 'text-neutral-600'}`}>
                                        {d.dayName}
                                    </div>
                                    <div className="text-lg font-black font-brush my-0.5">
                                        {d.dayNumber}
                                    </div>
                                    <div className={`text-[10px] font-medium ${active ? 'text-white/90' : 'text-neutral-500'}`}>
                                        {d.monthName}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    SECTION 3: CLEAN 4-COLUMN SLOTS GRID (CRISP LIGHT MODE)
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-white border-2 border-neutral-200/90 rounded-2xl p-3.5 sm:p-5 shadow-[0_6px_25px_rgba(0,0,0,0.05)]">
                    {/* Header: Title + Quick Duration Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-3 border-b border-neutral-100">
                        <div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-red-600" />
                                <h2 className="font-bold text-sm sm:text-base text-neutral-950 font-body">
                                    الأوقات المتاحة للحجز اليوم ({currentRoom.nameEn})
                                </h2>
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                                انقر لاختيار ساعة أو أكثر متتالية • الحساب ديناميكي يبدأ من الوقت الحالي
                            </p>
                        </div>

                        {/* Quick Duration Pills */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                            <span className="text-[11px] text-neutral-600 px-1 font-bold">المدة:</span>
                            {[1, 2, 3, 4].map((h) => (
                                <button
                                    key={h}
                                    onClick={() => handleQuickDuration(h)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        durationHours === h
                                            ? 'bg-neutral-950 text-white shadow-sm'
                                            : 'text-neutral-700 hover:text-neutral-950 hover:bg-white'
                                    }`}
                                >
                                    {h} س
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Slots Legend */}
                    <div className="flex items-center gap-4 text-xs mb-3 px-1 font-medium">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span>متاح للحجز</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-red-700 font-bold">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                            <span>محدد لحجزك</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
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
                                            ? 'bg-neutral-100 border-neutral-200 text-neutral-400 opacity-60 cursor-not-allowed'
                                            : isSelected
                                            ? 'bg-red-600 border-red-700 text-white shadow-lg shadow-red-600/30 scale-[1.03]'
                                            : 'bg-neutral-50 border-neutral-200 hover:border-red-500 hover:bg-white text-neutral-900 shadow-sm'
                                    }`}
                                >
                                    {/* Top Line: Period Badge + Status */}
                                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                                        <span className={`font-semibold ${isSelected ? 'text-white' : 'text-neutral-500'}`}>
                                            {slot.periodName}
                                        </span>
                                        {isBooked ? (
                                            <span className="flex items-center gap-1 text-neutral-400 font-bold text-[10px]">
                                                <Lock className="w-3 h-3" />
                                                <span>محجوز</span>
                                            </span>
                                        ) : isSelected ? (
                                            <span className="flex items-center gap-1 text-white font-bold text-[10px] bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                                                <Check className="w-3 h-3 stroke-[3]" />
                                                <span>محدد</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
                                                    ? 'text-neutral-400 line-through'
                                                    : isSelected
                                                    ? 'text-white'
                                                    : 'text-neutral-950'
                                            }`}
                                        >
                                            <span className="tabular-nums font-extrabold">{slot.startDisplay}</span>
                                            <span className={`text-xs font-bold ${isSelected ? 'text-white/80' : 'text-red-600'}`}>←</span>
                                            <span className="tabular-nums font-extrabold">{slot.endDisplay}</span>
                                        </div>
                                    </div>

                                    {/* Bottom Info: 60 minutes & rate */}
                                    <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-black/5 text-[11px]">
                                        <span className={isSelected ? 'text-white/90' : 'text-neutral-500 font-medium'}>
                                            جلسة 60 دقيقة
                                        </span>
                                        <span className={`font-bold ${isSelected ? 'text-white font-black' : 'text-red-600'}`}>
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
                <section className="bg-white border-2 border-neutral-200/90 rounded-2xl p-3 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-2.5 px-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-900 font-bold">
                            <Coffee className="w-4 h-4 text-amber-600" />
                            <span>سناكس ومشروبات أثناء اللعب (اختياري)</span>
                        </div>
                        <span className="text-xs text-amber-800 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
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
                                            ? 'bg-red-50 border-red-500 text-neutral-950 shadow-sm'
                                            : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-white hover:border-neutral-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${
                                                isChecked
                                                    ? 'bg-red-600 border-red-600 text-white shadow-sm'
                                                    : 'border-neutral-300 bg-white'
                                            }`}
                                        >
                                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold flex items-center gap-1 text-neutral-900">
                                                <span>{snack.icon}</span>
                                                <span className="truncate max-w-[130px]">{snack.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-xs text-red-600 shrink-0 font-body">
                                        +{snack.price} ج.م
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* ─────────────────────────────────────────────────────────────
                FIXED BOTTOM STICKY SUMMARY BAR (CLEAN LIGHT MODE)
               ───────────────────────────────────────────────────────────── */}
            <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 border-t-2 border-neutral-200 backdrop-blur-2xl p-3 sm:p-4 pb-safe shadow-[0_-4px_30px_rgba(0,0,0,0.08)]">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    {/* Financial & Time Summary */}
                    <div className="flex flex-col text-right">
                        <div className="flex items-baseline gap-2">
                            <span className="font-brush text-3xl sm:text-4xl font-black text-neutral-950">
                                {grandTotal}
                            </span>
                            <span className="text-xs text-neutral-600 font-bold">ج.م</span>
                            <span className="text-xs text-red-700 font-bold mr-1.5 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                ({durationHours} {durationHours === 1 ? 'ساعة' : durationHours === 2 ? 'ساعتان' : 'ساعات'})
                            </span>
                        </div>
                        <div className="text-xs text-neutral-600 flex items-center gap-1.5 mt-0.5 font-medium">
                            <span className="font-bold text-neutral-900">{currentRoom.nameEn}</span>
                            <span>•</span>
                            <div dir="rtl" className="flex items-center gap-1 text-red-600 font-bold">
                                <span>{startDisplayTime}</span>
                                <span>←</span>
                                <span>{endDisplayTime}</span>
                            </div>
                        </div>
                    </div>

                    {/* Continue CTA */}
                    <button
                        onClick={handleContinue}
                        className="py-3 px-6 sm:px-8 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-600/25 active:scale-95 transition-all cursor-pointer shrink-0 border border-red-500"
                    >
                        <span>تأكيد الحجز والدفع</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
}
