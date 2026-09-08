import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Sun, Moon } from 'lucide-react';
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
    const handle = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 px-4"
      style={{ height: 56, direction: 'rtl' }}
      animate={{
        backgroundColor: scrolled
          ? (theme === 'dark' ? 'rgba(15,6,8,0.88)' : 'rgba(253,248,248,0.94)')
          : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'blur(0px)',
        borderBottom: scrolled ? '1px solid rgba(139,26,42,0.2)' : '1px solid transparent',
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-4xl mx-auto h-full flex items-center justify-between">
        {/* Right side (RTL): Theme toggle & Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center rounded-full transition-all cursor-pointer"
            style={{ width: 44, height: 44, background: 'rgba(139,26,42,0.15)', border: '1px solid rgba(139,26,42,0.3)' }}
            aria-label="تبديل المظهر"
          >
            {theme === 'dark'
              ? <Sun size={18} style={{ color: '#F4C2C8' }} />
              : <Moon size={18} style={{ color: '#8B1A2A' }} />
            }
          </button>

          <Link
            to="/playstation"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-sm hover:scale-105"
            style={{
              background: 'rgba(139,26,42,0.15)',
              border: '1px solid rgba(139,26,42,0.35)',
              color: '#F4C2C8',
              fontFamily: 'Cairo, sans-serif',
              minHeight: 36,
            }}
            title="صالة البلايستيشن"
          >
            <span>🎮</span>
            <span className="hidden sm:inline">البلايستيشن</span>
          </Link>
        </div>

        {/* Center: Brand */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center cursor-pointer"
          style={{ background: 'transparent', border: 'none', padding: 0 }}
          aria-label="الرجوع للأعلى"
        >
          <span
            className="font-display font-bold brand-text"
            style={{ fontSize: 22, letterSpacing: '0.12em', fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            D95
          </span>
          <span style={{ fontSize: 9, letterSpacing: '0.4em', color: '#C45C6A', fontFamily: 'Cairo, sans-serif', textTransform: 'uppercase' }}>
            GAMING &amp; CAFÉ
          </span>
        </button>

        {/* Left side (RTL): Cart button */}
        <button
          onClick={handleCartClick}
          className="relative flex items-center justify-center rounded-full transition-all cursor-pointer"
          style={{ width: 44, height: 44, background: 'rgba(139,26,42,0.15)', border: '1px solid rgba(139,26,42,0.3)' }}
          aria-label="سلة التسوق"
        >
          <ShoppingCart size={20} style={{ color: 'var(--c-on-card, #F4C2C8)' }} />
          <AnimatePresence>
            {totalItems > 0 && (
              <motion.span
                key={totalItems}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 flex items-center justify-center text-white font-bold rounded-full"
                style={{ width: 20, height: 20, fontSize: 11, background: '#8B1A2A', border: '2px solid var(--c-bg, #0f0608)' }}
              >
                {totalItems > 99 ? '99+' : totalItems}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.header>
  );
}
