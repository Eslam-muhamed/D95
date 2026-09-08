import { motion } from 'framer-motion';
import type { MenuCategory, MenuItem } from '@/types/menu';
import MenuCard from './MenuCard';
import { useInView } from '@/hooks/useInView';

interface Props {
  category: MenuCategory;
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
}

export default function MenuSection({ category, items, onAdd }: Props) {
  const [ref, inView] = useInView<HTMLElement>(0.1);

  if (!items.length) return null;

  return (
    <section id={`section-${category.id}`} className="px-4 py-6 max-w-4xl mx-auto scroll-mt-24" ref={ref} dir="rtl">
      {/* Section heading */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(139,26,42,0.4))' }} />
        <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(139,26,42,0.12)', border: '1px solid rgba(139,26,42,0.25)' }}>
          <span className="text-xl leading-none">{category.icon}</span>
          <h2 className="font-bold text-base" style={{ color: 'var(--c-on-card, #F4C2C8)', fontFamily: 'Cairo, sans-serif' }}>
            {category.name}
          </h2>
        </div>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(139,26,42,0.4))' }} />
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.06, duration: 0.45 }}
          >
            <MenuCard item={item} onAdd={onAdd} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
