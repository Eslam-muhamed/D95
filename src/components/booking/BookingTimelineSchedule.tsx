import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, ChevronDown, Clock, CheckCircle2, Lock, AlertCircle, Info, Sparkles } from 'lucide-react';
import {
    OPERATING_HOURS,
    createDateTimeFromBusinessDate,
    formatArabicTime,
    BookingInterval,
} from '@/lib/bookingDatetime';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';

export interface RoomOption {
    id: string;
    name: string;
    nameEn: string;
    titleAr?: string;
}

export interface BookingTimelineScheduleProps {
    selectedDate: string; // YYYY-MM-DD
    currentRoom: RoomOption;
    availableRooms?: RoomOption[];
    onSelectRoom?: (roomId: string) => void;
    occupiedIntervals: BookingInterval[];
    selectedHour?: number;
    selectedMinute?: number;
    selectedPeriod?: 'AM' | 'PM';
    userStartDateTime?: Date | null;
    userEndDateTime?: Date | null;
    onSelectTimeSlot?: (hour12: number, minute: number, period: 'AM' | 'PM') => void;
}

export interface TimelineSlot {
    index: number;
    time24: string;
    hour24: number;
    minute: number;
    hour12: number;
    period: 'AM' | 'PM';
    label: string;
    rangeLabel: string;
    start: Date;
    end: Date;
    status: 'available' | 'booked' | 'past' | 'partial';
    bookedMinutes: number;
    freeMinutes: number;
    bookedPercentage: number;
    isSelected: boolean;
    overlappingBookings: BookingInterval[];
    gradientStyle?: React.CSSProperties;
}

// Helper to format detailed time with exact minutes (e.g. "05:30 م" or "11:15 ص")
function formatTimeDetailed(date: Date): string {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const period = hour >= 12 && hour < 24 ? 'م' : 'ص';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${String(h12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

const TIMELINE_TICKS = [
    { label: '8:00 ص', percent: 0 },
    { label: '12:00 م', percent: 20 },
    { label: '4:00 م', percent: 40 },
    { label: '8:00 م', percent: 60 },
    { label: '12:00 ص', percent: 80 },
    { label: '4:00 ص', percent: 100 },
];

export const BookingTimelineSchedule: React.FC<BookingTimelineScheduleProps> = ({
    selectedDate,
    currentRoom,
    availableRooms = [],
    onSelectRoom,
    occupiedIntervals,
    selectedHour,
    selectedMinute = 0,
    selectedPeriod,
    userStartDateTime,
    userEndDateTime,
    onSelectTimeSlot,
}) => {
    // Accordion collapse/expand state (collapsed by default)
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [hoveredSlot, setHoveredSlot] = useState<TimelineSlot | null>(null);

    // Compute exactly 20 slots (1-hour intervals across the 20 operating hours from 08:00 AM to 04:00 AM)
    // with FULL account of minutes for every booking
    const slots = useMemo<TimelineSlot[]>(() => {
        const result: TimelineSlot[] = [];
        const now = Date.now();

        for (let i = 0; i < 20; i++) {
            const slotHour = (OPERATING_HOURS.START_HOUR + i) % 24;
            const endHour = (OPERATING_HOURS.START_HOUR + i + 1) % 24;

            const time24 = `${String(slotHour).padStart(2, '0')}:00`;
            const start = createDateTimeFromBusinessDate(selectedDate, time24);
            const end = new Date(start.getTime() + 60 * 60 * 1000); // 1-hour interval

            const hour12 = slotHour % 12 === 0 ? 12 : slotHour % 12;
            const period: 'AM' | 'PM' = slotHour >= 12 && slotHour < 24 ? 'PM' : 'AM';
            const label = formatArabicTime(slotHour, 0);
            const endLabel = formatArabicTime(endHour, 0);
            const rangeLabel = `${label} - ${endLabel}`;

            // Check if slot has already passed
            const isPast = end.getTime() <= now;

            // Minute-level calculation of occupied intervals within this specific 1-hour slot
            const slotStartMs = start.getTime();
            const slotEndMs = end.getTime();
            let bookedMs = 0;
            const overlappingBookings: BookingInterval[] = [];

            // Track if the first half or second half is booked for visual gradient
            let firstHalfBooked = false;
            let secondHalfBooked = false;

            if (!isPast) {
                for (const inv of occupiedIntervals) {
                    const invStartMs = inv.start.getTime();
                    const invEndMs = inv.end.getTime();

                    // Check if overlaps: start < invEnd && end > invStart
                    if (slotStartMs < invEndMs && slotEndMs > invStartMs) {
                        overlappingBookings.push(inv);
                        const overlapStart = Math.max(slotStartMs, invStartMs);
                        const overlapEnd = Math.min(slotEndMs, invEndMs);
                        bookedMs += Math.max(0, overlapEnd - overlapStart);

                        // Check position inside hour for partial split
                        const relStartMins = Math.max(0, Math.round((overlapStart - slotStartMs) / 60000));
                        const relEndMins = Math.min(60, Math.round((overlapEnd - slotStartMs) / 60000));

                        if (relStartMins < 30) firstHalfBooked = true;
                        if (relEndMins > 30) secondHalfBooked = true;
                    }
                }
            }

            const bookedMinutes = Math.min(60, Math.round(bookedMs / 60000));
            const freeMinutes = Math.max(0, 60 - bookedMinutes);
            const bookedPercentage = Math.round((bookedMinutes / 60) * 100);

            let status: 'available' | 'booked' | 'past' | 'partial' = 'available';
            let gradientStyle: React.CSSProperties | undefined;

            if (isPast) {
                status = 'past';
            } else if (bookedMinutes >= 55) {
                // 55+ minutes booked = fully blocked
                status = 'booked';
            } else if (bookedMinutes > 0) {
                // Partially booked (minute-aware)
                status = 'partial';
                if (firstHalfBooked && !secondHalfBooked) {
                    // First half is booked (red), second half is free (green)
                    gradientStyle = {
                        background: 'linear-gradient(to right, #dc2626 50%, #10b981 50%)',
                    };
                } else if (!firstHalfBooked && secondHalfBooked) {
                    // First half is free (green), second half is booked (red)
                    gradientStyle = {
                        background: 'linear-gradient(to right, #10b981 50%, #dc2626 50%)',
                    };
                } else {
                    gradientStyle = {
                        background: `linear-gradient(to right, #dc2626 ${bookedPercentage}%, #10b981 ${bookedPercentage}%)`,
                    };
                }
            }

            // Check if slot matches current user session selection
            let isSelected = false;
            if (userStartDateTime && userEndDateTime && !isPast) {
                const uStart = userStartDateTime.getTime();
                const uEnd = userEndDateTime.getTime();
                if (slotStartMs < uEnd && slotEndMs > uStart) {
                    isSelected = true;
                }
            }

            result.push({
                index: i,
                time24,
                hour24: slotHour,
                minute: 0,
                hour12,
                period,
                label,
                rangeLabel,
                start,
                end,
                status,
                bookedMinutes,
                freeMinutes,
                bookedPercentage,
                isSelected,
                overlappingBookings,
                gradientStyle,
            });
        }

        return result;
    }, [selectedDate, occupiedIntervals, userStartDateTime, userEndDateTime]);

    // Chronologically sorted occupied intervals for detailed minutes list
    const sortedOccupiedIntervals = useMemo(() => {
        return [...occupiedIntervals].sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [occupiedIntervals]);

    // Counts for stats
    const stats = useMemo(() => {
        let available = 0;
        let booked = 0;
        let partial = 0;
        let past = 0;
        slots.forEach((s) => {
            if (s.status === 'available') available++;
            else if (s.status === 'booked') booked++;
            else if (s.status === 'partial') partial++;
            else past++;
        });
        return { available, booked, partial, past };
    }, [slots]);

    // Friendly room title & English code
    const roomTitleAr = useMemo(() => {
        if (currentRoom.titleAr) {
            return currentRoom.titleAr.split('•')[0].trim();
        }
        if (currentRoom.id === 'room-1' || currentRoom.name.includes('01')) {
            return 'غرفة 01';
        }
        if (currentRoom.id === 'room-2' || currentRoom.name.includes('02')) {
            return 'غرفة 02 (VIP)';
        }
        return currentRoom.name;
    }, [currentRoom]);

    const roomCodeEn = useMemo(() => {
        if (currentRoom.nameEn) return currentRoom.nameEn;
        if (currentRoom.id === 'room-1' || currentRoom.name.includes('01')) return 'ROOM 01';
        if (currentRoom.id === 'room-2' || currentRoom.name.includes('02')) return 'ROOM 02';
        return 'ROOM';
    }, [currentRoom]);

    const handleSlotClick = (slot: TimelineSlot) => {
        if (slot.status === 'booked' || slot.status === 'past') return;
        if (onSelectTimeSlot) {
            playPs5SelectSound();
            // Preserve user's chosen minute, or pick the free minute in partial slot
            let targetMinute = selectedMinute;
            if (slot.status === 'partial' && slot.overlappingBookings.length > 0) {
                const firstBooking = slot.overlappingBookings[0];
                const bStartMins = firstBooking.start.getMinutes();
                // If booking starts at minute 30, free is 00; otherwise pick 30
                targetMinute = bStartMins > 0 ? 0 : firstBooking.end.getMinutes();
            }
            onSelectTimeSlot(slot.hour12, targetMinute, slot.period);
        }
    };

    return (
        <div className="w-full rounded-2xl bg-neutral-950/95 dark:bg-[#120d10] border border-neutral-800/90 dark:border-white/[0.08] overflow-hidden shadow-xl transition-all" dir="rtl">
            {/* Header / Toggle Trigger */}
            <button
                type="button"
                onClick={() => {
                    setIsOpen((prev) => !prev);
                    playPs5NavigateSound();
                }}
                className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-white/[0.03] transition-colors cursor-pointer group select-none text-right"
            >
                <div className="flex items-center gap-2.5">
                    {/* Red Circular Icon with Arrow */}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500/15 border border-red-500/40 text-red-500 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.3)] transition-transform duration-300 group-hover:scale-110 shrink-0">
                        <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown className="w-4 h-4" />
                        </motion.div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm sm:text-base text-white">
                                مخطط المواعيد
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                sortedOccupiedIntervals.length > 0
                                    ? 'bg-red-500/15 text-red-400 border-red-500/30 font-bold'
                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            }`}>
                                {sortedOccupiedIntervals.length > 0 ? `${sortedOccupiedIntervals.length} أوقات محجوزة` : 'متاح بالكامل'}
                            </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 hidden sm:block mt-0.5">
                            خريطة زمنية مرئية لكافة ساعات العمل وحالة الحجوزات اليومية بالدقائق
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 group-hover:text-neutral-200 transition-colors">
                    <span className="hidden xs:inline">{isOpen ? 'إخفاء المخطط' : 'عرض المخطط'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-red-500' : ''}`} />
                </div>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden border-t border-neutral-800/80 dark:border-white/[0.06]"
                    >
                        <div className="p-3.5 sm:p-5 space-y-4">
                            {/* Integrated Status Legend Bar */}
                            <div className="flex flex-wrap items-center justify-around sm:justify-center sm:gap-8 py-2.5 px-4 rounded-xl bg-neutral-900/80 dark:bg-[#161114] border border-neutral-800/80 dark:border-white/[0.06] shadow-inner text-xs font-bold select-none gap-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.85)] animate-pulse" />
                                    <span className="text-neutral-200 dark:text-neutral-100">متاح بالكامل</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.85)]" />
                                    <span className="text-neutral-200 dark:text-neutral-100">محجوز جزئياً (بالدقائق)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.85)]" />
                                    <span className="text-neutral-200 dark:text-neutral-100">محجوز بالكامل</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-600 dark:bg-neutral-700" />
                                    <span className="text-neutral-400">غير متاح (مضى)</span>
                                </div>
                            </div>
                                {/* Time Axis / Ruler with Ticks (Left-to-Right progression) */}
                                <div className="relative pt-1 pb-1 px-1 sm:px-2 select-none" dir="ltr">
                                    {/* Tick Labels */}
                                    <div className="flex justify-between items-end mb-1 font-mono text-[9px] sm:text-[11px] text-neutral-400">
                                        {TIMELINE_TICKS.map((tick, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex flex-col items-center ${
                                                    idx === 0
                                                        ? 'items-start'
                                                        : idx === TIMELINE_TICKS.length - 1
                                                        ? 'items-end'
                                                        : 'items-center'
                                                }`}
                                            >
                                                <span className="text-neutral-300 font-semibold mb-1">
                                                    {tick.label}
                                                </span>
                                                <div className="w-[1.5px] h-2 bg-neutral-600 dark:bg-neutral-700" />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Ruler Axis Line */}
                                    <div className="h-[1.5px] w-full bg-neutral-700/80 dark:bg-neutral-800 rounded-full" />
                                </div>

                                {/* Room Schedule Card */}
                                <div className="rounded-2xl bg-neutral-900/90 dark:bg-[#181316] border border-neutral-800 dark:border-white/10 p-3.5 sm:p-4 space-y-3.5 relative shadow-lg">
                                    {/* Room Header with Icon and Switcher */}
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            {/* Glowing Red Gamepad Box */}
                                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-red-500/15 border border-red-500/40 text-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.35)] shrink-0">
                                                <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-sm sm:text-base text-white">
                                                    {roomTitleAr}
                                                </h4>
                                                <span className="text-xs text-neutral-400 font-mono">
                                                    ({roomCodeEn})
                                                </span>
                                            </div>
                                        </div>


                                    </div>

                                    {/* The Horizontal Timeline Track of 20 Rounded Squares (08:00 AM - 04:00 AM) */}
                                    <div className="space-y-1.5">
                                        <div
                                            className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2.5 bg-black/60 dark:bg-black/80 rounded-xl border border-white/[0.06] overflow-x-auto select-none"
                                            dir="ltr"
                                        >
                                            {slots.map((slot) => {
                                                const isAvailable = slot.status === 'available';
                                                const isPartial = slot.status === 'partial';
                                                const isBooked = slot.status === 'booked';
                                                const isPast = slot.status === 'past';

                                                return (
                                                    <button
                                                        key={slot.index}
                                                        type="button"
                                                        onClick={() => handleSlotClick(slot)}
                                                        onMouseEnter={() => setHoveredSlot(slot)}
                                                        onMouseLeave={() => setHoveredSlot(null)}
                                                        onTouchStart={() => setHoveredSlot(slot)}
                                                        disabled={isPast || isBooked}
                                                        style={slot.gradientStyle}
                                                        title={`${slot.rangeLabel} - ${
                                                            isAvailable
                                                                ? 'متاح بالكامل'
                                                                : isPartial
                                                                ? `محجوز جزئياً (${slot.bookedMinutes} دقيقة محجوزة)`
                                                                : isBooked
                                                                ? 'محجوز بالكامل'
                                                                : 'غير متاح (مضى)'
                                                        }`}
                                                        className={`flex-1 min-w-[10px] sm:min-w-[14px] h-7 sm:h-9 rounded-[4px] sm:rounded-md transition-all duration-150 relative outline-none ${
                                                            isPast
                                                                ? 'bg-neutral-800/90 border border-neutral-700/40 opacity-40 cursor-not-allowed'
                                                                : isBooked
                                                                ? 'bg-red-600 border border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.5)] cursor-not-allowed hover:opacity-90'
                                                                : isPartial
                                                                ? 'border border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.5)] hover:scale-115 active:scale-95 cursor-pointer z-0'
                                                                : slot.isSelected
                                                                ? 'bg-emerald-400 border-2 border-white shadow-[0_0_14px_rgba(16,185,129,0.95)] scale-110 z-10 animate-pulse'
                                                                : 'bg-emerald-500 hover:bg-emerald-400 border border-emerald-400/40 shadow-[0_0_6px_rgba(16,185,129,0.35)] hover:scale-115 active:scale-95 cursor-pointer z-0'
                                                        }`}
                                                    />
                                                );
                                            })}
                                        </div>

                                        {/* Status / Hover Bar Info with Exact Minutes */}
                                        <div className="min-h-[32px] flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/[0.04] text-xs">
                                            {hoveredSlot ? (
                                                <div className="flex items-center gap-2 font-mono flex-wrap">
                                                    <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                                    <span className="font-bold text-white">
                                                        {hoveredSlot.rangeLabel}
                                                    </span>
                                                    <span className="text-neutral-500">•</span>
                                                    {hoveredSlot.status === 'available' && (
                                                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>
                                                                متاح للحجز (انقر للبدء الساعة {hoveredSlot.hour12}:{String(selectedMinute).padStart(2, '0')} {hoveredSlot.period === 'PM' ? 'م' : 'ص'})
                                                            </span>
                                                        </span>
                                                    )}
                                                    {hoveredSlot.status === 'partial' && (
                                                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                            <span>
                                                                محجوز جزئياً ({hoveredSlot.bookedMinutes} دقيقة محجوزة، و {hoveredSlot.freeMinutes} دقيقة متاحة)
                                                            </span>
                                                        </span>
                                                    )}
                                                    {hoveredSlot.status === 'booked' && (
                                                        <span className="inline-flex items-center gap-1 text-red-400 font-bold">
                                                            <Lock className="w-3.5 h-3.5" />
                                                            <span>
                                                                محجوز بالكامل ({hoveredSlot.overlappingBookings.length > 0
                                                                    ? `${formatTimeDetailed(hoveredSlot.overlappingBookings[0].start)} إلى ${formatTimeDetailed(hoveredSlot.overlappingBookings[0].end)}`
                                                                    : 'الساعة محجوزة'})
                                                            </span>
                                                        </span>
                                                    )}
                                                    {hoveredSlot.status === 'past' && (
                                                        <span className="inline-flex items-center gap-1 text-neutral-400 font-medium">
                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                            <span>وقت قد مضى</span>
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                                                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                                    <span>
                                                        انقر على أي خانة <strong className="text-emerald-400">خضراء</strong> لتحديد وقت البدء، وتوضح الخانات <strong className="text-amber-400">الصفراء</strong> الحجوزات الجزئية بالدقائق.
                                                    </span>
                                                </div>
                                            )}

                                            <div className="text-[11px] font-mono text-neutral-400 shrink-0 hidden sm:block">
                                                {stats.available} ساعة شاغرة
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. قائمة المواعيد المحجوزة تفصيلياً بالدقائق (المكان المنظم الجديد) */}
                                    <div className="pt-3.5 border-t border-neutral-800/80 dark:border-white/[0.08] space-y-2.5">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-neutral-200">
                                                <Lock className="w-3.5 h-3.5 text-red-500" />
                                                <span>المواعيد المحجوزة اليوم ({roomTitleAr})</span>
                                            </div>
                                            <span className="text-[11px] font-mono text-neutral-400">
                                                {sortedOccupiedIntervals.length > 0 ? `${sortedOccupiedIntervals.length} مواعيد مسجلة` : 'متاح بالكامل'}
                                            </span>
                                        </div>

                                        {sortedOccupiedIntervals.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                                {sortedOccupiedIntervals.map((b, idx) => {
                                                    const durationMinutes = Math.round((b.end.getTime() - b.start.getTime()) / 60000);
                                                    const hours = Math.floor(durationMinutes / 60);
                                                    const mins = durationMinutes % 60;
                                                    let durationText = '';
                                                    if (hours > 0 && mins > 0) durationText = `${hours} س و ${mins} د`;
                                                    else if (hours > 0) durationText = `${hours} ${hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتان' : 'ساعات'}`;
                                                    else durationText = `${mins} دقيقة`;

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-red-500/25 hover:border-red-500/45 transition-colors text-xs shadow-xs"
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                                                                    <Lock className="w-3.5 h-3.5" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-mono text-neutral-200 font-bold flex items-center gap-1.5 text-xs">
                                                                        <span>{formatTimeDetailed(b.start)}</span>
                                                                        <span className="text-neutral-500 font-normal">إلى</span>
                                                                        <span>{formatTimeDetailed(b.end)}</span>
                                                                    </div>
                                                                    <div className="text-[10px] text-neutral-400 font-medium mt-0.5">
                                                                        المدة: {durationText}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30">
                                                                محجوز
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-emerald-400 text-xs font-semibold">
                                                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                                                <span>الغرفة متاحة بالكامل طوال اليوم! لا توجد أي مواعيد محجوزة مسبقاً.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
        </div>
    );
};
