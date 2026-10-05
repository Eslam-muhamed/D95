import fs from 'fs';
const path = 'src/features/menu/services/menuService.ts';
let content = fs.readFileSync(path, 'utf8');

const newFunc = `

export async function applyGlobalDiscount(discountPercent: number | null) {
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

    const { error: upsertError } = await supabase.from('products').upsert(fullUpdates, { onConflict: 'id' });
    if (upsertError) throw upsertError;
    
    invalidateMenuCache();
}
`;

content += newFunc;
fs.writeFileSync(path, content);
console.log("Added applyGlobalDiscount");
