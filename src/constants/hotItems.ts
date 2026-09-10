import type { MenuItem } from '@/types/menu';
import { getItemImage } from './imagePool';

export const hotItems: MenuItem[] = [
    // HOT DRINKS (15)
    { id: 'hot-001', name: 'قهوة تركية', description: 'قهوة تركية أصيلة محضّرة بطريقة الجزوة التقليدية', price: 35, currency: 'EGP', category: 'hot-drinks', image: getItemImage('hot-drinks', 0), badge: 'Popular', isHot: true },
    { id: 'hot-002', name: 'إسبريسو', description: 'شوت إسبريسو مركّز من أجود حبوب الأرابيكا', price: 30, currency: 'EGP', category: 'hot-drinks', image: getItemImage('hot-drinks', 1), isHot: true },
    { id: 'hot-003', name: 'دبل إسبريسو', description: 'شوتين إسبريسو لمن يحتاج طاقة مضاعفة', price: 45, currency: 'EGP', category: 'hot-drinks', image: getItemImage('hot-drinks', 2), isHot: true },
    { id: 'hot-004', name: 'أمريكانو', description: 'إسبريسو ممزوج بالماء الساخن بنسبة مثالية', price: 40, currency: 'EGP', category: 'hot-drinks', image: getItemImage('hot-drinks', 3), badge: 'Popular', isHot: true },
    { id: 'hot-005', name: 'كابتشينو', description: 'إسبريسو مع الحليب المبخّر ورغوة ناعمة', price: 50, currency: 'EGP', category: 'hot-drinks', image: getItemImage('hot-drinks', 4), isHot: true },
    { id: 'hot-006', name: 'لاتيه', description: 'إسبريسو مع الحليب الكريمي الساخن', price: 55, currency: 'EGP', category: 'hot-drinks', image: getItemImage('hot-drinks', 0), badge: 'Popular', isHot: true },
    { id: 'hot-007', name: 'ماكياتو', description: 'إسبريسو مع طبقة رغوة الحليب الخفيفة', price: 48, currency: 'EGP', category: 'hot-drinks', image: getItemImage('hot-drinks', 1), isHot: true },
    { id: 'hot-008', name: 'موكا', description: 'إسبريسو مع شوكولاتة وحليب مبخّر', price: 58, currency: 'EGP', category: 'hot-drinks', image: getItemImage('hot-drinks', 2), badge: "Chef's Choice", isHot: true },
    { id: 'hot-009', name: 'فلات وايت', description: 'إسبريسو مزدوج مع حليب مبخّر ناعم', price: 55, currency: 'EGP', category: 'hot-drinks', image: getItemImage('hot-drinks', 3), isHot: true },
    { id: 'hot-010', name: 'كورتادو', description: 'إسبريسو مع حليب دافئ بنسبة متساوية', price: 50, currency: 'EGP', category: 'hot-drinks', image: getItemImage('hot-drinks', 4), badge: 'New', isHot: true },
    { id: 'hot-011', name: 'شاي كرك', description: 'شاي هندي مع الحليب والبهارات', price: 40, currency: 'EGP', category: 'hot-drinks', image: getItemImage('hot-drinks', 0), badge: 'Popular', isHot: true },
    { id: 'hot-012', name: 'شاي أخضر', description: 'شاي أخضر ياباني أصيل غني بالمضادات', price: 35, currency: 'EGP', category: 'hot-drinks', image: getItemImage('hot-drinks', 1), isHot: true },
    { id: 'hot-013', name: 'شاي أحمر', description: 'شاي أسود فاخر من أجود المزارع', price: 30, currency: 'EGP', category: 'hot-drinks', image: getItemImage('hot-drinks', 2), isHot: true },
    { id: 'hot-014', name: 'هوت شوكولاتة', description: 'شوكولاتة ساخنة كريمية بالمارشميلو', price: 60, currency: 'EGP', category: 'hot-drinks', image: getItemImage('hot-drinks', 3), badge: 'Popular', isHot: true },
    { id: 'hot-015', name: 'ماتشا لاتيه', description: 'مسحوق ماتشا مع الحليب الكريمي الساخن', price: 65, currency: 'EGP', category: 'hot-drinks', image: getItemImage('hot-drinks', 4), badge: 'New', isHot: true },

    // DESSERTS (15)
    { id: 'des-001', name: 'تشيز كيك كلاسيك', description: 'تشيز كيك نيويورك أصيل بقاعدة البسكويت', price: 75, currency: 'EGP', category: 'desserts', image: getItemImage('desserts', 0), badge: 'Popular' },
    { id: 'des-002', name: 'براونيز بالشوكولاتة', description: 'براونيز طرية بالشوكولاتة الداكنة والجوز', price: 60, currency: 'EGP', category: 'desserts', image: getItemImage('desserts', 1), badge: "Chef's Choice" },
    { id: 'des-003', name: 'تيراميسو', description: 'تيراميسو إيطالي أصيل بالمسكربوني والقهوة', price: 80, currency: 'EGP', category: 'desserts', image: getItemImage('desserts', 2), badge: 'Popular' },
    { id: 'des-004', name: 'كيك الريد فيلفيت', description: 'كيك أحمر ناعم بكريمة الجبن', price: 70, currency: 'EGP', category: 'desserts', image: getItemImage('desserts', 3) },
    { id: 'des-005', name: 'بانكيك', description: 'بانكيك أمريكي طري مع شراب القيقب والزبدة', price: 65, currency: 'EGP', category: 'desserts', image: getItemImage('desserts', 4), badge: 'Popular' },
    { id: 'des-006', name: 'لوتس كيك', description: 'كيك بكريمة لوتس وقطع البسكويت الكراميل', price: 85, currency: 'EGP', category: 'desserts', image: getItemImage('desserts', 0), badge: 'New' },
    { id: 'des-007', name: 'كريم برولييه', description: 'حلوى فرنسية كلاسيكية بقشرة السكر المكرمل', price: 75, currency: 'EGP', category: 'desserts', image: getItemImage('desserts', 1) },
    { id: 'des-008', name: 'موس الشوكولاتة', description: 'موس شوكولاتة بلجيكية خفيفة وكريمية', price: 65, currency: 'EGP', category: 'desserts', image: getItemImage('desserts', 2) },
    { id: 'des-009', name: 'كيك الكيندر', description: 'كيك بحشوة الكيندر البويينو والنوتيلا', price: 85, currency: 'EGP', category: 'desserts', image: getItemImage('desserts', 3), badge: 'Popular' },
    { id: 'des-010', name: 'مافن شوكولاتة', description: 'مافن طري بقلب شوكولاتة ذائبة', price: 45, currency: 'EGP', category: 'desserts', image: getItemImage('desserts', 4) },
    { id: 'des-011', name: 'كيك التوت', description: 'كيك بكريمة الفانيليا والتوت الطازج', price: 75, currency: 'EGP', category: 'desserts', image: getItemImage('desserts', 0) },
    { id: 'des-012', name: 'إيكلير', description: 'إيكلير فرنسي بالكريمة والشوكولاتة', price: 55, currency: 'EGP', category: 'desserts', image: getItemImage('desserts', 1) },
    { id: 'des-013', name: 'بروفيتيرول', description: 'كرات البروفيتيرول بالكريمة والشوكولاتة الساخنة', price: 70, currency: 'EGP', category: 'desserts', image: getItemImage('desserts', 2) },
    { id: 'des-014', name: 'تارت الفراولة', description: 'تارت فرنسي بكريمة الباتيسيير والفراولة الطازجة', price: 70, currency: 'EGP', category: 'desserts', image: getItemImage('desserts', 3) },
    { id: 'des-015', name: 'كنافة بالنوتيلا', description: 'كنافة شرقية تقليدية بحشوة النوتيلا والقشطة', price: 65, currency: 'EGP', category: 'desserts', image: getItemImage('desserts', 4), badge: "Chef's Choice" },

    // WAFFLES (8) - Categorized as Desserts
    { id: 'waf-001', name: 'وافل بلجيكي كلاسيك', description: 'وافل ذهبي بالعسل والزبدة والمارشميلو', price: 65, currency: 'EGP', category: 'desserts', image: getItemImage('waffles', 0), badge: 'Popular' },
    { id: 'waf-002', name: 'وافل شوكولاتة', description: 'وافل مع صوص الشوكولاتة والبندق', price: 75, currency: 'EGP', category: 'desserts', image: getItemImage('waffles', 1) },
    { id: 'waf-003', name: 'وافل لوتس', description: 'وافل بكريمة لوتس وقطع البسكويت', price: 80, currency: 'EGP', category: 'desserts', image: getItemImage('waffles', 2), badge: 'Popular' },
    { id: 'waf-004', name: 'وافل فراولة', description: 'وافل مع الفراولة الطازجة والكريمة', price: 70, currency: 'EGP', category: 'desserts', image: getItemImage('waffles', 0) },
    { id: 'waf-005', name: 'وافل نوتيلا', description: 'وافل بحشوة النوتيلا والبندق المكرمل', price: 78, currency: 'EGP', category: 'desserts', image: getItemImage('waffles', 1), badge: "Chef's Choice" },
    { id: 'waf-006', name: 'وافل كراميل', description: 'وافل بصوص الكراميل المالح والأيس كريم', price: 82, currency: 'EGP', category: 'desserts', image: getItemImage('waffles', 2) },
    { id: 'waf-007', name: 'وافل مانجو', description: 'وافل مع كريمة المانجو الطازجة', price: 75, currency: 'EGP', category: 'desserts', image: getItemImage('waffles', 0), badge: 'New' },
    { id: 'waf-008', name: 'وافل أوريو', description: 'وافل مع كريمة الأوريو وقطع البسكويت', price: 80, currency: 'EGP', category: 'desserts', image: getItemImage('waffles', 1) },

    // SWEET CREPES (6) - Categorized as Desserts
    { id: 'crp-001', name: 'كريب نوتيلا', description: 'كريب رقيق بحشوة النوتيلا والموز', price: 60, currency: 'EGP', category: 'desserts', image: getItemImage('crepes', 0), badge: 'Popular' },
    { id: 'crp-002', name: 'كريب لوتس', description: 'كريب بكريمة اللوتس والمارشميلو', price: 70, currency: 'EGP', category: 'desserts', image: getItemImage('crepes', 1) },
    { id: 'crp-003', name: 'كريب فراولة', description: 'كريب بالفراولة الطازجة والكريمة والعسل', price: 65, currency: 'EGP', category: 'desserts', image: getItemImage('crepes', 2) },
    { id: 'crp-004', name: 'كريب شوكولاتة', description: 'كريب بصوص الشوكولاتة الداكنة', price: 60, currency: 'EGP', category: 'desserts', image: getItemImage('crepes', 0) },
    { id: 'crp-007', name: 'كريب مانجو', description: 'كريب بكريمة المانجو الطازجة والأيس كريم', price: 68, currency: 'EGP', category: 'desserts', image: getItemImage('crepes', 0), badge: 'New' },
    { id: 'crp-008', name: 'كريب كراميل', description: 'كريب بصوص الكراميل والمكسرات', price: 62, currency: 'EGP', category: 'desserts', image: getItemImage('crepes', 1) },
];
