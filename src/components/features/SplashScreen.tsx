import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Coffee, Sparkles } from 'lucide-react';

interface SplashScreenProps {
    onComplete: () => void;
}

const AMBIENT_MOTES = [
    { left: '15%', top: '25%', size: 4, dur: 4.2, delay: 0 },
    { left: '80%', top: '30%', size: 6, dur: 5.1, delay: 0.5 },
    { left: '70%', top: '75%', size: 5, dur: 4.6, delay: 0.8 },
    { left: '25%', top: '80%', size: 3, dur: 5.5, delay: 1.2 },
    { left: '50%', top: '15%', size: 4, dur: 3.8, delay: 0.2 },
    { left: '88%', top: '65%', size: 5, dur: 4.9, delay: 1.5 },
];

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    const [visible, setVisible] = useState(() => {
        try {
            return !sessionStorage.getItem('d95_splash_shown');
        } catch {
            return true;
        }
    });

    const [progress, setProgress] = useState(0);

    const handleDismiss = () => {
        try {
            sessionStorage.setItem('d95_splash_shown', '1');
        } catch {
            // Silently ignore storage quota or privacy mode errors
        }
        setVisible(false);
    };

    useEffect(() => {
        if (!visible) {
            onComplete();
            return;
        }

        try {
            sessionStorage.setItem('d95_splash_shown', '1');
        } catch {
            // Silently ignore storage errors
        }

        const startTime = performance.now();
        const duration = 1200; // 1.2s total smooth cinematic duration
        let animationFrameId: number;

        const step = (now: number) => {
            const elapsed = now - startTime;
            const nextProgress = Math.min(100, Math.round((elapsed / duration) * 100));
            setProgress(nextProgress);

            if (elapsed < duration) {
                animationFrameId = requestAnimationFrame(step);
            } else {
                setTimeout(() => {
                    setVisible(false);
                }, 120);
            }
        };

        animationFrameId = requestAnimationFrame(step);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [visible, onComplete]);

    const getStatusText = (val: number) => {
        if (val < 45) return 'تهيئة أنظمة الألعاب والصالة...';
        if (val < 85) return 'تجهيز غرف VIP والمنيو...';
        return 'جاهز للانطلاق • مرحباً بك في D95';
    };

    if (!visible) return null;

    return (
        <AnimatePresence onExitComplete={onComplete}>
            {visible && (
                <motion.div
                    key="d95-splash"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.03, filter: 'blur(8px)' }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    onClick={handleDismiss}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden cursor-pointer bg-[#080406]"
                    style={{
                        backgroundImage: 'radial-gradient(ellipse at center, rgba(155,28,28,0.18) 0%, rgba(9,7,7,0.95) 75%)',
                    }}
                >
                    {/* 1. CINEMATIC AMBIENT BACKGROUND */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        {/* High-tech Subtle Grid */}
                        <div
                            className="absolute inset-0 opacity-[0.04]"
                            style={{
                                backgroundImage:
                                    'linear-gradient(rgba(244,63,94,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(244,63,94,0.3) 1px, transparent 1px)',
                                backgroundSize: '48px 48px',
                            }}
                        />

                        {/* Top Ambient Glow */}
                        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[radial-gradient(ellipse_at_center,rgba(225,29,72,0.18)_0%,transparent_70%)] blur-2xl" />

                        {/* Floating Ambient Embers */}
                        {AMBIENT_MOTES.map((mote, idx) => (
                            <motion.div
                                key={idx}
                                className="absolute rounded-full"
                                style={{
                                    left: mote.left,
                                    top: mote.top,
                                    width: mote.size,
                                    height: mote.size,
                                    background:
                                        idx % 2 === 0
                                            ? 'rgba(239, 68, 68, 0.65)'
                                            : 'rgba(245, 158, 11, 0.65)',
                                    boxShadow:
                                        idx % 2 === 0
                                            ? '0 0 10px rgba(239, 68, 68, 0.8)'
                                            : '0 0 10px rgba(245, 158, 11, 0.8)',
                                }}
                                animate={{
                                    y: [0, -28, 0],
                                    opacity: [0.25, 0.85, 0.25],
                                    scale: [1, 1.3, 1],
                                }}
                                transition={{
                                    duration: mote.dur,
                                    delay: mote.delay,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />
                        ))}
                    </div>

                    {/* 2. TOP BADGE: SYSTEM VERSION & VENUE */}
                    <motion.div
                        initial={{ opacity: 0, y: -15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="relative z-10 flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md text-xs font-bebas tracking-wider text-neutral-400 shadow-sm"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>D95 LOUNGE &amp; CAFÉ</span>
                        <span className="text-neutral-600">•</span>
                        <span className="text-red-400 font-bold">VIP EXPERIENCE</span>
                    </motion.div>

                    {/* 3. CENTER HERO: EMBLEM & MASTER LOGO */}
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-10 flex flex-col items-center text-center my-auto"
                    >
                        {/* Dual Gaming & Café Icon Crest */}
                        <div className="relative mb-4 sm:mb-6">
                            {/* Radial Glow */}
                            <div className="absolute inset-0 -m-6 rounded-full bg-gradient-to-tr from-red-600/35 via-rose-500/20 to-amber-500/20 blur-2xl pointer-events-none animate-pulse" />

                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-[#240e14] to-[#120609] border-2 border-red-500/40 shadow-[0_0_35px_rgba(225,29,72,0.35)] flex items-center justify-center backdrop-blur-xl">
                                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_6px_#f43f5e]" />
                                <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />

                                <div className="flex items-center gap-1.5 text-neutral-100">
                                    <Gamepad2 className="w-8 h-8 sm:w-9 sm:h-9 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]" />
                                    <span className="w-0.5 h-6 bg-white/20 rounded-full" />
                                    <Coffee className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.7)]" />
                                </div>
                            </div>
                        </div>

                        {/* Master Brand Typography */}
                        <div className="flex items-baseline justify-center select-none" dir="ltr">
                            <span className="font-brush font-black text-7xl sm:text-9xl text-white tracking-tight drop-shadow-[0_6px_25px_rgba(0,0,0,0.95)]">
                                D
                            </span>
                            <span className="font-brush font-black text-7xl sm:text-9xl text-[#E5252A] -ml-1 drop-shadow-[0_0_40px_rgba(229,37,42,0.75)]">
                                95
                            </span>
                            <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-red-500 shadow-[0_0_14px_#ef4444] mb-2 sm:mb-4 ml-1.5 animate-pulse" />
                        </div>

                        {/* Category Capsule */}
                        <div className="mt-3 flex items-center gap-2 px-4 sm:px-5 py-1.5 rounded-full bg-white/[0.04] border border-red-500/30 backdrop-blur-md shadow-lg">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-bebas text-sm sm:text-base font-bold tracking-[0.25em] text-neutral-200">
                                GAMING LOUNGE &amp; CAFÉ
                            </span>
                        </div>

                        {/* Hospitality Tagline */}
                        <p className="mt-3 text-xs sm:text-sm text-neutral-400 font-body font-medium tracking-wide">
                            أقوى تجربة ألعاب PS5 • ضيافة كافيه راقية
                        </p>
                    </motion.div>

                    {/* 4. BOTTOM: HIGH-TECH LASER PROGRESS & SKIP HINT */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="relative z-10 w-full max-w-xs sm:max-w-sm flex flex-col items-center gap-3"
                    >
                        {/* Laser Progress Bar */}
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden relative border border-white/5 shadow-inner">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-red-600 via-rose-400 to-amber-400 shadow-[0_0_14px_rgba(244,63,94,0.9)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Status Info Row */}
                        <div className="w-full flex items-center justify-between text-[11px] text-neutral-400 font-body px-1">
                            <span className="font-mono font-bold text-neutral-300 tabular-nums">
                                {progress}%
                            </span>
                            <span className="text-neutral-300 font-medium">
                                {getStatusText(progress)}
                            </span>
                        </div>

                        {/* Tap Anywhere to Skip */}
                        <div className="pt-2 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors">
                            <span>انقر في أي مكان للدخول السريع</span>
                            <span className="text-red-500 animate-bounce">⚡</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
