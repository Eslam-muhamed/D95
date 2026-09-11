import { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    CheckCircle2,
    Users,
    Utensils,
    Flame,
    ArrowUpRight,
    Check,
    Phone,
    Gamepad2,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchBookingMetrics, updateBookingStatus, getBookingDates } from '@/services/bookingService';
import { fetchProducts, fetchOffers } from '@/services/menuService';
import type { DBBooking } from '@/types/database';
import BookingDetailsModal from './BookingDetailsModal';

interface OverviewTabProps {
    onSwitchTab: (
        tab: 'daily_schedule' | 'bookings' | 'products' | 'categories' | 'offers',
        filter?: { status?: string; date?: string }
    ) => void;
}

export default function OverviewTab({ onSwitchTab }: OverviewTabProps) {
    const [loading, setLoading] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [confirmedCount, setConfirmedCount] = useState(0);
    const [todayCount, setTodayCount] = useState(0);
    const [recentBookings, setRecentBookings] = useState<DBBooking[]>([]);
    const [productCount, setProductCount] = useState(0);
    const [offerCount, setOfferCount] = useState(0);
    const [selectedDetailBooking, setSelectedDetailBooking] = useState<DBBooking | null>(null);

    const loadMetrics = async () => {
        setLoading(true);
        try {
            const [bMetrics, pData, oData] = await Promise.all([
                fetchBookingMetrics(),
                fetchProducts('all'),
                fetchOffers()
            ]);
            setPendingCount(bMetrics.pendingCount);
            setConfirmedCount(bMetrics.confirmedCount);
            setTodayCount(bMetrics.todayCount);
            setRecentBookings(bMetrics.recentPending);
            setProductCount(pData.length);
            setOfferCount(oData.filter(o => o.is_active).length);
        } catch {
            toast.error('تعذر جلب بيانات النظرة العامة');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMetrics();
    }, []);

    const handleQuickConfirm = async (b: DBBooking) => {
        const { end } = getBookingDates(b);
        if (end.getTime() <= Date.now()) {
            toast.error('لا يمكن تأكيد هذا الحجز لأن موعده قد انتهى بالفعل');
            return;
        }
        try {
            await updateBookingStatus(b.id, 'confirmed');
            toast.success(`تم تأكيد حجز ${b.customer_name}!`);
            setRecentBookings(prev => prev.filter(item => item.id !== b.id));
            setPendingCount(prev => Math.max(0, prev - 1));
            setConfirmedCount(prev => prev + 1);
        } catch {
            toast.error('تعذر تأكيد الحجز');
        }
    };

    return (
        <div className="space-y-6">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Pending Bookings (Urgent) */}
                <div
                    onClick={() => onSwitchTab('bookings', { status: 'pending' })}
                    className="bg-gradient-to-br from-[#1c1214] to-[#140e11] border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-5 shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02] group"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400">حجوزات بانتظار التأكيد</span>
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between">
                        <span className="font-bebas text-5xl font-black text-white tracking-wider">
                            {pendingCount}
                        </span>
                        <span className="text-xs text-amber-400/80 flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform font-bold">
                            <span>مراجعة الآن</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                    </div>
                </div>

                {/* 2. Confirmed & Active Bookings */}
                <div
                    onClick={() => onSwitchTab('bookings', { status: 'confirmed' })}
                    className="bg-[#140e11]/90 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-5 shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02] group"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">حجوزات مؤكدة (جدول اليوم)</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Gamepad2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between">
                        <span className="font-bebas text-5xl font-black text-white tracking-wider">
                            {confirmedCount}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSwitchTab('daily_schedule');
                            }}
                            className="text-xs text-emerald-400/90 hover:text-emerald-300 flex items-center gap-1 group-hover:translate-x-[-2px] transition-all font-bold cursor-pointer"
                        >
                            <span>{todayCount} اليوم • فتح الجدول</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* 3. Products in Menu */}
                <div
                    onClick={() => onSwitchTab('products')}
                    className="bg-[#140e11]/90 border border-white/10 hover:border-white/20 rounded-2xl p-5 shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02] group"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-300">أصناف المنيو النشطة</span>
                        <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                            <Utensils className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between">
                        <span className="font-bebas text-5xl font-black text-white tracking-wider">
                            {productCount}
                        </span>
                        <span className="text-xs text-red-400/80 flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform font-bold">
                            <span>إدارة المنتجات</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                    </div>
                </div>

                {/* 4. Active Offers */}
                <div
                    onClick={() => onSwitchTab('offers')}
                    className="bg-[#140e11]/90 border border-white/10 hover:border-white/20 rounded-2xl p-5 shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02] group"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-300">العروض الترويجية الحية</span>
                        <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center">
                            <Flame className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between">
                        <span className="font-bebas text-5xl font-black text-white tracking-wider">
                            {offerCount}
                        </span>
                        <span className="text-xs text-red-400/80 flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform font-bold">
                            <span>تعديل العروض</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Access to Daily Schedule Timeline */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-[#181114] to-[#140e11] border border-emerald-500/30 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">جدول مواعيد اليوم التفاعلي (Timeline)</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                                {todayCount} حجز مسجل اليوم
                            </span>
                        </div>
                        <p className="text-xs text-neutral-300 mt-0.5">
                            متابعة شاملة لجميع عملاء اليوم بالاسم ورقم الهاتف والميعاد مع استعراض التفاصيل الكاملة بضغطة واحدة.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onSwitchTab('daily_schedule')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-900/30 shrink-0"
                >
                    <span>فتح جدول مواعيد اليوم</span>
                    <ArrowUpRight className="w-4 h-4" />
                </button>
            </div>

            {/* Recent Bookings Attention Section */}
            <div className="bg-[#140e11]/90 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-500" />
                            <span>أحدث طلبات الحجز بانتظار التأكيد</span>
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                            آخر الحجوزات الواردة التي تتطلب مراجعة واعتماد الصالة. اضغط على أي حجز لعرض تفاصيله الكاملة.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={loadMetrics}
                            disabled={loading}
                            className="p-2 rounded-xl bg-[#1c1417] hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                            title="تحديث"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-500' : ''}`} />
                        </button>

                        <button
                            type="button"
                            onClick={() => onSwitchTab('bookings')}
                            className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                            <span>عرض جميع الحجوزات</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-12 flex justify-center text-neutral-400">
                        <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
                    </div>
                ) : recentBookings.length === 0 ? (
                    <div className="py-10 text-center text-xs text-neutral-400 border border-dashed border-white/10 rounded-xl">
                        لا توجد طلبات حجز معلقة حالياً. جميع الحجوزات مستقرة.
                    </div>
                ) : (
                    <>
                        {/* Mobile Cards View (Visible on sm:hidden) */}
                        <div className="sm:hidden space-y-3">
                            {recentBookings.map((b) => {
                                const { end } = getBookingDates(b);
                                const isPast = end.getTime() <= Date.now();
                                return (
                                    <div
                                        key={b.id}
                                        onClick={() => setSelectedDetailBooking(b)}
                                        className="bg-[#181114] border border-white/10 hover:border-white/20 rounded-2xl p-4 space-y-3 cursor-pointer transition-all active:scale-[0.99]"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="text-[10px] font-mono text-neutral-400 block">#{b.reservation_id}</span>
                                                <h4 className="text-sm font-bold text-white mt-0.5">{b.customer_name}</h4>
                                                <span className="text-xs text-neutral-400 font-mono" dir="ltr">{b.customer_phone}</span>
                                            </div>
                                            <div>
                                                {b.status === 'pending' && (
                                                    isPast ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
                                                            فات موعده ⌛
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                                                            معلق ⏳
                                                        </span>
                                                    )
                                                )}
                                                {b.status === 'confirmed' && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                        مؤكد ✅
                                                    </span>
                                                )}
                                                {b.status === 'completed' && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                        مكتمل 🎮
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-[#120d0f] rounded-xl p-2.5 flex items-center justify-between text-xs border border-white/5">
                                            <div>
                                                <span className="text-neutral-400 block text-[10px]">الموعد والغرفة:</span>
                                                <span className="text-white font-bold">{b.room_name}</span>
                                                <span className="text-red-400 font-mono text-[11px] block">{b.start_time} - {b.end_time}</span>
                                            </div>
                                            <div className="text-left">
                                                <span className="text-neutral-400 block text-[10px]">المبلغ:</span>
                                                <span className="text-emerald-400 font-bold font-mono text-sm">{b.total_amount} ج.م</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                                            {b.status === 'pending' && !isPast && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickConfirm(b)}
                                                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-900/30"
                                                >
                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                    <span>تأكيد الحجز</span>
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedDetailBooking(b)}
                                                className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs text-center transition-colors cursor-pointer"
                                            >
                                                عرض التفاصيل الكاملة
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View (Hidden on mobile) */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead>
                                    <tr className="border-b border-white/10 text-neutral-400">
                                        <th className="pb-3 pr-2 font-semibold">كود الحجز</th>
                                        <th className="pb-3 font-semibold">اسم العميل</th>
                                        <th className="pb-3 font-semibold">الغرفة</th>
                                        <th className="pb-3 font-semibold">التاريخ والتوقيت</th>
                                        <th className="pb-3 font-semibold">المبلغ</th>
                                        <th className="pb-3 font-semibold">الحالة</th>
                                        <th className="pb-3 pl-2 text-left font-semibold">إجراء سريع</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {recentBookings.map((b) => {
                                        const { end } = getBookingDates(b);
                                        const isPast = end.getTime() <= Date.now();
                                        return (
                                            <tr
                                                key={b.id}
                                                onClick={() => setSelectedDetailBooking(b)}
                                                className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                                                title="اضغط لعرض تفاصيل الحجز الكاملة"
                                            >
                                                <td className="py-3 pr-2 font-mono text-neutral-400 group-hover:text-white">#{b.reservation_id}</td>
                                                <td className="py-3 font-bold text-white group-hover:text-red-400 transition-colors">
                                                    <div>{b.customer_name}</div>
                                                    <span className="text-[10px] text-neutral-400 font-mono" dir="ltr">
                                                        {b.customer_phone}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-neutral-200">{b.room_name}</td>
                                                <td className="py-3 text-neutral-300">
                                                    <div>{b.booking_date}</div>
                                                    <div className="text-[10px] text-red-400">{b.start_time} - {b.end_time}</div>
                                                </td>
                                                <td className="py-3 font-bold text-emerald-400 font-mono">{b.total_amount} ج.م</td>
                                                <td className="py-3">
                                                    {b.status === 'pending' && (
                                                        isPast ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
                                                                فات موعده ⌛
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                                                                معلق ⏳
                                                            </span>
                                                        )
                                                    )}
                                                    {b.status === 'confirmed' && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                            مؤكد ✅
                                                        </span>
                                                    )}
                                                    {b.status === 'cancelled' && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                                                            ملغي ❌
                                                        </span>
                                                    )}
                                                    {b.status === 'completed' && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                            مكتمل 🎮
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 pl-2 text-left" onClick={(e) => e.stopPropagation()}>
                                                    {b.status === 'pending' ? (
                                                        isPast ? (
                                                            <span className="text-[11px] text-neutral-500 italic">منتهي الصلاحية</span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQuickConfirm(b)}
                                                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1 shadow-sm"
                                                            >
                                                                <Check className="w-3 h-3 stroke-[3]" />
                                                                <span>تأكيد الحجز</span>
                                                            </button>
                                                        )
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedDetailBooking(b)}
                                                            className="text-[11px] text-neutral-400 hover:text-white underline cursor-pointer"
                                                        >
                                                            التفاصيل
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Booking Details Modal */}
            {selectedDetailBooking && (
                <BookingDetailsModal
                    booking={selectedDetailBooking}
                    onClose={() => setSelectedDetailBooking(null)}
                    onStatusChange={async (id, newStatus) => {
                        await updateBookingStatus(id, newStatus);
                        toast.success('تم تحديث حالة الحجز بنجاح');
                        setSelectedDetailBooking(null);
                        loadMetrics();
                    }}
                    onSwitchToBookingsTab={() => {
                        setSelectedDetailBooking(null);
                        onSwitchTab('bookings');
                    }}
                />
            )}
        </div>
    );
}
