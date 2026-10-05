import { supabase } from '@/lib/supabase';
import type { DBCategory, DBProduct, DBOffer } from '@/types/database';
import { categories as fallbackCategories } from '@/constants/menuMetadata';

// ================= IN-MEMORY CACHE (INSTANT 0MS TAB SWITCHING) =================
let cachedCategories: DBCategory[] | null = null;
let cachedCategoriesTime = 0;

let cachedProducts: DBProduct[] | null = null;
let cachedProductsTime = 0;

let cachedOffers: DBOffer[] | null = null;
let cachedOffersTime = 0;

const CACHE_TTL_MS = 1000 * 60 * 3; // 3 minutes cache for blazing fast switching


// ================= LOCAL STORAGE CACHE HELPERS =================
function getStored<T>(key: string): T | null {
    try {
        const itemStr = localStorage.getItem('d95_menu_' + key);
        if (!itemStr) return null;
        const item = JSON.parse(itemStr);
        // Check if the cache has expired (older than 3 minutes)
        if (Date.now() - item.time > 1000 * 60 * 3) {
            localStorage.removeItem('d95_menu_' + key);
            return null;
        }
        return item.data as T;
    } catch {
        return null;
    }
}

function setStored<T>(key: string, data: T) {
    try {
        localStorage.setItem('d95_menu_' + key, JSON.stringify({ data, time: Date.now() }));
    } catch { /* ignore */ }
}

function clearStored() {
    try {
        localStorage.removeItem('d95_menu_categories');
        localStorage.removeItem('d95_menu_products');
        localStorage.removeItem('d95_menu_offers');
    } catch { /* ignore */ }
}

export function getCachedCategories(): DBCategory[] | null {
    if (cachedCategories && (Date.now() - cachedCategoriesTime < CACHE_TTL_MS)) {
        return cachedCategories;
    }
    const stored = getStored<DBCategory[]>('categories');
    if (stored) {
        cachedCategories = stored;
        cachedCategoriesTime = Date.now();
        return stored;
    }
    return null;
}

export function getCachedProducts(): DBProduct[] | null {
    if (cachedProducts && (Date.now() - cachedProductsTime < CACHE_TTL_MS)) {
        return cachedProducts;
    }
    const stored = getStored<DBProduct[]>('products');
    if (stored) {
        cachedProducts = stored;
        cachedProductsTime = Date.now();
        return stored;
    }
    return null;
}

export function getCachedOffers(): DBOffer[] | null {
    if (cachedOffers && (Date.now() - cachedOffersTime < CACHE_TTL_MS)) {
        return cachedOffers;
    }
    const stored = getStored<DBOffer[]>('offers');
    if (stored) {
        cachedOffers = stored;
        cachedOffersTime = Date.now();
        return stored;
    }
    return null;
}

export function clearMenuCache(): void {
    cachedCategories = null;
    cachedCategoriesTime = 0;
    cachedProducts = null;
    cachedProductsTime = 0;
    cachedOffers = null;
    cachedOffersTime = 0;
    clearStored();
}

export async function preloadMenuData(): Promise<void> {
    try {
        await Promise.all([
            fetchCategories(),
            fetchProducts('all'),
            fetchOffers()
        ]);
    } catch {
        // Silent catch for preloading
    }
}

// ================= CATEGORIES =================

export async function fetchCategories(forceRefresh = false): Promise<DBCategory[]> {
    if (!forceRefresh && cachedCategories && (Date.now() - cachedCategoriesTime < CACHE_TTL_MS)) {
        return cachedCategories;
    }

    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) {
            console.warn('Fallback to local categories due to error:', error.message);
            const fallback = fallbackCategories.map((c, i) => ({
                id: c.id,
                name: c.name,
                icon: c.icon || '☕',
                description: c.description || null,
                display_order: i + 1,
            }));
            cachedCategories = fallback;
            cachedCategoriesTime = Date.now();
            return fallback;
        }

        const categories = (data || []) as DBCategory[];
        cachedCategories = categories;
        cachedCategoriesTime = Date.now();
        setStored('categories', categories);
        return categories;
    } catch (err) {
        console.error('Error fetching categories:', err);
        const fallback = fallbackCategories.map((c, i) => ({
            id: c.id,
            name: c.name,
            icon: c.icon || '☕',
            description: c.description || null,
            display_order: i + 1,
        }));
        cachedCategories = fallback;
        cachedCategoriesTime = Date.now();
        return fallback;
    }
}

export async function createCategory(cat: Omit<DBCategory, 'created_at'>): Promise<DBCategory> {
    clearMenuCache();
    const { data, error } = await supabase
        .from('categories')
        .insert([cat])
        .select()
        .single();

    if (error) throw error;
    return data as DBCategory;
}

export async function updateCategory(id: string, updates: Partial<DBCategory>): Promise<DBCategory> {
    clearMenuCache();
    const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as DBCategory;
}

export async function deleteCategory(id: string): Promise<void> {
    clearMenuCache();
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ================= PRODUCTS =================

export async function fetchProducts(categoryId?: string, forceRefresh = false): Promise<DBProduct[]> {
    const isAll = !categoryId || categoryId === 'all';

    // Fast path: if all products are cached in memory, return immediately or filter in-memory (0ms)
    if (!forceRefresh && cachedProducts && (Date.now() - cachedProductsTime < CACHE_TTL_MS)) {
        if (!isAll) {
            return cachedProducts.filter(p => p.category_id === categoryId);
        }
        return cachedProducts;
    }

    try {
        let query = supabase
            .from('products')
            .select('*')
            .order('display_order', { ascending: true });

        if (!isAll) {
            query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching products from database:', error.message);
            return [];
        }

        const products = (data || []) as DBProduct[];
        if (isAll) {
            cachedProducts = products;
            cachedProductsTime = Date.now();
            setStored('products', products);
        }
        return products;
    } catch (err) {
        console.error('Error fetching products:', err);
        return [];
    }
}

export async function createProduct(product: Omit<DBProduct, 'id' | 'created_at'>): Promise<DBProduct> {
    clearMenuCache();
    const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

    if (error) throw error;
    return data as DBProduct;
}

export async function updateProduct(id: string, updates: Partial<DBProduct>): Promise<DBProduct> {
    clearMenuCache();
    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as DBProduct;
}

export async function deleteProduct(id: string): Promise<void> {
    clearMenuCache();
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ================= STORAGE (IMAGE UPLOAD) =================

export async function uploadProductImage(file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
        throw new Error('الرجاء رفع ملف صورة صالح.');
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error('حجم الملف يتجاوز الحد المسموح به (5 ميجابايت)');
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error('إعدادات Cloudinary غير مكتملة، يرجى إضافتها في ملف .env');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    // Upload to Cloudinary Unsigned API
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'حدث خطأ أثناء رفع الصورة');
    }

    const data = await response.json();
    
    // تحسين الرابط لتصغير الحجم والضغط التلقائي
    // سيتم تحويل الصورة لتكون بعرض أقصى 600 بكسل مع ضغط الجودة تلقائياً
    const optimizedUrl = data.secure_url.replace(
        '/upload/',
        '/upload/w_600,c_limit,q_auto,f_auto/'
    );
    
    return optimizedUrl;
}

export async function deleteProductImage(imageUrl: string): Promise<void> {
    if (!imageUrl) return;

    try {
        if (imageUrl.includes('supabase.co')) {
            // Legacy Supabase Storage image deletion
            const filePath = imageUrl.split('/menu-images/')[1];
            if (filePath) {
                await supabase.storage.from('menu-images').remove([filePath]);
            }
        } else if (imageUrl.includes('cloudinary.com')) {
            // New Cloudinary image deletion (calls Edge Function)
            await supabase.functions.invoke('delete-cloudinary-image', {
                body: { imageUrl }
            });
        }
    } catch (err) {
        console.error('Failed to delete image:', err);
    }
}

// ================= OFFERS =================

export async function fetchOffers(forceRefresh = false): Promise<DBOffer[]> {
    if (!forceRefresh && cachedOffers && (Date.now() - cachedOffersTime < CACHE_TTL_MS)) {
        return cachedOffers;
    }

    try {
        const { data, error } = await supabase
            .from('offers')
            .select('*')
            .order('display_order', { ascending: true });

        if (error || !data || data.length === 0) {
            cachedOffers = [];
            cachedOffersTime = Date.now();
            return [];
        }

        cachedOffers = data as DBOffer[];
        cachedOffersTime = Date.now();
        setStored('offers', data);
        return data as DBOffer[];
    } catch (err) {
        console.error('Error fetching offers:', err);
        return [];
    }
}

export async function createOffer(offer: Omit<DBOffer, 'id' | 'created_at'>): Promise<DBOffer> {
    clearMenuCache();
    const { data, error } = await supabase
        .from('offers')
        .insert([offer])
        .select()
        .single();

    if (error) throw error;
    return data as DBOffer;
}

export async function updateOffer(id: string, updates: Partial<DBOffer>): Promise<DBOffer> {
    clearMenuCache();
    const { data, error } = await supabase
        .from('offers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as DBOffer;
}

export async function deleteOffer(id: string): Promise<void> {
    clearMenuCache();
    const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', id);

    if (error) throw error;
}


export async function applyGlobalDiscount(discountPercent: number | null, onProgress?: (progress: number) => void) {
    const { data: products, error } = await supabase.from('products').select('*');
    if (error || !products) throw error;
    
    const fullUpdates = products.map(p => {
        let original_price = p.original_price;
        let price = p.price;
        
        if (discountPercent === null) {
            // Remove discount
            if (original_price && original_price > 0) {
                price = original_price;
                original_price = null;
            }
        } else {
            // Apply discount
            const basePrice = (original_price && original_price > 0) ? original_price : price;
            const discountAmount = Math.floor(basePrice * (discountPercent / 100));
            price = Math.max(0, basePrice - discountAmount);
            original_price = basePrice;
        }
        
        return {
            ...p,
            price,
            original_price
        };
    });

    
    // Update in chunks to avoid browser/Supabase rate limits
    let hasError = false;
    const CHUNK_SIZE = 10;
    let processed = 0;
    const total = fullUpdates.length;
    
    if (onProgress) onProgress(0);

    for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk = fullUpdates.slice(i, i + CHUNK_SIZE);
        const promises = chunk.map(p => 
            supabase.from('products')
                .update({ price: p.price, original_price: p.original_price })
                .eq('id', p.id)
        );
        const results = await Promise.all(promises);
        if (results.some(r => r.error)) {
            hasError = true;
            console.error("Some updates failed in chunk", i);
        }
        
        processed += chunk.length;
        if (onProgress) {
            onProgress(Math.min(100, Math.round((processed / total) * 100)));
        }
    }
    
    if (hasError) {
        throw new Error("بعض المنتجات لم يتم تحديثها بسبب الضغط، يرجى المحاولة مرة أخرى");
    }

    
    invalidateMenuCache();
}
