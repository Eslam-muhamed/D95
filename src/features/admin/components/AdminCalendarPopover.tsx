import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronRight,
    ChevronLeft,
    X,
    AlertCircle,
    Check,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';

interface AdminCalendarPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: string; // YYYY-MM-DD
    onSelectDate: (date: string) => void;
    pendingCountsByDate: Record<string, number>;
}

const ARABIC_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const WEEKDAY_NAMES = ['سبت', 'أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع'];

function addDaysToDateStr(isoDate: string, days: number): string {
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function AdminCalendarPopover({
    isOpen,
    onClose,
    selectedDate,
    onSelectDate,
    pendingCountsByDate,
}: AdminCalendarPopoverProps) {
    const popoverRef = useRef<HTMLDivElement>(null);

    // Initialize calendar month from selectedDate
    const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
        if (selectedDate) {
            const [y, m] = selectedDate.split('-').map(Number);
            return new Date(y, m - 1, 1);
        }
        return new Date();
    });

    // Keep calendarMonth in sync when selectedDate changes externally
    useEffect(() => {
        if (selectedDate) {
            const [y, m] = selectedDate.split('-').map(Number);
            setCalendarMonth(new Date(y, m - 1, 1));
        }
    }, [selectedDate]);

    // Close on Click Outside
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    // Today / Tomorrow / After Tomorrow ISO strings
    const todayObj = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const todayStr = useMemo(() => {
        const y = todayObj.getFullYear();
        const m = String(todayObj.getMonth() + 1).padStart(2, '0');
        const d = String(todayObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, [todayObj]);

    const tomorrowStr = useMemo(() => addDaysToDateStr(todayStr, 1), [todayStr]);
    const afterTomorrowStr = useMemo(() => addDaysToDateStr(todayStr, 2), [todayStr]);

    // Month grid generator for custom calendar popup (week starts Saturday)
    const monthDaysGrid = useMemo(() => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday, 6 is Saturday
        // Saturday is index 0:
        const emptyCount = (firstDayOfWeek + 1) % 7;
        const totalDays = new Date(year, month + 1, 0).getDate();

        const cells: Array<{
            iso: string;
            dayNumber: number;
            isToday: boolean;
            isPast: boolean;
            pendingCount: number;
        } | null> = [];

        for (let i = 0; i < emptyCount; i++) {
            cells.push(null);
        }

        for (let d = 1; d <= totalDays; d++) {
            const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isPast = iso < todayStr;
            cells.push({
                iso,
                dayNumber: d,
                isToday: iso === todayStr,
                isPast,
                pendingCount: isPast ? 0 : (pendingCountsByDate[iso] || 0),
            });
        }

        return cells;
    }, [calendarMonth, todayStr, pendingCountsByDate]);

    // Check if current calendar month is at or before today's month
    const isAtOrBeforeCurrentMonth = useMemo(() => {
        return calendarMonth.getFullYear() < todayObj.getFullYear() ||
            (calendarMonth.getFullYear() === todayObj.getFullYear() && calendarMonth.getMonth() <= todayObj.getMonth());
    }, [calendarMonth, todayObj]);

    // Calculate total pending bookings in the currently viewed month
    const monthPendingTotal = useMemo(() => {
        return monthDaysGrid.reduce((sum, cell) => {
            return sum + (cell ? cell.pendingCount : 0);
        }, 0);
    }, [monthDaysGrid]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-2xs sm:bg-transparent sm:backdrop-blur-none sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 sm:p-0 sm:block">
                <motion.div
                    ref={popoverRef}
                    initial={{ opacity: 0, scale: 0.96, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="w-full max-w-[320px] sm:w-80 p-4 bg-white border border-slate-200/95 rounded-2xl shadow-2xl space-y-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                                <CalendarIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-900">تقويم المواعيد والحجوزات</h4>
                                {monthPendingTotal > 0 ? (
                                    <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                                        <AlertCircle className="w-3 h-3 shrink-0" />
                                        <span>يوجد {monthPendingTotal} حجز معلق بهذا الشهر</span>
                                    </p>
                                ) : (
                                    <p className="text-[10px] text-slate-400">اختر يوماً لمتابعة جدول تشغيله</p>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            aria-label="إغلاق التقويم"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Quick Shortcuts: اليوم / غداً / بعد غد */}
                    <div className="grid grid-cols-3 gap-1.5">
                        {[
                            { label: 'اليوم', iso: todayStr, pending: pendingCountsByDate[todayStr] || 0 },
                            { label: 'غداً', iso: tomorrowStr, pending: pendingCountsByDate[tomorrowStr] || 0 },
                            { label: 'بعد غد', iso: afterTomorrowStr, pending: pendingCountsByDate[afterTomorrowStr] || 0 },
                        ].map((sc) => {
                            const isSelected = selectedDate === sc.iso;
                            return (
                                <button
                                    key={sc.iso}
                                    type="button"
                                    onClick={() => {
                                        onSelectDate(sc.iso);
                                        playPs5SelectSound();
                                        onClose();
                                    }}
                                    className={`relative py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer flex items-center justify-center gap-1.5 ${
                                        isSelected
                                            ? 'bg-red-600 border-red-600 text-white shadow-xs'
                                            : sc.pending > 0
                                            ? 'bg-amber-50/80 border-amber-300 text-amber-900 hover:bg-amber-100'
                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    <span>{sc.label}</span>
                                    {sc.pending > 0 && (
                                        <span
                                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                                                isSelected ? 'bg-white text-red-600' : 'bg-amber-500 text-slate-950'
                                            }`}
                                        >
                                            {sc.pending}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Month header & navigation */}
                    <div className="flex items-center justify-between px-1 text-xs">
                        <button
                            type="button"
                            disabled={isAtOrBeforeCurrentMonth}
                            onClick={() => {
                                if (isAtOrBeforeCurrentMonth) return;
                                setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                                playPs5NavigateSound();
                            }}
                            className={`p-1 rounded-lg border text-xs transition-colors ${
                                isAtOrBeforeCurrentMonth
                                    ? 'border-slate-100 text-slate-300 opacity-40 cursor-not-allowed pointer-events-none'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer'
                            }`}
                            title="الشهر السابق"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <span className="font-bold text-slate-800 text-xs">
                            {ARABIC_MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                                playPs5NavigateSound();
                            }}
                            className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                            title="الشهر القادم"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {WEEKDAY_NAMES.map((name, idx) => (
                            <div key={idx} className="text-[10px] font-bold text-slate-400 py-0.5">
                                {name}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid of Day Cells */}
                    <div className="grid grid-cols-7 gap-1">
                        {monthDaysGrid.map((cell, idx) => {
                            if (!cell) {
                                return <div key={`empty-${idx}`} className="h-8" />;
                            }
                            const isSelected = selectedDate === cell.iso;
                            const hasPending = cell.pendingCount > 0;
                            const isPast = cell.isPast;

                            return (
                                <button
                                    key={cell.iso}
                                    type="button"
                                    disabled={isPast}
                                    onClick={() => {
                                        if (isPast) return;
                                        onSelectDate(cell.iso);
                                        playPs5SelectSound();
                                        onClose();
                                    }}
                                    className={`relative h-8 rounded-xl flex items-center justify-center text-xs transition-all ${
                                        isPast
                                            ? 'text-slate-300 opacity-30 cursor-not-allowed pointer-events-none'
                                            : isSelected
                                            ? 'bg-red-600 text-white shadow-xs z-10 cursor-pointer font-bold'
                                            : hasPending
                                            ? 'bg-amber-100/70 text-amber-950 border border-amber-300 hover:bg-amber-200/80 font-black cursor-pointer'
                                            : cell.isToday
                                            ? 'bg-red-50 text-red-600 border border-red-300 hover:bg-red-100 font-bold cursor-pointer'
                                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-bold cursor-pointer'
                                    }`}
                                    title={
                                        isPast
                                            ? `${cell.dayNumber} - تاريخ منتهي`
                                            : hasPending
                                            ? `${cell.dayNumber} - يوجد ${cell.pendingCount} حجز معلق`
                                            : `${cell.dayNumber}`
                                    }
                                >
                                    <span>{cell.dayNumber}</span>

                                    {/* Prominent Pending Notification Badge on the Day Cell */}
                                    {hasPending && (
                                        <span
                                            className={`absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 text-[9px] font-mono font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs ${
                                                isSelected
                                                    ? 'bg-amber-400 text-slate-950'
                                                    : 'bg-amber-500 text-slate-950 animate-pulse'
                                            }`}
                                        >
                                            {cell.pendingCount}
                                        </span>
                                    )}

                                    {/* Small indicator dot for today if not selected */}
                                    {cell.isToday && !isSelected && !hasPending && (
                                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-red-600" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
