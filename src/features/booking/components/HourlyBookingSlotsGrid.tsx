import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Moon,
    Sun,
    Clock,
    Lock,
    CheckCircle2,
    Sparkles,
    Calendar,
    Timer,
    AlertCircle,
    ArrowLeft
} from 'lucide-react';
import {
    BookingInterval,
    createDateTimeFromBusinessDate,
    formatArabicTime,
    OPERATING_HOURS,
    getCairoTodayDateString,
    addDaysToDateString,
} from '@/lib/bookingDatetime';
import { playPs5SelectSound, playPs5NavigateSound } from '@/lib/sound';

export interface HourlySlot {
    hour24: number;
    hour12: number;
    period: 'AM' | 'PM';
    startTimeStr: string;   // e.g. "12:00 ص"
    endTimeStr: string;     // e.g. "01:00 ص"
    rangeLabel: string;     // e.g. "12:00 ص - 01:00 ص"
    periodCategory: 'night' | 'dawn' | 'morning' | 'afternoon' | 'evening';
    periodNameAr: string;   // e.g. "سهرة منتصف الليل"
    startDateTime: Date;
    endDateTime: Date;
    isPast: boolean;
    isBooked: boolean;
    wouldConflict: boolean; // Overlaps during multi-hour duration
    isSelected: boolean;
    isSpanSelected: boolean; // Part of multi-hour session
}

interface HourlyBookingSlotsGridProps {
    selectedDate: string;
    selectedHour24: number | null;
    durationHours: number;
    occupiedIntervals: BookingInterval[];
    roomRate: number;
    onSelectSlot: (hour24: number) => void;
    onSelectDuration?: (duration: number) => void;
    onSelectDate?: (date: string) => void;
}

type PeriodFilter = 'all' | 'night' | 'morning' | 'evening' | 'dawn';

const DURATION_OPTIONS = [
    { value: 1, label: 'ساعة واحدة' },
    { value: 2, label: 'ساعتان' },
    { value: 3, label: '3 ساعات' },
    { value: 4, label: '4 ساعات' },
    { value: 5, label: '5 ساعات' },
    { value: 6, label: '6 ساعات' },
];

export const HourlyBookingSlotsGrid: React.FC<HourlyBookingSlotsGridProps> = ({
    selectedDate,
    selectedHour24,
    durationHours,
    occupiedIntervals,
    roomRate,
    onSelectSlot,
    onSelectDuration,
    onSelectDate,
}) => {
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');

    const todayStr = useMemo(() => getCairoTodayDateString(), []);
    const isToday = selectedDate === todayStr;

    // Generate all 24 hour slots for the selected date
    const slots = useMemo<HourlySlot[]>(() => {
        const result: HourlySlot[] = [];
        const nowMs = Date.now();

        // Multi-hour session span
        const selectedStartMs = selectedHour24 !== null
            ? createDateTimeFromBusinessDate(selectedDate, `${String(selectedHour24).padStart(2, '0')}:00`).getTime()
            : null;
        const selectedEndMs = selectedStartMs !== null
            ? selectedStartMs + durationHours * 3600 * 1000
            : null;

        for (let h = 0; h < 24; h++) {
            const time24 = `${String(h).padStart(2, '0')}:00`;
            const start = createDateTimeFromBusinessDate(selectedDate, time24);
            const end = new Date(start.getTime() + 60 * 60 * 1000);

            const h12 = h % 12 === 0 ? 12 : h % 12;
            const period: 'AM' | 'PM' = h >= 12 && h < 24 ? 'PM' : 'AM';
            const nextH = (h + 1) % 24;
            const nextH12 = nextH % 12 === 0 ? 12 : nextH % 12;
            const nextPeriod: 'AM' | 'PM' = nextH >= 12 && nextH < 24 ? 'PM' : 'AM';

            const startTimeStr = `${String(h12).padStart(2, '0')}:00 ${period === 'PM' ? 'م' : 'ص'}`;
            const endTimeStr = `${String(nextH12).padStart(2, '0')}:00 ${nextPeriod === 'PM' ? 'م' : 'ص'}`;
            const rangeLabel = `${startTimeStr} - ${endTimeStr}`;

            // Period categorization & friendly Arabic name
            let periodCategory: HourlySlot['periodCategory'] = 'night';
            let periodNameAr = 'سهرة ليلية';

            if (h >= 0 && h < 4) {
                periodCategory = 'night';
                periodNameAr = h === 0 ? 'سهرة منتصف الليل 🌙' : 'سهرة وفجر 🌙';
            } else if (h >= 4 && h < 8) {
                periodCategory = 'dawn';
                periodNameAr = 'الفجر والصباح الباكر 🌌';
            } else if (h >= 8 && h < 12) {
                periodCategory = 'morning';
                periodNameAr = 'الصباح ☀️';
            } else if (h >= 12 && h < 16) {
                periodCategory = 'afternoon';
                periodNameAr = h === 12 ? 'الظهيرة ☀️' : 'بعد الظهر ☀️';
            } else if (h >= 16 && h < 22) {
                periodCategory = 'evening';
                periodNameAr = 'المساء 🌆';
            } else {
                periodCategory = 'night';
                periodNameAr = 'السهرة 🌙';
            }

            // Past time check: past if start time is before current time (with 3-minute grace)
            const isPast = start.getTime() < (nowMs - 3 * 60 * 1000);

            // Overlap check for this exact 1-hour slot
            const slotStartMs = start.getTime();
            const slotEndMs = end.getTime();
            let isBooked = false;

            if (!isPast) {
                for (const inv of occupiedIntervals) {
                    if (slotStartMs < inv.end.getTime() && slotEndMs > inv.start.getTime()) {
                        isBooked = true;
                        break;
                    }
                }
            }

            // Conflict check for selected duration starting from this hour
            let wouldConflict = false;
            if (!isPast && !isBooked && durationHours > 1) {
                const totalEndMs = slotStartMs + durationHours * 3600 * 1000;
                for (const inv of occupiedIntervals) {
                    if (slotStartMs < inv.end.getTime() && totalEndMs > inv.start.getTime()) {
                        wouldConflict = true;
                        break;
                    }
                }
            }

            const isSelected = selectedHour24 === h;
            const isSpanSelected = selectedStartMs !== null && selectedEndMs !== null && !isPast
                ? slotStartMs >= selectedStartMs && slotStartMs < selectedEndMs
                : false;

            result.push({
                hour24: h,
                hour12: h12,
                period,
                startTimeStr,
                endTimeStr,
                rangeLabel,
                periodCategory,
                periodNameAr,
                startDateTime: start,
                endDateTime: end,
                isPast,
                isBooked,
                wouldConflict,
                isSelected,
                isSpanSelected,
            });
        }

        return result;
    }, [selectedDate, selectedHour24, durationHours, occupiedIntervals]);

    // Filtered slots
    const filteredSlots = useMemo(() => {
        if (periodFilter === 'all') return slots;
        if (periodFilter === 'night') {
            return slots.filter((s) => s.hour24 >= 22 || s.hour24 < 4);
        }
        if (periodFilter === 'dawn') {
            return slots.filter((s) => s.hour24 >= 4 && s.hour24 < 8);
        }
        if (periodFilter === 'morning') {
            return slots.filter((s) => s.hour24 >= 8 && s.hour24 < 16);
        }
        if (periodFilter === 'evening') {
            return slots.filter((s) => s.hour24 >= 16 && s.hour24 < 22);
        }
        return slots;
    }, [slots, periodFilter]);

    // Summary counts
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

    const handleSlotClick = (slot: HourlySlot) => {
        if (slot.isPast || slot.isBooked) return;
        playPs5SelectSound();
        onSelectSlot(slot.hour24);
    };

    const handleQuickMidnightTomorrow = () => {
        if (!onSelectDate) return;
        const tomorrow = addDaysToDateString(selectedDate, 1);
        playPs5SelectSound();
        onSelectDate(tomorrow);
        onSelectSlot(0); // 12:00 AM
    };

    return (
        <div className="bg-white dark:bg-[#120e10] border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4" dir="rtl">
            {/* Header: Title and Live Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-white/[0.06]">
                <div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-red-600 dark:text-red-500 shrink-0" />
                        <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                            مواعيد الـ 24 ساعة (اختر خانة الساعة) 🎮
                        </h3>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        كل خانة تمثل ساعة باليوم • اضغط على الخانة الخضراء للحجز، وتتغير حالتها فور الحجز
                    </p>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{stats.available} متاحة</span>
                    </span>

                    {stats.booked > 0 && (
                        <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25 font-bold">
                            {stats.booked} محجوزة
                        </span>
                    )}
                </div>
            </div>

            {/* Smart Late Night Helper Banner (Solves 12 AM midnight confusion) */}
            {isToday && onSelectDate && (
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/5 border border-amber-500/30 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                        <Moon className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>
                            <strong>سهرة الليلة (من ١٢:٠٠ بليل)؟</strong> مواعيد منتصف الليل تقع في بداية تاريخ الغد
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleQuickMidnightTomorrow}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 self-end sm:self-auto"
                    >
                        <span>حجز ١٢:٠٠ ص الغد بنقرة واحدة</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Quick Duration Selector Pills */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5 text-red-500" />
                        <span>مدة الجلسة المطلوبة:</span>
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">
                        {durationHours} {durationHours === 1 ? 'ساعة' : durationHours === 2 ? 'ساعتان' : 'ساعات'} • {Math.round(durationHours * roomRate)} ج.م
                    </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {DURATION_OPTIONS.map((opt) => {
                        const isSelected = durationHours === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    if (onSelectDuration) {
                                        playPs5NavigateSound();
                                        onSelectDuration(opt.value);
                                    }
                                }}
                                className={`py-2 px-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
                                    isSelected
                                        ? 'bg-red-600 text-white border-red-500 shadow-xs scale-102 z-10'
                                        : 'bg-neutral-50 hover:bg-neutral-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-neutral-700 dark:text-neutral-300 border-neutral-200/80 dark:border-white/10'
                                }`}
                            >
                                <span>{opt.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Period Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
                {[
                    { id: 'all', label: 'الـ 24 ساعة كاملة' },
                    { id: 'night', label: '🌙 السهرة (10م - 4ص)' },
                    { id: 'morning', label: '☀️ النهار (8ص - 4م)' },
                    { id: 'evening', label: '🌆 المساء (4م - 10م)' },
                    { id: 'dawn', label: '🌌 الفجر (4ص - 8ص)' },
                ].map((tab) => {
                    const isActive = periodFilter === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                playPs5NavigateSound();
                                setPeriodFilter(tab.id as PeriodFilter);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                                isActive
                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                                    : 'bg-neutral-100 dark:bg-white/[0.04] text-neutral-600 dark:text-neutral-400 border-neutral-200/60 dark:border-white/[0.06] hover:bg-neutral-200 dark:hover:bg-white/[0.08]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* 24-Hours Slot Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                {filteredSlots.map((slot) => {
                    const isSelected = slot.isSelected;
                    const isSpan = slot.isSpanSelected;
                    const isBooked = slot.isBooked;
                    const isPast = slot.isPast;
                    const wouldConflict = slot.wouldConflict;
                    const isAvailable = !isPast && !isBooked;

                    return (
                        <motion.button
                            key={slot.hour24}
                            type="button"
                            disabled={isPast || isBooked}
                            onClick={() => handleSlotClick(slot)}
                            whileHover={isAvailable ? { scale: 1.015, y: -2 } : {}}
                            whileTap={isAvailable ? { scale: 0.985 } : {}}
                            className={`relative text-right p-3 rounded-2xl border transition-all text-xs select-none outline-none ${
                                isSpan
                                    ? 'bg-red-500/15 dark:bg-red-600/20 border-red-500 dark:border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.25)] ring-2 ring-red-500/40 cursor-pointer'
                                    : isBooked
                                    ? 'bg-neutral-100/60 dark:bg-neutral-900/40 border-neutral-200/80 dark:border-white/[0.06] text-neutral-400 dark:text-neutral-600 cursor-not-allowed opacity-65'
                                    : isPast
                                    ? 'bg-neutral-50 dark:bg-neutral-950/60 border-neutral-200/50 dark:border-white/[0.04] text-neutral-400 dark:text-neutral-600 cursor-not-allowed opacity-40'
                                    : wouldConflict
                                    ? 'bg-amber-500/[0.05] dark:bg-amber-950/20 border-amber-500/40 text-neutral-800 dark:text-neutral-200 hover:border-amber-500/70 cursor-pointer shadow-2xs'
                                    : 'bg-emerald-500/[0.04] dark:bg-emerald-950/20 hover:bg-emerald-500/[0.08] dark:hover:bg-emerald-950/35 border-emerald-500/30 hover:border-emerald-500/60 text-neutral-800 dark:text-neutral-200 cursor-pointer shadow-2xs'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-1.5 font-mono text-sm font-black text-neutral-900 dark:text-white">
                                    <Clock className={`w-3.5 h-3.5 shrink-0 ${
                                        isSpan ? 'text-red-500' : isAvailable ? 'text-emerald-500' : 'text-neutral-400'
                                    }`} />
                                    <span>{slot.rangeLabel}</span>
                                </div>

                                {/* Status Pill */}
                                {isSpan ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white shadow-xs flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>مُحدد</span>
                                    </span>
                                ) : isBooked ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                                        <Lock className="w-3 h-3 text-red-500" />
                                        <span>محجوز</span>
                                    </span>
                                ) : isPast ? (
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-800/60 text-neutral-400">
                                        مضى
                                    </span>
                                ) : wouldConflict ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3 text-amber-500" />
                                        <span>تعارض مدة</span>
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>متاح</span>
                                    </span>
                                )}
                            </div>

                            {/* Subtitle & Period Name */}
                            <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                                <span>{slot.periodNameAr}</span>
                                <span className="font-mono">{roomRate} ج.م</span>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
