import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import heroImg from '@/assets/hero.jpg';

const shapes = [
  { kind: 'gaming', top: 12, left: 8,  size: 28, op: 0.7, depth: 0.04, fd: 3.5, fdelay: 0 },
  { kind: 'cup',    top: 20, left: 82, size: 22, op: 0.5, depth: 0.06, fd: 4,   fdelay: 0.5 },
  { kind: 'rose',   top: 60, left: 15, size: 18, op: 0.4, depth: 0.03, fd: 5,   fdelay: 1 },
  { kind: 'gaming', top: 75, left: 75, size: 24, op: 0.6, depth: 0.05, fd: 3,   fdelay: 0.3 },
  { kind: 'star',   top: 35, left: 90, size: 14, op: 0.5, depth: 0.07, fd: 4.5, fdelay: 0.8 },
  { kind: 'drop',   top: 85, left: 45, size: 16, op: 0.4, depth: 0.04, fd: 3.8, fdelay: 1.2 },
  { kind: 'hex',    top: 50, left: 5,  size: 20, op: 0.3, depth: 0.05, fd: 5,   fdelay: 0.6 },
  { kind: 'cup',    top: 10, left: 55, size: 18, op: 0.5, depth: 0.06, fd: 3.2, fdelay: 0.2 },
  { kind: 'gaming', top: 40, left: 30, size: 16, op: 0.35,depth: 0.03, fd: 4.2, fdelay: 1.5 },
  { kind: 'star',   top: 65, left: 62, size: 12, op: 0.45,depth: 0.08, fd: 3.7, fdelay: 0.9 },
  { kind: 'cup',    top: 25, left: 45, size: 18, op: 0.3, depth: 0.04, fd: 4.8, fdelay: 0.4 },
  { kind: 'drop',   top: 80, left: 20, size: 14, op: 0.5, depth: 0.06, fd: 3.5, fdelay: 0.7 },
  { kind: 'hex',    top: 15, left: 70, size: 22, op: 0.4, depth: 0.05, fd: 4,   fdelay: 1.1 },
  { kind: 'gaming', top: 55, left: 88, size: 20, op: 0.6, depth: 0.03, fd: 5.2, fdelay: 0.15 },
  { kind: 'rose',   top: 90, left: 60, size: 16, op: 0.35,depth: 0.07, fd: 3.9, fdelay: 1.3 },
  { kind: 'star',   top: 5,  left: 30, size: 12, op: 0.5, depth: 0.04, fd: 4.3, fdelay: 0.65 },
  { kind: 'drop',   top: 45, left: 52, size: 14, op: 0.4, depth: 0.06, fd: 3.6, fdelay: 0.85 },
  { kind: 'cup',    top: 70, left: 35, size: 20, op: 0.3, depth: 0.05, fd: 4.7, fdelay: 0.4 },
  { kind: 'hex',    top: 30, left: 18, size: 18, op: 0.45,depth: 0.03, fd: 5.1, fdelay: 1.0 },
];

const EMOJIS: Record<string, string> = {
  gaming: '🎮', cup: '☕', rose: '🌹', star: '✦', drop: '💧', hex: '❋',
};

const COLORS: Record<string, string> = {
  gaming: '#C45C6A', cup: '#F4C2C8', rose: '#8B1A2A', star: '#F4C2C8', drop: '#C45C6A', hex: '#8B1A2A',
};

export default function HeroSection() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handle = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left - rect.width / 2) / rect.width);
      mouseY.set((e.clientY - rect.top - rect.height / 2) / rect.height);
    };
    const touchHandle = (e: TouchEvent) => {
      const rect = el.getBoundingClientRect();
      const t = e.touches[0];
      mouseX.set((t.clientX - rect.left - rect.width / 2) / rect.width);
      mouseY.set((t.clientY - rect.top - rect.height / 2) / rect.height);
    };
    el.addEventListener('mousemove', handle);
    el.addEventListener('touchmove', touchHandle, { passive: true });
    return () => { el.removeEventListener('mousemove', handle); el.removeEventListener('touchmove', touchHandle); };
  }, [mouseX, mouseY]);

  const scrollToMenu = () => {
    const el = document.getElementById('menu-nav-sticky');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 56;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  };

  return (
    <div ref={heroRef} className="relative overflow-hidden flex flex-col min-h-[60vh] md:min-h-[78vh]" style={{ paddingTop: 56 }}>
      {/* Background */}
      <img src={heroImg} alt="D95 Gaming & Café" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.22) 50%, rgba(0,0,0,0.18) 75%, #0f0608 100%)' }} />
      <div className="absolute inset-0 bg-black/20" />

      {/* Brand glow orb */}
      <motion.div
        className="absolute pointer-events-none animate-float"
        style={{
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 400,
          height: 400,
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(139,26,42,0.22) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Corner decorations */}
      <svg className="absolute top-20 left-4 opacity-40" width="60" height="60" fill="none">
        <path d="M 0 60 L 0 0 L 60 0" stroke="#8B1A2A" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="3" fill="#C45C6A" />
      </svg>
      <svg className="absolute top-20 right-4 opacity-40" width="60" height="60" fill="none">
        <path d="M 60 60 L 60 0 L 0 0" stroke="#8B1A2A" strokeWidth="1.5" />
        <circle cx="60" cy="0" r="3" fill="#C45C6A" />
      </svg>

      {/* Floating shapes */}
      {shapes.map((s, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none select-none"
          style={{ top: `${s.top}%`, left: `${s.left}%`, fontSize: s.size, color: COLORS[s.kind], opacity: s.op }}
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: s.fd, delay: s.fdelay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.span
            style={{
              x: springX,
              display: 'block',
            }}
          >
            {EMOJIS[s.kind]}
          </motion.span>
        </motion.div>
      ))}

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center" style={{ padding: '36px 20px 52px' }}>
        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="text-xs tracking-[0.5em] uppercase mb-4"
          style={{ color: '#F4C2C8', fontFamily: 'Cairo, sans-serif' }}
        >
          ✦ &nbsp; GAMING &amp; CAFÉ &nbsp; ✦
        </motion.p>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="font-display font-bold brand-text-shimmer"
          style={{ fontSize: 'clamp(3.5rem, 14vw, 8rem)', lineHeight: 1, letterSpacing: '0.05em', fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          D95
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="mt-4 text-lg"
          style={{ color: 'rgba(244,194,200,0.9)', fontFamily: 'Cairo, sans-serif', maxWidth: 400 }}
        >
          حيث المتعة تلتقي بالاحترافية
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="flex items-center gap-3 mt-6"
        >
          <div className="h-px w-24" style={{ background: 'linear-gradient(to right, transparent, #8B1A2A)' }} />
          <span style={{ color: '#C45C6A' }}>🎮</span>
          <div className="h-px w-24" style={{ background: 'linear-gradient(to left, transparent, #8B1A2A)' }} />
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={scrollToMenu}
          className="mt-8 px-8 py-3 rounded-full text-white font-semibold tracking-wide cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #8B1A2A, #C45C6A)',
            boxShadow: '0 4px 24px rgba(139,26,42,0.5)',
            fontFamily: 'Cairo, sans-serif',
            fontSize: 16,
            border: '1px solid rgba(244,194,200,0.2)',
          }}
        >
          استكشف القائمة ↓
        </motion.button>

        {/* Reviews Teaser */}
        <div className="mt-5 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-full" style={{ background: 'rgba(244,194,200,0.12)', border: '1px solid rgba(244,194,200,0.22)' }}>
            <span style={{ fontSize: 13 }}>⭐ ⭐ ⭐ ⭐ ⭐</span>
            <span className="text-xs font-semibold" style={{ color: 'rgba(244,194,200,0.9)', fontFamily: 'Cairo, sans-serif' }}>
              4.9 • عائلة D95
            </span>
          </div>
          <motion.span
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ color: 'rgba(244,194,200,0.55)', fontSize: 13 }}
          >
            ▼
          </motion.span>
        </div>
      </div>
    </div>
  );
}
