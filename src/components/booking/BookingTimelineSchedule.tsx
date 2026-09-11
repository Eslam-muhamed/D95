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
    status: 'available' | 'booked' | 'past';
    isSelected: boolean;
    booking?: BookingInterval;
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
    userStartDateTime,
    userEndDateTime,
    onSelectTimeSlot,
}) => {
    // Accordion collapse/expand state (open by default so user sees it right away)
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const [hoveredSlot, setHoveredSlot] = useState<TimelineSlot | null>(null);

    // Compute all 40 slots (30-minute intervals across the 20 operating hours)
    const slots = useMemo<TimelineSlot[]>(() => {
        const result: TimelineSlot[] = [];
        const now = Date.now();

        for (let i = 0; i < 40; i++) {
            const totalMinutes = i * 30;
            const slotHour = (OPERATING_HOURS.START_HOUR + Math.floor(totalMinutes / 60)) % 24;
            const slotMinute = totalMinutes % 60;

            const time24 = `${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}`;
            const start = createDateTimeFromBusinessDate(selectedDate, time24);
            const end = new Date(start.getTime() + 30 * 60 * 1000);

            const endHour = (OPERATING_HOURS.START_HOUR + Math.floor((totalMinutes + 30) / 60)) % 24;
            const endMinute = (totalMinutes + 30) % 60;

            const hour12 = slotHour % 12 === 0 ? 12 : slotHour % 12;
            const period: 'AM' | 'PM' = slotHour >= 12 && slotHour < 24 ? 'PM' : 'AM';
            const label = formatArabicTime(slotHour, slotMinute);
            const endLabel = formatArabicTime(endHour, endMinute);
            const rangeLabel = `${label} - ${endLabel}`;

            // Check if slot has already passed
            const isPast = end.getTime() <= now;

            // Check if slot overlaps any booked/occupied interval
            let matchingBooking: BookingInterval | undefined;
            if (!isPast) {
                matchingBooking = occupiedIntervals.find((inv) => {
                    const invStart = inv.start.getTime();
                    const invEnd = inv.end.getTime();
                    return start.getTime() < invEnd && end.getTime() > invStart;
                });
            }

            let status: 'available' | 'booked' | 'past' = 'available';
            if (isPast) {
                status = 'past';
            } else if (matchingBooking) {
                status = 'booked';
            }

            // Check if slot matches current user session selection
            let isSelected = false;
            if (userStartDateTime && userEndDateTime && !isPast) {
                const uStart = userStartDateTime.getTime();
                const uEnd = userEndDateTime.getTime();
                if (start.getTime() < uEnd && end.getTime() > uStart) {
                    isSelected = true;
                }
            }

            result.push({
                index: i,
                time24,
                hour24: slotHour,
                minute: slotMinute,
                hour12,
                period,
                label,
                rangeLabel,
                start,
                end,
                status,
                isSelected,
                booking: matchingBooking,
            });
        }

        return result;
    }, [selectedDate, occupiedIntervals, userStartDateTime, userEndDateTime]);

    // Counts for stats
    const stats = useMemo(() => {
        let available = 0;
        let booked = 0;
        let past = 0;
        slots.forEach((s) => {
            if (s.status === 'available') available++;
            else if (s.status === 'booked') booked++;
            else past++;
        });
        return { available, booked, past };
    }, [slots]);

    // Friendly room title & English code
    const roomTitleAr = useMemo(() => {
        if (currentRoom.titleAr) {
            return currentRoom.titleAr.split('•')[0].trim();
        }
        if (currentRoom.id === 'room-1' || currentRoom.name.includes('01')) {
            return 'الغرفة الأولى';
        }
        if (currentRoom.id === 'room-2' || currentRoom.name.includes('02')) {
            return 'غرفة النجوم VIP';
        }
        return currentRoom.name;
    }, [currentRoom]);

    const roomCodeEn = useMemo(() => {
        if (currentRoom.nameEn) return currentRoom.nameEn;
        if (currentRoom.id === 'room-1' || currentRoom.name.includes('01')) return 'Room 01';
        if (currentRoom.id === 'room-2' || currentRoom.name.includes('02')) return 'Room 02';
        return 'Room';
    }, [currentRoom]);

    const handleSlotClick = (slot: TimelineSlot) => {
        if (slot.status !== 'available') return;
        if (onSelectTimeSlot) {
            playPs5SelectSound();
            onSelectTimeSlot(slot.hour12, slot.minute, slot.period);
        }
    };

    return (
        <div className="w-full space-y-3" dir="rtl">
            {/* 1. Top Status Legend Bar */}
            <div className="flex items-center justify-around sm:justify-center sm:gap-10 py-2.5 px-4 rounded-2xl bg-neutral-900/90 dark:bg-[#151013] border border-neutral-800/90 dark:border-white/[0.08] shadow-inner text-xs font-bold select-none">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.85)] animate-pulse" />
                    <span className="text-neutral-200 dark:text-neutral-100">متاح</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.85)]" />
                    <span className="text-neutral-200 dark:text-neutral-100">محجوز</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-neutral-600 dark:bg-neutral-700" />
                    <span className="text-neutral-400">غير متاح</span>
                </div>
            </div>

            {/* 2. Collapsible Schedule Card */}
            <div className="rounded-2xl bg-neutral-950/95 dark:bg-[#120d10] border border-neutral-800/90 dark:border-white/[0.08] overflow-hidden shadow-xl transition-all">
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
                                    stats.booked > 0
                                        ? 'bg-red-500/15 text-red-400 border-red-500/30 font-bold'
                                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                }`}>
                                    {stats.booked > 0 ? `${stats.booked} أوقات محجوزة` : 'متاح بالكامل'}
                                </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 hidden sm:block mt-0.5">
                                خريطة زمنية مرئية لكافة ساعات العمل وحالة الحجوزات اليومية
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

                                        {/* Multi-Room Switcher Tabs (if available) */}
                                        {availableRooms.length > 1 && onSelectRoom && (
                                            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-xs">
                                                {availableRooms.map((room) => {
                                                    const isCurrent = room.id === currentRoom.id;
                                                    return (
                                                        <button
                                                            key={room.id}
                                                            type="button"
                                                            onClick={() => {
                                                                onSelectRoom(room.id);
                                                                playPs5NavigateSound();
                                                            }}
                                                            className={`px-2 sm:px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] cursor-pointer ${
                                                                isCurrent
                                                                    ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                                                    : 'text-neutral-400 hover:text-neutral-200'
                                                            }`}
                                                        >
                                                            {room.nameEn || room.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* The Horizontal Timeline Track of 40 Rounded Pills */}
                                    <div className="space-y-1.5">
                                        <div
                                            className="flex items-center gap-[2px] sm:gap-[3px] p-1.5 sm:p-2 bg-black/60 dark:bg-black/80 rounded-xl border border-white/[0.06] overflow-x-auto select-none"
                                            dir="ltr"
                                        >
                                            {slots.map((slot) => {
                                                const isAvailable = slot.status === 'available';
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
                                                        disabled={!isAvailable}
                                                        title={`${slot.rangeLabel} - ${
                                                            isAvailable ? 'متاح للحجز' : isBooked ? 'محجوز' : 'غير متاح'
                                                        }`}
                                                        className={`flex-1 min-w-[5px] sm:min-w-[6px] h-7 sm:h-8 rounded-[3px] sm:rounded-sm transition-all duration-150 relative outline-none ${
                                                            isPast
                                                                ? 'bg-neutral-800/90 border border-neutral-700/40 opacity-40 cursor-not-allowed'
                                                                : isBooked
                                                                ? 'bg-red-600 border border-red-500/60 shadow-[0_0_6px_rgba(239,68,68,0.45)] cursor-not-allowed hover:opacity-90'
                                                                : slot.isSelected
                                                                ? 'bg-emerald-400 border-2 border-white shadow-[0_0_12px_rgba(16,185,129,0.9)] scale-110 z-10 animate-pulse'
                                                                : 'bg-emerald-500 hover:bg-emerald-400 border border-emerald-400/40 shadow-[0_0_5px_rgba(16,185,129,0.3)] hover:scale-115 active:scale-95 cursor-pointer z-0'
                                                        }`}
                                                    />
                                                );
                                            })}
                                        </div>

                                        {/* Status / Hover Bar Info */}
                                        <div className="min-h-[32px] flex items-center justify-between px-2 py-1 rounded-xl bg-black/40 border border-white/[0.04] text-xs">
                                            {hoveredSlot ? (
                                                <div className="flex items-center gap-2 font-mono">
                                                    <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                                    <span className="font-bold text-white">
                                                        {hoveredSlot.rangeLabel}
                                                    </span>
                                                    <span className="text-neutral-500">•</span>
                                                    {hoveredSlot.status === 'available' && (
                                                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>متاح للحجز (انقر لاختيار هذا الوقت)</span>
                                                        </span>
                                                    )}
                                                    {hoveredSlot.status === 'booked' && (
                                                        <span className="inline-flex items-center gap-1 text-red-400 font-bold">
                                                            <Lock className="w-3.5 h-3.5" />
                                                            <span>محجوز مسبقاً</span>
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
                                                        انقر على أي خانة <strong className="text-emerald-400">خضراء</strong> لتحديد وقت البدء تلقائياً، أو راجع الخانات <strong className="text-red-400">الحمراء</strong> لتجنب المواعيد المحجوزة.
                                                    </span>
                                                </div>
                                            )}

                                            <div className="text-[11px] font-mono text-neutral-400 shrink-0 hidden sm:block">
                                                {stats.available} فترة متاحة
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
