import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onXO: () => void;
  onSpy: () => void;
}

export default function GamesButton({ onXO, onSpy }: Props) {
  const [open, setOpen] = useState(false);

  const handle = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: 86, left: 20, zIndex: 36 }}>
      {/* Backdrop to close menu */}
      {open && (
        <div
          className="fixed inset-0"
          style={{ zIndex: -1 }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Game options popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.82, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute flex flex-col gap-2"
            style={{ bottom: 60, left: 0, minWidth: 148 }}
          >
            {/* XO Game */}
            <button
              onClick={() => handle(onXO)}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-white text-sm font-semibold whitespace-nowrap transition-opacity hover:opacity-90 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #3a0610, #8B1A2A)',
                boxShadow: '0 4px 20px rgba(139,26,42,0.55)',
                fontFamily: 'Cairo, sans-serif',
                border: '1px solid rgba(244,194,200,0.22)',
              }}
            >
              <span>❌</span>
              <span>X / O</span>
            </button>

            {/* Spy Game */}
            <button
              onClick={() => handle(onSpy)}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-white text-sm font-semibold whitespace-nowrap transition-opacity hover:opacity-90 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #1a0508, #5a0d18)',
                boxShadow: '0 4px 20px rgba(90,13,24,0.6)',
                fontFamily: 'Cairo, sans-serif',
                border: '1px solid rgba(244,194,200,0.22)',
              }}
            >
              <span>🕵️</span>
              <span>الجاسوس</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main trigger button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileTap={{ scale: 0.92 }}
        aria-label="الألعاب"
        title="العب مع صاحبك"
        className="flex items-center justify-center text-2xl text-white cursor-pointer"
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: open
            ? 'linear-gradient(135deg, #C45C6A, #8B1A2A)'
            : 'linear-gradient(135deg, #4a0810, #8B1A2A)',
          boxShadow: open
            ? '0 4px 28px rgba(196,92,106,0.55)'
            : '0 4px 20px rgba(139,26,42,0.42)',
          border: '1px solid rgba(244,194,200,0.15)',
          transition: 'background 0.25s, box-shadow 0.25s',
        }}
      >
        🎮
      </motion.button>
    </div>
  );
}
