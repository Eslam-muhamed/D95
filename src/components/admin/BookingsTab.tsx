import { useState, useEffect, useCallback } from 'react';
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
    Coffee
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchBookings, updateBookingStatus, deleteBooking } from '@/services/bookingService';
import type { DBBooking } from '@/types/database';

export default function BookingsTab() {
    const [bookings, setBookings] = useState<DBBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedDate, setSelectedDate] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchBookings({
                status: statusFilter !== 'all' ? statusFilter : undefined,
                date: selectedDate || undefined,
                search: search || undefined
            });
            setBookings(data);
        } catch {
            toast.error('تعذر جلب قائمة الحجوزات');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, selectedDate, search]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loadData();
    };

    const handleConfirmBooking = async (b: DBBooking) => {
        try {
            await updateBookingStatus(b.id, 'confirmed');
            toast.success(`تم تأكيد حجز ${b.customer_name} بنجاح!`);
            setBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'confirmed' } : item));
        } catch {
            toast.error('حدث خطأ أثناء تأكيد الحجز');
        }
    };

    const handleStatusChange = async (id: string, newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
        try {
            await updateBookingStatus(id, newStatus);
            toast.success('تم تحديث حالة الحجز');
            setBookings(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
        } catch {
            toast.error('تعذر تحديث الحالة');
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

    return (
        <div className="space-y-6">
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
                                onClick={() => setStatusFilter(tab.id)}
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
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-white text-xs outline-none cursor-pointer"
                        />
                        {selectedDate && (
                            <button
                                type="button"
                                onClick={() => setSelectedDate('')}
                                className="text-neutral-400 hover:text-red-400 font-bold ml-1 text-xs"
                                title="إلغاء فلتر التاريخ"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Refresh */}
                    <button
                        type="button"
                        onClick={loadData}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-[#1c1417] hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                        title="تحديث البيانات"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : ''}`} />
                    </button>
                </div>
            </div>

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

                        return (
                            <div
                                key={b.id}
                                className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all backdrop-blur-md bg-[#140e11]/95 ${
                                    isPending
                                        ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                                        : isConfirmed
                                        ? 'border-emerald-500/40'
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
                                        <div className="shrink-0">
                                            {isPending && (
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                                                    <span>معلق</span>
                                                    <span>⏳</span>
                                                </span>
                                            )}
                                            {isConfirmed && (
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                                    <span>مؤكد</span>
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                </span>
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
                                    {/* Instant Confirm Button (if pending) */}
                                    {isPending && (
                                        <button
                                            type="button"
                                            onClick={() => handleConfirmBooking(b)}
                                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                                        >
                                            <Check className="w-4 h-4 stroke-[3]" />
                                            <span>تأكيد الحجز فوراً</span>
                                        </button>
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
        </div>
    );
}
