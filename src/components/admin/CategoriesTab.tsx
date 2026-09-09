import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, RefreshCw, FolderTree, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { fetchCategories, deleteCategory } from '@/services/menuService';
import CategoryModal from './CategoryModal';
import type { DBCategory } from '@/types/database';

export default function CategoriesTab() {
    const [categories, setCategories] = useState<DBCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeModalCategory, setActiveModalCategory] = useState<DBCategory | null | 'new'>(null);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const data = await fetchCategories();
            setCategories(data);
        } catch {
            toast.error('تعذر جلب الأقسام');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleDelete = async (cat: DBCategory) => {
        if (!confirm(`هل أنت متأكد من حذف قسم "${cat.name}"؟ ملاحظة: المنتجات التابعة لهذا القسم ستبقى بدون قسم محدد.`)) {
            return;
        }
        try {
            await deleteCategory(cat.id);
            toast.success(`تم حذف قسم "${cat.name}" بنجاح`);
            setCategories(prev => prev.filter(c => c.id !== cat.id));
        } catch {
            toast.error('تعذر حذف القسم');
        }
    };

    const handleSaved = (saved: DBCategory) => {
        setCategories(prev => {
            const exists = prev.some(c => c.id === saved.id);
            if (exists) {
                return prev.map(c => c.id === saved.id ? saved : c);
            }
            return [...prev, saved].sort((a, b) => a.display_order - b.display_order);
        });
        setActiveModalCategory(null);
    };

    return (
        <div className="space-y-6">
            {/* Control Bar */}
            <div className="bg-[#140e11]/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <FolderTree className="w-5 h-5 text-red-500" />
                        <span>إدارة وتصنيف أقسام المنيو</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                        يمكنك إضافة أو حذف أو تعديل الأقسام التي تظهر في شريط تصفح المنيو للمستخدمين.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={loadCategories}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-[#1c1417] hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                        title="تحديث الأقسام"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : ''}`} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveModalCategory('new')}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] active:scale-95 cursor-pointer"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>إضافة قسم جديد</span>
                    </button>
                </div>
            </div>

            {/* Categories Count */}
            <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                <span>
                    إجمالي الأقسام النشطة: <strong className="text-white">{categories.length}</strong> قسم
                </span>
                <span>تعديلاتك تنعكس فوراً في شريط الأقسام</span>
            </div>

            {/* Categories Grid */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
                    <span className="text-sm">جاري تحميل الأقسام...</span>
                </div>
            ) : categories.length === 0 ? (
                <div className="bg-[#140e11]/60 border border-dashed border-white/15 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                    <Layers className="w-12 h-12 text-neutral-600" />
                    <h3 className="text-base font-bold text-white">لا توجد أقسام مسجلة</h3>
                    <p className="text-xs text-neutral-400">
                        اضغط على "إضافة قسم جديد" لإنشاء أول تصنيف في منيو D95.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categories.map((c) => (
                        <div
                            key={c.id}
                            className="bg-[#140e11]/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3 backdrop-blur-md hover:border-white/20 transition-all"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-xl bg-[#1c1417] border border-white/10 flex items-center justify-center text-2xl shrink-0">
                                    {c.icon || '☕'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="font-bold text-sm text-white truncate">{c.name}</h4>
                                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-neutral-400 font-mono">
                                            #{c.display_order}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-400 line-clamp-2 mt-1 min-h-[32px]">
                                        {c.description || 'بدون وصف'}
                                    </p>
                                    <span className="text-[10px] text-neutral-500 font-mono block mt-1">
                                        ID: {c.id}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setActiveModalCategory(c)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                    title="تعديل بيانات القسم"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDelete(c)}
                                    className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                                    title="حذف القسم"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Category Modal */}
            {activeModalCategory && (
                <CategoryModal
                    category={activeModalCategory === 'new' ? null : activeModalCategory}
                    onClose={() => setActiveModalCategory(null)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}
