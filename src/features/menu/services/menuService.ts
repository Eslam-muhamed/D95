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
        return item.data as T;
    } catch {
        return null;
    }
}

function setStored<T>(key: string, data: T) {
    try {
        localStorage.setItem('d95_menu_' + key, JSON.stringify({ data, time: Date.now() }));
    } catch {}
}

function clearStored() {
    try {
        localStorage.removeItem('d95_menu_categories');
        localStorage.removeItem('d95_menu_products');
        localStorage.removeItem('d95_menu_offers');
    } catch {}
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
    if (file.size > 5 * 1024 * 1024) {
        throw new Error('حجم الملف يتجاوز الحد المسموح به (5 ميجابايت)');
    }

    const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
    const fileExt = allowedExtensions.includes(rawExt) ? rawExt : 'jpg';

    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
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
