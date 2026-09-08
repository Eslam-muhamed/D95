import ReactDOM from 'react-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Props {
  open?: boolean;
  onClose: () => void;
}

type Cell = 'X' | 'O' | null;

const WINS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function checkWinner(b: Cell[]): Cell {
  for (const [a, c, d] of WINS) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return null;
}

export default function XOGame({ open = true, onClose }: Props) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const winner = checkWinner(board);
  const isDraw = !winner && board.every(Boolean);

  const click = (i: number) => {
    if (board[i] || winner) return;
    const nb = [...board];
    nb[i] = isX ? 'X' : 'O';
    setBoard(nb);
    setIsX(p => !p);
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setIsX(true);
  };

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }} />
          <motion.div
            className="relative w-full max-w-xs rounded-3xl p-6"
            style={{ background: '#1a080c', border: '1px solid rgba(139,26,42,0.4)', direction: 'rtl' }}
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 left-4 flex items-center justify-center rounded-full cursor-pointer"
              style={{ width: 32, height: 32, background: 'rgba(139,26,42,0.2)' }}
            >
              <X size={16} style={{ color: '#F4C2C8' }} />
            </button>

            <h3 className="text-center font-bold text-lg mb-1" style={{ color: '#F4C2C8', fontFamily: '"Playfair Display", serif' }}>
              ❌ X / O ⭕
            </h3>
            <p className="text-center text-sm mb-4" style={{ color: '#a88890', fontFamily: 'Cairo, sans-serif' }}>
              {winner ? `🏆 الفائز: ${winner}` : isDraw ? '🤝 تعادل!' : `دور: ${isX ? 'X ❌' : 'O ⭕'}`}
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {board.map((cell, i) => (
                <motion.button
                  key={i}
                  onClick={() => click(i)}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center justify-center rounded-2xl cursor-pointer"
                  style={{
                    height: 72,
                    background: cell ? 'rgba(139,26,42,0.25)' : 'rgba(139,26,42,0.1)',
                    border: '1px solid rgba(139,26,42,0.3)',
                    fontSize: 28,
                  }}
                >
                  {cell === 'X' && <span style={{ color: '#C45C6A' }}>❌</span>}
                  {cell === 'O' && <span style={{ color: '#F4C2C8' }}>⭕</span>}
                </motion.button>
              ))}
            </div>

            <button
              onClick={reset}
              className="w-full py-3 rounded-xl font-semibold text-sm cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #8B1A2A, #C45C6A)', color: '#fff', fontFamily: 'Cairo, sans-serif' }}
            >
              إعادة اللعبة 🔄
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modal, document.body);
}
