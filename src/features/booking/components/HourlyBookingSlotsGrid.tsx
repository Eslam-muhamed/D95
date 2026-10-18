import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Lock,
    CheckCircle2,
    Timer,
    Check,
    ChevronDown,
    Moon,
    Sparkles,
} from 'lucide-react';
import {
    type BookingInterval,
    addDaysToDateString,
    createDateTimeFromBusinessDate,
    formatArabicTime,
    formatArabicTimeFromDate,
} from '@/lib/bookingDatetime';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';
import { toast } from 'sonner';

export interface HourlySlotData {
    hour24: number; // 0..23 for main day, 24..29 for next day late night
    hour12: number;
    period: 'AM' | 'PM';
    label: string; // e.g. "12:00 ص" or "10:00 م"
    endLabel: string;
    isLateNight: boolean;
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
    const [isDurationMenuOpen, setIsDurationMenuOpen] = useState(false);
    const durationMenuRef = useRef<HTMLDivElement>(null);

    // Close duration dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (durationMenuRef.current && !durationMenuRef.current.contains(e.target as Node)) {
                setIsDurationMenuOpen(false);
            }
        };
        if (isDurationMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDurationMenuOpen]);

    // Build slots: 0..23 for selectedDate + 24..29 for Next Day Late Night
    const { mainSlots, lateNightSlots, allSlots } = useMemo(() => {
        const main: HourlySlotData[] = [];
        const lateNight: HourlySlotData[] = [];
        const now = Date.now();
        const nextDateStr = addDaysToDateString(selectedDate, 1);

        // 1. Standard 24 hours of selectedDate (0..23)
        for (let h = 0; h < 24; h++) {
            const time24 = `${String(h).padStart(2, '0')}:00`;
            const start = createDateTimeFromBusinessDate(selectedDate, time24);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            const isPast = end.getTime() <= now;

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

            let isSelected = false;
            let isStartHour = false;
            let isSubsequentHour = false;

            if (selectedStartHour24 !== null) {
                const selectedEndHour = selectedStartHour24 + durationHours;
                if (h >= selectedStartHour24 && h < selectedEndHour) {
                    isSelected = true;
                    if (h === selectedStartHour24) isStartHour = true;
                    else isSubsequentHour = true;
                }
            }

            main.push({
                hour24: h,
                hour12,
                period,
                label,
                endLabel,
                isLateNight: false,
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

        // 2. Late Night hours after 11:00 PM (12:00 AM -> 05:00 AM of Next Calendar Day, hours 24..29)
        for (let actualH = 0; actualH < 6; actualH++) {
            const virtualH = 24 + actualH; // 24, 25, 26, 27, 28, 29
            const time24 = `${String(actualH).padStart(2, '0')}:00`;
            const start = createDateTimeFromBusinessDate(nextDateStr, time24);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            const isPast = end.getTime() <= now;

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

            const hour12 = actualH === 0 ? 12 : actualH;
            const label = formatArabicTime(actualH, 0);
            const endLabel = formatArabicTime((actualH + 1) % 24, 0);

            let isSelected = false;
            let isStartHour = false;
            let isSubsequentHour = false;

            if (selectedStartHour24 !== null) {
                const selectedEndHour = selectedStartHour24 + durationHours;
                if (virtualH >= selectedStartHour24 && virtualH < selectedEndHour) {
                    isSelected = true;
                    if (virtualH === selectedStartHour24) isStartHour = true;
                    else isSubsequentHour = true;
                }
            }

            lateNight.push({
                hour24: virtualH,
                hour12,
                period: 'AM',
                label,
                endLabel,
                isLateNight: true,
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

        return { mainSlots: main, lateNightSlots: lateNight, allSlots: [...main, ...lateNight] };
    }, [selectedDate, occupiedIntervals, selectedStartHour24, durationHours]);

    // Slot click handler
    const handleSlotClick = (slot: HourlySlotData) => {
        if (slot.isPast) {
            // Friendly tip if user clicked past morning slot thinking it's tonight's session
            if (!slot.isLateNight && slot.hour24 < 6) {
                toast.info('💡 هل تقصد سهرة الليلة بعد منتصف الليل؟ ستجدها بالأسفل مباشرة في قسم "سهرة الليلة" 🌙', {
                    duration: 4500,
                });
            } else {
                toast.error('هذا الوقت قد مضى بالفعل، يرجى اختيار موعد قادم ⏳');
            }
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
            const nextSlot = allSlots.find((s) => s.hour24 === checkH);
            if (!nextSlot || nextSlot.isBooked || nextSlot.isPast) {
                canFitRequested = false;
                conflictHour = checkH;
                break;
            }
            availableCount++;
        }

        if (canFitRequested) {
            onSelectSlot(startH, requestedDuration);
            const endHourCalculated = (startH + requestedDuration) % 24;
            const formattedEnd = formatArabicTime(endHourCalculated, 0);
            const nightNote = slot.isLateNight || (startH < 24 && startH + requestedDuration > 24)
                ? ' (سهرة الليلة 🌙)'
                : '';

            if (requestedDuration > 1) {
                toast.success(`تم حجز ${requestedDuration} ساعات: من ${slot.label} حتى ${formattedEnd}${nightNote} 🎮`);
            } else {
                toast.success(`تم اختيار الساعة: ${slot.label}${nightNote} 🎮`);
            }
        } else {
            onSelectSlot(startH, availableCount);
            const conflictSlot = allSlots.find((s) => s.hour24 === conflictHour);
            const conflictLabel = conflictSlot ? conflictSlot.label : 'نهاية الفترة';
            toast.warning(
                `الساعة ${conflictLabel} محجوزة! تم تحديد المتاح فقط (${availableCount} ${availableCount === 1 ? 'ساعة' : 'ساعات'}) 🔒`
            );
        }
    };

    // Duration change handler
    const handleDurationChange = (newDuration: number) => {
        playPs5NavigateSound();

        if (selectedStartHour24 === null) {
            onChangeDuration(newDuration);
            return;
        }

        if (newDuration <= durationHours) {
            onSelectSlot(selectedStartHour24, newDuration);
            return;
        }

        const startH = selectedStartHour24;
        let canExpand = true;
        let conflictLabel = '';

        for (let offset = 1; offset < newDuration; offset++) {
            const checkH = startH + offset;
            const nextSlot = allSlots.find((s) => s.hour24 === checkH);
            if (!nextSlot || nextSlot.isBooked || nextSlot.isPast) {
                canExpand = false;
                conflictLabel = nextSlot ? nextSlot.label : `${checkH % 24}:00`;
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
        const startSlot = allSlots.find((s) => s.hour24 === selectedStartHour24);
        if (!startSlot) return null;

        const endHour24 = (selectedStartHour24 + durationHours) % 24;
        const formattedEnd = formatArabicTime(endHour24, 0);
        const isLateNightSession = selectedStartHour24 >= 24 || (selectedStartHour24 < 24 && selectedStartHour24 + durationHours > 24);

        return {
            startLabel: startSlot.label,
            endLabel: formattedEnd,
            isLateNight: isLateNightSession,
            totalPrice: Math.round(durationHours * roomRate),
        };
    }, [allSlots, selectedStartHour24, durationHours, roomRate]);

    return (
        <div className="space-y-3" dir="rtl">
            {/* Header: Title & Duration Dropdown */}
            <div className="bg-white/90 dark:bg-[#130f11] backdrop-blur-md border border-neutral-200/90 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Title & 24/7 status */}
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
                                اضغط على ساعة بدء الحجز المطلوبة
                            </p>
                        </div>
                    </div>

                    {/* Small & Simple Duration Dropdown Button */}
                    <div className="relative self-start sm:self-auto" ref={durationMenuRef}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsDurationMenuOpen(!isDurationMenuOpen);
                                playPs5NavigateSound();
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-neutral-200/90 dark:border-white/10 text-neutral-800 dark:text-neutral-100 shadow-xs active:scale-95"
                            aria-label="تحديد مدة الجلسة"
                        >
                            <Timer className="w-3.5 h-3.5 text-red-600 dark:text-red-500 shrink-0" />
                            <span className="text-neutral-500 dark:text-neutral-400 font-medium">المدة:</span>
                            <span className="font-extrabold text-neutral-900 dark:text-white">
                                {durationHours === 1 ? 'ساعة واحدة' : durationHours === 2 ? 'ساعتان' : `${durationHours} ساعات`}
                            </span>
                            <span className="font-mono text-red-600 dark:text-red-400 text-[11px] font-bold">
                                ({Math.round(durationHours * roomRate)} ج.م)
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isDurationMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {isDurationMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 sm:left-0 z-30 mt-1.5 w-52 p-1.5 bg-white dark:bg-[#181316] border border-neutral-200 dark:border-white/10 rounded-xl shadow-2xl space-y-1"
                                >
                                    <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 border-b border-neutral-100 dark:border-white/[0.05] mb-1">
                                        اختر مدة الجلسة:
                                    </div>
                                    {DURATION_CHOICES.map((hrs) => {
                                        const isSelected = durationHours === hrs;
                                        return (
                                            <button
                                                key={hrs}
                                                type="button"
                                                onClick={() => {
                                                    handleDurationChange(hrs);
                                                    setIsDurationMenuOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-red-600 text-white shadow-xs'
                                                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06]'
                                                }`}
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                                    <span>{hrs === 1 ? 'ساعة واحدة' : hrs === 2 ? 'ساعتان' : `${hrs} ساعات`}</span>
                                                </span>
                                                <span className={`font-mono text-[11px] ${isSelected ? 'text-white/90' : 'text-neutral-400'}`}>
                                                    {hrs * roomRate} ج.م
                                                </span>
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Active Selection Live Ribbon */}
                {selectedSessionInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl bg-red-500/10 dark:bg-red-950/30 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                    >
                        <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold">
                            <CheckCircle2 className="w-4 h-4 text-red-600 dark:text-red-500 shrink-0" />
                            <span>
                                موعدك المختار: من <strong className="text-red-600 dark:text-red-400 font-mono text-sm">{selectedSessionInfo.startLabel}</strong> حتى <strong className="text-red-600 dark:text-red-400 font-mono text-sm">{selectedSessionInfo.endLabel}</strong> ({durationHours} {durationHours === 1 ? 'ساعة' : 'ساعات'})
                                {selectedSessionInfo.isLateNight && (
                                    <span className="mr-1.5 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
                                        <Moon className="w-3 h-3" />
                                        <span>سهرة الليلة (فجر اليوم التالي)</span>
                                    </span>
                                )}
                            </span>
                        </div>
                        <span className="font-mono font-black text-red-600 dark:text-red-400 px-2.5 py-1 bg-red-500/15 rounded-lg shrink-0 self-start sm:self-auto">
                            الإجمالي: {selectedSessionInfo.totalPrice} ج.م
                        </span>
                    </motion.div>
                )}
            </div>

            {/* 1. Main 24 Hourly Slots Grid (00:00 -> 23:00) */}
            <div className="space-y-1.5">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {mainSlots.map((slot) => {
                        const {
                            hour24,
                            label,
                            isPast,
                            isBooked,
                            isSelected,
                            isStartHour,
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

            {/* 2. Direct Late Night Extension: سهرة الليلة (بعد ١٢ منتصف الليل) */}
            <div className="pt-3 border-t border-neutral-200/70 dark:border-white/[0.08] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                            <Moon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-white">
                                سهرة الليلة (بعد ١٢ منتصف الليل)
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>فجر اليوم التالي</span>
                            </span>
                        </div>
                    </div>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        احجز سهرتك بعد 11:00 م مباشرة دون الحاجة لتغيير التاريخ 🎮
                    </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {lateNightSlots.map((slot) => {
                        const {
                            hour24,
                            label,
                            isPast,
                            isBooked,
                            isSelected,
                            isStartHour,
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
                                        ? 'bg-gradient-to-r from-indigo-600 via-rose-600 to-red-600 border-red-500 text-white font-extrabold shadow-md shadow-red-600/30 scale-[1.02] z-10 cursor-pointer'
                                        : 'bg-indigo-950/20 dark:bg-indigo-950/30 hover:bg-indigo-900/30 border-indigo-500/25 dark:border-indigo-500/30 text-indigo-900 dark:text-indigo-200 hover:border-red-500/60 hover:text-white cursor-pointer active:scale-95'
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
                    <span className="w-2 h-2 rounded-full bg-indigo-500/60" />
                    <span>سهرة</span>
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
