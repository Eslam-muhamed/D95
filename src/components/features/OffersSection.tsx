import { motion } from 'framer-motion';
import { useInView } from '@/hooks/useInView';

const offers = [
  {
    title: 'Gaming Night Deal 🎮',
    description: 'ساعتين غيمنج + مشروب + ساندوتش',
    detail: 'وفر 28% على ليلة اللعب',
    badge: 'وفّر 28%',
    price: '180 ج.م',
    originalPrice: '250 ج.م',
    gradient: 'linear-gradient(135deg, #8B1A2A 0%, #C45C6A 100%)',
    emoji: '🎮',
  },
  {
    title: 'Café Combo ☕',
    description: 'قهوة + حلوى من اختيارك',
    detail: 'قهوة طازجة مع تحلية خاصة',
    badge: 'الأكثر طلباً',
    price: '79 ج.م',
    originalPrice: '110 ج.م',
    gradient: 'linear-gradient(135deg, #5a0d18 0%, #8B1A2A 100%)',
    emoji: '☕',
  },
  {
    title: 'عرض الأصحاب 👥',
    description: '٤ مشروبات + ٤ وافل بسعر خاص',
    detail: 'أفضل عرض للمجموعات والشلات',
    badge: 'للمجموعات',
    price: '280 ج.م',
    originalPrice: '400 ج.م',
    gradient: 'linear-gradient(135deg, #220a10 0%, #8B1A2A 80%)',
    emoji: '👥',
  },
  {
    title: 'هابي أور ⏰',
    description: 'خصم 20% على جميع المشروبات',
    detail: 'من 2 م – 5 م يومياً',
    badge: 'يومياً',
    price: 'خصم 20%',
    originalPrice: '',
    gradient: 'linear-gradient(135deg, #8B1A2A 0%, #4a0810 100%)',
    emoji: '⏰',
  },
];

export default function OffersSection() {
  const [ref, inView] = useInView<HTMLElement>(0.1);

  return (
    <section id="offers-section" className="px-4 py-10 max-w-4xl mx-auto" ref={ref} dir="rtl">
      {/* Gold divider */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #8B1A2A)' }} />
        <span className="text-xl">🌹</span>
        <h2 className="font-display font-bold text-xl tracking-wide brand-text" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          العروض الخاصة
        </h2>
        <span className="text-xl">🌹</span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, #8B1A2A)' }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {offers.map((offer, i) => (
          <motion.div
            key={offer.title}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.12, duration: 0.5 }}
            className="relative rounded-2xl p-5 overflow-hidden select-none"
            style={{
              background: offer.gradient,
              border: '1px solid rgba(244,194,200,0.15)',
              boxShadow: '0 4px 20px rgba(139,26,42,0.25)',
            }}
          >
            {/* Badge */}
            {offer.badge && (
              <span
                className="absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(244,194,200,0.15)', color: '#F4C2C8', border: '1px solid rgba(244,194,200,0.3)', fontFamily: 'Cairo, sans-serif' }}
              >
                {offer.badge}
              </span>
            )}

            <div className="flex items-start justify-between mt-4">
              <div className="flex-1 text-right">
                <p className="text-3xl mb-2">{offer.emoji}</p>
                <h3 className="font-bold text-white text-lg mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  {offer.title}
                </h3>
                <p className="text-sm mb-1 leading-relaxed" style={{ color: 'rgba(244,194,200,0.85)', fontFamily: 'Cairo, sans-serif' }}>
                  {offer.description}
                </p>
                {offer.detail && (
                  <p className="text-xs" style={{ color: 'rgba(244,194,200,0.6)', fontFamily: 'Cairo, sans-serif' }}>
                    {offer.detail}
                  </p>
                )}
              </div>
              <div className="text-right mr-4 flex-shrink-0">
                <p className="font-bold text-xl text-white whitespace-nowrap" style={{ fontFamily: '"Playfair Display", serif' }}>
                  {offer.price}
                </p>
                {offer.originalPrice && (
                  <p className="text-xs line-through whitespace-nowrap" style={{ color: 'rgba(244,194,200,0.5)', fontFamily: 'Cairo, sans-serif' }}>
                    {offer.originalPrice}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
