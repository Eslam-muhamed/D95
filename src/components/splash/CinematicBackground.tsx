import React from 'react';
import { motion } from 'framer-motion';

interface CinematicBackgroundProps {
  surgeActive: boolean;
}

export default function CinematicBackground({ surgeActive }: CinematicBackgroundProps) {
  // PlayStation & Gaming Glyphs for ambient cyber mood
  const glyphs = ['△', '◯', '✕', '□', '⚡', '☕'];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* 1. Base Deep Void Background */}
      <div className="absolute inset-0 bg-[#050508]" />

      {/* 2. Ambient Crimson Radial Spotlight */}
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(ellipse 65% 50% at 50% 50%, rgba(229, 37, 42, 0.18) 0%, rgba(10, 5, 8, 0.6) 60%, rgba(5, 5, 8, 1) 100%)',
        }}
      />

      {/* 3. Subtle Cyber Grid Texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* 4. Ambient Floating Gaming Glyphs */}
      <div className="absolute inset-0">
        {glyphs.map((glyph, i) => {
          // Deterministic positions to avoid hydration mismatch
          const positions = [
            { top: '18%', left: '15%', delay: 0.2 },
            { top: '22%', right: '18%', delay: 0.5 },
            { top: '72%', left: '20%', delay: 0.3 },
            { top: '68%', right: '16%', delay: 0.6 },
            { top: '40%', left: '10%', delay: 0.4 },
            { top: '45%', right: '12%', delay: 0.7 },
          ];
          const pos = positions[i % positions.length];

          return (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.6, y: 15 }}
              animate={{
                opacity: [0, 0.25, 0.12, 0.28, 0],
                scale: [0.8, 1.05, 0.95, 1],
                y: [15, -15, 5, -20],
              }}
              transition={{
                duration: 4,
                delay: pos.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                ...pos,
              }}
              className="text-white/20 font-mono text-xl sm:text-2xl font-bold drop-shadow-[0_0_8px_rgba(229,37,42,0.4)]"
            >
              {glyph}
            </motion.span>
          );
        })}
      </div>

      {/* 5. Center Power Shockwaves (Triggered on Surge) */}
      {surgeActive && (
        <>
          <motion.div
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 3.2, opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.1, 0.9, 0.2, 1] }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border-2 border-[#E5252A] shadow-[0_0_50px_rgba(229,37,42,0.8)]"
          />
          <motion.div
            initial={{ scale: 0.4, opacity: 0.8 }}
            animate={{ scale: 4.5, opacity: 0 }}
            transition={{ duration: 1.1, delay: 0.08, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-red-400/60 shadow-[0_0_30px_rgba(255,255,255,0.4)]"
          />
          {/* Intense center flash */}
          <motion.div
            initial={{ opacity: 0.8, scale: 0.5 }}
            animate={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-transparent blur-2xl"
          />
        </>
      )}

      {/* 6. Cinematic Vignette Border */}
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.95)]" />
    </div>
  );
}
