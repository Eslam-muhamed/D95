import { useState, useTransition, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Gamepad2, Coffee, ShoppingBag, Home } from 'lucide-react';
import { useCart } from '@/stores/cartStore';
import { preloadMenuData } from '@/services/menuService';

export default function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const [, startTransition] = useTransition();
    const { itemCount, openCart } = useCart();
    const [optimisticPath, setOptimisticPath] = useState<string | null>(null);

    // Sync optimistic path whenever true route changes
    useEffect(() => {
        setOptimisticPath(null);
    }, [location.pathname]);

    const isCheckoutFlow =
        location.pathname.startsWith('/playstation/booking') ||
        location.pathname.startsWith('/playstation/payment') ||
        location.pathname.startsWith('/playstation/success');

    // Hide bottom nav only during booking details, final payment checkout & success pages
    if (isCheckoutFlow) return null;

    const navItems = [
        { path: '/', label: 'البوابة', icon: Home, isExact: true },
        { path: '/playstation', label: 'الأجهزة', icon: Gamepad2 },
        { path: '/menu', label: 'الكافيه', icon: Coffee },
    ];

    const currentPath = optimisticPath ?? location.pathname;

    const handleTabSelect = (path: string, isActive: boolean) => {
        if (isActive) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Instant visual feedback (0ms)
        setOptimisticPath(path);

        // Preload menu data if switching to menu
        if (path === '/menu') {
            preloadMenuData();
        }

        // Non-blocking navigation
        startTransition(() => {
            navigate(path);
        });
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-safe md:hidden transform-gpu">
            <div className="max-w-[420px] mx-auto px-4 pb-3">
                <nav
                    className="pointer-events-auto rounded-2xl p-1.5 flex items-center justify-between shadow-[0_12px_36px_rgba(0,0,0,0.25)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.9)] border border-neutral-200/90 dark:border-white/10 bg-white/95 dark:bg-[#120a0d]/95 backdrop-blur-xl transition-colors duration-200"
                    style={{
                        transform: 'translateZ(0)',
                        contain: 'layout style',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    {/* Nav Items */}
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.isExact
                            ? currentPath === item.path
                            : currentPath.startsWith(item.path);

                        return (
                            <button
                                key={item.path}
                                type="button"
                                onClick={() => handleTabSelect(item.path, isActive)}
                                onPointerDown={() => {
                                    if (!isActive) {
                                        setOptimisticPath(item.path);
                                        if (item.path === '/menu') preloadMenuData();
                                    }
                                }}
                                onMouseEnter={() => {
                                    if (item.path === '/menu') preloadMenuData();
                                }}
                                className="relative flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer group touch-manipulation select-none"
                            >
                                <div
                                    className={`absolute inset-0 rounded-xl transition-all duration-150 pointer-events-none ${
                                        isActive
                                            ? 'bg-red-500/10 dark:bg-red-600/15 border border-red-500/30 dark:border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)] opacity-100 scale-100'
                                            : 'opacity-0 scale-90 border-transparent'
                                    }`}
                                />
                                <Icon
                                    className={`w-5 h-5 transition-all duration-150 relative z-10 ${
                                        isActive
                                            ? 'text-red-600 dark:text-red-400 scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                                            : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white'
                                    }`}
                                />
                                <span
                                    className={`text-[10px] font-body tracking-tight mt-1 transition-colors relative z-10 ${
                                        isActive
                                            ? 'text-red-600 dark:text-red-400 font-bold'
                                            : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200'
                                    }`}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}

                    {/* Cart Button */}
                    <button
                        type="button"
                        onClick={openCart}
                        className="relative flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer group touch-manipulation select-none"
                    >
                        <div className="relative">
                            <ShoppingBag className="w-5 h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-[9px] font-bold font-body w-4 h-4 rounded-full flex items-center justify-center shadow-md shadow-red-600/40 animate-in fade-in zoom-in duration-100">
                                    {itemCount > 9 ? '9+' : itemCount}
                                </span>
                            )}
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
