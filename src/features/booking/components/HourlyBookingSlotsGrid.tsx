import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Clock,
    Lock,
    CheckCircle2,
    Sun,
    Moon,
    Sunset,
    Timer,
} from 'lucide-react';
import {
    type BookingInterval,
    createDateTimeFromBusinessDate,
    formatArabicTime,
    formatArabicTimeFromDate,
    OPERATING_HOURS,
} from '@/lib/bookingDatetime';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';
import { toast } from 'sonner';

export interface HourlySlotData {
    hour24: number; // 0..23
    hour12: number;
    period: 'AM' | 'PM';
    label: string; // e.g. "12:00 ص" or "10:00 م"
    endLabel: string; // e.g. "01:00 ص"
    periodOfDayText: string;
    periodOfDayIcon: React.ReactNode;
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

type PeriodFilter = 'all' | 'night' | 'day' | 'evening';

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

            // Period of day description
            let periodOfDayText = '';
            let periodOfDayIcon: React.ReactNode = null;

            if (h >= 0 && h < 5) {
                periodOfDayText = 'سهرة 🌙';
                periodOfDayIcon = <Moon className="w-3.5 h-3.5 text-indigo-400" />;
            } else if (h >= 5 && h < 12) {
                periodOfDayText = 'صباحاً ☀️';
                periodOfDayIcon = <Sun className="w-3.5 h-3.5 text-amber-400" />;
            } else if (h >= 12 && h < 17) {
                periodOfDayText = 'ظهراً ☀️';
                periodOfDayIcon = <Sun className="w-3.5 h-3.5 text-amber-500" />;
            } else {
                periodOfDayText = 'مساءً 🌆';
                periodOfDayIcon = <Sunset className="w-3.5 h-3.5 text-rose-400" />;
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
                periodOfDayText,
                periodOfDayIcon,
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

    // Filtered slots according to the period tab
    const filteredSlots = useMemo(() => {
        if (filter === 'night') return slots.filter((s) => s.hour24 >= 0 && s.hour24 < 6);
        if (filter === 'day') return slots.filter((s) => s.hour24 >= 6 && s.hour24 < 18);
        if (filter === 'evening') return slots.filter((s) => s.hour24 >= 18 && s.hour24 < 24);
        return slots;
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
                toast.success(`تم حجز ${requestedDuration} ساعات تبدأ من ${slot.label} حتى ${formatArabicTime(endH, 0)} 🎮`);
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
            toast.info(`تم تحديد المدة: ${newDuration === 1 ? 'ساعة واحدة' : newDuration === 2 ? 'ساعتان' : `${newDuration} ساعات`}. اختر الآن خانة الساعة 🎮`);
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
            const endH = (startH + newDuration) % 24;
            toast.success(`تم تمديد الحجز إلى ${newDuration} ساعات (حتى ${formatArabicTime(endH, 0)}) 🎮`);
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
            {/* 1. Header with Duration Selector & Live Stats */}
            <div className="bg-white dark:bg-[#120e10] border border-neutral-200/90 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                
                {/* Header Title & Stats Pill */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-500 shadow-sm shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-base text-neutral-900 dark:text-white">
                                    ساعة بدء الحجز (٢٤ ساعة)
                                </h3>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    24/7 مفتوح
                                </span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                اختر المدة أولاً ثم اضغط على الساعة، وسيتم تحديد الساعات المتصلة تلقائياً 🎮
                            </p>
                        </div>
                    </div>

                    {/* Stats Pill */}
                    <div className="flex items-center gap-2 text-xs font-mono font-bold self-start sm:self-auto">
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                            {stats.available} ساعة شاغرة
                        </span>
                        {stats.booked > 0 && (
                            <span className="px-2.5 py-1 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25">
                                {stats.booked} محجوز
                            </span>
                        )}
                    </div>
                </div>

                {/* 2. Top-Level Duration Selector: Always Visible & Selectable */}
                <div className="pt-3 border-t border-neutral-100 dark:border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-neutral-900 dark:text-white flex items-center gap-1.5">
                            <Timer className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span>حدد مدة الجلسة المطلوبة:</span>
                        </span>
                        <span className="font-mono font-bold text-red-600 dark:text-red-400">
                            {durationHours === 1 ? 'ساعة واحدة' : durationHours === 2 ? 'ساعتان' : `${durationHours} ساعات`} ({Math.round(durationHours * roomRate)} ج.م)
                        </span>
                    </div>

                    {/* Duration Buttons Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {DURATION_CHOICES.map((hrs) => {
                            const isSelected = durationHours === hrs;
                            return (
                                <button
                                    key={hrs}
                                    type="button"
                                    onClick={() => handleDurationChange(hrs)}
                                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border flex flex-col items-center justify-center gap-0.5 ${
                                        isSelected
                                            ? 'bg-red-600 border-red-600 text-white shadow-md shadow-red-600/25 scale-[1.02]'
                                            : 'bg-neutral-50 dark:bg-white/[0.04] border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.08]'
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

                {/* 3. Interactive Selection Summary (Active when slot is selected) */}
                {selectedSessionInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/35 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-inner"
                    >
                        <div className="flex items-center gap-2 text-xs text-neutral-900 dark:text-white font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>
                                موعدك المختار: من <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{selectedSessionInfo.startLabel}</strong> حتى <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{selectedSessionInfo.endLabel}</strong> ({durationHours} {durationHours === 1 ? 'ساعة' : 'ساعات'})
                            </span>
                        </div>

                        <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 px-2.5 py-1 bg-emerald-500/15 rounded-lg shrink-0">
                            الإجمالي: {selectedSessionInfo.totalPrice} ج.م
                        </span>
                    </motion.div>
                )}

                {/* 4. Filter Tabs (All / Night / Day / Evening) */}
                <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-white/[0.04] rounded-xl text-xs overflow-x-auto scrollbar-none">
                    <button
                        type="button"
                        onClick={() => {
                            setFilter('all');
                            playPs5NavigateSound();
                        }}
                        className={`flex-1 min-w-[70px] py-1.5 px-2.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                            filter === 'all'
                                ? 'bg-white dark:bg-[#1f191d] text-neutral-900 dark:text-white shadow-xs'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        الكل (٢٤ ساعة)
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setFilter('night');
                            playPs5NavigateSound();
                        }}
                        className={`flex-1 min-w-[110px] py-1.5 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap text-center ${
                            filter === 'night'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        <Moon className="w-3.5 h-3.5 text-indigo-300" />
                        <span>السهرة (١٢ ص - ٦ ص)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setFilter('day');
                            playPs5NavigateSound();
                        }}
                        className={`flex-1 min-w-[110px] py-1.5 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap text-center ${
                            filter === 'day'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        <Sun className="w-3.5 h-3.5 text-amber-300" />
                        <span>النهار (٦ ص - ٦ م)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setFilter('evening');
                            playPs5NavigateSound();
                        }}
                        className={`flex-1 min-w-[110px] py-1.5 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap text-center ${
                            filter === 'evening'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        <Sunset className="w-3.5 h-3.5 text-rose-300" />
                        <span>المساء (٦ م - ١٢ ص)</span>
                    </button>
                </div>

                {/* 5. Legend bar */}
                <div className="flex items-center justify-around sm:justify-start sm:gap-6 pt-1 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 select-none border-t border-neutral-100 dark:border-white/[0.04]">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                        <span>متاح</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                        <span>محجوز</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                        <span>مضى</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white" />
                        <span>محدد حالياً</span>
                    </div>
                </div>
            </div>

            {/* 6. The 24 Hourly Slots Grid Cards: Single Hour Display Only */}
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {filteredSlots.map((slot) => {
                    const {
                        hour24,
                        label,
                        periodOfDayText,
                        periodOfDayIcon,
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
                            className={`relative p-3 rounded-2xl border text-right transition-all duration-200 outline-none flex flex-col justify-between min-h-[96px] ${
                                isPast
                                    ? 'bg-neutral-100/60 dark:bg-neutral-900/40 border-neutral-200/50 dark:border-white/[0.04] opacity-40 cursor-not-allowed text-neutral-400'
                                    : isBooked
                                    ? 'bg-red-500/10 dark:bg-red-950/30 border-red-500/40 text-red-500 shadow-xs cursor-not-allowed'
                                    : isSelected
                                    ? 'bg-emerald-500/20 dark:bg-emerald-950/40 border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)] scale-[1.02] z-10 cursor-pointer'
                                    : 'bg-white dark:bg-[#161114] hover:bg-neutral-50 dark:hover:bg-white/[0.04] border-neutral-200 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-md cursor-pointer group active:scale-95'
                            }`}
                        >
                            {/* Card Top: Time of day badge & Status */}
                            <div className="flex items-center justify-between w-full mb-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                                    {periodOfDayIcon}
                                    <span className="truncate">{periodOfDayText}</span>
                                </span>

                                {isBooked ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-600 dark:text-red-400">
                                        <Lock className="w-3 h-3" />
                                        <span>محجوز</span>
                                    </span>
                                ) : isPast ? (
                                    <span className="text-[10px] font-medium text-neutral-400">
                                        مضى
                                    </span>
                                ) : isSelected ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500 text-white shadow-xs">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>{isStartHour && durationHours > 1 ? 'البداية' : 'محدد'}</span>
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                        متاح
                                    </span>
                                )}
                            </div>

                            {/* Card Middle: Single Booking Hour Display ONLY */}
                            <div className="my-2 py-0.5 text-center">
                                <span
                                    className={`font-mono text-base sm:text-lg font-black block tracking-tight ${
                                        isBooked
                                            ? 'text-red-500 line-through opacity-75'
                                            : isSelected
                                            ? 'text-emerald-600 dark:text-emerald-400 font-extrabold scale-105'
                                            : 'text-neutral-900 dark:text-white'
                                    }`}
                                >
                                    {label}
                                </span>
                            </div>

                            {/* Card Bottom: Rate / Subtitle */}
                            <div className="flex items-center justify-between w-full pt-1.5 border-t border-neutral-100 dark:border-white/[0.04] text-[10px] font-mono">
                                <span className="text-neutral-400">{roomRate} ج.م/س</span>
                                {isSelected ? (
                                    <span className="text-emerald-500 font-bold">
                                        {isStartHour && durationHours > 1 ? `${durationHours} ساعات` : isSubsequentHour ? 'ممتد ✨' : 'محدد ✨'}
                                    </span>
                                ) : (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        احجز الآن
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
