import type { MenuCategory } from '@/types/menu';

export const categories: MenuCategory[] = [
    { id: 'hot-drinks', name: 'مشروبات ساخنة', icon: '☕', description: 'قهوة وشاي ومشروبات ساخنة' },
    { id: 'cold-drinks', name: 'مشروبات ساقعة', icon: '🧊', description: 'مشروبات باردة منعشة وعصائر وسموذي' },
    { id: 'desserts', name: 'حلويات', icon: '🍰', description: 'حلويات وكيك ووافل وكريب فاخر' },
];
