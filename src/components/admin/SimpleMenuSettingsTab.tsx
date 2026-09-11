import React, { useState, useEffect, useMemo } from 'react';
import {
    UtensilsCrossed,
    FolderTree,
    Flame,
    Gamepad2,
    Search,
    Plus,
    Edit3,
    Trash2,
    CheckCircle2,
    XCircle,
    RefreshCw,
    ImageIcon,
    Check,
    Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    fetchCategories,
    fetchProducts,
    deleteProduct,
    updateProduct,
    deleteCategory,
    fetchOffers,
    deleteOffer,
    updateOffer,
} from '@/services/menuService';
import { fetchRoomRates, updateRoomRates, type RoomRates } from '@/services/bookingService';
import ProductModal from './ProductModal';
import CategoryModal from './CategoryModal';
import OfferModal from './OfferModal';
import CategoryIcon from '@/components/features/CategoryIcon';
import type { DBCategory, DBProduct, DBOffer } from '@/types/database';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';

type SubSection = 'products' | 'categories' | 'offers' | 'room_rates';

export default function SimpleMenuSettingsTab() {
    const [activeSection, setActiveSection] = useState<SubSection>('products');

    // Products & Categories Data
    const [categories, setCategories] = useState<DBCategory[]>([]);
    const [products, setProducts] = useState<DBProduct[]>([]);
    const [offers, setOffers] = useState<DBOffer[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [search, setSearch] = useState('');

    // Modals
    const [activeModalProduct, setActiveModalProduct] = useState<DBProduct | null | 'new'>(null);
    const [activeModalCategory, setActiveModalCategory] = useState<DBCategory | null | 'new'>(null);
    const [activeModalOffer, setActiveModalOffer] = useState<DBOffer | null | 'new'>(null);

    // Room Rates
    const [roomRates, setRoomRates] = useState<RoomRates>({ 'room-1': 100, 'room-2': 100 });
    const [rateRoom1, setRateRoom1] = useState<number>(100);
    const [rateRoom2, setRateRoom2] = useState<number>(100);
    const [savingRates, setSavingRates] = useState<boolean>(false);

    // Load All Menu & Rates Data
    const loadAllData = async () => {
        setLoading(true);
        try {
            const [cats, prods, offs, rates] = await Promise.all([
                fetchCategories(),
                fetchProducts('all'),
                fetchOffers(),
                fetchRoomRates(),
            ]);
            setCategories(cats);
            setProducts(prods);
            setOffers(offs);
            setRoomRates(rates);
            setRateRoom1(rates['room-1'] || 100);
            setRateRoom2(rates['room-2'] || 100);
        } catch {
            toast.error('تعذر جلب بيانات المنيو والأسعار');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    // Filtered Products
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
            const matchesSearch =
                !search ||
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [products, selectedCategory, search]);

    // Fast Toggle Product Availability
    const handleToggleAvailable = async (p: DBProduct) => {
        playPs5SelectSound();
        const nextState = !p.is_available;
        try {
            await updateProduct(p.id, { is_available: nextState });
            setProducts((prev) =>
                prev.map((item) => (item.id === p.id ? { ...item, is_available: nextState } : item))
            );
            toast.success(
                nextState ? `تم تفعيل توفر "${p.name}" في المنيو` : `تم تعيين "${p.name}" كـ غير متوفر`
            );
        } catch {
            toast.error('تعذر تعديل حالة التوفر');
        }
    };

    // Delete Product
    const handleDeleteProduct = async (p: DBProduct) => {
        playPs5NavigateSound();
        if (!confirm(`هل أنت متأكد من رغبتك في حذف "${p.name}" من المنيو نهائياً؟`)) return;
        try {
            await deleteProduct(p.id);
            toast.success('تم حذف الصنف بنجاح');
            setProducts((prev) => prev.filter((item) => item.id !== p.id));
        } catch {
            toast.error('تعذر حذف الصنف');
        }
    };

    // Save Product from modal
    const handleSavedProduct = (saved: DBProduct) => {
        setProducts((prev) => {
            const exists = prev.some((p) => p.id === saved.id);
            if (exists) {
                return prev.map((p) => (p.id === saved.id ? saved : p));
            }
            return [saved, ...prev];
        });
        setActiveModalProduct(null);
    };

    // Delete Category
    const handleDeleteCategory = async (cat: DBCategory) => {
        playPs5NavigateSound();
        if (!confirm(`هل أنت متأكد من حذف قسم "${cat.name}"؟ ملاحظة: الأصناف التابعة له ستبقى بدون قسم محدد.`)) return;
        try {
            await deleteCategory(cat.id);
            toast.success(`تم حذف قسم "${cat.name}" بنجاح`);
            setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        } catch {
            toast.error('تعذر حذف القسم');
        }
    };

    // Save Category from modal
    const handleSavedCategory = (saved: DBCategory) => {
        setCategories((prev) => {
            const exists = prev.some((c) => c.id === saved.id);
            if (exists) {
                return prev.map((c) => (c.id === saved.id ? saved : c));
            }
            return [...prev, saved].sort((a, b) => a.display_order - b.display_order);
        });
        setActiveModalCategory(null);
    };

    // Toggle Offer Active
    const handleToggleOfferActive = async (o: DBOffer) => {
        playPs5SelectSound();
        const nextState = !o.is_active;
        try {
            await updateOffer(o.id, { is_active: nextState });
            setOffers((prev) => prev.map((item) => (item.id === o.id ? { ...item, is_active: nextState } : item)));
            toast.success(nextState ? `تم تفعيل عرض "${o.title}"` : `تم إيقاف عرض "${o.title}"`);
        } catch {
            toast.error('تعذر تحديث حالة العرض');
        }
    };

    // Delete Offer
    const handleDeleteOffer = async (o: DBOffer) => {
        playPs5NavigateSound();
        if (!confirm(`هل أنت متأكد من حذف عرض "${o.title}"؟`)) return;
        try {
            await deleteOffer(o.id);
            toast.success('تم حذف العرض بنجاح');
            setOffers((prev) => prev.filter((item) => item.id !== o.id));
        } catch {
            toast.error('تعذر حذف العرض');
        }
    };

    // Save Offer from modal
    const handleSavedOffer = (saved: DBOffer) => {
        setOffers((prev) => {
            const exists = prev.some((item) => item.id === saved.id);
            if (exists) {
                return prev.map((item) => (item.id === saved.id ? saved : item));
            }
            return [saved, ...prev];
        });
        setActiveModalOffer(null);
    };

    // Save Room Rates
    const handleSaveRoomRates = async () => {
        setSavingRates(true);
        try {
            const updated = await updateRoomRates({
                'room-1': Number(rateRoom1) || 100,
                'room-2': Number(rateRoom2) || 100,
            });
            setRoomRates(updated);
            toast.success('تم تحديث وحفظ أسعار ساعات الغرف بنجاح! 🎮');
        } catch {
            toast.error('تعذر حفظ أسعار الغرف');
        } finally {
            setSavingRates(false);
        }
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Top Navigation / Section Switcher */}
            <div className="bg-[#140e11] border border-white/10 rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2 shadow-md">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={() => { playPs5NavigateSound(); setActiveSection('products'); }}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            activeSection === 'products'
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <UtensilsCrossed className="w-4 h-4" />
                        <span>الأصناف والمشروبات ({products.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { playPs5NavigateSound(); setActiveSection('categories'); }}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            activeSection === 'categories'
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <FolderTree className="w-4 h-4" />
                        <span>أقسام المنيو ({categories.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { playPs5NavigateSound(); setActiveSection('offers'); }}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            activeSection === 'offers'
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Flame className="w-4 h-4" />
                        <span>العروض الترويجية ({offers.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { playPs5NavigateSound(); setActiveSection('room_rates'); }}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            activeSection === 'room_rates'
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Gamepad2 className="w-4 h-4" />
                        <span>أسعار ساعات الغرف</span>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={loadAllData}
                    disabled={loading}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors cursor-pointer mr-auto sm:mr-0"
                    title="تحديث البيانات"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : ''}`} />
                </button>
            </div>

            {/* SECTION 1: PRODUCTS & DRINKS */}
            {activeSection === 'products' && (
                <div className="space-y-4">
                    {/* Controls & Search Bar */}
                    <div className="bg-[#140e11] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="ابحث عن صنف أو مشروب..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-[#1c1417] text-white text-xs rounded-xl pr-10 pl-4 py-2.5 border border-white/10 outline-none focus:border-red-500"
                            />
                        </div>

                        {/* Category Dropdown */}
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-[#1c1417] text-white text-xs border border-white/10 rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                            >
                                <option value="all">جميع الأقسام ({products.length})</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>

                            {/* Add Product Button */}
                            <button
                                type="button"
                                onClick={() => setActiveModalProduct('new')}
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                                <span>صنف جديد</span>
                            </button>
                        </div>
                    </div>

                    {/* Products Grid */}
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl p-8 text-neutral-400 text-xs">
                            لا توجد أصناف مطابقة للبحث أو القسم المحدد.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                            {filteredProducts.map((p) => (
                                <div
                                    key={p.id}
                                    className={`bg-[#140e11] border rounded-2xl p-3.5 flex flex-col justify-between gap-3 transition-all ${
                                        p.is_available
                                            ? 'border-white/10 hover:border-white/20'
                                            : 'border-red-950/40 opacity-70 bg-[#120c0f]'
                                    }`}
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-3">
                                            {/* Image / Placeholder */}
                                            <div className="w-14 h-14 rounded-xl bg-[#1c1417] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                {p.image_url ? (
                                                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-6 h-6 text-neutral-600" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <h4 className="font-bold text-sm text-white truncate">{p.name}</h4>
                                                    <span className="text-emerald-400 font-bold font-mono text-sm shrink-0">
                                                        {p.price} ج.م
                                                    </span>
                                                </div>

                                                {p.description && (
                                                    <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                                                        {p.description}
                                                    </p>
                                                )}

                                                <span className="text-[10px] text-neutral-500 font-medium block mt-1">
                                                    {categories.find((c) => c.id === p.category_id)?.name || 'غير مصنف'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Row: Toggle Stock Switch & Edit / Delete */}
                                    <div className="pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
                                        {/* In-Stock Switch */}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleAvailable(p)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                                p.is_available
                                                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                                                    : 'bg-red-950/40 text-red-400 border border-red-500/30'
                                            }`}
                                            title="اضغط لتغيير حالة التوفر فوراً"
                                        >
                                            {p.is_available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                            <span>{p.is_available ? 'متوفر' : 'نفذ'}</span>
                                        </button>

                                        {/* Edit & Delete */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setActiveModalProduct(p)}
                                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                                                title="تعديل الصنف والسعر"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteProduct(p)}
                                                className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 transition-colors cursor-pointer"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* SECTION 2: CATEGORIES */}
            {activeSection === 'categories' && (
                <div className="space-y-4">
                    <div className="bg-[#140e11] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-white">أقسام وتصنيفات المنيو</h3>
                            <p className="text-xs text-neutral-400">تنظيم المنيو في أقسام يسهل على الزبون التصفح والطلب.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActiveModalCategory('new')}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                            <Plus className="w-4 h-4" />
                            <span>قسم جديد</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                className="bg-[#140e11] border border-white/10 rounded-xl p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center">
                                        <CategoryIcon iconName={cat.icon} className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-white">{cat.name}</h4>
                                        <span className="text-[11px] text-neutral-400">
                                            {products.filter((p) => p.category_id === cat.id).length} أصناف
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setActiveModalCategory(cat)}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white"
                                        title="تعديل"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteCategory(cat)}
                                        className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400"
                                        title="حذف"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECTION 3: OFFERS */}
            {activeSection === 'offers' && (
                <div className="space-y-4">
                    <div className="bg-[#140e11] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-white">العروض الترويجية والخصومات</h3>
                            <p className="text-xs text-neutral-400">العروض تظهر بشكل بارز في أعلى صفحة المنيو للزبائن.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActiveModalOffer('new')}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                            <Plus className="w-4 h-4" />
                            <span>عرض جديد</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {offers.map((offer) => (
                            <div
                                key={offer.id}
                                className="bg-[#140e11] border border-white/10 rounded-xl p-4 space-y-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 className="font-bold text-sm text-white">{offer.title}</h4>
                                        <p className="text-xs text-neutral-400 mt-0.5">{offer.description}</p>
                                    </div>
                                    <span className="text-emerald-400 font-bold font-mono text-sm">{offer.price}</span>
                                </div>

                                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleOfferActive(offer)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                                            offer.is_active
                                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-neutral-800 text-neutral-400'
                                        }`}
                                    >
                                        {offer.is_active ? 'نشط معروض' : 'معطل'}
                                    </button>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setActiveModalOffer(offer)}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteOffer(offer)}
                                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECTION 4: ROOM RATES */}
            {activeSection === 'room_rates' && (
                <div className="max-w-xl bg-[#140e11] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                        <Gamepad2 className="w-5 h-5 text-red-500" />
                        <h3 className="text-base font-bold text-white">أسعار ساعات اللعب في غرف البلايستيشن</h3>
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed">
                        يتم استخدام هذه الأسعار تلقائياً لحساب تكلفة الحجز عند اختيار الزبون للغرفة والمدة.
                    </p>

                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="text-xs font-bold text-neutral-300 block mb-1">
                                سعر ساعة الغرفة 1 (Room 1):
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    value={rateRoom1}
                                    onChange={(e) => setRateRoom1(Number(e.target.value))}
                                    className="w-full bg-[#1c1417] text-white font-mono font-bold text-sm rounded-xl px-3 py-2.5 border border-white/15 outline-none focus:border-red-500"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">ج.م / ساعة</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-neutral-300 block mb-1">
                                سعر ساعة الغرفة 2 (Room 2):
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    value={rateRoom2}
                                    onChange={(e) => setRateRoom2(Number(e.target.value))}
                                    className="w-full bg-[#1c1417] text-white font-mono font-bold text-sm rounded-xl px-3 py-2.5 border border-white/15 outline-none focus:border-red-500"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">ج.م / ساعة</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-3">
                        <button
                            type="button"
                            onClick={handleSaveRoomRates}
                            disabled={savingRates}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-900/30"
                        >
                            {savingRates ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            <span>حفظ الأسعار وتطبيقها فوراً</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {activeModalProduct && (
                <ProductModal
                    product={activeModalProduct === 'new' ? null : activeModalProduct}
                    categories={categories}
                    onClose={() => setActiveModalProduct(null)}
                    onSaved={handleSavedProduct}
                />
            )}

            {activeModalCategory && (
                <CategoryModal
                    category={activeModalCategory === 'new' ? null : activeModalCategory}
                    onClose={() => setActiveModalCategory(null)}
                    onSaved={handleSavedCategory}
                />
            )}

            {activeModalOffer && (
                <OfferModal
                    offer={activeModalOffer === 'new' ? null : activeModalOffer}
                    onClose={() => setActiveModalOffer(null)}
                    onSaved={handleSavedOffer}
                />
            )}
        </div>
    );
}
