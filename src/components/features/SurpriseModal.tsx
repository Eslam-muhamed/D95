import ReactDOM from 'react-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getRecommendation } from '@/lib/recommender';
import type { RecommendationAnswer } from '@/types/recommendation';
import type { MenuItem } from '@/types/menu';
import { useCart } from '@/stores/cartStore';

interface Props {
  open?: boolean;
  onClose: () => void;
}

type Step = 'temperature' | 'mood' | 'flavor' | 'sweetness' | 'result';

const QUESTIONS: { step: Step; label: string; options: { value: string; emoji: string; label: string }[] }[] = [
  {
    step: 'temperature',
    label: 'كيف تحب مشروبك؟',
    options: [
      { value: 'hot', emoji: '☕', label: 'ساخن' },
      { value: 'cold', emoji: '🧊', label: 'بارد' },
      { value: 'any', emoji: '✨', label: 'مفاجئني' },
    ],
  },
  {
    step: 'mood',
    label: 'ما الإحساس الذي تبحث عنه؟',
    options: [
      { value: 'energize', emoji: '⚡', label: 'طاقة' },
      { value: 'relax', emoji: '🌿', label: 'استرخاء' },
      { value: 'indulge', emoji: '🍰', label: 'متعة' },
      { value: 'refresh', emoji: '🌊', label: 'انتعاش' },
    ],
  },
  {
    step: 'flavor',
    label: 'ما طعمك المفضل؟',
    options: [
      { value: 'sweet', emoji: '🍬', label: 'حلو' },
      { value: 'bitter', emoji: '☕', label: 'مر' },
      { value: 'fruity', emoji: '🍓', label: 'فواكه' },
      { value: 'creamy', emoji: '🍦', label: 'كريمي' },
    ],
  },
  {
    step: 'sweetness',
    label: 'مستوى الحلاوة المثالي؟',
    options: [
      { value: 'none', emoji: '🚫', label: 'بدون' },
      { value: 'light', emoji: '✨', label: 'خفيف' },
      { value: 'medium', emoji: '🌟', label: 'متوسط' },
      { value: 'sweet', emoji: '🍯', label: 'حلو' },
    ],
  },
];

export default function SurpriseModal({ open = true, onClose }: Props) {
  const { addItem } = useCart();
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Partial<RecommendationAnswer>>({});
  const [result, setResult] = useState<MenuItem | null>(null);

  const reset = () => {
    setStepIdx(0);
    setAnswers({});
    setResult(null);
  };

  const handleOption = (value: string) => {
    const q = QUESTIONS[stepIdx];
    const newAnswers = { ...answers, [q.step]: value };
    setAnswers(newAnswers);

    if (stepIdx < QUESTIONS.length - 1) {
      setStepIdx(i => i + 1);
    } else {
      const rec = getRecommendation(newAnswers as RecommendationAnswer);
      setResult(rec);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[75] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }} />
          <motion.div
            className="relative w-full max-w-sm rounded-3xl p-6"
            style={{
              background: '#1a080c',
              border: '1px solid rgba(139,26,42,0.4)',
              boxShadow: '0 0 60px rgba(139,26,42,0.25)',
              direction: 'rtl',
            }}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 left-4 flex items-center justify-center rounded-full cursor-pointer"
              style={{ width: 32, height: 32, background: 'rgba(139,26,42,0.2)' }}
            >
              <X size={16} style={{ color: '#F4C2C8' }} />
            </button>

            {!result ? (
              <>
                {/* Progress dots */}
                <div className="flex justify-center gap-1.5 mb-5">
                  {QUESTIONS.map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: i <= stepIdx ? 20 : 8,
                        background: i <= stepIdx ? '#8B1A2A' : 'rgba(139,26,42,0.2)',
                      }}
                    />
                  ))}
                </div>

                <div className="text-center mb-2">
                  <span className="text-4xl">🌹</span>
                </div>
                <h3 className="text-center font-bold text-lg mb-5" style={{ color: '#F4C2C8', fontFamily: 'Cairo, sans-serif' }}>
                  {QUESTIONS[stepIdx].label}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {QUESTIONS[stepIdx].options.map(opt => (
                    <motion.button
                      key={opt.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOption(opt.value)}
                      className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all cursor-pointer"
                      style={{ background: 'rgba(139,26,42,0.12)', border: '1px solid rgba(139,26,42,0.25)' }}
                    >
                      <span className="text-3xl">{opt.emoji}</span>
                      <span className="text-sm font-semibold" style={{ color: '#F4C2C8', fontFamily: 'Cairo, sans-serif' }}>{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  <span className="text-4xl">✨</span>
                </div>
                <p className="text-sm mb-3" style={{ color: '#C45C6A', fontFamily: 'Cairo, sans-serif' }}>اقتراح D95 لك</p>
                <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid rgba(139,26,42,0.3)' }}>
                  <img src={result.image} alt={result.name} className="w-full h-36 object-cover" />
                </div>
                <h3 className="font-bold text-xl mb-1" style={{ color: '#f5ece8', fontFamily: '"Playfair Display", serif' }}>{result.name}</h3>
                <p className="text-sm mb-2" style={{ color: '#a88890', fontFamily: 'Cairo, sans-serif' }}>{result.description}</p>
                <p className="font-bold text-lg mb-4" style={{ color: '#C45C6A', fontFamily: '"Playfair Display", serif' }}>{result.price} ج.م</p>
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      addItem({
                        id: result.id,
                        name: result.name,
                        price: result.price,
                        image: result.image,
                        category: result.category,
                        customization: { quantity: 1 },
                      });
                      handleClose();
                    }}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #8B1A2A, #C45C6A)', fontFamily: 'Cairo, sans-serif' }}
                  >
                    أضف للسلة 🛒
                  </motion.button>
                  <button
                    onClick={reset}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{
                      background: 'rgba(139,26,42,0.12)',
                      color: '#F4C2C8',
                      border: '1px solid rgba(139,26,42,0.25)',
                      fontFamily: 'Cairo, sans-serif',
                    }}
                  >
                    جرب مرة أخرى
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modal, document.body);
}
