import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Lock,
    CheckCircle2,
    Timer,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Moon,
    Sparkles,
    Calendar,
    X,
} from 'lucide-react';
import {
    type BookingInterval,
    addDaysToDateString,
    createDateTimeFromBusinessDate,
    formatArabicTime,
    formatArabicTimeFromDate,
    getCairoTodayDateString,
} from '@/lib/bookingDatetime';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';
import { toast } from 'sonner';
import Booking24HoursGuideModal from './Booking24HoursGuideModal';

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
    onChangeDate?: (newDate: string) => void;
    roomRate: number;
    occupiedIntervals: BookingInterval[];
    selectedStartHour24: number | null;
    durationHours: number;
    onSelectSlot: (startHour24: number, durationHours: number) => void;
    onChangeDuration: (newDuration: number) => void;
}

const DURATION_CHOICES = [1, 2, 3, 4, 5, 6];

const ARABIC_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function HourlyBookingSlotsGrid({
    selectedDate,
    onChangeDate,
    roomRate,
    occupiedIntervals,
    selectedStartHour24,
    durationHours,
    onSelectSlot,
    onChangeDuration,
}: HourlyBookingSlotsGridProps) {
    const [isDurationMenuOpen, setIsDurationMenuOpen] = useState(false);
    const durationMenuRef = useRef<HTMLDivElement>(null);

    const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
    const dateMenuRef = useRef<HTMLDivElement>(null);

    const [isGuideOpen, setIsGuideOpen] = useState(false);

    // Calendar state for date picker popover
    const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
        const [y, m, d] = selectedDate.split('-').map(Number);
        return new Date(y, m - 1, d || 1);
    });

    useEffect(() => {
        const [y, m, d] = selectedDate.split('-').map(Number);
        if (!isNaN(y) && !isNaN(m)) {
            setCalendarMonth(new Date(y, m - 1, d || 1));
        }
    }, [selectedDate]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (durationMenuRef.current && !durationMenuRef.current.contains(e.target as Node)) {
                setIsDurationMenuOpen(false);
            }
            if (dateMenuRef.current && !dateMenuRef.current.contains(e.target as Node)) {
                setIsDateMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Formatted date string for button label (e.g. "اليوم، 18 أكتوبر")
    const formattedDateLabel = useMemo(() => {
        const [y, m, d] = selectedDate.split('-').map(Number);
        const dayDate = new Date(y, m - 1, d);
        const todayStr = getCairoTodayDateString();
        const tomorrowStr = addDaysToDateString(todayStr, 1);
        const monthName = ARABIC_MONTHS[m - 1];

        if (selectedDate === todayStr) {
            return `اليوم، ${d} ${monthName}`;
        }
        if (selectedDate === tomorrowStr) {
            return `غداً، ${d} ${monthName}`;
        }
        const dayName = ARABIC_DAYS[dayDate.getDay()];
        return `${dayName}، ${d} ${monthName}`;
    }, [selectedDate]);

    // Quick Date shortcuts: اليوم، غداً، بعد غد
    const quickShortcuts = useMemo(() => {
        const todayStr = getCairoTodayDateString();
        return [
            { label: 'اليوم', iso: todayStr },
            { label: 'غداً', iso: addDaysToDateString(todayStr, 1) },
            { label: 'بعد غد', iso: addDaysToDateString(todayStr, 2) },
        ];
    }, []);

    // Calendar monthly grid calculation
    const monthDaysGrid = useMemo(() => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun..6=Sat
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayStr = getCairoTodayDateString();

        const grid: Array<{ iso: string; dayNumber: number; isPast: boolean; isToday: boolean } | null> = [];

        // Arabic week starts on Saturday (idx 0) -> map Sun(0)..Fri(5), Sat(6)
        // Offset: (firstDayOfMonth + 1) % 7
        const offset = (firstDayOfMonth + 1) % 7;
        for (let i = 0; i < offset; i++) {
            grid.push(null);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            grid.push({
                iso,
                dayNumber: d,
                isPast: iso < todayStr,
                isToday: iso === todayStr,
            });
        }

        return grid;
    }, [calendarMonth]);

    const canGoPrevMonth = useMemo(() => {
        const todayStr = getCairoTodayDateString();
        const [y, m] = todayStr.split('-').map(Number);
        const currentYear = calendarMonth.getFullYear();
        const currentMonth = calendarMonth.getMonth();
        return currentYear > y || (currentYear === y && currentMonth > m - 1);
    }, [calendarMonth]);

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
                toast.success(`تم اختيار ${requestedDuration} ساعات: من ${slot.label} حتى ${formattedEnd}${nightNote} 🎮`);
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
        <div className="space-y-3 relative" dir="rtl">
            {/* Backdrop overlay for mobile priority (tapping outside dismisses cleanly without accidental clicks) */}
            <AnimatePresence>
                {(isDateMenuOpen || isDurationMenuOpen) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] sm:bg-transparent"
                        onClick={() => {
                            setIsDateMenuOpen(false);
                            setIsDurationMenuOpen(false);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Unified Control Card: Header + Date Dropdown + Duration Dropdown + Guide Pill */}
            <div className="bg-white/90 dark:bg-[#130f11] backdrop-blur-md border border-neutral-200/90 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 relative z-30">
                
                {/* Row 1: Title & Action Dropdown Buttons (Date + Duration) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Right: Section Title & 24/7 Subtitle */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-red-600/10 dark:bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-600 dark:text-red-500 shrink-0">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
                                <span>وقت البدء ومدة الجلسة</span>
                            </h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                مواعيد العمل: مفتوح 24 ساعة يومياً (24/7) دون توقف
                            </p>
                        </div>
                    </div>

                    {/* Left: Two Compact Dropdown Pills (Duration + Date) */}
                    <div className="flex items-center gap-2 self-start sm:self-auto relative z-50">
                        
                        {/* 1. Duration Dropdown Button (المدة) */}
                        <div className="relative" ref={durationMenuRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDurationMenuOpen(!isDurationMenuOpen);
                                    setIsDateMenuOpen(false);
                                    playPs5NavigateSound();
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-red-950/20 hover:bg-red-950/30 dark:bg-red-950/30 dark:hover:bg-red-950/40 border border-red-500/35 text-red-600 dark:text-red-400 shadow-xs active:scale-95"
                                aria-label="تحديد مدة الجلسة"
                            >
                                <Timer className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                                <span>المدة: {durationHours} h</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-red-500/70 transition-transform duration-200 ${isDurationMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Duration Dropdown Popover */}
                            <AnimatePresence>
                                {isDurationMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-full mt-2 right-0 sm:right-auto sm:left-0 z-50 w-56 sm:w-60 p-3 bg-white dark:bg-[#181316] border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl space-y-1.5 text-right"
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-neutral-100 dark:border-white/[0.08]">
                                            <div className="text-right">
                                                <span className="font-bold text-xs sm:text-sm text-neutral-800 dark:text-neutral-200">
                                                    اختر مدة الجلسة
                                                </span>
                                            </div>
                                            <div className="text-left font-mono leading-tight">
                                                <div className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
                                                    {roomRate}
                                                </div>
                                                <div className="text-[10px] text-neutral-400 font-sans">
                                                    ج.م /س
                                                </div>
                                            </div>
                                        </div>

                                        {/* Choices list */}
                                        <div className="space-y-1">
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
                                                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-red-600 text-white shadow-md'
                                                                : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.06]'
                                                        }`}
                                                    >
                                                        {/* Left: Price */}
                                                        <span className={`font-mono text-xs sm:text-sm font-bold ${isSelected ? 'text-white' : 'text-neutral-400 dark:text-neutral-300'}`}>
                                                            {hrs * roomRate} ج.م
                                                        </span>

                                                        {/* Right: "h X" with dot indicator */}
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono tracking-wide font-bold">h {hrs}</span>
                                                            {isSelected ? (
                                                                <span className="w-2.5 h-2.5 rounded-full bg-white shadow-xs shrink-0" />
                                                            ) : (
                                                                <span className="w-2.5 h-2.5 rounded-full border border-neutral-400 dark:border-neutral-500 shrink-0" />
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* 2. Date Dropdown Button (التاريخ) */}
                        <div className="relative" ref={dateMenuRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDateMenuOpen(!isDateMenuOpen);
                                    setIsDurationMenuOpen(false);
                                    playPs5NavigateSound();
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-neutral-200/90 dark:border-white/10 text-neutral-800 dark:text-neutral-100 shadow-xs active:scale-95"
                                title="اختر تاريخ الحجز"
                            >
                                <Calendar className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                                <span>{formattedDateLabel}</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isDateMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Date Popover */}
                            <AnimatePresence>
                                {isDateMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-50 w-[290px] sm:w-[310px] max-w-[calc(100vw-32px)] p-3.5 bg-white dark:bg-[#181416] border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl space-y-2.5 text-right"
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/[0.08]">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-red-600 dark:text-red-500 shrink-0" />
                                                <span className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-white">
                                                    اختر يوم الحجز
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsDateMenuOpen(false)}
                                                className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                                aria-label="إغلاق"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>

                                        {/* Quick Select Buttons: اليوم، غداً، بعد غد */}
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {quickShortcuts.map((sc) => {
                                                const isSelected = selectedDate === sc.iso;
                                                return (
                                                    <button
                                                        key={sc.iso}
                                                        type="button"
                                                        onClick={() => {
                                                            onChangeDate?.(sc.iso);
                                                            playPs5SelectSound();
                                                            setIsDateMenuOpen(false);
                                                        }}
                                                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-red-600 border-red-600 text-white font-extrabold shadow-sm'
                                                                : 'bg-neutral-50 dark:bg-[#1c181a] border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.08]'
                                                        }`}
                                                    >
                                                        {sc.label}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Month Navigation */}
                                        <div className="flex items-center justify-between px-1 py-1 text-xs">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (canGoPrevMonth) {
                                                        setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                                                        playPs5NavigateSound();
                                                    }
                                                }}
                                                disabled={!canGoPrevMonth}
                                                className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                                                title="الشهر السابق"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>

                                            <span className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white tracking-wide">
                                                {ARABIC_MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                                                    playPs5NavigateSound();
                                                }}
                                                className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.08] flex items-center justify-center transition-colors cursor-pointer"
                                                title="الشهر القادم"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Days of week header */}
                                        <div className="grid grid-cols-7 gap-1 text-center py-1">
                                            {['سبت', 'أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع'].map((name, idx) => (
                                                <div key={idx} className="text-xs font-bold text-neutral-400 dark:text-neutral-400 py-0.5">
                                                    {name}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Calendar Grid of Day Cells */}
                                        <div className="grid grid-cols-7 gap-1">
                                            {monthDaysGrid.map((cell, idx) => {
                                                if (!cell) {
                                                    return <div key={`empty-${idx}`} className="h-8 w-8 sm:h-9 sm:w-9" />;
                                                }
                                                const isSelected = selectedDate === cell.iso;
                                                return (
                                                    <button
                                                        key={cell.iso}
                                                        type="button"
                                                        disabled={cell.isPast}
                                                        onClick={() => {
                                                            onChangeDate?.(cell.iso);
                                                            playPs5SelectSound();
                                                            setIsDateMenuOpen(false);
                                                        }}
                                                        className={`h-8 w-8 sm:h-9 sm:w-9 mx-auto rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
                                                            cell.isPast
                                                                ? 'text-neutral-300 dark:text-neutral-600 opacity-35 cursor-not-allowed'
                                                                : isSelected
                                                                ? 'bg-red-600 text-white font-extrabold shadow-sm scale-105 z-10'
                                                                : cell.isToday
                                                                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20 cursor-pointer'
                                                                : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.08] cursor-pointer'
                                                        }`}
                                                    >
                                                        <span>{cell.dayNumber}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Row 2: Golden Guide Pill */}
                <div className="flex items-center justify-start pt-1">
                    <button
                        type="button"
                        onClick={() => {
                            setIsGuideOpen(true);
                            playPs5SelectSound();
                        }}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/50 text-amber-300 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                        <span className="text-sm">💡</span>
                        <span>دليل حجز السهرة (12 بالليل vs 12 الظهر)</span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    </button>
                </div>

                {/* Row 3: Active Selection Live Ribbon */}
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

            {/* Guide Modal Component */}
            <Booking24HoursGuideModal
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
                onApplyMidnightExample={() => {
                    // Automatically select 12:00 AM in Late Night section (hour 24)
                    onSelectSlot(24, durationHours);
                }}
            />
        </div>
    );
}
