import { createPortal } from 'react-dom';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';
import type { MenuItem } from '@/types/menu';
import type { ItemCustomization } from '@/types/cart';
import { useCart } from '@/stores/cartStore';
import { playCartChime } from '@/lib/sound';

interface Props {
  item: MenuItem | null;
  onClose: () => void;
}

export default function ItemCustomizerModal({ item, onClose }: Props) {
  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Lock body scroll while modal is active to prevent scroll fighting & frame stutter
  useEffect(() => {
    if (item) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [item]);

  // Cleanly reset quantity and notes whenever item changes or modal opens
  useEffect(() => {
    if (item) {
      setQuantity(1);
      setNotes('');
    }
  }, [item]);

  const handleClose = useCallback(() => {
    setNotes('');
    setQuantity(1);
    onClose();
  }, [onClose]);

  const handleAdd = useCallback(() => {
    if (!item) return;
    const trimmedNotes = notes.trim();
    const customization: ItemCustomization = {
      quantity,
      ...(trimmedNotes ? { notes: trimmedNotes } : {}),
    };

    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category,
      customization,
    });

    playCartChime();
    setNotes('');
    setQuantity(1);
    onClose();
  }, [item, notes, quantity, addItem, onClose]);

  const unitPrice = item ? item.price : 0;
  const totalPrice = unitPrice * quantity;

  return createPortal(
    <AnimatePresence>
      {item && (
        <motion.div
          key="item-customizer-portal"
          className="fixed inset-0 z-[80] flex items-end justify-center pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={handleClose}
        >
          {/* Lightweight high-contrast backdrop without heavy blur for 60fps/120fps smoothness */}
          <div
            className="absolute inset-0 bg-black/65"
            style={{ willChange: 'opacity' }}
          />

          <motion.div
            key={item.id}
            className="relative w-full rounded-t-3xl max-h-[85vh] overflow-y-auto scrollbar-hide max-w-lg mx-auto transform-gpu"
            style={{
              background: 'var(--c-card)',
              border: '1px solid rgba(139,26,42,0.35)',
              boxShadow: '0 -8px 30px rgba(0,0,0,0.4)',
              direction: 'rtl',
              willChange: 'transform',
              transform: 'translateZ(0)',
              contain: 'layout style',
              touchAction: 'pan-y',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 350,
              mass: 0.6,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Grab handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-300/40 dark:bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-neutral-200/80 dark:border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-14 rounded-xl object-cover shadow-sm bg-neutral-100 dark:bg-black/30 border border-neutral-200 dark:border-white/10"
                />
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white font-body">
                    {item.name}
                  </h3>
                  <p className="font-sans font-black text-red-600 dark:text-red-400 text-base" dir="ltr">
                    {item.price} <span className="text-xs font-body font-normal text-neutral-500">ج.م</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer active:scale-95"
                aria-label="إغلاق النافذة"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-4 space-y-4">
              {/* Notes only */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="custom-notes"
                    className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200 font-body"
                  >
                    <span>📝</span>
                    <span>ملاحظات خاصة بالطلب</span>
                  </label>
                  <span className="text-[11px] text-neutral-400 font-body">
                    اختياري
                  </span>
                </div>
                <textarea
                  id="custom-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="اكتب أي طلب خاص (مثلاً: سكر خفيف، بدون ثلج، حليب نباتي...)"
                  rows={3}
                  className="w-full rounded-xl p-3 text-sm resize-none outline-none transition-colors leading-relaxed bg-neutral-50 dark:bg-[#151012] border border-neutral-200 dark:border-white/10 focus:border-red-500 dark:focus:border-red-500 text-neutral-900 dark:text-white font-body"
                  style={{ caretColor: '#e11d48' }}
                />
              </div>

              {/* Quantity + Add to Cart Button */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-white transition-all active:scale-95 cursor-pointer border border-neutral-200 dark:border-white/10"
                    aria-label="تقليل الكمية"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="font-sans font-bold text-lg w-6 text-center text-neutral-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-white transition-all active:scale-95 cursor-pointer border border-neutral-200 dark:border-white/10"
                    aria-label="زيادة الكمية"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAdd}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm cursor-pointer shadow-md shadow-red-600/30 transition-all font-body"
                  style={{ minHeight: 44 }}
                >
                  أضف للسلة — {totalPrice} ج.م
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
