import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Search, Coffee, Utensils, Sparkles } from 'lucide-react';
import TopHeader from '@/components/features/TopHeader';
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
          className="cursor-pointer fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-10 h-10 rounded-full bg-[#160d10] border border-red-600/50 shadow-[0_4px_16px_rgba(220,38,38,0.3)] flex items-center justify-center text-red-400 hover:text-white hover:bg-red-950 transition-all"
        >
          <ChevronUp size={18} />
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
          const top = el.getBoundingClientRect().top + window.scrollY - 110;
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
    <div className="min-h-screen bg-[#080607] text-[#e8e4e6] font-body text-sm selection:bg-red-600 selection:text-white select-none" dir="rtl">
      {/* Top Header */}
      <TopHeader onCartOpen={() => setCartOpen(true)} />

      {/* ─────────────────────────────────────────────────────────────
          COMPACT ATHLETIC MENU HEADER (HERO REMOVED FOR MAXIMUM SPEED)
         ───────────────────────────────────────────────────────────── */}
      <div className="pt-20 px-4 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-red-500 font-brush font-bold text-xl tracking-wider">D95</span>
              <h1 className="text-lg sm:text-2xl font-bold text-white font-body tracking-wide">
                قائمة المشروبات والمأكولات
              </h1>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 font-medium">
              أجود أنواع القهوة المختصة، المشروبات المنعشة وسناكس الجيمرز
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/[0.04] border border-white/10 text-neutral-300 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span>مفتوح 24/7</span>
            </span>
            <span className="text-xs text-neutral-400 bg-white/[0.04] border border-white/10 px-2.5 py-1 rounded-md font-medium">
              خدمة الصالة والغرف
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Category Navigator */}
      <CategoryNav activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />

      {/* Modern Search Bar */}
      <SearchBar value={search} onChange={setSearch} />

      {/* Content Area */}
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
              className="px-4 py-4 max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-neutral-400 font-mono">
                  {searchResults.length} نتيجة بحث عن &ldquo;{search}&rdquo;
                </p>
                <button
                  onClick={() => setSearch('')}
                  className="text-xs text-red-400 hover:text-red-300 underline cursor-pointer"
                >
                  إلغاء البحث
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.map(item => (
                  <button
                    key={item.id}
                    className="w-full text-right flex items-center gap-3 rounded-xl p-3 bg-[#130f11] border border-white/[0.08] hover:border-red-600/40 hover:bg-[#181215] transition-all cursor-pointer shadow-sm group"
                    onClick={() => setSelectedItem(item)}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-black/40 border border-white/10 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white truncate font-body">
                        {item.name}
                      </p>
                      <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5 font-body">
                        {item.description}
                      </p>
                      <div className="flex items-baseline gap-1 mt-1" dir="ltr">
                        <span className="font-sans font-black text-sm text-red-400 tabular-nums">
                          {item.price}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-body">
                          ج.م
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-600 text-white flex-shrink-0 shadow-sm border border-red-500/50">
                      أضف +
                    </span>
                  </button>
                ))}

                {searchResults.length === 0 && (
                  <div className="col-span-1 sm:col-span-2 text-center py-12 bg-[#120e10] border border-white/[0.08] rounded-xl my-4">
                    <Search className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-neutral-300 font-body">
                      لا توجد نتائج مطابقة لبحثك
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      جرب البحث بكلمات أخرى مثل &quot;إسبريسو&quot; أو &quot;شاي&quot; أو &quot;برجر&quot;
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
                  <div className="px-4 py-2 max-w-4xl mx-auto flex items-center justify-between">
                    <p className="text-xs text-neutral-400 font-mono">
                      {filteredItems.length} صنف متاح
                    </p>
                    <button
                      onClick={() => handleCategoryChange('all')}
                      className="text-xs font-bold px-3 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
                    >
                      عرض جميع الأقسام
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
