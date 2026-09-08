import { motion } from 'framer-motion';
import type { MenuItem } from '@/types/menu';

interface Props {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  'Popular':        { bg: 'rgba(139,26,42,0.85)',  color: '#F4C2C8' },
  'New':            { bg: 'rgba(196,92,106,0.85)',  color: '#fff' },
  "Chef's Choice":  { bg: 'rgba(94,204,122,0.85)',  color: '#fff' },
};

export default function MenuCard({ item, onAdd }: Props) {
  const badge = item.badge ? BADGE_STYLES[item.badge] : null;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-3 rounded-xl p-3 card-glow-hover transition-shadow cursor-pointer"
      style={{
        background: 'var(--c-card, #1a080c)',
        border: '1px solid var(--c-border, rgba(139, 26, 42, 0.18))',
        direction: 'rtl',
      }}
      onClick={() => onAdd(item)}
    >
      {/* Image */}
      <div className="relative flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 82, height: 82 }}>
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.12)' }} />
        {badge && (
          <span
            className="absolute bottom-1 right-1 text-xs font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: badge.bg, color: badge.color, fontFamily: 'Cairo, sans-serif', fontSize: 9, backdropFilter: 'blur(4px)' }}
          >
            {item.badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm mb-0.5 truncate" style={{ color: 'var(--c-text-1, #f5ece8)', fontFamily: 'Cairo, sans-serif' }}>
          {item.name}
        </h3>
        <p className="text-xs leading-relaxed line-clamp-2 mb-2" style={{ color: 'var(--c-text-3, #a88890)', fontFamily: 'Cairo, sans-serif' }}>
          {item.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-bold" style={{ color: '#C45C6A', fontFamily: '"Playfair Display", Georgia, serif', fontSize: 15 }}>
            {item.price} <span style={{ fontSize: 11, fontFamily: 'Cairo, sans-serif', color: 'var(--c-text-4, #7a5a60)' }}>ج.م</span>
          </span>
          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(item);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-xs font-semibold cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #8B1A2A, #C45C6A)',
              boxShadow: '0 2px 10px rgba(139,26,42,0.4)',
              fontFamily: 'Cairo, sans-serif',
              minWidth: 44,
              minHeight: 32,
            }}
          >
            أضف +
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
