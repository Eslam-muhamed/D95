import { MapPin, Phone, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from '@/hooks/useInView';

const CAFE_PHONE = '201000000000';
const CAFE_PHONE_DISPLAY = '01000000000';
const GOOGLE_MAPS_LINK = 'https://maps.app.goo.gl/KPRktJNQoYwYvpCT7';
const MAPS_EMBED_SRC = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3622.4127481777755!2d31.487317599999997!3d30.589288600000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14f7f10072ed4367%3A0xd5ea1c9c23c64826!2sG%C3%9CZEL%20CAFE!5e1!3m2!1sen!2seg!4v1786179399270!5m2!1sen!2seg";

const INFO_ROWS = [
  { Icon: MapPin, label: 'العنوان', value: 'القاهرة - مصر', href: GOOGLE_MAPS_LINK },
  { Icon: Phone, label: 'التليفون', value: CAFE_PHONE_DISPLAY, href: `tel:+${CAFE_PHONE}` },
  { Icon: Clock, label: 'مواعيد العمل', value: 'يومياً من 8 ص حتى 4 ص', href: null },
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

      {/* Google Maps iframe */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="w-full rounded-2xl overflow-hidden mb-5"
        style={{ height: 220, border: '1px solid rgba(139,26,42,0.2)' }}
      >
        <iframe
          src={MAPS_EMBED_SRC}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="موقع D95 Gaming & Café"
        />
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.25, duration: 0.45 }}
        className="flex gap-3"
      >
        <a
          href={`https://wa.me/${CAFE_PHONE}?text=${encodeURIComponent('مرحباً! أريد الاستفسار عن D95 Gaming & Café 🎮☕')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #128C7E, #25D366)',
            fontFamily: 'Cairo, sans-serif',
            boxShadow: '0 3px 16px rgba(37,211,102,0.28)',
            minHeight: 52,
          }}
        >
          <span style={{ fontSize: 18 }}>💬</span>
          واتساب
        </a>
        <a
          href={GOOGLE_MAPS_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer"
          style={{
            background: 'var(--c-card)',
            color: 'var(--c-text-1)',
            border: '1px solid rgba(139,26,42,0.28)',
            fontFamily: 'Cairo, sans-serif',
            minHeight: 52,
          }}
        >
          <MapPin size={16} style={{ color: '#C45C6A' }} />
          اعثر علينا
        </a>
      </motion.div>
    </section>
  );
}
