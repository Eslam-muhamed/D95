import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Moon,
    Calendar,
    Clock,
    X,
    Zap,
    CheckCircle2
} from 'lucide-react';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';

interface Booking24HoursGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyMidnightExample?: () => void;
}

const STORAGE_KEY = 'd95_has_seen_24h_guide_v1';

export default function Booking24HoursGuideModal({
    isOpen,
    onClose,
    onApplyMidnightExample,
}: Booking24HoursGuideModalProps) {
    const handleClose = () => {
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
        } catch {
            // Ignore
        }
        playPs5NavigateSound();
        onClose();
    };

    const handleApply = () => {
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
        } catch {
            // Ignore
        }
        playPs5SelectSound();
        if (onApplyMidnightExample) {
            onApplyMidnightExample();
        }
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
                    dir="rtl"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Compact Card Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 380 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md bg-white dark:bg-[#161114] border border-neutral-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto z-10 text-neutral-900 dark:text-white"
                    >
                        {/* Red Accent Bar */}
                        <div className="h-1.5 w-full bg-red-600" />

                        {/* Header */}
                        <div className="p-4 sm:p-5 pb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-600 dark:text-red-500 flex items-center justify-center shrink-0">
                                    <Moon className="w-5 h-5" />
                                </div>
                                <h3 className="font-extrabold text-base text-neutral-900 dark:text-white">
                                    إزاي تحجز من ١٢ بالليل لـ ١ بالليل؟ 🌙
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content: 2 Simple Steps */}
                        <div className="p-4 sm:p-5 pt-2 space-y-3">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                لسهرة الليلة، نفّذ الخطوتين دول في ثانيتين بس:
                            </p>

                            {/* Step 1 */}
                            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-black/40 border border-neutral-200/80 dark:border-white/[0.08] flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 font-mono font-black text-sm flex items-center justify-center shrink-0">
                                    1
                                </div>
                                <div className="text-xs">
                                    <span className="font-bold text-neutral-900 dark:text-white block">
                                        اختر في التقويم تاريخ <span className="text-amber-500 font-extrabold">"غداً"</span> 📅
                                    </span>
                                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                        لأن الساعة لما بتدق 12 بالليل، التقويم بيقلب لليوم الجديد.
                                    </span>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-black/40 border border-neutral-200/80 dark:border-white/[0.08] flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 font-mono font-black text-sm flex items-center justify-center shrink-0">
                                    2
                                </div>
                                <div className="text-xs">
                                    <span className="font-bold text-neutral-900 dark:text-white block">
                                        اختر الساعة <span className="font-mono text-emerald-500 font-extrabold">12:00</span> والفترة <span className="text-emerald-500 font-extrabold">(ص)</span> ⏰
                                    </span>
                                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                        (ص = سهرة منتصف الليل، م = وقت الظهر).
                                    </span>
                                </div>
                            </div>

                            {/* Result banner */}
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold px-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span>النتيجة: جلستك من 12:00 ص إلى 01:00 ص</span>
                                </div>
                                <span className="font-mono text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded-md">ساعة</span>
                            </div>

                            {/* Direct Action Button */}
                            {onApplyMidnightExample && (
                                <button
                                    type="button"
                                    onClick={handleApply}
                                    className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-600/25 active:scale-95 transition-all cursor-pointer"
                                >
                                    <Zap className="w-4 h-4 text-amber-300" />
                                    <span>⚡ اضبط لي الموعد تلقائياً الآن</span>
                                </button>
                            )}

                            {/* Dismiss button */}
                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-full py-2 text-center text-xs font-semibold text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                            >
                                فهمت، سأختار بنفسي 👍
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
