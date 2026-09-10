import { MapPin, Phone, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from '@/hooks/useInView';
import { CONTACT_INFO } from '@/constants/contactInfo';

const CAFE_PHONE = CONTACT_INFO.phoneInternational;
const CAFE_PHONE_DISPLAY = CONTACT_INFO.phoneDisplay;
const GOOGLE_MAPS_LINK = CONTACT_INFO.googleMapsLink;
const MAPS_EMBED_SRC = CONTACT_INFO.mapsEmbedSrc;

const INFO_ROWS = [
  { Icon: MapPin, label: 'العنوان', value: CONTACT_INFO.address || '—', href: GOOGLE_MAPS_LINK || null },
  { Icon: Phone, label: 'التليفون', value: CAFE_PHONE_DISPLAY || '—', href: CAFE_PHONE ? `tel:+${CAFE_PHONE}` : null },
  { Icon: Clock, label: 'مواعيد العمل', value: CONTACT_INFO.workingHours || '—', href: null },
];

export default function ContactSection() {
  const [ref, inView] = useInView<HTMLElement>(0.1);

  return (
    <section
      ref={ref}
      className="px-4 pt-4 pb-12 max-w-4xl mx-auto"
      style={{ direction: 'rtl' }}
    >
      {/* Section heading */}
      <div className="flex items-center gap-3 mb-7">
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(139,26,42,0.4))' }} />
        <h2
          className="font-bold text-xl tracking-wide brand-text"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', whiteSpace: 'nowrap' }}
        >
          تواصل معنا
        </h2>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(139,26,42,0.4))' }} />
      </div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="rounded-2xl overflow-hidden mb-5"
        style={{ border: '1px solid rgba(139,26,42,0.2)', background: 'var(--c-card)' }}
      >
        {INFO_ROWS.map((row, i) => {
          const { Icon, label, value, href } = row;
          const inner = (
            <div
              className="flex items-center gap-4 px-4 py-4"
              style={{
                borderBottom: i < INFO_ROWS.length - 1 ? '1px solid var(--c-border)' : 'none',
              }}
            >
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: 40,
                  height: 40,
                  background: 'rgba(139,26,42,0.1)',
                  border: '1px solid rgba(139,26,42,0.2)',
                }}
              >
                <Icon size={17} style={{ color: '#C45C6A' }} />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p
                  className="text-xs mb-0.5"
                  style={{ color: 'var(--c-text-4)', fontFamily: 'Cairo, sans-serif' }}
                >
                  {label}
                </p>
                <p
                  className="font-semibold text-sm"
                  style={{ color: 'var(--c-text-1)', fontFamily: 'Cairo, sans-serif' }}
                >
                  {value}
                </p>
              </div>
              {href && (
                <MapPin
                  size={14}
                  style={{ color: 'rgba(139,26,42,0.35)', flexShrink: 0 }}
                />
              )}
            </div>
          );

          return href ? (
            <a
              key={label}
              href={href}
              target={href.startsWith('tel') ? '_self' : '_blank'}
              rel="noopener noreferrer"
              className="block hover:opacity-80 transition-opacity cursor-pointer"
            >
              {inner}
            </a>
          ) : (
            <div key={label}>{inner}</div>
          );
        })}
      </motion.div>

      {/* Google Maps iframe or Empty Placeholder */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="w-full rounded-2xl overflow-hidden mb-5 flex items-center justify-center"
        style={{ height: 220, border: '1px solid rgba(139,26,42,0.2)', background: 'var(--c-card)' }}
      >
        {MAPS_EMBED_SRC ? (
          <iframe
            src={MAPS_EMBED_SRC}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="موقع الفرع"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-neutral-100/40 dark:bg-white/[0.02]">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
              style={{ background: 'rgba(139,26,42,0.1)', border: '1px solid rgba(139,26,42,0.2)' }}
            >
              <MapPin size={22} style={{ color: '#C45C6A' }} />
            </div>
            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200" style={{ fontFamily: 'Cairo, sans-serif' }}>
              خريطة الموقع
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
              سيتم إضافة خريطة الموقع الجديد فور تحديد العنوان
            </p>
          </div>
        )}
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.25, duration: 0.45 }}
        className="flex gap-3"
      >
        <a
          href={CAFE_PHONE ? `https://wa.me/${CAFE_PHONE}?text=${encodeURIComponent('مرحباً! أريد الاستفسار 🎮☕')}` : '#'}
          target={CAFE_PHONE ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm text-white transition-all ${
            CAFE_PHONE ? 'hover:opacity-90 active:scale-95 cursor-pointer' : 'opacity-50 cursor-not-allowed'
          }`}
          style={{
            background: 'linear-gradient(135deg, #128C7E, #25D366)',
            fontFamily: 'Cairo, sans-serif',
            boxShadow: CAFE_PHONE ? '0 3px 16px rgba(37,211,102,0.28)' : 'none',
            minHeight: 52,
          }}
          onClick={(e) => {
            if (!CAFE_PHONE) e.preventDefault();
          }}
        >
          <span style={{ fontSize: 18 }}>💬</span>
          واتساب
        </a>
        <a
          href={GOOGLE_MAPS_LINK || '#'}
          target={GOOGLE_MAPS_LINK ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all ${
            GOOGLE_MAPS_LINK ? 'hover:opacity-90 active:scale-95 cursor-pointer' : 'opacity-50 cursor-not-allowed'
          }`}
          style={{
            background: 'var(--c-card)',
            color: 'var(--c-text-1)',
            border: '1px solid rgba(139,26,42,0.28)',
            fontFamily: 'Cairo, sans-serif',
            minHeight: 52,
          }}
          onClick={(e) => {
            if (!GOOGLE_MAPS_LINK) e.preventDefault();
          }}
        >
          <MapPin size={16} style={{ color: '#C45C6A' }} />
          اعثر علينا
        </a>
      </motion.div>
    </section>
  );
}
