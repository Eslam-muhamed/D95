import type { MenuCategory, MenuItem } from '@/types/menu';
import MenuCard from './MenuCard';
import CategoryIcon from './CategoryIcon';

interface Props {
  category: MenuCategory;
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
}

export default function MenuSection({ category, items, onAdd }: Props) {
  if (!items.length) return null;

  return (
    <section
      id={`section-${category.id}`}
      className="px-4 py-5 max-w-4xl mx-auto scroll-mt-28"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 320px' }}
      dir="rtl"
    >
      {/* Section heading */}
      <div className="flex items-center gap-3 mb-3.5">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-white/10 to-red-600/30" />
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-[#140e10] border border-neutral-200 dark:border-white/10 shadow-sm transition-colors">
          <CategoryIcon categoryId={category.id} icon={category.icon} size={18} className="text-red-600 dark:text-red-400 shrink-0" />
          <h2 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white font-body">
            {category.name}
          </h2>
          <span className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 font-bold bg-neutral-200/80 dark:bg-white/[0.05] px-1.5 py-0.5 rounded">
            {items.length}
          </span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-neutral-300 dark:via-white/10 to-red-600/30" />
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <MenuCard key={item.id} item={item} onAdd={onAdd} />
        ))}
      </div>
    </section>
  );
}
