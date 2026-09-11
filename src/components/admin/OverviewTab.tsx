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
import { fetchBookings, updateBookingStatus } from '@/services/bookingService';
import { fetchProducts, fetchOffers } from '@/services/menuService';
import type { DBBooking } from '@/types/database';

interface OverviewTabProps {
    onSwitchTab: (tab: 'bookings' | 'products' | 'categories' | 'offers') => void;
}

export default function OverviewTab({ onSwitchTab }: OverviewTabProps) {
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<DBBooking[]>([]);
    const [productCount, setProductCount] = useState(0);
    const [offerCount, setOfferCount] = useState(0);

    const loadMetrics = async () => {
        setLoading(true);
        try {
            const [bData, pData, oData] = await Promise.all([
                fetchBookings(),
                fetchProducts('all'),
                fetchOffers()
            ]);
            setBookings(bData);
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

    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

    const handleQuickConfirm = async (b: DBBooking) => {
        try {
            await updateBookingStatus(b.id, 'confirmed');
            toast.success(`تم تأكيد حجز ${b.customer_name}!`);
            setBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'confirmed' } : item));
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
                    onClick={() => onSwitchTab('bookings')}
                    className="bg-gradient-to-br from-[#1c1214] to-[#140e11] border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-5 shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02] group"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400">حجوزات بانتظار التأكيد</span>
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between">
                        <span className="font-brush text-4xl font-bold text-white">
                            {pendingBookings.length}
                        </span>
                        <span className="text-xs text-amber-400/80 flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform">
                            <span>مراجعة الآن</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                    </div>
                </div>

                {/* 2. Confirmed & Active Bookings */}
                <div
                    onClick={() => onSwitchTab('bookings')}
                    className="bg-[#140e11]/90 border border-white/10 hover:border-white/20 rounded-2xl p-5 shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02] group"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">حجوزات مؤكدة</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Gamepad2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between">
                        <span className="font-brush text-4xl font-bold text-white">
                            {confirmedBookings.length}
                        </span>
                        <span className="text-xs text-neutral-400 flex items-center gap-1">
                            <span>من أصل {bookings.length}</span>
                        </span>
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
                        <span className="font-brush text-4xl font-bold text-white">
                            {productCount}
                        </span>
                        <span className="text-xs text-red-400/80 flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform">
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
                        <span className="font-brush text-4xl font-bold text-white">
                            {offerCount}
                        </span>
                        <span className="text-xs text-red-400/80 flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform">
                            <span>تعديل العروض</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                    </div>
                </div>
            </div>

            {/* Recent Bookings Attention Section */}
            <div className="bg-[#140e11]/90 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-500" />
                            <span>أحدث الحجوزات الواردة</span>
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                            آخر الحجوزات التي تمت عبر الموقع والتي تتطلب متابعة الصالة.
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
                            <span>عرض جميع الحجوزات ({bookings.length})</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-12 flex justify-center text-neutral-400">
                        <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="py-10 text-center text-xs text-neutral-400 border border-dashed border-white/10 rounded-xl">
                        لا توجد حجوزات واردة حتى الآن. ستظهر هنا فور إرسال أي عميل لحجز من الموقع.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
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
                                {bookings.slice(0, 5).map((b) => (
                                    <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3 pr-2 font-mono text-neutral-400">#{b.reservation_id}</td>
                                        <td className="py-3 font-bold text-white">
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
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                                                    معلق ⏳
                                                </span>
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
                                        <td className="py-3 pl-2 text-left">
                                            {b.status === 'pending' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickConfirm(b)}
                                                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1 shadow-sm"
                                                >
                                                    <Check className="w-3 h-3 stroke-[3]" />
                                                    <span>تأكيد الحجز</span>
                                                </button>
                                            ) : (
                                                <span className="text-[11px] text-neutral-500">تم المعالجة</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
