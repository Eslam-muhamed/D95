import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { MenuItem } from '@/types/menu';

interface Props {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

const BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  'Popular':       { bg: 'bg-red-950/90',    color: 'text-red-300',    border: 'border-red-600/50' },
  'New':           { bg: 'bg-emerald-950/90', color: 'text-emerald-300', border: 'border-emerald-500/50' },
  "Chef's Choice": { bg: 'bg-amber-950/90',   color: 'text-amber-300',   border: 'border-amber-500/50' },
};

export default function MenuCard({ item, onAdd }: Props) {
  const badgeStyle = item.badge ? BADGE_STYLES[item.badge] : null;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 rounded-xl p-3 bg-[#130f11] border border-white/[0.08] hover:border-red-600/40 hover:bg-[#181215] transition-all cursor-pointer shadow-sm group"
      dir="rtl"
      onClick={() => onAdd(item)}
    >
      {/* Image */}
      <div className="relative shrink-0 rounded-lg overflow-hidden w-20 h-20 bg-black/40 border border-white/10">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {badgeStyle && (
          <span
            className={`absolute bottom-1 right-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${badgeStyle.bg} ${badgeStyle.color} ${badgeStyle.border} backdrop-blur-sm`}
          >
            {item.badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm text-white mb-0.5 truncate font-body">
          {item.name}
        </h3>
        <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2 mb-2 font-body">
          {item.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1" dir="ltr">
            <span className="font-sans font-black text-base text-red-400 tabular-nums">
              {item.price}
            </span>
            <span className="text-[11px] font-bold text-neutral-400 font-body">
              ج.م
            </span>
          </div>

          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(item);
            }}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer border border-red-500/60 font-body"
          >
            <Plus size={13} className="stroke-[3]" />
            <span>أضف</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
