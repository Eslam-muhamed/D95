import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

const products = JSON.parse(fs.readFileSync('products_list.json', 'utf8'));

const getProductDetails = (name, category_id) => {
    let description = '';
    let image_url = 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800'; // Default coffee/burgundy

    if (name.includes('شاي') || name.includes('اعشاب')) {
        description = `مشروب ${name} الساخن الفاخر، يُحضر بعناية ليمنحك لحظات من الهدوء والاسترخاء بطعمه الأصيل والمنعش.`;
        image_url = 'https://images.unsplash.com/photo-1576092762791-dd9e2220abd4?auto=format&fit=crop&q=80&w=800'; // Tea
    } else if (name.includes('هوت شوكليت')) {
        description = `مشروب الهوت شوكليت الغني، مزيج رائع من الشوكولاتة الداكنة والحليب الساخن لتجربة دافئة ومليئة بالسعادة.`;
        image_url = 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&q=80&w=800'; // Hot chocolate
    } else if (name.includes('تركي') || name.includes('فرنساوي')) {
        description = `فنجان قهوة ${name} أصيلة، محضرة من أجود أنواع البن المحمص لتعطيك المذاق الكلاسيكي الغني في كل رشفة.`;
        image_url = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800'; // Turkish/French coffee
    } else if (name.includes('اسبريسو') || name.includes('ميكاتو') || name.includes('كورتادو') || name.includes('فلات وايت')) {
        description = `جرعة مكثفة من ال${name} الفاخر، مستخلصة باحترافية لتمنحك الطاقة والتركيز مع طعم البن الغني.`;
        image_url = 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0fd24?auto=format&fit=crop&q=80&w=800'; // Espresso
    } else if (name.includes('لاتيه') || name.includes('كابتشينو') || name.includes('موكا') || name.includes('اميركان')) {
        description = `كوب ${name} مثالي، يجمع بين نعومة الحليب وقوة الإسبريسو ليمنحك توازناً رائعاً في المذاق.`;
        image_url = 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800'; // Latte with burgundy tone
    } else if (name.includes('مياه') || name.includes('ريدبول') || name.includes('مونستر') || name.includes('كولا') || name.includes('صن توب') || name.includes('موسي')) {
        description = `مشروب ${name} منعش وبارد، الخيار الأمثل لتجديد طاقتك في أي وقت من اليوم.`;
        image_url = 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800'; // Cold can/water
    } else if (name.includes('عصير')) {
        description = `${name} طبيعي وطازج ١٠٠٪، محضر من أفضل الفواكه المختارة بعناية ليروي عطشك بمذاق لا يُقاوم.`;
        image_url = 'https://images.unsplash.com/photo-1622597467836-f38240662f97?auto=format&fit=crop&q=80&w=800'; // Juice
    } else if (name.includes('سموزي')) {
        description = `مشروب ${name} البارد والمنعش، مزيج غني ومثلج يأخذك في رحلة من النكهات الاستوائية الرائعة.`;
        image_url = 'https://images.unsplash.com/photo-1502741224143-9038bc602d33?auto=format&fit=crop&q=80&w=800'; // Smoothie (burgundyish)
    } else if (name.includes('ايس')) {
        description = `مشروب ${name} مثلج ومنعش، يقدم لك توازناً مثالياً بين القهوة الغنية وبرودة الثلج المنعشة.`;
        image_url = 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=800'; // Iced coffee
    } else if (name.includes('موهيتو')) {
        description = `مشروب ${name} الرائع، غني بنكهات النعناع والليمون مع لمسة الصودا المنعشة لتجربة صيفية لا تُنسى.`;
        image_url = 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&q=80&w=800'; // Mojito
    } else if (name.includes('ميلك تشيك') || name.includes('فرابيه')) {
        description = `مشروب ${name} اللذيذ والغني، قوام كريمي مثلج مع نكهاتك المفضلة لتجربة تحلية لا مثيل لها.`;
        image_url = 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=800'; // Milkshake
    } else {
        description = `مشروب ${name} مميز وذو طعم فريد، محضر بحرفية عالية ليناسب ذوقك الراقي.`;
        image_url = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800'; // Generic drink
    }

    return { description, image_url };
};

async function updateProducts() {
    let successCount = 0;
    for (const product of products) {
        const { description, image_url } = getProductDetails(product.name, product.category_id);
        
        const { error } = await supabase
            .from('products')
            .update({ description, image_url })
            .eq('id', product.id);
            
        if (error) {
            console.error(`Error updating ${product.name}:`, error.message);
        } else {
            successCount++;
            process.stdout.write('.');
        }
    }
    console.log(`\nSuccessfully updated ${successCount}/${products.length} products!`);
}

updateProducts();
