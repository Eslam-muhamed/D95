import { X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="px-4 pt-3 pb-1 max-w-2xl mx-auto">
      <div className="flex items-center gap-2.5 px-3.5 rounded-xl bg-[#120e10] border border-white/[0.08] focus-within:border-red-600 focus-within:shadow-[0_0_15px_rgba(220,38,38,0.2)] transition-all h-11" dir="rtl">
        <Search size={16} className="text-neutral-400 shrink-0" />
        <input
          type="text"
          placeholder="ابحث عن مشروب، قهوة، أو وجبة سريعة..."
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-xs sm:text-sm text-white placeholder-neutral-500 font-body"
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onChange('')}
              className="flex items-center justify-center rounded-md shrink-0 cursor-pointer w-6 h-6 bg-white/[0.08] hover:bg-white/[0.15] text-neutral-300 hover:text-white transition-colors"
              aria-label="مسح البحث"
            >
              <X size={13} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
