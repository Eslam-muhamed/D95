import { useState, useEffect, useCallback } from 'react';
import {
    ShoppingBag,
    Search,
    RefreshCw,
    Clock,
    CheckCircle2,
    XCircle,
    Coffee,
    Phone,
    MapPin,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    Trash2,
    MessageCircle,
    ArrowRight,
    TrendingUp,
    Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
    fetchPaginatedOrders,
    updateOrderStatus,
    deleteOrder,
    fetchOrderMetrics,
} from '@/services/orderService';
import type { DBOrder } from '@/types/database';
import type { ItemCustomization } from '@/types/cart';
import { formatCustomizationTags } from '@/lib/cartUtils';

function formatTimeAgo(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'pending':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    قيد الانتظار
                </span>
            );
        case 'preparing':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <Coffee className="w-3.5 h-3.5 text-blue-600" />
                    جاري التجهيز
                </span>
            );
        case 'completed':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    مكتمل
                </span>
            );
        case 'cancelled':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    ملغي
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {status}
                </span>
            );
    }
}

export default function OrdersTab() {
    const [orders, setOrders] = useState<DBOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Filter & Pagination States
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Metrics
    const [metrics, setMetrics] = useState({
        pendingOrdersCount: 0,
        todayOrdersCount: 0,
        todayOrdersRevenue: 0,
    });

    const loadMetrics = useCallback(async () => {
        const res = await fetchOrderMetrics();
        setMetrics(res);
    }, []);

    const loadOrders = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const result = await fetchPaginatedOrders({
                status: statusFilter,
                search: searchQuery,
                page,
                pageSize,
            });

            setOrders(result.orders);
            setTotalCount(result.totalCount);
            setTotalPages(result.totalPages);
        } catch (err) {
            console.error('Error loading orders:', err);
            toast.error('حدث خطأ أثناء تحميل الطلبات');
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [statusFilter, searchQuery, page, pageSize]);

    // Initial Load & triggers
    useEffect(() => {
        loadOrders();
        loadMetrics();
    }, [loadOrders, loadMetrics]);

    // Realtime listener for incoming orders
    useEffect(() => {
        const channel = supabase
            .channel('realtime_cafe_orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newOrder = payload.new as DBOrder;
                        toast.info(`طلب كافيه جديد: #${newOrder.order_number}`, {
                            description: `${newOrder.customer_name || 'عميل'} - ${newOrder.total_amount} ج.م`,
                            duration: 5000,
                        });
                    }
                    loadOrders(true);
                    loadMetrics();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadOrders, loadMetrics]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            setUpdatingId(orderId);
            await updateOrderStatus(orderId, newStatus);
            toast.success('تم تحديث حالة الطلب بنجاح');
            // Optimistic update
            setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
            );
            loadMetrics();
        } catch (err) {
            console.error(err);
            toast.error('فشل تحديث حالة الطلب');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (orderId: string, orderNumber: string) => {
        if (!window.confirm(`هل أنت متأكد من حذف الطلب #${orderNumber}؟ لا يمكن التراجع عن هذا الإجراء.`)) {
            return;
        }

        try {
            setUpdatingId(orderId);
            await deleteOrder(orderId);
            toast.success(`تم حذف الطلب #${orderNumber}`);
            loadOrders();
            loadMetrics();
        } catch (err) {
            console.error(err);
            toast.error('فشل حذف الطلب');
        } finally {
            setUpdatingId(null);
        }
    };

    const filterTabs = [
        { id: 'all', label: 'الكل' },
        { id: 'pending', label: 'قيد الانتظار', count: metrics.pendingOrdersCount },
        { id: 'preparing', label: 'جاري التجهيز' },
        { id: 'completed', label: 'مكتملة' },
        { id: 'cancelled', label: 'ملغية' },
    ];

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header & Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Metric 1: Pending Orders */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-400 transition-all shadow-xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500">طلبات قيد الانتظار</p>
                            <h3 className="text-2xl sm:text-3xl font-bold font-mono text-amber-600 mt-1">
                                {metrics.pendingOrdersCount}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                    {metrics.pendingOrdersCount > 0 && (
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-800 font-medium">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                            <span>تتطلب سرعة التجهيز والرد</span>
                        </div>
                    )}
                </div>

                {/* Metric 2: Today Orders Count */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 relative overflow-hidden group hover:border-red-400 transition-all shadow-xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500">إجمالي طلبات اليوم</p>
                            <h3 className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-1">
                                {metrics.todayOrdersCount}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-3 text-[11px] text-slate-500">
                        سجل مبيعات الكافيه لليوم
                    </div>
                </div>

                {/* Metric 3: Today Revenue */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-400 transition-all shadow-xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500">مبيعات الكافيه اليوم</p>
                            <h3 className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700 mt-1">
                                {metrics.todayOrdersRevenue.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-3 text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        <span>من كافة طلبات الصالة والدليفري</span>
                    </div>
                </div>
            </div>

            {/* Controls Bar: Search & Status Filters */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                        {filterTabs.map((tab) => {
                            const isSelected = statusFilter === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => {
                                        setStatusFilter(tab.id);
                                        setPage(1);
                                    }}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                        isSelected
                                            ? 'bg-red-600 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                            isSelected ? 'bg-white text-red-600' : 'bg-amber-400 text-slate-950'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Actions: Refresh */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                            type="button"
                            onClick={() => {
                                loadOrders();
                                loadMetrics();
                                toast.info('تم تحديث البيانات');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-600' : ''}`} />
                            <span>تحديث</span>
                        </button>
                    </div>
                </div>

                {/* Search Box */}
                <div className="relative">
                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        placeholder="ابحث برقم الطلب، اسم العميل، رقم الهاتف، أو الطاولة..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-red-500 transition-colors"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery('');
                                setPage(1);
                            }}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                        >
                            مسح
                        </button>
                    )}
                </div>
            </div>

            {/* Orders List / Grid */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white border border-slate-200/60 rounded-2xl p-5 animate-pulse h-36" />
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-xs">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3">
                        <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mb-1">لا توجد طلبات كافيه حالياً</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        {searchQuery || statusFilter !== 'all'
                            ? 'لم يتم العثور على أي نتائج تطابق الفلتر الحالي، جرب تغيير خيارات البحث.'
                            : 'ستظهر طلبات المنيو الرقمي للزبائن فور إرسالها من الموقع هنا.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const isUpdating = updatingId === order.id;
                        return (
                            <div
                                key={order.id}
                                className={`bg-white border rounded-2xl p-5 transition-all shadow-xs ${
                                    order.status === 'pending'
                                        ? 'border-amber-300 bg-amber-50/20'
                                        : 'border-slate-200/90 hover:border-slate-300'
                                }`}
                            >
                                {/* Order Header */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-2.5">
                                        <span className="font-mono text-base font-bold text-slate-900 tracking-wider">
                                            #{order.order_number}
                                        </span>
                                        {getStatusBadge(order.status)}
                                        <span className="text-xs text-slate-500 font-medium">
                                            {formatTimeAgo(order.created_at)}
                                        </span>
                                    </div>

                                    {/* Order Type & Location Badge */}
                                    <div className="flex items-center gap-2">
                                        {order.order_type === 'dine' && (
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                                صالة {order.table_number ? `• طاولة ${order.table_number}` : ''}
                                            </span>
                                        )}
                                        {order.order_type === 'takeaway' && (
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                استلام من الكافيه (Takeaway)
                                            </span>
                                        )}
                                        {order.order_type === 'delivery' && (
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                توصيل دليفري
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Customer Info Bar */}
                                <div className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 border-b border-slate-100">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-slate-400">العميل:</span>
                                            <span className="font-bold text-slate-900">
                                                {order.customer_name || 'عميل مجهول'}
                                            </span>
                                        </div>

                                        {order.customer_phone && (
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 font-mono text-slate-600" dir="ltr">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{order.customer_phone}</span>
                                                </div>
                                                <a
                                                    href={`https://wa.me/2${order.customer_phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors font-bold"
                                                >
                                                    <MessageCircle className="w-3 h-3" />
                                                    <span>واتساب</span>
                                                </a>
                                            </div>
                                        )}

                                        {order.delivery_address && (
                                            <div className="flex items-center gap-1 text-slate-600">
                                                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                                <span className="truncate max-w-xs">{order.delivery_address}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Payment Method */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400">الدفع:</span>
                                        <span className="font-semibold text-slate-800">
                                            {order.payment_method === 'cash'
                                                ? 'نقداً (كاش)'
                                                : order.payment_method === 'instapay'
                                                ? 'انستاباي (InstaPay)'
                                                : order.payment_method === 'wallet'
                                                ? 'محفظة إلكترونية'
                                                : order.payment_method || 'غير محدد'}
                                        </span>
                                    </div>
                                </div>

                                {/* Order Items List */}
                                <div className="py-3">
                                    <div className="space-y-2">
                                        {(order.items || []).map((item, idx) => {
                                            const customTags = item.customization
                                                ? formatCustomizationTags(item.customization as unknown as ItemCustomization)
                                                : [];

                                            return (
                                                <div
                                                    key={idx}
                                                    className="flex items-start justify-between gap-4 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs"
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded-md bg-red-50 text-red-600 font-bold flex items-center justify-center font-mono text-[11px] border border-red-200">
                                                                {item.quantity}×
                                                            </span>
                                                            <span className="font-bold text-slate-900">{item.name}</span>
                                                        </div>

                                                        {/* Customization Badges */}
                                                        {customTags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 pr-7">
                                                                {customTags.map((tag, tIdx) => (
                                                                    <span
                                                                        key={tIdx}
                                                                        className="px-2 py-0.5 rounded-md bg-white text-[10px] text-slate-700 border border-slate-200 shadow-2xs"
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="text-left font-mono font-bold text-slate-900 shrink-0">
                                                        {item.price * item.quantity} <span className="text-[10px] text-slate-500 font-normal">ج.م</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Order Notes */}
                                    {order.notes && (
                                        <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                            <span>ملاحظات العميل: {order.notes}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Order Footer: Total & Actions */}
                                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">الإجمالي النهائي:</span>
                                        <span className="text-lg font-bold font-mono text-emerald-700">
                                            {order.total_amount} <span className="text-xs text-slate-500 font-normal">ج.م</span>
                                        </span>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex items-center gap-2">
                                        {order.status === 'pending' && (
                                            <button
                                                type="button"
                                                disabled={isUpdating}
                                                onClick={() => handleStatusChange(order.id, 'preparing')}
                                                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                                            >
                                                <Coffee className="w-3.5 h-3.5" />
                                                <span>بدء التجهيز</span>
                                            </button>
                                        )}

                                        {order.status === 'preparing' && (
                                            <button
                                                type="button"
                                                disabled={isUpdating}
                                                onClick={() => handleStatusChange(order.id, 'completed')}
                                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>تم التسليم بنجاح</span>
                                            </button>
                                        )}

                                        {order.status !== 'cancelled' && order.status !== 'completed' && (
                                            <button
                                                type="button"
                                                disabled={isUpdating}
                                                onClick={() => handleStatusChange(order.id, 'cancelled')}
                                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
                                            >
                                                إلغاء
                                            </button>
                                        )}

                                        {/* Status Selector Dropdown */}
                                        <select
                                            value={order.status}
                                            disabled={isUpdating}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-500 cursor-pointer shadow-2xs"
                                        >
                                            <option value="pending">قيد الانتظار</option>
                                            <option value="preparing">جاري التجهيز</option>
                                            <option value="completed">مكتمل</option>
                                            <option value="cancelled">ملغي</option>
                                        </select>

                                        {/* Delete Action */}
                                        <button
                                            type="button"
                                            disabled={isUpdating}
                                            onClick={() => handleDelete(order.id, order.order_number)}
                                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                                            title="حذف الطلب"
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl px-5 py-3.5 shadow-xs">
                    <div className="text-xs text-slate-500">
                        عرض <span className="font-mono text-slate-900 font-bold">{(page - 1) * pageSize + 1}</span> إلى{' '}
                        <span className="font-mono text-slate-900 font-bold">{Math.min(page * pageSize, totalCount)}</span> من إجمالي{' '}
                        <span className="font-mono text-slate-900 font-bold">{totalCount}</span> طلب
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Page Size Selector */}
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(1);
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-red-500"
                        >
                            <option value={10}>10 لكل صفحة</option>
                            <option value={15}>15 لكل صفحة</option>
                            <option value={25}>25 لكل صفحة</option>
                            <option value={50}>50 لكل صفحة</option>
                        </select>

                        {/* Prev Button */}
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Page numbers */}
                        <div className="flex items-center gap-1 font-mono text-xs">
                            <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold">
                                {page}
                            </span>
                            <span className="text-slate-400">/</span>
                            <span className="text-slate-600">{totalPages}</span>
                        </div>

                        {/* Next Button */}
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
