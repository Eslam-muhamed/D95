import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Flame, Snowflake, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createProduct, updateProduct, uploadProductImage } from '@/services/menuService';
import type { DBCategory, DBProduct } from '@/types/database';

interface ProductModalProps {
    product: DBProduct | null;
    categories: DBCategory[];
    onClose: () => void;
    onSaved: (savedProduct: DBProduct) => void;
}

export default function ProductModal({ product, categories, onClose, onSaved }: ProductModalProps) {
    const isEdit = !!product;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState(product?.name || '');
    const [categoryId, setCategoryId] = useState(product?.category_id || categories[0]?.id || '');
    const [price, setPrice] = useState(product?.price?.toString() || '');
    const [originalPrice, setOriginalPrice] = useState(product?.original_price?.toString() || '');
    const [description, setDescription] = useState(product?.description || '');
    const [imageUrl, setImageUrl] = useState(product?.image_url || '');
    const [badge, setBadge] = useState<string>(product?.badge || '');
    const [isAvailable, setIsAvailable] = useState(product ? product.is_available : true);
    const [isHot, setIsHot] = useState(product?.is_hot || false);
    const [isCold, setIsCold] = useState(product?.is_cold || false);

    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('برجاء اختيار ملف صورة صالح (JPG, PNG, WebP)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('حجم الصورة كبير جداً، الحد الأقصى هو 5 ميجابايت');
            return;
        }

        setUploading(true);
        try {
            const uploadedUrl = await uploadProductImage(file);
            setImageUrl(uploadedUrl);
            toast.success('تم رفع الصورة بنجاح!');
        } catch (err: unknown) {
            console.error(err);
            toast.error('حدث خطأ أثناء رفع الصورة، يمكنك وضع رابط الصورة يدوياً');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('يرجى إدخال اسم المنتج');
            return;
        }
        if (!price || isNaN(Number(price))) {
            toast.error('يرجى كتابة سعر صحيح');
            return;
        }

        setSaving(true);
        try {
            const productData = {
                name: name.trim(),
                category_id: categoryId,
                price: Number(price),
                original_price: originalPrice ? Number(originalPrice) : null,
                currency: 'ج.م',
                description: description.trim(),
                image_url: imageUrl.trim() || null,
                badge: badge.trim() || null,
                is_available: isAvailable,
                is_hot: isHot,
                is_cold: isCold,
                tags: [],
                display_order: product?.display_order ?? 999,
            };

            let saved: DBProduct;
            if (isEdit && product) {
                saved = await updateProduct(product.id, productData);
                toast.success('تم تحديث بيانات المنتج بنجاح!');
            } else {
                saved = await createProduct(productData);
                toast.success('تمت إضافة المنتج الجديد بنجاح!');
            }

            onSaved(saved);
        } catch (err: unknown) {
            console.error(err);
            toast.error('حدث خطأ أثناء الحفظ');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto" dir="rtl">
            <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl my-8">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 left-5 text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-slate-900 mb-1">
                    {isEdit ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد للمنيو'}
                </h2>
                <p className="text-xs text-slate-500 mb-6">
                    قم بتعبئة بيانات الصنف وسيتم تحديثه مباشرة في موقع الزبائن.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name & Category Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                اسم المنتج (عربي) *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="مثال: سبانش لاتيه بارد"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                القسم التابع له *
                            </label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-red-500 cursor-pointer"
                            >
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.icon} {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Price & Discount Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                سعر البيع (ج.م) *
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="مثال: 65"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                السعر قبل الخصم (اختياري)
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                value={originalPrice}
                                onChange={(e) => setOriginalPrice(e.target.value)}
                                placeholder="مثال: 80 (سيظهر مشطوباً كعرض)"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-500"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            وصف المنتج ومكوناته
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            placeholder="وصف مختصر للطبق أو المشروب ومكوناته المميزة..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-500 resize-none"
                        />
                    </div>

                    {/* Image Section (Upload or URL) */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            صورة المنتج
                        </label>
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                            {/* Preview */}
                            <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative group">
                                {imageUrl ? (
                                    <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-7 h-7 text-slate-400" />
                                )}
                            </div>

                            <div className="flex-1 space-y-2 w-full">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        disabled={uploading}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200"
                                    >
                                        {uploading ? (
                                             <>
                                                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                                                <span>جاري الرفع...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                <span>رفع صورة من الجهاز</span>
                                            </>
                                        )}
                                    </button>
                                    <span className="text-[11px] text-slate-500">أو ضع الرابط بالأسفل</span>
                                </div>

                                <input
                                    type="url"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://images.unsplash.com/..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Badge & Temperature Flags */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                شارة مميزة (Badge)
                            </label>
                            <select
                                value={badge}
                                onChange={(e) => setBadge(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-red-500 cursor-pointer"
                            >
                                <option value="">بدون شارة</option>
                                <option value="Popular">🔥 الأكثر طلباً (Popular)</option>
                                <option value="New">✨ جديد (New)</option>
                                <option value="Chef's Choice">⭐ اختيار الشيف (Chef's Choice)</option>
                            </select>
                        </div>

                        {/* Temp toggles */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                تصنيف المشروب
                            </label>
                            <div className="flex items-center gap-3 pt-1">
                                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isHot}
                                        onChange={(e) => setIsHot(e.target.checked)}
                                        className="rounded border-slate-300 text-red-600 focus:ring-red-500 bg-white"
                                    />
                                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                                    <span>ساخن</span>
                                </label>

                                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isCold}
                                        onChange={(e) => setIsCold(e.target.checked)}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white"
                                    />
                                    <Snowflake className="w-3.5 h-3.5 text-sky-500" />
                                    <span>بارد / مثلج</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Availability Switch */}
                    <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                            <input
                                type="checkbox"
                                checked={isAvailable}
                                onChange={(e) => setIsAvailable(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 bg-white"
                            />
                            <span className="text-xs font-bold text-slate-800">
                                المنتج متوفر حالياً في المنيو للزبائن
                            </span>
                        </label>
                    </div>

                    {/* Submit and Cancel Buttons */}
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
                            disabled={saving || uploading}
                            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4 stroke-[3]" />
                            )}
                            <span>{isEdit ? 'حفظ التعديلات' : 'إضافة المنتج للمنيو'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
