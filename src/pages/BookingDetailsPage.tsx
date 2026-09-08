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
            if (h >= 16 && h < 19) return 'العصر';
            if (h >= 19 && h < 23) return 'ذروة 🔥';
            return 'سهرة 🌙';
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
        <div className="min-h-screen w-full bg-[#121010] text-[#f2ede8] font-body text-sm flex flex-col selection:bg-red-600/40 relative select-none">
            {/* ─────────────────────────────────────────────────────────────
                AUTHENTIC D95 WALL ATMOSPHERE:
                LIGHT CONCRETE TEXTURE + INDUSTRIAL CEILING SPOTLIGHT CONES
               ───────────────────────────────────────────────────────────── */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                {/* Center Overhead Track Spotlight */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[340px] bg-[radial-gradient(ellipse_75%_50%_at_50%_0%,rgba(255,245,235,0.22)_0%,rgba(255,240,230,0.06)_45%,transparent_75%)] blur-[40px]" />
                {/* Left Spotlight Cone */}
                <div className="absolute top-0 left-[12%] w-[420px] h-[320px] bg-[radial-gradient(circle_at_top,rgba(255,248,240,0.18)_0%,transparent_70%)] blur-[35px]" />
                {/* Right Spotlight Cone */}
                <div className="absolute top-0 right-[12%] w-[420px] h-[320px] bg-[radial-gradient(circle_at_top,rgba(255,248,240,0.18)_0%,transparent_70%)] blur-[35px]" />
                {/* D95 Crimson Glow from below */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[320px] bg-[#b51824]/14 blur-[120px] rounded-full" />
                <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-[#d4a017]/10 blur-[130px] rounded-full" />
            </div>

            {/* Top Navigation Bar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-[#161214]/90 backdrop-blur-xl pt-safe border-b border-white/10 shadow-md">
                <div className="h-14 px-4 md:px-8 flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/playstation"
                            aria-label="الرجوع للغرف"
                            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white hover:text-red-400 hover:border-red-500/40 transition-colors active:scale-95 cursor-pointer border border-white/10"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <div className="flex flex-col text-right">
                            <h1 className="font-brush text-base text-white leading-tight">
                                حجز الغرفة ومواعيد اليوم
                            </h1>
                            <div className="flex items-center gap-1.5 -mt-0.5">
                                <span className="font-brush text-xs text-red-500">D95</span>
                                <span className="text-[10px] text-neutral-400">GAMING &amp; CAFÉ</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>مواعيد ديناميكية حية</span>
                    </div>
                </div>
            </header>

            {/* Ceiling Spotlight Fixtures Visual Track */}
            <div className="relative z-10 w-full max-w-xl mx-auto flex items-center justify-between px-8 pt-16 pb-1 opacity-75">
                <div className="flex flex-col items-center">
                    <span className="w-2.5 h-1.5 rounded-t bg-neutral-400" />
                    <span className="w-3.5 h-1 bg-yellow-100 rounded-full shadow-[0_0_10px_#fff]" />
                </div>
                <div className="h-[2px] flex-1 mx-3 bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-600" />
                <div className="flex flex-col items-center">
                    <span className="w-3 h-2 rounded-t bg-neutral-300" />
                    <span className="w-4 h-1 bg-yellow-100 rounded-full shadow-[0_0_12px_#fff]" />
                </div>
                <div className="h-[2px] flex-1 mx-3 bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-600" />
                <div className="flex flex-col items-center">
                    <span className="w-2.5 h-1.5 rounded-t bg-neutral-400" />
                    <span className="w-3.5 h-1 bg-yellow-100 rounded-full shadow-[0_0_10px_#fff]" />
                </div>
            </div>

            {/* Main Content Area (Compact, Screen-Fitting Architecture) */}
            <main className="flex-1 flex flex-col relative z-10 w-full pb-28 px-3.5 sm:px-6 max-w-4xl mx-auto space-y-3" dir="rtl">
                {/* ─────────────────────────────────────────────────────────────
                    SECTION 1: COMPACT ROOM SELECTOR SWITCH (ROOM 1 vs ROOM 2)
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-[#181315]/95 border border-red-950/80 rounded-2xl p-2.5 shadow-lg">
                    <div className="flex items-center justify-between px-2 mb-1.5 text-xs">
                        <span className="text-neutral-300 font-bold flex items-center gap-1.5">
                            <DoorClosed className="w-3.5 h-3.5 text-red-500" />
                            <span>اختر الغرفة:</span>
                        </span>
                        <span className="text-red-400 font-brush text-xs">
                            100 ج.م / ساعة
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {AVAILABLE_ROOMS.map((room) => {
                            const isSelected = selectedRoomId === room.id;
                            return (
                                <button
                                    key={room.id}
                                    onClick={() => setSelectedRoomId(room.id)}
                                    className={`relative py-2 px-3 sm:px-4 rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer ${
                                        isSelected
                                            ? 'bg-gradient-to-r from-[#b51824] to-[#8b1119] border-red-500 text-white shadow-md shadow-red-950/70 scale-[1.01]'
                                            : 'bg-black/50 border-white/10 text-neutral-300 hover:text-white hover:bg-black/70 hover:border-neutral-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-black/30 text-white' : 'bg-white/5 text-neutral-400'}`}>
                                            <DoorClosed className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="text-right">
                                            <div className="font-brush text-sm sm:text-base leading-tight font-bold">
                                                {room.nameEn}
                                            </div>
                                            <div className="text-[10px] opacity-85 leading-none">
                                                {room.name}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-left" dir="ltr">
                                        <span className="font-brush text-sm sm:text-base font-bold">
                                            {room.rate}
                                        </span>
                                        <span className="text-[10px] font-bold ml-1 opacity-90">
                                            EGP/HR
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    SECTION 2: COMPACT 7-DAY DATE SELECTOR
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-[#181315]/95 border border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-lg">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-bold">
                            <Calendar className="w-3.5 h-3.5 text-red-400" />
                            <span>تاريخ الحجز:</span>
                        </div>
                        {isToday && (
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                يبدأ فوراً من الوقت الحالي
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
                        {calendarDays.map((d) => {
                            const active = selectedDate === d.iso;
                            return (
                                <button
                                    key={d.iso}
                                    onClick={() => setSelectedDate(d.iso)}
                                    className={`shrink-0 py-1.5 px-3 rounded-xl border text-center transition-all cursor-pointer min-w-[66px] ${
                                        active
                                            ? 'bg-gradient-to-b from-[#b51824] to-[#8b1119] border-red-400 text-white shadow-md shadow-red-950/70 scale-105'
                                            : 'bg-black/50 border-white/10 text-neutral-400 hover:text-white hover:border-neutral-500'
                                    }`}
                                >
                                    <div className="text-[10px] font-bold">{d.dayName}</div>
                                    <div className="text-sm font-black font-brush my-0.5">{d.dayNumber}</div>
                                    <div className="text-[9px] opacity-75">{d.monthName}</div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    SECTION 3: COMPACT DYNAMIC TIME SLOTS GRID (HEART OF THE UI)
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-[#181315]/95 border border-red-950/80 rounded-2xl p-3 sm:p-4 shadow-xl">
                    {/* Header: Title + Quick Duration Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-white/10">
                        <div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-red-400" />
                                <h2 className="font-bold text-xs sm:text-sm text-white">
                                    الأوقات المتاحة للحجز اليوم ({currentRoom.nameEn})
                                </h2>
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-0.5">
                                انقر لاختيار ساعة أو أكثر متتالية • الحساب ديناميكي
                            </p>
                        </div>

                        {/* Quick Duration Pills */}
                        <div className="flex items-center gap-1 self-start sm:self-auto bg-black/60 p-1 rounded-xl border border-white/10">
                            <span className="text-[10px] text-neutral-400 px-1 font-bold">المدة:</span>
                            {[1, 2, 3, 4].map((h) => (
                                <button
                                    key={h}
                                    onClick={() => handleQuickDuration(h)}
                                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                        durationHours === h
                                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm'
                                            : 'text-neutral-300 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {h} س
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Slots Legend */}
                    <div className="flex items-center gap-3 text-[11px] mb-2.5 px-1">
                        <div className="flex items-center gap-1.5 text-neutral-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>متاح</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-300">
                            <span className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_#c41e3a]" />
                            <span>محدد لحجزك</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-500">
                            <span className="w-2 h-2 rounded-full bg-neutral-700" />
                            <span>محجوز 🔒</span>
                        </div>
                    </div>

                    {/* THE COMPACT 4-COLUMN GRID (REDUCED HEIGHT & SCREEN FIT) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {generatedSlots.map((slot) => {
                            const isSelected = selectedSlotIndices.includes(slot.index);
                            const isBooked = slot.isBooked;

                            return (
                                <motion.div
                                    key={slot.id}
                                    whileTap={!isBooked ? { scale: 0.98 } : undefined}
                                    onClick={() => handleSlotClick(slot)}
                                    className={`relative p-2 sm:p-2.5 rounded-xl border transition-all duration-200 select-none cursor-pointer flex flex-col justify-between ${
                                        isBooked
                                            ? 'bg-[#120e10]/60 border-neutral-800/80 opacity-40 cursor-not-allowed'
                                            : isSelected
                                            ? 'bg-gradient-to-r from-[#b51824] to-[#8b1119] border-red-400 text-white shadow-[0_0_18px_rgba(220,38,38,0.55)] scale-[1.02]'
                                            : 'bg-black/50 border-neutral-700/60 hover:border-red-500/60 hover:bg-neutral-900 text-neutral-200'
                                    }`}
                                >
                                    {/* Top Line: Period Badge + Status */}
                                    <div className="flex items-center justify-between text-[10px] mb-1">
                                        <span className={`text-[10px] font-medium ${isSelected ? 'text-white/90' : 'text-neutral-400'}`}>
                                            {slot.periodName}
                                        </span>
                                        {isBooked ? (
                                            <span className="flex items-center gap-0.5 text-neutral-400 font-bold text-[9px]">
                                                <Lock className="w-2.5 h-2.5" />
                                                <span>محجوز</span>
                                            </span>
                                        ) : isSelected ? (
                                            <span className="flex items-center gap-0.5 text-white font-bold text-[9px] bg-black/40 px-1.5 py-0.5 rounded-full">
                                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                <span>محدد</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-emerald-400 font-bold text-[9px]">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span>متاح</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Dynamic Time Range: Start to End (e.g. 04:15 م - 05:14 م) */}
                                    <div className="text-center my-0.5" dir="ltr">
                                        <div
                                            className={`font-brush text-sm sm:text-base font-bold tracking-tight ${
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
                                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/10 text-[10px]">
                                        <span className={isSelected ? 'text-white/80' : 'text-neutral-400'}>
                                            جلسة 60 دقيقة
                                        </span>
                                        <span className={`font-bold font-brush ${isSelected ? 'text-white' : 'text-red-400'}`}>
                                            {currentRoom.rate} ج.م
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    SECTION 4: COMPACT SNACKS & DRINKS (OPTIONAL ADDONS)
                   ───────────────────────────────────────────────────────────── */}
                <section className="bg-[#181315]/95 border border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-lg">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-bold">
                            <Coffee className="w-3.5 h-3.5 text-amber-400" />
                            <span>سناكس ومشروبات أثناء اللعب (اختياري)</span>
                        </div>
                        <span className="text-[10px] text-amber-400/90 font-bold">
                            خدمة الضيافة حتى الغرفة
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {SNACK_OPTIONS.map((snack) => {
                            const isChecked = selectedSnacks.includes(snack.id);
                            return (
                                <div
                                    key={snack.id}
                                    onClick={() => toggleSnack(snack.id)}
                                    className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                        isChecked
                                            ? 'bg-red-950/60 border-red-500 text-white shadow-sm'
                                            : 'bg-black/50 border-white/10 text-neutral-300 hover:border-neutral-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                                isChecked
                                                    ? 'bg-red-600 border-red-500 text-white'
                                                    : 'border-white/20 bg-black/40'
                                            }`}
                                        >
                                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-bold flex items-center gap-1">
                                                <span>{snack.icon}</span>
                                                <span className="truncate max-w-[130px]">{snack.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-brush text-xs font-bold text-amber-400 shrink-0">
                                        +{snack.price} ج.م
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* ─────────────────────────────────────────────────────────────
                FIXED BOTTOM STICKY SUMMARY BAR (COMPACT HIGH-CONTRAST)
               ───────────────────────────────────────────────────────────── */}
            <div className="fixed bottom-0 inset-x-0 z-40 bg-[#161214]/95 border-t border-white/15 backdrop-blur-xl p-3 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.85)]">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    {/* Financial & Time Summary */}
                    <div className="flex flex-col text-right">
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-brush text-2xl sm:text-3xl font-black text-white">
                                {grandTotal}
                            </span>
                            <span className="text-xs text-neutral-300 font-bold">ج.م</span>
                            <span className="text-xs text-red-400 font-bold mr-1.5">
                                ({durationHours} {durationHours === 1 ? 'ساعة' : durationHours === 2 ? 'ساعتان' : 'ساعات'})
                            </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 flex items-center gap-1 -mt-0.5">
                            <span className="font-bold text-neutral-200">{currentRoom.nameEn}</span>
                            <span>•</span>
                            <span dir="ltr" className="font-bold text-white">
                                {startDisplayTime} - {endDisplayTime}
                            </span>
                        </div>
                    </div>

                    {/* Continue CTA */}
                    <button
                        onClick={handleContinue}
                        className="py-2.5 px-5 sm:px-7 rounded-xl bg-gradient-to-r from-[#b51824] via-red-600 to-[#8b1119] hover:from-red-600 hover:to-red-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-950/70 active:scale-95 transition-all cursor-pointer shrink-0 border border-red-400/30"
                    >
                        <span>تأكيد الحجز والدفع</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
}
