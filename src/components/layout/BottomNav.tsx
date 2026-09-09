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
            <div className="max-w-[440px] mx-auto px-3 pb-3">
                <nav
                    className="pointer-events-auto rounded-3xl p-1.5 flex items-center justify-around shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.85)] border border-neutral-200/90 dark:border-white/10 bg-white/98 dark:bg-[#0f080a]/98 transition-colors duration-150"
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
                                className="relative flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-transform duration-75 active:scale-95 cursor-pointer group touch-manipulation select-none"
                            >
                                <div
                                    className={`absolute inset-0 rounded-2xl border transition-all duration-150 pointer-events-none ${
                                        isActive
                                            ? 'bg-red-50 dark:bg-gradient-to-r dark:from-red-600/30 dark:to-red-800/30 border-red-200 dark:border-red-500/40 shadow-inner opacity-100 scale-100'
                                            : 'opacity-0 scale-95 border-transparent'
                                    }`}
                                />
                                <Icon
                                    className={`w-5 h-5 transition-transform duration-150 relative z-10 ${
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
                            </button>
                        );
                    })}

                    {/* Cart Button */}
                    <button
                        type="button"
                        onClick={openCart}
                        className="relative flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-transform duration-75 active:scale-95 cursor-pointer group touch-manipulation select-none"
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
