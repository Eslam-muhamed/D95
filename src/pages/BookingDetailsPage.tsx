import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Calendar,
    Clock,
    Lock,
    Sun,
    Moon,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    Check,
    ShoppingBag,
    Coffee,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    X,
    Gamepad2,
    Timer,
} from 'lucide-react';
import { toast } from 'sonner';

import room01InteriorImg from '@/assets/doors/room-01-interior.jpg';
import room02InteriorImg from '@/assets/doors/room-02-interior.jpg';
import { useTheme } from '@/stores/themeStore';
import { useCart } from '@/stores/cartStore';
import { getItemUnitPrice } from '@/lib/cartUtils';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';
import {
    BookingInterval,
    createDateTimeFromBusinessDate,
    calculateEndDateTime,
    getBusinessOperatingWindow,
    checkAvailability,
    generateStartTimeOptions,
    TimeOption,
    OPERATING_HOURS,
    formatArabicTime,
} from '@/lib/bookingDatetime';
import { fetchRoomOccupiedIntervals } from '@/services/bookingService';

interface Room {
    id: string;
    name: string;
    nameEn: string;
    titleAr: string;
    rate: number;
    specs: string;
    interiorImg: string;
}

interface DaySegment {
    type: 'available' | 'occupied';
    start: Date;
    end: Date;
    durationHours: number;
}

const AVAILABLE_ROOMS: Room[] = [
    {
        id: 'room-1',
        name: 'غرفة 01 (Play Room)',
        nameEn: 'ROOM 01',
        titleAr: 'غرفة 01 • The Arena',
        rate: 100,
        specs: 'شاشة 65 بوصة 4K • 4 دراعات PS5 • ساوند بار سينمائي',
        interiorImg: room01InteriorImg,
    },
    {
        id: 'room-2',
        name: 'غرفة 02 (Play Room)',
        nameEn: 'ROOM 02',
        titleAr: 'غرفة 02 • VIP Suite',
        rate: 100,
        specs: 'شاشة 65 بوصة 4K • 4 دراعات PS5 • سقف نجوم وعزل تام',
        interiorImg: room02InteriorImg,
    },
];

const DURATION_OPTIONS = [
    { value: 1, label: '1 h' },
    { value: 2, label: '2 h' },
    { value: 3, label: '3 h' },
    { value: 4, label: '4 h' },
    { value: 5, label: '5 h' },
    { value: 6, label: '6 h' },
];

function formatDurationLabel(hours: number | null): string {
    if (hours === null) return 'اختر المدة';
    return `${hours} h`;
}

const ARABIC_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const ARABIC_DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const WEEK_DAY_NAMES = ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];

// Helper: Format Arabic time clearly (e.g. "06:00 مساءً" or "01:30 صباحاً")
function formatArabicTimeDetailed(date: Date): string {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const period = hour >= 12 && hour < 24 ? 'مساءً' : 'صباحاً';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${String(h12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

const HOUR_WHEEL_ITEMS = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: String(i + 1).padStart(2, '0'),
}));

const MINUTE_WHEEL_ITEMS = Array.from({ length: 60 }, (_, i) => ({
    value: i,
    label: String(i).padStart(2, '0'),
}));

const PERIOD_WHEEL_ITEMS: { value: 'PM' | 'AM'; label: string }[] = [
    { value: 'PM', label: 'مساءً' },
    { value: 'AM', label: 'صباحاً' },
];

function DrumWheelColumn<T extends string | number>({
    items,
    selectedValue,
    onSelect,
    title,
    itemHeight = 38,
    visibleRows = 3,
}: {
    items: { value: T; label: string }[];
    selectedValue: T;
    onSelect: (val: T) => void;
    title: string;
    itemHeight?: number;
    visibleRows?: number;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const isUserScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const centerIndex = Math.floor(visibleRows / 2);
    const paddingHeight = centerIndex * itemHeight;

    const selectedIndex = items.findIndex((item) => item.value === selectedValue);

    useEffect(() => {
        if (isUserScrollingRef.current) return;
        if (selectedIndex >= 0 && scrollRef.current) {
            const targetScroll = selectedIndex * itemHeight;
            if (Math.abs(scrollRef.current.scrollTop - targetScroll) > 2) {
                scrollRef.current.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth',
                });
            }
        }
    }, [selectedIndex, itemHeight]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        isUserScrollingRef.current = true;
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

        const currentScroll = e.currentTarget.scrollTop;
        const index = Math.round(currentScroll / itemHeight);

        if (index >= 0 && index < items.length) {
            const item = items[index];
            if (item && item.value !== selectedValue) {
                onSelect(item.value);
            }
        }

        scrollTimeoutRef.current = setTimeout(() => {
            isUserScrollingRef.current = false;
        }, 150);
    };

    const handleStep = (direction: -1 | 1) => {
        if (items.length === 0) return;
        const nextIndex = (selectedIndex + direction + items.length) % items.length;
        onSelect(items[nextIndex].value);
    };

    return (
        <div className="flex-1 flex flex-col items-center min-w-0">
            <span className="text-[11px] font-bold text-neutral-400 mb-0.5 select-none">{title}</span>
            <button
                type="button"
                onClick={() => handleStep(-1)}
                className="w-full py-0.5 flex items-center justify-center text-neutral-500 hover:text-white transition-colors cursor-pointer"
                title="السابق"
            >
                <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="w-full relative overflow-y-auto scrollbar-none snap-y snap-mandatory select-none touch-pan-y"
                style={{
                    height: `${itemHeight * visibleRows}px`,
                }}
            >
                <div style={{ height: `${paddingHeight}px` }} />
                {items.map((item, idx) => {
                    const isSelected = item.value === selectedValue;
                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => {
                                onSelect(item.value);
                                scrollRef.current?.scrollTo({
                                    top: idx * itemHeight,
                                    behavior: 'smooth',
                                });
                            }}
                            style={{ height: `${itemHeight}px` }}
                            className={`w-full flex items-center justify-center snap-center cursor-pointer transition-all duration-150 font-mono text-center outline-none ${
                                isSelected
                                    ? 'text-white text-lg sm:text-xl font-black scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                                    : 'text-neutral-500 hover:text-neutral-300 text-xs sm:text-sm font-medium'
                            }`}
                        >
                            {item.label}
                        </button>
                    );
                })}
                <div style={{ height: `${paddingHeight}px` }} />
            </div>
            <button
                type="button"
                onClick={() => handleStep(1)}
                className="w-full py-0.5 flex items-center justify-center text-neutral-500 hover:text-white transition-colors cursor-pointer"
                title="التالي"
            >
                <ChevronDown className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

interface DayVisualTimelineProps {
    selectedDate: string;
    sortedBookings: BookingInterval[];
    dayScheduleSegments: DaySegment[];
    startDateTime: Date | null;
    endDateTime: Date | null;
    isAvailable: boolean;
    onSelectTime: (hour12: number, minute: number, period: 'AM' | 'PM') => void;
}

function DayVisualTimeline({
    selectedDate,
    sortedBookings,
    dayScheduleSegments,
    startDateTime,
    endDateTime,
    isAvailable,
    onSelectTime,
}: DayVisualTimelineProps) {
    const [viewMode, setViewMode] = useState<'evening' | 'morning' | 'full'>('evening');

    // Automatically sync view mode if selection is outside
    useEffect(() => {
        if (!startDateTime) return;
        const h24 = startDateTime.getHours();
        if (h24 >= 8 && h24 < 17 && viewMode === 'evening') {
            setViewMode('morning');
        } else if ((h24 >= 17 || h24 < 4) && viewMode === 'morning') {
            setViewMode('evening');
        }
    }, [startDateTime, viewMode]);

    const { windowStart, windowEnd, ticks } = useMemo(() => {
        if (viewMode === 'evening') {
            const start = createDateTimeFromBusinessDate(selectedDate, '17:00');
            const end = createDateTimeFromBusinessDate(selectedDate, '04:00');
            return {
                windowStart: start,
                windowEnd: end,
                ticks: [
                    { label: '05:00 م', pct: 0 },
                    { label: '07:00 م', pct: 18.18 },
                    { label: '09:00 م', pct: 36.36 },
                    { label: '11:00 م', pct: 54.54 },
                    { label: '01:00 ص', pct: 72.72 },
                    { label: '03:00 ص', pct: 90.9 },
                    { label: '04:00 ص', pct: 100 },
                ],
            };
        } else if (viewMode === 'morning') {
            const start = createDateTimeFromBusinessDate(selectedDate, '08:00');
            const end = createDateTimeFromBusinessDate(selectedDate, '17:00');
            return {
                windowStart: start,
                windowEnd: end,
                ticks: [
                    { label: '08:00 ص', pct: 0 },
                    { label: '10:00 ص', pct: 22.22 },
                    { label: '12:00 ظ', pct: 44.44 },
                    { label: '02:00 م', pct: 66.66 },
                    { label: '04:00 م', pct: 88.88 },
                    { label: '05:00 م', pct: 100 },
                ],
            };
        } else {
            const start = createDateTimeFromBusinessDate(selectedDate, '08:00');
            const end = createDateTimeFromBusinessDate(selectedDate, '04:00');
            return {
                windowStart: start,
                windowEnd: end,
                ticks: [
                    { label: '08:00 ص', pct: 0 },
                    { label: '12:00 ظ', pct: 20 },
                    { label: '04:00 م', pct: 40 },
                    { label: '08:00 م', pct: 60 },
                    { label: '12:00 ص', pct: 80 },
                    { label: '04:00 ص', pct: 100 },
                ],
            };
        }
    }, [selectedDate, viewMode]);

    const totalWindowMs = windowEnd.getTime() - windowStart.getTime();

    // Visible bookings within active window
    const visibleBookings = useMemo(() => {
        const wStartMs = windowStart.getTime();
        const wEndMs = windowEnd.getTime();
        return sortedBookings
            .filter((b) => b.end.getTime() > wStartMs && b.start.getTime() < wEndMs)
            .map((b) => {
                const bStartMs = Math.max(wStartMs, b.start.getTime());
                const bEndMs = Math.min(wEndMs, b.end.getTime());
                const left = ((bStartMs - wStartMs) / totalWindowMs) * 100;
                const width = Math.max(2, ((bEndMs - bStartMs) / totalWindowMs) * 100);
                return {
                    id: b.id || `${b.start.getTime()}`,
                    start: b.start,
                    end: b.end,
                    left,
                    width,
                    timeLabel: `${formatArabicTimeDetailed(b.start)} - ${formatArabicTimeDetailed(b.end)}`,
                };
            });
    }, [sortedBookings, windowStart, windowEnd, totalWindowMs]);

    // User selection overlay
    const selectionOverlay = useMemo(() => {
        if (!startDateTime || !endDateTime) return null;
        const wStartMs = windowStart.getTime();
        const wEndMs = windowEnd.getTime();
        const sStartMs = startDateTime.getTime();
        const sEndMs = endDateTime.getTime();

        if (sEndMs <= wStartMs || sStartMs >= wEndMs) return null;

        const clampedStart = Math.max(wStartMs, sStartMs);
        const clampedEnd = Math.min(wEndMs, sEndMs);
        const left = ((clampedStart - wStartMs) / totalWindowMs) * 100;
        const width = Math.max(2.5, ((clampedEnd - clampedStart) / totalWindowMs) * 100);

        return {
            left,
            width,
            formattedStart: formatArabicTimeDetailed(startDateTime),
            formattedEnd: formatArabicTimeDetailed(endDateTime),
        };
    }, [startDateTime, endDateTime, windowStart, windowEnd, totalWindowMs]);

    // Click track to pick time
    const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, clickX / rect.width));
        const targetMs = windowStart.getTime() + ratio * totalWindowMs;
        const targetDate = new Date(targetMs);

        const rawMin = targetDate.getMinutes();
        const snappedMin = Math.round(rawMin / 15) * 15;
        if (snappedMin === 60) {
            targetDate.setHours(targetDate.getHours() + 1);
            targetDate.setMinutes(0);
        } else {
            targetDate.setMinutes(snappedMin);
        }

        const h24 = targetDate.getHours();
        const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
        const period: 'AM' | 'PM' = h24 >= 12 && h24 < 24 ? 'PM' : 'AM';
        onSelectTime(h12, targetDate.getMinutes(), period);
        playPs5SelectSound();
    };

    // Quick available chips
    const availableChips = useMemo(() => {
        return dayScheduleSegments
            .filter((seg) => seg.type === 'available' && seg.durationHours >= 1)
            .map((seg) => ({
                start: seg.start,
                end: seg.end,
                duration: seg.durationHours,
                label: `${formatArabicTimeDetailed(seg.start)} إلى ${formatArabicTimeDetailed(seg.end)}`,
                hour12: seg.start.getHours() % 12 === 0 ? 12 : seg.start.getHours() % 12,
                minute: seg.start.getMinutes(),
                period: (seg.start.getHours() >= 12 && seg.start.getHours() < 24 ? 'PM' : 'AM') as 'AM' | 'PM',
            }));
    }, [dayScheduleSegments]);

    return (
        <div className="space-y-3 p-3 sm:p-4 rounded-2xl bg-neutral-950 dark:bg-[#150f11] border border-neutral-800 dark:border-white/10 shadow-md">
            {/* Timeline Header & Period Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                        <span>خريطة الحجوزات والمواعيد الحية</span>
                        <span className="text-[10px] text-neutral-400 font-normal hidden sm:inline">(نظرة بصرية مباشرة للمحجوز والمتاح)</span>
                    </span>
                </div>

                {/* Switcher Buttons: المساء / الصباح / اليوم كامل */}
                <div className="flex items-center p-0.5 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] font-bold">
                    <button
                        type="button"
                        onClick={() => {
                            setViewMode('evening');
                            playPs5NavigateSound();
                        }}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            viewMode === 'evening'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'text-neutral-400 hover:text-white'
                        }`}
                    >
                        🌙 المساء والسهرة
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setViewMode('morning');
                            playPs5NavigateSound();
                        }}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            viewMode === 'morning'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'text-neutral-400 hover:text-white'
                        }`}
                    >
                        ☀️ الصباح والظهيرة
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setViewMode('full');
                            playPs5NavigateSound();
                        }}
                        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                            viewMode === 'full'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'text-neutral-400 hover:text-white'
                        }`}
                        title="عرض كامل الـ 20 ساعة"
                    >
                        ⚡ 24س
                    </button>
                </div>
            </div>

            {/* Interactive Timeline Track (Clickable to select time) */}
            <div className="space-y-1.5" dir="ltr">
                <div
                    onClick={handleTrackClick}
                    className="relative w-full h-11 sm:h-12 rounded-xl bg-[#0a0708] border border-neutral-800 overflow-hidden cursor-pointer group shadow-inner"
                    title="اضغط على أي وقت في الشريط لضبط وقت البدء فوراً"
                >
                    {/* Background Grid Ticks */}
                    {ticks.map((tick, i) => (
                        <div
                            key={i}
                            className="absolute top-0 bottom-0 border-r border-neutral-800/80 pointer-events-none"
                            style={{ left: `${tick.pct}%` }}
                        />
                    ))}

                    {/* Occupied Booked Blocks (Red with Stripes) */}
                    {visibleBookings.map((b) => (
                        <div
                            key={b.id}
                            style={{ left: `${b.left}%`, width: `${b.width}%` }}
                            className="absolute top-1 bottom-1 rounded-lg bg-red-600/40 border border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.4)] flex items-center justify-center overflow-hidden z-10 pointer-events-none"
                            title={`محجوز: ${b.timeLabel}`}
                        >
                            <div className="flex items-center gap-1 px-1 text-[10px] font-mono font-bold text-red-200 truncate">
                                <Lock className="w-3 h-3 text-red-400 shrink-0" />
                                <span className="hidden sm:inline">محجوز</span>
                            </div>
                        </div>
                    ))}

                    {/* Selected User Reservation Highlight (Green if available, Red if conflict) */}
                    {selectionOverlay && (
                        <div
                            style={{ left: `${selectionOverlay.left}%`, width: `${selectionOverlay.width}%` }}
                            className={`absolute top-0.5 bottom-0.5 rounded-lg transition-all duration-150 z-20 pointer-events-none flex items-center justify-center overflow-hidden ${
                                isAvailable
                                    ? 'border-2 border-emerald-400 bg-emerald-500/30 shadow-[0_0_18px_rgba(16,185,129,0.7)] text-emerald-200'
                                    : 'border-2 border-red-500 bg-red-600/50 shadow-[0_0_18px_rgba(239,68,68,0.9)] text-red-100 animate-pulse'
                            }`}
                        >
                            <div className="flex items-center gap-1 px-1.5 text-[10px] sm:text-xs font-mono font-black truncate">
                                {isAvailable ? (
                                    <>
                                        <Sparkles className="w-3 h-3 text-emerald-300 shrink-0" />
                                        <span>حجزك المختار</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-3 h-3 text-red-200 shrink-0" />
                                        <span>تعارض مع حجز!</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Timeline Hours Ticks along the bottom */}
                <div className="relative flex justify-between text-[10px] sm:text-[11px] font-mono font-medium text-neutral-400 select-none px-0.5">
                    {ticks.map((tick, i) => (
                        <span key={i} className="transform -translate-x-1/2 first:translate-x-0 last:translate-x-0">
                            {tick.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Quick-Glance Summary Badges (متاح ومحجوز بنظرة واحدة) */}
            <div className="pt-2 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                {/* Available Slots Chips (Click to pick) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>فترات متاحة:</span>
                    </span>
                    {availableChips.length > 0 ? (
                        availableChips.map((chip, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                    onSelectTime(chip.hour12, chip.minute, chip.period);
                                    playPs5SelectSound();
                                }}
                                className="px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                                title="اضغط لضبط العداد فوراً على هذا الموعد"
                            >
                                <span>{chip.label}</span>
                                <span className="text-[9px] opacity-75 font-sans">({chip.duration}س)</span>
                            </button>
                        ))
                    ) : (
                        <span className="text-neutral-500 text-[11px]">لا توجد فترات متاحة متبقية</span>
                    )}
                </div>

                {/* Booked Slots Legend */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <span className="text-[11px] font-bold text-red-400 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>المحجوز:</span>
                    </span>
                    {sortedBookings.length > 0 ? (
                        sortedBookings.map((b, idx) => (
                            <span
                                key={idx}
                                className="px-2 py-0.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 font-mono text-[11px] font-semibold"
                            >
                                {formatArabicTimeDetailed(b.start)} - {formatArabicTimeDetailed(b.end)}
                            </span>
                        ))
                    ) : (
                        <span className="text-emerald-400 text-[11px] font-medium">الغرفة خالية بالكامل اليوم ✨</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function BookingDetailsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { items: cartItems, booking: cartBooking, cafeTotal, setBooking, openCart, itemCount } = useCart();

    // Initial room fallback from navigation state
    const initialRoom = location.state?.room || { name: 'غرفة 01 (Play Room)' };
    const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
        if (initialRoom.id) {
            if (initialRoom.id === 'room-2' || initialRoom.id.includes('02') || initialRoom.id.includes('stars')) return 'room-2';
            return 'room-1';
        }
        if (initialRoom.name && (initialRoom.name.includes('02') || initialRoom.name.includes('النجوم') || initialRoom.name.includes('VIP'))) return 'room-2';
        return 'room-1';
    });

    const [isRoomMenuOpen, setIsRoomMenuOpen] = useState(false);
    const roomMenuRef = useRef<HTMLDivElement>(null);

    // Close room dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (roomMenuRef.current && !roomMenuRef.current.contains(e.target as Node)) {
                setIsRoomMenuOpen(false);
            }
        };
        if (isRoomMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isRoomMenuOpen]);

    const currentRoom = useMemo(() => {
        return AVAILABLE_ROOMS.find((r) => r.id === selectedRoomId) || AVAILABLE_ROOMS[0];
    }, [selectedRoomId]);

    // Calendar state & ref: compact date picker
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(() => new Date());
    const calendarMenuRef = useRef<HTMLDivElement>(null);

    // Close calendar popover on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (calendarMenuRef.current && !calendarMenuRef.current.contains(e.target as Node)) {
                setIsCalendarOpen(false);
            }
        };
        if (isCalendarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isCalendarOpen]);

    // Duration dropdown state & ref
    const [isDurationMenuOpen, setIsDurationMenuOpen] = useState(false);
    const durationMenuRef = useRef<HTMLDivElement>(null);

    // Close duration dropdown on click outside
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

    // Booked appointments dropdown state & ref
    const [isBookedMenuOpen, setIsBookedMenuOpen] = useState(false);
    const bookedMenuRef = useRef<HTMLDivElement>(null);

    // Close booked dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (bookedMenuRef.current && !bookedMenuRef.current.contains(e.target as Node)) {
                setIsBookedMenuOpen(false);
            }
        };
        if (isBookedMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isBookedMenuOpen]);

    const getTodayIso = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const [selectedDate, setSelectedDate] = useState(getTodayIso);

    // Quick select shortcuts (اليوم، غداً، بعد غد)
    const quickShortcuts = useMemo(() => {
        const shortcuts = [];
        const now = new Date();
        for (let i = 0; i < 3; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const label = i === 0 ? 'اليوم' : i === 1 ? 'غداً' : 'بعد غد';
            shortcuts.push({
                iso,
                label,
                dayNumber: d.getDate(),
                monthName: ARABIC_MONTHS[d.getMonth()],
            });
        }
        return shortcuts;
    }, []);

    // Formatted selected date for display
    const formattedDate = useMemo(() => {
        const [y, m, d] = selectedDate.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(y, m - 1, d);
        target.setHours(0, 0, 0, 0);

        const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const dayName = ARABIC_DAY_NAMES[date.getDay()];
        const monthName = ARABIC_MONTHS[m - 1];

        if (diffDays === 0) {
            return { tag: 'اليوم', full: `اليوم، ${d} ${monthName}`, dayName, d, monthName };
        }
        if (diffDays === 1) {
            return { tag: 'غداً', full: `غداً، ${d} ${monthName}`, dayName, d, monthName };
        }
        return { tag: dayName, full: `${dayName}، ${d} ${monthName}`, dayName, d, monthName };
    }, [selectedDate]);

    // Month grid generator for custom calendar popup
    const monthDaysGrid = useMemo(() => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
        // Week starts Saturday:
        const emptyCount = (firstDayOfWeek + 1) % 7;
        const totalDays = new Date(year, month + 1, 0).getDate();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const cells: Array<{
            iso: string;
            dayNumber: number;
            isPast: boolean;
            isToday: boolean;
        } | null> = [];

        for (let i = 0; i < emptyCount; i++) {
            cells.push(null);
        }

        for (let d = 1; d <= totalDays; d++) {
            const cellDate = new Date(year, month, d);
            cellDate.setHours(0, 0, 0, 0);
            const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            cells.push({
                iso,
                dayNumber: d,
                isPast: cellDate.getTime() < today.getTime(),
                isToday: cellDate.getTime() === today.getTime(),
            });
        }

        return cells;
    }, [calendarMonth]);

    const canGoPrevMonth = useMemo(() => {
        const today = new Date();
        return (
            calendarMonth.getFullYear() > today.getFullYear() ||
            (calendarMonth.getFullYear() === today.getFullYear() && calendarMonth.getMonth() > today.getMonth())
        );
    }, [calendarMonth]);

    const toggleCalendar = () => {
        const [y, m] = selectedDate.split('-').map(Number);
        setCalendarMonth(new Date(y, m - 1, 1));
        setIsCalendarOpen((prev) => !prev);
        setIsDurationMenuOpen(false);
        setIsBookedMenuOpen(false);
        playPs5NavigateSound();
    };

    // =========================================================================
    // MOBILE-FIRST STATE: Free, non-forced initial selection
    // =========================================================================
    const [durationHours, setDurationHours] = useState<number>(2);
    const [selectedHour, setSelectedHour] = useState<number>(() => {
        const now = new Date();
        const h = now.getHours();
        if (h >= 4 && h < 17) return 6;
        const nextH = (h + 1) % 24;
        return nextH % 12 === 0 ? 12 : nextH % 12;
    });
    const [selectedMinute, setSelectedMinute] = useState<number>(0);
    const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(() => {
        const now = new Date();
        const h = now.getHours();
        if (h >= 4 && h < 17) return 'PM';
        const nextH = (h + 1) % 24;
        return nextH >= 12 && nextH < 24 ? 'PM' : 'AM';
    });

    const [occupiedIntervals, setOccupiedIntervals] = useState<BookingInterval[]>([]);
    const [loadingIntervals, setLoadingIntervals] = useState<boolean>(false);

    const hasSelectedTime = selectedHour !== null && selectedMinute !== null && selectedPeriod !== null;
    const hasSelectedDuration = durationHours !== null;

    // Convert picker selection into 24-hour time string
    const time24 = useMemo(() => {
        if (!hasSelectedTime) return null;
        let h24 = selectedHour;
        if (selectedPeriod === 'PM' && selectedHour < 12) h24 += 12;
        if (selectedPeriod === 'AM' && selectedHour === 12) h24 = 0;
        return `${String(h24).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    }, [hasSelectedTime, selectedHour, selectedMinute, selectedPeriod]);

    // Construct start datetime
    const startDateTime = useMemo(() => {
        if (!time24) return null;
        return createDateTimeFromBusinessDate(selectedDate, time24);
    }, [selectedDate, time24]);

    // Fetch occupied intervals from database
    const loadOccupiedIntervals = useCallback(async () => {
        setLoadingIntervals(true);
        try {
            const { opening, closing } = getBusinessOperatingWindow(selectedDate);
            const intervals = await fetchRoomOccupiedIntervals(currentRoom.id, selectedDate, opening, closing);
            setOccupiedIntervals(intervals);
        } catch (err) {
            console.error('Failed to load room occupied intervals:', err);
        } finally {
            setLoadingIntervals(false);
        }
    }, [currentRoom.id, selectedDate]);

    useEffect(() => {
        loadOccupiedIntervals();
    }, [loadOccupiedIntervals]);

    // Combine database occupied intervals with current cart booking (if in same room and date)
    const effectiveOccupiedIntervals = useMemo<BookingInterval[]>(() => {
        const intervals = [...occupiedIntervals];
        if (
            cartBooking &&
            cartBooking.roomId === currentRoom.id &&
            cartBooking.date === selectedDate
        ) {
            let start: Date | null = null;
            let end: Date | null = null;
            if (cartBooking.startDateTime && cartBooking.endDateTime) {
                start = new Date(cartBooking.startDateTime);
                end = new Date(cartBooking.endDateTime);
            } else if (cartBooking.startTime) {
                start = createDateTimeFromBusinessDate(cartBooking.date, cartBooking.startTime);
                end = calculateEndDateTime(start, cartBooking.durationHours || 1);
            }
            if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const alreadyExists = intervals.some(
                    inv => Math.abs(inv.start.getTime() - start!.getTime()) < 60000 &&
                           Math.abs(inv.end.getTime() - end!.getTime()) < 60000
                );
                if (!alreadyExists) {
                    intervals.push({ start, end, status: 'in_cart', id: 'cart-booking' });
                }
            }
        }
        return intervals;
    }, [occupiedIntervals, cartBooking, currentRoom.id, selectedDate]);

    // Sorted active booked intervals (blocking)
    const sortedBookings = useMemo(() => {
        return [...effectiveOccupiedIntervals].sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [effectiveOccupiedIntervals]);

    const activeDuration = durationHours || 1.0;

    const handleSetTime = (hour12: number, minute: number, period: 'AM' | 'PM') => {
        setSelectedHour(hour12);
        setSelectedMinute(minute);
        setSelectedPeriod(period);
        playPs5SelectSound();
    };

    // =========================================================================
    // MOBILE EXPERIENCE: Dynamic calculation of all Free vs Occupied segments
    // =========================================================================
    const dayScheduleSegments = useMemo<DaySegment[]>(() => {
        const { opening, closing } = getBusinessOperatingWindow(selectedDate);
        if (sortedBookings.length === 0) {
            const diffHours = (closing.getTime() - opening.getTime()) / (3600 * 1000);
            return [{ type: 'available', start: opening, end: closing, durationHours: diffHours }];
        }

        const segments: DaySegment[] = [];
        let currentPointer = opening.getTime();

        for (const b of sortedBookings) {
            const bStart = Math.max(opening.getTime(), b.start.getTime());
            const bEnd = Math.min(closing.getTime(), b.end.getTime());

            // Free gap before this booking
            if (bStart > currentPointer) {
                const gapHours = Math.round(((bStart - currentPointer) / (3600 * 1000)) * 10) / 10;
                if (gapHours > 0) {
                    segments.push({
                        type: 'available',
                        start: new Date(currentPointer),
                        end: new Date(bStart),
                        durationHours: gapHours,
                    });
                }
            }

            // The occupied booking
            const occHours = Math.round(((bEnd - bStart) / (3600 * 1000)) * 10) / 10;
            segments.push({
                type: 'occupied',
                start: new Date(bStart),
                end: new Date(bEnd),
                durationHours: occHours,
            });

            currentPointer = Math.max(currentPointer, bEnd);
        }

        // Free gap after last booking until closing
        if (currentPointer < closing.getTime()) {
            const remainingHours = Math.round(((closing.getTime() - currentPointer) / (3600 * 1000)) * 10) / 10;
            if (remainingHours > 0) {
                segments.push({
                    type: 'available',
                    start: new Date(currentPointer),
                    end: closing,
                    durationHours: remainingHours,
                });
            }
        }

        return segments;
    }, [selectedDate, sortedBookings]);


    // Real-time availability evaluation
    const currentAvailability = useMemo(() => {
        if (!startDateTime || durationHours === null) {
            return {
                isAvailable: false,
                reason: 'NOT_SELECTED',
                conflictingInterval: undefined as BookingInterval | undefined,
                startDateTime: null,
                endDateTime: null,
                formattedStart: '--:--',
                formattedEnd: '--:--',
            };
        }

        const endDateTime = calculateEndDateTime(startDateTime, durationHours);
        const result = checkAvailability(
            startDateTime,
            durationHours,
            selectedDate,
            effectiveOccupiedIntervals
        );

        return {
            ...result,
            startDateTime,
            endDateTime,
            formattedStart: formatArabicTimeDetailed(startDateTime),
            formattedEnd: formatArabicTimeDetailed(endDateTime),
        };
    }, [startDateTime, durationHours, selectedDate, effectiveOccupiedIntervals]);

    const roomSubtotal = hasSelectedDuration ? Math.round((durationHours || 0) * currentRoom.rate) : 0;
    const isReadyToContinue = hasSelectedTime && hasSelectedDuration && currentAvailability.isAvailable;

    const handleAddToCart = () => {
        if (!hasSelectedTime || !hasSelectedDuration) {
            toast.info('يرجى تحديد وقت البدء ومدة الجلسة أولاً 🎮');
            return;
        }

        if (!isReadyToContinue) {
            if (currentAvailability.reason === 'PAST_TIME') {
                toast.error('هذا الوقت قد مضى، يرجى اختيار موعد قادم ⏳');
            } else if (currentAvailability.reason === 'EXCEEDS_CLOSING') {
                toast.error('الموعد مع المدة المحددة يتجاوز موعد إغلاق الصالة (04:00 ص) ⚠️');
            } else if (currentAvailability.reason === 'OVERLAP_CONFLICT') {
                const conf = 'conflictingInterval' in currentAvailability ? currentAvailability.conflictingInterval : undefined;
                const confMsg = conf
                    ? `يتعارض مع حجز قائم من ${formatArabicTimeDetailed(conf.start)} إلى ${formatArabicTimeDetailed(conf.end)} 🔒`
                    : 'هذا التوقيت يتعارض مع حجز قائم للغرفة 🔒';
                toast.error(confMsg);
            } else {
                toast.error('يرجى تحديد موعد متاح للجلسة 🎮');
            }
            return;
        }

        setBooking({
            roomId: currentRoom.id,
            roomName: currentRoom.name,
            roomNameEn: currentRoom.nameEn,
            date: selectedDate,
            startTime: currentAvailability.formattedStart,
            endTime: currentAvailability.formattedEnd,
            startDateTime: currentAvailability.startDateTime?.toISOString(),
            endDateTime: currentAvailability.endDateTime?.toISOString(),
            durationHours: durationHours || 1,
            rate: currentRoom.rate,
            subtotal: roomSubtotal,
        });

        playPs5SelectSound();
        toast.success(`تمت إضافة ${currentRoom.name} إلى السلة بنجاح! 🎮🛒`, {
            action: {
                label: 'عرض السلة',
                onClick: () => openCart('playstation'),
            },
        });
    };

    const handleContinue = () => {
        if (!hasSelectedTime || !hasSelectedDuration) {
            toast.info('يرجى تحديد وقت البدء ومدة الجلسة أولاً 🎮');
            return;
        }

        if (!isReadyToContinue) {
            if (currentAvailability.reason === 'PAST_TIME') {
                toast.error('هذا الوقت قد مضى، يرجى اختيار موعد قادم ⏳');
            } else if (currentAvailability.reason === 'EXCEEDS_CLOSING') {
                toast.error('الموعد مع المدة المحددة يتجاوز موعد إغلاق الصالة (04:00 ص) ⚠️');
            } else if (currentAvailability.reason === 'OVERLAP_CONFLICT') {
                const conf = currentAvailability.conflictingInterval;
                const confMsg = conf
                    ? `يتعارض مع حجز قائم من ${formatArabicTimeDetailed(conf.start)} إلى ${formatArabicTimeDetailed(conf.end)} 🔒`
                    : 'هذا التوقيت يتعارض مع حجز قائم للغرفة 🔒';
                toast.error(confMsg);
            } else {
                toast.error('يرجى تحديد موعد متاح للجلسة 🎮');
            }
            return;
        }

        playPs5SelectSound();
        navigate('/playstation/payment', {
            state: {
                room: {
                    id: currentRoom.id,
                    name: currentRoom.name,
                    nameEn: currentRoom.nameEn,
                    rate: currentRoom.rate,
                },
                date: selectedDate,
                startTime: currentAvailability.formattedStart,
                endTime: currentAvailability.formattedEnd,
                startDateTime: currentAvailability.startDateTime?.toISOString(),
                endDateTime: currentAvailability.endDateTime?.toISOString(),
                durationHours: durationHours || 1,
                roomSubtotal,
                snacks: cartItems.map(item => ({
                    id: item.id,
                    name: `${item.name}${item.customization.quantity > 1 ? ` × ${item.customization.quantity}` : ''}`,
                    price: getItemUnitPrice(item) * item.customization.quantity,
                    quantity: item.customization.quantity,
                })),
                snacksTotal: cafeTotal,
                total: roomSubtotal + cafeTotal,
            },
        });
    };

    return (
        <div className="min-h-screen w-full bg-[#f8f9fb] dark:bg-[#090708] text-neutral-900 dark:text-[#eae6e8] font-body text-sm flex flex-col selection:bg-red-600 selection:text-white relative select-none transition-colors duration-200">
            {/* Header */}
            <header className="sticky top-0 inset-x-0 z-50 bg-white/90 dark:bg-[#0c090a]/90 backdrop-blur-md border-b border-neutral-200 dark:border-white/[0.08] shadow-xs">
                <div className="h-16 px-4 sm:px-6 flex items-center justify-between max-w-2xl mx-auto">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <Link
                            to="/playstation"
                            aria-label="الرجوع للغرف"
                            className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-white transition-all active:scale-95 border border-neutral-200/80 dark:border-white/10 shrink-0"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white leading-tight">
                                حجز موعد اللعب
                            </h1>
                            {/* Room Indicator & Quick Switcher */}
                            <div className="relative mt-0.5" ref={roomMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsRoomMenuOpen((prev) => !prev)}
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600/10 dark:bg-red-600/15 border border-red-600/20 hover:border-red-600/40 text-red-600 dark:text-red-400 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                    title="اضغط لتغيير الغرفة"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <span>{currentRoom.titleAr}</span>
                                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-normal">({currentRoom.rate} ج.م/س)</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isRoomMenuOpen ? 'rotate-180 text-red-600' : 'text-neutral-400'}`} />
                                </button>

                                {isRoomMenuOpen && (
                                    <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-[#140e10] border border-neutral-200 dark:border-white/10 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                                        <div className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 px-2 py-1">
                                            اختر الغرفة المراد حجزها:
                                        </div>
                                        {AVAILABLE_ROOMS.map((room) => {
                                            const isSelected = selectedRoomId === room.id;
                                            return (
                                                <button
                                                    key={room.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedRoomId(room.id);
                                                        setIsRoomMenuOpen(false);
                                                        playPs5NavigateSound();
                                                    }}
                                                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-right text-xs transition-colors cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-red-600 text-white font-bold'
                                                            : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.06]'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
                                                        <span>{room.titleAr}</span>
                                                    </div>
                                                    <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                                                        {room.rate} ج.م/س
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => openCart('playstation')}
                            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-neutral-200/80 dark:border-white/10 text-neutral-800 dark:text-neutral-200"
                            aria-label="السلة"
                            title="عرض السلة"
                        >
                            <ShoppingBag size={16} />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                                    {itemCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={toggleTheme}
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-neutral-200/80 dark:border-white/10 text-neutral-800 dark:text-neutral-200"
                            aria-label="تبديل المظهر"
                        >
                            {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-neutral-800" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative z-10 w-full pt-4 pb-32 px-4 sm:px-6 max-w-2xl mx-auto space-y-4" dir="rtl">

                {/* ========================================================= */}
                {/* TIME & DURATION SELECTOR (EFFORTLESS ONE-TAP SLOTS)       */}
                {/* ========================================================= */}
                <div className="bg-white dark:bg-[#120e10] border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                    {/* Header with Title and Left-Corner Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2.5 border-b border-neutral-100 dark:border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-600 dark:text-red-500 shrink-0" />
                            <span className="font-bold text-sm text-neutral-900 dark:text-white">
                                وقت البدء ومدة الجلسة
                            </span>
                        </div>

                        {/* Controls Group: Mobile-First Prioritized (Order: 1. المدة, 2. اليوم, 3. المحجوز) */}
                        <div className="relative flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
                            {/* Mobile Overlay Backdrop for easy tap-outside */}
                            {(isDurationMenuOpen || isCalendarOpen || isBookedMenuOpen) && (
                                <div
                                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 sm:hidden"
                                    onClick={() => {
                                        setIsDurationMenuOpen(false);
                                        setIsCalendarOpen(false);
                                        setIsBookedMenuOpen(false);
                                    }}
                                />
                            )}

                            {/* 1. المدة: Duration Dropdown Button */}
                            <div className="relative flex-1 sm:flex-initial" ref={durationMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDurationMenuOpen(!isDurationMenuOpen);
                                        setIsCalendarOpen(false);
                                        setIsBookedMenuOpen(false);
                                        playPs5NavigateSound();
                                    }}
                                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer group shadow-2xs whitespace-nowrap ${
                                        hasSelectedDuration
                                            ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20'
                                            : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border-neutral-200/80 dark:border-white/10 text-neutral-800 dark:text-neutral-200'
                                    }`}
                                    title="اختر مدة الجلسة بالساعات"
                                >
                                    <Timer className="w-3.5 h-3.5 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform shrink-0" />
                                    <span className="text-red-600 dark:text-red-400 font-extrabold hidden sm:inline">المدة:</span>
                                    <span className="font-mono">{hasSelectedDuration ? formatDurationLabel(durationHours) : 'المدة'}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 shrink-0 ${isDurationMenuOpen ? 'rotate-180 text-red-600' : ''}`} />
                                </button>

                                {/* Duration Dropdown Popover */}
                                <AnimatePresence>
                                    {isDurationMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-full mt-2 w-48 p-1.5 bg-white dark:bg-[#181416] border border-neutral-200/90 dark:border-white/10 rounded-2xl shadow-2xl z-40 space-y-1"
                                        >
                                            <div className="px-2.5 py-1.5 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-white/[0.06] flex items-center justify-between">
                                                <span>اختر مدة الجلسة</span>
                                                <span className="font-mono">{currentRoom.rate} ج.م/س</span>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto space-y-0.5 pt-0.5">
                                                {DURATION_OPTIONS.map((opt) => {
                                                    const isSelected = durationHours === opt.value;
                                                    return (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            onClick={() => {
                                                                setDurationHours(opt.value);
                                                                setIsDurationMenuOpen(false);
                                                                playPs5SelectSound();
                                                            }}
                                                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                                isSelected
                                                                    ? 'bg-red-600 text-white shadow-xs'
                                                                    : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.06]'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : 'border border-neutral-300 dark:border-neutral-600'}`} />
                                                                <span className="font-mono font-bold text-xs">{opt.label}</span>
                                                            </div>
                                                            <span className={`font-mono text-[11px] font-bold shrink-0 ${isSelected ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'}`}>
                                                                {Math.round(opt.value * currentRoom.rate)} ج.م
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* 2. اليوم: Calendar Dropdown Button */}
                            <div className="relative flex-1 sm:flex-initial" ref={calendarMenuRef}>
                                <button
                                    type="button"
                                    onClick={toggleCalendar}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-neutral-200/80 dark:border-white/10 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-all active:scale-95 cursor-pointer group shadow-2xs whitespace-nowrap"
                                    title="اضغط لتغيير يوم الحجز"
                                >
                                    <Calendar className="w-3.5 h-3.5 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform shrink-0" />
                                    <span className="hidden sm:inline">{formattedDate.full}</span>
                                    <span className="sm:hidden">{formattedDate.tag}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 shrink-0 ${isCalendarOpen ? 'rotate-180 text-red-600' : ''}`} />
                                </button>

                                {/* Compact Calendar Popover */}
                                <AnimatePresence>
                                    {isCalendarOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] p-3 bg-white dark:bg-[#181416] border border-neutral-200/90 dark:border-white/10 rounded-2xl shadow-2xl z-40 space-y-2.5"
                                        >
                                            {/* Quick select shortcuts: اليوم، غداً، بعد غد */}
                                            <div className="flex items-center gap-1.5 justify-between">
                                                {quickShortcuts.slice(0, 3).map((sc) => {
                                                    const isSelected = selectedDate === sc.iso;
                                                    return (
                                                        <button
                                                            key={sc.iso}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedDate(sc.iso);
                                                                playPs5SelectSound();
                                                                setIsCalendarOpen(false);
                                                            }}
                                                            className={`flex-1 py-1.5 px-1 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                                                                isSelected
                                                                    ? 'bg-red-600 border-red-600 text-white shadow-xs'
                                                                    : 'bg-neutral-50 dark:bg-white/[0.04] border-neutral-200/70 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.08]'
                                                            }`}
                                                        >
                                                            {sc.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Month header & navigation */}
                                            <div className="flex items-center justify-between px-1 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (canGoPrevMonth) {
                                                            setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                                                            playPs5NavigateSound();
                                                        }
                                                    }}
                                                    disabled={!canGoPrevMonth}
                                                    className="p-1 rounded-lg border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                    title="الشهر السابق"
                                                >
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>

                                                <span className="font-bold text-neutral-900 dark:text-white">
                                                    {ARABIC_MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                                                        playPs5NavigateSound();
                                                    }}
                                                    className="p-1 rounded-lg border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                                                    title="الشهر القادم"
                                                >
                                                    <ChevronLeft className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Days of week header */}
                                            <div className="grid grid-cols-7 gap-1 text-center">
                                                {['سبت', 'أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع'].map((name, idx) => (
                                                    <div key={idx} className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 py-0.5">
                                                        {name}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Calendar Grid of Day Cells */}
                                            <div className="grid grid-cols-7 gap-1">
                                                {monthDaysGrid.map((cell, idx) => {
                                                    if (!cell) {
                                                        return <div key={`empty-${idx}`} className="h-7" />;
                                                    }
                                                    const isSelected = selectedDate === cell.iso;
                                                    return (
                                                        <button
                                                            key={cell.iso}
                                                            type="button"
                                                            disabled={cell.isPast}
                                                            onClick={() => {
                                                                setSelectedDate(cell.iso);
                                                                playPs5SelectSound();
                                                                setIsCalendarOpen(false);
                                                            }}
                                                            className={`h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                                                cell.isPast
                                                                    ? 'text-neutral-300 dark:text-neutral-600 opacity-40 cursor-not-allowed'
                                                                    : isSelected
                                                                    ? 'bg-red-600 text-white shadow-xs scale-105 z-10'
                                                                    : cell.isToday
                                                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20 cursor-pointer'
                                                                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.08] cursor-pointer'
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

                            {/* 3. المحجوز: Booked Appointments Dropdown */}
                            <div className="relative flex-1 sm:flex-initial" ref={bookedMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsBookedMenuOpen((prev) => !prev);
                                        setIsDurationMenuOpen(false);
                                        setIsCalendarOpen(false);
                                        playPs5NavigateSound();
                                    }}
                                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer group shadow-2xs whitespace-nowrap ${
                                        sortedBookings.length > 0
                                            ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20'
                                            : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-300'
                                    }`}
                                    title="المواعيد المحجوزة اليوم"
                                >
                                    <Lock className={`w-3.5 h-3.5 shrink-0 ${sortedBookings.length > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
                                    <span className="hidden sm:inline">المحجوز:</span>
                                    <span className={`font-mono text-[11px] px-1 rounded ${
                                        sortedBookings.length > 0 ? 'bg-red-500/20 text-red-600 dark:text-red-300 font-bold' : 'text-neutral-500'
                                    }`}>
                                        {sortedBookings.length}
                                    </span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 shrink-0 ${isBookedMenuOpen ? 'rotate-180 text-red-600' : ''}`} />
                                </button>

                                {/* Dropdown Popover */}
                                <AnimatePresence>
                                    {isBookedMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute left-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] p-2.5 bg-white dark:bg-[#181416] border border-neutral-200/90 dark:border-white/10 rounded-2xl shadow-2xl z-40 space-y-2"
                                        >
                                            <div className="flex items-center justify-between px-1 pb-1.5 border-b border-neutral-100 dark:border-white/[0.06]">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                                                    <Lock className="w-3.5 h-3.5 text-red-500" />
                                                    <span>المواعيد المحجوزة اليوم ({currentRoom.nameEn})</span>
                                                </div>
                                                <span className="text-[10px] text-neutral-400 font-medium">غير متاحة</span>
                                            </div>

                                            {sortedBookings.length > 0 ? (
                                                <div className="max-h-56 overflow-y-auto space-y-1.5 py-0.5">
                                                    {sortedBookings.map((b, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-red-200/60 dark:border-red-900/30 text-xs font-mono"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Lock className="w-3 h-3 text-red-500 shrink-0" />
                                                                <span className="font-semibold text-neutral-900 dark:text-white">
                                                                    {formatArabicTimeDetailed(b.start)}
                                                                </span>
                                                            </div>
                                                            <span className="text-neutral-400 text-[10px]">إلى</span>
                                                            <span className="font-semibold text-neutral-900 dark:text-white">
                                                                {formatArabicTimeDetailed(b.end)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs">
                                                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    <span>الغرفة متاحة بالكامل اليوم! لا توجد أي حجوزات مسبقة.</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* 1. VISUAL SCHEDULE TIMELINE (خريطة المواعيد والحجوزات الحية) */}
                    <DayVisualTimeline
                        selectedDate={selectedDate}
                        sortedBookings={sortedBookings}
                        dayScheduleSegments={dayScheduleSegments}
                        startDateTime={startDateTime}
                        endDateTime={currentAvailability.endDateTime}
                        isAvailable={currentAvailability.isAvailable}
                        onSelectTime={handleSetTime}
                    />

                    {/* 2. DURATION QUICK SELECTOR */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <Timer className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                حدد مدة الجلسة بالساعات:
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                            {DURATION_OPTIONS.map((opt) => {
                                const isSelected = durationHours === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            setDurationHours(opt.value);
                                            playPs5SelectSound();
                                        }}
                                        className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                                            isSelected
                                                ? 'bg-red-600 border-red-600 text-white shadow-xs scale-105'
                                                : 'bg-white dark:bg-white/[0.05] border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-red-500/40'
                                        }`}
                                    >
                                        {opt.label} ({Math.round(opt.value * currentRoom.rate)} ج.م)
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. TIME CONTROL CENTER: START COUNTER (العداد) + END TIME (وقت الانتهاء) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
                        {/* Right: عداد وقت بدء الجلسة (Start Time Counter) */}
                        <div className="flex flex-col justify-between p-4 rounded-2xl bg-neutral-950 dark:bg-[#0c0809] border border-neutral-800 dark:border-white/10 text-white shadow-inner space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-red-500" />
                                    <span className="text-xs font-bold text-white">عداد وقت بدء الجلسة</span>
                                </div>
                                <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20">
                                    {currentAvailability.formattedStart}
                                </span>
                            </div>

                            {/* 3 Drums */}
                            <div className="relative bg-neutral-900/90 rounded-xl p-1.5 border border-neutral-800/90 overflow-hidden">
                                {/* Center Highlight Lens */}
                                <div
                                    className="pointer-events-none absolute inset-x-2 rounded-lg border-y border-red-500/50 bg-gradient-to-r from-red-500/10 via-red-500/20 to-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)] z-0"
                                    style={{ top: 'calc(1.5rem + 38px)', height: '38px' }}
                                />
                                {/* Top and Bottom gradient masks */}
                                <div className="pointer-events-none absolute inset-x-0 top-6 h-8 bg-gradient-to-b from-neutral-900 via-neutral-900/70 to-transparent z-10" />
                                <div className="pointer-events-none absolute inset-x-0 bottom-6 h-8 bg-gradient-to-t from-neutral-900 via-neutral-900/70 to-transparent z-10" />

                                <div className="flex items-center justify-around gap-1 relative z-20">
                                    <DrumWheelColumn
                                        title="الساعة"
                                        items={HOUR_WHEEL_ITEMS}
                                        selectedValue={selectedHour}
                                        onSelect={(h) => {
                                            setSelectedHour(h);
                                            playPs5NavigateSound();
                                        }}
                                        itemHeight={38}
                                        visibleRows={3}
                                    />
                                    <div className="text-neutral-500 font-bold text-xl pt-5 select-none">:</div>
                                    <DrumWheelColumn
                                        title="الدقيقة"
                                        items={MINUTE_WHEEL_ITEMS}
                                        selectedValue={selectedMinute}
                                        onSelect={(m) => {
                                            setSelectedMinute(m);
                                            playPs5NavigateSound();
                                        }}
                                        itemHeight={38}
                                        visibleRows={3}
                                    />
                                    <DrumWheelColumn
                                        title="الفترة"
                                        items={PERIOD_WHEEL_ITEMS}
                                        selectedValue={selectedPeriod}
                                        onSelect={(p) => {
                                            setSelectedPeriod(p);
                                            playPs5NavigateSound();
                                        }}
                                        itemHeight={38}
                                        visibleRows={3}
                                    />
                                </div>
                            </div>

                            {/* Quick Minute & Period Helpers */}
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/80 text-[11px]">
                                <div className="flex items-center gap-1">
                                    <span className="text-neutral-400 text-[10px]">الدقائق:</span>
                                    {[0, 15, 30, 45].map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => {
                                                setSelectedMinute(m);
                                                playPs5NavigateSound();
                                            }}
                                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                                selectedMinute === m
                                                    ? 'bg-red-600 text-white shadow-xs'
                                                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                                            }`}
                                        >
                                            :{String(m).padStart(2, '0')}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center p-0.5 rounded-lg bg-neutral-800/80 border border-neutral-700/60">
                                    {(['PM', 'AM'] as const).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => {
                                                setSelectedPeriod(p);
                                                playPs5NavigateSound();
                                            }}
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                                selectedPeriod === p
                                                    ? 'bg-red-600 text-white shadow-xs'
                                                    : 'text-neutral-400 hover:text-white'
                                            }`}
                                        >
                                            {p === 'PM' ? 'مساءً' : 'صباحاً'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Left: وقت انتهاء الحجز والمغادرة (Booking End Time) */}
                        <div className="flex flex-col justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-[#181214] border border-neutral-200/90 dark:border-white/10 shadow-xs space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-white/[0.06]">
                                <div className="flex items-center gap-2">
                                    <Timer className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                        وقت انتهاء الحجز (المغادرة)
                                    </span>
                                </div>
                                {currentAvailability.isAvailable ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>متاح ومؤكد</span>
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>غير متاح</span>
                                    </span>
                                )}
                            </div>

                            <div className="my-auto py-2 text-center">
                                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium block mb-1">
                                    ينتهي الحجز في تمام الساعة:
                                </span>
                                <div className="text-3xl sm:text-4xl font-mono font-black text-neutral-900 dark:text-white tracking-tight drop-shadow-xs">
                                    {currentAvailability.formattedEnd}
                                </div>
                                <div className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 flex items-center justify-center gap-2 font-medium">
                                    <span className="bg-neutral-200/70 dark:bg-white/[0.06] px-2 py-0.5 rounded-md font-mono text-[11px]">
                                        من: {currentAvailability.formattedStart}
                                    </span>
                                    <span>➔</span>
                                    <span className="bg-neutral-200/70 dark:bg-white/[0.06] px-2 py-0.5 rounded-md font-mono text-[11px]">
                                        إلى: {currentAvailability.formattedEnd}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2.5 border-t border-neutral-200 dark:border-white/[0.06] flex items-center justify-between text-xs">
                                <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                                    إجمالي الجلسة ({durationHours} {durationHours === 1 ? 'ساعة' : 'ساعات'}):
                                </span>
                                <span className="font-mono font-extrabold text-sm text-red-600 dark:text-red-400">
                                    {roomSubtotal} ج.م
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Real-Time Availability Inline Feedback */}
                    {hasSelectedTime && hasSelectedDuration ? (
                        <div
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                                currentAvailability.isAvailable
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-600/40 text-emerald-950 dark:text-emerald-200'
                                    : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-600/40 text-red-950 dark:text-red-200'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                {currentAvailability.isAvailable ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                                )}
                                <div className="text-right">
                                    <div className="font-bold text-xs sm:text-sm">
                                        {currentAvailability.isAvailable
                                            ? `الموعد متاح للحجز مؤكداً`
                                            : currentAvailability.reason === 'PAST_TIME'
                                            ? 'هذا الوقت قد مضى بالفعل، يرجى اختيار موعد قادم'
                                            : currentAvailability.reason === 'EXCEEDS_CLOSING'
                                            ? 'يتجاوز موعد إغلاق الصالة (04:00 ص فجراً)'
                                            : currentAvailability.conflictingInterval
                                            ? `يتعارض مع حجز قائم من ${formatArabicTimeDetailed(currentAvailability.conflictingInterval.start)} إلى ${formatArabicTimeDetailed(currentAvailability.conflictingInterval.end)}`
                                            : 'هذا الوقت غير متاح'}
                                    </div>
                                    <div className="text-[11px] opacity-80 mt-0.5">
                                        من {currentAvailability.formattedStart} إلى {currentAvailability.formattedEnd} ({formatDurationLabel(durationHours)})
                                    </div>
                                </div>
                            </div>

                            <span className="font-mono font-bold text-xs sm:text-sm shrink-0" dir="ltr">
                                {roomSubtotal} ج.م
                            </span>
                        </div>
                    ) : (
                        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/10 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                                <span>يرجى اختيار وقت بدء الجلسة ومدتها لتأكيد الحجز</span>
                            </div>
                            <span className="font-mono text-[11px]">
                                {currentRoom.rate} ج.م/س
                            </span>
                        </div>
                    )}
                </div>

                {/* Cafe Cross-sell / Live Cart Status Banner */}
                {cartItems.length > 0 ? (
                    <div className="bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <Coffee className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                    <span>سلة الكافيه مدمجة ({cartItems.length} {cartItems.length === 1 ? 'صنف' : 'أصناف'})</span>
                                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                                        +{cafeTotal} ج.م
                                    </span>
                                </div>
                                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    سيتم إرسال طلب المشروبات والسناكس مع حجز الغرفة كفاتورة موحدة
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => openCart('cafe')}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0 transition-all cursor-pointer shadow-xs"
                        >
                            تعديل السلة
                        </button>
                    </div>
                ) : (
                    <div className="bg-neutral-100/80 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shrink-0">
                                <Coffee className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-200">
                                    تريد مشروبات وسناكس مع اللعب؟
                                </div>
                                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                    اختر من المنيو وستُضاف لسلتك مع حجز الجلسة في فاتورة موحدة
                                </div>
                            </div>
                        </div>
                        <Link
                            to="/menu"
                            className="px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 text-xs font-bold shrink-0 transition-all"
                        >
                            تصفح المنيو
                        </Link>
                    </div>
                )}
            </main>

            {/* Sticky Mobile-First Bottom Bar */}
            <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0c090a]/95 border-t border-neutral-200 dark:border-white/10 backdrop-blur-xl p-3 sm:p-4 pb-safe shadow-xl">
                <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
                    {/* Price & Summary */}
                    <div className="flex flex-col text-right min-w-0">
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-mono font-black text-xl sm:text-2xl tabular-nums text-neutral-900 dark:text-white">
                                {roomSubtotal > 0 ? (roomSubtotal + cafeTotal) : currentRoom.rate}
                            </span>
                            <span className="text-xs text-neutral-500 font-bold">
                                {roomSubtotal > 0 ? 'ج.م إجمالي' : 'ج.م / س'}
                            </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 font-medium truncate">
                            {cafeTotal > 0 && roomSubtotal > 0 ? (
                                <span>جلسة {roomSubtotal} + كافيه {cafeTotal} ج.م</span>
                            ) : (
                                <>
                                    <span className="truncate">{currentRoom.titleAr.split('•')[0].trim()}</span>
                                    <span>•</span>
                                    <span>
                                        {hasSelectedTime && hasSelectedDuration
                                            ? `${currentAvailability.formattedStart} - ${currentAvailability.formattedEnd}`
                                            : 'لم تحدد الموعد بعد'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons: Add to Cart & Direct Checkout */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            disabled={!isReadyToContinue}
                            title="أضف الجلسة إلى السلة وتابع التصفح"
                            className={`px-3 sm:px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                                isReadyToContinue
                                    ? 'bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-900 dark:text-white border-neutral-300 dark:border-white/10 active:scale-95'
                                    : 'bg-neutral-100/50 dark:bg-white/[0.02] text-neutral-400 dark:text-neutral-600 border-transparent cursor-not-allowed opacity-60'
                            }`}
                        >
                            <ShoppingBag className="w-4 h-4" />
                            <span className="hidden sm:inline">أضف للسلة</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleContinue}
                            className={`py-3 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border ${
                                isReadyToContinue
                                    ? 'bg-red-600 hover:bg-red-500 border-red-500 text-white shadow-md shadow-red-600/25 active:scale-95'
                                    : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.08] dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-white/10'
                            }`}
                        >
                            <span>
                                {!hasSelectedTime || !hasSelectedDuration
                                    ? 'حدد الوقت والمدة للمتابعة'
                                    : isReadyToContinue
                                    ? 'تأكيد ومتابعة الحجز'
                                    : 'الموعد غير متاح'}
                            </span>
                            <ArrowRight className="w-4 h-4 rotate-180" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
