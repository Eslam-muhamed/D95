import { useState, useEffect } from 'react';
import { Star, Search, CheckCircle2, History, Plus, Minus, User, ShieldAlert, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { fetchAllCustomers, adminAdjustPoints, getPointsPerEgp, updatePointsPerEgp } from '@/services/loyaltyService';
import type { DBCustomer, DBLoyaltyTransaction } from '@/types/database';
import { supabase } from '@/lib/supabase';

export default function LoyaltyTab() {
    const [customers, setCustomers] = useState<DBCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Settings
    const [pointsRate, setPointsRate] = useState<number>(1);
    const [isUpdatingRate, setIsUpdatingRate] = useState(false);

    // Modal state
    const [selectedCustomer, setSelectedCustomer] = useState<DBCustomer | null>(null);
    const [history, setHistory] = useState<DBLoyaltyTransaction[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    
    // Adjustment modal
    const [adjustMode, setAdjustMode] = useState<'add' | 'deduct' | null>(null);
    const [adjustPoints, setAdjustPoints] = useState<number | ''>('');
    const [adjustReason, setAdjustReason] = useState('');
    const [isAdjusting, setIsAdjusting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [custData, rate] = await Promise.all([
                fetchAllCustomers(),
                getPointsPerEgp()
            ]);
            setCustomers(custData);
            setPointsRate(rate);
        } catch (error) {
            console.error(error);
            toast.error('فشل تحميل بيانات الولاء');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleUpdateRate = async () => {
        if (pointsRate <= 0) {
            toast.error('يجب أن يكون المعدل أكبر من صفر');
            return;
        }
        setIsUpdatingRate(true);
        try {
            await updatePointsPerEgp(pointsRate);
            toast.success('تم تحديث معدل النقاط بنجاح');
        } catch (error) {
            toast.error('فشل تحديث المعدل');
        } finally {
            setIsUpdatingRate(false);
        }
    };

    const handleViewHistory = async (customer: DBCustomer) => {
        setSelectedCustomer(customer);
        setLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from('loyalty_transactions')
                .select('*')
                .eq('customer_id', customer.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setHistory(data || []);
        } catch (error) {
            console.error('Error fetching loyalty history:', error);
            toast.error('فشل تحميل السجل');
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleAdjust = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer || !adjustMode || !adjustPoints || adjustPoints <= 0 || !adjustReason.trim()) {
            toast.error('برجاء إكمال البيانات');
            return;
        }

        const pointValue = adjustMode === 'deduct' ? -Number(adjustPoints) : Number(adjustPoints);
        
        if (adjustMode === 'deduct' && selectedCustomer.loyalty_points_balance + pointValue < 0) {
            toast.error('لا يمكن خصم نقاط أكثر من الرصيد الحالي');
            return;
        }

        setIsAdjusting(true);
        try {
            await adminAdjustPoints(selectedCustomer.id, pointValue, adjustReason);
            toast.success('تم تحديث الرصيد بنجاح');
            setAdjustMode(null);
            setAdjustPoints('');
            setAdjustReason('');
            
            // Refresh
            handleViewHistory(selectedCustomer);
            loadData();
            
            // Update local selected customer to reflect new balance immediately
            setSelectedCustomer(prev => prev ? {
                ...prev,
                loyalty_points_balance: prev.loyalty_points_balance + pointValue
            } : null);

        } catch (error) {
            toast.error('فشل تحديث الرصيد');
        } finally {
            setIsAdjusting(false);
        }
    };

    const filteredCustomers = customers.filter(c => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        const nameMatch = c.full_name && c.full_name.toLowerCase().includes(q);
        const emailMatch = c.email && c.email.toLowerCase().includes(q);
        const phoneMatch = c.phone_number && c.phone_number.includes(q);
        return Boolean(nameMatch || emailMatch || phoneMatch);
    });

    return (
        <div className="space-y-6" dir="rtl">
            {/* Settings Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    إعدادات النقاط (Loyalty Settings)
                </h3>
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            معدل كسب النقاط (نقاط لكل جنيه)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={pointsRate}
                            onChange={(e) => setPointsRate(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-red-500"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleUpdateRate}
                        disabled={isUpdatingRate}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-colors shrink-0"
                    >
                        {isUpdatingRate ? 'جاري الحفظ...' : 'حفظ المعدل'}
                    </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    يتم احتساب النقاط تلقائياً عندما تتغير حالة الطلب إلى "مكتمل".
                </p>
            </div>

            {/* Customers List */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-slate-500" />
                        العملاء والنقاط ({customers.length})
                    </h3>
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث بالاسم أو رقم الهاتف..."
                            className="w-full sm:w-72 bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-red-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4">العميل</th>
                                <th className="px-6 py-4">الحساب / جهة الاتصال</th>
                                <th className="px-6 py-4">الرصيد الحالي</th>
                                <th className="px-6 py-4 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-slate-500">جاري التحميل...</td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-slate-500">لا يوجد عملاء يطابقون البحث.</td>
                                </tr>
                            ) : (
                                filteredCustomers.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                                                    {c.full_name ? c.full_name.slice(0, 2) : 'ع'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{c.full_name || 'عميل مسجل'}</p>
                                                    {c.email && (
                                                        <span className="text-[11px] text-slate-400 font-mono block mt-0.5" dir="ltr">{c.email}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {c.phone_number ? (
                                                <span className="font-mono text-sm block" dir="ltr">{c.phone_number}</span>
                                            ) : c.email ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-md border border-emerald-200/60">
                                                    حساب مسجل (Google)
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">غير محدد</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-amber-500 text-base">
                                            {c.loyalty_points_balance.toLocaleString()}
                                            <span className="text-xs text-amber-600/70 font-sans mr-1">نقطة</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleViewHistory(c)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                                            >
                                                <History className="w-3.5 h-3.5" />
                                                السجل والتعديل
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* History & Adjust Modal */}
            {selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">سجل نقاط العميل</h3>
                                <div className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-slate-800">{selectedCustomer.full_name || 'بدون اسم'}</span>
                                    {selectedCustomer.email && (
                                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded" dir="ltr">
                                            {selectedCustomer.email}
                                        </span>
                                    )}
                                    {selectedCustomer.phone_number && (
                                        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded" dir="ltr">
                                            {selectedCustomer.phone_number}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-center">
                                <span className="block text-xs font-bold text-slate-500 mb-1">الرصيد الحالي</span>
                                <span className="inline-flex items-center justify-center bg-amber-100 text-amber-700 font-bold font-mono px-4 py-1.5 rounded-xl text-lg">
                                    {selectedCustomer.loyalty_points_balance.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="p-5 overflow-y-auto flex-1 bg-slate-50/30">
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 mb-6">
                                <button
                                    onClick={() => setAdjustMode('add')}
                                    className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                        adjustMode === 'add' 
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                    }`}
                                >
                                    <Plus className="w-4 h-4" /> إضافة نقاط
                                </button>
                                <button
                                    onClick={() => setAdjustMode('deduct')}
                                    className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                        adjustMode === 'deduct' 
                                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' 
                                        : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                    }`}
                                >
                                    <Minus className="w-4 h-4" /> خصم نقاط
                                </button>
                            </div>

                            {/* Adjust Form */}
                            {adjustMode && (
                                <form onSubmit={handleAdjust} className="mb-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 text-slate-400" />
                                        {adjustMode === 'add' ? 'إضافة نقاط يدوية' : 'خصم نقاط يدوي'}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">مقدار النقاط</label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                value={adjustPoints}
                                                onChange={(e) => setAdjustPoints(Number(e.target.value))}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">السبب (للمراجعة)</label>
                                            <input
                                                type="text"
                                                required
                                                value={adjustReason}
                                                onChange={(e) => setAdjustReason(e.target.value)}
                                                placeholder="مثال: تعويض عن تأخير، هدية..."
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={isAdjusting}
                                            className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-sm"
                                        >
                                            {isAdjusting ? 'جاري التنفيذ...' : 'تأكيد العملية'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAdjustMode(null)}
                                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Transaction History List */}
                            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <History className="w-4 h-4 text-slate-500" />
                                آخر الحركات
                            </h4>
                            
                            {loadingHistory ? (
                                <div className="text-center py-6 text-slate-500 text-sm">جاري التحميل...</div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-6 bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
                                    لا توجد حركات مسجلة لهذا العميل.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {history.map((tx) => {
                                        const isPositive = tx.points > 0;
                                        return (
                                            <div key={tx.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-slate-900">{tx.description}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                                                        <span>{new Date(tx.created_at).toLocaleString('ar-EG')}</span>
                                                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                                                            tx.type === 'EARN' ? 'bg-blue-50 text-blue-600' :
                                                            tx.type === 'REFUND' ? 'bg-amber-50 text-amber-600' :
                                                            tx.type === 'REDEEM' ? 'bg-purple-50 text-purple-600' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {tx.type}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={`font-mono font-bold text-lg shrink-0 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {isPositive ? '+' : ''}{tx.points}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                        </div>
                        
                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-white">
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                            >
                                إغلاق النافذة
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
