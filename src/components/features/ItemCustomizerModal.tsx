import ReactDOM from 'react-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';
import type { MenuItem } from '@/types/menu';
import type { ItemCustomization, SugarLevel, IceLevel } from '@/types/cart';
import { categoryOptions, sugarLevels } from '@/constants/itemCustomizations';
import { useCart } from '@/stores/cartStore';
import { playCartChime } from '@/lib/sound';

interface Props {
  item: MenuItem | null;
  onClose: () => void;
}

const ICE_OPTIONS: { value: IceLevel; label: string }[] = [
  { value: 'none', label: 'بدون ثلج' },
  { value: 'little', label: 'ثلج خفيف' },
  { value: 'normal', label: 'ثلج عادي' },
  { value: 'extra', label: 'ثلج زيادة' },
];

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer"
      style={{
        background: active ? 'linear-gradient(135deg, #8B1A2A, #C45C6A)' : 'rgba(139,26,42,0.1)',
        color: active ? '#fff' : 'var(--c-text-3)',
        border: active ? '1px solid rgba(244,194,200,0.3)' : '1px solid rgba(139,26,42,0.2)',
        fontFamily: 'Cairo, sans-serif',
        minHeight: 36,
      }}
    >
      {label}
    </button>
  );
}

function Toggle({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all w-full cursor-pointer"
      style={{
        background: active ? 'rgba(139,26,42,0.2)' : 'rgba(139,26,42,0.07)',
        color: active ? 'var(--c-on-card)' : 'var(--c-text-3)',
        border: active ? '1px solid rgba(139,26,42,0.45)' : '1px solid rgba(139,26,42,0.15)',
        fontFamily: 'Cairo, sans-serif',
        minHeight: 44,
      }}
    >
      <div
        className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ background: active ? '#8B1A2A' : 'rgba(139,26,42,0.2)' }}
      >
        {active && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
      {label}
    </button>
  );
}

export default function ItemCustomizerModal({ item, onClose }: Props) {
  const { addItem } = useCart();
  const opts = item ? categoryOptions[item.category] : null;

  const [quantity, setQuantity] = useState(1);
  const [sugar, setSugar] = useState<SugarLevel | undefined>(undefined);
  const [ice, setIce] = useState<IceLevel>('normal');
  const [extraShot, setExtraShot] = useState(false);
  const [cream, setCream] = useState(false);
  const [honey, setHoney] = useState(false);
  const [toppings, setToppings] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const toggleTopping = (t: string) =>
    setToppings(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleAdd = () => {
    if (!item) return;
    const customization: ItemCustomization = { quantity, sugar, ice, extraShot, cream, honey, toppings, notes };
    addItem({ id: item.id, name: item.name, price: item.price, image: item.image, category: item.category, customization });
    playCartChime();
    onClose();
  };

  const totalPrice = item ? item.price * quantity + (extraShot ? 15 : 0) : 0;

  const modal = (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
          <motion.div
            className="relative w-full rounded-t-3xl max-h-[88vh] overflow-y-auto scrollbar-hide"
            style={{
              background: 'var(--c-card)',
              border: '1px solid rgba(139,26,42,0.3)',
              boxShadow: '0 0 80px rgba(139,26,42,0.18), 0 -20px 60px rgba(0,0,0,0.5)',
              direction: 'rtl',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(139,26,42,0.4)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <div className="flex items-center gap-3">
                <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover" />
                <div>
                  <h3 className="font-bold text-base" style={{ color: 'var(--c-text-1)', fontFamily: 'Cairo, sans-serif' }}>
                    {item.name}
                  </h3>
                  <p style={{ color: 'var(--c-brand-l)', fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: 15 }}>
                    {item.price} ج.م
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center rounded-full cursor-pointer"
                style={{ width: 36, height: 36, background: 'rgba(139,26,42,0.15)' }}
              >
                <X size={18} style={{ color: 'var(--c-on-card)' }} />
              </button>
            </div>

            <div className="px-4 py-4 space-y-5">
              {/* Sugar */}
              {opts?.hasSugar && (
                <div>
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>🍬 السكر</p>
                  <div className="flex flex-wrap gap-2">
                    {sugarLevels.map(sl => (
                      <Chip key={String(sl.value)} active={sugar === sl.value} label={sl.label} onClick={() => setSugar(sl.value as SugarLevel)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Ice */}
              {opts?.hasIce && (
                <div>
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>🧊 الثلج</p>
                  <div className="flex flex-wrap gap-2">
                    {ICE_OPTIONS.map(o => (
                      <Chip key={o.value} active={ice === o.value} label={o.label} onClick={() => setIce(o.value)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-2">
                {opts?.hasExtraShot && (
                  <Toggle active={extraShot} label="☕ شوت إسبريسو إضافي (+15 ج.م)" onClick={() => setExtraShot(p => !p)} />
                )}
                {opts?.hasCream && (
                  <Toggle active={cream} label="🍦 إضافة كريمة" onClick={() => setCream(p => !p)} />
                )}
                {opts?.hasHoney && (
                  <Toggle active={honey} label="🍯 إضافة عسل" onClick={() => setHoney(p => !p)} />
                )}
              </div>

              {/* Toppings */}
              {opts?.toppingOptions && opts.toppingOptions.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>✨ إضافات</p>
                  <div className="flex flex-wrap gap-2">
                    {opts.toppingOptions.map(t => (
                      <Chip key={t} active={toppings.includes(t)} label={t} onClick={() => toggleTopping(t)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>📝 ملاحظات خاصة</p>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="أي طلبات خاصة..."
                  rows={2}
                  className="w-full rounded-xl px-3 py-2 text-sm resize-none outline-none"
                  style={{
                    background: 'rgba(139,26,42,0.1)',
                    border: '1px solid rgba(139,26,42,0.25)',
                    color: 'var(--c-text-1)',
                    fontFamily: 'Cairo, sans-serif',
                    caretColor: '#C45C6A',
                  }}
                />
              </div>

              {/* Quantity + Add */}
              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--c-border)' }}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="flex items-center justify-center rounded-full cursor-pointer"
                    style={{ width: 36, height: 36, background: 'rgba(139,26,42,0.2)', border: '1px solid rgba(139,26,42,0.3)' }}
                  >
                    <Minus size={16} style={{ color: 'var(--c-on-card)' }} />
                  </button>
                  <span className="font-bold text-lg w-6 text-center" style={{ color: 'var(--c-text-1)', fontFamily: '"Playfair Display", serif' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="flex items-center justify-center rounded-full cursor-pointer"
                    style={{ width: 36, height: 36, background: 'rgba(139,26,42,0.2)', border: '1px solid rgba(139,26,42,0.3)' }}
                  >
                    <Plus size={16} style={{ color: 'var(--c-on-card)' }} />
                  </button>
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleAdd}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #8B1A2A, #C45C6A)',
                    boxShadow: '0 4px 20px rgba(139,26,42,0.45)',
                    fontFamily: 'Cairo, sans-serif',
                    minHeight: 48,
                  }}
                >
                  أضف للسلة — {totalPrice} ج.م
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modal, document.body);
}
