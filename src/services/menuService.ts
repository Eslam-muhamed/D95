import { supabase } from '@/lib/supabase';
import type { DBCategory, DBProduct, DBOffer } from '@/types/database';
import { categories as fallbackCategories } from '@/constants/menuMetadata';
import { allItems as fallbackItems } from '@/constants/menuData';

// ================= CATEGORIES =================

export async function fetchCategories(): Promise<DBCategory[]> {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error || !data || data.length === 0) {
            console.warn('Fallback to local categories:', error?.message);
            return fallbackCategories.map((c, i) => ({
                id: c.id,
                name: c.name,
                icon: c.icon || '☕',
                description: c.description || null,
                display_order: i + 1,
            }));
        }

        return data as DBCategory[];
    } catch (err) {
        console.error('Error fetching categories:', err);
        return fallbackCategories.map((c, i) => ({
            id: c.id,
            name: c.name,
            icon: c.icon || '☕',
            description: c.description || null,
            display_order: i + 1,
        }));
    }
}

export async function createCategory(cat: Omit<DBCategory, 'created_at'>): Promise<DBCategory> {
    const { data, error } = await supabase
        .from('categories')
        .insert([cat])
        .select()
        .single();

    if (error) throw error;
    return data as DBCategory;
}

export async function updateCategory(id: string, updates: Partial<DBCategory>): Promise<DBCategory> {
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
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ================= PRODUCTS =================

export async function fetchProducts(categoryId?: string): Promise<DBProduct[]> {
    try {
        let query = supabase
            .from('products')
            .select('*')
            .order('display_order', { ascending: true });

        if (categoryId && categoryId !== 'all') {
            query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query;

        if (error || !data || data.length === 0) {
            console.warn('Fallback to local items:', error?.message);
            const items = categoryId && categoryId !== 'all'
                ? fallbackItems.filter(i => i.category === categoryId)
                : fallbackItems;

            return items.map((it, i) => ({
                id: it.id || `local-${i}`,
                slug: it.id,
                category_id: it.category,
                name: it.name,
                description: it.description || '',
                price: it.price || 0,
                original_price: null,
                currency: it.currency || 'ج.م',
                image_url: it.image || '',
                badge: it.badge || null,
                is_available: true,
                is_hot: !!it.isHot,
                is_cold: !!it.isCold,
                tags: it.tags || [],
                display_order: i + 1,
            }));
        }

        return data as DBProduct[];
    } catch (err) {
        console.error('Error fetching products:', err);
        return [];
    }
}

export async function createProduct(product: Omit<DBProduct, 'id' | 'created_at'>): Promise<DBProduct> {
    const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

    if (error) throw error;
    return data as DBProduct;
}

export async function updateProduct(id: string, updates: Partial<DBProduct>): Promise<DBProduct> {
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

export async function fetchOffers(): Promise<DBOffer[]> {
    try {
        const { data, error } = await supabase
            .from('offers')
            .select('*')
            .order('display_order', { ascending: true });

        if (error || !data || data.length === 0) {
            return [];
        }

        return data as DBOffer[];
    } catch (err) {
        console.error('Error fetching offers:', err);
        return [];
    }
}

export async function createOffer(offer: Omit<DBOffer, 'id' | 'created_at'>): Promise<DBOffer> {
    const { data, error } = await supabase
        .from('offers')
        .insert([offer])
        .select()
        .single();

    if (error) throw error;
    return data as DBOffer;
}

export async function updateOffer(id: string, updates: Partial<DBOffer>): Promise<DBOffer> {
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
    const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
