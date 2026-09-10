import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
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

  // Always reset quantity and notes cleanly whenever a new item is selected or opened
  useEffect(() => {
    setQuantity(1);
    setNotes('');
  }, [item?.id]);

  const handleClose = () => {
    setNotes('');
    setQuantity(1);
    onClose();
  };

  const handleAdd = () => {
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
  };

  const unitPrice = item ? item.price : 0;
  const totalPrice = unitPrice * quantity;

  const modal = (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
          <motion.div
            className="relative w-full rounded-t-3xl max-h-[88vh] overflow-y-auto scrollbar-hide max-w-lg mx-auto"
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
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(139,26,42,0.4)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <div className="flex items-center gap-3">
                <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                <div>
                  <h3 className="font-bold text-base" style={{ color: 'var(--c-text-1)', fontFamily: 'Cairo, sans-serif' }}>
                    {item.name}
                  </h3>
                  <p style={{ color: 'var(--c-brand-l)', fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: 16 }}>
                    {item.price} ج.م
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="flex items-center justify-center rounded-full cursor-pointer transition-transform active:scale-90"
                style={{ width: 36, height: 36, background: 'rgba(139,26,42,0.15)' }}
                aria-label="إغلاق"
              >
                <X size={18} style={{ color: 'var(--c-on-card)' }} />
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* Notes only */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>
                    <span>📝</span>
                    <span>ملاحظات خاصة</span>
                  </p>
                  <span className="text-[11px] text-neutral-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    اختياري
                  </span>
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="اكتب أي طلب خاص (مثلاً: سكر خفيف، بدون ثلج، حليب نباتي...)"
                  rows={3}
                  className="w-full rounded-xl p-3 text-sm resize-none outline-none transition-colors leading-relaxed"
                  style={{
                    background: 'rgba(139,26,42,0.08)',
                    border: '1px solid rgba(139,26,42,0.22)',
                    color: 'var(--c-text-1)',
                    fontFamily: 'Cairo, sans-serif',
                    caretColor: '#C45C6A',
                  }}
                />
              </div>

              {/* Quantity + Add to Cart Button */}
              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--c-border)' }}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="flex items-center justify-center rounded-full cursor-pointer active:scale-90 transition-transform"
                    style={{ width: 36, height: 36, background: 'rgba(139,26,42,0.2)', border: '1px solid rgba(139,26,42,0.3)' }}
                    aria-label="تقليل الكمية"
                  >
                    <Minus size={16} style={{ color: 'var(--c-on-card)' }} />
                  </button>
                  <span className="font-bold text-lg w-6 text-center" style={{ color: 'var(--c-text-1)', fontFamily: '"Playfair Display", serif' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="flex items-center justify-center rounded-full cursor-pointer active:scale-90 transition-transform"
                    style={{ width: 36, height: 36, background: 'rgba(139,26,42,0.2)', border: '1px solid rgba(139,26,42,0.3)' }}
                    aria-label="زيادة الكمية"
                  >
                    <Plus size={16} style={{ color: 'var(--c-on-card)' }} />
                  </button>
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleAdd}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm cursor-pointer shadow-md shadow-red-900/30"
                  style={{
                    background: 'linear-gradient(135deg, #8B1A2A, #C45C6A)',
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

  return createPortal(modal, document.body);
}
