import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { useTheme } from '@/stores/themeStore';
import CategoryIcon from './CategoryIcon';

const offers = [
  {
    title: 'Gaming Night Deal',
    description: 'ساعتين غيمنج + مشروب بارد + ساندوتش طازج',
    detail: 'وفر 28% على أفضل تجربة سهرة وتنافس',
    badge: 'وفّر 28%',
    price: '180 ج.م',
    originalPrice: '250 ج.م',
    gradient: 'linear-gradient(135deg, #1e0d11 0%, #140b0e 100%)',
    icon: '🎮',
    highlight: true,
  },
  {
    title: 'Café Combo',
    description: 'قهوة سبيشالتي دبل إسبريسو + حلوى من اختيارك',
    detail: 'بُن برازيلي فاخر مع تحلية فريش',
    badge: 'الأكثر طلباً',
    price: '79 ج.م',
    originalPrice: '110 ج.م',
    gradient: 'linear-gradient(135deg, #180e12 0%, #120a0d 100%)',
    icon: '☕',
    highlight: false,
  },
  {
    title: 'عرض الأصحاب والشلات',
    description: '٤ مشروبات مثلجة + ٤ قطع وافل بسعر ترويجي',
    detail: 'أفضل عرض للجلسات الرباعية والمجموعات',
    badge: 'للمجموعات',
    price: '280 ج.م',
    originalPrice: '400 ج.م',
    gradient: 'linear-gradient(135deg, #180e12 0%, #120a0d 100%)',
    icon: '👥',
    highlight: false,
  },
  {
    title: 'ساعة السعادة (Happy Hour)',
    description: 'خصم 20% فوري على كافة المشروبات الساخنة والباردة',
    detail: 'من 2:00 م حتى 5:00 م يومياً',
    badge: 'يومياً',
    price: 'خصم 20%',
    originalPrice: '',
    gradient: 'linear-gradient(135deg, #1e0d11 0%, #140b0e 100%)',
    icon: '⚡',
    highlight: true,
  },
];

import type { DBOffer } from '@/types/database';

interface OffersSectionProps {
  liveOffers?: DBOffer[];
}

export default function OffersSection({ liveOffers }: OffersSectionProps) {
  const [ref, inView] = useInView<HTMLElement>(0.1);
  const { theme } = useTheme();

  const displayOffers = (liveOffers && liveOffers.length > 0)
    ? liveOffers.filter(o => o.is_active).map(o => ({
        title: o.title,
        description: o.description || '',
        detail: o.detail || '',
        badge: o.badge || '',
        price: o.price,
        originalPrice: o.original_price || '',
        gradient: o.highlight 
          ? 'linear-gradient(135deg, #1e0d11 0%, #140b0e 100%)' 
          : 'linear-gradient(135deg, #180e12 0%, #120a0d 100%)',
        icon: o.icon || '🎮',
        highlight: o.highlight
      }))
    : offers;

  return (
    <section id="offers-section" className="px-4 py-8 max-w-4xl mx-auto" ref={ref} dir="rtl">
      {/* Section Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-red-600/40" />
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-[#150d10] border border-neutral-200 dark:border-red-600/30 shadow-sm transition-colors">
          <Flame size={16} className="text-red-600 dark:text-red-500 animate-pulse" />
          <h2 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white font-body tracking-wide">
            العروض الخاصة والتوفير
          </h2>
        </div>
        <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-red-600/40" />
      </div>

      {/* Offers container: Swipeable carousel on mobile, 2-col grid on desktop */}
      <div className="flex sm:grid sm:grid-cols-2 gap-3 overflow-x-auto sm:overflow-x-visible scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {displayOffers.map((offer, i) => (
          <motion.div
            key={offer.title}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className={`min-w-[270px] max-w-[310px] sm:min-w-0 sm:max-w-none flex-1 shrink-0 snap-center relative rounded-2xl p-4 overflow-hidden select-none border transition-all duration-200 bg-white dark:bg-[#130b0e] ${
              offer.highlight
                ? 'border-red-600/60 shadow-[0_4px_20px_rgba(220,38,38,0.12)] dark:shadow-[0_0_20px_rgba(220,38,38,0.22)]'
                : 'border-neutral-200 dark:border-white/[0.08] hover:border-neutral-300 dark:hover:border-white/20 shadow-sm dark:shadow-none'
            }`}
            style={theme === 'dark' ? { background: offer.gradient } : undefined}
          >
            {/* Top red accent line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent" />

            {/* Header: Icon, Badge, and Title */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="shrink-0 p-1.5 rounded-lg bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200/60 dark:border-white/10 text-red-600 dark:text-red-400">
                  <CategoryIcon icon={offer.icon} size={18} />
                </div>
                <h3 className="font-bold text-neutral-900 dark:text-white text-sm sm:text-base font-body leading-tight">
                  {offer.title}
                </h3>
              </div>
              {offer.badge && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/90 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-600/50 shrink-0">
                  {offer.badge}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed font-body mb-2.5">
              {offer.description}
            </p>

            {/* Price footer */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-white/[0.06]">
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium truncate">
                {offer.detail || 'عرض حصري لفترة محدودة'}
              </span>
              <div className="flex items-baseline gap-1.5 shrink-0" dir="ltr">
                {offer.originalPrice && (
                  <span className="text-xs text-neutral-400 line-through font-sans tabular-nums">
                    {offer.originalPrice}
                  </span>
                )}
                <span className="font-sans font-black text-base sm:text-lg text-red-600 dark:text-red-400 tabular-nums">
                  {offer.price}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
