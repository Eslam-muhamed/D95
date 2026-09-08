import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { useTheme } from '@/stores/themeStore';

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

export default function OffersSection() {
  const [ref, inView] = useInView<HTMLElement>(0.1);
  const { theme } = useTheme();

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {offers.map((offer, i) => (
          <motion.div
            key={offer.title}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className={`relative rounded-xl p-4 sm:p-5 overflow-hidden select-none border transition-all duration-200 bg-white dark:bg-transparent ${
              offer.highlight
                ? 'border-red-600/60 shadow-[0_4px_20px_rgba(220,38,38,0.12)] dark:shadow-[0_0_20px_rgba(220,38,38,0.18)]'
                : 'border-neutral-200 dark:border-white/[0.08] hover:border-neutral-300 dark:hover:border-white/20 shadow-sm dark:shadow-none'
            }`}
            style={theme === 'dark' ? { background: offer.gradient } : undefined}
          >
            {/* Top red accent line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent" />

            {/* Badge */}
            {offer.badge && (
              <span className="absolute top-3 left-3 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/90 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-600/50">
                {offer.badge}
              </span>
            )}

            <div className="flex items-start justify-between mt-2">
              <div className="flex-1 text-right pl-3">
                <span className="text-2xl mb-1.5 block">{offer.icon}</span>
                <h3 className="font-bold text-neutral-900 dark:text-white text-base sm:text-lg mb-1 font-body">
                  {offer.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mb-1 leading-relaxed font-body">
                  {offer.description}
                </p>
                {offer.detail && (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                    {offer.detail}
                  </p>
                )}
              </div>

              <div className="text-left shrink-0 self-end" dir="ltr">
                <div className="font-sans font-black text-lg sm:text-xl text-red-600 dark:text-white tabular-nums">
                  {offer.price}
                </div>
                {offer.originalPrice && (
                  <div className="text-xs text-neutral-400 dark:text-neutral-500 line-through font-sans tabular-nums text-left">
                    {offer.originalPrice}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
