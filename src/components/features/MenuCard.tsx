import { Plus } from 'lucide-react';
import type { MenuItem } from '@/types/menu';

interface Props {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

const BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  'Popular':       { bg: 'bg-red-100 dark:bg-red-950/90',    color: 'text-red-700 dark:text-red-300',    border: 'border-red-300 dark:border-red-600/50' },
  'New':           { bg: 'bg-emerald-100 dark:bg-emerald-950/90', color: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-500/50' },
  "Chef's Choice": { bg: 'bg-amber-100 dark:bg-amber-950/90',   color: 'text-amber-800 dark:text-amber-300',   border: 'border-amber-300 dark:border-amber-500/50' },
};

export default function MenuCard({ item, onAdd }: Props) {
  const badgeStyle = item.badge ? BADGE_STYLES[item.badge] : null;

  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3 bg-white dark:bg-[#130f11] border border-neutral-200 dark:border-white/[0.08] hover:border-red-600/40 hover:bg-neutral-50 dark:hover:bg-[#181215] active:scale-[0.99] transition-all cursor-pointer shadow-sm group"
      dir="rtl"
      onClick={() => onAdd(item)}
    >
      {/* Image */}
      <div className="relative shrink-0 rounded-lg overflow-hidden w-20 h-20 bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/10">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {badgeStyle && (
          <span
            className={`absolute bottom-1 right-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${badgeStyle.bg} ${badgeStyle.color} ${badgeStyle.border} backdrop-blur-sm`}
          >
            {item.badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm text-neutral-900 dark:text-white mb-0.5 truncate font-body">
          {item.name}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2 mb-2 font-body">
          {item.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1" dir="ltr">
            <span className="font-sans font-black text-base text-red-600 dark:text-red-400 tabular-nums">
              {item.price}
            </span>
            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 font-body">
              ج.م
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd(item);
            }}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-bold transition-all shadow-sm cursor-pointer border border-red-500/60 font-body"
          >
            <Plus size={13} className="stroke-[3]" />
            <span>أضف</span>
          </button>
        </div>
      </div>
    </div>
  );
}
