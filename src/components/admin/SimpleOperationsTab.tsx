import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    LayoutDashboard,
    Clock,
    Gamepad2,
    Calendar,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Search,
    Phone,
    MessageCircle,
    User,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    Settings2,
    Check,
    X,
    List,
    ChevronDown,
    ChevronUp,
    Info,
    Trash2,
    DollarSign,
    ShieldCheck,
    Lock,
    Unlock,
    Users,
    Square,
    Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    fetchBookingsForDate,
    fetchRecentBookings,
    fetchPaginatedBookings,
    fetchBookingMetrics,
    updateBookingStatus,
    deleteBooking,
    fetchBookingPolicy,
    updateBookingPolicy,
    fetchRoomRates,
    updateRoomRates,
    confirmBookingAndResolveConflicts,
    groupConflictingPendingBookings,
    getBookingDates,
    type RoomRates,
    type ConflictGroup,
} from '@/services/bookingService';
import {
    getCairoTodayDateString,
    addDaysToDateString,
    formatArabicTimeFromDate,
} from '@/lib/bookingDatetime';
import type { DBBooking, BookingPolicy } from '@/types/database';
import BookingDetailsModal from './BookingDetailsModal';
import AdminCalendarPopover from './AdminCalendarPopover';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';
import { supabase } from '@/lib/supabase';

type SubTabType = 'dashboard' | 'details' | 'settings';

function formatTimeAgo(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
}

const LOUNGE_ROOM_FILTERS = [
    { id: 'all', label: 'كل الغرف' },
    { id: 'room-1', label: 'غرفة 01 (PLAY ROOM)' },
    { id: 'room-2', label: 'غرفة 02 (PLAY ROOM)' },
] as const;

function getNormalizedRoomName(b: DBBooking | null | undefined): string {
    if (!b) return 'غرفة اللعب';
    const text = `${b.room_id || ''} ${b.room_name || ''}`.toLowerCase();
    if (text.includes('02') || text.includes('station b') || text.includes('غرفة 2') || text.includes('room 2') || text.includes('room-2')) {
        return 'غرفة 02 (PLAY ROOM)';
    }
    return 'غرفة 01 (PLAY ROOM)';
}

function isBookingMatchingRoom(b: DBBooking, roomFilterId: string): boolean {
    if (roomFilterId === 'all') return true;
    const normalized = getNormalizedRoomName(b);
    if (roomFilterId === 'room-1') {
        return normalized === 'غرفة 01 (PLAY ROOM)';
    }
    if (roomFilterId === 'room-2') {
        return normalized === 'غرفة 02 (PLAY ROOM)';
    }
    return false;
}

export default function SimpleOperationsTab() {
    const [activeSubTab, setActiveSubTab] = useState<SubTabType>('dashboard');

    // Cairo-pinned Date for Today
    const todayStr = useMemo(() => getCairoTodayDateString(), []);

    // Data State
    const [loading, setLoading] = useState<boolean>(true);
    const [todayBookings, setTodayBookings] = useState<DBBooking[]>([]);
    const [recentBookings, setRecentBookings] = useState<DBBooking[]>([]);
    const [allPendingBookings, setAllPendingBookings] = useState<DBBooking[]>([]);
    const [generalStats, setGeneralStats] = useState<{
        totalBookings: number;
        totalRevenue: number;
        pendingCount: number;
        confirmedCount: number;
    }>({
        totalBookings: 0,
        totalRevenue: 0,
        pendingCount: 0,
        confirmedCount: 0,
    });

    // Modals & Focused Detail Preview
    const [activeDetailBooking, setActiveDetailBooking] = useState<DBBooking | null>(null);
    const [focusedBookingBrief, setFocusedBookingBrief] = useState<DBBooking | null>(null);

    // Policy & Rates
    const [policy, setPolicy] = useState<BookingPolicy | null>(null);
    const [isSavingPolicy, setIsSavingPolicy] = useState<boolean>(false);
    const [, setRoomRates] = useState<RoomRates>({ 'room-1': 100, 'room-2': 100 });
    const [rateRoom1, setRateRoom1] = useState<number>(100);
    const [rateRoom2, setRateRoom2] = useState<number>(100);
    const [savingRates, setSavingRates] = useState<boolean>(false);

    // Filters for Section 1: Today's Confirmed Schedule
    const [todayRoomFilter, setTodayRoomFilter] = useState<string>('all');
    const [todayStatusFilter, setTodayStatusFilter] = useState<'all' | 'confirmed' | 'ongoing'>('confirmed');
    const [todaySearch, setTodaySearch] = useState<string>('');

    // Filters for Section 2: Incoming Pending Bookings with Calendar
    const [recentDateFilter, setRecentDateFilter] = useState<string>(''); // empty = all upcoming dates
    const [recentRoomFilter, setRecentRoomFilter] = useState<string>('all');
    const [recentSearch, setRecentSearch] = useState<string>('');
    const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
    const [pendingCountsByDate, setPendingCountsByDate] = useState<Record<string, number>>({});

    // Accordion for Conflicting Bookings inside Recent section
    const [expandedConflictBookingIds, setExpandedConflictBookingIds] = useState<Record<string, boolean>>({});

    // Archive / Details State
    const [archivePage, setArchivePage] = useState<number>(1);
    const [archiveTotalPages, setArchiveTotalPages] = useState<number>(1);
    const [archiveTotalCount, setArchiveTotalCount] = useState<number>(0);
    const [archiveSearch, setArchiveSearch] = useState<string>('');
    const [archiveStatusFilter, setArchiveStatusFilter] = useState<string>('all');
    const [archiveDateFilter, setArchiveDateFilter] = useState<string>('');
    const [archiveBookings, setArchiveBookings] = useState<DBBooking[]>([]);
    const [archiveLoading, setArchiveLoading] = useState<boolean>(false);

    // Live Clock
    const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
    useEffect(() => {
        const updateClock = () => {
            try {
                setCurrentTimeStr(formatArabicTimeFromDate(new Date()));
            } catch {
                setCurrentTimeStr(new Date().toLocaleTimeString('ar-EG'));
            }
        };
        updateClock();
        const timer = setInterval(updateClock, 10000);
        return () => clearInterval(timer);
    }, []);

    // 1. Load Data
    const loadOperationsData = useCallback(async (isSilentInput?: boolean | unknown) => {
        const isSilent = typeof isSilentInput === 'boolean' ? isSilentInput : false;
        if (!isSilent) setLoading(true);
        try {
            const [metrics, dayData, recentData, rates, pol] = await Promise.all([
                fetchBookingMetrics(),
                fetchBookingsForDate(todayStr), // ALWAYS strictly for today!
                fetchRecentBookings({ date: recentDateFilter || undefined, limit: 50 }),
                fetchRoomRates(),
                fetchBookingPolicy(),
            ]);

            setAllPendingBookings(metrics.recentPending);
            if (metrics.pendingCountsByDate) {
                setPendingCountsByDate(metrics.pendingCountsByDate);
            }
            setGeneralStats({
                totalBookings: metrics.totalCount,
                totalRevenue: metrics.totalRevenue,
                pendingCount: metrics.pendingCount,
                confirmedCount: metrics.confirmedCount,
            });
            setTodayBookings(dayData);
            setRecentBookings(recentData);
            setRoomRates(rates);
            setRateRoom1(rates['room-1'] || 100);
            setRateRoom2(rates['room-2'] || 100);
            setPolicy(pol);
        } catch {
            if (!isSilent) toast.error('تعذر جلب بيانات الحجوزات');
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [todayStr, recentDateFilter]);

    useEffect(() => {
        loadOperationsData();
    }, [loadOperationsData]);

    // Realtime channel listener + periodic sync for incoming bookings
    useEffect(() => {
        const channel = supabase
            .channel('realtime_admin_ps_bookings')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'ps_bookings' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newBooking = payload.new as DBBooking;
                        toast.info(`حجز بلايستيشن جديد: #${newBooking.reservation_id}`, {
                            description: `${newBooking.customer_name} - ${getNormalizedRoomName(newBooking)}`,
                            duration: 6000,
                        });
                        playPs5SelectSound();
                    }
                    loadOperationsData(true);
                }
            )
            .subscribe();

        // 20-second background polling fallback
        const pollInterval = setInterval(() => {
            loadOperationsData(true);
        }, 20000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(pollInterval);
        };
    }, [loadOperationsData]);

    // 2. Load Archive Data
    const loadArchiveData = useCallback(async (targetPage = archivePage) => {
        if (activeSubTab !== 'details') return;
        setArchiveLoading(true);
        try {
            const res = await fetchPaginatedBookings({
                status: archiveStatusFilter !== 'all' ? archiveStatusFilter : undefined,
                date: archiveDateFilter || undefined,
                search: archiveSearch || undefined,
                page: targetPage,
                pageSize: 15,
            });
            setArchiveBookings(res.bookings);
            setArchiveTotalCount(res.totalCount);
            setArchiveTotalPages(res.totalPages);
            setArchivePage(targetPage);
        } catch {
            toast.error('تعذر جلب تفاصيل الحجوزات');
        } finally {
            setArchiveLoading(false);
        }
    }, [activeSubTab, archiveStatusFilter, archiveDateFilter, archiveSearch, archivePage]);

    useEffect(() => {
        if (activeSubTab === 'details') {
            loadArchiveData(archivePage);
        }
    }, [activeSubTab, archivePage, archiveDateFilter, archiveSearch, archiveStatusFilter, loadArchiveData]);

    // Fast Shortcut: Confirm Booking
    const handleQuickConfirm = async (b: DBBooking) => {
        playPs5SelectSound();
        const { end } = getBookingDates(b);
        if (end.getTime() <= Date.now()) {
            toast.error('لا يمكن تأكيد هذا الحجز لأن موعده قد انتهى بالفعل');
            return;
        }
        try {
            await updateBookingStatus(b.id, 'confirmed');
            toast.success(`تم تأكيد حجز ${b.customer_name} بنجاح! ✅`);
            setAllPendingBookings(prev => prev.filter(item => item.id !== b.id));
            setRecentBookings(prev => prev.filter(item => item.id !== b.id));
            if (b.booking_date === todayStr) {
                setTodayBookings(prev => {
                    const exists = prev.some(item => item.id === b.id);
                    if (exists) return prev.map(item => item.id === b.id ? { ...item, status: 'confirmed' } : item);
                    return [{ ...b, status: 'confirmed' }, ...prev];
                });
            }
            setGeneralStats(prev => ({
                ...prev,
                confirmedCount: prev.confirmedCount + 1,
                pendingCount: Math.max(0, prev.pendingCount - 1),
            }));
            loadOperationsData(true);
        } catch {
            toast.error('تعذر تأكيد الحجز');
        }
    };

    // Fast Shortcut: Cancel Booking
    const handleQuickReject = async (b: DBBooking) => {
        playPs5NavigateSound();
        if (!confirm(`هل أنت متأكد من إلغاء حجز ${b.customer_name}؟`)) return;
        try {
            await updateBookingStatus(b.id, 'cancelled');
            toast.info(`تم إلغاء حجز ${b.customer_name}`);
            setAllPendingBookings(prev => prev.filter(item => item.id !== b.id));
            setRecentBookings(prev => prev.filter(item => item.id !== b.id));
            setTodayBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'cancelled' } : item));
            setGeneralStats(prev => ({
                ...prev,
                confirmedCount: b.status === 'confirmed' ? Math.max(0, prev.confirmedCount - 1) : prev.confirmedCount,
                pendingCount: b.status === 'pending' ? Math.max(0, prev.pendingCount - 1) : prev.pendingCount,
            }));
            loadOperationsData(true);
        } catch {
            toast.error('تعذر إلغاء الحجز');
        }
    };

    // Fast Shortcut: Finish Ongoing Session Early
    const handleQuickFinish = async (b: DBBooking) => {
        playPs5SelectSound();
        if (!confirm(`هل تريد إنهاء جلسة ${b.customer_name} الآن وتفريغ الغرفة؟`)) return;
        try {
            await updateBookingStatus(b.id, 'completed');
            toast.success(`تم إنهاء جلسة ${b.customer_name} بنجاح ✅`);
            setTodayBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'completed' } : item));
            setRecentBookings(prev => prev.filter(item => item.id !== b.id));
        } catch {
            toast.error('تعذر إنهاء الجلسة');
        }
    };

    // Conflict Resolution: Confirm Winner and Auto-Cancel Competitors
    const handleConfirmConflictWinner = async (winnerBooking: DBBooking, group: ConflictGroup) => {
        playPs5SelectSound();
        try {
            const { cancelledIds } = await confirmBookingAndResolveConflicts(winnerBooking.id, true);
            toast.success(`تم اعتماد حجز ${winnerBooking.customer_name}! وتم إلغاء الطلبات المتنافسة الأخرى تلقائياً. ✅`);

            setAllPendingBookings(prev =>
                prev.filter(b => b.id !== winnerBooking.id && !cancelledIds.includes(b.id))
            );
            setRecentBookings(prev =>
                prev.filter(b => b.id !== winnerBooking.id && !cancelledIds.includes(b.id))
            );
            if (winnerBooking.booking_date === todayStr) {
                setTodayBookings(prev => {
                    const exists = prev.some(item => item.id === winnerBooking.id);
                    const mapped = prev.map(b => {
                        if (b.id === winnerBooking.id) return { ...b, status: 'confirmed' as const };
                        if (cancelledIds.includes(b.id)) return { ...b, status: 'cancelled' as const };
                        return b;
                    });
                    if (exists) return mapped;
                    return [{ ...winnerBooking, status: 'confirmed' as const }, ...mapped];
                });
            }
            setGeneralStats(prev => ({
                ...prev,
                confirmedCount: prev.confirmedCount + 1,
                pendingCount: Math.max(0, prev.pendingCount - 1 - cancelledIds.length),
            }));
            loadOperationsData(true);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'تعذر اعتماد الحجز';
            toast.error(msg);
        }
    };

    // Delete Booking from Archive
    const handleDeleteBooking = async (id: string, name: string) => {
        playPs5NavigateSound();
        if (!confirm(`هل أنت متأكد من حذف حجز "${name}" نهائياً؟`)) return;
        try {
            await deleteBooking(id);
            toast.success('تم حذف الحجز بنجاح');
            setArchiveBookings(prev => prev.filter(b => b.id !== id));
            setTodayBookings(prev => prev.filter(b => b.id !== id));
        } catch {
            toast.error('تعذر حذف الحجز');
        }
    };

    // Policy Switcher (10-Min Hold vs Admin Approval)
    const handlePolicySwitch = async (mode: 'admin_approval_only' | 'temporary_hold') => {
        if (!policy || policy.mode === mode) return;
        setIsSavingPolicy(true);
        playPs5SelectSound();
        try {
            const updated = await updateBookingPolicy({
                ...policy,
                mode,
            });
            setPolicy(updated);
            toast.success(
                mode === 'temporary_hold'
                    ? 'تم تفعيل نظام القفل المؤقت لمدة 10 دقائق بنجاح! 🔒'
                    : 'تم تفعيل نظام الموافقة المسبقة للإدارة بنجاح! 🔓'
            );
        } catch {
            toast.error('تعذر حفظ السياسة');
        } finally {
            setIsSavingPolicy(false);
        }
    };

    // Save Room Rates
    const handleSaveRoomRates = async () => {
        setSavingRates(true);
        playPs5SelectSound();
        try {
            const updated = await updateRoomRates({
                'room-1': Number(rateRoom1) || 100,
                'room-2': Number(rateRoom2) || 100,
            });
            setRoomRates(updated);
            toast.success('تم حفظ وتطبيق أسعار ساعات الغرف بنجاح! 🎮');
        } catch {
            toast.error('تعذر حفظ أسعار الغرف');
        } finally {
            setSavingRates(false);
        }
    };

    // Conflict Groups (overlapping pending bookings in recent bookings)
    const conflictGroups = useMemo(() => {
        return groupConflictingPendingBookings(recentBookings);
    }, [recentBookings]);

    const toggleConflictDropdown = (bookingId: string) => {
        setExpandedConflictBookingIds(prev => ({
            ...prev,
            [bookingId]: !prev[bookingId]
        }));
    };

    // Find overlapping bookings and conflict group for any booking
    const getBookingConflictInfo = useCallback((b: DBBooking) => {
        if (b.status === 'cancelled') return { hasOverlap: false, competitors: [] as DBBooking[], group: null as ConflictGroup | null };

        // 1. Check if it's already in conflictGroups
        const existingGroup = conflictGroups.find(g => g.bookings.some(item => item.id === b.id));
        if (existingGroup) {
            return {
                hasOverlap: true,
                competitors: existingGroup.bookings,
                group: existingGroup,
            };
        }

        // 2. Or check overlap against other recent bookings in same room on same date
        const { start: bStart, end: bEnd } = getBookingDates(b);
        const overlaps = recentBookings.filter(other => {
            if (other.id === b.id) return false;
            if (other.status === 'cancelled') return false;
            if (other.booking_date !== b.booking_date) return false;
            if (getNormalizedRoomName(other) !== getNormalizedRoomName(b)) return false;
            const { start: oStart, end: oEnd } = getBookingDates(other);
            return bStart < oEnd && bEnd > oStart;
        });

        if (overlaps.length > 0) {
            const allInGroup = [b, ...overlaps].sort(
                (x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime()
            );
            const normName = getNormalizedRoomName(b);
            const dynamicGroup: ConflictGroup = {
                id: `conflict-${b.id}`,
                roomId: normName === 'غرفة 02 (PLAY ROOM)' ? 'room-2' : 'room-1',
                roomName: normName,
                bookingDate: b.booking_date,
                formattedTimeRange: `${b.start_time} - ${b.end_time}`,
                bookings: allInGroup,
            };
            return {
                hasOverlap: true,
                competitors: allInGroup,
                group: dynamicGroup,
            };
        }

        return { hasOverlap: false, competitors: [] as DBBooking[], group: null as ConflictGroup | null };
    }, [conflictGroups, recentBookings]);

    // Renders the conflict resolution dropdown content for a booking
    const renderConflictDropdownContent = (b: DBBooking, competitors: DBBooking[], group: ConflictGroup) => {
        return (
            <div className="space-y-3 bg-amber-50/70 border border-amber-300 rounded-2xl p-3.5 sm:p-4 shadow-sm text-right">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2.5">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-2xs">
                            ⚠️
                        </div>
                        <div>
                            <h5 className="text-xs sm:text-sm font-bold text-amber-950">
                                تداخل مواعيد على نفس الغرفة ({getNormalizedRoomName(b)})
                            </h5>
                            <p className="text-[11px] text-amber-800/80">
                                الطلبات المتنافسة على هذا الموعد. تأكيد أي حجز يعتمده فوراً ويلغي المتنافس الآخر تلقائياً.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleConflictDropdown(b.id);
                        }}
                        className="p-1 rounded-lg text-amber-800 hover:bg-amber-200/60 transition-colors cursor-pointer"
                        title="إغلاق القائمة المنسدلة"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-2">
                    {competitors.map((item, idx) => {
                        const isCurrent = item.id === b.id;
                        const isFirst = idx === 0;
                        const timeAgo = formatTimeAgo(item.created_at);

                        return (
                            <div
                                key={item.id}
                                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                    isCurrent
                                        ? 'bg-white border-amber-300 shadow-2xs'
                                        : 'bg-white/80 border-slate-200'
                                }`}
                            >
                                <div className="flex items-start sm:items-center gap-2.5">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                        isFirst ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                        {isFirst ? '🥇 الأسبق طلباً' : `🥈 متنافس #${idx + 1}`}
                                    </span>

                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-slate-900 text-xs sm:text-sm">{item.customer_name}</span>
                                            {isCurrent && (
                                                <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.2 rounded font-bold">
                                                    هذا الحجز
                                                </span>
                                            )}
                                            <span className="text-[11px] text-slate-500">({timeAgo})</span>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                                ⏰ {item.start_time} - {item.end_time} ({item.duration_hours} س)
                                            </span>
                                            <span dir="ltr" className="font-mono text-slate-600 text-[11px]">{item.customer_phone}</span>
                                            <button
                                                type="button"
                                                onClick={(e) => openWhatsAppDirect(e, item)}
                                                className="text-emerald-600 hover:underline text-[11px] inline-flex items-center gap-0.5 font-bold cursor-pointer"
                                            >
                                                <MessageCircle className="w-3 h-3" />
                                                <span>واتساب</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                                    <span className="font-bold text-emerald-700 text-sm whitespace-nowrap">
                                        {item.total_amount} ج.م
                                    </span>

                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                        {item.status === 'pending' && (
                                            <button
                                                type="button"
                                                onClick={() => handleConfirmConflictWinner(item, group)}
                                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                                                title="تأكيد واعتماد هذا الحجز وإلغاء المتنافسين"
                                            >
                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                <span>تأكيد واعتماد</span>
                                            </button>
                                        )}

                                        {item.status === 'confirmed' && (
                                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                                                مؤكد مسبقاً 🔒
                                            </span>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => handleQuickReject(item)}
                                            className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                                            title="إلغاء هذا الحجز"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Active Ongoing Sessions (Live in lounge now)
    const ongoingBookings = useMemo(() => {
        const nowMs = Date.now();
        return todayBookings.filter(b => {
            if (b.status !== 'confirmed') return false;
            const { start, end } = getBookingDates(b);
            return start.getTime() <= nowMs && end.getTime() > nowMs;
        });
    }, [todayBookings]);

    // Expected Revenue for Today (Strictly confirmed bookings)
    const todayRevenue = useMemo(() => {
        return todayBookings
            .filter(b => b.status === 'confirmed')
            .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
    }, [todayBookings]);

    // Helper to determine effective status (expired pending is considered cancelled)
    const getEffectiveStatus = useCallback((b: DBBooking, nowMs: number) => {
        if (b.status === 'pending') {
            const { end } = getBookingDates(b);
            if (end.getTime() <= nowMs) {
                return 'cancelled';
            }
        }
        return b.status;
    }, []);

    // Status counts for today
    const todayStatusCounts = useMemo(() => {
        const confirmed = todayBookings.filter(b => b.status === 'confirmed').length;
        const nowMs = Date.now();
        const ongoing = todayBookings.filter(b => {
            if (b.status !== 'confirmed') return false;
            const { start, end } = getBookingDates(b);
            return start.getTime() <= nowMs && end.getTime() > nowMs;
        }).length;
        return {
            confirmed,
            ongoing,
            all: todayBookings.length,
        };
    }, [todayBookings]);

    // Filtered Today's Confirmed Schedule Bookings
    const filteredTodayBookings = useMemo(() => {
        const nowMs = Date.now();
        return todayBookings.filter(b => {
            if (!isBookingMatchingRoom(b, todayRoomFilter)) return false;

            const { start, end } = getBookingDates(b);
            const isOngoing = b.status === 'confirmed' && start.getTime() <= nowMs && end.getTime() > nowMs;

            if (todayStatusFilter === 'confirmed') {
                if (b.status !== 'confirmed') return false;
            } else if (todayStatusFilter === 'ongoing') {
                if (!isOngoing) return false;
            }

            if (todaySearch.trim()) {
                const s = todaySearch.toLowerCase();
                const matchName = b.customer_name?.toLowerCase().includes(s);
                const matchPhone = b.customer_phone?.includes(s);
                const matchCode = b.reservation_id?.toLowerCase().includes(s);
                if (!matchName && !matchPhone && !matchCode) return false;
            }
            return true;
        }).sort((a, b) => {
            return getBookingDates(a).start.getTime() - getBookingDates(b).start.getTime();
        });
    }, [todayBookings, todayRoomFilter, todayStatusFilter, todaySearch]);

    // Counts for recent bookings
    const recentPendingCount = useMemo(() => {
        const nowMs = Date.now();
        return recentBookings.filter(b => getEffectiveStatus(b, nowMs) === 'pending').length;
    }, [recentBookings, getEffectiveStatus]);

    // Filtered Incoming Pending Requests (Inbox strictly from today onwards)
    const filteredRecentBookings = useMemo(() => {
        const nowMs = Date.now();
        return recentBookings.filter(b => {
            // Strictly only pending requests that have not expired and are for today or future
            if (b.status !== 'pending') return false;
            if (b.booking_date < todayStr) return false;
            const { end } = getBookingDates(b);
            if (end.getTime() <= nowMs) return false;

            if (!isBookingMatchingRoom(b, recentRoomFilter)) return false;
            if (recentDateFilter && b.booking_date !== recentDateFilter) return false;

            if (recentSearch.trim()) {
                const s = recentSearch.toLowerCase();
                const matchName = b.customer_name?.toLowerCase().includes(s);
                const matchPhone = b.customer_phone?.includes(s);
                const matchCode = b.reservation_id?.toLowerCase().includes(s);
                if (!matchName && !matchPhone && !matchCode) return false;
            }
            return true;
        });
    }, [recentBookings, recentRoomFilter, recentDateFilter, recentSearch, todayStr]);

    // Date formatted for today
    const formattedTodayTitle = useMemo(() => {
        try {
            const [y, m, d] = todayStr.split('-').map(Number);
            return new Intl.DateTimeFormat('ar-EG', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
            }).format(new Date(y, m - 1, d));
        } catch {
            return todayStr;
        }
    }, [todayStr]);

    // Date formatted for recent date filter
    const formattedRecentDateTitle = useMemo(() => {
        if (!recentDateFilter) return 'كل الأيام القادمة';
        try {
            const [y, m, d] = recentDateFilter.split('-').map(Number);
            return new Intl.DateTimeFormat('ar-EG', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
            }).format(new Date(y, m - 1, d));
        } catch {
            return recentDateFilter;
        }
    }, [recentDateFilter]);

    // Total pending count across all dates
    const totalPendingCount = useMemo(() => {
        return Object.values(pendingCountsByDate).reduce((sum, count) => sum + count, 0);
    }, [pendingCountsByDate]);

    // Navigation to Booking Details (pre-filtered)
    const navigateToBookingDetails = (b: DBBooking) => {
        playPs5SelectSound();
        setFocusedBookingBrief(b);
        setArchiveSearch(b.reservation_id);
        setArchiveStatusFilter('all');
        setArchiveDateFilter('');
        setArchivePage(1);
        setActiveSubTab('details');
    };

    const clearFocusedBookingBrief = () => {
        playPs5NavigateSound();
        setFocusedBookingBrief(null);
        setArchiveSearch('');
        setArchivePage(1);
    };

    // WhatsApp opener
    const openWhatsAppDirect = (e: React.MouseEvent, b: DBBooking) => {
        e.stopPropagation();
        let phone = b.customer_phone.replace(/\D/g, '');
        if (phone.startsWith('0')) phone = '2' + phone;
        else if (!phone.startsWith('20')) phone = '20' + phone;
        const text = `أهلاً بحضرتك يا أستاذ ${b.customer_name} 👋\nمعاك إدارة D95 Gaming Lounge 🎮\n\nبخصوص حجزك (${b.reservation_id}):\n📍 الغرفة: ${getNormalizedRoomName(b)}\n📅 التاريخ: ${b.booking_date}\n⏰ التوقيت: ${b.start_time} - ${b.end_time} (${b.duration_hours} س)\n\nفي انتظارك تنورنا!`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="space-y-4 max-w-7xl mx-auto" dir="rtl">
            {/* SUB-TABS NAVIGATION (Clean Light Executive Style) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto">
                    {/* 1. Dashboard & Schedule */}
                    <button
                        type="button"
                        onClick={() => {
                            playPs5NavigateSound();
                            setActiveSubTab('dashboard');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                            activeSubTab === 'dashboard'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>الداشبورد والمواعيد</span>
                        {allPendingBookings.length > 0 && (
                            <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                                {allPendingBookings.length}
                            </span>
                        )}
                    </button>

                    {/* 2. Detailed Bookings */}
                    <button
                        type="button"
                        onClick={() => {
                            playPs5NavigateSound();
                            setActiveSubTab('details');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                            activeSubTab === 'details'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <List className="w-4 h-4" />
                        <span>تفاصيل الحجوزات</span>
                    </button>

                    {/* 3. Settings */}
                    <button
                        type="button"
                        onClick={() => {
                            playPs5NavigateSound();
                            setActiveSubTab('settings');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                            activeSubTab === 'settings'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <Settings2 className="w-4 h-4" />
                        <span>إعدادات الحجز</span>
                    </button>
                </div>

                {/* Clock & Refresh */}
                <div className="flex items-center gap-2 mr-auto sm:mr-0 text-xs">
                    <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-mono font-bold text-slate-700">{currentTimeStr}</span>
                    </div>

                    <button
                        type="button"
                        onClick={loadOperationsData}
                        disabled={loading}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                        title="تحديث البيانات"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : ''}`} />
                    </button>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* SUB-TAB 1: DASHBOARD & TODAY'S OPERATIONS */}
            {/* ========================================================================= */}
            {activeSubTab === 'dashboard' && (
                <div className="space-y-6">
                    {/* 4 Executive KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* 1. All Confirmed Bookings */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs hover:border-blue-200 transition-colors">
                            <div>
                                <span className="text-xs text-slate-500 font-bold block">
                                    الحجوزات المؤكدة
                                </span>
                                <span className="font-sans text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
                                    {generalStats.confirmedCount}
                                </span>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                                <Calendar className="w-5 h-5" />
                            </div>
                        </div>

                        {/* 2. Ongoing Gaming Now */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs hover:border-emerald-200 transition-colors">
                            <div>
                                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>شغال الآن بالصالة</span>
                                </span>
                                <span className="font-sans text-2xl sm:text-3xl font-black text-emerald-600 mt-1 block">
                                    {ongoingBookings.length}
                                </span>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                                <Gamepad2 className="w-5 h-5" />
                            </div>
                        </div>

                        {/* 3. Pending Requests */}
                        <div className={`border rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs transition-colors ${
                            totalPendingCount > 0 ? 'border-amber-300 bg-amber-50/40 hover:border-amber-400' : 'bg-white border-slate-200/90'
                        }`}>
                            <div>
                                <span className="text-xs text-amber-800 font-bold block">طلبات بانتظار التأكيد</span>
                                <span className="font-sans text-2xl sm:text-3xl font-black text-amber-600 mt-1 block">
                                    {totalPendingCount}
                                </span>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                        </div>

                        {/* 4. Confirmed Revenue Today */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs hover:border-emerald-200 transition-colors">
                            <div>
                                <span className="text-xs text-slate-500 font-bold block">
                                    إيراد اليوم المؤكد
                                </span>
                                <span className="font-sans text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
                                    {todayRevenue} <span className="text-xs font-normal text-slate-500">ج.م</span>
                                </span>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* SECTION 1 (TOP): TODAY'S CONFIRMED SCHEDULE (مواعيد اليوم المؤكدة) */}
                    {/* ========================================================================= */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                        {/* Section Header & Filters */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                            جدول مواعيد وتشغيل اليوم (المؤكدة)
                                        </h3>
                                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                            {formattedTodayTitle}
                                        </span>
                                        <span className="text-xs font-mono font-bold text-slate-500">
                                            ({filteredTodayBookings.length} موعد)
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        استعراض الأوقات المحجوزة اليوم وأسماء العملاء المؤكدين لكل غرفة بالصالة.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Status Filter Pills */}
                                <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-0.5 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setTodayStatusFilter('confirmed')}
                                        className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                            todayStatusFilter === 'confirmed'
                                                ? 'bg-red-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                                        }`}
                                    >
                                        <span>المؤكدة</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                            todayStatusFilter === 'confirmed' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                            {todayStatusCounts.confirmed}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTodayStatusFilter('all')}
                                        className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                            todayStatusFilter === 'all'
                                                ? 'bg-red-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                                        }`}
                                    >
                                        <span>الكل</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                            todayStatusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                            {todayStatusCounts.all}
                                        </span>
                                    </button>

                                    {todayStatusCounts.ongoing > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setTodayStatusFilter('ongoing')}
                                            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                todayStatusFilter === 'ongoing'
                                                    ? 'bg-emerald-600 text-white shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                                            }`}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <span>شغال الآن</span>
                                            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-white/20">
                                                {todayStatusCounts.ongoing}
                                            </span>
                                        </button>
                                    )}
                                </div>

                                {/* Room Filter Pills - Exactly 2 Rooms */}
                                <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-0.5 text-xs">
                                    {LOUNGE_ROOM_FILTERS.map((r) => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => setTodayRoomFilter(r.id)}
                                            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                                                todayRoomFilter === r.id ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                                            }`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Search */}
                                <div className="relative w-full sm:w-52">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="بحث في مواعيد اليوم..."
                                        value={todaySearch}
                                        onChange={(e) => setTodaySearch(e.target.value)}
                                        className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl pr-9 pl-8 py-2 border border-slate-200 outline-none focus:bg-white focus:border-red-500 transition-colors"
                                    />
                                    {todaySearch && (
                                        <button
                                            type="button"
                                            onClick={() => setTodaySearch('')}
                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                            title="مسح البحث"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Schedule Content */}
                        {loading ? (
                            <div className="py-12 flex justify-center">
                                <RefreshCw className="w-5 h-5 animate-spin text-red-600" />
                            </div>
                        ) : filteredTodayBookings.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl space-y-2">
                                <p className="font-medium">لا توجد مواعيد محجوزة تطابق الفلتر أو البحث المحدد لليوم.</p>
                                {(todayStatusFilter !== 'confirmed' || todaySearch || todayRoomFilter !== 'all') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTodayStatusFilter('confirmed');
                                            setTodaySearch('');
                                            setTodayRoomFilter('all');
                                        }}
                                        className="text-red-600 hover:underline font-bold text-xs cursor-pointer"
                                    >
                                        إعادة ضبط الفلاتر وعرض المؤكدة
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-right text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80">
                                                <th className="py-3 px-3 font-semibold">الموعد المحجوز والمدة</th>
                                                <th className="py-3 px-3 font-semibold">اسم العميل ورقم الهاتف</th>
                                                <th className="py-3 px-3 font-semibold">الغرفة</th>
                                                <th className="py-3 px-3 font-semibold">المبلغ</th>
                                                <th className="py-3 px-3 font-semibold">الحالة التشغيلية</th>
                                                <th className="py-3 px-3 text-left font-semibold">الإجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredTodayBookings.map((b) => {
                                                const { start: bStart, end: bEnd } = getBookingDates(b);
                                                const nowMs = Date.now();
                                                const isEnded = bEnd.getTime() <= nowMs;
                                                const isStarted = bStart.getTime() <= nowMs;
                                                const isOngoing = isStarted && !isEnded && b.status === 'confirmed';

                                                return (
                                                    <tr
                                                        key={b.id}
                                                        onClick={() => navigateToBookingDetails(b)}
                                                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                                        title="اضغط للانتقال إلى صفحة تفاصيل هذا الحجز"
                                                    >
                                                        {/* Time Slot */}
                                                        <td className="py-3.5 px-3">
                                                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                                                <Clock className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                                                <span>{b.start_time} - {b.end_time}</span>
                                                            </div>
                                                            <span className="text-[11px] text-slate-500 font-mono">({b.duration_hours} س)</span>
                                                        </td>

                                                        {/* Client */}
                                                        <td className="py-3.5 px-3">
                                                            <div className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                                                                {b.customer_name}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                                                <span dir="ltr" className="font-mono text-slate-600">{b.customer_phone}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => openWhatsAppDirect(e, b)}
                                                                    className="text-emerald-600 hover:underline inline-flex items-center gap-0.5 font-bold cursor-pointer"
                                                                >
                                                                    <MessageCircle className="w-3 h-3" />
                                                                    <span>واتساب</span>
                                                                </button>
                                                            </div>
                                                        </td>

                                                        {/* Room */}
                                                        <td className="py-3.5 px-3 text-slate-700 font-medium">
                                                            {getNormalizedRoomName(b)}
                                                        </td>

                                                        {/* Amount */}
                                                        <td className="py-3.5 px-3 font-bold text-emerald-700">
                                                            {b.total_amount} ج.م
                                                        </td>

                                                        {/* Status */}
                                                        <td className="py-3.5 px-3">
                                                            {isOngoing ? (
                                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                    <span>شغال الآن 🎮</span>
                                                                </span>
                                                            ) : b.status === 'confirmed' ? (
                                                                isEnded ? (
                                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                                        انتهى موعده ⌛
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                                        مؤكد 🔒
                                                                    </span>
                                                                )
                                                            ) : b.status === 'pending' ? (
                                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                                    معلق ⏳
                                                                </span>
                                                            ) : (
                                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                                    {b.status === 'completed' ? 'مكتمل' : 'ملغي'}
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="py-3.5 px-3 text-left" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                {isOngoing && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQuickFinish(b)}
                                                                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 border border-slate-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                                                        title="إنهاء الجلسة الآن"
                                                                    >
                                                                        <Square className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                                                                        <span>إنهاء</span>
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => navigateToBookingDetails(b)}
                                                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
                                                                >
                                                                    تفاصيل الحجز
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards View */}
                                <div className="md:hidden space-y-3">
                                    {filteredTodayBookings.map((b) => {
                                        const { start: bStart, end: bEnd } = getBookingDates(b);
                                        const nowMs = Date.now();
                                        const isEnded = bEnd.getTime() <= nowMs;
                                        const isStarted = bStart.getTime() <= nowMs;
                                        const isOngoing = isStarted && !isEnded && b.status === 'confirmed';

                                        return (
                                            <div
                                                key={b.id}
                                                onClick={() => navigateToBookingDetails(b)}
                                                className="border border-slate-200 bg-slate-50/80 rounded-xl p-3.5 space-y-3 cursor-pointer shadow-xs hover:border-red-300 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-900">{b.customer_name}</h4>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                            <span dir="ltr" className="font-mono text-slate-600">{b.customer_phone}</span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => openWhatsAppDirect(e, b)}
                                                                className="text-emerald-600 text-[11px] font-bold"
                                                            >
                                                                واتساب
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        {isOngoing ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                شغال الآن 🎮
                                                            </span>
                                                        ) : b.status === 'confirmed' ? (
                                                            isEnded ? (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                                    انتهى ⌛
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                                    مؤكد 🔒
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                                {b.status === 'completed' ? 'مكتمل' : 'ملغي'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-lg p-2.5 flex items-center justify-between text-xs border border-slate-200">
                                                    <div>
                                                        <span className="text-slate-500 text-[10px] block">الموعد والغرفة:</span>
                                                        <span className="text-slate-900 font-bold">{getNormalizedRoomName(b)}</span>
                                                        <span className="text-slate-600 text-[11px] block">{b.start_time} - {b.end_time} ({b.duration_hours} س)</span>
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="text-slate-500 text-[10px] block">المبلغ:</span>
                                                        <span className="text-emerald-700 font-bold text-sm">{b.total_amount} ج.م</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                                                    {isOngoing && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuickFinish(b)}
                                                            className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
                                                        >
                                                            <Square className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                                                            <span>إنهاء الجلسة</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => navigateToBookingDetails(b)}
                                                        className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold text-center"
                                                    >
                                                        عرض التفاصيل
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* ========================================================================= */}
                    {/* SECTION 2 (BOTTOM): RECENT & INCOMING BOOKINGS WITH CALENDAR POPOVER */}
                    {/* ========================================================================= */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                        {/* Section Header & Calendar Popover Integration */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                            الطلبات الواردة وبانتظار القرار
                                        </h3>
                                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                            {filteredRecentBookings.length} طلب معلق
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        طلبات الحجز الجديدة لليوم والأيام القادمة. تأكيد الحجز أو إلغاؤه ينقله تلقائياً إلى تفاصيل الحجوزات.
                                    </p>
                                </div>
                            </div>

                            {/* Calendar Popover + Quick Filters */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* CALENDAR BUTTON WITH NOTIFICATION BADGE */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCalendarOpen(prev => !prev);
                                            playPs5NavigateSound();
                                        }}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs group ${
                                            recentDateFilter
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : 'bg-slate-100 hover:bg-white text-slate-700 border-slate-200'
                                        }`}
                                        title="فتح تقويم الأيام واكتشاف الطلبات المعلقة"
                                    >
                                        <div className="relative">
                                            <Calendar className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
                                            {totalPendingCount > 0 && (
                                                <span
                                                    className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center border border-white shadow-2xs animate-pulse"
                                                    title={`يوجد ${totalPendingCount} حجز معلق`}
                                                >
                                                    {totalPendingCount}
                                                </span>
                                            )}
                                        </div>

                                        <span>{formattedRecentDateTitle}</span>

                                        {recentDateFilter && (
                                            <span className="text-[10px] font-medium bg-red-600 text-white px-1.5 py-0.2 rounded-md">
                                                مفلتر
                                            </span>
                                        )}

                                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isCalendarOpen ? 'rotate-180 text-red-600' : ''}`} />
                                    </button>

                                    <AdminCalendarPopover
                                        isOpen={isCalendarOpen}
                                        onClose={() => setIsCalendarOpen(false)}
                                        selectedDate={recentDateFilter || todayStr}
                                        onSelectDate={(newDate) => {
                                            setRecentDateFilter(newDate);
                                            setIsCalendarOpen(false);
                                        }}
                                        pendingCountsByDate={pendingCountsByDate}
                                    />
                                </div>

                                {recentDateFilter && (
                                    <button
                                        type="button"
                                        onClick={() => setRecentDateFilter('')}
                                        className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                                        title="عرض طلبات كل الأيام"
                                    >
                                        عرض كل الأيام ✕
                                    </button>
                                )}

                                {/* Room Filter Pills - Exactly 2 Rooms */}
                                <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-0.5 text-xs">
                                    {LOUNGE_ROOM_FILTERS.map((r) => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => setRecentRoomFilter(r.id)}
                                            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                                                recentRoomFilter === r.id ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                                            }`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Search */}
                                <div className="relative w-full sm:w-48">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="بحث في الطلبات..."
                                        value={recentSearch}
                                        onChange={(e) => setRecentSearch(e.target.value)}
                                        className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl pr-9 pl-8 py-2 border border-slate-200 outline-none focus:bg-white focus:border-red-500 transition-colors"
                                    />
                                    {recentSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setRecentSearch('')}
                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                            title="مسح البحث"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Bookings List */}
                        {loading ? (
                            <div className="py-12 flex justify-center">
                                <RefreshCw className="w-5 h-5 animate-spin text-red-600" />
                            </div>
                        ) : filteredRecentBookings.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl space-y-2">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 font-black text-base">
                                    ✓
                                </div>
                                <p className="font-bold text-slate-800 text-sm">لا توجد طلبات حجز معلقة بانتظار اتخاذ قرار</p>
                                <p className="text-slate-500 max-w-sm mx-auto">
                                    جميع طلبات الحجز تم اتخاذ قرار بشأنها (مؤكدة أو ملغية) أو لا توجد طلبات واردة جديدة للأيام القادمة. يمكنك مراجعة كافة الحجوزات وسجلاتها من تاب "تفاصيل الحجوزات".
                                </p>
                                {(recentSearch || recentRoomFilter !== 'all' || recentDateFilter) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRecentSearch('');
                                            setRecentRoomFilter('all');
                                            setRecentDateFilter('');
                                        }}
                                        className="text-red-600 hover:underline font-bold text-xs cursor-pointer inline-block mt-2"
                                    >
                                        إعادة ضبط الفلاتر والبحث ✕
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-right text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80">
                                                <th className="py-3 px-3 font-semibold">تاريخ وموعد الحجز</th>
                                                <th className="py-3 px-3 font-semibold">العميل</th>
                                                <th className="py-3 px-3 font-semibold">الغرفة</th>
                                                <th className="py-3 px-3 font-semibold">المبلغ</th>
                                                <th className="py-3 px-3 font-semibold">الحالة</th>
                                                <th className="py-3 px-3 text-left font-semibold">إجراء سريع / تنافس</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredRecentBookings.map((b) => {
                                                const { end: bEnd } = getBookingDates(b);
                                                const nowMs = Date.now();
                                                const isEnded = bEnd.getTime() <= nowMs;
                                                const timeAgo = formatTimeAgo(b.created_at);

                                                const { hasOverlap, competitors, group } = getBookingConflictInfo(b);
                                                const isConflictExpanded = !!expandedConflictBookingIds[b.id];

                                                return (
                                                    <React.Fragment key={b.id}>
                                                        <tr
                                                            onClick={() => navigateToBookingDetails(b)}
                                                            className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                                                                hasOverlap ? 'bg-amber-50/30 hover:bg-amber-50/60' : ''
                                                            }`}
                                                            title="اضغط للانتقال إلى صفحة تفاصيل هذا الحجز"
                                                        >
                                                            {/* Date & Time */}
                                                            <td className="py-3.5 px-3">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="font-bold text-slate-900 text-xs">{b.booking_date}</span>
                                                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                                                                        {timeAgo}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                                                    {b.start_time} - {b.end_time} ({b.duration_hours} س)
                                                                </div>
                                                            </td>

                                                            {/* Client */}
                                                            <td className="py-3.5 px-3">
                                                                <div className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                                                                    {b.customer_name}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                                                    <span dir="ltr" className="font-mono text-slate-600">{b.customer_phone}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => openWhatsAppDirect(e, b)}
                                                                        className="text-emerald-600 hover:underline inline-flex items-center gap-0.5 font-bold cursor-pointer"
                                                                    >
                                                                        <MessageCircle className="w-3 h-3" />
                                                                        <span>واتساب</span>
                                                                    </button>
                                                                </div>

                                                                {/* Dropdown trigger button inside table row if overlapping */}
                                                                {hasOverlap && (
                                                                    <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleConflictDropdown(b.id)}
                                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border shadow-2xs cursor-pointer ${
                                                                                isConflictExpanded
                                                                                    ? 'bg-amber-500 text-slate-950 border-amber-600'
                                                                                    : 'bg-amber-100 text-amber-950 hover:bg-amber-200 border-amber-300'
                                                                            }`}
                                                                        >
                                                                            <AlertCircle className="w-3 h-3 text-amber-800 shrink-0" />
                                                                            <span>متداخل مع حجز آخر ({competitors.length})</span>
                                                                            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isConflictExpanded ? 'rotate-180' : ''}`} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>

                                                            {/* Room */}
                                                            <td className="py-3.5 px-3 text-slate-700 font-medium">
                                                                {getNormalizedRoomName(b)}
                                                            </td>

                                                            {/* Amount */}
                                                            <td className="py-3.5 px-3 font-bold text-emerald-700">
                                                                {b.total_amount} ج.م
                                                            </td>

                                                            {/* Status */}
                                                            <td className="py-3.5 px-3">
                                                                {hasOverlap && b.status === 'pending' ? (
                                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                                                                        <AlertCircle className="w-2.5 h-2.5 text-amber-700" />
                                                                        <span>معلق (تنافس)</span>
                                                                    </span>
                                                                ) : b.status === 'confirmed' ? (
                                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                                        مؤكد 🔒
                                                                    </span>
                                                                ) : b.status === 'pending' ? (
                                                                    isEnded ? (
                                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                                            ملغي (انتهى وقته) ⌛
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                                            معلق ⏳
                                                                        </span>
                                                                    )
                                                                ) : (
                                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                                        {b.status === 'completed' ? 'مكتمل' : 'ملغي'}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Quick Actions & Details */}
                                                            <td className="py-3.5 px-3 text-left">
                                                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                                    {b.status === 'pending' && (
                                                                        <>
                                                                            {!isEnded && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleQuickConfirm(b)}
                                                                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                                                                                    title="تأكيد الحجز فوراً"
                                                                                >
                                                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                                                    <span>تأكيد</span>
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleQuickReject(b)}
                                                                                className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
                                                                                title="إلغاء الحجز"
                                                                            >
                                                                                إلغاء
                                                                            </button>
                                                                        </>
                                                                    )}

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => navigateToBookingDetails(b)}
                                                                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
                                                                    >
                                                                        تفاصيل
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        {/* Conflict Dropdown Accordion Row */}
                                                        {hasOverlap && isConflictExpanded && group && (
                                                            <tr className="bg-amber-50/40 border-b-2 border-amber-200" onClick={(e) => e.stopPropagation()}>
                                                                <td colSpan={6} className="p-3 sm:p-4">
                                                                    {renderConflictDropdownContent(b, competitors, group)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Responsive Cards View */}
                                <div className="md:hidden space-y-3">
                                    {filteredRecentBookings.map((b) => {
                                        const { end: bEnd } = getBookingDates(b);
                                        const nowMs = Date.now();
                                        const isEnded = bEnd.getTime() <= nowMs;
                                        const timeAgo = formatTimeAgo(b.created_at);

                                        const { hasOverlap, competitors, group } = getBookingConflictInfo(b);
                                        const isConflictExpanded = !!expandedConflictBookingIds[b.id];

                                        return (
                                            <div
                                                key={b.id}
                                                onClick={() => navigateToBookingDetails(b)}
                                                className={`border rounded-xl p-3.5 space-y-3 cursor-pointer shadow-xs transition-colors ${
                                                    hasOverlap ? 'bg-amber-50/30 border-amber-300' : 'bg-slate-50/80 border-slate-200'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                                            <span>{b.customer_name}</span>
                                                            {hasOverlap && (
                                                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                            )}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                            <span dir="ltr" className="font-mono text-slate-600">{b.customer_phone}</span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => openWhatsAppDirect(e, b)}
                                                                className="text-emerald-600 text-[11px] font-bold"
                                                            >
                                                                واتساب
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-[10px] text-slate-500 font-mono">{timeAgo}</span>
                                                        {hasOverlap && b.status === 'pending' ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                                                                <AlertCircle className="w-2.5 h-2.5 text-amber-700" />
                                                                <span>معلق (تنافس)</span>
                                                            </span>
                                                        ) : b.status === 'confirmed' ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                                مؤكد 🔒
                                                            </span>
                                                        ) : b.status === 'pending' ? (
                                                            isEnded ? (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                                    ملغي (انتهى) ⌛
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                                    معلق ⏳
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                                {b.status === 'completed' ? 'مكتمل' : 'ملغي'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-lg p-2.5 flex items-center justify-between text-xs border border-slate-200">
                                                    <div>
                                                        <span className="text-slate-500 text-[10px] block">الموعد والتاريخ:</span>
                                                        <span className="text-slate-900 font-bold">{getNormalizedRoomName(b)} - {b.booking_date}</span>
                                                        <span className="text-slate-600 text-[11px] block">{b.start_time} - {b.end_time} ({b.duration_hours} س)</span>
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="text-slate-500 text-[10px] block">المبلغ:</span>
                                                        <span className="text-emerald-700 font-bold text-sm">{b.total_amount} ج.م</span>
                                                    </div>
                                                </div>

                                                {/* Mobile Conflict Dropdown Trigger */}
                                                {hasOverlap && (
                                                    <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleConflictDropdown(b.id)}
                                                            className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                                                                isConflictExpanded
                                                                    ? 'bg-amber-500 text-slate-950 border-amber-600'
                                                                    : 'bg-amber-100 text-amber-950 hover:bg-amber-200 border-amber-300'
                                                            }`}
                                                        >
                                                            <span className="flex items-center gap-1.5">
                                                                <AlertCircle className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                                                                <span>متداخل مع حجز آخر ({competitors.length})</span>
                                                            </span>
                                                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isConflictExpanded ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Mobile Conflict Dropdown Content */}
                                                {hasOverlap && isConflictExpanded && group && (
                                                    <div onClick={(e) => e.stopPropagation()} className="pt-1">
                                                        {renderConflictDropdownContent(b, competitors, group)}
                                                    </div>
                                                )}

                                                {/* Mobile Action Buttons */}
                                                <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                                                    {b.status === 'pending' && (
                                                        <>
                                                            {!isEnded && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuickConfirm(b)}
                                                                    className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs"
                                                                >
                                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                                    <span>تأكيد الحجز</span>
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQuickReject(b)}
                                                                className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:text-rose-600 border border-slate-200 text-xs font-bold"
                                                            >
                                                                إلغاء
                                                            </button>
                                                        </>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => navigateToBookingDetails(b)}
                                                        className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold text-center"
                                                    >
                                                        عرض التفاصيل
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 2: DETAILED BOOKINGS ARCHIVE */}
            {/* ========================================================================= */}
            {activeSubTab === 'details' && (
                <div className="space-y-4">
                    {/* Focused Booking Quick Brief Card */}
                    {focusedBookingBrief && (
                        <div className="bg-gradient-to-r from-red-50/90 via-white to-slate-50 border-2 border-red-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-100 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-xs">
                                        <Gamepad2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-red-600">بريف الحجز المحدد</span>
                                            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                                                #{focusedBookingBrief.reservation_id}
                                            </span>
                                        </div>
                                        <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                                            {focusedBookingBrief.customer_name}
                                        </h3>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {focusedBookingBrief.status === 'confirmed' ? (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                            <span>مؤكد</span>
                                            <span>🔒</span>
                                        </span>
                                    ) : focusedBookingBrief.status === 'pending' ? (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                            <span>معلق</span>
                                            <span>⏳</span>
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                            {focusedBookingBrief.status === 'completed' ? 'مكتمل' : 'ملغي'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div className="bg-white/80 border border-slate-200 rounded-xl p-3">
                                    <span className="text-slate-500 text-[11px] block mb-0.5">الغرفة والجهاز:</span>
                                    <span className="font-bold text-slate-900 text-sm block">{getNormalizedRoomName(focusedBookingBrief)}</span>
                                </div>

                                <div className="bg-white/80 border border-slate-200 rounded-xl p-3">
                                    <span className="text-slate-500 text-[11px] block mb-0.5">الموعد والتاريخ:</span>
                                    <span className="font-bold text-slate-900 block">{focusedBookingBrief.booking_date}</span>
                                    <span className="text-slate-600 font-mono text-[11px]">{focusedBookingBrief.start_time} - {focusedBookingBrief.end_time} ({focusedBookingBrief.duration_hours} س)</span>
                                </div>

                                <div className="bg-white/80 border border-slate-200 rounded-xl p-3">
                                    <span className="text-slate-500 text-[11px] block mb-0.5">رقم الهاتف:</span>
                                    <span className="font-mono font-bold text-slate-900 block" dir="ltr">{focusedBookingBrief.customer_phone}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => openWhatsAppDirect(e, focusedBookingBrief)}
                                        className="text-emerald-600 hover:underline text-[11px] inline-flex items-center gap-1 font-bold mt-0.5 cursor-pointer"
                                    >
                                        <MessageCircle className="w-3 h-3" />
                                        <span>مراسلة واتساب</span>
                                    </button>
                                </div>

                                <div className="bg-white/80 border border-slate-200 rounded-xl p-3">
                                    <span className="text-slate-500 text-[11px] block mb-0.5">المبلغ الإجمالي:</span>
                                    <span className="font-black text-emerald-700 text-base">{focusedBookingBrief.total_amount} ج.م</span>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setActiveDetailBooking(focusedBookingBrief)}
                                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                                >
                                    <Eye className="w-4 h-4" />
                                    <span>عرض كامل تفاصيل الحجز 🔍</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={clearFocusedBookingBrief}
                                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span>عرض كل سجل الحجوزات بالأرشيف</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                    {/* Search & Filters */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="ابحث باسم العميل أو الهاتف أو كود الحجز..."
                                value={archiveSearch}
                                onChange={(e) => {
                                    setArchiveSearch(e.target.value);
                                    setArchivePage(1);
                                }}
                                className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl pr-9 pl-3 py-2 border border-slate-200 outline-none focus:bg-white focus:border-red-500 transition-colors"
                            />
                        </div>

                        {/* Status Filter Pills */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-0.5">
                                {[
                                    { id: 'all', label: 'الكل' },
                                    { id: 'confirmed', label: 'مؤكد' },
                                    { id: 'pending', label: 'معلق' },
                                    { id: 'completed', label: 'مكتمل' },
                                    { id: 'cancelled', label: 'ملغي' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => {
                                            setArchiveStatusFilter(tab.id);
                                            setArchivePage(1);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                                            archiveStatusFilter === tab.id
                                                ? 'bg-red-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Date Filter */}
                            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <input
                                    type="date"
                                    value={archiveDateFilter}
                                    onChange={(e) => {
                                        setArchiveDateFilter(e.target.value);
                                        setArchivePage(1);
                                    }}
                                    className="bg-transparent text-slate-800 text-xs outline-none cursor-pointer font-mono"
                                />
                                {archiveDateFilter && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setArchiveDateFilter('');
                                            setArchivePage(1);
                                        }}
                                        className="text-slate-500 hover:text-slate-900 font-bold ml-1 text-xs"
                                        title="مسح فلتر التاريخ"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {archiveLoading ? (
                        <div className="py-16 flex justify-center">
                            <RefreshCw className="w-5 h-5 animate-spin text-red-600" />
                        </div>
                    ) : archiveBookings.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                            لا توجد نتائج مطابقة لمعايير البحث في الأرشيف.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80">
                                        <th className="py-3 px-3 font-semibold">كود الحجز</th>
                                        <th className="py-3 px-3 font-semibold">العميل</th>
                                        <th className="py-3 px-3 font-semibold">الغرفة</th>
                                        <th className="py-3 px-3 font-semibold">التاريخ والتوقيت</th>
                                        <th className="py-3 px-3 font-semibold">المبلغ</th>
                                        <th className="py-3 px-3 font-semibold">الحالة</th>
                                        <th className="py-3 px-3 text-left font-semibold">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {archiveBookings.map((b) => {
                                        const { end: dEnd } = getBookingDates(b);
                                        const isPastPending = b.status === 'pending' && dEnd.getTime() <= Date.now();
                                        return (
                                            <tr
                                                key={b.id}
                                                onClick={() => setActiveDetailBooking(b)}
                                                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                            >
                                                <td className="py-3.5 px-3 font-mono text-slate-500">#{b.reservation_id}</td>
                                                <td className="py-3.5 px-3">
                                                    <div className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                                                        {b.customer_name}
                                                    </div>
                                                    <span className="text-[11px] text-slate-500 font-mono" dir="ltr">
                                                        {b.customer_phone}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-3 text-slate-700">{getNormalizedRoomName(b)}</td>
                                                <td className="py-3.5 px-3">
                                                    <div className="text-slate-900">{b.booking_date}</div>
                                                    <div className="text-slate-500 text-[11px]">{b.start_time} - {b.end_time}</div>
                                                </td>
                                                <td className="py-3.5 px-3 font-bold text-emerald-700">{b.total_amount} ج.م</td>
                                                <td className="py-3.5 px-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        b.status === 'confirmed'
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                            : isPastPending
                                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            : b.status === 'pending'
                                                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                    }`}>
                                                        {b.status === 'confirmed'
                                                            ? 'مؤكد'
                                                            : isPastPending
                                                            ? 'ملغي (انتهى وقته)'
                                                            : b.status === 'pending'
                                                            ? 'معلق'
                                                            : b.status === 'completed'
                                                            ? 'مكتمل'
                                                            : 'ملغي'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-3 text-left" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveDetailBooking(b)}
                                                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs"
                                                        >
                                                            تفاصيل
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteBooking(b.id, b.customer_name)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                            title="حذف الحجز"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {archiveTotalPages > 1 && (
                        <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs text-slate-500">
                            <span>صفحة {archivePage} من {archiveTotalPages} ({archiveTotalCount} حجز)</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setArchivePage(p => Math.max(1, p - 1))}
                                    disabled={archivePage <= 1}
                                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-30 cursor-pointer"
                                >
                                    السابق
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setArchivePage(p => Math.min(archiveTotalPages, p + 1))}
                                    disabled={archivePage >= archiveTotalPages}
                                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-30 cursor-pointer"
                                >
                                    التالي
                                </button>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 3: SETTINGS (سياسة الـ 10 دقائق وأسعار الغرف) */}
            {/* ========================================================================= */}
            {activeSubTab === 'settings' && (
                <div className="space-y-4">
                    {/* Booking Policy Mode */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">سياسة وقفل مواعيد الحجز</h3>
                                    <p className="text-xs text-slate-500">
                                        اختر كيف يتعامل الموقع مع المواعيد عند قيام الزبائن بطلب حجز غرف البلايستيشن
                                    </p>
                                </div>
                            </div>

                            {isSavingPolicy && (
                                <div className="flex items-center gap-1 text-xs text-amber-600 animate-pulse">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>جاري الحفظ...</span>
                                </div>
                            )}
                        </div>

                        {/* 2 Policy Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {/* System 1: Admin Approval */}
                            <button
                                type="button"
                                onClick={() => handlePolicySwitch('admin_approval_only')}
                                disabled={isSavingPolicy}
                                className={`text-right p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                                    policy?.mode === 'admin_approval_only'
                                        ? 'bg-red-50/70 border-red-500 text-slate-900 shadow-xs ring-1 ring-red-500/40'
                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${policy?.mode === 'admin_approval_only' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                            <Unlock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm text-slate-900 block">النظام الأول: الموافقة المسبقة للإدارة</span>
                                            <span className="text-[11px] text-amber-700 font-medium">الموعد يظل متاحاً حتى تعتمده الإدارة</span>
                                        </div>
                                    </div>
                                    {policy?.mode === 'admin_approval_only' && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                                            النشط حالياً
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    الموعد لا يُقفل في الموقع إلا بعد تأكيدك. يمكن لعدة عملاء إرسال طلبات لنفس التوقيت، وستظهر لك في القائمة المنسدلة للمفاضلة واختيار العميل المعتمد.
                                </p>
                            </button>

                            {/* System 2: Temporary 10-Minute Hold */}
                            <button
                                type="button"
                                onClick={() => handlePolicySwitch('temporary_hold')}
                                disabled={isSavingPolicy}
                                className={`text-right p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                                    policy?.mode === 'temporary_hold'
                                        ? 'bg-amber-50/70 border-amber-500 text-slate-900 shadow-xs ring-1 ring-amber-500/40'
                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${policy?.mode === 'temporary_hold' ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-600'}`}>
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm text-slate-900 block">النظام الثاني: قفل مؤقت لمدة 10 دقائق</span>
                                            <span className="text-[11px] text-emerald-700 font-medium">قفل فوري ينفك تلقائياً بعد 10 دقائق</span>
                                        </div>
                                    </div>
                                    {policy?.mode === 'temporary_hold' && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">
                                            النشط حالياً
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    الموعد يُقفل فوراً في الموقع بمجرد أن يرسل العميل طلبه لمدة 10 دقائق. إذا لم تؤكده خلال الـ 10 دقائق ينفك القفل تلقائياً ويعود متاحاً للعامة.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Room Hourly Rates */}
                    <div className="max-w-xl bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                            <Gamepad2 className="w-5 h-5 text-red-600" />
                            <h3 className="text-sm sm:text-base font-bold text-slate-900">أسعار ساعات اللعب للغرف</h3>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed">
                            حدد سعر الساعة (ج.م) لكل غرفة. يتم تطبيق هذا السعر فوراً في صفحة الحجز لحساب التكلفة الإجمالية للزبائن.
                        </p>

                        <div className="space-y-3 pt-1">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                    سعر ساعة الغرفة 1 (PLAY ROOM 01):
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={rateRoom1}
                                        onChange={(e) => setRateRoom1(Number(e.target.value))}
                                        className="w-full bg-slate-50 text-slate-900 font-mono font-bold text-sm rounded-xl px-3 py-2.5 border border-slate-200 outline-none focus:bg-white focus:border-red-500 transition-colors"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">ج.م / ساعة</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                    سعر ساعة الغرفة 2 (PLAY ROOM 02):
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={rateRoom2}
                                        onChange={(e) => setRateRoom2(Number(e.target.value))}
                                        className="w-full bg-slate-50 text-slate-900 font-mono font-bold text-sm rounded-xl px-3 py-2.5 border border-slate-200 outline-none focus:bg-white focus:border-red-500 transition-colors"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">ج.م / ساعة</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleSaveRoomRates}
                                disabled={savingRates}
                                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                            >
                                {savingRates ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                <span>حفظ الأسعار وتطبيقها فوراً</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {activeDetailBooking && (
                <BookingDetailsModal
                    booking={activeDetailBooking}
                    onClose={() => setActiveDetailBooking(null)}
                    onStatusChange={async (id, newStatus) => {
                        await updateBookingStatus(id, newStatus);
                        toast.success('تم تحديث حالة الحجز بنجاح');
                        setActiveDetailBooking(null);
                        loadOperationsData();
                        if (activeSubTab === 'details') loadArchiveData();
                    }}
                />
            )}
        </div>
    );
}
