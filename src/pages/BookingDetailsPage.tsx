import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowRight,
    Gamepad2,
    Calendar,
    Clock,
    CheckCircle2,
    Sparkles,
    Coffee,
    Plus,
    Check,
    Lock,
    Zap,
    DoorClosed,
    Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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
        name: 'كومبو الجيمرز (ريدبول + سناك شيبس ومكسرات)',
        price: 55,
        description: 'طاقة وتركيز إضافي للجلسات الطويلة',
        icon: '⚡',
    },
    {
        id: 'coffee_specialty',
        name: 'قهوة سبيشالتي دبل إسبريسو / آيس لاتيه',
        price: 40,
        description: 'بُن برازيلي فاخر محمص طازجاً',
        icon: '☕',
    },
    {
        id: 'water_cold',
        name: 'مياه معدنية مثلجة (حجم كبير)',
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
    fullLabel: string;
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
            if (h >= 16 && h < 19) return 'العصر والمغرب';
            if (h >= 19 && h < 23) return 'ذروة الجيمرز 🔥';
            return 'سهرة الفجر 🌙';
        };

        const slots: DynamicSlot[] = [];
        // Generate up to 14 slots ahead
        const count = isToday ? 12 : 16;

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
                fullLabel: `${startDisplay} - ${endDisplay}`,
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
            // Deselect this and following
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
        <div className="bg-[#090707] text-white font-body text-sm flex flex-col min-h-screen selection:bg-red-500/30">
            {/* Ambient Background Lights */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-red-950/20 blur-[130px] rounded-full" />
                <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-amber-950/15 blur-[120px] rounded-full" />
            </div>

            {/* Top Navigation Bar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-[#090707]/90 backdrop-blur-xl pt-safe border-b border-white/10">
                <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-5xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/playstation"
                            aria-label="الرجوع للأجهزة"
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:text-red-400 transition-colors active:scale-95 cursor-pointer border border-white/10"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div className="flex flex-col text-right">
                            <h1 className="font-brush text-lg text-white">حجز الغرفة ومواعيد اليوم</h1>
                            <span className="font-body text-[10px] text-neutral-400">D95 GAMING &amp; CAFÉ</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-600/40 text-red-300 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>مواعيد ديناميكية حية</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative z-10 w-full pt-20 pb-32 px-3.5 sm:px-6 max-w-4xl mx-auto" dir="rtl">
                {/* ─────────────────────────────────────────────────────────────
                    SECTION 1: ROOM SELECTOR TABS (ROOM 1 vs ROOM 2)
                   ───────────────────────────────────────────────────────────── */}
                <section className="my-3">
                    <div className="text-xs text-neutral-400 font-bold mb-2 flex items-center justify-between px-1">
                        <span>اختر الغرفة المراد حجزها:</span>
                        <span className="text-red-400 font-brush">100 ج.م / ساعة</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {AVAILABLE_ROOMS.map((room) => {
                            const isSelected = selectedRoomId === room.id;
                            return (
                                <button
                                    key={room.id}
                                    onClick={() => setSelectedRoomId(room.id)}
                                    className={`relative p-3.5 sm:p-4 rounded-2xl border text-right transition-all duration-200 cursor-pointer ${
                                        isSelected
                                            ? 'bg-gradient-to-br from-red-950/80 to-neutral-900 border-red-500 shadow-[0_0_25px_rgba(181,24,36,0.35)]'
                                            : 'bg-neutral-900/60 border-white/5 hover:border-white/20 hover:bg-neutral-900'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-neutral-200">
                                            <DoorClosed className={`w-4 h-4 ${isSelected ? 'text-red-400' : 'text-neutral-400'}`} />
                                        </div>
                                        {isSelected && (
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        )}
                                    </div>
                                    <div className="font-brush text-base sm:text-lg text-white">
                                        {room.nameEn}
                                    </div>
                                    <div className="text-xs text-neutral-300 font-bold mt-0.5">
                                        {room.name}
                                    </div>
                                    <div className="text-[10px] text-neutral-400 mt-1 truncate">
                                        {room.specs}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    SECTION 2: 7-DAY DATE SELECTOR
                   ───────────────────────────────────────────────────────────── */}
                <section className="my-3 bg-neutral-900/60 border border-white/5 rounded-2xl p-3.5 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-bold">
                            <Calendar className="w-4 h-4 text-red-400" />
                            <span>تاريخ الحجز:</span>
                        </div>
                        {isToday && (
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
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
                                    className={`shrink-0 py-2.5 px-4 rounded-xl border text-center transition-all cursor-pointer min-w-[76px] ${
                                        active
                                            ? 'bg-red-700 border-red-500 text-white shadow-lg shadow-red-900/50 scale-105'
                                            : 'bg-black/40 border-white/5 text-neutral-400 hover:text-white hover:border-white/20'
                                    }`}
                                >
                                    <div className="text-[11px] font-bold">{d.dayName}</div>
                                    <div className="text-base font-black font-brush my-0.5">{d.dayNumber}</div>
                                    <div className="text-[9px] opacity-75">{d.monthName}</div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    SECTION 3: DYNAMIC 1-HOUR SLOTS GRID (HEART OF THE FEATURE)
                   ───────────────────────────────────────────────────────────── */}
                <section className="my-3 bg-neutral-900/60 border border-white/5 rounded-2xl p-3.5 sm:p-5 backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/5">
                        <div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-red-400" />
                                <h2 className="font-bold text-sm sm:text-base text-white">
                                    الأوقات المتاحة للحجز اليوم ({currentRoom.nameEn})
                                </h2>
                            </div>
                            <p className="text-xs text-neutral-400 mt-1">
                                كل خانة تمثل ساعة كاملة من وقت الحجز • انقر لاختيار ساعة أو أكثر
                            </p>
                        </div>

                        {/* Quick Duration Pills */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-black/40 p-1 rounded-xl border border-white/5">
                            <span className="text-[10px] text-neutral-400 px-1 font-bold">المدة:</span>
                            {[1, 2, 3, 4].map((h) => (
                                <button
                                    key={h}
                                    onClick={() => handleQuickDuration(h)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                        durationHours === h
                                            ? 'bg-red-700 text-white shadow-sm'
                                            : 'text-neutral-300 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {h} س
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Slots Legend */}
                    <div className="flex items-center gap-4 text-xs mb-3 px-1">
                        <div className="flex items-center gap-1.5 text-neutral-300">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span>متاح للحجز</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-300">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_#c41e3a]" />
                            <span>محدد لحجزك</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-500">
                            <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                            <span>محجوز 🔒</span>
                        </div>
                    </div>

                    {/* Dynamic Slots Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {generatedSlots.map((slot) => {
                            const isSelected = selectedSlotIndices.includes(slot.index);
                            const isBooked = slot.isBooked;

                            return (
                                <motion.div
                                    key={slot.id}
                                    whileTap={!isBooked ? { scale: 0.98 } : undefined}
                                    onClick={() => handleSlotClick(slot)}
                                    className={`relative p-3 rounded-xl border transition-all duration-200 select-none ${
                                        isBooked
                                            ? 'bg-black/40 border-white/5 opacity-50 cursor-not-allowed'
                                            : isSelected
                                            ? 'bg-gradient-to-r from-red-700 to-red-800 border-red-400 text-white shadow-[0_0_20px_rgba(181,24,36,0.4)] cursor-pointer scale-[1.02]'
                                            : 'bg-black/30 border-white/5 hover:border-white/20 hover:bg-white/5 cursor-pointer'
                                    }`}
                                >
                                    {/* Top Line: Period Badge + Status */}
                                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                                        <span className={isSelected ? 'text-white/80' : 'text-neutral-400'}>
                                            {slot.periodName}
                                        </span>
                                        {isBooked ? (
                                            <span className="flex items-center gap-1 text-neutral-400 font-bold">
                                                <Lock className="w-3 h-3" />
                                                <span>محجوز</span>
                                            </span>
                                        ) : isSelected ? (
                                            <span className="flex items-center gap-1 text-white font-bold bg-black/30 px-2 py-0.5 rounded-full">
                                                <Check className="w-3 h-3" />
                                                <span>ساعة محددة</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span>متاح</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Dynamic Time Range: Start to End (e.g. 04:15 م - 05:14 م) */}
                                    <div className="text-right" dir="ltr">
                                        <div
                                            className={`font-brush text-base sm:text-lg tracking-wide ${
                                                isBooked
                                                    ? 'text-neutral-500 line-through'
                                                    : isSelected
                                                    ? 'text-white'
                                                    : 'text-neutral-100'
                                            }`}
                                        >
                                            {slot.fullLabel}
                                        </div>
                                    </div>

                                    {/* Bottom Info: 60 minutes & rate */}
                                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/5 text-[11px]">
                                        <span className={isSelected ? 'text-white/80' : 'text-neutral-400'}>
                                            جلسة 60 دقيقة
                                        </span>
                                        <span className={`font-bold ${isSelected ? 'text-white' : 'text-red-400 font-brush'}`}>
                                            {currentRoom.rate} ج.م
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    SECTION 4: GAMING SNACKS & DRINKS (OPTIONAL ADDONS)
                   ───────────────────────────────────────────────────────────── */}
                <section className="my-3 bg-neutral-900/60 border border-white/5 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-3">
                        <Coffee className="w-4 h-4 text-amber-400" />
                        <h3 className="font-bold text-sm text-white">سناكس ومشروبات أثناء اللعب (اختياري)</h3>
                    </div>

                    <div className="space-y-2">
                        {SNACK_OPTIONS.map((snack) => {
                            const isChecked = selectedSnacks.includes(snack.id);
                            return (
                                <div
                                    key={snack.id}
                                    onClick={() => toggleSnack(snack.id)}
                                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                        isChecked
                                            ? 'bg-red-950/40 border-red-600/50 text-white'
                                            : 'bg-black/30 border-white/5 text-neutral-300 hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                                                isChecked
                                                    ? 'bg-red-600 border-red-500 text-white'
                                                    : 'border-white/20 bg-black/40'
                                            }`}
                                        >
                                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold flex items-center gap-1.5">
                                                <span>{snack.icon}</span>
                                                <span>{snack.name}</span>
                                            </div>
                                            <div className="text-[10px] text-neutral-400 mt-0.5">
                                                {snack.description}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-brush text-sm font-bold text-amber-400 shrink-0">
                                        +{snack.price} ج.م
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* ─────────────────────────────────────────────────────────────
                FIXED BOTTOM STICKY SUMMARY BAR (SENIOR UX)
               ───────────────────────────────────────────────────────────── */}
            <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0c090a]/95 border-t border-white/10 backdrop-blur-xl p-3 sm:p-4 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    {/* Left: Financial & Time Summary */}
                    <div className="flex flex-col text-right">
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-brush text-2xl sm:text-3xl font-black text-white">
                                {grandTotal}
                            </span>
                            <span className="text-xs text-neutral-300 font-bold">ج.م</span>
                            <span className="text-xs text-red-400 font-bold mr-2">
                                ({durationHours} {durationHours === 1 ? 'ساعة' : durationHours === 2 ? 'ساعتان' : 'ساعات'})
                            </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                            <span className="font-bold text-neutral-300">{currentRoom.nameEn}</span>
                            <span>•</span>
                            <span dir="ltr" className="font-bold text-white">
                                {startDisplayTime} - {endDisplayTime}
                            </span>
                        </div>
                    </div>

                    {/* Right: Continue CTA */}
                    <button
                        onClick={handleContinue}
                        className="py-3 px-5 sm:px-8 rounded-xl bg-gradient-to-r from-red-700 to-red-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-900/50 hover:from-red-600 hover:to-red-500 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                        <span>تأكيد الحجز والدفع</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
}
