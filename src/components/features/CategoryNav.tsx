import { useRef } from 'react';
import { motion } from 'framer-motion';
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

  // When 'all': scroll-spy drives the underline highlight
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
      className="sticky z-40 w-full"
      style={{
        top: 56,
        borderBottom: '1px solid var(--c-border, rgba(139, 26, 42, 0.18))',
        backdropFilter: 'blur(16px)',
        backgroundColor: 'var(--glass-bg, rgba(15, 6, 8, 0.85))',
      }}
    >
      <div
        ref={scrollRef}
        className="flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-hide max-w-4xl mx-auto"
        style={{ direction: 'rtl', scrollSnapType: 'x mandatory' }}
      >
        {/* Offers shortcut */}
        <button
          onClick={scrollToOffers}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shadow-sm"
          style={{
            background: 'linear-gradient(135deg, #8B1A2A, #C45C6A)',
            boxShadow: '0 2px 10px rgba(139,26,42,0.4)',
            fontFamily: 'Cairo, sans-serif',
            minHeight: 36,
          }}
        >
          🏷️ عروض
        </button>

        {/* "الكل" — show all */}
        <button
          onClick={() => onCategoryChange('all')}
          className="relative flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer"
          style={{
            fontFamily: 'Cairo, sans-serif',
            minHeight: 36,
            background: isAllActive
              ? 'linear-gradient(135deg, rgba(139,26,42,0.45), rgba(196,92,106,0.3))'
              : 'transparent',
            color: isAllActive ? 'var(--c-on-card, #F4C2C8)' : 'var(--c-text-4, #7a5a60)',
            border: isAllActive ? '1px solid rgba(139,26,42,0.55)' : '1px solid transparent',
          }}
        >
          <span>🎮</span>
          <span>الكل</span>
          {isAllActive && (
            <motion.div
              layoutId="cat-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
              style={{ background: 'linear-gradient(to left, #8B1A2A, #C45C6A)' }}
            />
          )}
        </button>

        {/* Category buttons */}
        {categories.map(cat => {
          const isActive = highlightedId === cat.id;
          const isSelected = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className="relative flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer"
              style={{
                fontFamily: 'Cairo, sans-serif',
                minHeight: 36,
                color: isActive ? 'var(--c-on-card, #F4C2C8)' : 'var(--c-text-4, #7a5a60)',
                background: isSelected
                  ? 'rgba(139,26,42,0.22)'
                  : 'transparent',
                border: isSelected
                  ? '1px solid rgba(139,26,42,0.5)'
                  : '1px solid transparent',
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              {isActive && !isAllActive && (
                <motion.div
                  layoutId="cat-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(to left, #8B1A2A, #C45C6A)' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
