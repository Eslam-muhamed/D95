import { X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="px-4 pt-4 pb-2 max-w-2xl mx-auto">
      <div
        className="flex items-center gap-3 px-4 rounded-full"
        style={{
          height: 48,
          background: 'rgba(139,26,42,0.1)',
          border: '1px solid rgba(139,26,42,0.3)',
          direction: 'rtl',
        }}
      >
        <Search size={18} style={{ color: '#C45C6A', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="ابحث في القائمة..."
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{
            color: 'var(--c-text-1, #f5ece8)',
            fontFamily: 'Cairo, sans-serif',
            caretColor: '#C45C6A',
          }}
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onChange('')}
              className="flex items-center justify-center rounded-full flex-shrink-0 cursor-pointer"
              style={{ width: 24, height: 24, background: 'rgba(139,26,42,0.35)' }}
            >
              <X size={14} style={{ color: '#F4C2C8' }} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
