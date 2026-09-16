import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

// ضع رابط التقييم الخاص بك هنا لاحقاً
const GOOGLE_REVIEW_URL = '';

interface ReviewItem {
  name: string;
  initial: string;
  accent: string;
  time: string;
  stars: number;
  text: string;
}

const reviews: ReviewItem[] = [];

function GoogleIcon({ size = 16, white = false }: { size?: number; white?: boolean }) {
  const c = white ? 'rgba(255,255,255,0.92)' : undefined;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill={c ?? '#4285F4'} />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill={c ?? '#34A853'} />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill={c ?? '#FBBC05'} />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill={c ?? '#EA4335'} />
    </svg>
  );
}

export default function ReviewsSection() {
  const [ref, inView] = useInView<HTMLElement>(0.1);

  return (
    <section ref={ref} className="px-4 py-12 max-w-4xl mx-auto" style={{ direction: 'rtl' }}>
      {/* Divider */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(139,26,42,0.4))' }} />
        <span className="text-xl">🌹</span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(139,26,42,0.4))' }} />
      </div>

      {/* Google Reviews label */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <GoogleIcon size={18} />
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: 'var(--c-text-4)', fontFamily: 'Cairo, sans-serif' }}
        >
          GOOGLE REVIEWS
        </span>
      </div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-center font-bold text-2xl mb-3"
        style={{ color: 'var(--c-text-1)', fontFamily: 'Cairo, sans-serif' }}
      >
        ما يقوله{' '}
        <span className="brand-text" style={{ fontFamily: '"Playfair Display", serif' }}>
          ضيوفنا
        </span>
      </motion.h2>

      {/* Aggregate Rating */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex flex-col items-center gap-1 mb-8"
      >
        <span
          className="font-bold"
          style={{ fontSize: 52, lineHeight: 1, color: 'var(--c-brand-l)', fontFamily: '"Playfair Display", serif' }}
        >
          4.9
        </span>
        <div className="flex gap-1 mt-1">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={18} fill="#C45C6A" color="#C45C6A" />
          ))}
        </div>
        <p className="text-xs mt-1.5" style={{ color: 'var(--c-text-4)', fontFamily: 'Cairo, sans-serif' }}>
          تقييم Google • بناءً على آراء عملاء D95
        </p>
      </motion.div>

      {/* Review cards — horizontal scroll */}
      {reviews.length > 0 && (
        <div
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-3"
          style={{ direction: 'rtl' }}
        >
          {reviews.map((review, i) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, x: 24 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
              className="flex-shrink-0 rounded-2xl p-4"
              style={{
                width: 250,
                background: 'var(--c-card)',
                border: '1px solid rgba(139,26,42,0.18)',
                boxShadow: '0 2px 18px rgba(139,26,42,0.07)',
              }}
            >
              {/* Reviewer row */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${review.accent}, #8B1A2A)`,
                    fontSize: 16,
                  }}
                >
                  {review.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-sm truncate"
                    style={{ color: 'var(--c-text-1)', fontFamily: 'Cairo, sans-serif' }}
                  >
                    {review.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--c-text-4)', fontFamily: 'Cairo, sans-serif' }}>
                    {review.time}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <GoogleIcon size={14} />
                </div>
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={12} fill="#C45C6A" color="#C45C6A" />
                ))}
              </div>

              {/* Review text */}
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--c-text-2)', fontFamily: 'Cairo, sans-serif' }}
              >
                {review.text}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-8 flex flex-col items-center gap-3"
      >
        <a
          href={GOOGLE_REVIEW_URL || '#'}
          target={GOOGLE_REVIEW_URL ? '_blank' : undefined}
          rel={GOOGLE_REVIEW_URL ? 'noopener noreferrer' : undefined}
          onClick={(e) => {
            if (!GOOGLE_REVIEW_URL) {
              e.preventDefault();
            }
          }}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #8B1A2A, #C45C6A)',
            color: '#fff',
            fontFamily: 'Cairo, sans-serif',
            boxShadow: '0 4px 22px rgba(139,26,42,0.38)',
            minHeight: 48,
          }}
        >
          <GoogleIcon size={16} white />
          اكتب تقييمك على Google
        </a>
        <p className="text-xs" style={{ color: 'var(--c-text-4)', fontFamily: 'Cairo, sans-serif' }}>
          رأيك يهمّنا — ساعد الآخرين في اختيار الأفضل
        </p>
      </motion.div>
    </section>
  );
}
