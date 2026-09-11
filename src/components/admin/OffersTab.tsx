import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, RefreshCw, Flame, CheckCircle2, XCircle, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { fetchOffers, deleteOffer, updateOffer } from '@/services/menuService';
import OfferModal from './OfferModal';
import type { DBOffer } from '@/types/database';

export default function OffersTab() {
    const [offers, setOffers] = useState<DBOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeModalOffer, setActiveModalOffer] = useState<DBOffer | null | 'new'>(null);

    const loadOffers = async () => {
        setLoading(true);
        try {
            const data = await fetchOffers();
            setOffers(data);
        } catch {
            toast.error('تعذر جلب العروض');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOffers();
    }, []);

    const handleToggleActive = async (o: DBOffer) => {
        const nextState = !o.is_active;
        try {
            await updateOffer(o.id, { is_active: nextState });
            setOffers(prev => prev.map(item => item.id === o.id ? { ...item, is_active: nextState } : item));
            toast.success(nextState ? `تم تفعيل عرض "${o.title}"` : `تم إيقاف عرض "${o.title}"`);
        } catch {
            toast.error('تعذر تحديث حالة العرض');
        }
    };

    const handleDelete = async (o: DBOffer) => {
        if (!confirm(`هل أنت متأكد من رغبتك في حذف عرض "${o.title}"؟`)) return;
        try {
            await deleteOffer(o.id);
            toast.success('تم حذف العرض بنجاح');
            setOffers(prev => prev.filter(item => item.id !== o.id));
        } catch {
            toast.error('تعذر حذف العرض');
        }
    };

    const handleSaved = (saved: DBOffer) => {
        setOffers(prev => {
            const exists = prev.some(item => item.id === saved.id);
            if (exists) {
                return prev.map(item => item.id === saved.id ? saved : item);
            }
            return [saved, ...prev];
        });
        setActiveModalOffer(null);
    };

    return (
        <div className="space-y-6">
            {/* Control Bar */}
            <div className="bg-[#140e11]/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Flame className="w-5 h-5 text-red-500" />
                        <span>إدارة العروض الترويجية والخصومات</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                        هذه العروض تظهر في سكشن خاص في أعلى صفحة المنيو للزبائن لجذب الانتباه.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={loadOffers}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-[#1c1417] hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                        title="تحديث العروض"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : ''}`} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveModalOffer('new')}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] active:scale-95 cursor-pointer"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>إضافة عرض جديد</span>
                    </button>
                </div>
            </div>

            {/* Offers Count */}
            <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                <span>
                    إجمالي العروض: <strong className="text-white">{offers.length}</strong> عروض
                </span>
                <span>تحديثات العروض فورية</span>
            </div>

            {/* Offers Grid */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
                    <span className="text-sm">جاري تحميل العروض...</span>
                </div>
            ) : offers.length === 0 ? (
                <div className="bg-[#140e11]/60 border border-dashed border-white/15 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                    <Layers className="w-12 h-12 text-neutral-600" />
                    <h3 className="text-base font-bold text-white">لا توجد عروض حالياً</h3>
                    <p className="text-xs text-neutral-400">
                        اضغط على زر "إضافة عرض جديد" لإطلاق أول عرض ترويجي للزبائن.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {offers.map((o) => (
                        <div
                            key={o.id}
                            className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-4 backdrop-blur-md transition-all ${
                                o.is_active
                                    ? o.highlight
                                        ? 'bg-gradient-to-br from-[#1f0e13] to-[#140b0e] border-red-500/40 shadow-[0_0_20px_rgba(220,38,38,0.15)]'
                                        : 'bg-[#140e11]/90 border-white/10'
                                    : 'bg-black/40 border-white/5 opacity-50'
                            }`}
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-2xl">{o.icon || '🎮'}</span>
                                        <div>
                                            <h4 className="font-bold text-base text-white">{o.title}</h4>
                                            {o.badge && (
                                                <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full mt-0.5 inline-block">
                                                    {o.badge}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Active badge */}
                                    <button
                                        type="button"
                                        onClick={() => handleToggleActive(o)}
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                            o.is_active
                                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                                : 'bg-neutral-800 text-neutral-400 border border-white/10'
                                        }`}
                                    >
                                        {o.is_active ? 'نشط' : 'معطل'}
                                    </button>
                                </div>

                                <p className="text-xs text-neutral-300 leading-relaxed">
                                    {o.description}
                                </p>

                                {o.detail && (
                                    <p className="text-[11px] text-neutral-400 bg-white/5 p-2 rounded-xl">
                                        💡 {o.detail}
                                    </p>
                                )}

                                <div className="flex items-baseline gap-2 pt-1 border-t border-white/10">
                                    <span className="font-bebas text-2xl font-black text-red-500 tracking-wider">
                                        {o.price}
                                    </span>
                                    {o.original_price && (
                                        <span className="text-xs text-neutral-500 line-through">
                                            {o.original_price}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                                <span className="text-[11px] text-neutral-500">
                                    {o.highlight ? '🔥 مميز بلون مشع' : 'عرض عادي'}
                                </span>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setActiveModalOffer(o)}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                        title="تعديل العرض"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(o)}
                                        className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                                        title="حذف العرض"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Offer Modal */}
            {activeModalOffer && (
                <OfferModal
                    offer={activeModalOffer === 'new' ? null : activeModalOffer}
                    onClose={() => setActiveModalOffer(null)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}
