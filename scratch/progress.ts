import fs from 'fs';
const path = 'src/features/menu/services/menuService.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace function signature
content = content.replace(
    /export async function applyGlobalDiscount\(discountPercent: number \| null\) {/,
    "export async function applyGlobalDiscount(discountPercent: number | null, onProgress?: (progress: number) => void) {"
);

// Replace chunking block
const chunkBlock = `    // Update in chunks to avoid browser/Supabase rate limits
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
    }`;

const newChunkBlock = `    // Update in chunks to avoid browser/Supabase rate limits
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
    }`;

content = content.replace(chunkBlock, newChunkBlock);
fs.writeFileSync(path, content);
console.log("Added onProgress to applyGlobalDiscount");
