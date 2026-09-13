import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import D95BrushLogo from '@/components/brand/D95BrushLogo';

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

  // Animation phase: 'enter' (initial pop) -> 'idle' (holding logo) -> 'morph' (gliding to home logo)
  const [phase, setPhase] = useState<'enter' | 'idle' | 'morph'>('enter');
  const [targetOffset, setTargetOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isTransitioningRef = useRef(false);

  const markDismissed = useCallback(() => {
    try {
      sessionStorage.setItem('d95_splash_shown', '1');
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Compute exact target position of the home page logo
  const calculateTargetPosition = useCallback(() => {
    try {
      const targetEl = document.getElementById('home-brand-logo');
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const targetCenterX = rect.left + rect.width / 2;
        const targetCenterY = rect.top + rect.height / 2;
        return {
          x: targetCenterX - centerX,
          y: targetCenterY - centerY,
        };
      }
    } catch {
      // Fallback below
    }
    // Fallback if target element not found
    return {
      x: 0,
      y: -window.innerHeight * 0.28,
    };
  }, []);

  // Start smooth morph exit
  const triggerMorphExit = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    markDismissed();

    const offset = calculateTargetPosition();
    setTargetOffset(offset);
    setPhase('morph');

    // Smooth exit duration: 850ms
    setTimeout(() => {
      setVisible(false);
    }, 850);
  }, [markDismissed, calculateTargetPosition]);

  // Main animation timeline
  useEffect(() => {
    if (!visible) return;

    // Accessibility check: reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      const quickTimer = setTimeout(() => {
        markDismissed();
        setVisible(false);
      }, 1000);
      return () => clearTimeout(quickTimer);
    }

    // Phase 1: Logo enters smoothly (0s - 0.5s)
    const idleTimer = setTimeout(() => {
      setPhase('idle');
    }, 500);

    // Phase 2: Stays proudly in center for ~2.3 seconds total, then morphs to home logo
    const exitTimer = setTimeout(() => {
      triggerMorphExit();
    }, 2400);

    return () => {
      clearTimeout(idleTimer);
      clearTimeout(exitTimer);
    };
  }, [visible, triggerMorphExit, markDismissed]);

  if (!visible) return null;

  const isMorphing = phase === 'morph';

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <div
          dir="ltr"
          style={{ direction: 'ltr' }}
          className="fixed inset-0 z-[99999] overflow-hidden select-none pointer-events-auto"
          onClick={() => {
            // Instant smooth dismissal when tapping screen
            if (phase !== 'morph') triggerMorphExit();
          }}
        >
          {/* 1. Backdrop: Pure hardware-accelerated dark void fading out smoothly */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: isMorphing ? 0 : 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 bg-[#050508] transform-gpu will-change-[opacity]"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(229, 37, 42, 0.12) 0%, rgba(10, 6, 8, 0.96) 65%, #050508 100%)',
            }}
          />

          {/* 2. Top Bar: Subtle status & Skip button (fades out as morph starts) */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: isMorphing ? 0 : 1, y: isMorphing ? -15 : 0 }}
            transition={{ duration: 0.35 }}
            className="absolute top-0 left-0 right-0 z-40 p-4 sm:p-6 flex items-center justify-between pointer-events-none"
          >
            {/* Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md text-[11px] font-bebas tracking-wider text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-[#E5252A] animate-pulse" />
              <span>D95 LOUNGE</span>
            </div>

            {/* Skip Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerMorphExit();
              }}
              className="pointer-events-auto px-4 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 hover:border-red-500/50 backdrop-blur-md text-xs font-bebas tracking-widest text-neutral-200 hover:text-white transition-all duration-150 active:scale-95 shadow-md cursor-pointer"
            >
              تخطي • SKIP
            </button>
          </motion.div>

          {/* 3. The Grand D95 Logo: Morphs seamlessly into homepage header logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              dir="ltr"
              style={{ direction: 'ltr' }}
              initial={{ opacity: 0, scale: 0.92, y: 0, x: 0 }}
              animate={
                isMorphing
                  ? {
                      opacity: [1, 1, 0.85, 0],
                      scale: [1, 1, 1],
                      x: targetOffset.x,
                      y: targetOffset.y,
                    }
                  : {
                      opacity: 1,
                      scale: 1,
                      x: 0,
                      y: 0,
                    }
              }
              transition={
                isMorphing
                  ? {
                      duration: 0.85,
                      ease: [0.22, 1, 0.36, 1],
                    }
                  : {
                      duration: 0.6,
                      ease: [0.16, 1, 0.3, 1],
                    }
              }
              className="relative flex flex-col items-center justify-center transform-gpu will-change-transform"
            >
              {/* Shimmer Glint Beam passing across D95 Logo */}
              <div className="relative overflow-hidden">
                <D95BrushLogo size="lg" showSubtitle={true} showMotto={false} glow={true} />

                {/* Light shimmer sweep across the letters */}
                <motion.div
                  initial={{ x: '-150%' }}
                  animate={{ x: '250%' }}
                  transition={{ duration: 1.0, delay: 0.8, ease: 'easeInOut' }}
                  className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] pointer-events-none transform-gpu"
                />
              </div>

              {/* Sub-tagline indicator (fades as morph begins) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isMorphing ? 0 : 1 }}
                transition={{ duration: 0.3, delay: isMorphing ? 0 : 0.6 }}
                className="mt-3 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5252A] animate-ping" />
                <p className="font-bebas text-[11px] sm:text-xs text-neutral-400 tracking-[0.3em] uppercase">
                  PLAY • COMPETE • RELAX • REPEAT
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
