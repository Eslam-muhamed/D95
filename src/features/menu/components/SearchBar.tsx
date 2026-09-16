import { X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="px-4 pt-3 pb-1 max-w-2xl mx-auto">
      <div className="flex items-center gap-2.5 px-3.5 rounded-xl bg-white dark:bg-[#120e10] border border-neutral-200 dark:border-white/[0.08] focus-within:border-red-600 focus-within:shadow-[0_0_15px_rgba(220,38,38,0.15)] transition-all h-11 shadow-sm dark:shadow-none" dir="rtl">
        <Search size={16} className="text-neutral-400 shrink-0" />
        <input
          type="text"
          placeholder="ابحث عن مشروب، قهوة، أو وجبة سريعة..."
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 font-body"
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onChange('')}
              className="flex items-center justify-center rounded-md shrink-0 cursor-pointer w-6 h-6 bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.15] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
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
