import re

with open("src/features/menu/services/menuService.ts", "r") as f:
    content = f.read()

# Add localStorage helpers
local_storage_code = """
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
"""

# Find where to insert it (after imports)
content = content.replace("export function getCachedCategories(): DBCategory[] | null {", local_storage_code + "\nexport function getCachedCategories(): DBCategory[] | null {")

# Update getters
content = content.replace("""export function getCachedCategories(): DBCategory[] | null {
    if (cachedCategories && (Date.now() - cachedCategoriesTime < CACHE_TTL_MS)) {
        return cachedCategories;
    }
    return null;
}""", """export function getCachedCategories(): DBCategory[] | null {
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
}""")

content = content.replace("""export function getCachedProducts(): DBProduct[] | null {
    if (cachedProducts && (Date.now() - cachedProductsTime < CACHE_TTL_MS)) {
        return cachedProducts;
    }
    return null;
}""", """export function getCachedProducts(): DBProduct[] | null {
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
}""")

content = content.replace("""export function getCachedOffers(): DBOffer[] | null {
    if (cachedOffers && (Date.now() - cachedOffersTime < CACHE_TTL_MS)) {
        return cachedOffers;
    }
    return null;
}""", """export function getCachedOffers(): DBOffer[] | null {
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
}""")

# Update clearCache
content = content.replace("""export function clearMenuCache(): void {
    cachedCategories = null;
    cachedCategoriesTime = 0;
    cachedProducts = null;
    cachedProductsTime = 0;
    cachedOffers = null;
    cachedOffersTime = 0;
}""", """export function clearMenuCache(): void {
    cachedCategories = null;
    cachedCategoriesTime = 0;
    cachedProducts = null;
    cachedProductsTime = 0;
    cachedOffers = null;
    cachedOffersTime = 0;
    clearStored();
}""")

# Update fetchCategories
content = content.replace("""        const categories = (data || []) as DBCategory[];
        cachedCategories = categories;
        cachedCategoriesTime = Date.now();
        return categories;""", """        const categories = (data || []) as DBCategory[];
        cachedCategories = categories;
        cachedCategoriesTime = Date.now();
        setStored('categories', categories);
        return categories;""")

# Update fetchProducts
content = content.replace("""        const products = (data || []) as DBProduct[];
        if (isAll) {
            cachedProducts = products;
            cachedProductsTime = Date.now();
        }
        return products;""", """        const products = (data || []) as DBProduct[];
        if (isAll) {
            cachedProducts = products;
            cachedProductsTime = Date.now();
            setStored('products', products);
        }
        return products;""")

# Update fetchOffers
content = content.replace("""        cachedOffers = data as DBOffer[];
        cachedOffersTime = Date.now();
        return data as DBOffer[];""", """        cachedOffers = data as DBOffer[];
        cachedOffersTime = Date.now();
        setStored('offers', data);
        return data as DBOffer[];""")

with open("src/features/menu/services/menuService.ts", "w") as f:
    f.write(content)

