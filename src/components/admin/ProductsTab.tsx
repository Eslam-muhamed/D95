import { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Plus,
    Edit3,
    Trash2,
    CheckCircle2,
    XCircle,
    Flame,
    Snowflake,
    RefreshCw,
    ImageIcon,
    Filter,
    Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchCategories, fetchProducts, deleteProduct, updateProduct } from '@/services/menuService';
import ProductModal from './ProductModal';
import type { DBCategory, DBProduct } from '@/types/database';

export default function ProductsTab() {
    const [categories, setCategories] = useState<DBCategory[]>([]);
    const [products, setProducts] = useState<DBProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [activeModalProduct, setActiveModalProduct] = useState<DBProduct | null | 'new'>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [cats, prods] = await Promise.all([
                fetchCategories(),
                fetchProducts('all')
            ]);
            setCategories(cats);
            setProducts(prods);
        } catch {
            toast.error('تعذر جلب قائمة المنتجات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
            const matchesSearch = !search ||
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [products, selectedCategory, search]);

    const handleToggleAvailable = async (p: DBProduct) => {
        const nextState = !p.is_available;
        try {
            await updateProduct(p.id, { is_available: nextState });
            setProducts(prev => prev.map(item => item.id === p.id ? { ...item, is_available: nextState } : item));
            toast.success(nextState ? `أصبح ${p.name} متوفراً في المنيو` : `تم تعيين ${p.name} كغير متوفر`);
        } catch {
            toast.error('تعذر تحديث حالة التوفر');
        }
    };

    const handleDelete = async (p: DBProduct) => {
        if (!confirm(`هل أنت متأكد من حذف المنتج "${p.name}"؟`)) return;
        try {
            await deleteProduct(p.id);
            toast.success(`تم حذف "${p.name}" بنجاح`);
            setProducts(prev => prev.filter(item => item.id !== p.id));
        } catch {
            toast.error('تعذر حذف المنتج');
        }
    };

    const handleSaved = (saved: DBProduct) => {
        setProducts(prev => {
            const exists = prev.some(item => item.id === saved.id);
            if (exists) {
                return prev.map(item => item.id === saved.id ? saved : item);
            }
            return [saved, ...prev];
        });
        setActiveModalProduct(null);
    };

    return (
        <div className="space-y-6">
            {/* Control Bar */}
            <div className="bg-[#140e11]/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ابحث عن منتج أو مشروب..."
                        className="w-full bg-[#1c1417] border border-white/10 rounded-xl pr-10 pl-3 py-2 text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
                    />
                </div>

                {/* Actions & Category Selector */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2 bg-[#1c1417] px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                        <Filter className="w-3.5 h-3.5 text-neutral-400" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-transparent text-white text-xs outline-none cursor-pointer"
                        >
                            <option value="all" className="bg-[#140e11]">جميع الأقسام ({products.length})</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id} className="bg-[#140e11]">
                                    {c.icon} {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={loadData}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-[#1c1417] hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                        title="تحديث القائمة"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : ''}`} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveModalProduct('new')}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] active:scale-95 cursor-pointer"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>إضافة منتج جديد</span>
                    </button>
                </div>
            </div>

            {/* Product count stats */}
            <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                <span>
                    المعروض: <strong className="text-white">{filteredProducts.length}</strong> من أصل{' '}
                    <strong className="text-neutral-300">{products.length}</strong> منتج
                </span>
                <span>متصل بقاعدة البيانات Supabase</span>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
                    <span className="text-sm">جاري تحميل المنتجات...</span>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="bg-[#140e11]/60 border border-dashed border-white/15 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                    <Layers className="w-12 h-12 text-neutral-600" />
                    <h3 className="text-base font-bold text-white">لا توجد منتجات مطابقة للبحث</h3>
                    <p className="text-xs text-neutral-400">
                        جرب تغيير القسم أو البحث، أو أضف منتجاً جديداً بالضغط على زر "إضافة منتج جديد".
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map((p) => {
                        const category = categories.find(c => c.id === p.category_id);

                        return (
                            <div
                                key={p.id}
                                className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 backdrop-blur-md bg-[#140e11]/90 transition-all ${
                                    p.is_available
                                        ? 'border-white/10 hover:border-white/20'
                                        : 'border-red-950/40 opacity-60 bg-black/40'
                                }`}
                            >
                                <div className="space-y-3">
                                    {/* Thumbnail + Badges */}
                                    <div className="relative w-full h-36 rounded-xl bg-[#1c1417] overflow-hidden flex items-center justify-center border border-white/5">
                                        {p.image_url ? (
                                            <img
                                                src={p.image_url}
                                                alt={p.name}
                                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-neutral-700" />
                                        )}

                                        {/* Availability overlay tag */}
                                        {!p.is_available && (
                                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                                <span className="bg-red-600 text-white font-bold text-xs px-3 py-1 rounded-full shadow">
                                                    غير متوفر حالياً
                                                </span>
                                            </div>
                                        )}

                                        {/* Badge top right */}
                                        {p.badge && (
                                            <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-md">
                                                {p.badge === 'Popular'
                                                    ? '🔥 الأكثر طلباً'
                                                    : p.badge === 'New'
                                                    ? '✨ جديد'
                                                    : p.badge === "Chef's Choice"
                                                    ? '⭐ اختيار الشيف'
                                                    : p.badge}
                                            </span>
                                        )}

                                        {/* Temperature Icon */}
                                        <div className="absolute top-2 left-2 flex gap-1">
                                            {p.is_hot && (
                                                <span className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-amber-400">
                                                    <Flame className="w-3.5 h-3.5" />
                                                </span>
                                            )}
                                            {p.is_cold && (
                                                <span className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-sky-400">
                                                    <Snowflake className="w-3.5 h-3.5" />
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div>
                                        {category && (
                                            <span className="text-[10px] text-neutral-400 font-semibold block mb-0.5">
                                                {category.icon} {category.name}
                                            </span>
                                        )}
                                        <h3 className="font-bold text-sm text-white line-clamp-1">{p.name}</h3>
                                        <p className="text-xs text-neutral-400 line-clamp-2 mt-1 min-h-[32px]">
                                            {p.description || 'بدون وصف مضاف'}
                                        </p>
                                    </div>

                                    {/* Price section */}
                                    <div className="flex items-baseline gap-2 pt-1">
                                        <span className="font-bold text-base text-red-500 font-mono">
                                            {p.price} {p.currency}
                                        </span>
                                        {p.original_price && p.original_price > p.price && (
                                            <span className="text-xs text-neutral-500 line-through font-mono">
                                                {p.original_price} {p.currency}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions bottom */}
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                                    {/* Toggle Availability Switch */}
                                    <button
                                        type="button"
                                        onClick={() => handleToggleAvailable(p)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                            p.is_available
                                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                                                : 'bg-neutral-800 text-neutral-400 border border-white/10'
                                        }`}
                                        title="تغيير حالة التوفر في المنيو"
                                    >
                                        {p.is_available ? (
                                            <>
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>متوفر</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-3.5 h-3.5" />
                                                <span>نفد</span>
                                            </>
                                        )}
                                    </button>

                                    <div className="flex items-center gap-1.5">
                                        {/* Edit */}
                                        <button
                                            type="button"
                                            onClick={() => setActiveModalProduct(p)}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                            title="تعديل المنتج"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Delete */}
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(p)}
                                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                                            title="حذف المنتج"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Product Create/Edit Modal */}
            {activeModalProduct && (
                <ProductModal
                    product={activeModalProduct === 'new' ? null : activeModalProduct}
                    categories={categories}
                    onClose={() => setActiveModalProduct(null)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}
