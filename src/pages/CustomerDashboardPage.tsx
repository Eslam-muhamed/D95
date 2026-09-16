import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, Star, History, AlertCircle, Calendar, UserCircle2, LogOut, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getCustomerLoyaltyInfo } from '@/services/loyaltyService';
import type { DBCustomer, DBLoyaltyTransaction, DBOrder } from '@/types/database';
import { useAuth } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

export default function CustomerDashboardPage() {
    const navigate = useNavigate();
    const { session, user, customerProfile, isLoading, signOut, refreshProfile } = useAuth();
    
    // Guest Phone State
    const [phone, setPhone] = useState('');
    const [guestLoading, setGuestLoading] = useState(false);
    const [guestCustomer, setGuestCustomer] = useState<DBCustomer | null>(null);
    const [guestHistory, setGuestHistory] = useState<DBLoyaltyTransaction[]>([]);

    // Authenticated User State
    const [authHistory, setAuthHistory] = useState<DBLoyaltyTransaction[]>([]);
    const [authOrders, setAuthOrders] = useState<DBOrder[]>([]);
    const [fetchingAuthData, setFetchingAuthData] = useState(false);

    // Link Phone State
    const [linkPhone, setLinkPhone] = useState('');
    const [isLinking, setIsLinking] = useState(false);

    // Fetch Auth Data
    useEffect(() => {
        async function fetchAuthData() {
            if (!session || !customerProfile) return;
            setFetchingAuthData(true);
            try {
                const [txRes, ordersRes] = await Promise.all([
                    supabase
                        .from('loyalty_transactions')
                        .select('*')
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('orders')
                        .select('*')
                        .order('created_at', { ascending: false })
                ]);
                
                if (txRes.data) setAuthHistory(txRes.data);
                if (ordersRes.data) setAuthOrders(ordersRes.data);
            } catch (err) {
                console.error('Error fetching auth data:', err);
            } finally {
                setFetchingAuthData(false);
            }
        }
        
        fetchAuthData();
    }, [session, customerProfile]);

    const handleGuestLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!phone || phone.length < 10) {
            toast.error('برجاء إدخال رقم هاتف صحيح');
            return;
        }

        setGuestLoading(true);
        try {
            const data = await getCustomerLoyaltyInfo(phone);
            if (data.exists && data.customer) {
                setGuestCustomer(data.customer);
                setGuestHistory(data.history || []);
                toast.success('تم العثور على حسابك بنجاح');
            } else {
                toast.error('لا يوجد حساب أو نقاط مسجلة بهذا الرقم بعد.');
            }
        } catch (error) {
            toast.error('حدث خطأ أثناء البحث عن الحساب');
            console.error(error);
        } finally {
            setGuestLoading(false);
        }
    };

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
        } catch (err: any) {
            console.error('Link phone error:', err);
            toast.error(err.message || 'حدث خطأ أثناء محاولة ربط الحساب.');
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
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const renderHistory = (history: DBLoyaltyTransaction[]) => (
        <div>
            <h3 className="font-bold text-lg text-[var(--text-1)] mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-red-500" />
                سجل النقاط
            </h3>

            {history.length === 0 ? (
                <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl p-8 text-center shadow-sm">
                    <AlertCircle className="w-10 h-10 text-[var(--text-3)] mx-auto mb-3" />
                    <p className="text-[var(--text-2)] font-medium">لا توجد حركات في السجل حتى الآن.</p>
                </div>
            ) : (
                <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-3xl overflow-hidden shadow-sm">
                    {history.map((tx, idx) => {
                        const isPositive = tx.points > 0;
                        return (
                            <div 
                                key={tx.id} 
                                className={`p-4 flex items-center justify-between gap-4 ${
                                    idx !== history.length - 1 ? 'border-b border-[var(--c-border)]' : ''
                                }`}
                            >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                        isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                    }`}>
                                        <Star className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[var(--text-1)] truncate">
                                            {tx.description}
                                        </p>
                                        <p className="text-[11px] text-[var(--text-3)] flex items-center gap-1 mt-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(tx.created_at)}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className={`font-mono font-bold text-lg shrink-0 ${
                                    isPositive ? 'text-emerald-500' : 'text-red-500'
                                }`}>
                                    {isPositive ? '+' : ''}{tx.points}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderOrders = () => {
        if (!session) return null;
        
        return (
            <div className="mt-8">
                <h3 className="font-bold text-lg text-[var(--text-1)] mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-red-500" />
                    طلباتي السابقة
                </h3>
                
                {authOrders.length === 0 ? (
                    <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl p-8 text-center shadow-sm">
                        <AlertCircle className="w-10 h-10 text-[var(--text-3)] mx-auto mb-3" />
                        <p className="text-[var(--text-2)] font-medium">لم تقم بأي طلبات مسبقاً.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {authOrders.map(order => (
                            <div key={order.id} className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-[var(--text-1)] text-sm">طلب #{order.order_number}</p>
                                    <p className="text-xs text-[var(--text-3)] flex items-center gap-1 mt-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(order.created_at)}
                                    </p>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold font-mono text-[var(--c-brand-l)]">{order.total_amount} ج.م</p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                                        order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                        order.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                    }`}>
                                        {order.status === 'completed' ? 'مكتمل' : order.status === 'cancelled' ? 'ملغي' : order.status === 'preparing' ? 'قيد التجهيز' : 'قيد الانتظار'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const renderBalanceCard = (targetCustomer: DBCustomer, isAuth: boolean) => (
        <div className="bg-gradient-to-br from-neutral-900 to-black rounded-3xl p-6 md:p-8 text-center text-white relative overflow-hidden shadow-xl border border-neutral-800">
            <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                <Star className="w-32 h-32" />
            </div>
            <p className="text-neutral-400 font-medium mb-2 relative z-10">الرصيد الحالي</p>
            <h2 className="text-5xl font-bold font-mono text-amber-400 mb-1 relative z-10">
                {targetCustomer.loyalty_points_balance.toLocaleString()}
            </h2>
            <p className="text-neutral-500 text-sm relative z-10 mb-6">نقطة</p>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between relative z-10">
                <div className="text-right flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center text-red-500 shrink-0">
                        <UserCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-400">العميل</p>
                        <p className="font-bold text-sm truncate max-w-[150px]">{targetCustomer.full_name || targetCustomer.phone_number || targetCustomer.email || 'عميل مسجل'}</p>
                    </div>
                </div>
                {isAuth ? (
                    <button 
                        onClick={handleSignOut}
                        className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-2 rounded-lg transition-colors font-bold flex items-center gap-1.5"
                    >
                        <LogOut size={14} />
                        خروج
                    </button>
                ) : (
                    <button 
                        onClick={() => {
                            setGuestCustomer(null);
                            setPhone('');
                            setGuestHistory([]);
                        }}
                        className="text-xs bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors font-bold text-white"
                    >
                        بحث جديد
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-1)] pb-20 md:pb-6" dir="rtl">
            {/* Header */}
            <div className="bg-[var(--bg-main)] text-[var(--text-1)] sticky top-0 z-40 border-b border-[var(--c-border)] backdrop-blur-md bg-opacity-80">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 hover:bg-[var(--c-card)] rounded-xl transition-colors"
                    >
                        <ArrowRight className="w-5 h-5 text-[var(--text-2)]" />
                    </button>
                    <h1 className="text-lg font-bold flex items-center gap-2 font-display">
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        حسابي
                    </h1>
                    <div className="w-9" />
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-lg">
                {/* STATE 1: AUTHENTICATED */}
                {session ? (
                    fetchingAuthData ? (
                        <div className="flex justify-center p-10"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
                    ) : (
                        <div className="space-y-6">
                            {customerProfile ? (
                                renderBalanceCard(customerProfile, true)
                            ) : (
                                <div className="bg-[var(--c-card)] border border-red-500/30 rounded-3xl p-6 text-center">
                                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle size={32} />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">جاري تهيئة الحساب...</h3>
                                    <p className="text-sm text-[var(--text-3)]">
                                        برجاء تحديث الصفحة. إذا كنت تمتلك حساباً قديماً بالهاتف، يمكنك ربطه الآن.
                                    </p>
                                    <button onClick={refreshProfile} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm">
                                        تحديث الصفحة
                                    </button>
                                </div>
                            )}

                            {/* Link Legacy Account UI */}
                            {customerProfile && !customerProfile.phone_number && (
                                <div className="bg-[var(--c-card)] border border-red-500/40 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3 text-red-500">
                                        <LinkIcon size={20} />
                                        <h3 className="font-bold">هل تمتلك نقاطاً سابقة؟</h3>
                                    </div>
                                    <p className="text-sm text-[var(--text-2)] mb-4">
                                        إذا كنت قد كسبت نقاطاً مسبقاً باستخدام رقم هاتفك، يمكنك ربطه الآن بحسابك لدمج النقاط.
                                    </p>
                                    <form onSubmit={handleLinkPhone} className="flex gap-2">
                                        <input
                                            type="tel"
                                            dir="ltr"
                                            value={linkPhone}
                                            onChange={(e) => setLinkPhone(e.target.value.replace(/\D/g, ''))}
                                            placeholder="رقم الهاتف القديم"
                                            className="flex-1 bg-[var(--bg-main)] border border-[var(--c-border)] rounded-xl px-4 py-2.5 text-sm font-mono focus:border-red-500 outline-none"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isLinking}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors shrink-0"
                                        >
                                            {isLinking ? 'جاري الربط...' : 'ربط الحساب'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {renderHistory(authHistory)}
                            {renderOrders()}
                        </div>
                    )
                ) : (
                    /* STATE 2: GUEST / PHONE LOOKUP */
                    !guestCustomer ? (
                        <div className="space-y-6">
                            {/* Login Card CTA */}
                            <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-3xl p-6 text-white text-center shadow-lg shadow-red-900/20">
                                <UserCircle2 size={48} className="mx-auto mb-3 opacity-90" />
                                <h2 className="text-xl font-bold mb-2 font-display">سجل دخولك الآن!</h2>
                                <p className="text-red-100 text-sm mb-5">
                                    تابع نقاطك، تصفح طلباتك السابقة، واحصل على عروض حصرية.
                                </p>
                                <button 
                                    onClick={() => navigate('/login')}
                                    className="w-full bg-white text-red-700 font-bold py-3.5 rounded-xl shadow-sm hover:bg-red-50 transition-colors"
                                >
                                    تسجيل الدخول / إنشاء حساب
                                </button>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[var(--c-border)]"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-[var(--bg-main)] text-[var(--text-3)]">أو استعلم كزائر</span>
                                </div>
                            </div>

                            <div className="bg-[var(--c-card)] rounded-3xl p-6 shadow-sm border border-[var(--c-border)]">
                                <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Star className="w-7 h-7 fill-amber-500" />
                                </div>
                                <h2 className="text-lg font-bold text-center text-[var(--text-1)] mb-2 font-display">
                                    استعلام سريع عن النقاط
                                </h2>
                                <p className="text-center text-[var(--text-3)] mb-6 text-xs leading-relaxed">
                                    أدخل رقم الهاتف الذي قمت بالطلب منه مسبقاً لمعرفة رصيد نقاطك.
                                </p>

                                <form onSubmit={handleGuestLogin} className="space-y-4">
                                    <div>
                                        <div className="relative">
                                            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)]" />
                                            <input
                                                type="tel"
                                                dir="ltr"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                                placeholder="010XXXXXXXX"
                                                className="w-full bg-[var(--bg-main)] border border-[var(--c-border)] rounded-xl pr-11 pl-4 py-3.5 text-sm font-mono focus:outline-none focus:border-red-500 transition-colors text-[var(--text-1)]"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={guestLoading}
                                        className="w-full bg-neutral-800 hover:bg-neutral-900 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                    >
                                        {guestLoading ? 'جاري البحث...' : 'عرض النقاط'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-2xl text-sm flex items-start gap-3">
                                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold mb-1">أنت تتصفح كزائر</p>
                                    <p className="text-xs text-blue-300">قم بتسجيل الدخول لدمج هذا الرقم بحسابك وتتبع طلباتك السابقة.</p>
                                </div>
                            </div>
                            
                            {renderBalanceCard(guestCustomer, false)}
                            {renderHistory(guestHistory)}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
