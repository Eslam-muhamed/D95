import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, Coffee, ShoppingBag, Sparkles, Home, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/stores/cartStore';
import { useState } from 'react';
import SurpriseModal from '@/components/features/SurpriseModal';
import XOGame from '@/components/features/XOGame';
import SpyGame from '@/components/features/SpyGame';

const WHATSAPP_NUMBER = '201000000000';

export default function BottomNav() {
    const location = useLocation();
    const { itemCount, openCart } = useCart();
    const [entertainmentOpen, setEntertainmentOpen] = useState(false);
    const [activeGame, setActiveGame] = useState<'surprise' | 'xo' | 'spy' | null>(null);

    const isBookingFlow = location.pathname.startsWith('/playstation/booking') ||
                          location.pathname.startsWith('/playstation/payment') ||
                          location.pathname.startsWith('/playstation/success');

    // Don't show bottom nav inside active payment/checkout pages to keep focus
    if (isBookingFlow) return null;

    const navItems = [
        { path: '/', label: 'البوابة', icon: Home, isExact: true },
        { path: '/playstation', label: 'الأجهزة', icon: Gamepad2 },
        { path: '/menu', label: 'الكافيه', icon: Coffee },
    ];

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-safe md:hidden">
                <div className="max-w-[440px] mx-auto px-3 pb-3">
                    <nav
                        className="pointer-events-auto rounded-3xl p-1.5 flex items-center justify-around shadow-[0_8px_32px_rgba(0,0,0,0.85)] border border-white/10"
                        style={{
                            background: 'rgba(15, 8, 10, 0.94)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                        }}
                    >
                        {/* Nav Items */}
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.isExact
                                ? location.pathname === item.path
                                : location.pathname.startsWith(item.path);

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer group"
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="bottomNavHighlight"
                                            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-600/30 to-red-800/30 border border-red-500/40 shadow-inner"
                                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                        />
                                    )}
                                    <Icon
                                        className={`w-5 h-5 transition-transform duration-200 relative z-10 ${
                                            isActive
                                                ? 'text-red-400 scale-110 drop-shadow-[0_0_8px_rgba(255,80,100,0.6)]'
                                                : 'text-neutral-400 group-hover:text-white'
                                        }`}
                                    />
                                    <span
                                        className={`text-[10px] font-body tracking-tight mt-1 transition-colors relative z-10 ${
                                            isActive ? 'text-white font-bold' : 'text-neutral-400 group-hover:text-neutral-200'
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}

                        {/* Cart Button */}
                        <button
                            type="button"
                            onClick={openCart}
                            className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer group"
                        >
                            <div className="relative">
                                <ShoppingBag className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
                                <AnimatePresence>
                                    {itemCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="absolute -top-1 -right-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-[9px] font-bold font-body w-4 h-4 rounded-full flex items-center justify-center shadow-md shadow-red-600/40"
                                        >
                                            {itemCount > 9 ? '9+' : itemCount}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                            <span className="text-[10px] font-body text-neutral-400 group-hover:text-neutral-200 tracking-tight mt-1">
                                السلة
                            </span>
                        </button>

                        {/* Entertainment & Smart Butler Trigger */}
                        <button
                            type="button"
                            onClick={() => setEntertainmentOpen(true)}
                            className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer group"
                        >
                            <div className="relative">
                                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                            </div>
                            <span className="text-[10px] font-body text-amber-300 font-medium tracking-tight mt-1">
                                الترفيه
                            </span>
                        </button>
                    </nav>
                </div>
            </div>

            {/* Entertainment Bottom Sheet */}
            <AnimatePresence>
                {entertainmentOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEntertainmentOpen(false)}
                            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                            className="fixed bottom-0 left-0 right-0 z-50 max-w-[440px] mx-auto bg-neutral-950 border-t border-white/10 rounded-t-3xl p-5 pb-8 shadow-2xl"
                            dir="rtl"
                        >
                            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />

                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-display text-xl text-white font-bold tracking-wide">
                                        D95 LOUNGE & ENTERTAINMENT
                                    </h3>
                                    <p className="font-body text-xs text-neutral-400">
                                        ألعاب التحدي وخدمة الويتر الذكي أثناء وجودك في الصالة
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEntertainmentOpen(false)}
                                    className="p-2 rounded-full bg-white/5 text-neutral-400 hover:text-white cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEntertainmentOpen(false);
                                        setActiveGame('surprise');
                                    }}
                                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-900/90 border border-white/5 hover:border-red-500/30 text-right transition-all group active:scale-[0.98] cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                                        <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="font-bold text-white text-sm font-body">الويتر الذكي (اقترح لي)</h4>
                                            <span className="text-[10px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded font-bold">مفاجأة</span>
                                        </div>
                                        <p className="text-xs text-neutral-400 font-body">اختبار سريع لاقتراح أفضل مشروب يناسب مزاجك</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setEntertainmentOpen(false);
                                        setActiveGame('xo');
                                    }}
                                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-900/90 border border-white/5 hover:border-amber-500/30 text-right transition-all group active:scale-[0.98] cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                                        <Gamepad2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="font-bold text-white text-sm font-body">لعبة التحدي XO</h4>
                                            <span className="text-[10px] bg-amber-600/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">تحدي</span>
                                        </div>
                                        <p className="text-xs text-neutral-400 font-body">العب جولة تيك تاك تو سريعة مع صاحبك على الطاولة</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setEntertainmentOpen(false);
                                        setActiveGame('spy');
                                    }}
                                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-900/90 border border-white/5 hover:border-purple-500/30 text-right transition-all group active:scale-[0.98] cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                                        <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="font-bold text-white text-sm font-body">لعبة كشف الجاسوس</h4>
                                            <span className="text-[10px] bg-purple-600/20 text-purple-400 px-1.5 py-0.5 rounded font-bold">للشلة</span>
                                        </div>
                                        <p className="text-xs text-neutral-400 font-body">لعبة جماعية للمجموعات تكشف مين فيكم الجاسوس</p>
                                    </div>
                                </button>

                                {/* Direct WhatsApp Customer Service Link */}
                                <a
                                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-900/90 border border-emerald-500/30 hover:border-emerald-500/60 text-right transition-all group active:scale-[0.98]"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                        <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="font-bold text-white text-sm font-body">خدمة العملاء والإدارة</h4>
                                            <span className="text-[10px] bg-emerald-600/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">واتساب 24/7</span>
                                        </div>
                                        <p className="text-xs text-neutral-400 font-body">تواصل مباشر لأي استفسار، حجز خاص أو شكوى</p>
                                    </div>
                                </a>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Modals */}
            {activeGame === 'surprise' && <SurpriseModal onClose={() => setActiveGame(null)} />}
            {activeGame === 'xo' && <XOGame onClose={() => setActiveGame(null)} />}
            {activeGame === 'spy' && <SpyGame onClose={() => setActiveGame(null)} />}
        </>
    );
}
