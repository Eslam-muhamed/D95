import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Coffee, Sparkles, Zap } from 'lucide-react';

interface SplashScreenProps {
    onComplete: () => void;
}

const AMBIENT_MOTES = [
    { left: '12%', top: '22%', size: 4, dur: 4.8, delay: 0 },
    { left: '84%', top: '26%', size: 6, dur: 5.4, delay: 0.4 },
    { left: '72%', top: '78%', size: 5, dur: 4.9, delay: 0.7 },
    { left: '22%', top: '82%', size: 4, dur: 5.8, delay: 1.1 },
    { left: '48%', top: '12%', size: 3, dur: 4.1, delay: 0.2 },
    { left: '90%', top: '60%', size: 5, dur: 5.2, delay: 1.4 },
    { left: '8%', top: '55%', size: 4, dur: 4.5, delay: 0.9 },
];

const STATUS_STEPS = [
    { threshold: 30, text: '⚡ جاري تشغيل منصات الألعاب وشاشات 4K...' },
    { threshold: 65, text: '☕ تجهيز ركن القهوة المختصة والضيافة...' },
    { threshold: 90, text: '🎮 تهيئة صالات VIP ونظام الصوت المحيطي...' },
    { threshold: 100, text: '✨ الصالة جاهزة بالكامل • أهلاً بك في D95' },
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
        // 2500ms (2.5s) allows comfortable reading of animations and stages
        const duration = 2500;
        let animationFrameId: number;

        const step = (now: number) => {
            const elapsed = now - startTime;
            // Cinematic cubic easing for realistic loading acceleration & smooth finish
            const linearProgress = Math.min(1, elapsed / duration);
            // Ease-out with a slight plateau at the end
            const easedProgress = Math.min(100, Math.round(
                linearProgress < 0.8
                    ? (Math.pow(linearProgress / 0.8, 1.2) * 88)
                    : 88 + (Math.pow((linearProgress - 0.8) / 0.2, 0.9) * 12)
            ));

            setProgress(easedProgress);

            if (elapsed < duration) {
                animationFrameId = requestAnimationFrame(step);
            } else {
                setTimeout(() => {
                    setVisible(false);
                }, 180);
            }
        };

        animationFrameId = requestAnimationFrame(step);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [visible, onComplete]);

    const currentStatus = STATUS_STEPS.find(s => progress <= s.threshold)?.text || STATUS_STEPS[STATUS_STEPS.length - 1].text;

    if (!visible) return null;

    return (
        <AnimatePresence onExitComplete={onComplete}>
            {visible && (
                <motion.div
                    key="d95-splash"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(12px)' }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    onClick={handleDismiss}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden cursor-pointer bg-[#050204]"
                    style={{
                        backgroundImage: 'radial-gradient(ellipse at 50% 40%, rgba(185,28,48,0.22) 0%, rgba(14,6,9,0.92) 55%, #050204 100%)',
                    }}
                >
                    {/* 1. CINEMATIC AMBIENT LIGHT & GRID */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        {/* High-tech Subtle Grid */}
                        <div
                            className="absolute inset-0 opacity-[0.03]"
                            style={{
                                backgroundImage:
                                    'linear-gradient(rgba(244,63,94,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(244,63,94,0.35) 1px, transparent 1px)',
                                backgroundSize: '40px 40px',
                            }}
                        />

                        {/* Top Ambient Glow */}
                        <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(225,29,72,0.22)_0%,transparent_70%)] blur-3xl" />

                        {/* Bottom Warm Ambient Glow */}
                        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.14)_0%,transparent_70%)] blur-3xl" />

                        {/* Floating Ambient Embers */}
                        {AMBIENT_MOTES.map((mote, idx) => (
                            <motion.div
                                key={idx}
                                className="absolute rounded-full pointer-events-none"
                                style={{
                                    left: mote.left,
                                    top: mote.top,
                                    width: mote.size,
                                    height: mote.size,
                                    background:
                                        idx % 2 === 0
                                            ? 'rgba(239, 68, 68, 0.7)'
                                            : 'rgba(245, 158, 11, 0.7)',
                                    boxShadow:
                                        idx % 2 === 0
                                            ? '0 0 12px rgba(239, 68, 68, 0.9)'
                                            : '0 0 12px rgba(245, 158, 11, 0.9)',
                                }}
                                animate={{
                                    y: [0, -32, 0],
                                    opacity: [0.2, 0.9, 0.2],
                                    scale: [1, 1.35, 1],
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

                    {/* 2. TOP BADGE: SYSTEM STATUS & VENUE */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
                        className="relative z-10 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl text-[11px] sm:text-xs font-mono text-neutral-300 tracking-wider shadow-lg shadow-black/40"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="font-bold tracking-widest text-neutral-200">D95 SYSTEM</span>
                        <span className="text-neutral-600">•</span>
                        <span className="text-red-400 font-semibold">VIP ENTERTAINMENT</span>
                    </motion.div>

                    {/* 3. CENTER HERO: EMBLEM & MODERN TYPOGRAPHY */}
                    <motion.div
                        initial={{ scale: 0.88, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-10 flex flex-col items-center text-center my-auto w-full max-w-sm"
                    >
                        {/* Orbiting Tech Crest */}
                        <div className="relative mb-5 sm:mb-7 flex items-center justify-center">
                            {/* Outer Spinning Ring */}
                            <motion.div
                                className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-red-500/25 border-dashed pointer-events-none"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                            />

                            {/* Secondary Pulse Ring */}
                            <motion.div
                                className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-amber-500/20 pointer-events-none"
                                animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                            />

                            {/* Center Glass Pod */}
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-[#220c13]/90 via-[#16060b]/95 to-[#0b0306] border border-red-500/45 shadow-[0_0_40px_rgba(225,29,72,0.35),inset_0_1px_15px_rgba(255,255,255,0.1)] flex items-center justify-center backdrop-blur-2xl">
                                {/* Tech Corner Indicators */}
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_#f43f5e]" />
                                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />

                                <div className="flex items-center gap-2 text-neutral-100">
                                    <Gamepad2 className="w-8 h-8 sm:w-9 sm:h-9 text-red-500 drop-shadow-[0_0_14px_rgba(239,68,68,0.85)]" />
                                    <span className="w-0.5 h-6 bg-gradient-to-b from-red-500/60 to-amber-500/60 rounded-full" />
                                    <Coffee className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 drop-shadow-[0_0_14px_rgba(245,158,11,0.85)]" />
                                </div>
                            </div>
                        </div>

                        {/* Master Brand Typography with Dynamic Glow */}
                        <div className="relative flex items-baseline justify-center select-none" dir="ltr">
                            <span className="font-brush font-black text-7xl sm:text-9xl text-white tracking-tight drop-shadow-[0_8px_30px_rgba(0,0,0,0.95)]">
                                D
                            </span>
                            <span className="font-brush font-black text-7xl sm:text-9xl text-transparent bg-clip-text bg-gradient-to-br from-red-500 via-rose-500 to-amber-500 -ml-1 drop-shadow-[0_0_45px_rgba(239,68,68,0.85)]">
                                95
                            </span>
                            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-red-500 shadow-[0_0_16px_#ef4444] mb-3 sm:mb-4 ml-1.5 animate-pulse" />
                        </div>

                        {/* Futuristic Category Capsule */}
                        <div className="mt-3 sm:mt-4 flex items-center gap-2 px-4 sm:px-5 py-1.5 rounded-full bg-white/[0.04] border border-red-500/35 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            <span className="font-brush text-xs sm:text-sm font-bold tracking-[0.25em] text-neutral-100">
                                GAMING LOUNGE &amp; CAFÉ
                            </span>
                        </div>

                        {/* Hospitality Arabic Tagline */}
                        <p className="mt-3.5 text-xs sm:text-sm text-neutral-300 font-body font-medium tracking-wide">
                            أقوى تجربة ألعاب PS5 • قهوة مختصة وضيافة راقية
                        </p>
                    </motion.div>

                    {/* 4. BOTTOM: SEGMENTED LASER PROGRESS & DYNAMIC STATUS */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                        className="relative z-10 w-full max-w-xs sm:max-w-sm flex flex-col items-center gap-3.5"
                    >
                        {/* High-Tech Glowing Laser Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-white/[0.07] overflow-hidden relative border border-white/10 shadow-inner p-0.5">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 shadow-[0_0_18px_rgba(244,63,94,0.95)] relative"
                                style={{ width: `${progress}%` }}
                            >
                                {/* Glowing Head Particle */}
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_12px_#fff] -mr-1" />
                            </motion.div>
                        </div>

                        {/* Dynamic Status Text & Percentage */}
                        <div className="w-full flex items-center justify-between text-xs text-neutral-400 font-body px-1">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-neutral-200 tabular-nums text-xs">
                                <Zap size={13} className="text-amber-400" />
                                <span>{progress}%</span>
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={currentStatus}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.25 }}
                                    className="text-neutral-300 font-medium text-right text-[11px] sm:text-xs"
                                >
                                    {currentStatus}
                                </motion.span>
                            </AnimatePresence>
                        </div>

                        {/* Tap to Skip Hint */}
                        <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="pt-1 flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors py-1 px-3 rounded-full bg-white/[0.03] border border-white/5"
                        >
                            <span>انقر في أي مكان للتخطي الفوري</span>
                            <span className="text-amber-400 text-xs animate-bounce">⚡</span>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
