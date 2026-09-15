import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Search, Coffee } from 'lucide-react';
import TopHeader from '@/components/features/TopHeader';
import CategoryNav from '@/components/features/CategoryNav';
import SearchBar from '@/components/features/SearchBar';
import OffersSection from '@/components/features/OffersSection';
import MenuSection from '@/components/features/MenuSection';
import ItemCustomizerModal from '@/components/features/ItemCustomizerModal';
import Footer from '@/components/layout/Footer';
import { categories as defaultCategories } from '@/constants/menuMetadata';
import type { MenuItem, MenuCategory } from '@/types/menu';
import { fetchCategories, fetchProducts, fetchOffers, getCachedCategories, getCachedProducts, getCachedOffers } from '@/services/menuService';
import type { DBOffer } from '@/types/database';
import { playPaperFlipSound } from '@/lib/sound';
import D95MiniLogo from '@/components/brand/D95MiniLogo';
import { useCart } from '@/stores/cartStore';

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
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 left-4 z-40 p-2.5 rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition-colors cursor-pointer"
          aria-label="العودة لأعلى الصفحة"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { validateItems } = useCart();

  // Synchronous cache initialization for instant 0ms rendering
  const [categories, setCategories] = useState<MenuCategory[]>(() => {
    const cached = getCachedCategories();
    if (cached && cached.length > 0) {
      return cached.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon || '☕',
        description: c.description || undefined
      }));
    }
    return defaultCategories;
  });

  const [allItems, setAllItems] = useState<MenuItem[]>(() => {
    const cached = getCachedProducts();
    if (cached && cached.length > 0) {
      return cached.filter(p => p.is_available).map(p => ({
        id: p.slug || p.id,
        name: p.name,
        description: p.description || '',
        price: Number(p.price),
        currency: p.currency || 'ج.م',
        category: p.category_id || '',
        image: p.image_url || '',
        badge: (p.badge as MenuItem['badge']) || undefined,
        tags: p.tags || [],
        isHot: p.is_hot,
        isCold: p.is_cold
      }));
    }
    return [];
  });

  const [liveOffers, setLiveOffers] = useState<DBOffer[]>(() => {
    return getCachedOffers() || [];
  });

  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => {
    const cached = getCachedProducts();
    return !cached || cached.length === 0;
  });

  // Load live menu items, categories, and offers strictly from Supabase
  useEffect(() => {
    Promise.all([
      fetchCategories(),
      fetchProducts('all'),
      fetchOffers()
    ]).then(([cats, prods, offs]) => {
      if (cats && cats.length > 0) {
        setCategories(cats.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon || '☕',
          description: c.description || undefined
        })));
      }
      if (prods) {
        const formattedProds = prods.filter(p => p.is_available).map(p => ({
          id: p.slug || p.id,
          name: p.name,
          description: p.description || '',
          price: Number(p.price),
          currency: p.currency || 'ج.م',
          category: p.category_id || '',
          image: p.image_url || '',
          badge: (p.badge as import('@/types/menu').MenuItem['badge']) || undefined,
          tags: p.tags || [],
          isHot: p.is_hot,
          isCold: p.is_cold
        }));
        setAllItems(formattedProds);
        validateItems(formattedProds);
      }
      if (offs && offs.length > 0) {
        setLiveOffers(offs);
      }
    }).catch(err => {
      console.warn('Error loading live menu data from Supabase:', err);
    }).finally(() => {
      setIsInitialLoading(false);
    });
  }, []);

  const handleCategoryChange = (id: string) => {
    playPaperFlipSound();
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

  const handleOffersClick = () => {
    playPaperFlipSound();
    setSearch('');

    const scrollToOffersTarget = () => {
      const el = document.getElementById('offers-section');
      if (el) {
        const nav = document.getElementById('menu-nav-sticky');
        const offset = nav ? nav.getBoundingClientRect().height + 16 : 110;
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        return true;
      }
      return false;
    };

    if (activeCategory !== 'all' || search.trim().length > 0) {
      setActiveCategory('all');
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (scrollToOffersTarget() || attempts > 25) {
          clearInterval(interval);
        }
      }, 20);
    } else {
      scrollToOffersTarget();
    }
  };

  const hasSearch = search.trim().length > 0;
  const isFiltered = !hasSearch && activeCategory !== 'all';

  const searchResults = hasSearch
    ? allItems.filter(i => i.name.includes(search) || i.description.includes(search))
    : [];

  const filteredCategory = categories.find(c => c.id === activeCategory);
  const filteredItems = isFiltered ? allItems.filter(i => i.category === activeCategory) : [];

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of allItems) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [allItems]);

  return (
    <div className="min-h-screen pb-32 sm:pb-16 bg-[#F6F5F2] dark:bg-[#080607] text-neutral-900 dark:text-[#e8e4e6] font-body text-sm selection:bg-red-600 selection:text-white select-none transition-colors duration-200" dir="rtl">
      {/* Top Header */}
      <TopHeader />

      {/* ─────────────────────────────────────────────────────────────
          COMPACT ATHLETIC MENU HEADER (HERO REMOVED FOR MAXIMUM SPEED)
         ───────────────────────────────────────────────────────────── */}
      <div className="pt-20 px-4 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <D95MiniLogo size="sm" />
              <h1 className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-white font-body tracking-wide">
                قائمة المشروبات والحلويات
              </h1>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
              أجود أنواع المشروبات الساخنة، المشروبات الساقعة المنعشة، والحلويات الفاخرة
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span>مفتوح 24/7</span>
            </span>
            <span className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 px-2.5 py-1 rounded-md font-medium">
              خدمة الصالة والغرف
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Category Navigator */}
      <CategoryNav
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        categoriesList={categories}
        onOffersClick={handleOffersClick}
      />

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
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                  {searchResults.length} نتيجة بحث عن &ldquo;{search}&rdquo;
                </p>
                <button
                  onClick={() => setSearch('')}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                >
                  إلغاء البحث
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.map(item => (
                  <button
                    key={item.id}
                    className="w-full text-right flex items-center gap-3 rounded-xl p-3 bg-white dark:bg-[#130f11] border border-neutral-200 dark:border-white/[0.08] hover:border-red-600/40 hover:bg-neutral-50 dark:hover:bg-[#181215] transition-all cursor-pointer shadow-sm group"
                    onClick={() => setSelectedItem(item)}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/10 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-neutral-900 dark:text-white truncate font-body">
                        {item.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5 font-body">
                        {item.description}
                      </p>
                      <div className="flex items-baseline gap-1 mt-1" dir="ltr">
                        <span className="font-sans font-black text-sm text-red-600 dark:text-red-400 tabular-nums">
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
                  <div className="col-span-1 sm:col-span-2 text-center py-12 bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] rounded-xl my-4">
                    <Search className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-neutral-800 dark:text-neutral-300 font-body">
                      لا توجد نتائج مطابقة لبحثك
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      جرب البحث بكلمات مثل &quot;إسبريسو&quot; أو &quot;موهيتو&quot; أو &quot;تشيز كيك&quot;
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
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      {filteredItems.length} صنف متاح
                    </p>
                    <button
                      onClick={() => handleCategoryChange('all')}
                      className="text-xs font-bold px-3 py-1 rounded-lg bg-neutral-100 dark:bg-white/[0.05] hover:bg-neutral-200 dark:hover:bg-white/[0.1] border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                      عرض جميع الأقسام
                    </button>
                  </div>
                  {filteredItems.length === 0 ? (
                    isInitialLoading ? (
                      <div className="px-4 py-8 max-w-4xl mx-auto space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {[1, 2, 3].map((n) => (
                            <div key={n} className="h-28 rounded-2xl bg-white dark:bg-[#130f11] border border-neutral-200 dark:border-white/[0.08] p-3 flex gap-3 animate-pulse">
                              <div className="w-20 h-20 rounded-xl bg-neutral-200 dark:bg-white/10 flex-shrink-0" />
                              <div className="flex-1 space-y-2 py-1">
                                <div className="h-4 w-3/4 bg-neutral-200 dark:bg-white/10 rounded" />
                                <div className="h-3 w-1/2 bg-neutral-200 dark:bg-white/10 rounded" />
                                <div className="h-4 w-1/4 bg-neutral-200 dark:bg-white/10 rounded mt-3" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-14 px-4 text-center max-w-md mx-auto my-4 bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] rounded-2xl shadow-sm">
                        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 font-body mb-1">
                          لا توجد أصناف مضافة حالياً في هذا القسم
                        </p>
                        <p className="text-xs text-neutral-500 font-body">
                          سيتم إضافتها قريباً من قِبل إدارة الكافيه عبر لوحة التحكم.
                        </p>
                      </div>
                    )
                  ) : (
                    <MenuSection
                      category={filteredCategory}
                      items={filteredItems}
                      onAdd={setSelectedItem}
                    />
                  )}
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
              <OffersSection liveOffers={liveOffers} />
              {categories.map(cat => (
                <MenuSection
                  key={cat.id}
                  category={cat}
                  items={itemsByCategory.get(cat.id) || []}
                  onAdd={setSelectedItem}
                />
              ))}

              {isInitialLoading ? (
                <div className="px-4 py-8 max-w-4xl mx-auto space-y-6">
                  <div className="h-6 w-36 bg-neutral-200 dark:bg-white/10 rounded animate-pulse" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <div key={n} className="h-28 rounded-2xl bg-white dark:bg-[#130f11] border border-neutral-200 dark:border-white/[0.08] p-3 flex gap-3 animate-pulse">
                        <div className="w-20 h-20 rounded-xl bg-neutral-200 dark:bg-white/10 flex-shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 w-3/4 bg-neutral-200 dark:bg-white/10 rounded" />
                          <div className="h-3 w-1/2 bg-neutral-200 dark:bg-white/10 rounded" />
                          <div className="h-4 w-1/4 bg-neutral-200 dark:bg-white/10 rounded mt-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : allItems.length === 0 ? (
                <div className="py-16 px-4 text-center max-w-md mx-auto my-6 bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] rounded-2xl shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 flex items-center justify-center mx-auto mb-3.5">
                    <Coffee className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-1 font-body">
                    قائمة الكافيه فارغة حالياً
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-body">
                    سيتم عرض المنتجات هنا فور إضافتها واعتمادها من قِبل الإدارة عبر لوحة التحكم.
                  </p>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />

      {/* Scroll to Top */}
      <ScrollToTop />
      {/* ── Modals ── */}
      <ItemCustomizerModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
