import { CONTACT_INFO } from '@/constants/contactInfo';
import { Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="text-center py-10 px-4" style={{ borderTop: '1px solid rgba(139,26,42,0.18)' }}>
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, rgba(139,26,42,0.5))' }} />
        <span className="text-2xl">🎮</span>
        <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, rgba(139,26,42,0.5))' }} />
      </div>
      <h3 className="font-display font-bold text-2xl brand-text mb-1" style={{ fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '0.1em' }}>
        D95
      </h3>
      <p className="text-xs mb-3" style={{ color: 'var(--c-text-4)', letterSpacing: '0.3em', fontFamily: 'Cairo, sans-serif', textTransform: 'uppercase' }}>
        GAMING &amp; CAFÉ
      </p>

      {CONTACT_INFO.instagramUrl && (
        <div className="mb-4 flex justify-center">
          <a
            href={CONTACT_INFO.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 border border-pink-500/30 text-pink-500 bg-pink-500/10 hover:bg-pink-500/20"
            style={{ fontFamily: 'Cairo, sans-serif' }}
            aria-label="Instagram"
          >
            <Instagram size={14} />
            <span dir="ltr">{CONTACT_INFO.instagramHandle}</span>
          </a>
        </div>
      )}
      <p className="text-xs" style={{ color: 'var(--c-text-4)', fontFamily: 'Cairo, sans-serif' }}>
        حيث المتعة تلتقي بالاحترافية • جميع الحقوق محفوظة © 2026
      </p>
      <p className="text-xs mt-4" style={{ color: 'var(--c-text-5)', fontFamily: 'Cairo, sans-serif', letterSpacing: '0.02em' }}>
        designed &amp; developed by{' '}
        <a
          href={CONTACT_INFO.whatsappNumber ? `https://wa.me/${CONTACT_INFO.whatsappNumber}` : '#'}
          target={CONTACT_INFO.whatsappNumber ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="transition-opacity hover:opacity-70"
          style={{ color: 'var(--c-brand-l)', textDecoration: 'none', fontWeight: 500 }}
        >
          Eng. Eslam
        </a>
      </p>
    </footer>
  );
}
