import { useRef } from 'react';
import { Flame } from 'lucide-react';
import { categories } from '@/constants/menuMetadata';
import { useScrollSpy } from '@/hooks/useScrollSpy';

interface Props {
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}

export default function CategoryNav({ activeCategory, onCategoryChange }: Props) {
  const ids = categories.map(c => c.id);
  const scrollSpyId = useScrollSpy(ids);
  const scrollRef = useRef<HTMLDivElement>(null);

  // When 'all': scroll-spy drives the highlight
  // When filtered: selected category drives it
  const highlightedId = activeCategory === 'all' ? scrollSpyId : activeCategory;
  const isAllActive = activeCategory === 'all';

  const scrollToOffers = () => {
    const el = document.getElementById('offers-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      id="menu-nav-sticky"
      className="sticky top-14 z-40 w-full bg-[#0c090b]/95 backdrop-blur-md border-b border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
    >
      <div
        ref={scrollRef}
        className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 overflow-x-auto scrollbar-hide max-w-4xl mx-auto"
        style={{ direction: 'rtl', scrollSnapType: 'x mandatory' }}
      >
        {/* Offers shortcut */}
        <button
          onClick={scrollToOffers}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border border-red-500/50"
        >
          <Flame size={14} className="text-amber-300 animate-pulse" />
          <span>العروض</span>
        </button>

        {/* "الكل" — show all */}
        <button
          onClick={() => onCategoryChange('all')}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
            isAllActive
              ? 'bg-gradient-to-b from-[#2a1317] to-[#170d10] border-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.25)]'
              : 'bg-white/[0.04] border-white/10 text-neutral-400 hover:text-white hover:border-white/20'
          }`}
        >
          <span>🎮</span>
          <span>الكل</span>
        </button>

        {/* Category buttons */}
        {categories.map(cat => {
          const isActive = highlightedId === cat.id;
          const isSelected = activeCategory === cat.id;
          const isCurrent = isSelected || (!isAllActive && isActive);

          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                isCurrent
                  ? 'bg-gradient-to-b from-[#2a1317] to-[#170d10] border-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.25)]'
                  : 'bg-white/[0.04] border-white/10 text-neutral-400 hover:text-white hover:border-white/20'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
