import React from 'react';
import { motion } from 'framer-motion';

interface BrandRevealProps {
  phase: 'charging' | 'surge' | 'reveal' | 'exit';
}

export default function BrandReveal({ phase }: BrandRevealProps) {
  const isRevealed = phase === 'reveal' || phase === 'exit';

  return (
    <div className="relative flex flex-col items-center justify-center select-none z-20 px-4">
      {/* 1. Pre-reveal Status Text ("INITIALIZING D95 LOUNGE") */}
      {!isRevealed && (
        <motion.div
          key="pre-reveal-status"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20">
            {/* Spinning Arc Reactor Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-t-[#E5252A] border-r-transparent border-b-[#E5252A]/30 border-l-transparent"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-2 rounded-full border border-b-red-400 border-t-transparent border-r-white/20 border-l-transparent"
            />
            {/* Central Gaming Icon */}
            <motion.span
              animate={{ scale: [0.9, 1.15, 0.9] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="font-bebas font-black text-2xl sm:text-3xl text-white tracking-widest"
            >
              95
            </motion.span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-[#E5252A] animate-ping" />
            <p className="font-bebas text-xs sm:text-sm tracking-[0.35em] text-neutral-400 uppercase">
              INITIALIZING D95 LOUNGE
            </p>
          </div>
        </motion.div>
      )}

      {/* 2. Main Epic Logo Reveal */}
      {isRevealed && (
        <motion.div
          key="brand-logo-reveal"
          initial={{ opacity: 0, scale: 0.88, filter: 'blur(12px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col items-center text-center"
        >
          {/* Ambient Glow Aura */}
          <div
            className="absolute -inset-10 bg-red-600/30 blur-3xl rounded-full pointer-events-none -z-10 animate-pulse"
            aria-hidden="true"
          />

          {/* Lettermark: "D" & "95" */}
          <div className="relative overflow-hidden flex items-baseline leading-none tracking-[0.06em] font-bebas font-black">
            <motion.span
              initial={{ opacity: 0, x: -25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
              className="text-7xl sm:text-8xl md:text-9xl text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]"
            >
              D
            </motion.span>

            <motion.span
              initial={{ opacity: 0, x: 25, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.18, ease: 'backOut' }}
              className="text-7xl sm:text-8xl md:text-9xl text-[#E5252A] drop-shadow-[0_0_35px_rgba(229,37,42,0.85)]"
            >
              95
            </motion.span>

            {/* Diagonal Shimmer Glint Beam */}
            <motion.div
              initial={{ x: '-150%' }}
              animate={{ x: '250%' }}
              transition={{ duration: 1.1, delay: 0.45, ease: 'easeInOut' }}
              className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-25deg] pointer-events-none"
            />
          </div>

          {/* Red Brush Stroke Underline (Animated SVG Path Reveal) */}
          <div className="relative w-full flex items-center justify-center -mt-1 sm:-mt-2">
            <motion.svg
              viewBox="0 0 160 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-48 sm:w-64 md:w-80 h-auto text-[#E5252A] drop-shadow-[0_0_15px_rgba(229,37,42,0.9)]"
            >
              <motion.path
                d="M2 7.5C28 5.8 62 4.5 98 5.2C122 5.6 145 6.6 158 8C152 9.6 130 9.8 104 9.5C65 9 32 9.8 4 10.5C2 10.5 1.5 8.5 2 7.5Z"
                fill="currentColor"
                initial={{ clipPath: 'inset(0 100% 0 0)' }}
                animate={{ clipPath: 'inset(0 0% 0 0)' }}
                transition={{ duration: 0.65, delay: 0.35, ease: 'easeInOut' }}
              />
            </motion.svg>
          </div>

          {/* Subtitle: GAMING & CAFÉ */}
          <motion.div
            initial={{ opacity: 0, y: 8, letterSpacing: '0.15em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '0.38em' }}
            transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
            className="mt-3.5 flex items-center justify-center gap-2.5"
          >
            <span className="w-4 sm:w-6 h-[1.5px] bg-[#E5252A]/80 shadow-[0_0_6px_rgba(229,37,42,0.8)]" />
            <p className="font-bebas font-black text-neutral-200 uppercase text-xs sm:text-sm md:text-base drop-shadow-sm tracking-[0.38em]">
              GAMING &amp; CAFÉ
            </p>
            <span className="w-4 sm:w-6 h-[1.5px] bg-[#E5252A]/80 shadow-[0_0_6px_rgba(229,37,42,0.8)]" />
          </motion.div>

          {/* Motto: PLAY • COMPETE • RELAX • REPEAT */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.75, ease: 'easeOut' }}
            className="mt-2 flex flex-col items-center"
          >
            <p className="font-bebas font-bold text-neutral-400 uppercase text-[10px] sm:text-xs tracking-[0.28em]">
              PLAY • COMPETE • RELAX • REPEAT
            </p>
            <motion.span
              animate={{ rotate: [0, 90, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="text-[#E5252A] font-black text-xs sm:text-sm mt-0.5 leading-none drop-shadow-[0_0_6px_rgba(229,37,42,0.7)]"
            >
              ✕
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
