import { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createOffer, updateOffer } from '@/services/menuService';
import type { DBOffer } from '@/types/database';

interface OfferModalProps {
    offer: DBOffer | null;
    onClose: () => void;
    onSaved: (saved: DBOffer) => void;
}

export default function OfferModal({ offer, onClose, onSaved }: OfferModalProps) {
    const isEdit = !!offer;

    const [title, setTitle] = useState(offer?.title || '');
    const [description, setDescription] = useState(offer?.description || '');
    const [detail, setDetail] = useState(offer?.detail || '');
    const [badge, setBadge] = useState(offer?.badge || '');
    const [price, setPrice] = useState(offer?.price || '');
    const [originalPrice, setOriginalPrice] = useState(offer?.original_price || '');
    const [icon, setIcon] = useState(offer?.icon || '🎮');
    const [highlight, setHighlight] = useState(offer ? offer.highlight : true);
    const [isActive, setIsActive] = useState(offer ? offer.is_active : true);
    const [saving, setSaving] = useState(false);

    const commonIcons = ['🎮', '☕', '👥', '⚡', '🍔', '🍕', '🔥', '🏆', '🎯', '✨'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !price.trim()) {
            toast.error('يرجى كتابة عنوان العرض وسعر العرض');
            return;
        }

        setSaving(true);
        try {
            const offerData = {
                title: title.trim(),
                description: description.trim() || null,
                detail: detail.trim() || null,
                badge: badge.trim() || null,
                price: price.trim(),
                original_price: originalPrice.trim() || null,
                icon: icon.trim() || '🎮',
                highlight,
                is_active: isActive,
                display_order: offer?.display_order ?? 1,
            };

            let saved: DBOffer;
            if (isEdit && offer) {
                saved = await updateOffer(offer.id, offerData);
                toast.success('تم تحديث العرض بنجاح!');
            } else {
                saved = await createOffer(offerData);
                toast.success('تمت إضافة العرض الترويجي بنجاح!');
            }

            onSaved(saved);
        } catch (err: unknown) {
            console.error(err);
            toast.error('حدث خطأ أثناء حفظ العرض');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs" dir="rtl">
            <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 left-5 text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-slate-900 mb-1">
                    {isEdit ? 'تعديل بيانات العرض الترويجي' : 'إضافة عرض ترويجي جديد'}
                </h2>
                <p className="text-xs text-slate-500 mb-6">
                    العروض تظهر في سكشن خاص ومميز في قمة صفحة المنيو للزبائن.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            عنوان العرض *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="مثال: Gaming Night Deal"
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            محتويات وتفاصيل العرض
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="مثال: ساعتين غيمنج + مشروب بارد + ساندوتش طازج"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            جملة تحفيزية إضافية
                        </label>
                        <input
                            type="text"
                            value={detail}
                            onChange={(e) => setDetail(e.target.value)}
                            placeholder="مثال: وفر 28% على أفضل تجربة سهرة وتنافس"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                سعر العرض *
                            </label>
                            <input
                                type="text"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="180 ج.م أو خصم 20%"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                السعر الأصلي قبل العرض
                            </label>
                            <input
                                type="text"
                                value={originalPrice}
                                onChange={(e) => setOriginalPrice(e.target.value)}
                                placeholder="مثال: 250 ج.م"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                شارة التوفير (Badge)
                            </label>
                            <input
                                type="text"
                                value={badge}
                                onChange={(e) => setBadge(e.target.value)}
                                placeholder="مثال: وفّر 28% أو الأكثر طلباً"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                أيقونة العرض
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    className="w-12 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-center text-lg text-slate-900 focus:bg-white focus:outline-none focus:border-red-500"
                                />
                                <div className="flex flex-wrap gap-1">
                                    {commonIcons.slice(0, 5).map(ic => (
                                        <button
                                            key={ic}
                                            type="button"
                                            onClick={() => setIcon(ic)}
                                            className="w-7 h-7 rounded-lg hover:bg-slate-200 text-sm flex items-center justify-center cursor-pointer transition-colors"
                                        >
                                            {ic}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                            <input
                                type="checkbox"
                                checked={highlight}
                                onChange={(e) => setHighlight(e.target.checked)}
                                className="w-4 h-4 rounded text-red-600 bg-white border-slate-300 focus:ring-red-500"
                            />
                            <span className="text-xs font-bold text-slate-800">تمييز العرض بلون مشع (Highlight)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600 bg-white border-slate-300 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-bold text-slate-800">العرض نشط حالياً للزبائن</span>
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                            <span>{isEdit ? 'حفظ التعديلات' : 'إضافة العرض'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
