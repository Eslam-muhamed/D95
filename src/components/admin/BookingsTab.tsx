import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Calendar,
    Clock,
    Search,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Check,
    MessageCircle,
    Trash2,
    Phone,
    User,
    Banknote,
    Layers,
    Coffee,
    AlertCircle,
    X,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    Lock,
    Unlock,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    ChevronLeft,
    Users,
    Info,
    DollarSign,
    Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    fetchBookings,
    fetchPaginatedBookings,
    updateBookingStatus,
    deleteBooking,
    calculateBookingExtensionInfo,
    extendBookingAndShiftConflicting,
    fetchBookingPolicy,
    updateBookingPolicy,
    fetchRoomRates,
    updateRoomRates,
    type RoomRates,
    confirmBookingAndResolveConflicts,
    groupConflictingPendingBookings,
    getBookingDates,
} from '@/services/bookingService';
import type { DBBooking, BookingPolicy } from '@/types/database';

function formatTimeAgo(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
}

export default function BookingsTab() {
    const [bookings, setBookings] = useState<DBBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [policy, setPolicy] = useState<BookingPolicy | null>(null);
    const [isSavingPolicy, setIsSavingPolicy] = useState(false);
    const [expandedConflictIds, setExpandedConflictIds] = useState<Record<string, boolean>>({});

    // Server-side Pagination state
    const [page, setPage] = useState<number>(1);
    const [pageSize] = useState<number>(20);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(1);

    // Dynamic Room Rates state
    const [roomRates, setRoomRates] = useState<RoomRates | null>(null);
    const [showRatesModal, setShowRatesModal] = useState<boolean>(false);
    const [rateRoom1, setRateRoom1] = useState<number>(100);
    const [rateRoom2, setRateRoom2] = useState<number>(100);
    const [isSavingRates, setIsSavingRates] = useState<boolean>(false);

    const loadData = useCallback(async (targetPage = page) => {
        setLoading(true);
        try {
            const [paginatedRes, currentPolicy, rates] = await Promise.all([
                fetchPaginatedBookings({
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                    date: selectedDate || undefined,
                    search: search || undefined,
                    page: targetPage,
                    pageSize,
                }),
                fetchBookingPolicy(),
                fetchRoomRates(),
            ]);
            setBookings(paginatedRes.bookings);
            setTotalCount(paginatedRes.totalCount);
            setTotalPages(paginatedRes.totalPages);
            setPolicy(currentPolicy);
            setRoomRates(rates);
            setRateRoom1(rates['room-1'] || 100);
            setRateRoom2(rates['room-2'] || 100);
        } catch {
            toast.error('تعذر جلب قائمة الحجوزات أو الإعدادات');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, selectedDate, search, page, pageSize]);

    useEffect(() => {
        loadData(page);
    }, [loadData, page]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadData(1);
    };

    const handleStatusFilterChange = (newStatus: string) => {
        setStatusFilter(newStatus);
        setPage(1);
    };

    const handleDateFilterChange = (newDate: string) => {
        setSelectedDate(newDate);
        setPage(1);
    };

    const handleSaveRoomRates = async () => {
        setIsSavingRates(true);
        try {
            const updated = await updateRoomRates({
                'room-1': Number(rateRoom1) || 100,
                'room-2': Number(rateRoom2) || 100,
            });
            setRoomRates(updated);
            setShowRatesModal(false);
            toast.success('تم تحديث أسعار ساعات الغرف بنجاح وتفعيلها في قاعدة البيانات! 🎮');
        } catch {
            toast.error('تعذر حفظ أسعار الغرف');
        } finally {
            setIsSavingRates(false);
        }
    };

    const handlePolicySwitch = async (mode: 'admin_approval_only' | 'temporary_hold') => {
        if (!policy || policy.mode === mode) return;
        setIsSavingPolicy(true);
        try {
            const newPolicy: BookingPolicy = {
                mode,
                hold_minutes: 10,
            };
            await updateBookingPolicy(newPolicy);
            setPolicy(newPolicy);
            toast.success(
                mode === 'admin_approval_only'
                    ? 'تم تفعيل: الموافقة المسبقة للإدارة (المواعيد تظل متاحة على الموقع حتى تؤكدها)'
                    : 'تم تفعيل: قفل مؤقت 10 دقائق (ينفك تلقائياً بعد 10 دقائق في حال عدم التأكيد)'
            );
        } catch {
            toast.error('تعذر حفظ سياسة الحجز في قاعدة البيانات');
        } finally {
            setIsSavingPolicy(false);
        }
    };

    const handleConfirmBooking = async (b: DBBooking) => {
        try {
            const { confirmedBooking, cancelledIds } = await confirmBookingAndResolveConflicts(b.id, true);
            toast.success(
                `تم تأكيد حجز ${b.customer_name} بنجاح! وتم قفل الموعد في الموقع ${
                    cancelledIds.length > 0 ? `(تم إلغاء ${cancelledIds.length} طلب متنافس تلقائياً)` : ''
                } 🔒`
            );
            setBookings(prev =>
                prev.map(item => {
                    if (item.id === confirmedBooking.id) {
                        return confirmedBooking;
                    }
                    if (cancelledIds.includes(item.id)) {
                        return {
                            ...item,
                            status: 'cancelled',
                            notes: (item.notes ? item.notes + ' | ' : '') + `تم الإلغاء لتأكيد الحجز المتنافس #${confirmedBooking.reservation_id}`,
                        };
                    }
                    return item;
                })
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء تأكيد الحجز';
            toast.error(msg);
        }
    };

    // Calculate overlapping pending bookings
    const conflictGroups = useMemo(() => {
        return groupConflictingPendingBookings(bookings);
    }, [bookings]);

    const conflictingBookingIds = useMemo(() => {
        const set = new Set<string>();
        conflictGroups.forEach(g => g.bookings.forEach(b => set.add(b.id)));
        return set;
    }, [conflictGroups]);

    const toggleConflictGroup = (groupId: string) => {
        setExpandedConflictIds(prev => ({
            ...prev,
            [groupId]: prev[groupId] === undefined ? false : !prev[groupId]
        }));
    };

    const handleStatusChange = async (id: string, newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
        try {
            await updateBookingStatus(id, newStatus);
            toast.success('تم تحديث حالة الحجز');
            setBookings(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'تعذر تحديث الحالة';
            toast.error(msg);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`هل أنت متأكد من رغبتك في حذف حجز "${name}"؟`)) return;
        try {
            await deleteBooking(id);
            toast.success('تم حذف الحجز بنجاح');
            setBookings(prev => prev.filter(item => item.id !== id));
        } catch {
            toast.error('تعذر حذف الحجز');
        }
    };

    const openWhatsApp = (b: DBBooking) => {
        let phone = b.customer_phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
            phone = '2' + phone;
        } else if (!phone.startsWith('20')) {
            phone = '20' + phone;
        }
        const text = `أهلاً بحضرتك يا أستاذ ${b.customer_name} 👋\nمعاك إدارة D95 Gaming Lounge 🎮\n\nبخصوص حجزك رقم (${b.reservation_id}):\n📍 الغرفة: ${b.room_name}\n📅 التاريخ: ${b.booking_date}\n⏰ التوقيت: ${b.start_time} - ${b.end_time} (${b.duration_hours} س)\n💰 الإجمالي: ${b.total_amount} ج.م (${b.payment_method === 'instapay' ? 'إنستاباي' : b.payment_method === 'cash' ? 'كاش بالفرع' : 'محفظة'})\n\nتم تأكيد الحجز وجاهزين لاستقبالك! في انتظارك تنورنا.`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    // State for Booking Extension Modal
    const [extendingBooking, setExtendingBooking] = useState<DBBooking | null>(null);
    const [extensionMinutes, setExtensionMinutes] = useState<number>(15);
    const [extraPriceOverride, setExtraPriceOverride] = useState<string>('');
    const [autoShiftConflicting, setAutoShiftConflicting] = useState<boolean>(true);
    const [isSubmittingExtension, setIsSubmittingExtension] = useState<boolean>(false);
    const [recentlyShiftedInfo, setRecentlyShiftedInfo] = useState<{
        extended: DBBooking;
        shifted: DBBooking[];
    } | null>(null);

    // Calculated Extension Preview
    const extensionPreview = extendingBooking
        ? calculateBookingExtensionInfo(extendingBooking, bookings, extensionMinutes)
        : null;

    const effectiveExtraPrice = extraPriceOverride !== ''
        ? Number(extraPriceOverride)
        : (extensionPreview?.suggestedExtraPrice ?? 0);

    const handleConfirmExtension = async () => {
        if (!extendingBooking) return;
        setIsSubmittingExtension(true);
        try {
            const result = await extendBookingAndShiftConflicting(
                extendingBooking.id,
                extensionMinutes,
                effectiveExtraPrice,
                autoShiftConflicting
            );

            toast.success(
                `تم تمديد حجز ${extendingBooking.customer_name} بنجاح! ${
                    result.shiftedBookings.length > 0
                        ? `(تم ترحيل ${result.shiftedBookings.length} حجز تالٍ)`
                        : ''
                }`
            );

            // Update bookings list in place
            setBookings((prev) =>
                prev.map((item) => {
                    if (item.id === result.extendedBooking.id) {
                        return result.extendedBooking;
                    }
                    const shiftedMatch = result.shiftedBookings.find((s) => s.id === item.id);
                    if (shiftedMatch) {
                        return shiftedMatch;
                    }
                    return item;
                })
            );

            if (result.shiftedBookings.length > 0) {
                setRecentlyShiftedInfo({
                    extended: result.extendedBooking,
                    shifted: result.shiftedBookings,
                });
            }

            setExtendingBooking(null);
            setExtraPriceOverride('');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'تعذر تمديد الحجز';
            toast.error(msg);
        } finally {
            setIsSubmittingExtension(false);
        }
    };

    const openWhatsAppShifted = (b: DBBooking) => {
        let phone = b.customer_phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
            phone = '2' + phone;
        } else if (!phone.startsWith('20')) {
            phone = '20' + phone;
        }
        const text = `أهلاً بحضرتك يا أستاذ ${b.customer_name} 👋\nمعاك إدارة D95 Gaming Lounge 🎮\n\nنود إبلاغك بتحديث موعد حجزك رقم (${b.reservation_id}) في (${b.room_name}):\n⏰ الموعد الجديد أصبح: من ${b.start_time} إلى ${b.end_time}\n(تم ترحيل الموعد ربع ساعة لضمان تجهيز الغرفة بأعلى جودة).\n\nبانتظار تشريفك لنا ونتمنى لك وقتاً ممتعاً!`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="space-y-6">
            {/* Booking Policy Mode Selector */}
            <div className="bg-[#140e11]/90 border border-white/10 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                                <span>سياسة وقفل مواعيد الحجز</span>
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-normal">
                                    تحكم مباشر
                                </span>
                            </h3>
                            <p className="text-[11px] text-neutral-400">
                                اختر كيف يتعامل الموقع مع المواعيد عند قيام العملاء بحجز غرف البلايستيشن
                            </p>
                        </div>
                    </div>

                    {isSavingPolicy && (
                        <div className="flex items-center gap-1 text-xs text-amber-400 animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            <span>جاري حفظ السياسة في قاعدة البيانات...</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* System 1: Admin Approval Only */}
                    <button
                        type="button"
                        onClick={() => handlePolicySwitch('admin_approval_only')}
                        disabled={isSavingPolicy}
                        className={`text-right p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                            policy?.mode === 'admin_approval_only'
                                ? 'bg-red-950/40 border-red-500/80 shadow-[0_0_20px_rgba(220,38,38,0.2)] ring-1 ring-red-500/50'
                                : 'bg-[#1c1417]/80 border-white/10 hover:border-white/20 text-neutral-300'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${policy?.mode === 'admin_approval_only' ? 'bg-red-500 text-white' : 'bg-white/5 text-neutral-400'}`}>
                                    <Unlock className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="font-bold text-xs sm:text-sm text-white block">
                                        النظام الأول: الموافقة المسبقة للإدارة
                                    </span>
                                    <span className="text-[10px] text-amber-400 font-mono">
                                        الموعد يظل متاحاً للكل حتى تعتمده
                                    </span>
                                </div>
                            </div>
                            {policy?.mode === 'admin_approval_only' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white shadow">
                                    النشط حالياً
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                            الموعد لا يُقفل على الموقع إلا بعد ضغطك على تأكيد. يمكن لعدة عملاء تقديم طلبات لنفس التوقيت، وستظهر لك هنا للمفاضلة وتأكيد أحدهم.
                        </p>
                    </button>

                    {/* System 2: Temporary 10-Minute Hold */}
                    <button
                        type="button"
                        onClick={() => handlePolicySwitch('temporary_hold')}
                        disabled={isSavingPolicy}
                        className={`text-right p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                            policy?.mode === 'temporary_hold'
                                ? 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/50'
                                : 'bg-[#1c1417]/80 border-white/10 hover:border-white/20 text-neutral-300'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${policy?.mode === 'temporary_hold' ? 'bg-amber-500 text-black' : 'bg-white/5 text-neutral-400'}`}>
                                    <Lock className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="font-bold text-xs sm:text-sm text-white block">
                                        النظام الثاني: قفل مؤقت لمدة 10 دقائق
                                    </span>
                                    <span className="text-[10px] text-emerald-400 font-mono">
                                        حجز فوري ينفك تلقائياً بعد 10 دقائق
                                    </span>
                                </div>
                            </div>
                            {policy?.mode === 'temporary_hold' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black shadow">
                                    النشط حالياً
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                            الموعد يُقفل فوراً في الموقع بمجرد أن يرسل العميل طلبه لمدة 10 دقائق. إذا لم تؤكده خلال الـ 10 دقائق ينفك القفل تلقائياً ويعود متاحاً للعامة.
                        </p>
                    </button>
                </div>
            </div>

            {/* Control Bar: Filters & Actions */}
            <div className="bg-[#140e11]/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="بحث باسم العميل، رقم الهاتف، أو كود الحجز..."
                            className="w-full bg-[#1c1417] border border-white/10 rounded-xl pr-10 pl-3 py-2 text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                    >
                        بحث
                    </button>
                </form>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Status filter pills */}
                    <div className="flex items-center bg-[#1c1417] p-1 rounded-xl border border-white/10 text-xs">
                        {[
                            { id: 'all', label: 'الكل' },
                            { id: 'pending', label: 'معلق ⏳' },
                            { id: 'confirmed', label: 'مؤكد ✅' },
                            { id: 'completed', label: 'مكتمل 🎮' },
                            { id: 'cancelled', label: 'ملغي ❌' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleStatusFilterChange(tab.id)}
                                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                                    statusFilter === tab.id
                                        ? 'bg-red-600 text-white shadow'
                                        : 'text-neutral-400 hover:text-white'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Date filter */}
                    <div className="flex items-center gap-1.5 bg-[#1c1417] px-3 py-1.5 rounded-xl border border-white/10 text-xs text-neutral-300">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateFilterChange(e.target.value)}
                            className="bg-transparent text-white text-xs outline-none cursor-pointer"
                        />
                        {selectedDate && (
                            <button
                                type="button"
                                onClick={() => handleDateFilterChange('')}
                                className="text-neutral-400 hover:text-red-400 font-bold ml-1 text-xs"
                                title="إلغاء فلتر التاريخ"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Room Rates Settings Button */}
                    <button
                        type="button"
                        onClick={() => setShowRatesModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1417] hover:bg-white/10 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer"
                        title="تعديل أسعار ساعات الغرف"
                    >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>تسعير الغرف</span>
                    </button>

                    {/* Refresh */}
                    <button
                        type="button"
                        onClick={() => loadData(page)}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-[#1c1417] hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                        title="تحديث البيانات"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Conflicting Pending Bookings Alert & Dropdown Section */}
            {conflictGroups.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm sm:text-base font-bold text-amber-400 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-400 animate-pulse" />
                            <span>مواعيد بها طلبات حجز متنافسة معلقة ({conflictGroups.length})</span>
                        </h3>
                        <span className="text-[11px] text-neutral-400">
                            اضغط على أي موعد لفتح القائمة المنسدلة للعملاء واختيار الحجز المعتمد
                        </span>
                    </div>

                    <div className="space-y-3">
                        {conflictGroups.map((group) => {
                            const isExpanded = expandedConflictIds[group.id] ?? true;

                            return (
                                <div
                                    key={group.id}
                                    className="bg-[#181114] border-2 border-amber-500/60 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(245,158,11,0.12)] transition-all"
                                >
                                    {/* Accordion / Dropdown Trigger Header */}
                                    <div
                                        onClick={() => toggleConflictGroup(group.id)}
                                        className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/50 via-[#1c1417] to-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-amber-950/70 transition-colors select-none"
                                    >
                                        <div className="flex items-start sm:items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-white text-sm sm:text-base">
                                                        {group.roomName}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded bg-white/10 text-neutral-300 font-mono text-xs">
                                                        📅 {group.bookingDate}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs border border-amber-500/40">
                                                        ⏰ {group.formattedTimeRange}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-amber-300/90 mt-1 flex items-center gap-1.5">
                                                    <span>⚠️ يوجد {group.bookings.length} عملاء طلبوا حجز هذا الموعد ولم يتم اعتماد أي منهم بعد.</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 self-end sm:self-center">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-black shadow">
                                                {group.bookings.length} طلبات متنافسة
                                            </span>
                                            <div className="p-1.5 rounded-lg bg-white/5 text-neutral-300">
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Collapsible Content: Competing bookings list */}
                                    {isExpanded && (
                                        <div className="p-4 sm:p-5 border-t border-amber-500/20 bg-[#120c0f] space-y-3">
                                            <div className="text-xs text-neutral-400 bg-amber-950/30 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
                                                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                                <span>
                                                    الطلبات مرتبة حسب أسبقية الإرسال. عند النقر على <strong>"تأكيد واعتماد هذا الحجز"</strong>، سيتم اعتماد الحجز المختار فوراً وقفل الموعد في الموقع لصالحه، وإلغاء الطلب المتنافس الآخر تلقائياً مع إمكانية مراسلته عبر واتساب لاقتراح موعد بديل.
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                                {group.bookings.map((b, idx) => {
                                                    const isFirst = idx === 0;
                                                    const timeAgo = formatTimeAgo(b.created_at);

                                                    return (
                                                        <div
                                                            key={b.id}
                                                            className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                                                                isFirst
                                                                    ? 'bg-amber-950/20 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                                                                    : 'bg-[#181114] border-white/10 hover:border-white/20'
                                                            }`}
                                                        >
                                                            {/* Card Top */}
                                                            <div>
                                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                                                        isFirst
                                                                            ? 'bg-amber-500 text-black'
                                                                            : 'bg-white/10 text-neutral-300'
                                                                    }`}>
                                                                        {isFirst ? '🥇 العميل الأول (الأسبق)' : `🥈 متنافس #${idx + 1}`}
                                                                    </span>
                                                                    <span className="text-[10px] text-neutral-400 font-mono">
                                                                        {timeAgo}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-start justify-between">
                                                                    <div>
                                                                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                                                            <User className="w-4 h-4 text-red-400 shrink-0" />
                                                                            <span>{b.customer_name}</span>
                                                                        </h4>
                                                                        <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400 font-mono">
                                                                            <Phone className="w-3.5 h-3.5 text-neutral-500" />
                                                                            <span dir="ltr">{b.customer_phone}</span>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-[11px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded">
                                                                        #{b.reservation_id}
                                                                    </span>
                                                                </div>

                                                                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                                                                    <span className="text-neutral-400">
                                                                        ⏰ {b.start_time} - {b.end_time} ({b.duration_hours} س)
                                                                    </span>
                                                                    <span className="text-emerald-400 font-bold font-mono">
                                                                        {b.total_amount} ج.م
                                                                    </span>
                                                                </div>

                                                                {b.notes && (
                                                                    <div className="mt-2 text-[11px] bg-white/5 text-neutral-300 p-2 rounded-lg">
                                                                        <strong>ملاحظة العميل:</strong> {b.notes}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Action Buttons */}
                                                            <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleConfirmBooking(b)}
                                                                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                                                                >
                                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                                    <span>تأكيد واعتماد هذا الحجز</span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => openWhatsApp(b)}
                                                                    className="p-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-400 transition-colors cursor-pointer"
                                                                    title="مراسلة عبر واتساب"
                                                                >
                                                                    <MessageCircle className="w-4 h-4" />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStatusChange(b.id, 'cancelled')}
                                                                    className="p-2 rounded-xl bg-red-950/50 hover:bg-red-900 border border-red-500/40 text-red-400 transition-colors cursor-pointer"
                                                                    title="إلغاء هذا الطلب"
                                                                >
                                                                    <XCircle className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Bookings Count Summary */}
            <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                <span>
                    إجمالي الحجوزات المعروضة: <strong className="text-white font-bold">{bookings.length}</strong> حجز
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>تحديث حي لقاعدة البيانات</span>
                </span>
            </div>

            {/* Bookings Cards Grid */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
                    <span className="text-sm">جاري تحميل الحجوزات...</span>
                </div>
            ) : bookings.length === 0 ? (
                <div className="bg-[#140e11]/60 border border-dashed border-white/15 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                    <Layers className="w-12 h-12 text-neutral-600" />
                    <h3 className="text-base font-bold text-white">لا توجد حجوزات مطابقة</h3>
                    <p className="text-xs text-neutral-400 max-w-sm">
                        لم يتم العثور على أي حجز وفقاً للخيارات المحددة. الحجوزات الجديدة من الموقع ستظهر هنا تلقائياً فور إرسالها.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bookings.map((b) => {
                        const isPending = b.status === 'pending';
                        const isConfirmed = b.status === 'confirmed';
                        const isCancelled = b.status === 'cancelled';
                        const isCompleted = b.status === 'completed';

                        const { start: bStart, end: bEnd } = getBookingDates(b);
                        const nowMs = Date.now();
                        const isEnded = bEnd.getTime() <= nowMs;
                        const isStarted = bStart.getTime() <= nowMs;
                        const isOngoing = isStarted && !isEnded;
                        const isUpcoming = !isStarted;

                        return (
                            <div
                                key={b.id}
                                className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all backdrop-blur-md bg-[#140e11]/95 ${
                                    isPending
                                        ? isEnded
                                            ? 'border-neutral-700 opacity-75'
                                            : 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                                        : isConfirmed
                                        ? isOngoing
                                            ? 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                                            : isEnded
                                            ? 'border-neutral-800'
                                            : 'border-emerald-500/40'
                                        : isCancelled
                                        ? 'border-red-500/20 opacity-70'
                                        : 'border-white/10'
                                }`}
                            >
                                {/* Card Header */}
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="text-[11px] font-mono text-neutral-400 block">
                                                #{b.reservation_id}
                                            </span>
                                            <h3 className="text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
                                                <User className="w-4 h-4 text-red-500 shrink-0" />
                                                <span className="truncate">{b.customer_name}</span>
                                            </h3>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="shrink-0 text-left">
                                            {isPending && (
                                                <div className="flex flex-col items-end gap-1">
                                                    {isEnded || bStart.getTime() <= nowMs - 5 * 60 * 1000 ? (
                                                        <>
                                                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-950/80 text-red-300 border border-red-500/40 flex items-center gap-1">
                                                                <span>فات موعده</span>
                                                                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                                                            </span>
                                                            <span className="text-[10px] text-neutral-500 font-mono">
                                                                طلب غير مؤكد
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                                                                <span>طلب معلق</span>
                                                                <span>⏳</span>
                                                            </span>
                                                            {conflictingBookingIds.has(b.id) && (
                                                                <span className="text-[10px] text-red-300 font-bold bg-red-950/70 px-1.5 py-0.5 rounded border border-red-500/40 animate-pulse">
                                                                    ⚠️ متنافس على الموعد
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-amber-400/90 font-mono bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/20">
                                                                {policy?.mode === 'admin_approval_only'
                                                                    ? 'الموعد متاح حتى تعتمده'
                                                                    : 'قفل مؤقت 10 د'}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                            {isConfirmed && (
                                                <div className="flex flex-col items-end gap-1">
                                                    {isOngoing ? (
                                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                                            <span>جاري اللعب الآن 🎮</span>
                                                        </span>
                                                    ) : isEnded ? (
                                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-800 text-neutral-400 border border-white/10 flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5 text-neutral-500" />
                                                            <span>انتهى الموعد ⌛</span>
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                                                            <span>مؤكد وقافل للموعد</span>
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {isCompleted && (
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                                    مكتمل 🎮
                                                </span>
                                            )}
                                            {isCancelled && (
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
                                                    <span>ملغي</span>
                                                    <XCircle className="w-3.5 h-3.5" />
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Phone number */}
                                    <div className="flex items-center gap-2 text-xs text-neutral-300 font-mono">
                                        <Phone className="w-3.5 h-3.5 text-neutral-400" />
                                        <span dir="ltr">{b.customer_phone}</span>
                                    </div>

                                    {/* Booking Details Grid */}
                                    <div className="bg-[#1c1417]/80 rounded-xl p-3 border border-white/5 space-y-2 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="text-neutral-400">الغرفة:</span>
                                            <span className="font-bold text-white">{b.room_name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-neutral-400">التاريخ:</span>
                                            <span className="font-bold text-white">{b.booking_date}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-neutral-400">التوقيت:</span>
                                            <span className="font-bold text-red-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{b.start_time} - {b.end_time} ({b.duration_hours} س)</span>
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pt-1.5 border-t border-white/10">
                                            <span className="text-neutral-400">طريقة الدفع:</span>
                                            <span className="font-semibold text-neutral-200 flex items-center gap-1">
                                                <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>
                                                    {b.payment_method === 'instapay'
                                                        ? 'إنستاباي'
                                                        : b.payment_method === 'cash'
                                                        ? 'كاش بالفرع'
                                                        : 'محفظة إلكترونية'}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-neutral-400">المبلغ المطلوب:</span>
                                            <span className="font-bold text-emerald-400 text-sm">{b.total_amount} ج.م</span>
                                        </div>
                                    </div>

                                    {/* Snacks or Notes if any */}
                                    {b.snacks && b.snacks.length > 0 && (
                                        <div className="bg-[#1c1417]/40 rounded-xl p-2.5 border border-white/5 text-[11px] text-neutral-300">
                                            <div className="flex items-center gap-1 text-neutral-400 font-semibold mb-1">
                                                <Coffee className="w-3 h-3 text-red-400" />
                                                <span>سناكس مضافة:</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {b.snacks.map((s, idx) => (
                                                    <span key={idx} className="bg-white/5 px-2 py-0.5 rounded text-neutral-200">
                                                        {s.name} ({s.price} ج.م)
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {b.notes && (
                                        <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-2 text-[11px] text-amber-200">
                                            <span className="font-bold">ملاحظة العميل:</span> {b.notes}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2 pt-3 border-t border-white/10">
                                    {/* Action Buttons */}
                                    {isPending && (
                                        isEnded || bStart.getTime() <= nowMs - 5 * 60 * 1000 ? (
                                            <div className="w-full py-2 px-3 rounded-xl bg-neutral-900 border border-white/10 text-neutral-400 text-xs text-center font-medium flex items-center justify-center gap-1.5">
                                                <AlertCircle className="w-3.5 h-3.5 text-neutral-500" />
                                                <span>فات موعد هذا الحجز ولا يمكن تأكيده في الماضي</span>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleConfirmBooking(b)}
                                                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                                            >
                                                <Check className="w-4 h-4 stroke-[3]" />
                                                <span>تأكيد الحجز فوراً</span>
                                            </button>
                                        )
                                    )}

                                    {/* Action Buttons for Confirmed Bookings */}
                                    {isConfirmed && (
                                        isEnded ? (
                                            <button
                                                type="button"
                                                onClick={() => handleStatusChange(b.id, 'completed')}
                                                className="w-full py-2.5 px-3 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                                                <span>تسجيل الجلسة كمكتملة (Mark as Completed) ✅</span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setExtendingBooking(b);
                                                    setExtensionMinutes(15);
                                                    setExtraPriceOverride('');
                                                    setAutoShiftConflicting(true);
                                                }}
                                                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] ${
                                                    isOngoing
                                                        ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400/40 shadow-md shadow-purple-900/30'
                                                        : 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30'
                                                }`}
                                            >
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>
                                                    {isOngoing ? 'تمديد الجلسة الحالية (+15 دقيقة) ⏱️' : 'تمديد مدة الحجز (+15 دقيقة) ⏱️'}
                                                </span>
                                            </button>
                                        )
                                    )}

                                    <div className="flex items-center gap-2">
                                        {/* WhatsApp Quick Message */}
                                        <button
                                            type="button"
                                            onClick={() => openWhatsApp(b)}
                                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                            title="إرسال رسالة واتساب للعميل"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            <span>واتساب</span>
                                        </button>

                                        {/* Change Status Select */}
                                        <select
                                            value={b.status}
                                            onChange={(e) => handleStatusChange(b.id, e.target.value as 'pending' | 'confirmed' | 'cancelled' | 'completed')}
                                            className="bg-[#1c1417] text-white text-xs border border-white/10 rounded-xl px-2.5 py-2 outline-none cursor-pointer"
                                        >
                                            <option value="pending">معلق</option>
                                            <option value="confirmed">مؤكد</option>
                                            <option value="completed">مكتمل</option>
                                            <option value="cancelled">ملغي</option>
                                        </select>

                                        {/* Delete */}
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(b.id, b.customer_name)}
                                            className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                                            title="حذف الحجز"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="bg-[#140e11]/90 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="text-neutral-400">
                        عرض الصفحة <strong className="text-white font-bold">{page}</strong> من إجمالي <strong className="text-white font-bold">{totalPages}</strong> صفحة (إجمالي <strong className="text-white font-bold">{totalCount}</strong> حجز)
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            disabled={page <= 1 || loading}
                            className="px-3.5 py-2 rounded-xl bg-[#1c1417] hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                            <span>الصفحة السابقة</span>
                        </button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum = page - 2 + i;
                                if (pageNum < 1) pageNum = i + 1;
                                if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                                if (pageNum < 1 || pageNum > totalPages) return null;

                                return (
                                    <button
                                        key={pageNum}
                                        type="button"
                                        onClick={() => setPage(pageNum)}
                                        className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                                            page === pageNum
                                                ? 'bg-red-600 text-white shadow'
                                                : 'bg-[#1c1417] text-neutral-400 hover:text-white border border-white/10'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={page >= totalPages || loading}
                            className="px-3.5 py-2 rounded-xl bg-[#1c1417] hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                        >
                            <span>الصفحة التالية</span>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ROOM RATES CONFIGURATION MODAL */}
            {showRatesModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
                    onClick={() => setShowRatesModal(false)}
                >
                    <div
                        className="relative w-full max-w-md rounded-2xl bg-[#140e11] border border-white/15 shadow-2xl p-5 sm:p-6 text-white space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">تسعير ساعات الغرف (VIP)</h3>
                                    <p className="text-xs text-neutral-400">تعديل سعر الساعة للغرف في قاعدة البيانات</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowRatesModal(false)}
                                className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 py-2">
                            <div>
                                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                                    سعر ساعة الغرفة 01 (الغرفة الخضراء / VIP):
                                </label>
                                <div className="flex items-center bg-[#1c1417] border border-white/10 rounded-xl px-3 py-2.5">
                                    <input
                                        type="number"
                                        min="1"
                                        value={rateRoom1}
                                        onChange={(e) => setRateRoom1(Number(e.target.value))}
                                        className="bg-transparent text-white font-mono font-bold text-sm w-full outline-none"
                                    />
                                    <span className="text-neutral-400 text-xs font-bold">ج.م / ساعة</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                                    سعر ساعة الغرفة 02 (الغرفة الحمراء / VIP):
                                </label>
                                <div className="flex items-center bg-[#1c1417] border border-white/10 rounded-xl px-3 py-2.5">
                                    <input
                                        type="number"
                                        min="1"
                                        value={rateRoom2}
                                        onChange={(e) => setRateRoom2(Number(e.target.value))}
                                        className="bg-transparent text-white font-mono font-bold text-sm w-full outline-none"
                                    />
                                    <span className="text-neutral-400 text-xs font-bold">ج.م / ساعة</span>
                                </div>
                            </div>

                            <p className="text-[11px] text-neutral-400 bg-amber-950/20 border border-amber-500/20 rounded-xl p-2.5">
                                💡 الأسعار المسجلة هنا يتم تطبيقها تلقائياً على أي حجز جديد يقوم به العملاء من الموقع، ويتم حسابها في قاعدة البيانات فورياً.
                            </p>
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => setShowRatesModal(false)}
                                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-bold cursor-pointer"
                            >
                                إلغاء
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveRoomRates}
                                disabled={isSavingRates}
                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-900/30 cursor-pointer disabled:opacity-50"
                            >
                                {isSavingRates && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                <span>حفظ وتطبيق السعر</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 1. EXTEND BOOKING MODAL */}
            {extendingBooking && extensionPreview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
                    onClick={() => setExtendingBooking(null)}
                >
                    <div
                        className="relative w-full max-w-lg rounded-2xl bg-[#140e11] border border-white/15 shadow-2xl p-5 sm:p-6 text-white space-y-4 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between pb-3 border-b border-white/10">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                        <Clock className="w-4 h-4" />
                                    </span>
                                    <h3 className="text-base font-bold text-white">
                                        تمديد حجز العميل: {extendingBooking.customer_name}
                                    </h3>
                                </div>
                                <p className="text-xs text-neutral-400 mt-1">
                                    {extendingBooking.room_name} • كود #{extendingBooking.reservation_id}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setExtendingBooking(null)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Current Booking Overview */}
                        <div className="bg-[#1c1417] p-3 rounded-xl border border-white/5 grid grid-cols-3 gap-2 text-center text-xs">
                            <div>
                                <span className="text-neutral-400 block text-[11px]">الموعد الحالي:</span>
                                <span className="font-bold text-white font-mono mt-0.5 block">{extendingBooking.start_time} - {extendingBooking.end_time}</span>
                            </div>
                            <div>
                                <span className="text-neutral-400 block text-[11px]">المدة الحالية:</span>
                                <span className="font-bold text-purple-300 mt-0.5 block">{extendingBooking.duration_hours} ساعة</span>
                            </div>
                            <div>
                                <span className="text-neutral-400 block text-[11px]">المبلغ الحالي:</span>
                                <span className="font-bold text-emerald-400 mt-0.5 block">{extendingBooking.total_amount} ج.م</span>
                            </div>
                        </div>

                        {/* Extension Duration Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
                                <span>مقدار التمديد المطلوب:</span>
                                <span className="text-purple-400 font-mono">+{extensionMinutes} دقيقة</span>
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[15, 30, 45, 60].map((mins) => (
                                    <button
                                        key={mins}
                                        type="button"
                                        onClick={() => {
                                            setExtensionMinutes(mins);
                                            setExtraPriceOverride('');
                                        }}
                                        className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                            extensionMinutes === mins
                                                ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30'
                                                : 'bg-[#1c1417] border-white/10 text-neutral-300 hover:bg-white/10'
                                        }`}
                                    >
                                        +{mins} دقيقة
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Summary of Changes */}
                        <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-3.5 space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-neutral-300">وقت الانتهاء الجديد:</span>
                                <span className="font-bold text-white font-mono text-sm flex items-center gap-1.5" dir="ltr">
                                    <span className="text-neutral-400 line-through text-xs">{extendingBooking.end_time}</span>
                                    <span>➔</span>
                                    <span className="text-purple-300 font-black">{extensionPreview.newEndTimeStr}</span>
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-neutral-300">المدة الكلية بعد الزيادة:</span>
                                <span className="font-bold text-white font-mono">{extensionPreview.newDurationHours} ساعة</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-purple-500/20">
                                <span className="text-neutral-300">مبلغ التمديد الإضافي:</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        value={extraPriceOverride !== '' ? extraPriceOverride : extensionPreview.suggestedExtraPrice}
                                        onChange={(e) => setExtraPriceOverride(e.target.value)}
                                        className="w-20 bg-[#140e11] border border-white/15 rounded-lg px-2 py-1 text-center font-bold text-emerald-400 text-xs outline-none focus:border-emerald-500"
                                    />
                                    <span className="text-neutral-400 text-[11px]">ج.م</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-neutral-400">
                                <span>الإجمالي الجديد للحجز:</span>
                                <strong className="text-emerald-400 font-mono text-xs">
                                    {extendingBooking.total_amount + effectiveExtraPrice} ج.م
                                </strong>
                            </div>
                        </div>

                        {/* Past-Time Alert / Conflict & Shift Detection Alert */}
                        {extensionPreview.isNewEndPast ? (
                            <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-3.5 space-y-1.5 text-xs text-red-200">
                                <div className="flex items-center gap-2 font-bold text-red-300">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                                    <span>لا يمكن التمديد: وقت الانتهاء المقترح يقع في الماضي بالفعل!</span>
                                </div>
                                <p className="text-[11px] text-neutral-300">
                                    وقت الانتهاء بعد التمديد هو <strong className="text-white font-mono">{extensionPreview.newEndTimeStr}</strong>، بينما الوقت الحالي تجاوز هذا الموعد. لا يمكن تمديد حجز انتهى وقته في الماضي.
                                </p>
                            </div>
                        ) : extensionPreview.conflictingBookings.length > 0 ? (
                            <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3.5 space-y-2 text-xs">
                                <div className="flex items-center gap-2 text-amber-300 font-bold">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                                    <span>تنبيه: التمديد يتعارض مع حجز تالٍ في نفس الغرفة!</span>
                                </div>
                                <p className="text-[11px] text-neutral-300">
                                    الحجز التالي يبدأ قبل انتهاء الموعد الممدد. يمكنك ترحيله تلقائياً لتفادي أي تداخل:
                                </p>
                                <div className="space-y-1.5 pt-1">
                                    {extensionPreview.conflictingBookings.map((conf, idx) => (
                                        <div key={idx} className="bg-black/40 p-2.5 rounded-lg border border-amber-500/20 flex items-center justify-between gap-2">
                                            <div>
                                                <span className="font-bold text-white block">
                                                    العميل: {conf.booking.customer_name}
                                                </span>
                                                <span className="text-[10px] text-neutral-400 block mt-0.5">
                                                    كود #{conf.booking.reservation_id} • هاتف: {conf.booking.customer_phone}
                                                </span>
                                            </div>
                                            <div className="text-right text-[11px]">
                                                <span className="text-neutral-400 block line-through">{conf.booking.start_time} - {conf.booking.end_time}</span>
                                                <span className="text-emerald-400 font-bold block">
                                                    ➔ {conf.shiftedStartTimeStr} - {conf.shiftedEndTimeStr}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <label className="flex items-center gap-2 pt-2 border-t border-amber-500/20 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={autoShiftConflicting}
                                        onChange={(e) => setAutoShiftConflicting(e.target.checked)}
                                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-white/20 bg-[#1c1417] cursor-pointer"
                                    />
                                    <span className="font-bold text-white text-xs">
                                        ترحيل الحجز التالي تلقائياً بمقدار {extensionMinutes} دقيقة لمنع التعارض
                                    </span>
                                </label>
                            </div>
                        ) : (
                            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-300">
                                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                                <span>لا يوجد أي تعارض مع أي حجز تالٍ. يمكنك التمديد مباشرة.</span>
                            </div>
                        )}

                        {extensionPreview.exceedsClosing && (
                            <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-3 flex items-center gap-2 text-xs text-red-300">
                                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                                <span>تنبيه: وقت الانتهاء يتجاوز موعد إغلاق الصالة (04:00 ص فجراً).</span>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => setExtendingBooking(null)}
                                disabled={isSubmittingExtension}
                                className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/10 text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
                            >
                                إلغاء
                            </button>
                            <button
                                type="button"
                                disabled={
                                    isSubmittingExtension ||
                                    extensionPreview.isNewEndPast ||
                                    extensionPreview.exceedsClosing ||
                                    (extensionPreview.conflictingBookings.length > 0 && !autoShiftConflicting)
                                }
                                onClick={handleConfirmExtension}
                                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                    extensionPreview.isNewEndPast ||
                                    extensionPreview.exceedsClosing ||
                                    (extensionPreview.conflictingBookings.length > 0 && !autoShiftConflicting)
                                        ? 'bg-neutral-800 text-neutral-500 border border-white/5 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 active:scale-98 cursor-pointer'
                                }`}
                            >
                                {isSubmittingExtension ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                <span>
                                    {extensionPreview.isNewEndPast
                                        ? 'غير متاح (الوقت انقضى بالفعل)'
                                        : extensionPreview.conflictingBookings.length > 0 && autoShiftConflicting
                                        ? `تأكيد التمديد وترحيل الحجز التالي (${extensionPreview.conflictingBookings.length})`
                                        : `تأكيد تمديد الحجز (+${extensionMinutes} دقيقة)`}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. SHIFTED BOOKINGS NOTIFICATION & WHATSAPP PROMPT */}
            {recentlyShiftedInfo && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
                    onClick={() => setRecentlyShiftedInfo(null)}
                >
                    <div
                        className="relative w-full max-w-md rounded-2xl bg-[#140e11] border border-white/15 shadow-2xl p-5 text-white space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    <CheckCircle2 className="w-4 h-4" />
                                </span>
                                <h3 className="text-base font-bold text-white">
                                    تم التمديد والترحيل بنجاح!
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRecentlyShiftedInfo(null)}
                                className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-xs text-neutral-300">
                            تم تمديد حجز <strong>{recentlyShiftedInfo.extended.customer_name}</strong>، وتم ترحيل الحجز التالي تلقائياً في قاعدة البيانات:
                        </p>

                        <div className="space-y-2">
                            {recentlyShiftedInfo.shifted.map((b) => (
                                <div key={b.id} className="bg-[#1c1417] p-3 rounded-xl border border-white/10 flex items-center justify-between gap-2 text-xs">
                                    <div>
                                        <span className="font-bold text-white block">{b.customer_name}</span>
                                        <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">
                                            الموعد الجديد: {b.start_time} - {b.end_time}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openWhatsAppShifted(b)}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                                    >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span>إشعار واتساب</span>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => setRecentlyShiftedInfo(null)}
                            className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                            إغلاق
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
