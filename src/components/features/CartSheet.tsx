import ReactDOM from 'react-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { useCart } from '@/stores/cartStore';

const CAFE_NAME = 'D95 Gaming & Café';
const WHATSAPP_PHONE = '201000000000';

interface Props {
  open?: boolean;
  onClose?: () => void;
}

type PaymentMethod = 'wallet' | 'instapay';

const WALLET_NUMBER = '01000000000';
const INSTAPAY_NUMBER = '01000000000';

const PAYMENT_OPTIONS: { value: PaymentMethod; emoji: string; label: string; fullLabel: string; account: string; accountLabel: string }[] = [
  { value: 'wallet', emoji: '📱', label: 'محفظة إلكترونية', fullLabel: '📱 محفظة إلكترونية (فودافون كاش)', account: WALLET_NUMBER, accountLabel: 'رقم المحفظة' },
  { value: 'instapay', emoji: '⚡', label: 'إنستاباي', fullLabel: '⚡ إنستاباي', account: INSTAPAY_NUMBER, accountLabel: 'معرف إنستاباي' },
];

function formatCustomization(c: import('@/types/cart').ItemCustomization): string {
  const parts: string[] = [];
  if (c.sugar !== undefined) {
    const labels = ['بدون سكر', 'معلقة', 'معلقتين', '3 معالق', '4 معالق', '5 معالق'];
    parts.push(labels[c.sugar] ?? '');
  }
  if (c.ice && c.ice !== 'normal') {
    const iceLbl = { none: 'بدون ثلج', little: 'ثلج خفيف', extra: 'ثلج زيادة' };
    parts.push(iceLbl[c.ice as keyof typeof iceLbl] ?? '');
  }
  if (c.extraShot) parts.push('شوت إضافي');
  if (c.cream) parts.push('كريمة');
  if (c.honey) parts.push('عسل');
  if (c.toppings?.length) parts.push(...c.toppings);
  if (c.notes) parts.push(`📝 ${c.notes}`);
  return parts.join(' · ');
}

export default function CartSheet({ open: propOpen, onClose: propOnClose }: Props) {
  const { items, totalItems, totalPrice, removeItem, updateQty, clearCart, isOpen, closeCart } = useCart();

  const isCartOpen = propOpen !== undefined ? propOpen : isOpen;
  const handleClose = propOnClose !== undefined ? propOnClose : closeCart;

  const [showWaiter, setShowWaiter] = useState(false);
  const [showSplitter, setShowSplitter] = useState(false);
  const [orderType, setOrderType] = useState<'dine' | 'delivery'>('dine');
  const [tableNo, setTableNo] = useState('');
  const [delivName, setDelivName] = useState('');
  const [delivPhone, setDelivPhone] = useState('');
  const [delivAddr, setDelivAddr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [people, setPeople] = useState(2);
  const [assignments, setAssignments] = useState<Record<string, number>>({});

  const assignItem = (cartId: string, person: number) =>
    setAssignments(prev => ({ ...prev, [cartId]: person }));

  const personTotals = Array.from({ length: people }, (_, pi) => {
    const personItems = items.filter(i => assignments[i.cartId] === pi + 1);
    return personItems.reduce((sum, i) => sum + i.price * i.customization.quantity, 0);
  });

  const unassigned = items.filter(i => !assignments[i.cartId]);

  const buildWhatsAppMsg = () => {
    const payFull = PAYMENT_OPTIONS.find(p => p.value === paymentMethod)?.fullLabel ?? '';
    const itemLines = items
      .map(i => {
        const custom = formatCustomization(i.customization);
        return `▪️ ${i.name} × ${i.customization.quantity} = ${i.price * i.customization.quantity} ج.م${custom ? `\n   (${custom})` : ''}`;
      })
      .join('\n');

    if (orderType === 'dine') {
      const header = `🪑 --- طلبية داخل الصالة ---\n🎮 ${CAFE_NAME}\n🪑 رقم الطاولة / الغرفة: ${tableNo || 'غير محدد'}\n\n`;
      return encodeURIComponent(`${header}${itemLines}\n\n💰 الاجمالي: ${totalPrice} ج.م`);
    } else {
      const header =
        `🛵 --- طلب توصيل خارجي ---\n🎮 ${CAFE_NAME}\n` +
        `👤 الاسم: ${delivName}\n📱 الموبايل: ${delivPhone}\n📍 العنوان: ${delivAddr}\n💳 طريقة الدفع: ${payFull}\n\n`;
      return encodeURIComponent(`${header}${itemLines}\n\n💰 الاجمالي: ${totalPrice} ج.م`);
    }
  };

  const sendOrder = () => {
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${buildWhatsAppMsg()}`, '_blank');
  };

  const inputStyle = {
    background: 'rgba(139,26,42,0.1)',
    border: '1px solid rgba(139,26,42,0.25)',
    color: 'var(--c-text-1)',
    fontFamily: 'Cairo, sans-serif',
  } as const;

  /* ─── Main cart sheet ─── */
  const sheet = (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }} />
          <motion.div
            className="relative w-full rounded-t-3xl max-h-[92vh] overflow-y-auto scrollbar-hide max-w-lg mx-auto"
            style={{
              background: 'var(--c-card)',
              border: '1px solid rgba(139,26,42,0.3)',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
              direction: 'rtl',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(139,26,42,0.4)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <h2 className="font-bold text-lg" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>
                🛒 سلة الطلبات ({totalItems})
              </h2>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                    style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', fontFamily: 'Cairo, sans-serif' }}
                  >
                    مسح الكل
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center rounded-full cursor-pointer"
                  style={{ width: 36, height: 36, background: 'rgba(139,26,42,0.15)' }}
                >
                  <X size={18} style={{ color: 'var(--c-on-card)' }} />
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-5xl">🎮</span>
                <p style={{ color: 'var(--c-text-4)', fontFamily: 'Cairo, sans-serif' }}>السلة فارغة</p>
              </div>
            ) : (
              <div className="px-4 py-4 space-y-3">
                {/* Items */}
                {items.map(item => {
                  const custom = formatCustomization(item.customization);
                  return (
                    <div
                      key={item.cartId}
                      className="flex items-center gap-3 rounded-xl p-3"
                      style={{ background: 'rgba(139,26,42,0.08)', border: '1px solid var(--c-border)' }}
                    >
                      <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--c-text-1)', fontFamily: 'Cairo, sans-serif' }}>
                          {item.name}
                        </p>
                        {custom && (
                          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--c-text-3)', fontFamily: 'Cairo, sans-serif' }}>
                            {custom}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQty(item.cartId, item.customization.quantity - 1)}
                              className="flex items-center justify-center rounded-full cursor-pointer"
                              style={{ width: 28, height: 28, background: 'rgba(139,26,42,0.2)' }}
                            >
                              <Minus size={12} style={{ color: 'var(--c-on-card)' }} />
                            </button>
                            <span className="w-5 text-center text-sm font-bold" style={{ color: 'var(--c-text-1)', fontFamily: '"Playfair Display", serif' }}>
                              {item.customization.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.cartId, item.customization.quantity + 1)}
                              className="flex items-center justify-center rounded-full cursor-pointer"
                              style={{ width: 28, height: 28, background: 'rgba(139,26,42,0.2)' }}
                            >
                              <Plus size={12} style={{ color: 'var(--c-on-card)' }} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm" style={{ color: 'var(--c-brand-l)', fontFamily: '"Playfair Display", serif' }}>
                              {item.price * item.customization.quantity} ج.م
                            </span>
                            <button
                              onClick={() => removeItem(item.cartId)}
                              className="flex items-center justify-center rounded-full cursor-pointer"
                              style={{ width: 28, height: 28, background: 'rgba(248,113,113,0.1)' }}
                            >
                              <Trash2 size={13} style={{ color: '#f87171' }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Bill Splitter toggle */}
                <button
                  onClick={() => setShowSplitter(p => !p)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer"
                  style={{ background: 'rgba(139,26,42,0.1)', border: '1px solid rgba(139,26,42,0.2)' }}
                >
                  <span className="text-sm font-semibold" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>
                    💳 تقسيم الحساب بين الشلة
                  </span>
                  {showSplitter
                    ? <ChevronUp size={16} style={{ color: 'var(--c-brand-l)' }} />
                    : <ChevronDown size={16} style={{ color: 'var(--c-brand-l)' }} />}
                </button>

                {showSplitter && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden">
                    <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(139,26,42,0.07)', border: '1px solid rgba(139,26,42,0.15)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>عدد الأشخاص</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setPeople(p => Math.max(2, p - 1))} className="flex items-center justify-center rounded-full cursor-pointer" style={{ width: 28, height: 28, background: 'rgba(139,26,42,0.2)' }}>
                            <Minus size={12} style={{ color: 'var(--c-on-card)' }} />
                          </button>
                          <span className="font-bold" style={{ color: 'var(--c-text-1)', fontFamily: '"Playfair Display", serif' }}>{people}</span>
                          <button onClick={() => setPeople(p => Math.min(10, p + 1))} className="flex items-center justify-center rounded-full cursor-pointer" style={{ width: 28, height: 28, background: 'rgba(139,26,42,0.2)' }}>
                            <Plus size={12} style={{ color: 'var(--c-on-card)' }} />
                          </button>
                        </div>
                      </div>
                      {items.map(item => (
                        <div key={item.cartId} className="space-y-1">
                          <p className="text-xs" style={{ color: 'var(--c-text-3)', fontFamily: 'Cairo, sans-serif' }}>{item.name}</p>
                          <div className="flex flex-wrap gap-1">
                            {Array.from({ length: people }, (_, pi) => (
                              <button
                                key={pi}
                                onClick={() => assignItem(item.cartId, pi + 1)}
                                className="w-8 h-8 rounded-full text-xs font-bold transition-all cursor-pointer"
                                style={{
                                  background: assignments[item.cartId] === pi + 1 ? '#8B1A2A' : 'rgba(139,26,42,0.15)',
                                  color: assignments[item.cartId] === pi + 1 ? '#fff' : 'var(--c-text-3)',
                                  border: '1px solid rgba(139,26,42,0.2)',
                                }}
                              >
                                {pi + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      {personTotals.map((t, pi) => (
                        <div key={pi} className="flex justify-between items-center">
                          <span className="text-sm" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>الشخص {pi + 1}</span>
                          <span className="font-bold" style={{ color: 'var(--c-brand-l)', fontFamily: '"Playfair Display", serif' }}>{t} ج.م</span>
                        </div>
                      ))}
                      {unassigned.length > 0 && (
                        <p className="text-xs" style={{ color: '#f87171', fontFamily: 'Cairo, sans-serif' }}>
                          ⚠️ {unassigned.length} عنصر غير مُسنَد
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center px-2 py-3" style={{ borderTop: '1px solid var(--c-border)' }}>
                  <span className="font-bold text-base" style={{ color: 'var(--c-text-1)', fontFamily: 'Cairo, sans-serif' }}>الإجمالي</span>
                  <span className="font-bold text-xl" style={{ color: 'var(--c-brand-l)', fontFamily: '"Playfair Display", serif' }}>{totalPrice} ج.م</span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowWaiter(true)}
                  className="w-full py-4 rounded-2xl text-white font-bold text-base cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #8B1A2A, #C45C6A)',
                    boxShadow: '0 4px 24px rgba(139,26,42,0.45)',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                >
                  إرسال الطلب 🎮
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  /* ─── Waiter / order confirmation view ─── */
  const waiterView = (
    <AnimatePresence>
      {showWaiter && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowWaiter(false)}
          />
          <motion.div
            className="relative w-full rounded-t-3xl max-h-[90vh] overflow-y-auto scrollbar-hide max-w-lg mx-auto"
            style={{
              background: 'var(--c-card-alt)',
              border: '1px solid rgba(139,26,42,0.4)',
              direction: 'rtl',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(139,26,42,0.4)' }} />
            </div>

            <div className="px-4 py-3 text-center" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <h2 className="font-bold text-lg" style={{ color: 'var(--c-on-card)', fontFamily: '"Playfair Display", serif' }}>
                ✦ كشف الطلبات ✦
              </h2>
            </div>

            <div className="px-4 py-5 space-y-4">
              {/* Order type toggle */}
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>نوع الطلب</p>
                <div className="flex gap-2">
                  {(['dine', 'delivery'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setOrderType(type)}
                      className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer"
                      style={{
                        background: orderType === type ? 'linear-gradient(135deg, #8B1A2A, #C45C6A)' : 'rgba(139,26,42,0.1)',
                        color: orderType === type ? '#fff' : 'var(--c-text-3)',
                        border: orderType === type ? 'none' : '1px solid rgba(139,26,42,0.2)',
                        fontFamily: 'Cairo, sans-serif',
                        minHeight: 48,
                      }}
                    >
                      {type === 'dine' ? '🪑 داخل الصالة' : '🛵 توصيل خارجي'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dine-in */}
              {orderType === 'dine' && (
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>🪑 رقم الطاولة أو الغرفة</p>
                  <input
                    value={tableNo}
                    onChange={e => setTableNo(e.target.value)}
                    placeholder="مثلاً: طاولة 5 أو غرفة VIP 2"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ ...inputStyle }}
                  />
                </div>
              )}

              {/* Delivery */}
              {orderType === 'delivery' && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm mb-1" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>👤 الاسم</p>
                    <input value={delivName} onChange={e => setDelivName(e.target.value)} placeholder="اسمك الكريم"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ ...inputStyle }} />
                  </div>
                  <div>
                    <p className="text-sm mb-1" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>📱 الموبايل</p>
                    <input value={delivPhone} onChange={e => setDelivPhone(e.target.value)} placeholder="01xxxxxxxxx" type="tel"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ ...inputStyle }} />
                  </div>
                  <div>
                    <p className="text-sm mb-1" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>📍 العنوان</p>
                    <textarea value={delivAddr} onChange={e => setDelivAddr(e.target.value)} placeholder="عنوان التوصيل بالتفصيل" rows={2}
                      className="w-full rounded-xl px-3 py-2 text-sm resize-none outline-none"
                      style={{ ...inputStyle, caretColor: '#C45C6A' }} />
                  </div>

                  {/* Payment method */}
                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>💳 طريقة الدفع</p>
                    <div className="flex gap-2 mb-3">
                      {PAYMENT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setPaymentMethod(opt.value)}
                          className="flex-1 flex flex-col items-center justify-center py-3 rounded-xl text-xs font-semibold transition-all gap-1 cursor-pointer"
                          style={{
                            background: paymentMethod === opt.value
                              ? 'linear-gradient(135deg, #8B1A2A, #C45C6A)'
                              : 'rgba(139,26,42,0.1)',
                            color: paymentMethod === opt.value ? '#fff' : 'var(--c-text-3)',
                            border: paymentMethod === opt.value
                              ? '1px solid rgba(244,194,200,0.3)'
                              : '1px solid rgba(139,26,42,0.2)',
                            fontFamily: 'Cairo, sans-serif',
                            minHeight: 56,
                          }}
                        >
                          <span style={{ fontSize: 20 }}>{opt.emoji}</span>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Account number display */}
                    {(() => {
                      const selected = PAYMENT_OPTIONS.find(p => p.value === paymentMethod)!;
                      return (
                        <div
                          className="rounded-xl p-3 space-y-2"
                          style={{ background: 'rgba(139,26,42,0.12)', border: '1px solid rgba(139,26,42,0.28)' }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs" style={{ color: 'var(--c-text-3)', fontFamily: 'Cairo, sans-serif' }}>
                              {selected.accountLabel}
                            </span>
                            <span
                              className="font-bold text-sm tracking-widest"
                              style={{ color: 'var(--c-brand-l)', fontFamily: '"Playfair Display", serif', direction: 'ltr' }}
                            >
                              {selected.account}
                            </span>
                          </div>
                          <div
                            className="flex items-start gap-2 pt-2"
                            style={{ borderTop: '1px solid rgba(139,26,42,0.2)' }}
                          >
                            <span style={{ fontSize: 15, flexShrink: 0 }}>📸</span>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-3)', fontFamily: 'Cairo, sans-serif' }}>
                              بعد إتمام التحويل، أرسل صورة الإيصال عبر واتساب مع طلبك لتأكيد الطلب فوراً
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Order summary */}
              <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(139,26,42,0.07)', border: '1px solid rgba(139,26,42,0.15)' }}>
                {items.map(item => (
                  <div key={item.cartId} className="flex justify-between text-sm">
                    <span style={{ color: 'var(--c-text-2)', fontFamily: 'Cairo, sans-serif' }}>
                      {item.name} × {item.customization.quantity}
                    </span>
                    <span style={{ color: 'var(--c-brand-l)', fontFamily: '"Playfair Display", serif' }}>
                      {item.price * item.customization.quantity} ج.م
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-2" style={{ borderTop: '1px solid rgba(139,26,42,0.2)' }}>
                  <span style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>💰 الإجمالي</span>
                  <span style={{ color: 'var(--c-brand-l)', fontFamily: '"Playfair Display", serif' }}>{totalPrice} ج.م</span>
                </div>
              </div>

              {/* Send via WhatsApp */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={sendOrder}
                className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #128C7E, #25D366)',
                  boxShadow: '0 4px 20px rgba(37,211,102,0.3)',
                  fontFamily: 'Cairo, sans-serif',
                }}
              >
                <Send size={18} />
                إرسال عبر واتساب
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {ReactDOM.createPortal(sheet, document.body)}
      {ReactDOM.createPortal(waiterView, document.body)}
    </>
  );
}
