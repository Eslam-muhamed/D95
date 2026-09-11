import { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createCategory, updateCategory } from '@/services/menuService';
import type { DBCategory } from '@/types/database';

interface CategoryModalProps {
    category: DBCategory | null;
    onClose: () => void;
    onSaved: (cat: DBCategory) => void;
}

export default function CategoryModal({ category, onClose, onSaved }: CategoryModalProps) {
    const isEdit = !!category;

    const [id, setId] = useState(category?.id || '');
    const [name, setName] = useState(category?.name || '');
    const [icon, setIcon] = useState(category?.icon || '☕');
    const [description, setDescription] = useState(category?.description || '');
    const [order, setOrder] = useState(category?.display_order?.toString() || '1');
    const [saving, setSaving] = useState(false);

    const commonIcons = ['☕', '🧊', '🍊', '🥤', '🍹', '🥛', '🍰', '🧇', '🫔', '🥪', '🍝', '🍳', '💨', '✨', '🎮', '🍔', '🍟', '🍕'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('يرجى كتابة اسم القسم');
            return;
        }

        const cleanId = id.trim() || name.trim().toLowerCase().replace(/\s+/g, '-');

        setSaving(true);
        try {
            const catData = {
                id: cleanId,
                name: name.trim(),
                icon: icon.trim() || '☕',
                description: description.trim() || null,
                display_order: Number(order) || 1,
            };

            let saved: DBCategory;
            if (isEdit && category) {
                saved = await updateCategory(category.id, catData);
                toast.success('تم تحديث القسم بنجاح!');
            } else {
                saved = await createCategory(catData);
                toast.success('تمت إضافة القسم الجديد بنجاح!');
            }

            onSaved(saved);
        } catch (err: unknown) {
            console.error(err);
            toast.error('حدث خطأ أثناء حفظ القسم. تأكد أن معرف القسم فريد.');
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
                    {isEdit ? 'تعديل بيانات القسم' : 'إضافة قسم جديد للمنيو'}
                </h2>
                <p className="text-xs text-slate-500 mb-6">
                    أقسام المنيو تظهر في شريط التصنيفات للزبائن لتسهيل التصفح.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            اسم القسم (بالعربي) *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (!isEdit && !id) {
                                    setId(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                                }
                            }}
                            placeholder="مثال: مشروبات طاقة وسناك"
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            الأيقونة التعبيرية (Emoji) *
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center text-xl text-slate-900 focus:bg-white focus:outline-none focus:border-red-500"
                            />
                            <div className="flex flex-wrap gap-1.5 flex-1 bg-slate-50 p-2 rounded-xl border border-slate-200 max-h-24 overflow-y-auto">
                                {commonIcons.map((ic) => (
                                    <button
                                        key={ic}
                                        type="button"
                                        onClick={() => setIcon(ic)}
                                        className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-lg cursor-pointer transition-colors"
                                    >
                                        {ic}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {!isEdit && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                المعرف الفريد للقسم (ID / Slug)
                            </label>
                            <input
                                type="text"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                placeholder="energy-drinks"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            وصف القسم
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="وصف ترويجي مختصر للقسم..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            ترتيب الظهور في القائمة
                        </label>
                        <input
                            type="number"
                            value={order}
                            onChange={(e) => setOrder(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-red-500"
                        />
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
                            <span>{isEdit ? 'حفظ التعديلات' : 'إضافة القسم'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
