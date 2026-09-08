export interface CategoryOptions {
    hasSugar: boolean;
    hasIce: boolean;
    hasExtraShot: boolean;
    hasCream: boolean;
    hasHoney: boolean;
    toppingOptions?: string[];
}

export const categoryOptions: Record<string, CategoryOptions> = {
    'hot-drinks': {
        hasSugar: true,
        hasIce: false,
        hasExtraShot: true,
        hasCream: false,
        hasHoney: false,
    },
    'cold-drinks': {
        hasSugar: true,
        hasIce: true,
        hasExtraShot: true,
        hasCream: true,
        hasHoney: false,
    },
    'fresh-juice': {
        hasSugar: true,
        hasIce: true,
        hasExtraShot: false,
        hasCream: false,
        hasHoney: false,
    },
    'smoothies': {
        hasSugar: false,
        hasIce: true,
        hasExtraShot: false,
        hasCream: false,
        hasHoney: true,
        toppingOptions: ['شيا سيدز', 'جوز الهند', 'مكسرات', 'حبة البركة'],
    },
    'mocktails': {
        hasSugar: true,
        hasIce: true,
        hasExtraShot: false,
        hasCream: false,
        hasHoney: false,
    },
    'milkshakes': {
        hasSugar: false,
        hasIce: false,
        hasExtraShot: false,
        hasCream: true,
        hasHoney: false,
        toppingOptions: ['شوكولاتة مبشورة', 'رشة قرفة', 'كراميل', 'أوريو'],
    },
    'desserts': {
        hasSugar: false,
        hasIce: false,
        hasExtraShot: false,
        hasCream: true,
        hasHoney: true,
        toppingOptions: ['مكسرات', 'شوكولاتة', 'كراميل', 'فواكه'],
    },
    'waffles': {
        hasSugar: false,
        hasIce: false,
        hasExtraShot: false,
        hasCream: true,
        hasHoney: true,
        toppingOptions: ['شوكولاتة', 'كراميل', 'مكسرات', 'فواكه', 'أوريو', 'لوتس'],
    },
    'crepes': {
        hasSugar: false,
        hasIce: false,
        hasExtraShot: false,
        hasCream: true,
        hasHoney: true,
        toppingOptions: ['شوكولاتة', 'فراولة', 'موز', 'مكسرات'],
    },
    'sandwiches': {
        hasSugar: false,
        hasIce: false,
        hasExtraShot: false,
        hasCream: false,
        hasHoney: false,
    },
    'pasta': {
        hasSugar: false,
        hasIce: false,
        hasExtraShot: false,
        hasCream: false,
        hasHoney: false,
    },
    'breakfast': {
        hasSugar: false,
        hasIce: false,
        hasExtraShot: false,
        hasCream: false,
        hasHoney: false,
    },
    'shisha': {
        hasSugar: false,
        hasIce: false,
        hasExtraShot: false,
        hasCream: false,
        hasHoney: false,
    },
    'extras': {
        hasSugar: false,
        hasIce: false,
        hasExtraShot: false,
        hasCream: false,
        hasHoney: false,
    },
};

export function getCategoryOptions(categoryId: string): CategoryOptions {
    return categoryOptions[categoryId] ?? {
        hasSugar: false,
        hasIce: false,
        hasExtraShot: false,
        hasCream: false,
        hasHoney: false,
    };
}

export const sugarLevels = [
    { value: undefined, label: 'بدون تفضيل' },
    { value: 0, label: 'بدون سكر' },
    { value: 1, label: 'معلقة' },
    { value: 2, label: 'معلقتين' },
    { value: 3, label: '3 معالق' },
    { value: 4, label: '4 معالق' },
    { value: 5, label: '5 معالق' },
];
