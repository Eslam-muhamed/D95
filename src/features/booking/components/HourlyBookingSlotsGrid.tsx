import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Clock,
    Lock,
    CheckCircle2,
    Sparkles,
    Sun,
    Moon,
    Sunset,
    Plus,
    Minus,
    AlertCircle
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
    label: string; // e.g. "12:00 ص"
    endLabel: string; // e.g. "01:00 ص"
    rangeLabel: string; // e.g. "12:00 ص - 01:00 ص"
    periodOfDayText: string;
    periodOfDayIcon: React.ReactNode;
    start: Date;
    end: Date;
    isPast: boolean;
    isBooked: boolean;
    isSelected: boolean;
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
            const rangeLabel = `${label} - ${endLabel}`;

            // Period of day description
            let periodOfDayText = '';
            let periodOfDayIcon: React.ReactNode = null;

            if (h >= 0 && h < 5) {
                periodOfDayText = 'سهرة ليلية 🌙';
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
            if (selectedStartHour24 !== null) {
                const selectedEndHour = selectedStartHour24 + durationHours;
                if (h >= selectedStartHour24 && h < selectedEndHour) {
                    isSelected = true;
                }
            }

            result.push({
                hour24: h,
                hour12,
                period,
                label,
                endLabel,
                rangeLabel,
                periodOfDayText,
                periodOfDayIcon,
                start,
                end,
                isPast,
                isBooked,
                isSelected,
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

    // Slot click handler
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

        // If user already had a slot selected and clicks a later available slot on the same day:
        if (selectedStartHour24 !== null && slot.hour24 > selectedStartHour24) {
            const requestedDuration = slot.hour24 - selectedStartHour24 + 1;
            if (requestedDuration <= OPERATING_HOURS.MAX_DURATION_HOURS) {
                // Verify all slots in between are free
                let allFree = true;
                for (let h = selectedStartHour24; h <= slot.hour24; h++) {
                    const checkSlot = slots.find((s) => s.hour24 === h);
                    if (!checkSlot || checkSlot.isBooked || checkSlot.isPast) {
                        allFree = false;
                        break;
                    }
                }

                if (allFree) {
                    onSelectSlot(selectedStartHour24, requestedDuration);
                    toast.success(`تم اختيار الجلسة لمدة ${requestedDuration} ساعات (${slots[selectedStartHour24]?.label} إلى ${slot.endLabel}) 🎮`);
                    return;
                }
            }
        }

        // Default: Select single slot
        onSelectSlot(slot.hour24, 1);
        toast.success(`تم اختيار الساعة: ${slot.rangeLabel} 🎮`);
    };

    // Duration adjustment handler
    const handleAdjustDuration = (delta: number) => {
        if (selectedStartHour24 === null) {
            toast.info('يرجى النقر على خانة الساعة لبدء الحجز أولاً 🎮');
            return;
        }

        const nextDuration = durationHours + delta;
        if (nextDuration < 1) return;
        if (nextDuration > OPERATING_HOURS.MAX_DURATION_HOURS) {
            toast.error(`أقصى مدة للحجز المتصل هي ${OPERATING_HOURS.MAX_DURATION_HOURS} ساعة ⚠️`);
            return;
        }

        // Check if next hours are free
        if (delta > 0) {
            const targetHour = selectedStartHour24 + durationHours;
            if (targetHour < 24) {
                const targetSlot = slots.find((s) => s.hour24 === targetHour);
                if (targetSlot?.isBooked) {
                    toast.error(`لا يمكن زيادة المدة: الساعة ${targetSlot.rangeLabel} محجوزة 🔒`);
                    return;
                }
                if (targetSlot?.isPast) {
                    toast.error('لا يمكن زيادة المدة إلى وقت قد مضى ⏳');
                    return;
                }
            }
        }

        playPs5NavigateSound();
        onChangeDuration(nextDuration);
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
            {/* 1. Header & Live Status Banner */}
            <div className="bg-white dark:bg-[#120e10] border border-neutral-200/90 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-500 shadow-sm shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-base text-neutral-900 dark:text-white">
                                    خانات المواعيد (٢٤ ساعة)
                                </h3>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    مفتوح 24/7
                                </span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                انقر على خانة الساعة التي تناسبك، والساعة المحجوزة ستظهر باللون الأحمر 🔒
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

                {/* 2. Interactive Selection Summary & Duration Bar (Active when slot is selected) */}
                {selectedSessionInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/35 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner"
                    >
                        <div className="flex items-center gap-2.5 text-xs text-neutral-900 dark:text-white font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>
                                موعدك المختار: من <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{selectedSessionInfo.startLabel}</strong> إلى <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{selectedSessionInfo.endLabel}</strong>
                            </span>
                        </div>

                        {/* Duration Stepper Controls */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">المدة:</span>
                            <div className="flex items-center gap-1 bg-white dark:bg-black/50 border border-neutral-200 dark:border-white/10 rounded-xl p-1">
                                <button
                                    type="button"
                                    onClick={() => handleAdjustDuration(-1)}
                                    disabled={durationHours <= 1}
                                    className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 flex items-center justify-center text-neutral-700 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                                    title="تقليل المدة"
                                >
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono font-bold text-xs px-2 min-w-[50px] text-center text-neutral-900 dark:text-white">
                                    {durationHours} {durationHours === 1 ? 'ساعة' : 'ساعات'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleAdjustDuration(1)}
                                    disabled={durationHours >= OPERATING_HOURS.MAX_DURATION_HOURS}
                                    className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 flex items-center justify-center text-neutral-700 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                                    title="زيادة المدة"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 px-2 py-1 bg-emerald-500/15 rounded-lg">
                                {selectedSessionInfo.totalPrice} ج.م
                            </span>
                        </div>
                    </motion.div>
                )}

                {/* 3. Filter Tabs (All / Night / Day / Evening) */}
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

                {/* 4. Legend bar */}
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

            {/* 5. The 24 Hourly Slots Grid Cards */}
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {filteredSlots.map((slot) => {
                    const {
                        hour24,
                        rangeLabel,
                        periodOfDayText,
                        periodOfDayIcon,
                        isPast,
                        isBooked,
                        isSelected,
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
                                        <span>محدد</span>
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                        متاح
                                    </span>
                                )}
                            </div>

                            {/* Card Middle: Large Range Time Display */}
                            <div className="my-1">
                                <span
                                    className={`font-mono text-xs sm:text-sm font-black block tracking-tight ${
                                        isBooked
                                            ? 'text-red-500 line-through opacity-80'
                                            : isSelected
                                            ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                                            : 'text-neutral-900 dark:text-white'
                                    }`}
                                >
                                    {rangeLabel}
                                </span>
                            </div>

                            {/* Card Bottom: Rate / Subtitle */}
                            <div className="flex items-center justify-between w-full pt-1 border-t border-neutral-100 dark:border-white/[0.04] text-[10px] text-neutral-400 font-mono">
                                <span>{roomRate} ج.م/س</span>
                                {isSelected && (
                                    <span className="text-emerald-500 font-bold">ساعة الحجز</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
