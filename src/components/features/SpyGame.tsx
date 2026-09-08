import ReactDOM from 'react-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Props {
  open?: boolean;
  onClose: () => void;
}

const WORDS = [
  'قهوة', 'كراميل', 'شوكولاتة', 'فراولة', 'نوتيلا', 'كابتشينو', 'موكتيل',
  'وافل', 'كريب', 'تيراميسو', 'لاتيه', 'ماتشا', 'سموذي', 'كولد برو',
  'آيس كريم', 'مافن', 'براوني', 'كنافة', 'إسبريسو', 'شيشة',
];

export default function SpyGame({ open = true, onClose }: Props) {
  const [phase, setPhase] = useState<'setup' | 'reveal' | 'guess'>('setup');
  const [players, setPlayers] = useState(4);
  const [current, setCurrent] = useState(0);
  const [spyIdx] = useState(() => Math.floor(Math.random() * 4));
  const [word] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [showCard, setShowCard] = useState(false);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const startGame = () => {
    setPhase('reveal');
    setCurrent(0);
    setShowCard(false);
  };

  const nextPlayer = () => {
    setShowCard(false);
    if (current + 1 >= players) setPhase('guess');
    else setCurrent(c => c + 1);
  };

  const checkGuess = () => {
    setResult(
      guess.trim().toLowerCase() === word.toLowerCase()
        ? '✅ صح! الجاسوس كشف الكلمة'
        : `❌ خطأ! الكلمة كانت: ${word}`
    );
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

            <h3 className="text-center font-bold text-lg mb-4" style={{ color: '#F4C2C8', fontFamily: '"Playfair Display", serif' }}>
              🕵️ لعبة الجاسوس
            </h3>

            {phase === 'setup' && (
              <div className="space-y-4">
                <p className="text-sm text-center" style={{ color: '#a88890', fontFamily: 'Cairo, sans-serif' }}>
                  واحد منكم جاسوس — اكتشفوا مين!
                </p>
                <div className="flex items-center justify-between">
                  <span style={{ color: '#F4C2C8', fontFamily: 'Cairo, sans-serif', fontSize: 14 }}>عدد اللاعبين</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPlayers(p => Math.max(3, p - 1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                      style={{ background: 'rgba(139,26,42,0.2)', color: '#F4C2C8', fontSize: 16 }}
                    >
                      −
                    </button>
                    <span style={{ color: '#f5ece8', fontFamily: '"Playfair Display", serif', fontWeight: 700 }}>{players}</span>
                    <button
                      onClick={() => setPlayers(p => Math.min(8, p + 1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                      style={{ background: 'rgba(139,26,42,0.2)', color: '#F4C2C8', fontSize: 16 }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={startGame}
                  className="w-full py-3 rounded-xl font-bold text-white cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #8B1A2A, #C45C6A)', fontFamily: 'Cairo, sans-serif' }}
                >
                  ابدأ اللعبة 🚀
                </button>
              </div>
            )}

            {phase === 'reveal' && (
              <div className="space-y-4 text-center">
                <p style={{ color: '#F4C2C8', fontFamily: 'Cairo, sans-serif', fontSize: 15 }}>
                  👤 اللاعب رقم {current + 1}
                </p>
                {!showCard ? (
                  <button
                    onClick={() => setShowCard(true)}
                    className="w-full py-4 rounded-2xl font-bold text-white cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #8B1A2A, #C45C6A)', fontFamily: 'Cairo, sans-serif' }}
                  >
                    اضغط لرؤية دورك 👀
                  </button>
                ) : (
                  <>
                    <div className="rounded-2xl p-5" style={{ background: 'rgba(139,26,42,0.15)', border: '1px solid rgba(139,26,42,0.3)' }}>
                      {current === spyIdx % players ? (
                        <div>
                          <p className="text-4xl mb-2">🕵️</p>
                          <p className="font-bold text-lg" style={{ color: '#f87171', fontFamily: 'Cairo, sans-serif' }}>أنت الجاسوس!</p>
                          <p className="text-sm" style={{ color: '#a88890', fontFamily: 'Cairo, sans-serif' }}>اكتشف الكلمة بدون ما يعرفوا</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-2xl mb-1" style={{ color: '#a88890', fontFamily: 'Cairo, sans-serif', fontSize: 12 }}>الكلمة</p>
                          <p className="font-bold text-2xl brand-text" style={{ fontFamily: '"Playfair Display", serif' }}>{word}</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={nextPlayer}
                      className="w-full py-3 rounded-xl font-bold text-white cursor-pointer"
                      style={{ background: 'rgba(139,26,42,0.4)', fontFamily: 'Cairo, sans-serif' }}
                    >
                      {current + 1 >= players ? 'ابدأ النقاش 💬' : 'اللاعب التالي ▶'}
                    </button>
                  </>
                )}
              </div>
            )}

            {phase === 'guess' && (
              <div className="space-y-4 text-center">
                {!result ? (
                  <>
                    <p style={{ color: '#F4C2C8', fontFamily: 'Cairo, sans-serif' }}>من الجاسوس؟ وما الكلمة؟</p>
                    <input
                      value={guess}
                      onChange={e => setGuess(e.target.value)}
                      placeholder="اكتب الكلمة..."
                      className="w-full rounded-xl px-3 py-2.5 text-center outline-none"
                      style={{ background: 'rgba(139,26,42,0.1)', border: '1px solid rgba(139,26,42,0.3)', color: '#f5ece8', fontFamily: 'Cairo, sans-serif' }}
                    />
                    <button
                      onClick={checkGuess}
                      className="w-full py-3 rounded-xl font-bold text-white cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #8B1A2A, #C45C6A)', fontFamily: 'Cairo, sans-serif' }}
                    >
                      تحقق 🔍
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-2xl">{result.startsWith('✅') ? '🎉' : '😅'}</p>
                    <p style={{ color: '#F4C2C8', fontFamily: 'Cairo, sans-serif', fontSize: 15 }}>{result}</p>
                    <button
                      onClick={onClose}
                      className="w-full py-3 rounded-xl font-bold text-white cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #8B1A2A, #C45C6A)', fontFamily: 'Cairo, sans-serif' }}
                    >
                      إنهاء 🌹
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modal, document.body);
}
