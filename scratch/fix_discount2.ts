import fs from 'fs';
const path = 'src/features/menu/services/menuService.ts';
let content = fs.readFileSync(path, 'utf8');

// The block to replace:
const targetBlock = `    const updatePromises = fullUpdates.map(p => 
        supabase.from('products').update({
            price: p.price,
            original_price: p.original_price
        }).eq('id', p.id)
    );
    
    const results = await Promise.all(updatePromises);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
        console.error("Errors updating products:", errors.map(e => e.error));
        throw new Error("Failed to update some products");
    }`;

const newBlock = `    // Update in chunks to avoid browser/Supabase rate limits
    let hasError = false;
    const CHUNK_SIZE = 10;
    for (let i = 0; i < fullUpdates.length; i += CHUNK_SIZE) {
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
    }
    
    if (hasError) {
        throw new Error("بعض المنتجات لم يتم تحديثها بسبب الضغط، يرجى المحاولة مرة أخرى");
    }`;

content = content.replace(targetBlock, newBlock);
fs.writeFileSync(path, content);
console.log("Fixed applyGlobalDiscount concurrency limits");
