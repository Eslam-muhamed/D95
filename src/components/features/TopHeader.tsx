import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/stores/cartStore';
import { useTheme } from '@/stores/themeStore';

interface Props {
  onCartOpen?: () => void;
}

export default function TopHeader({ onCartOpen }: Props = {}) {
  const { itemCount, openCart } = useCart();
  const { theme, toggleTheme } = useTheme();

  const handleCartClick = onCartOpen || (() => openCart('cafe'));

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/95 dark:bg-[#0c090b]/95 backdrop-blur-xl pt-safe border-b border-neutral-200 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_25px_rgba(0,0,0,0.7)] transition-colors duration-200">
      <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-6xl mx-auto" dir="rtl">
        {/* Right side (RTL start): Back to Gateway button & Café Brand Info */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="الرجوع للبوابة الرئيسية"
            title="الرجوع للبوابة الرئيسية"
            className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-neutral-800 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-95 cursor-pointer border border-neutral-200 dark:border-white/15 shadow-sm shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>

          <div className="flex flex-col text-right">
            <div className="flex items-center gap-2">
              <div dir="ltr" className="flex items-baseline leading-none">
                <span className="font-brush font-black text-xl text-neutral-900 dark:text-neutral-100">D</span>
                <span className="font-brush font-black text-2xl text-red-600 dark:text-red-500 -ml-0.5">95</span>
              </div>
              <span className="h-1.5 w-1.5 bg-amber-500 rounded-full inline-block shadow-[0_0_8px_#f59e0b]" />
              <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-600/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-brush tracking-wider border border-amber-300 dark:border-amber-600/30">
                CAFÉ &amp; MENU
              </span>
            </div>
            <span className="font-body text-[10px] text-neutral-500 dark:text-neutral-400">
              قائمة المشروبات والقهوة المختصة والسناكس
            </span>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs (Visible on md: and above) */}
        <div className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-neutral-100/80 dark:bg-white/[0.05] border border-neutral-200/80 dark:border-white/10 text-xs font-body font-semibold">
          <Link
            to="/"
            className="px-3.5 py-1.5 rounded-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 transition-all"
          >
            البوابة
          </Link>
          <Link
            to="/playstation"
            className="px-3.5 py-1.5 rounded-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 transition-all"
          >
            صالة الألعاب
          </Link>
          <span className="px-3.5 py-1.5 rounded-full bg-amber-600 text-white shadow-xs font-bold">
            منيو الكافيه
          </span>
        </div>

        {/* Left side (RTL end): Theme toggle & Cart button */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 border border-neutral-200 dark:border-white/15 text-neutral-800 dark:text-neutral-200 shadow-sm active:scale-95"
            aria-label="تبديل المظهر"
          >
            {theme === 'dark' ? (
              <Sun size={17} className="text-amber-400" />
            ) : (
              <Moon size={17} className="text-neutral-800" />
            )}
          </button>

          <button
            onClick={handleCartClick}
            className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 border border-neutral-200 dark:border-white/15 text-neutral-800 dark:text-neutral-200 hover:text-red-600 dark:hover:text-white shadow-sm active:scale-95"
            aria-label="سلة التسوق"
          >
            <ShoppingBag size={18} />
            <AnimatePresence>
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 flex items-center justify-center text-white font-mono font-bold rounded-full bg-red-600 border-2 border-white dark:border-[#0c090b] shadow-xs text-[9px] w-5 h-5"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </header>
  );
}
