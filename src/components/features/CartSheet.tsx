import { createPortal } from 'react-dom';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Minus,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Send,
  Gamepad2,
  Coffee,
  Calendar,
  Clock,
  Edit2,
  CheckCircle2,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { useCart } from '@/stores/cartStore';
import { getItemUnitPrice } from '@/lib/cartUtils';
import { CONTACT_INFO } from '@/constants/contactInfo';
import { supabase } from '@/lib/supabase';

const CAFE_NAME = CONTACT_INFO.fullName;
const WHATSAPP_PHONE = CONTACT_INFO.whatsappNumber;

interface Props {
  open?: boolean;
  onClose?: () => void;
}

type PaymentMethod = 'wallet' | 'instapay';

const PAYMENT_OPTIONS: {
  value: PaymentMethod;
  emoji: string;
  label: string;
  fullLabel: string;
  account: string;
  accountLabel: string;
}[] = [
  {
    value: 'wallet',
    emoji: '📱',
    label: 'محفظة إلكترونية',
    fullLabel: '📱 محفظة إلكترونية (فودافون كاش)',
    account: CONTACT_INFO.walletNumber,
    accountLabel: 'رقم المحفظة',
  },
  {
    value: 'instapay',
    emoji: '⚡',
    label: 'إنستاباي',
    fullLabel: '⚡ إنستاباي',
    account: CONTACT_INFO.instapayHandle,
    accountLabel: 'معرف إنستاباي',
  },
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
  const navigate = useNavigate();
  const {
    items,
    booking,
    cafeTotal,
    bookingTotal,
    cafeCount,
    hasCafeItems,
    hasBooking,
    activeTab,
    setActiveTab,
    removeItem,
    updateQty,
    removeBooking,
    clearCart,
    clearCafe,
    isOpen,
    closeCart,
  } = useCart();

  const isCartOpen = propOpen !== undefined ? propOpen : isOpen;
  const handleClose = propOnClose !== undefined ? propOnClose : closeCart;

  // Waiter modal for Café Checkout
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

  // Option to attach cafe snacks with PlayStation booking
  const [attachSnacksToBooking, setAttachSnacksToBooking] = useState(true);

  const assignItem = (cartId: string, person: number) =>
    setAssignments(prev => ({ ...prev, [cartId]: person }));

  const personTotals = Array.from({ length: people }, (_, pi) => {
    const personItems = items.filter(i => assignments[i.cartId] === pi + 1);
    return personItems.reduce((sum, i) => sum + getItemUnitPrice(i) * i.customization.quantity, 0);
  });

  const unassigned = items.filter(i => !assignments[i.cartId]);

  // Total for PlayStation tab
  const playstationSnacksTotal = attachSnacksToBooking && hasCafeItems ? cafeTotal : 0;
  const playstationGrandTotal = (booking?.subtotal ?? 0) + playstationSnacksTotal;

  // Build WhatsApp Message specifically for Café Orders
  const buildCafeWhatsAppMsg = (orderNum?: string) => {
    const payFull = PAYMENT_OPTIONS.find(p => p.value === paymentMethod)?.fullLabel ?? '';
    const itemLines = items
      .map(i => {
        const custom = formatCustomization(i.customization);
        const itemTotal = getItemUnitPrice(i) * i.customization.quantity;
        return `▪️ ${i.name} × ${i.customization.quantity} = ${itemTotal} ج.م${custom ? `\n   (${custom})` : ''}`;
      })
      .join('\n');

    const refLine = orderNum ? `🔖 رقم الطلب: ${orderNum}\n` : '';

    if (orderType === 'dine') {
      const header = `🪑 --- طلبية داخل صالة الكافيه ---\n🏠 ${CAFE_NAME}\n${refLine}🪑 رقم الطاولة / مكان الجلوس: ${tableNo || 'غير محدد'}\n\n`;
      return encodeURIComponent(`${header}${itemLines}\n\n💰 إجمالي الكافيه: ${cafeTotal} ج.م`);
    } else {
      const header =
        `🛵 --- طلب دليفري / توصيل خارجي ---\n🏠 ${CAFE_NAME}\n${refLine}` +
        `👤 الاسم: ${delivName}\n📱 الموبايل: ${delivPhone}\n📍 العنوان: ${delivAddr}\n💳 طريقة الدفع: ${payFull}\n\n`;
      return encodeURIComponent(`${header}${itemLines}\n\n💰 الإجمالي: ${cafeTotal} ج.م`);
    }
  };

  // Build WhatsApp message for PlayStation inquiry (optional secondary action)
  const buildPsWhatsAppMsg = () => {
    if (!booking) return '';
    let msg =
      `🎮 --- استفسار / تأكيد حجز بلايستيشن ---\n🏠 ${CAFE_NAME}\n\n` +
      `🎮 تفاصيل الجلسة:\n` +
      `• الغرفة: ${booking.roomName}\n` +
      `• التاريخ: ${booking.date}\n` +
      `• الموعد: من ${booking.startTime} إلى ${booking.endTime} (${booking.durationHours} ${booking.durationHours === 1 ? 'ساعة' : 'ساعات'})\n` +
      `• سعر الغرفة: ${booking.subtotal} ج.م\n`;

    if (attachSnacksToBooking && hasCafeItems) {
      const itemLines = items
        .map(i => `  - ${i.name} × ${i.customization.quantity}`)
        .join('\n');
      msg += `\n☕ المشروبات والسناكس المرافقة:\n${itemLines}\n💵 إجمالي المشروبات: ${cafeTotal} ج.م\n`;
    }

    msg += `\n💰 الإجمالي الكلي: ${playstationGrandTotal} ج.م\n`;
    return encodeURIComponent(msg);
  };

  const sendCafeOrder = async () => {
    const orderNumber = `D95-ORD-${Date.now().toString(36).slice(-4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Asynchronously save order to database
    try {
      await supabase.from('orders').insert({
        order_number: orderNumber,
        customer_name: orderType === 'delivery' ? (delivName.trim() || 'عميل دليفري') : `طاولة ${tableNo || 'صالة'}`,
        customer_phone: orderType === 'delivery' ? delivPhone.trim() : null,
        order_type: orderType,
        table_number: orderType === 'dine' ? (tableNo.trim() || null) : null,
        delivery_address: orderType === 'delivery' ? (delivAddr.trim() || null) : null,
        payment_method: paymentMethod,
        items: items.map(i => ({
          id: i.id,
          name: i.name,
          price: getItemUnitPrice(i),
          quantity: i.customization.quantity,
          customization: i.customization,
        })),
        subtotal: cafeTotal,
        total_amount: cafeTotal,
        status: 'pending',
      });
    } catch (err) {
      console.warn('Could not persist cafe order to database:', err);
    }

    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${buildCafeWhatsAppMsg(orderNumber)}`, '_blank');
  };

  const sendPsOrder = () => {
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${buildPsWhatsAppMsg()}`, '_blank');
  };

  const inputStyle = {
    background: 'rgba(139,26,42,0.08)',
    border: '1px solid rgba(139,26,42,0.22)',
    color: 'var(--c-text-1)',
    fontFamily: 'Cairo, sans-serif',
  } as const;

  const hasBoth = hasCafeItems && hasBooking;

  /* ─── Main cart sheet ─── */
  const sheet = (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
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
              willChange: 'transform',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.8 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Grab handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(139,26,42,0.4)' }} />
            </div>

            {/* Header with Title and Clear Action */}
            <div className="flex items-center justify-between px-4 pb-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-red-500" />
                <h2 className="font-bold text-lg" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>
                  سلة المشتريات والطلبات
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {activeTab === 'cafe' && hasCafeItems && (
                  <button
                    onClick={clearCafe}
                    className="text-xs px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                    style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', fontFamily: 'Cairo, sans-serif' }}
                    title="مسح طلبات الكافيه فقط"
                  >
                    مسح الكافيه
                  </button>
                )}
                {activeTab === 'playstation' && hasBooking && (
                  <button
                    onClick={removeBooking}
                    className="text-xs px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                    style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', fontFamily: 'Cairo, sans-serif' }}
                    title="إلغاء حجز الغرفة"
                  >
                    إلغاء الحجز
                  </button>
                )}
                {hasBoth && (
                  <button
                    onClick={clearCart}
                    className="text-xs px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                    style={{ color: 'var(--c-text-3)', background: 'rgba(139,26,42,0.1)', fontFamily: 'Cairo, sans-serif' }}
                    title="مسح كافة الأصناف والحجوزات"
                  >
                    مسح الكل
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center rounded-full cursor-pointer transition-transform active:scale-95"
                  style={{ width: 36, height: 36, background: 'rgba(139,26,42,0.15)' }}
                  aria-label="إغلاق السلة"
                >
                  <X size={18} style={{ color: 'var(--c-on-card)' }} />
                </button>
              </div>
            </div>

            {/* Segmented Tab Switcher (Visible when both exist or as toggle) */}
            {hasBoth ? (
              <div className="px-4 pt-3 pb-1">
                <div
                  className="p-1 rounded-2xl flex items-center gap-1.5"
                  style={{
                    background: 'rgba(139,26,42,0.12)',
                    border: '1px solid rgba(139,26,42,0.25)',
                  }}
                >
                  <button
                    onClick={() => setActiveTab('cafe')}
                    className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all relative select-none"
                    style={{
                      background: activeTab === 'cafe' ? 'linear-gradient(135deg, #8B1A2A, #A82435)' : 'transparent',
                      color: activeTab === 'cafe' ? '#fff' : 'var(--c-text-2)',
                      boxShadow: activeTab === 'cafe' ? '0 2px 10px rgba(139,26,42,0.4)' : 'none',
                      fontFamily: 'Cairo, sans-serif',
                    }}
                  >
                    <Coffee size={16} />
                    <span>طلبات الكافيه</span>
                    <span
                      className="px-1.5 py-0.2 rounded-full text-[11px] font-bold"
                      style={{
                        background: activeTab === 'cafe' ? 'rgba(255,255,255,0.25)' : 'rgba(139,26,42,0.25)',
                        color: activeTab === 'cafe' ? '#fff' : 'var(--c-brand-l)',
                      }}
                    >
                      {cafeCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('playstation')}
                    className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all relative select-none"
                    style={{
                      background: activeTab === 'playstation' ? 'linear-gradient(135deg, #8B1A2A, #A82435)' : 'transparent',
                      color: activeTab === 'playstation' ? '#fff' : 'var(--c-text-2)',
                      boxShadow: activeTab === 'playstation' ? '0 2px 10px rgba(139,26,42,0.4)' : 'none',
                      fontFamily: 'Cairo, sans-serif',
                    }}
                  >
                    <Gamepad2 size={16} />
                    <span>حجز البلايستيشن</span>
                    <span
                      className="px-1.5 py-0.2 rounded-full text-[11px] font-bold"
                      style={{
                        background: activeTab === 'playstation' ? 'rgba(255,255,255,0.25)' : 'rgba(139,26,42,0.25)',
                        color: activeTab === 'playstation' ? '#fff' : 'var(--c-brand-l)',
                      }}
                    >
                      1
                    </span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* Content Area */}
            {!hasBooking && !hasCafeItems ? (
              /* Completely Empty State */
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-red-600/10 border border-red-500/20 text-4xl mb-1 shadow-inner">
                  🛒
                </div>
                <p className="font-bold text-base" style={{ color: 'var(--c-text-1)', fontFamily: 'Cairo, sans-serif' }}>
                  سلة الطلبات فارغة حالياً
                </p>
                <p className="text-xs text-neutral-400 max-w-xs leading-relaxed" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  يمكنك حجز غرفة بلايستيشن مجهزة، أو طلب مشروبات وسناكس وحلويات من الكافيه لتظهر هنا!
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => {
                      handleClose();
                      navigate('/playstation');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/40 text-red-500 font-bold text-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Gamepad2 size={15} />
                    <span>حجز بلايستيشن</span>
                  </button>
                  <button
                    onClick={() => {
                      handleClose();
                      navigate('/menu');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Coffee size={15} />
                    <span>تصفح المنيو</span>
                  </button>
                </div>
              </div>
            ) : activeTab === 'cafe' ? (
              /* ─── TAB 1: CAFÉ CART ─── */
              <div className="px-4 py-4 space-y-3">
                {/* Notice if Playstation booking also exists */}
                {hasBooking && (
                  <div
                    className="rounded-2xl p-3 flex items-center justify-between gap-2 text-xs"
                    style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Gamepad2 size={16} className="text-red-400 shrink-0" />
                      <span style={{ color: 'var(--c-text-1)', fontFamily: 'Cairo, sans-serif' }}>
                        لديك حجز غرفة نشط: <strong>{booking?.roomName}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('playstation')}
                      className="text-red-400 hover:text-red-300 font-bold underline cursor-pointer shrink-0"
                      style={{ fontFamily: 'Cairo, sans-serif' }}
                    >
                      عرض الحجز 🎮
                    </button>
                  </div>
                )}

                {/* Empty Cafe State if tab is open but no items */}
                {!hasCafeItems ? (
                  <div className="py-12 text-center space-y-3">
                    <span className="text-4xl">☕</span>
                    <p className="font-bold text-sm" style={{ color: 'var(--c-text-1)', fontFamily: 'Cairo, sans-serif' }}>
                      سلة الكافيه فارغة حالياً
                    </p>
                    <p className="text-xs text-neutral-400 max-w-xs mx-auto" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      استكشف تشكيلة القهوة المختصة والمشروبات الباردة والحلويات وأضف ما يعجبك!
                    </p>
                    <button
                      onClick={() => {
                        handleClose();
                        navigate('/menu');
                      }}
                      className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-md shadow-red-600/30 inline-flex items-center gap-2"
                    >
                      <Coffee size={14} />
                      <span>تصفح منيو الكافيه</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Items List */}
                    {items.map(item => {
                      const custom = formatCustomization(item.customization);
                      return (
                        <div
                          key={item.cartId}
                          className="flex items-center gap-3 rounded-2xl p-3 transition-colors"
                          style={{ background: 'rgba(139,26,42,0.08)', border: '1px solid var(--c-border)' }}
                        >
                          <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate" style={{ color: 'var(--c-text-1)', fontFamily: 'Cairo, sans-serif' }}>
                              {item.name}
                            </p>
                            {custom && (
                              <p className="text-[11px] mt-0.5 leading-relaxed text-neutral-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                {custom}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQty(item.cartId, item.customization.quantity - 1)}
                                  className="flex items-center justify-center rounded-full cursor-pointer transition-colors active:scale-90"
                                  style={{ width: 28, height: 28, background: 'rgba(139,26,42,0.2)' }}
                                  aria-label="إنقاص الكمية"
                                >
                                  <Minus size={12} style={{ color: 'var(--c-on-card)' }} />
                                </button>
                                <span className="w-5 text-center text-sm font-bold" style={{ color: 'var(--c-text-1)', fontFamily: '"Playfair Display", serif' }}>
                                  {item.customization.quantity}
                                </span>
                                <button
                                  onClick={() => updateQty(item.cartId, item.customization.quantity + 1)}
                                  className="flex items-center justify-center rounded-full cursor-pointer transition-colors active:scale-90"
                                  style={{ width: 28, height: 28, background: 'rgba(139,26,42,0.2)' }}
                                  aria-label="زيادة الكمية"
                                >
                                  <Plus size={12} style={{ color: 'var(--c-on-card)' }} />
                                </button>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span className="font-bold text-sm" style={{ color: 'var(--c-brand-l)', fontFamily: '"Playfair Display", serif' }}>
                                  {getItemUnitPrice(item) * item.customization.quantity} ج.م
                                </span>
                                <button
                                  onClick={() => removeItem(item.cartId)}
                                  className="flex items-center justify-center rounded-full cursor-pointer transition-colors active:scale-90"
                                  style={{ width: 28, height: 28, background: 'rgba(248,113,113,0.1)' }}
                                  aria-label="حذف الصنف"
                                >
                                  <Trash2 size={13} style={{ color: '#f87171' }} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Bill Splitter toggle for Café items */}
                    <button
                      onClick={() => setShowSplitter(p => !p)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors"
                      style={{ background: 'rgba(139,26,42,0.1)', border: '1px solid rgba(139,26,42,0.2)' }}
                    >
                      <span className="text-xs sm:text-sm font-bold flex items-center gap-2" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>
                        <span>👥</span>
                        <span>تقسيم حساب الكافيه بين الشلة</span>
                      </span>
                      {showSplitter
                        ? <ChevronUp size={16} style={{ color: 'var(--c-brand-l)' }} />
                        : <ChevronDown size={16} style={{ color: 'var(--c-brand-l)' }} />}
                    </button>

                    {showSplitter && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden">
                        <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(139,26,42,0.07)', border: '1px solid rgba(139,26,42,0.15)' }}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>عدد الأشخاص</span>
                            <div className="flex items-center gap-3">
                              <button onClick={() => setPeople(p => Math.max(2, p - 1))} className="flex items-center justify-center rounded-full cursor-pointer" style={{ width: 28, height: 28, background: 'rgba(139,26,42,0.2)' }}>
                                <Minus size={12} style={{ color: 'var(--c-on-card)' }} />
                              </button>
                              <span className="font-bold text-sm" style={{ color: 'var(--c-text-1)', fontFamily: '"Playfair Display", serif' }}>{people}</span>
                              <button onClick={() => setPeople(p => Math.min(10, p + 1))} className="flex items-center justify-center rounded-full cursor-pointer" style={{ width: 28, height: 28, background: 'rgba(139,26,42,0.2)' }}>
                                <Plus size={12} style={{ color: 'var(--c-on-card)' }} />
                              </button>
                            </div>
                          </div>
                          {items.map(item => (
                            <div key={item.cartId} className="space-y-1">
                              <p className="text-xs font-medium" style={{ color: 'var(--c-text-2)', fontFamily: 'Cairo, sans-serif' }}>{item.name}</p>
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
                            <div key={pi} className="flex justify-between items-center text-xs">
                              <span style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>الشخص {pi + 1}</span>
                              <span className="font-bold" style={{ color: 'var(--c-brand-l)', fontFamily: '"Playfair Display", serif' }}>{t} ج.م</span>
                            </div>
                          ))}
                          {unassigned.length > 0 && (
                            <p className="text-[11px]" style={{ color: '#f87171', fontFamily: 'Cairo, sans-serif' }}>
                              ⚠️ {unassigned.length} عنصر غير مُسنَد
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Cafe Total */}
                    <div className="flex justify-between items-center px-2 py-3" style={{ borderTop: '1px solid var(--c-border)' }}>
                      <div>
                        <span className="font-bold text-sm block" style={{ color: 'var(--c-text-1)', fontFamily: 'Cairo, sans-serif' }}>إجمالي طلب الكافيه</span>
                        <span className="text-[11px] text-neutral-400 font-sans">{cafeCount} {cafeCount === 1 ? 'صنف' : 'أصناف'}</span>
                      </div>
                      <span className="font-bold text-xl" style={{ color: 'var(--c-brand-l)', fontFamily: '"Playfair Display", serif' }}>
                        {cafeTotal} ج.م
                      </span>
                    </div>

                    {/* Primary Cafe Checkout Button */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowWaiter(true)}
                      className="w-full py-3.5 rounded-2xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-900/30 transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #8B1A2A, #C45C6A)',
                        fontFamily: 'Cairo, sans-serif',
                      }}
                    >
                      <Coffee size={18} />
                      <span>إتمام طلب الكافيه ☕ ({cafeTotal} ج.م)</span>
                    </motion.button>
                  </>
                )}
              </div>
            ) : (
              /* ─── TAB 2: PLAYSTATION CART ─── */
              <div className="px-4 py-4 space-y-4">
                {!booking ? (
                  /* Empty Playstation State */
                  <div className="py-12 text-center space-y-3">
                    <span className="text-4xl">🎮</span>
                    <p className="font-bold text-sm" style={{ color: 'var(--c-text-1)', fontFamily: 'Cairo, sans-serif' }}>
                      لا يوجد حجز غرفة بلايستيشن حالياً
                    </p>
                    <p className="text-xs text-neutral-400 max-w-xs mx-auto" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      اختر الغرفة المناسبة (VIP أو عادية) مع أحدث ألعاب PS5 وشاشات 4K فائقة الوضوح.
                    </p>
                    <button
                      onClick={() => {
                        handleClose();
                        navigate('/playstation');
                      }}
                      className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-md shadow-red-600/30 inline-flex items-center gap-2"
                    >
                      <Gamepad2 size={15} />
                      <span>اختيار غرفة وحجز موعد</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* VIP Room Booking Card */}
                    <div
                      className="rounded-2xl p-4 border relative shadow-lg overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139,26,42,0.28) 0%, rgba(20,10,14,0.95) 100%)',
                        borderColor: 'rgba(220,38,38,0.4)',
                      }}
                    >
                      {/* Decorative corner glow */}
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-600/20 rounded-full blur-xl pointer-events-none" />

                      <div className="flex items-start justify-between gap-3 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-red-600/25 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0 shadow-sm">
                            <Gamepad2 size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm sm:text-base text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                {booking.roomName}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                                جلسة بلايستيشن
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300 mt-1 font-sans">
                              <span className="flex items-center gap-1">
                                <Calendar size={13} className="text-red-400" />
                                {booking.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={13} className="text-red-400" />
                                {booking.startTime} - {booking.endTime} ({booking.durationHours} {booking.durationHours === 1 ? 'ساعة' : 'ساعات'})
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className="font-mono font-bold text-base text-red-400" dir="ltr">
                            {booking.subtotal} ج.م
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                handleClose();
                                navigate('/playstation/booking', {
                                  state: {
                                    room: {
                                      id: booking.roomId,
                                      name: booking.roomName,
                                      nameEn: booking.roomNameEn,
                                      rate: booking.rate,
                                    },
                                  },
                                });
                              }}
                              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                              title="تعديل موعد الحجز"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={removeBooking}
                              className="p-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                              title="إلغاء حجز الغرفة"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Refreshments / Snacks with Gaming Session */}
                    <div
                      className="rounded-2xl p-3.5 space-y-2.5 transition-all"
                      style={{
                        background: 'rgba(139,26,42,0.08)',
                        border: '1px solid rgba(139,26,42,0.22)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coffee size={17} className="text-amber-400" />
                          <span className="font-bold text-xs sm:text-sm" style={{ color: 'var(--c-text-1)', fontFamily: 'Cairo, sans-serif' }}>
                            المشروبات والسناكس المرافقة للجلسة
                          </span>
                        </div>
                        {hasCafeItems && (
                          <button
                            onClick={() => setAttachSnacksToBooking(prev => !prev)}
                            className="text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                            style={{
                              background: attachSnacksToBooking ? 'rgba(34,197,94,0.15)' : 'rgba(139,26,42,0.15)',
                              color: attachSnacksToBooking ? '#4ade80' : 'var(--c-text-3)',
                              border: `1px solid ${attachSnacksToBooking ? 'rgba(34,197,94,0.3)' : 'rgba(139,26,42,0.25)'}`,
                              fontFamily: 'Cairo, sans-serif',
                            }}
                          >
                            <CheckCircle2 size={13} className={attachSnacksToBooking ? 'opacity-100' : 'opacity-40'} />
                            <span>{attachSnacksToBooking ? 'مُضمّنة مع الحجز' : 'غير مُضمّنة'}</span>
                          </button>
                        )}
                      </div>

                      {hasCafeItems ? (
                        attachSnacksToBooking ? (
                          <div className="space-y-2 pt-1">
                            <div className="flex flex-wrap gap-1.5">
                              {items.map(i => (
                                <span
                                  key={i.cartId}
                                  className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-neutral-300"
                                  style={{ fontFamily: 'Cairo, sans-serif' }}
                                >
                                  {i.name} × {i.customization.quantity}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                              <button
                                onClick={() => setActiveTab('cafe')}
                                className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
                                style={{ fontFamily: 'Cairo, sans-serif' }}
                              >
                                تعديل المشروبات بالسلة ({cafeTotal} ج.م)
                              </button>
                              <span className="font-mono font-bold text-amber-400">+{cafeTotal} ج.م</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-neutral-400 leading-relaxed" style={{ fontFamily: 'Cairo, sans-serif' }}>
                            طلبات الكافيه الحالية لن يتم تضمينها في فاتورة الحجز، ويمكنك طلبها بشكل مستقل لاحقاً.
                          </p>
                        )
                      ) : (
                        <div className="flex items-center justify-between pt-1">
                          <p className="text-[11px] text-neutral-400" style={{ fontFamily: 'Cairo, sans-serif' }}>
                            لم تختر أي مشروبات أو سناكس حتى الآن
                          </p>
                          <button
                            onClick={() => {
                              handleClose();
                              navigate('/menu');
                            }}
                            className="text-xs text-red-400 hover:text-red-300 font-bold underline cursor-pointer flex items-center gap-1"
                            style={{ fontFamily: 'Cairo, sans-serif' }}
                          >
                            <Sparkles size={12} />
                            <span>تصفح المنيو وإضافة سناكس</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Breakdown & Grand Total */}
                    <div className="rounded-2xl p-3.5 space-y-2" style={{ background: 'rgba(139,26,42,0.06)', border: '1px solid rgba(139,26,42,0.18)' }}>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--c-text-2)', fontFamily: 'Cairo, sans-serif' }}>سعر حجز الغرفة ({booking.durationHours} ساعة)</span>
                        <span className="font-mono font-bold text-white">{booking.subtotal} ج.م</span>
                      </div>
                      {attachSnacksToBooking && hasCafeItems && (
                        <div className="flex justify-between text-xs">
                          <span style={{ color: 'var(--c-text-2)', fontFamily: 'Cairo, sans-serif' }}>مشروبات وسناكس الكافيه ({cafeCount} صنف)</span>
                          <span className="font-mono font-bold text-amber-400">+{cafeTotal} ج.م</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 font-bold" style={{ borderTop: '1px solid rgba(139,26,42,0.2)' }}>
                        <span className="text-sm" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>الإجمالي المطلوب</span>
                        <span className="text-xl" style={{ color: 'var(--c-brand-l)', fontFamily: '"Playfair Display", serif' }}>
                          {playstationGrandTotal} ج.م
                        </span>
                      </div>
                    </div>

                    {/* PlayStation Direct Checkout Actions */}
                    <div className="space-y-2 pt-1">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleClose();
                          navigate('/playstation/payment', {
                            state: {
                              room: {
                                id: booking.roomId,
                                name: booking.roomName,
                                nameEn: booking.roomNameEn,
                                rate: booking.rate,
                              },
                              date: booking.date,
                              startTime: booking.startTime,
                              endTime: booking.endTime,
                              startDateTime: booking.startDateTime,
                              endDateTime: booking.endDateTime,
                              durationHours: booking.durationHours,
                              roomSubtotal: booking.subtotal,
                              snacks: attachSnacksToBooking && hasCafeItems
                                ? items.map(i => ({
                                    id: i.id,
                                    name: `${i.name}${i.customization.quantity > 1 ? ` × ${i.customization.quantity}` : ''}`,
                                    price: getItemUnitPrice(i) * i.customization.quantity,
                                    quantity: i.customization.quantity,
                                  }))
                                : [],
                              snacksTotal: playstationSnacksTotal,
                              total: playstationGrandTotal,
                            },
                          });
                        }}
                        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-red-600/35 active:scale-[0.98] transition-all cursor-pointer border border-red-500/50"
                        style={{ fontFamily: 'Cairo, sans-serif' }}
                      >
                        <Gamepad2 size={18} />
                        <span>متابعة تأكيد الحجز والدفع 💳 ({playstationGrandTotal} ج.م)</span>
                      </motion.button>

                      <button
                        onClick={sendPsOrder}
                        className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer bg-[#25D366]/90 hover:bg-[#25D366] transition-all active:scale-[0.98] shadow-sm"
                        style={{ fontFamily: 'Cairo, sans-serif' }}
                      >
                        <Send size={15} />
                        <span>إرسال تفاصيل الحجز عبر واتساب</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  /* ─── Waiter / order confirmation view for Café ─── */
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
                ✦ كشف طلبات الكافيه ✦
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
                  <p className="text-sm mb-1 font-semibold" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>🪑 رقم الطاولة أو مكان الجلوس</p>
                  <input
                    value={tableNo}
                    onChange={e => setTableNo(e.target.value)}
                    placeholder="مثلاً: طاولة 5 أو البار أو الصالة العلوية"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ ...inputStyle }}
                  />
                </div>
              )}

              {/* Delivery */}
              {orderType === 'delivery' && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm mb-1 font-semibold" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>👤 الاسم</p>
                    <input value={delivName} onChange={e => setDelivName(e.target.value)} placeholder="اسمك الكريم"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ ...inputStyle }} />
                  </div>
                  <div>
                    <p className="text-sm mb-1 font-semibold" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>📱 الموبايل</p>
                    <input value={delivPhone} onChange={e => setDelivPhone(e.target.value)} placeholder="01xxxxxxxxx" type="tel"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ ...inputStyle }} />
                  </div>
                  <div>
                    <p className="text-sm mb-1 font-semibold" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>📍 العنوان</p>
                    <textarea value={delivAddr} onChange={e => setDelivAddr(e.target.value)} placeholder="عنوان التوصيل بالتفصيل" rows={2}
                      className="w-full rounded-xl px-3 py-2 text-sm resize-none outline-none"
                      style={{ ...inputStyle, caretColor: '#C45C6A' }} />
                  </div>

                  {/* Payment method */}
                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>💳 طريقة الدفع المفضلة</p>
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
                  <div key={item.cartId} className="flex justify-between text-xs sm:text-sm">
                    <span style={{ color: 'var(--c-text-2)', fontFamily: 'Cairo, sans-serif' }}>
                      {item.name} × {item.customization.quantity}
                    </span>
                    <span style={{ color: 'var(--c-brand-l)', fontFamily: '"Playfair Display", serif' }}>
                      {getItemUnitPrice(item) * item.customization.quantity} ج.م
                    </span>
                  </div>
                ))}

                <div className="flex justify-between font-bold pt-2" style={{ borderTop: '1px solid rgba(139,26,42,0.2)' }}>
                  <span style={{ color: 'var(--c-on-card)', fontFamily: 'Cairo, sans-serif' }}>💰 إجمالي الكافيه</span>
                  <span style={{ color: 'var(--c-brand-l)', fontFamily: '"Playfair Display", serif', fontSize: '1.05rem' }}>{cafeTotal} ج.م</span>
                </div>
              </div>

              {/* Send Order Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={sendCafeOrder}
                className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #128C7E, #25D366)',
                  boxShadow: '0 4px 20px rgba(37,211,102,0.3)',
                  fontFamily: 'Cairo, sans-serif',
                }}
              >
                <Send size={18} />
                إرسال الطلب عبر واتساب
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {createPortal(sheet, document.body)}
      {createPortal(waiterView, document.body)}
    </>
  );
}
