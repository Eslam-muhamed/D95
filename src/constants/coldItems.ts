import type { MenuItem } from '@/types/menu';
import { getItemImage } from './imagePool';

export const coldItems: MenuItem[] = [
    // COLD DRINKS (15)
    { id: 'cld-001', name: 'أيس لاتيه', description: 'لاتيه بارد كريمي مع ثلج كثير', price: 60, currency: 'EGP', category: 'cold-drinks', image: getItemImage('cold-drinks', 0), badge: 'Popular', isCold: true },
    { id: 'cld-002', name: 'أيس أمريكانو', description: 'أمريكانو بارد منعش مع قطع الثلج', price: 50, currency: 'EGP', category: 'cold-drinks', image: getItemImage('cold-drinks', 1), isCold: true },
    { id: 'cld-003', name: 'أيس موكا', description: 'موكا بارد بالشوكولاتة والكريمة', price: 65, currency: 'EGP', category: 'cold-drinks', image: getItemImage('cold-drinks', 2), badge: 'Popular', isCold: true },
    { id: 'cld-004', name: 'فرابيه', description: 'قهوة مثلجة مخفوقة بالكريمة والسكر', price: 65, currency: 'EGP', category: 'cold-drinks', image: getItemImage('cold-drinks', 3), badge: "Chef's Choice", isCold: true },
    { id: 'cld-005', name: 'كولد برو', description: 'قهوة مخمّرة على البارد 24 ساعة', price: 70, currency: 'EGP', category: 'cold-drinks', image: getItemImage('cold-drinks', 4), badge: 'New', isCold: true },
    { id: 'cld-006', name: 'أيس ماتشا لاتيه', description: 'ماتشا بارد مع حليب اللوز الكريمي', price: 70, currency: 'EGP', category: 'cold-drinks', image: getItemImage('cold-drinks', 0), isCold: true },
    { id: 'cld-007', name: 'كاراميل ماكياتو بارد', description: 'حليب فانيليا مع إسبريسو وصوص كراميل', price: 68, currency: 'EGP', category: 'cold-drinks', image: getItemImage('cold-drinks', 1), badge: 'Popular', isCold: true },
    { id: 'cld-008', name: 'أيس شوكولاتة', description: 'شوكولاتة بلجيكية باردة مع الكريمة', price: 65, currency: 'EGP', category: 'cold-drinks', image: getItemImage('cold-drinks', 2), isCold: true },
    { id: 'cld-009', name: 'أيس شاي خوخ', description: 'شاي بارد بنكهة الخوخ الحلوة', price: 55, currency: 'EGP', category: 'cold-drinks', image: getItemImage('cold-drinks', 3), isCold: true },
    { id: 'cld-010', name: 'ليمونادة', description: 'ليمونادة طازجة بالليمون الطبيعي والنعناع', price: 45, currency: 'EGP', category: 'cold-drinks', image: getItemImage('cold-drinks', 4), badge: 'Popular', isCold: true },
    { id: 'cld-011', name: 'ليمونادة فراولة', description: 'ليمونادة مع الفراولة الطازجة المهروسة', price: 55, currency: 'EGP', category: 'cold-drinks', image: getItemImage('cold-drinks', 0), isCold: true },
    { id: 'cld-012', name: 'ليمونادة مانجو', description: 'ليمونادة بعصير المانجو الاستوائي', price: 55, currency: 'EGP', category: 'cold-drinks', image: getItemImage('cold-drinks', 1), isCold: true },
    { id: 'cld-013', name: 'أيس تشاي', description: 'شاي هندي بارد مع الحليب والبهارات', price: 55, currency: 'EGP', category: 'cold-drinks', image: getItemImage('cold-drinks', 2), badge: 'New', isCold: true },
    { id: 'cld-014', name: 'ريد بُل مزيج', description: 'ريد بول مع عصير الفاكهة الطازج', price: 75, currency: 'EGP', category: 'cold-drinks', image: getItemImage('cold-drinks', 3), isCold: true },
    { id: 'cld-015', name: 'كوكتيل كولا', description: 'كولا مع النعناع والليمون والثلج', price: 45, currency: 'EGP', category: 'cold-drinks', image: getItemImage('cold-drinks', 4), isCold: true },

    // FRESH JUICE (12) - Categorized as Cold Drinks
    { id: 'jui-001', name: 'عصير برتقال', description: 'عصير برتقال طازج 100% طبيعي', price: 45, currency: 'EGP', category: 'cold-drinks', image: getItemImage('fresh-juice', 0), badge: 'Popular', isCold: true },
    { id: 'jui-002', name: 'عصير مانجو', description: 'مانجو طازج مخلوط بدون ماء', price: 55, currency: 'EGP', category: 'cold-drinks', image: getItemImage('fresh-juice', 1), badge: 'Popular', isCold: true },
    { id: 'jui-003', name: 'عصير جوافة', description: 'جوافة طازجة كريمية ناعمة', price: 50, currency: 'EGP', category: 'cold-drinks', image: getItemImage('fresh-juice', 2), isCold: true },
    { id: 'jui-004', name: 'عصير فراولة', description: 'فراولة طازجة مع الحليب والعسل', price: 55, currency: 'EGP', category: 'cold-drinks', image: getItemImage('fresh-juice', 3), isCold: true },
    { id: 'jui-005', name: 'عصير رمان', description: 'رمان طازج بدون إضافات', price: 65, currency: 'EGP', category: 'cold-drinks', image: getItemImage('fresh-juice', 0), badge: "Chef's Choice", isCold: true },
    { id: 'jui-006', name: 'عصير جزر وبرتقال', description: 'مزيج الجزر والبرتقال الطازج الغني بالفيتامينات', price: 55, currency: 'EGP', category: 'cold-drinks', image: getItemImage('fresh-juice', 1), isCold: true },
    { id: 'jui-007', name: 'عصير تفاح', description: 'تفاح طازج مع الليمون والزنجبيل', price: 50, currency: 'EGP', category: 'cold-drinks', image: getItemImage('fresh-juice', 2), isCold: true },
    { id: 'jui-008', name: 'عصير ليمون بالنعناع', description: 'ليمون طازج مع النعناع والثلج والسكر', price: 40, currency: 'EGP', category: 'cold-drinks', image: getItemImage('fresh-juice', 3), badge: 'Popular', isCold: true },
    { id: 'jui-009', name: 'عصير أناناس', description: 'أناناس طازج حلو ومنعش', price: 60, currency: 'EGP', category: 'cold-drinks', image: getItemImage('fresh-juice', 0), isCold: true },
    { id: 'jui-010', name: 'عصير قصب', description: 'قصب سكر طازج معصور لحظياً', price: 35, currency: 'EGP', category: 'cold-drinks', image: getItemImage('fresh-juice', 1), isCold: true },
    { id: 'jui-011', name: 'مزيج الطاقة', description: 'جزر + برتقال + زنجبيل + كركم', price: 65, currency: 'EGP', category: 'cold-drinks', image: getItemImage('fresh-juice', 2), badge: 'New', isCold: true },
    { id: 'jui-012', name: 'عصير خوخ', description: 'خوخ طازج مع قشطة خفيفة', price: 55, currency: 'EGP', category: 'cold-drinks', image: getItemImage('fresh-juice', 3), isCold: true },

    // SMOOTHIES (10) - Categorized as Cold Drinks
    { id: 'smo-001', name: 'سموذي توت مشكل', description: 'توت أزرق وفراولة وتوت بري مع الموز', price: 70, currency: 'EGP', category: 'cold-drinks', image: getItemImage('smoothies', 0), badge: 'Popular', isCold: true },
    { id: 'smo-002', name: 'سموذي مانجو جوز الهند', description: 'مانجو طازج مع حليب جوز الهند', price: 72, currency: 'EGP', category: 'cold-drinks', image: getItemImage('smoothies', 1), isCold: true },
    { id: 'smo-003', name: 'سموذي الطاقة الخضراء', description: 'سبانخ + موز + تفاح + زنجبيل', price: 75, currency: 'EGP', category: 'cold-drinks', image: getItemImage('smoothies', 2), badge: 'New', isCold: true },
    { id: 'smo-004', name: 'سموذي فراولة وموز', description: 'فراولة طازجة مع الموز والحليب', price: 65, currency: 'EGP', category: 'cold-drinks', image: getItemImage('smoothies', 3), badge: 'Popular', isCold: true },
    { id: 'smo-005', name: 'سموذي أفوكادو', description: 'أفوكادو ناضج مع الحليب والعسل', price: 78, currency: 'EGP', category: 'cold-drinks', image: getItemImage('smoothies', 0), badge: "Chef's Choice", isCold: true },
    { id: 'smo-006', name: 'سموذي بروتين', description: 'موز + حليب لوز + زبدة الفول السوداني + بروتين', price: 85, currency: 'EGP', category: 'cold-drinks', image: getItemImage('smoothies', 1), isCold: true },
    { id: 'smo-007', name: 'سموذي بيتش', description: 'خوخ + مانجو + برتقال + حليب', price: 70, currency: 'EGP', category: 'cold-drinks', image: getItemImage('smoothies', 2), isCold: true },
    { id: 'smo-008', name: 'سموذي الأناناس والجوجوبا', description: 'أناناس + جوجوبا + ليمون + نعناع', price: 72, currency: 'EGP', category: 'cold-drinks', image: getItemImage('smoothies', 3), isCold: true },
    { id: 'smo-009', name: 'سموذي التوت الأزرق', description: 'توت أزرق + يوغرت + عسل + فانيليا', price: 75, currency: 'EGP', category: 'cold-drinks', image: getItemImage('smoothies', 0), isCold: true },
    { id: 'smo-010', name: 'سموذي الشوكولاتة', description: 'موز + كاكاو + حليب لوز + تمر', price: 70, currency: 'EGP', category: 'cold-drinks', image: getItemImage('smoothies', 1), isCold: true },

    // MOCKTAILS (10) - Categorized as Cold Drinks
    { id: 'moc-001', name: 'موهيتو كلاسيك', description: 'نعناع طازج + ليمون + سودا + سكر', price: 60, currency: 'EGP', category: 'cold-drinks', image: getItemImage('mocktails', 0), badge: 'Popular', isCold: true },
    { id: 'moc-002', name: 'موهيتو فراولة', description: 'موهيتو بالفراولة الطازجة المهروسة', price: 68, currency: 'EGP', category: 'cold-drinks', image: getItemImage('mocktails', 1), badge: 'Popular', isCold: true },
    { id: 'moc-003', name: 'بلو لاغون', description: 'ليمونادة زرقاء بنكهة التوت والليمون', price: 65, currency: 'EGP', category: 'cold-drinks', image: getItemImage('mocktails', 2), badge: "Chef's Choice", isCold: true },
    { id: 'moc-004', name: 'سانرايز', description: 'عصير برتقال + رمان + سودا + ثلج', price: 65, currency: 'EGP', category: 'mocktails', image: getItemImage('mocktails', 3), isCold: true },
    { id: 'moc-005', name: 'تروبيكال فيوجن', description: 'مانجو + أناناس + جوز الهند + ليمون', price: 70, currency: 'EGP', category: 'cold-drinks', image: getItemImage('mocktails', 0), isCold: true },
    { id: 'moc-006', name: 'وترميلون ميست', description: 'بطيخ طازج + نعناع + ليمون + سودا', price: 65, currency: 'EGP', category: 'cold-drinks', image: getItemImage('mocktails', 1), badge: 'New', isCold: true },
    { id: 'moc-007', name: 'بيري بيري', description: 'توت مشكل + زنجبيل + ليمون + سودا', price: 68, currency: 'EGP', category: 'cold-drinks', image: getItemImage('mocktails', 2), isCold: true },
    { id: 'moc-008', name: 'موهيتو مانجو', description: 'موهيتو بالمانجو الطازج والنعناع', price: 68, currency: 'EGP', category: 'cold-drinks', image: getItemImage('mocktails', 3), isCold: true },
    { id: 'moc-009', name: 'لافيندر ليموناد', description: 'ليمونادة بنكهة اللافندر والزهور', price: 70, currency: 'EGP', category: 'cold-drinks', image: getItemImage('mocktails', 0) },
    { id: 'moc-010', name: 'ديب بيرل', description: 'بوبا ميلك تي بحبات التابيوكا', price: 75, currency: 'EGP', category: 'cold-drinks', image: getItemImage('mocktails', 1), badge: 'New', isCold: true },

    // MILKSHAKES (12) - Categorized as Cold Drinks
    { id: 'mil-001', name: 'ميلك شيك شوكولاتة', description: 'أيس كريم شوكولاتة مع حليب وصوص شوكولاتة', price: 75, currency: 'EGP', category: 'cold-drinks', image: getItemImage('milkshakes', 0), badge: 'Popular', isCold: true },
    { id: 'mil-002', name: 'ميلك شيك فانيليا', description: 'أيس كريم فانيليا ناعم مع الحليب', price: 70, currency: 'EGP', category: 'cold-drinks', image: getItemImage('milkshakes', 1), isCold: true },
    { id: 'mil-003', name: 'ميلك شيك فراولة', description: 'فراولة طازجة مع أيس كريم وحليب', price: 75, currency: 'EGP', category: 'cold-drinks', image: getItemImage('milkshakes', 2), badge: 'Popular', isCold: true },
    { id: 'mil-004', name: 'ميلك شيك أوريو', description: 'بسكويت أوريو مطحون مع أيس كريم وحليب', price: 80, currency: 'EGP', category: 'cold-drinks', image: getItemImage('milkshakes', 3), badge: "Chef's Choice", isCold: true },
    { id: 'mil-005', name: 'ميلك شيك لوتس', description: 'كريمة لوتس مع أيس كريم وبسكويت لوتس', price: 85, currency: 'EGP', category: 'cold-drinks', image: getItemImage('milkshakes', 0), badge: 'Popular', isCold: true },
    { id: 'mil-006', name: 'ميلك شيك مانجو', description: 'مانجو طازج مع أيس كريم وحليب', price: 78, currency: 'EGP', category: 'cold-drinks', image: getItemImage('milkshakes', 1), isCold: true },
    { id: 'mil-007', name: 'ميلك شيك كاراميل', description: 'أيس كريم مع صوص كراميل مالح', price: 80, currency: 'EGP', category: 'cold-drinks', image: getItemImage('milkshakes', 2), isCold: true },
    { id: 'mil-008', name: 'ميلك شيك نوتيلا', description: 'نوتيلا غنية مع أيس كريم فانيليا', price: 82, currency: 'EGP', category: 'cold-drinks', image: getItemImage('milkshakes', 3), isCold: true },
    { id: 'mil-009', name: 'ميلك شيك كيندر بويينو', description: 'كيندر بويينو مع أيس كريم والحليب', price: 88, currency: 'EGP', category: 'cold-drinks', image: getItemImage('milkshakes', 0), badge: 'New', isCold: true },
    { id: 'mil-010', name: 'ميلك شيك بنات', description: 'أيس كريم توت + فانيليا + فراولة بألوان زاهية', price: 85, currency: 'EGP', category: 'cold-drinks', image: getItemImage('milkshakes', 1), isCold: true },
    { id: 'mil-011', name: 'ميلك شيك بيناتس', description: 'زبدة الفول السوداني مع أيس كريم وحليب', price: 80, currency: 'EGP', category: 'cold-drinks', image: getItemImage('milkshakes', 2), isCold: true },
    { id: 'mil-012', name: 'ميلك شيك ريد فيلفيت', description: 'كيك ريد فيلفيت مع أيس كريم والحليب', price: 88, currency: 'EGP', category: 'cold-drinks', image: getItemImage('milkshakes', 3), badge: 'New', isCold: true },
];
