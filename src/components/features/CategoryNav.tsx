import { useRef } from 'react';
import { Flame } from 'lucide-react';
import { categories } from '@/constants/menuMetadata';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import CategoryIcon from './CategoryIcon';
import { playPaperFlipSound } from '@/lib/sound';

import type { MenuCategory } from '@/types/menu';
import type { DBCategory } from '@/types/database';

interface Props {
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  categoriesList?: (MenuCategory | DBCategory)[];
}

export default function CategoryNav({ activeCategory, onCategoryChange, categoriesList }: Props) {
  const list = categoriesList && categoriesList.length > 0 ? categoriesList : categories;
  const categoryIds = list.map(c => c.id);
  const scrollSpyId = useScrollSpy(categoryIds);
  const scrollRef = useRef<HTMLDivElement>(null);

  // When 'all': scroll-spy drives the highlight
  // When filtered: selected category drives it
  const highlightedId = activeCategory === 'all' ? scrollSpyId : activeCategory;
  const isAllActive = activeCategory === 'all';

  const scrollToOffers = () => {
    playPaperFlipSound();
    const el = document.getElementById('offers-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      id="menu-nav-sticky"
      className="sticky top-14 z-40 w-full bg-white/95 dark:bg-[#0c090b]/95 backdrop-blur-md border-b border-neutral-200 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-colors duration-200"
    >
      <div
        ref={scrollRef}
        className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 overflow-x-auto scrollbar-hide max-w-4xl mx-auto"
        style={{ direction: 'rtl', scrollSnapType: 'x mandatory' }}
      >
        {/* Offers shortcut */}
        <button
          onClick={scrollToOffers}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border border-red-500/50 active:scale-95"
        >
          <Flame size={14} className="text-amber-300 animate-pulse" />
          <span>العروض</span>
        </button>

        {/* "الكل" — show all */}
        <button
          onClick={() => onCategoryChange('all')}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer border active:scale-95 ${
            isAllActive
              ? 'bg-red-50 dark:bg-gradient-to-b dark:from-[#2a1317] dark:to-[#170d10] border-red-600 text-red-700 dark:text-white shadow-sm dark:shadow-[0_0_12px_rgba(220,38,38,0.25)]'
              : 'bg-neutral-100 dark:bg-white/[0.04] border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-white/20'
          }`}
        >
          <CategoryIcon categoryId="all" size={14} className={isAllActive ? 'text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'} />
          <span>الكل</span>
        </button>

        {/* Category buttons */}
        {list.map(cat => {
          const isActive = highlightedId === cat.id;
          const isSelected = activeCategory === cat.id;
          const isCurrent = isSelected || (!isAllActive && isActive);

          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer border active:scale-95 ${
                isCurrent
                  ? 'bg-red-50 dark:bg-gradient-to-b dark:from-[#2a1317] dark:to-[#170d10] border-red-600 text-red-700 dark:text-white shadow-sm dark:shadow-[0_0_12px_rgba(220,38,38,0.25)]'
                  : 'bg-neutral-100 dark:bg-white/[0.04] border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-white/20'
              }`}
            >
              <CategoryIcon categoryId={cat.id} icon={cat.icon} size={14} className={isCurrent ? 'text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
