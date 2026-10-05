import fs from 'fs';
const path = 'src/features/menu/services/menuService.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /export async function applyGlobalDiscount[\s\S]*$/;

const newFunc = `export async function applyGlobalDiscount(discountPercent: number | null, onProgress?: (progress: number) => void) {
    const { data: products, error } = await supabase.from('products').select('*');
    if (error || !products) throw error;
    
    const fullUpdates = products.map(p => {
        let original_price = p.original_price ? Number(p.original_price) : null;
        let price = Number(p.price) || 0;
        
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
            id: p.id,
            price,
            original_price
        };
    });

    let processed = 0;
    const total = fullUpdates.length;
    let hasError = false;
    
    if (onProgress) onProgress(0);

    for (const p of fullUpdates) {
        try {
            // Sequential update, exactly identical to manual update
            const { error: updateError } = await supabase
                .from('products')
                .update({ price: p.price, original_price: p.original_price })
                .eq('id', p.id)
                .select()
                .single();
                
            if (updateError) throw updateError;
        } catch (err) {
            console.error("Failed on product", p.id, err);
            hasError = true;
        }
        
        processed++;
        if (onProgress) {
            onProgress(Math.min(100, Math.round((processed / total) * 100)));
        }
    }
    
    invalidateMenuCache();
    
    if (hasError) {
        throw new Error("بعض المنتجات فشل تحديثها");
    }
}
`;

content = content.replace(regex, newFunc);
fs.writeFileSync(path, content);
console.log("Replaced applyGlobalDiscount");
