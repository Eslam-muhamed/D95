import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import TopHeader from '@/components/features/TopHeader';
import HeroSection from '@/components/features/HeroSection';
import CategoryNav from '@/components/features/CategoryNav';
import SearchBar from '@/components/features/SearchBar';
import OffersSection from '@/components/features/OffersSection';
import MenuSection from '@/components/features/MenuSection';
import ItemCustomizerModal from '@/components/features/ItemCustomizerModal';
import CartSheet from '@/components/features/CartSheet';
import Footer from '@/components/layout/Footer';
import ReviewsSection from '@/components/features/ReviewsSection';
import ContactSection from '@/components/features/ContactSection';
import { categories } from '@/constants/menuMetadata';
import { allItems } from '@/constants/menuData';
import type { MenuItem } from '@/types/menu';

function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="عودة للأعلى"
          className="cursor-pointer"
          style={{
            position: 'fixed',
            bottom: 86,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 34,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--c-card)',
            border: '1px solid rgba(139,26,42,0.35)',
            boxShadow: '0 3px 16px rgba(139,26,42,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronUp size={18} style={{ color: 'var(--c-brand-l)' }} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function MenuPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const handleCategoryChange = (id: string) => {
    setActiveCategory(id);
    setSearch('');
    if (id !== 'all') {
      setTimeout(() => {
        const el = document.getElementById('menu-content');
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 118;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        }
      }, 40);
    }
  };

  const hasSearch = search.trim().length > 0;
  const isFiltered = !hasSearch && activeCategory !== 'all';

  const searchResults = hasSearch
    ? allItems.filter(i => i.name.includes(search) || i.description.includes(search))
    : [];

  const filteredCategory = categories.find(c => c.id === activeCategory);
  const filteredItems = isFiltered ? allItems.filter(i => i.category === activeCategory) : [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)', direction: 'rtl' }}>
      <TopHeader onCartOpen={() => setCartOpen(true)} />
      <HeroSection />
      <CategoryNav activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
      <SearchBar value={search} onChange={setSearch} />

      <div id="menu-content">
        <AnimatePresence mode="wait">
          {hasSearch ? (
            /* ── Search Results ── */
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="px-4 py-6 max-w-4xl mx-auto"
            >
              <p className="text-sm mb-4" style={{ color: 'var(--c-text-3)', fontFamily: 'Cairo, sans-serif' }}>
                {searchResults.length} نتيجة لـ &ldquo;{search}&rdquo;
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.map(item => (
                  <button
                    key={item.id}
                    className="w-full text-right flex items-center gap-3 rounded-xl p-3 transition-all card-glow-hover cursor-pointer"
                    style={{
                      background: 'var(--c-card)',
                      border: '1px solid var(--c-border)',
                    }}
                    onClick={() => setSelectedItem(item)}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--c-text-1)', fontFamily: 'Cairo, sans-serif' }}>
                        {item.name}
                      </p>
                      <p className="font-bold text-sm mt-1" style={{ color: 'var(--c-brand-l)', fontFamily: '"Playfair Display", serif' }}>
                        {item.price} ج.م
                      </p>
                    </div>
                    <span
                      className="text-xs px-2.5 py-1.5 rounded-full flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #8B1A2A, #C45C6A)',
                        color: '#fff',
                        fontFamily: 'Cairo, sans-serif',
                      }}
                    >
                      أضف +
                    </span>
                  </button>
                ))}
                {searchResults.length === 0 && (
                  <div className="col-span-2 text-center py-14">
                    <span className="text-5xl">🌹</span>
                    <p className="mt-4" style={{ color: 'var(--c-text-4)', fontFamily: 'Cairo, sans-serif' }}>
                      لا توجد نتائج مطابقة لبحثك
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : isFiltered ? (
            /* ── Single Category Filter ── */
            <motion.div
              key={`cat-${activeCategory}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              {filteredCategory ? (
                <div className="pt-2">
                  <div className="px-4 py-3 max-w-4xl mx-auto flex items-center justify-between">
                    <p className="text-xs" style={{ color: 'var(--c-text-4)', fontFamily: 'Cairo, sans-serif' }}>
                      {filteredItems.length} صنف
                    </p>
                    <button
                      onClick={() => handleCategoryChange('all')}
                      className="text-xs px-3 py-1 rounded-full transition-all cursor-pointer"
                      style={{
                        color: 'var(--c-brand-l)',
                        border: '1px solid rgba(196,92,106,0.35)',
                        fontFamily: 'Cairo, sans-serif',
                        minHeight: 32,
                      }}
                    >
                      عرض الكل
                    </button>
                  </div>
                  <MenuSection
                    category={filteredCategory}
                    items={filteredItems}
                    onAdd={setSelectedItem}
                  />
                </div>
              ) : null}
            </motion.div>
          ) : (
            /* ── All Categories ── */
            <motion.div
              key="all"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <OffersSection />
              {categories.map(cat => (
                <MenuSection
                  key={cat.id}
                  category={cat}
                  items={allItems.filter(i => i.category === cat.id)}
                  onAdd={setSelectedItem}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div id="reviews-section">
        <ReviewsSection />
      </div>
      <ContactSection />
      <Footer />

      {/* Scroll to Top */}
      <ScrollToTop />
      {/* ── Modals ── */}
      <ItemCustomizerModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
