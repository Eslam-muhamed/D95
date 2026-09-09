import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, Coffee, ShoppingBag, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/stores/cartStore';

export default function BottomNav() {
    const location = useLocation();
    const { itemCount, openCart } = useCart();

    const isCheckoutFlow =
        location.pathname.startsWith('/playstation/payment') ||
        location.pathname.startsWith('/playstation/success');

    // Hide bottom nav only during final payment checkout & success pages
    if (isCheckoutFlow) return null;

    const navItems = [
        { path: '/', label: 'البوابة', icon: Home, isExact: true },
        { path: '/playstation', label: 'الأجهزة', icon: Gamepad2 },
        { path: '/menu', label: 'الكافيه', icon: Coffee },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-safe md:hidden">
            <div className="max-w-[440px] mx-auto px-3 pb-3">
                <nav
                    className="pointer-events-auto rounded-3xl p-1.5 flex items-center justify-around shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.85)] border border-neutral-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0f080a]/95 backdrop-blur-xl transition-colors duration-200"
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
                                onTouchStart={() => {
                                    if (item.path === '/menu') import('@/pages/MenuPage');
                                    if (item.path === '/playstation') import('@/pages/PlaystationPage');
                                }}
                                onMouseEnter={() => {
                                    if (item.path === '/menu') import('@/pages/MenuPage');
                                    if (item.path === '/playstation') import('@/pages/PlaystationPage');
                                }}
                                className="relative flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-transform duration-100 active:scale-90 cursor-pointer group"
                            >
                                <div
                                    className={`absolute inset-0 rounded-2xl border transition-all duration-150 pointer-events-none ${
                                        isActive
                                            ? 'bg-red-50 dark:bg-gradient-to-r dark:from-red-600/30 dark:to-red-800/30 border-red-200 dark:border-red-500/40 shadow-inner opacity-100 scale-100'
                                            : 'opacity-0 scale-95 border-transparent'
                                    }`}
                                />
                                <Icon
                                    className={`w-5 h-5 transition-transform duration-200 relative z-10 ${
                                        isActive
                                            ? 'text-red-600 dark:text-red-400 scale-110 drop-shadow-[0_0_8px_rgba(255,80,100,0.3)] dark:drop-shadow-[0_0_8px_rgba(255,80,100,0.6)]'
                                            : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white'
                                    }`}
                                />
                                <span
                                    className={`text-[10px] font-body tracking-tight mt-1 transition-colors relative z-10 ${
                                        isActive ? 'text-neutral-900 dark:text-white font-bold' : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200'
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
                            <ShoppingBag className="w-5 h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
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
                        <span className="text-[10px] font-body text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200 tracking-tight mt-1">
                            السلة
                        </span>
                    </button>
                </nav>
            </div>
        </div>
    );
}
