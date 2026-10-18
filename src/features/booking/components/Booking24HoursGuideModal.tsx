import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Moon,
    Sun,
    Clock,
    Sparkles,
    CheckCircle2,
    X,
    HelpCircle,
    Zap,
    Compass
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
    const [dontShowAgain, setDontShowAgain] = useState(false);

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleClose = () => {
        if (dontShowAgain) {
            try {
                localStorage.setItem(STORAGE_KEY, 'true');
            } catch {
                // Ignore storage errors
            }
        }
        playPs5NavigateSound();
        onClose();
    };

    const handleApply = () => {
        if (dontShowAgain) {
            try {
                localStorage.setItem(STORAGE_KEY, 'true');
            } catch {
                // Ignore
            }
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
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
                    dir="rtl"
                >
                    {/* Backdrop with Blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/75 dark:bg-black/85 backdrop-blur-md"
                    />

                    {/* Modal Window Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 15 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-xl bg-white dark:bg-[#151014] border border-neutral-200 dark:border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden my-auto z-10 text-neutral-900 dark:text-white"
                    >
                        {/* Glowing Top Ambient Accent */}
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500" />

                        {/* Modal Header */}
                        <div className="relative p-4 sm:p-6 pb-3 sm:pb-4 border-b border-neutral-100 dark:border-white/[0.06] flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)] shrink-0">
                                    <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 dark:text-white">
                                            دليل حجز الـ 24 ساعة ومواعيد السهرة 🌙
                                        </h3>
                                    </div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                        إزاي تحجز في أي وقت من الليل أو النهار بكل سهولة وبدون لخبطة
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/10 flex items-center justify-center text-neutral-500 dark:text-neutral-300 transition-colors cursor-pointer shrink-0"
                                title="إغلاق النافذة"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Scrollable Content */}
                        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
                            {/* 1. Main Visual Comparison: Noon vs Midnight */}
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                                    <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                                    <span>الفرق بين ١٢ الظهر و ١٢ بالليل (اللخبطة الأشهر):</span>
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {/* ☀️ 12 الظهر */}
                                    <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/25 relative overflow-hidden flex flex-col justify-between">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-bold">
                                                <Sun className="w-4 h-4 text-amber-500" />
                                                <span>١٢ الظهر (النهار)</span>
                                            </div>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                                                وقت النهار ☀️
                                            </span>
                                        </div>

                                        <div className="bg-white/90 dark:bg-black/40 rounded-xl p-2.5 text-center border border-amber-500/20 shadow-xs mb-2">
                                            <span className="font-mono text-2xl font-black text-neutral-900 dark:text-white">
                                                12:00 <span className="text-amber-600 dark:text-amber-400 text-lg">م</span>
                                            </span>
                                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                (وقت الظهر والشمس طالعة)
                                            </p>
                                        </div>

                                        <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                            لو حابب تحجز في عز النهار، اختر في العداد: <strong>12</strong> والفترة <strong>م</strong> (مساءً).
                                        </p>
                                    </div>

                                    {/* 🌙 12 بالليل */}
                                    <div className="p-3 sm:p-3.5 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/30 border-2 border-indigo-500/40 relative overflow-hidden flex flex-col justify-between shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-300 text-xs font-extrabold">
                                                <Moon className="w-4 h-4 text-indigo-400" />
                                                <span>١٢ بالليل (منتصف الليل)</span>
                                            </div>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/30 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                وقت السهرة 🎮
                                            </span>
                                        </div>

                                        <div className="bg-white/90 dark:bg-black/60 rounded-xl p-2.5 text-center border border-indigo-500/30 shadow-xs mb-2">
                                            <span className="font-mono text-2xl font-black text-neutral-900 dark:text-white">
                                                12:00 <span className="text-emerald-500 text-lg">ص</span>
                                            </span>
                                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
                                                (السهرة اللي بتدور عليها!)
                                            </p>
                                        </div>

                                        <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                            <strong>١٢ بالليل رسمياً تُكتب (ص):</strong> لأن التوقيت العالمي يعتبر منتصف الليل هو أول دقيقة في اليوم الجديد.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Concrete Practical Example: 12 AM to 1 AM */}
                            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border border-red-500/30 space-y-2.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400">
                                    <Sparkles className="w-4 h-4 text-red-500" />
                                    <span>مثال تطبيقي: عاوز تحجز من ١٢ بالليل لـ ١ بالليل؟</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/40 border border-neutral-200/80 dark:border-white/[0.06] flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-red-500 text-white font-mono text-xs flex items-center justify-center font-bold shrink-0">1</div>
                                        <div>
                                            <span className="text-[10px] text-neutral-400 block">الساعة في العداد</span>
                                            <span className="font-mono font-bold text-neutral-900 dark:text-white">اختر 12</span>
                                        </div>
                                    </div>

                                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/40 border border-neutral-200/80 dark:border-white/[0.06] flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-red-500 text-white font-mono text-xs flex items-center justify-center font-bold shrink-0">2</div>
                                        <div>
                                            <span className="text-[10px] text-neutral-400 block">الفترة في العداد</span>
                                            <span className="font-mono font-bold text-emerald-500 dark:text-emerald-400">اختر (ص) وليس (م)</span>
                                        </div>
                                    </div>

                                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/40 border border-neutral-200/80 dark:border-white/[0.06] flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-red-500 text-white font-mono text-xs flex items-center justify-center font-bold shrink-0">3</div>
                                        <div>
                                            <span className="text-[10px] text-neutral-400 block">المدة المطلوبة</span>
                                            <span className="font-mono font-bold text-neutral-900 dark:text-white">اختر ساعة (1h)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1.5">
                                    <div className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span>ستبدأ جلستك <strong>12:00 ص</strong> وتنتهي <strong>01:00 ص</strong>.</span>
                                    </div>

                                    {onApplyMidnightExample && (
                                        <button
                                            type="button"
                                            onClick={handleApply}
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md hover:shadow-red-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                                        >
                                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                                            <span>⚡ اضبط العداد على 12:00 بالليل الآن</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* 3. Easy Alternative: Timeline Schedule Bar */}
                            <div className="p-3.5 rounded-2xl bg-neutral-100/80 dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/[0.06] flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-xs text-neutral-900 dark:text-white">
                                        💡 طريقة أسهل بكثير: استعمل "مخطط المواعيد"
                                    </h4>
                                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                                        مش محتاج تحتار بين (ص) و (م)! افتح <strong>مخطط المواعيد</strong> بالأعلى، وانقر مباشرة على الخانة الخضراء للساعة اللي تعجبك، وسيتم ضبط العداد تلقائياً بلمسة واحدة.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer Controls */}
                        <div className="p-4 sm:p-5 border-t border-neutral-100 dark:border-white/[0.06] bg-neutral-50/80 dark:bg-[#120d10] flex flex-col sm:flex-row items-center justify-between gap-3">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-neutral-500 dark:text-neutral-400">
                                <input
                                    type="checkbox"
                                    checked={dontShowAgain}
                                    onChange={(e) => setDontShowAgain(e.target.checked)}
                                    className="w-4 h-4 rounded-md accent-red-600 cursor-pointer"
                                />
                                <span>عدم إظهار هذه الإرشادات تلقائياً مرة أخرى</span>
                            </label>

                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-full sm:w-auto px-6 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                            >
                                فهمت النظام، متابعة الحجز 🎮
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
