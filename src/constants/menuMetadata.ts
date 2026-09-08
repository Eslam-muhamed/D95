import type { MenuCategory } from '@/types/menu';

export const categories: MenuCategory[] = [
    { id: 'hot-drinks', name: 'مشروبات ساخنة', icon: '☕', description: 'قهوة وشاي ومشروبات ساخنة' },
    { id: 'cold-drinks', name: 'مشروبات باردة', icon: '🧊', description: 'مشروبات باردة منعشة' },
    { id: 'fresh-juice', name: 'عصائر طازجة', icon: '🍊', description: 'عصائر طبيعية 100%' },
    { id: 'smoothies', name: 'سموذي', icon: '🥤', description: 'سموذي صحي ولذيذ' },
    { id: 'mocktails', name: 'موكتيل', icon: '🍹', description: 'موكتيل بنكهات مميزة' },
    { id: 'milkshakes', name: 'ميلك شيك', icon: '🥛', description: 'ميلك شيك كريمي' },
    { id: 'desserts', name: 'حلويات', icon: '🍰', description: 'حلويات وكيك' },
    { id: 'waffles', name: 'وافل', icon: '🧇', description: 'وافل ساخن بتوبينجز متنوعة' },
    { id: 'crepes', name: 'كريب', icon: '🫔', description: 'كريب حلو ومالح' },
    { id: 'sandwiches', name: 'سندوتشات', icon: '🥪', description: 'سندوتشات شهية' },
    { id: 'pasta', name: 'باستا', icon: '🍝', description: 'باستا إيطالية أصيلة' },
    { id: 'breakfast', name: 'فطار', icon: '🍳', description: 'وجبات الفطار' },
    { id: 'shisha', name: 'شيشة', icon: '💨', description: 'شيشة بأجود الأنواع' },
    { id: 'extras', name: 'إضافات', icon: '✨', description: 'إضافات ومقبلات' },
];
