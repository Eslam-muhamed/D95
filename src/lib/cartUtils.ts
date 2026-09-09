import type { CartItem, ItemCustomization } from '@/types/cart';

/**
 * Calculates the unit price of a cart item including extra shots or customizations
 */
export function getItemUnitPrice(item: Pick<CartItem, 'price' | 'customization'>): number {
    return item.price + (item.customization.extraShot ? 15 : 0);
}

/**
 * Formats customization options into readable Arabic badge tags
 */
export function formatCustomizationTags(c: ItemCustomization): string[] {
    const tags: string[] = [];
    if (c.sugar !== undefined) {
        const labels = ['بدون سكر', 'معلقة', 'معلقتين', '3 معالق', '4 معالق', '5 معالق'];
        tags.push(labels[c.sugar] ?? '');
    }
    if (c.ice) {
        const iceMap = { none: 'بدون ثلج', little: 'ثلج خفيف', normal: 'ثلج عادي', extra: 'ثلج زيادة' };
        tags.push(iceMap[c.ice]);
    }
    if (c.extraShot) tags.push('شوت إضافي (+15 ج.م)');
    if (c.cream) tags.push('كريمة');
    if (c.honey) tags.push('عسل');
    if (c.toppings && c.toppings.length > 0) {
        tags.push(...c.toppings);
    }
    return tags;
}
