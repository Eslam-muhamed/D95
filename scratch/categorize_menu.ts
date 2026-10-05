import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const categoriesToCreate = [
  { id: 'classic-coffee', name: 'قهوة كلاسيك', icon: '☕', display_order: 1 },
  { id: 'milk-coffee', name: 'قهوة بالحليب', icon: '☕', display_order: 2 },
  { id: 'tea-herbs', name: 'شاي وأعشاب', icon: '☕', display_order: 3 },
  { id: 'winter-drinks', name: 'مشروبات شتوية', icon: '☕', display_order: 4 },
  { id: 'iced-coffee', name: 'قهوة مثلجة', icon: '🧊', display_order: 5 },
  { id: 'milkshake-frappe', name: 'ميلك شيك وفرابيه', icon: '🥛', display_order: 6 },
  { id: 'fresh-juices', name: 'عصائر فريش', icon: '🍊', display_order: 7 },
  { id: 'smoothies', name: 'سموزي', icon: '🥤', display_order: 8 },
  { id: 'mojito-mixes', name: 'موهيتو وميكسات', icon: '🍹', display_order: 9 },
  { id: 'energy-drinks', name: 'مشروبات غازية وطاقة', icon: '🥤', display_order: 10 },
];

function determineCategoryId(productName: string): string {
    const name = productName.toLowerCase();
    
    // Iced Coffee takes precedence over Milk Coffee
    if (name.includes('ايس ') || name.includes('افوغاتو') || name.includes('برتقال اسبريسو')) {
        return 'iced-coffee';
    }
    
    // Milkshakes & Frappe
    if (name.includes('ميلك تشيك') || name.includes('فرابيه')) {
        return 'milkshake-frappe';
    }
    
    // Smoothies
    if (name.includes('سموزي')) {
        return 'smoothies';
    }
    
    // Fresh Juices
    if (name.includes('عصير')) {
        return 'fresh-juices';
    }
    
    // Mojito & Mixes
    if (name.includes('موهيتو') || name.includes('سكاي') || name.includes('صن شاين') || 
        name.includes('جاميكا') || name.includes('فلوريدا') || name.includes('فرجينيا') || 
        name.includes('مانجو باشن') || name.includes('اوشن') || name.includes('هاني صودا') || 
        name.includes('ليومينيد') || name.includes('جرين اي')) {
        return 'mojito-mixes';
    }
    
    // Energy Drinks
    if (name.includes('ريدبول') || name.includes('مياه') || name.includes('موسي') || 
        name.includes('مونستر') || name.includes('سن توب')) {
        return 'energy-drinks';
    }
    
    // Winter Drinks
    if (name.includes('هوت شوكليت') || name.includes('هوت سيدر')) {
        return 'winter-drinks';
    }
    
    // Tea & Herbs
    if (name.includes('شاي') || name.includes('اعشاب')) {
        return 'tea-herbs';
    }
    
    // Milk Coffee
    if (name.includes('لاتيه') || name.includes('كابتشينو') || name.includes('فلات وايت') || 
        name.includes('كورتادو') || name.includes('موكا') || name.includes('بون بون') || 
        name.includes('ميكاتو') || name.includes('اسبانش') || name.includes('نسكافيه')) {
        return 'milk-coffee';
    }
    
    // Classic Coffee
    if (name.includes('تركي') || name.includes('سنجل') || name.includes('دبل') || 
        name.includes('اميركان') || name.includes('امريكانو') || name.includes('فرنساوي') || 
        name.includes('نكهات')) {
        return 'classic-coffee';
    }
    
    return ''; // unknown
}

async function run() {
    console.log("Creating new categories...");
    for (const cat of categoriesToCreate) {
        const { error } = await supabase.from('categories').upsert(cat, { onConflict: 'id' });
        if (error) console.error("Error creating category", cat.id, error.message);
    }
    
    console.log("Fetching all products...");
    const { data: products, error } = await supabase.from('products').select('*');
    if (error) throw error;
    
    console.log(`Found ${products.length} products. Categorizing...`);
    let updatedCount = 0;
    
    for (const p of products) {
        const newCatId = determineCategoryId(p.name);
        if (newCatId) {
            const { error: updErr } = await supabase.from('products').update({ category_id: newCatId }).eq('id', p.id);
            if (updErr) {
                console.error(`Failed to update ${p.name}: ${updErr.message}`);
            } else {
                updatedCount++;
                console.log(`Moved: ${p.name} -> ${newCatId}`);
            }
        } else {
            console.log(`SKIP/UNKNOWN: ${p.name}`);
        }
    }
    
    console.log(`Done! Updated ${updatedCount} products.`);
}

run().catch(console.error);
