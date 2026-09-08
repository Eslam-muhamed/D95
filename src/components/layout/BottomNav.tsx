import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, Coffee, ShoppingBag, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/stores/cartStore';
import { playCafeEntranceSound, playPs5StartupSound } from '@/lib/sound';

export default function BottomNav() {
    const location = useLocation();
    const { itemCount, openCart } = useCart();

    const isBookingFlow =
        location.pathname.startsWith('/playstation/booking') ||
        location.pathname.startsWith('/playstation/payment') ||
        location.pathname.startsWith('/playstation/success');

    // Don't show bottom nav inside active payment/checkout pages to keep focus
    if (isBookingFlow) return null;

    const navItems = [
        { path: '/', label: 'البوابة', icon: Home, isExact: true },
        { path: '/playstation', label: 'الأجهزة', icon: Gamepad2, sound: playPs5StartupSound },
        { path: '/menu', label: 'الكافيه', icon: Coffee, sound: playCafeEntranceSound },
    ];

    return (
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
                                onClick={() => {
                                    if (!isActive && item.sound) {
                                        item.sound();
                                    }
                                }}
                                className="relative flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all cursor-pointer group"
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
                        className="relative flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all cursor-pointer group"
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
                </nav>
            </div>
        </div>
    );
}
