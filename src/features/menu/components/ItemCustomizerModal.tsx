import { createPortal } from 'react-dom';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';
import type { MenuItem } from '@/types/menu';
import type { ItemCustomization } from '@/types/cart';
import { useCart } from '@/features/cart/stores/cartStore';
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
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            style={{ willChange: 'opacity' }}
          />

          <motion.div
            key={item.id}
            className="relative w-full sm:w-[500px] h-[90vh] sm:h-auto sm:max-h-[85vh] bg-white dark:bg-[#120e10] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            style={{
              direction: 'rtl',
              willChange: 'transform',
              transform: 'translateZ(0)',
              contain: 'layout style',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 350,
              mass: 0.8,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Grab handle for mobile */}
            <div className="absolute top-3 inset-x-0 flex justify-center z-20 sm:hidden">
              <div className="w-12 h-1.5 rounded-full bg-black/20 dark:bg-white/30 backdrop-blur-md" />
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 left-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/50 text-neutral-800 dark:text-white backdrop-blur-md hover:bg-white dark:hover:bg-black/70 shadow-sm transition-all cursor-pointer active:scale-95 border border-black/5 dark:border-white/10"
              aria-label="إغلاق النافذة"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide pb-32 sm:pb-28">
              {/* Hero Image */}
              {item.image ? (
                <div className="relative w-full h-[35vh] sm:h-72 shrink-0 bg-neutral-100 dark:bg-black/20">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
                </div>
              ) : (
                <div className="pt-12 pb-4" />
              )}

              {/* Title & Description & Price */}
              <div className="px-5 pt-6 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-bold text-2xl sm:text-3xl text-neutral-900 dark:text-white font-body leading-tight">
                    {item.name}
                  </h3>
                  <div className="flex flex-col items-end shrink-0 mt-1">
                    <p className="font-sans font-black text-2xl text-red-600 dark:text-red-500 tracking-tight" dir="ltr">
                      {item.price}
                    </p>
                    <span className="text-sm font-body font-medium text-neutral-500 dark:text-neutral-400 -mt-1">
                      ج.م
                    </span>
                  </div>
                </div>
                
                {item.description && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-3 leading-relaxed font-body">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="h-2 w-full bg-neutral-100 dark:bg-black/30" />

              {/* Notes Section */}
              <div className="px-5 py-6">
                <div className="flex items-center justify-between mb-3">
                  <label
                    htmlFor="custom-notes"
                    className="text-base font-bold flex items-center gap-2 text-neutral-900 dark:text-white font-body"
                  >
                    <span>ملاحظات إضافية</span>
                  </label>
                  <span className="text-xs font-medium text-neutral-400 bg-neutral-100 dark:bg-white/5 px-2 py-1 rounded-md font-body">
                    اختياري
                  </span>
                </div>
                <textarea
                  id="custom-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="مثلاً: سكر خفيف، بدون ثلج..."
                  rows={3}
                  className="w-full rounded-2xl p-4 text-sm resize-none outline-none transition-all leading-relaxed bg-neutral-50 dark:bg-[#1a1416] border border-neutral-200 dark:border-white/10 focus:border-red-500 dark:focus:border-red-500 focus:ring-4 focus:ring-red-500/10 text-neutral-900 dark:text-white font-body placeholder:text-neutral-400"
                  style={{ caretColor: '#e11d48' }}
                />
              </div>
            </div>

            {/* Sticky Bottom Actions */}
            <div className="absolute bottom-0 inset-x-0 p-5 bg-white/90 dark:bg-[#120e10]/90 backdrop-blur-lg border-t border-neutral-200/60 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
              <div className="flex items-center gap-4 max-w-sm mx-auto sm:max-w-none">
                {/* Quantity Control */}
                <div className="flex items-center justify-between bg-neutral-100 dark:bg-white/5 rounded-2xl p-1.5 border border-neutral-200/80 dark:border-white/10 shrink-0 w-32">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 text-neutral-700 dark:text-neutral-200 shadow-sm transition-transform active:scale-90 cursor-pointer"
                    aria-label="تقليل الكمية"
                  >
                    <Minus size={18} strokeWidth={2.5} />
                  </button>
                  <span className="font-sans font-black text-lg text-neutral-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 text-neutral-700 dark:text-neutral-200 shadow-sm transition-transform active:scale-90 cursor-pointer"
                    aria-label="زيادة الكمية"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </button>
                </div>
                
                {/* Add to Cart Button */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAdd}
                  className="flex-1 flex items-center justify-between px-5 h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-base cursor-pointer shadow-lg shadow-red-600/20 transition-colors font-body overflow-hidden relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <span>إضافة للسلة</span>
                  <div className="flex items-center gap-1 bg-black/20 px-3 py-1.5 rounded-xl">
                    <span className="font-sans font-black" dir="ltr">{totalPrice}</span>
                    <span className="text-xs font-normal">ج.م</span>
                  </div>
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

