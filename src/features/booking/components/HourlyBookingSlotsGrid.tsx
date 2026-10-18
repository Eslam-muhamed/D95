import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Lock,
    CheckCircle2,
    Sun,
    Moon,
    Sunset,
    Timer,
    Check,
} from 'lucide-react';
import {
    type BookingInterval,
    createDateTimeFromBusinessDate,
    formatArabicTime,
    formatArabicTimeFromDate,
} from '@/lib/bookingDatetime';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';
import { toast } from 'sonner';

export interface HourlySlotData {
    hour24: number; // 0..23
    hour12: number;
    period: 'AM' | 'PM';
    label: string; // e.g. "12:00 ص" or "10:00 م"
    endLabel: string; // e.g. "01:00 ص"
    periodGroup: 'night' | 'day' | 'evening';
    start: Date;
    end: Date;
    isPast: boolean;
    isBooked: boolean;
    isSelected: boolean;
    isStartHour: boolean;
    isSubsequentHour: boolean;
    conflictingBooking?: BookingInterval;
}

interface HourlyBookingSlotsGridProps {
    selectedDate: string;
    roomRate: number;
    occupiedIntervals: BookingInterval[];
    selectedStartHour24: number | null;
    durationHours: number;
    onSelectSlot: (startHour24: number, durationHours: number) => void;
    onChangeDuration: (newDuration: number) => void;
}

type PeriodFilter = 'all' | 'evening' | 'night' | 'day';

const DURATION_CHOICES = [1, 2, 3, 4, 5, 6];

export default function HourlyBookingSlotsGrid({
    selectedDate,
    roomRate,
    occupiedIntervals,
    selectedStartHour24,
    durationHours,
    onSelectSlot,
    onChangeDuration,
}: HourlyBookingSlotsGridProps) {
    const [filter, setFilter] = useState<PeriodFilter>('all');

    // Build the 24 hourly slots for the selected date
    const slots = useMemo<HourlySlotData[]>(() => {
        const result: HourlySlotData[] = [];
        const now = Date.now();

        for (let h = 0; h < 24; h++) {
            const time24 = `${String(h).padStart(2, '0')}:00`;
            const start = createDateTimeFromBusinessDate(selectedDate, time24);
            const end = new Date(start.getTime() + 60 * 60 * 1000); // 1-hour slot

            const isPast = end.getTime() <= now;

            // Check if this 1-hour slot overlaps any occupied interval in the database
            let isBooked = false;
            let conflictingBooking: BookingInterval | undefined;

            const slotStartMs = start.getTime();
            const slotEndMs = end.getTime();

            for (const inv of occupiedIntervals) {
                if (slotStartMs < inv.end.getTime() && slotEndMs > inv.start.getTime()) {
                    isBooked = true;
                    conflictingBooking = inv;
                    break;
                }
            }

            const hour12 = h % 12 === 0 ? 12 : h % 12;
            const period: 'AM' | 'PM' = h >= 12 && h < 24 ? 'PM' : 'AM';
            const nextHour = (h + 1) % 24;
            const label = formatArabicTime(h, 0);
            const endLabel = formatArabicTime(nextHour, 0);

            // Grouping:
            // Night (السهرة): 00:00 - 05:59 (hours 0..5)
            // Day (النهار): 06:00 - 17:59 (hours 6..17)
            // Evening (المساء): 18:00 - 23:59 (hours 18..23)
            let periodGroup: 'night' | 'day' | 'evening' = 'night';
            if (h >= 6 && h < 18) {
                periodGroup = 'day';
            } else if (h >= 18) {
                periodGroup = 'evening';
            }

            // Check if slot falls within user selected startHour + duration
            let isSelected = false;
            let isStartHour = false;
            let isSubsequentHour = false;

            if (selectedStartHour24 !== null) {
                const selectedEndHour = selectedStartHour24 + durationHours;
                if (h >= selectedStartHour24 && h < selectedEndHour) {
                    isSelected = true;
                    if (h === selectedStartHour24) {
                        isStartHour = true;
                    } else {
                        isSubsequentHour = true;
                    }
                }
            }

            result.push({
                hour24: h,
                hour12,
                period,
                label,
                endLabel,
                periodGroup,
                start,
                end,
                isPast,
                isBooked,
                isSelected,
                isStartHour,
                isSubsequentHour,
                conflictingBooking,
            });
        }

        return result;
    }, [selectedDate, occupiedIntervals, selectedStartHour24, durationHours]);

    // Statistics count
    const stats = useMemo(() => {
        let available = 0;
        let booked = 0;
        let past = 0;

        slots.forEach((s) => {
            if (s.isPast) past++;
            else if (s.isBooked) booked++;
            else available++;
        });

        return { available, booked, past };
    }, [slots]);

    // Groups for display
    const groups = useMemo(() => {
        const evening = slots.filter((s) => s.periodGroup === 'evening');
        const night = slots.filter((s) => s.periodGroup === 'night');
        const day = slots.filter((s) => s.periodGroup === 'day');

        if (filter === 'evening') return [{ id: 'evening', title: 'الفترة المسائية', subtitle: '٠٦:٠٠ م - ١١:٠٠ م', icon: <Sunset className="w-4 h-4 text-rose-400" />, slots: evening }];
        if (filter === 'night') return [{ id: 'night', title: 'فترة السهرة', subtitle: '١٢:٠٠ منتصف الليل - ٠٥:٠٠ ص', icon: <Moon className="w-4 h-4 text-indigo-400" />, slots: night }];
        if (filter === 'day') return [{ id: 'day', title: 'فترة الصباح والنهار', subtitle: '٠٦:٠٠ ص - ٠٥:٠٠ م', icon: <Sun className="w-4 h-4 text-amber-400" />, slots: day }];

        // 'all': Show Evening first (most popular for gaming), then Night, then Day
        return [
            { id: 'evening', title: 'الفترة المسائية', subtitle: '٠٦:٠٠ م - ١١:٠٠ م', icon: <Sunset className="w-4 h-4 text-rose-400" />, slots: evening },
            { id: 'night', title: 'فترة السهرة', subtitle: '١٢:٠٠ منتصف الليل - ٠٥:٠٠ ص', icon: <Moon className="w-4 h-4 text-indigo-400" />, slots: night },
            { id: 'day', title: 'فترة الصباح والنهار', subtitle: '٠٦:٠٠ ص - ٠٥:٠٠ م', icon: <Sun className="w-4 h-4 text-amber-400" />, slots: day },
        ];
    }, [slots, filter]);

    // Slot click handler: Selects the clicked hour as start, and spans durationHours consecutive slots
    const handleSlotClick = (slot: HourlySlotData) => {
        if (slot.isPast) {
            toast.error('هذا الوقت قد مضى بالفعل، يرجى اختيار موعد قادم ⏳');
            return;
        }

        if (slot.isBooked) {
            const timeDesc = slot.conflictingBooking
                ? `محجوز من ${formatArabicTimeFromDate(slot.conflictingBooking.start)} إلى ${formatArabicTimeFromDate(slot.conflictingBooking.end)}`
                : 'هذه الساعة محجوزة بالكامل';
            toast.error(`${timeDesc} 🔒`);
            return;
        }

        playPs5SelectSound();

        const startH = slot.hour24;
        const requestedDuration = durationHours;

        // Check if subsequent consecutive hours are free
        let canFitRequested = true;
        let conflictHour = -1;
        let availableCount = 1;

        for (let offset = 1; offset < requestedDuration; offset++) {
            const checkH = startH + offset;
            if (checkH >= 24) {
                canFitRequested = false;
                conflictHour = checkH;
                break;
            }
            const nextSlot = slots.find((s) => s.hour24 === checkH);
            if (!nextSlot || nextSlot.isBooked || nextSlot.isPast) {
                canFitRequested = false;
                conflictHour = checkH;
                break;
            }
            availableCount++;
        }

        if (canFitRequested) {
            onSelectSlot(startH, requestedDuration);
            if (requestedDuration > 1) {
                const endH = (startH + requestedDuration) % 24;
                toast.success(`تم اختيار ${requestedDuration} ساعات تبدأ من ${slot.label} حتى ${formatArabicTime(endH, 0)} 🎮`);
            } else {
                toast.success(`تم اختيار الساعة: ${slot.label} 🎮`);
            }
        } else {
            // Automatically select the maximum consecutive available hours
            onSelectSlot(startH, availableCount);
            const conflictSlot = slots.find((s) => s.hour24 === conflictHour);
            const conflictLabel = conflictSlot ? conflictSlot.label : 'نهاية اليوم';
            toast.warning(
                `الساعة ${conflictLabel} محجوزة! تم تحديد المتاح فقط (${availableCount} ${availableCount === 1 ? 'ساعة' : 'ساعات'}) 🔒`
            );
        }
    };

    // Duration change handler from the top selector
    const handleDurationChange = (newDuration: number) => {
        playPs5NavigateSound();

        if (selectedStartHour24 === null) {
            // Setting duration before picking a slot
            onChangeDuration(newDuration);
            return;
        }

        // A start hour is already selected:
        if (newDuration <= durationHours) {
            onSelectSlot(selectedStartHour24, newDuration);
            return;
        }

        // Expanding duration:
        const startH = selectedStartHour24;
        let canExpand = true;
        let conflictLabel = '';

        for (let offset = 1; offset < newDuration; offset++) {
            const checkH = startH + offset;
            if (checkH >= 24) {
                canExpand = false;
                conflictLabel = 'نهاية اليوم';
                break;
            }
            const nextSlot = slots.find((s) => s.hour24 === checkH);
            if (!nextSlot || nextSlot.isBooked || nextSlot.isPast) {
                canExpand = false;
                conflictLabel = nextSlot ? nextSlot.label : `${checkH}:00`;
                break;
            }
        }

        if (canExpand) {
            onSelectSlot(selectedStartHour24, newDuration);
        } else {
            toast.error(`لا يمكن زيادة المدة إلى ${newDuration} ساعات لأن الساعة ${conflictLabel} محجوزة 🔒`);
        }
    };

    // Selected session label
    const selectedSessionInfo = useMemo(() => {
        if (selectedStartHour24 === null) return null;
        const startSlot = slots.find((s) => s.hour24 === selectedStartHour24);
        if (!startSlot) return null;

        const endHour24 = (selectedStartHour24 + durationHours) % 24;
        const formattedEnd = formatArabicTime(endHour24, 0);

        return {
            startLabel: startSlot.label,
            endLabel: formattedEnd,
            totalPrice: Math.round(durationHours * roomRate),
        };
    }, [slots, selectedStartHour24, durationHours, roomRate]);

    return (
        <div className="space-y-4" dir="rtl">
            {/* Control Panel: Duration & Filter */}
            <div className="bg-white/90 dark:bg-[#130f11] backdrop-blur-md border border-neutral-200/90 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-red-600/10 dark:bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-600 dark:text-red-500 shrink-0">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white">
                                    اختر موعد الحجز
                                </h3>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    24/7 مفتوح
                                </span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                اختر المدة أولاً ثم اضغط على ساعة البدء المطلوبة
                            </p>
                        </div>
                    </div>

                    {/* Stats pill */}
                    <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-bold">
                        <span className="text-neutral-400">
                            {stats.available} ساعة متاحة
                        </span>
                    </div>
                </div>

                {/* 1. Duration Selector - Sleek Segmented Control */}
                <div className="pt-2 border-t border-neutral-100 dark:border-white/[0.05] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-600 dark:text-neutral-300">
                        <span className="flex items-center gap-1.5">
                            <Timer className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
                            <span>مدة الجلسة:</span>
                        </span>
                        <span className="font-mono text-red-600 dark:text-red-400">
                            {durationHours === 1 ? 'ساعة واحدة' : durationHours === 2 ? 'ساعتان' : `${durationHours} ساعات`} ({Math.round(durationHours * roomRate)} ج.م)
                        </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {DURATION_CHOICES.map((hrs) => {
                            const isSelected = durationHours === hrs;
                            return (
                                <button
                                    key={hrs}
                                    type="button"
                                    onClick={() => handleDurationChange(hrs)}
                                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center flex flex-col items-center justify-center gap-0.5 ${
                                        isSelected
                                            ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-600/30 scale-[1.02]'
                                            : 'bg-neutral-50 dark:bg-white/[0.03] border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.07]'
                                    }`}
                                >
                                    <span className="font-extrabold">
                                        {hrs === 1 ? '1 ساعة' : hrs === 2 ? '2 ساعة' : `${hrs} ساعات`}
                                    </span>
                                    <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                                        {hrs * roomRate} ج.م
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Active Selection Live Ribbon */}
                {selectedSessionInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl bg-red-500/10 dark:bg-red-950/30 border border-red-500/30 flex items-center justify-between gap-2.5 text-xs"
                    >
                        <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold">
                            <CheckCircle2 className="w-4 h-4 text-red-600 dark:text-red-500 shrink-0" />
                            <span>
                                موعدك المختار: من <strong className="text-red-600 dark:text-red-400 font-mono text-sm">{selectedSessionInfo.startLabel}</strong> حتى <strong className="text-red-600 dark:text-red-400 font-mono text-sm">{selectedSessionInfo.endLabel}</strong> ({durationHours} {durationHours === 1 ? 'ساعة' : 'ساعات'})
                            </span>
                        </div>
                        <span className="font-mono font-black text-red-600 dark:text-red-400 px-2.5 py-1 bg-red-500/15 rounded-lg shrink-0">
                            الإجمالي: {selectedSessionInfo.totalPrice} ج.م
                        </span>
                    </motion.div>
                )}

                {/* 3. Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-white/[0.04] rounded-xl text-xs overflow-x-auto scrollbar-none">
                    <button
                        type="button"
                        onClick={() => {
                            setFilter('all');
                            playPs5NavigateSound();
                        }}
                        className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                            filter === 'all'
                                ? 'bg-white dark:bg-[#20191c] text-neutral-900 dark:text-white shadow-xs'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        الكل (24س)
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setFilter('evening');
                            playPs5NavigateSound();
                        }}
                        className={`flex-1 min-w-[110px] py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap text-center ${
                            filter === 'evening'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        <Sunset className="w-3.5 h-3.5" />
                        <span>المساء (6م - 12ص)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setFilter('night');
                            playPs5NavigateSound();
                        }}
                        className={`flex-1 min-w-[110px] py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap text-center ${
                            filter === 'night'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        <Moon className="w-3.5 h-3.5" />
                        <span>السهرة (12ص - 6ص)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setFilter('day');
                            playPs5NavigateSound();
                        }}
                        className={`flex-1 min-w-[110px] py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap text-center ${
                            filter === 'day'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        <Sun className="w-3.5 h-3.5" />
                        <span>النهار (6ص - 6م)</span>
                    </button>
                </div>
            </div>

            {/* Slots Organized in Clean Groups */}
            <div className="space-y-4">
                {groups.map((group) => (
                    <div key={group.id} className="space-y-2">
                        {/* Group Header (shown when 'all' is selected to divide the day naturally) */}
                        {filter === 'all' && (
                            <div className="flex items-center justify-between px-1 text-xs text-neutral-500 dark:text-neutral-400">
                                <span className="font-extrabold flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                                    {group.icon}
                                    <span>{group.title}</span>
                                </span>
                                <span className="text-[11px] font-mono text-neutral-400">
                                    {group.subtitle}
                                </span>
                            </div>
                        )}

                        {/* Crisp Minimalist Gaming Pills Grid */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {group.slots.map((slot) => {
                                const {
                                    hour24,
                                    label,
                                    isPast,
                                    isBooked,
                                    isSelected,
                                    isStartHour,
                                    isSubsequentHour,
                                } = slot;

                                return (
                                    <button
                                        key={hour24}
                                        type="button"
                                        onClick={() => handleSlotClick(slot)}
                                        disabled={isPast || isBooked}
                                        className={`relative h-12 px-2.5 rounded-xl border text-center transition-all duration-150 outline-none flex items-center justify-center gap-1.5 ${
                                            isPast
                                                ? 'bg-neutral-100/50 dark:bg-white/[0.02] border-neutral-200/50 dark:border-white/[0.04] opacity-30 cursor-not-allowed text-neutral-400'
                                                : isBooked
                                                ? 'bg-red-500/10 dark:bg-red-950/20 border-red-500/25 text-red-500/80 cursor-not-allowed line-through'
                                                : isSelected
                                                ? 'bg-gradient-to-r from-red-600 to-rose-600 border-red-500 text-white font-extrabold shadow-md shadow-red-600/30 scale-[1.02] z-10 cursor-pointer'
                                                : 'bg-white dark:bg-[#161214] hover:bg-neutral-50 dark:hover:bg-white/[0.06] border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 hover:border-red-500/60 hover:text-red-600 dark:hover:text-red-400 cursor-pointer active:scale-95'
                                        }`}
                                    >
                                        <span className="font-mono text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap">
                                            {label}
                                        </span>

                                        {isBooked && (
                                            <Lock className="w-3 h-3 text-red-500 shrink-0" />
                                        )}

                                        {isSelected && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs shrink-0" />
                                        )}

                                        {/* Subtle badge for start hour in multi-hour booking */}
                                        {isSelected && durationHours > 1 && isStartHour && (
                                            <span className="absolute -top-1.5 -right-1 text-[8px] font-sans font-bold px-1 rounded bg-black text-white border border-white/20 shadow-xs">
                                                بدء
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Discreet Legend */}
            <div className="flex items-center justify-center gap-5 pt-1 text-[11px] font-medium text-neutral-400 select-none">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-white/30" />
                    <span>متاح</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.8)]" />
                    <span>محدد</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-900/60" />
                    <span>محجوز</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-neutral-500/30" />
                    <span>مضى</span>
                </div>
            </div>
        </div>
    );
}
