import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Star,
    History,
    AlertCircle,
    Calendar,
    UserCircle2,
    LogOut,
    Link as LinkIcon,
    Sparkles,
    ShoppingBag,
    Gamepad2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { DBCustomer, DBLoyaltyTransaction, DBOrder, DBBooking } from '@/types/database';
import { useAuth } from '@/features/auth/stores/authStore';
import { supabase } from '@/lib/supabase';

export default function CustomerDashboardPage() {
    const navigate = useNavigate();
    const { session, user, customerProfile, isLoading, signOut, refreshProfile } = useAuth();
    
    // Authenticated User State
    const [authHistory, setAuthHistory] = useState<DBLoyaltyTransaction[]>([]);
    const [authOrders, setAuthOrders] = useState<DBOrder[]>([]);
    const [authBookings, setAuthBookings] = useState<DBBooking[]>([]);
    const [fetchingAuthData, setFetchingAuthData] = useState(false);
    const [activeTab, setActiveTab] = useState<'history' | 'orders' | 'bookings'>('history');

    // Pagination States
    const [txLimit, setTxLimit] = useState(10);
    const [ordersLimit, setOrdersLimit] = useState(10);
    const [bookingsLimit, setBookingsLimit] = useState(10);
    const [hasMoreTx, setHasMoreTx] = useState(true);
    const [hasMoreOrders, setHasMoreOrders] = useState(true);
    const [hasMoreBookings, setHasMoreBookings] = useState(true);

    // Link Phone State
    const [linkPhone, setLinkPhone] = useState('');
    const [isLinking, setIsLinking] = useState(false);

    // Fetch Auth Data
    useEffect(() => {
        async function fetchAuthData() {
            if (!session || !customerProfile) return;
            setFetchingAuthData(true);
            try {
                const [txRes, ordersRes, bookingsRes] = await Promise.all([
                    supabase
                        .from('loyalty_transactions')
                        .select('*', { count: 'exact' })
                        .eq('customer_id', customerProfile.id)
                        .order('created_at', { ascending: false })
                        .range(0, txLimit - 1),
                    supabase
                        .from('orders')
                        .select('*', { count: 'exact' })
                        .eq('user_id', user?.id)
                        .order('created_at', { ascending: false })
                        .range(0, ordersLimit - 1),
                    supabase
                        .from('ps_bookings')
                        .select('*', { count: 'exact' })
                        .eq('user_id', user?.id)
                        .order('created_at', { ascending: false })
                        .range(0, bookingsLimit - 1),
                ]);
                
                if (txRes.data) {
                    setAuthHistory(txRes.data);
                    setHasMoreTx((txRes.count || 0) > txLimit);
                }
                if (ordersRes.data) {
                    setAuthOrders(ordersRes.data as DBOrder[]);
                    setHasMoreOrders((ordersRes.count || 0) > ordersLimit);
                }
                if (bookingsRes.data) {
                    setAuthBookings(bookingsRes.data as DBBooking[]);
                    setHasMoreBookings((bookingsRes.count || 0) > bookingsLimit);
                }
            } catch (err) {
                console.error('Error fetching auth data:', err);
                toast.error('حدث خطأ أثناء تحميل البيانات');
            } finally {
                setFetchingAuthData(false);
            }
        }
        
        fetchAuthData();
    }, [session, customerProfile, user?.id, txLimit, ordersLimit, bookingsLimit]);

    useEffect(() => {
        // Handle OAuth error in URL hash
        const hash = window.location.hash;
        if (hash && hash.includes('error=')) {
            const params = new URLSearchParams(hash.substring(1));
            const errorDesc = params.get('error_description') || params.get('error');
            if (errorDesc) {
                toast.error(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
                window.history.replaceState(null, '', window.location.pathname);
            }
        }
    }, []);

    const handleLinkPhone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!linkPhone || linkPhone.length < 10) {
            toast.error('برجاء إدخال رقم هاتف صحيح');
            return;
        }
        
        setIsLinking(true);
        try {
            const { data, error } = await supabase.rpc('link_phone_to_auth', { p_phone: linkPhone });
            if (error) throw error;
            
            if (data?.success) {
                toast.success(data.message || 'تم ربط رقم الهاتف بنجاح!');
                await refreshProfile();
            } else {
                toast.error(data?.message || 'فشل ربط رقم الهاتف.');
            }
        } catch (err: unknown) {
            console.error('Link phone error:', err);
            toast.error((err as Error).message || 'حدث خطأ أثناء محاولة ربط الحساب.');
        } finally {
            setIsLinking(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        toast.success('تم تسجيل الخروج بنجاح');
        navigate('/');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ar-EG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(date);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4">
                <div className="w-full max-w-md space-y-4">
                    <div className="h-48 bg-[var(--c-card)] animate-pulse rounded-3xl" />
                    <div className="h-12 bg-[var(--c-card)] animate-pulse rounded-xl" />
                    <div className="h-24 bg-[var(--c-card)] animate-pulse rounded-2xl" />
                    <div className="h-24 bg-[var(--c-card)] animate-pulse rounded-2xl" />
                </div>
            </div>
        );
    }

    const SkeletonList = () => (
        <div className="space-y-3 mt-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl p-4 flex gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );

    const renderHistory = (history: DBLoyaltyTransaction[], isFetching: boolean) => {
        if (isFetching) return <SkeletonList />;
        
        if (history.length === 0) return (
            <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl p-8 text-center mt-4 shadow-sm">
                <History className="w-10 h-10 text-[var(--text-3)] mx-auto mb-3 opacity-50" />
                <p className="text-[var(--text-2)] font-medium text-sm">لا توجد حركات في السجل حتى الآن.</p>
            </div>
        );

        return (
            <div className="mt-4 space-y-3">
                {history.map((tx) => {
                    const isPositive = tx.points > 0;
                    return (
                        <div key={tx.id} className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl p-4 flex items-center justify-between hover:border-[var(--c-brand-l)] transition-colors shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                    isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                    <Star className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[var(--text-1)] line-clamp-1">{tx.description}</p>
                                    <p className="text-xs text-[var(--text-3)] flex items-center gap-1 mt-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(tx.created_at)}
                                    </p>
                                </div>
                            </div>
                            <div className={`font-mono font-bold text-base shrink-0 mr-2 ${
                                isPositive ? 'text-emerald-500' : 'text-red-500'
                            }`}>
                                {isPositive ? '+' : ''}{tx.points}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderOrders = (orders: DBOrder[], isFetching: boolean) => {
        if (isFetching) return <SkeletonList />;
        
        if (orders.length === 0) return (
            <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl p-8 text-center mt-4 shadow-sm">
                <ShoppingBag className="w-10 h-10 text-[var(--text-3)] mx-auto mb-3 opacity-50" />
                <p className="text-[var(--text-2)] font-medium text-sm">لم تقم بأي طلبات كافيه مسبقاً.</p>
            </div>
        );

        return (
            <div className="mt-4 space-y-3">
                {orders.map((order) => (
                    <div key={order.id} className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl p-4 flex flex-col hover:border-[var(--c-brand-l)] transition-colors shadow-sm">
                        <div className="flex items-center justify-between mb-3 border-b border-[var(--c-border)] pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                    <ShoppingBag size={15} />
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--text-1)] text-sm font-mono">#{order.order_number}</p>
                                    <p className="text-[10px] text-[var(--text-3)] flex items-center gap-1 mt-0.5">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(order.created_at)}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                order.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                order.status === 'preparing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                                {order.status === 'completed' ? 'مكتمل' : order.status === 'cancelled' ? 'ملغي' : order.status === 'preparing' ? 'قيد التجهيز' : 'قيد الانتظار'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--text-2)]">
                                {Array.isArray(order.items) ? `${order.items.length} أصناف` : 'طلب كافيه'}
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="font-bold font-mono text-base text-[var(--text-1)]">{order.total_amount}</span>
                                <span className="text-[10px] text-[var(--text-3)]">ج.م</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderBookings = (bookings: DBBooking[], isFetching: boolean) => {
        if (isFetching) return <SkeletonList />;
        
        if (bookings.length === 0) return (
            <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl p-8 text-center mt-4 shadow-sm">
                <Gamepad2 className="w-10 h-10 text-[var(--text-3)] mx-auto mb-3 opacity-50" />
                <p className="text-[var(--text-2)] font-medium text-sm">لم تقم بأي حجوزات غرف مسبقاً.</p>
            </div>
        );

        return (
            <div className="mt-4 space-y-3">
                {bookings.map((booking) => (
                    <div key={booking.id} className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl p-4 flex flex-col hover:border-[var(--c-brand-l)] transition-colors shadow-sm">
                        <div className="flex items-center justify-between mb-3 border-b border-[var(--c-border)] pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                    <Gamepad2 size={15} />
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--text-1)] text-sm">{booking.room_name || 'غرفة اللعب'}</p>
                                    <p className="text-[10px] text-[var(--text-3)] flex items-center gap-1 mt-0.5">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(booking.booking_date || booking.created_at || '')}
                                        {booking.start_time ? ` (${booking.start_time})` : ''}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                booking.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                booking.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                booking.status === 'confirmed' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                                {booking.status === 'completed' ? 'مكتمل' : booking.status === 'cancelled' ? 'ملغي' : booking.status === 'confirmed' ? 'مؤكد' : 'معلق'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--text-2)]">
                                {booking.duration_hours ? `${booking.duration_hours} ساعة` : 'حجز بلايستيشن'}
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="font-bold font-mono text-base text-[var(--text-1)]">{booking.total_amount}</span>
                                <span className="text-[10px] text-[var(--text-3)]">ج.م</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderVIPCard = (targetCustomer: DBCustomer, isAuth: boolean) => (
        <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10" style={{
            background: 'linear-gradient(135deg, #1f1f23 0%, #0d0d0f 100%)'
        }}>
            {/* Ambient metallic glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-600/10 rounded-full blur-[60px] pointer-events-none translate-y-1/3 -translate-x-1/3" />
            
            <div className="p-6 sm:p-8 relative z-10">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">VIP LOYALTY CARD</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-medium">D95 GAMING & CAFE</p>
                    </div>
                    
                    {/* Simulated NFC/Chip icon for realistic card look */}
                    <div className="w-10 h-8 rounded-md border border-neutral-700 bg-gradient-to-br from-yellow-100/10 to-yellow-600/20 flex items-center justify-center">
                        <div className="w-6 h-4 border border-yellow-500/30 rounded-sm opacity-50" />
                    </div>
                </div>

                <div className="mb-8">
                    <p className="text-[11px] text-neutral-400 font-medium mb-1">الرصيد المتاح</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                            {targetCustomer.loyalty_points_balance.toLocaleString()}
                        </h2>
                        <span className="text-amber-500 font-bold text-sm">نقطة</span>
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center text-white border border-white/10">
                            <UserCircle2 size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Card Holder</p>
                            <p className="font-bold text-sm text-white line-clamp-1 max-w-[140px] sm:max-w-[180px]">
                                {targetCustomer.full_name || targetCustomer.phone_number || targetCustomer.email || 'عميل مسجل'}
                            </p>
                        </div>
                    </div>

                    {isAuth ? (
                        <button 
                            onClick={handleSignOut}
                            className="text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg transition-colors font-bold flex items-center gap-1.5 backdrop-blur-sm"
                        >
                            <LogOut size={13} />
                            <span>خروج</span>
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-1)] pb-24 md:pb-12" dir="rtl">
            {/* Header */}
            <div className="bg-[var(--bg-main)] text-[var(--text-1)] sticky top-0 z-40 border-b border-[var(--c-border)] backdrop-blur-md bg-opacity-80">
                <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between max-w-md">
                    <button 
                        onClick={() => navigate('/')} 
                        className="w-10 h-10 flex items-center justify-center hover:bg-[var(--c-card)] rounded-xl transition-colors border border-transparent hover:border-[var(--c-border)]"
                    >
                        <ArrowRight className="w-5 h-5 text-[var(--text-2)]" />
                    </button>
                    <h1 className="text-base sm:text-lg font-bold flex items-center gap-2 font-display">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 fill-amber-500" />
                        حسابي والمكافآت
                    </h1>
                    <div className="w-10" />
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 sm:py-8 max-w-md">
                {/* STATE 1: AUTHENTICATED */}
                {session ? (
                    <div className="space-y-6">
                        {customerProfile ? (
                            renderVIPCard(customerProfile, true)
                        ) : (
                            <div className="bg-[var(--c-card)] border border-red-500/30 rounded-3xl p-6 text-center shadow-sm">
                                <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle size={28} />
                                </div>
                                <h3 className="font-bold text-base mb-2">جاري تهيئة الحساب...</h3>
                                <p className="text-xs text-[var(--text-3)] leading-relaxed">
                                    برجاء تحديث الصفحة. إذا كنت تمتلك حساباً قديماً بالهاتف، يمكنك ربطه الآن.
                                </p>
                                <button onClick={refreshProfile} className="mt-5 w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-red-700 transition-colors">
                                    تحديث الصفحة
                                </button>
                            </div>
                        )}

                        {/* Link Legacy Account UI */}
                        {customerProfile && !customerProfile.phone_number && (
                            <div className="bg-[var(--c-card)] border border-amber-500/30 rounded-3xl p-5 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
                                <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-500">
                                    <LinkIcon size={18} />
                                    <h3 className="font-bold text-sm">لديك نقاط سابقة؟</h3>
                                </div>
                                <p className="text-xs text-[var(--text-2)] mb-4 leading-relaxed">
                                    اربط رقم هاتفك القديم بحسابك الحالي لدمج نقاطك ومشترياتك السابقة.
                                </p>
                                <form onSubmit={handleLinkPhone} className="flex gap-2">
                                    <input
                                        type="tel"
                                        dir="ltr"
                                        value={linkPhone}
                                        onChange={(e) => setLinkPhone(e.target.value.replace(/\D/g, ''))}
                                        placeholder="010XXXXXXXX"
                                        className="flex-1 bg-[var(--bg-main)] border border-[var(--c-border)] rounded-xl px-3 py-2.5 text-sm font-mono focus:border-amber-500 outline-none transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLinking}
                                        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs disabled:opacity-50 transition-colors shrink-0"
                                    >
                                        {isLinking ? 'جاري الربط...' : 'ربط الهاتف'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Navigation Tabs & Content */}
                        {customerProfile && (
                            <div className="pt-2">
                                <div className="flex bg-[var(--c-card)] p-1.5 rounded-2xl border border-[var(--c-border)] gap-1 shadow-xs mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('history')}
                                        className={`flex-1 py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                                            activeTab === 'history'
                                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                                : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--c-card-hover)]'
                                        }`}
                                    >
                                        <History size={15} />
                                        <span>سجل النقاط</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('orders')}
                                        className={`flex-1 py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                                            activeTab === 'orders'
                                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                                : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--c-card-hover)]'
                                        }`}
                                    >
                                        <ShoppingBag size={15} />
                                        <span>طلبات الكافيه</span>
                                        {authOrders.length > 0 && (
                                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                                                activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-[var(--bg-main)] text-[var(--text-2)]'
                                            }`}>
                                                {authOrders.length}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('bookings')}
                                        className={`flex-1 py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                                            activeTab === 'bookings'
                                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                                : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--c-card-hover)]'
                                        }`}
                                    >
                                        <Gamepad2 size={15} />
                                        <span>حجوزات الغرف</span>
                                        {authBookings.length > 0 && (
                                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                                                activeTab === 'bookings' ? 'bg-white/20 text-white' : 'bg-[var(--bg-main)] text-[var(--text-2)]'
                                            }`}>
                                                {authBookings.length}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {/* Tab 1: Points History */}
                                {activeTab === 'history' && (
                                    <div>
                                        {renderHistory(authHistory, fetchingAuthData)}
                                        {hasMoreTx && (
                                            <button
                                                onClick={() => setTxLimit(prev => prev + 10)}
                                                className="w-full mt-4 py-3 bg-[var(--c-card)] hover:bg-[var(--c-card-hover)] border border-[var(--c-border)] text-[var(--text-2)] rounded-2xl text-xs font-bold transition-colors shadow-xs"
                                            >
                                                عرض المزيد من الحركات
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Tab 2: Cafe Orders */}
                                {activeTab === 'orders' && (
                                    <div>
                                        {renderOrders(authOrders, fetchingAuthData)}
                                        {hasMoreOrders && (
                                            <button
                                                onClick={() => setOrdersLimit(prev => prev + 10)}
                                                className="w-full mt-4 py-3 bg-[var(--c-card)] hover:bg-[var(--c-card-hover)] border border-[var(--c-border)] text-[var(--text-2)] rounded-2xl text-xs font-bold transition-colors shadow-xs"
                                            >
                                                عرض المزيد من الطلبات
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Tab 3: Room Bookings */}
                                {activeTab === 'bookings' && (
                                    <div>
                                        {renderBookings(authBookings, fetchingAuthData)}
                                        {hasMoreBookings && (
                                            <button
                                                onClick={() => setBookingsLimit(prev => prev + 10)}
                                                className="w-full mt-4 py-3 bg-[var(--c-card)] hover:bg-[var(--c-card-hover)] border border-[var(--c-border)] text-[var(--text-2)] rounded-2xl text-xs font-bold transition-colors shadow-xs"
                                            >
                                                عرض المزيد من الحجوزات
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* STATE 2: UNAUTHENTICATED */
                    <div className="space-y-6">
                        {/* Login Card CTA */}
                        <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-3xl p-6 text-white text-center shadow-lg shadow-red-900/20">
                            <UserCircle2 size={40} className="mx-auto mb-3 opacity-90" />
                            <h2 className="text-lg sm:text-xl font-bold mb-2 font-display">سجل دخولك الآن!</h2>
                            <p className="text-red-100 text-xs sm:text-sm mb-5 leading-relaxed">
                                تابع نقاطك، تصفح طلباتك السابقة، واحصل على عروض حصرية.
                            </p>
                            <button 
                                onClick={() => navigate('/login')}
                                className="w-full bg-white text-red-700 font-bold py-3.5 rounded-xl shadow-sm hover:bg-red-50 transition-colors text-sm"
                            >
                                تسجيل الدخول / إنشاء حساب
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
