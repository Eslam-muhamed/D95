import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Sun, Moon, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/stores/cartStore';
import { useTheme } from '@/stores/themeStore';

interface Props {
  onCartOpen?: () => void;
}

export default function TopHeader({ onCartOpen }: Props = {}) {
  const [scrolled, setScrolled] = useState(false);
  const { totalItems, openCart } = useCart();
  const { theme, toggleTheme } = useTheme();

  const handleCartClick = onCartOpen || openCart;

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 px-4 transition-all duration-200 ${
        theme === 'dark'
          ? 'bg-[#0c090b]/95 text-white border-b border-white/[0.08]'
          : 'bg-white/95 text-neutral-900 border-b border-neutral-200'
      } backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]`}
      style={{ height: 56, direction: 'rtl' }}
    >
      <div className="max-w-4xl mx-auto h-full flex items-center justify-between">
        {/* Right side (RTL): Theme toggle & Playstation navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center rounded-lg transition-all cursor-pointer w-9 h-9 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10"
            aria-label="تبديل المظهر"
          >
            {theme === 'dark' ? (
              <Sun size={17} className="text-amber-400" />
            ) : (
              <Moon size={17} className="text-neutral-700" />
            )}
          </button>

          <Link
            to="/playstation"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-red-950/70 border border-red-600/50 text-red-200 hover:text-white hover:bg-red-900/80 shadow-sm"
            title="صالة البلايستيشن"
          >
            <Gamepad2 size={14} className="text-red-400" />
            <span className="hidden sm:inline font-body">صالة البلايستيشن</span>
            <span className="sm:hidden font-body">PlayStation</span>
          </Link>
        </div>

        {/* Center: Brand */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center cursor-pointer group"
          style={{ background: 'transparent', border: 'none', padding: 0 }}
          aria-label="الرجوع للأعلى"
        >
          <div className="flex items-baseline leading-none">
            <span
              className="font-brush font-black text-xl text-neutral-100 group-hover:text-white transition-colors"
              style={{ transform: 'skewX(-4deg)' }}
            >
              D
            </span>
            <span
              className="font-brush font-black text-2xl text-red-500 group-hover:text-red-400 transition-colors -ml-0.5"
              style={{
                transform: 'skewX(-6deg)',
                textShadow: '0 0 10px rgba(220, 38, 38, 0.6)',
              }}
            >
              95
            </span>
          </div>
          <span
            className="text-[8px] font-black tracking-[0.3em] text-neutral-400 font-sans uppercase mt-0.5 group-hover:text-neutral-200 transition-colors"
          >
            GAMING &amp; CAFÉ
          </span>
        </button>

        {/* Left side (RTL): Cart button */}
        <button
          onClick={handleCartClick}
          className="relative flex items-center justify-center rounded-lg transition-all cursor-pointer w-9 h-9 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-neutral-200 hover:text-white"
          aria-label="سلة التسوق"
        >
          <ShoppingCart size={18} />
          <AnimatePresence>
            {totalItems > 0 && (
              <motion.span
                key={totalItems}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1.5 -right-1.5 flex items-center justify-center text-white font-mono font-black rounded-full bg-red-600 border-2 border-[#0c090b] shadow-[0_0_8px_rgba(220,38,38,0.7)] text-[10px] w-5 h-5"
              >
                {totalItems > 99 ? '99+' : totalItems}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </header>
  );
}
