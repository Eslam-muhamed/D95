import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CinematicBackground from './CinematicBackground';
import BrandReveal from './BrandReveal';

interface SplashScreenProps {
  onComplete: () => void;
  forceShow?: boolean;
}

export default function SplashScreen({ onComplete, forceShow = false }: SplashScreenProps) {
  const [visible, setVisible] = useState(() => {
    if (forceShow) return true;
    try {
      return !sessionStorage.getItem('d95_splash_shown');
    } catch {
      return true;
    }
  });

  const [phase, setPhase] = useState<'charging' | 'surge' | 'reveal' | 'exit'>('charging');

  const markDismissed = useCallback(() => {
    try {
      sessionStorage.setItem('d95_splash_shown', '1');
    } catch {
      // Ignore storage restrictions
    }
  }, []);

  const handleSkip = useCallback(() => {
    markDismissed();
    setVisible(false);
  }, [markDismissed]);

  // Animation timeline sequence
  useEffect(() => {
    if (!visible) return;

    // Respect user's motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setPhase('reveal');
      const exitTimer = setTimeout(() => {
        markDismissed();
        setVisible(false);
      }, 1200);
      return () => clearTimeout(exitTimer);
    }

    // Timeline steps:
    // 0.0s -> charging
    // 0.8s -> surge
    const surgeTimer = setTimeout(() => {
      setPhase('surge');
    }, 800);

    // 1.2s -> reveal (Logo appears)
    const revealTimer = setTimeout(() => {
      setPhase('reveal');
    }, 1250);

    // 2.5s -> exit (Fade out to app)
    const exitTimer = setTimeout(() => {
      setPhase('exit');
      markDismissed();
      setVisible(false);
    }, 2550);

    return () => {
      clearTimeout(surgeTimer);
      clearTimeout(revealTimer);
      clearTimeout(exitTimer);
    };
  }, [visible, markDismissed]);

  if (!visible) return null;

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          key="d95-cinematic-splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.03,
            transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-[#050508] select-none"
        >
          {/* Dynamic Cyber Background */}
          <CinematicBackground surgeActive={phase === 'surge'} />

          {/* Top Bar: Brand Status & Skip Button */}
          <div className="absolute top-0 left-0 right-0 z-30 p-4 sm:p-6 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md text-[11px] font-bebas tracking-wider text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-[#E5252A] animate-pulse" />
              <span>D95 EXPERIENTIAL</span>
            </div>

            <button
              type="button"
              onClick={handleSkip}
              className="pointer-events-auto px-4 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 hover:border-red-500/50 backdrop-blur-md text-xs font-bebas tracking-widest text-neutral-200 hover:text-white transition-all duration-200 active:scale-95 shadow-lg"
            >
              تخطي • SKIP
            </button>
          </div>

          {/* Core Content: Cinematic Logo Reveal */}
          <BrandReveal phase={phase} />

          {/* Bottom Atmosphere Micro-hint */}
          <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center pointer-events-none">
            <p className="font-bebas text-[11px] tracking-[0.3em] text-neutral-600 uppercase">
              D95 LOUNGE &amp; ESPORTS ARENA
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
