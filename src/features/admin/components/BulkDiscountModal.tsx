import { useState } from 'react';
import { X, Check, Loader2, Percent, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { applyGlobalDiscount } from '@/features/menu/services/menuService';

interface BulkDiscountModalProps {
    onClose: () => void;
    onSaved: () => void;
}

export default function BulkDiscountModal({ onClose, onSaved }: BulkDiscountModalProps) {
    const [percentage, setPercentage] = useState('10');
    const [saving, setSaving] = useState(false);
    const [removing, setRemoving] = useState(false);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        const percent = Number(percentage);
        if (isNaN(percent) || percent <= 0 || percent > 99) {
            toast.error('يرجى إدخال نسبة خصم صحيحة (1 إلى 99)');
            return;
        }

        if (!confirm(`هل أنت متأكد من تطبيق خصم ${percent}% على جميع مشروبات وأصناف المنيو؟`)) return;

        setSaving(true);
        try {
            await applyGlobalDiscount(percent);
            toast.success(`تم تطبيق الخصم ${percent}% بنجاح على جميع الأصناف`);
            onSaved();
        } catch (err) {
            console.error(err);
            toast.error('حدث خطأ أثناء تطبيق الخصم');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveAll = async () => {
        if (!confirm(`هل أنت متأكد من إزالة جميع الخصومات من المنيو وإعادة الأسعار الأصلية؟`)) return;

        setRemoving(true);
        try {
            await applyGlobalDiscount(null);
            toast.success('تم إزالة جميع الخصومات بنجاح');
            onSaved();
        } catch (err) {
            console.error(err);
            toast.error('حدث خطأ أثناء إزالة الخصومات');
        } finally {
            setRemoving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs" dir="rtl">
            <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 left-5 text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <Percent className="w-5 h-5 text-red-600" />
                    <span>خصم شامل للمنيو</span>
                </h2>
                <p className="text-xs text-slate-500 mb-6">
                    قم بتطبيق نسبة خصم ثابتة على جميع أصناف المنيو بضغطة زر.
                </p>

                <form onSubmit={handleApply} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            نسبة الخصم المئوية (%)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                max="99"
                                value={percentage}
                                onChange={(e) => setPercentage(e.target.value)}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-slate-900 focus:bg-white focus:outline-none focus:border-red-500 font-mono text-center font-bold text-lg"
                            />
                            <Percent className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving || removing}
                        className="w-full px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 stroke-[3]" />}
                        <span>تطبيق الخصم الشامل</span>
                    </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={handleRemoveAll}
                        disabled={saving || removing}
                        className="w-full px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs transition-all active:scale-95 cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                        {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                        <span>إلغاء وإزالة كل الخصومات</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
