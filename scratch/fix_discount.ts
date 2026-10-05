import fs from 'fs';
const path = 'src/features/menu/services/menuService.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/const { error: upsertError } = await supabase\.from\('products'\)\.upsert\(fullUpdates, { onConflict: 'id' }\);\n\s*if \(upsertError\) throw upsertError;/g, `
    const updatePromises = fullUpdates.map(p => 
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
    }
`);

fs.writeFileSync(path, content);
console.log("Fixed applyGlobalDiscount");
