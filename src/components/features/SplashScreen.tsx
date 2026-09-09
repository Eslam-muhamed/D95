import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
    onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    const [visible, setVisible] = useState(() => {
        try {
            return !sessionStorage.getItem('d95_splash_shown');
        } catch {
            return true;
        }
    });

    useEffect(() => {
        if (!visible) {
            onComplete();
            return;
        }
        try {
            sessionStorage.setItem('d95_splash_shown', '1');
        } catch {
            // Silently ignore storage quota or privacy mode errors
        }
        const t = setTimeout(() => setVisible(false), 1200);
        return () => clearTimeout(t);
    }, [visible, onComplete]);

    const floatingShapes = [
        { x: '10%', y: '15%', size: 14, delay: 0, dur: 3.2 },
        { x: '85%', y: '20%', size: 10, delay: 0.3, dur: 4.1 },
        { x: '75%', y: '70%', size: 16, delay: 0.6, dur: 3.7 },
        { x: '20%', y: '75%', size: 12, delay: 0.9, dur: 4.5 },
        { x: '50%', y: '10%', size: 8, delay: 1.2, dur: 3.0 },
    ];

    if (!visible) return null;

    return (
        <AnimatePresence onExitComplete={onComplete}>
            {visible && (
                <motion.div
                    key="splash"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    onClick={() => setVisible(false)}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
                    style={{ background: '#090707' }}
                >
                    {/* Background grid */}
                    <div className="absolute inset-0 opacity-5"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(155,28,28,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(155,28,28,0.3) 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                        }}
                    />

                    {/* Floating shapes */}
                    {floatingShapes.map((s, i) => (
                        <motion.div
                            key={i}
                            className="absolute"
                            style={{ left: s.x, top: s.y }}
                            animate={{ y: [0, -18, 0], rotate: [0, 8, 0] }}
                            transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <svg width={s.size} height={s.size} viewBox="0 0 20 20">
                                <path
                                    d="M10 2 C14 2 18 6 18 10 C18 15 14 18 10 18 C6 18 2 15 2 10 C2 6 6 2 10 2"
                                    fill="none"
                                    stroke="rgba(155,28,28,0.45)"
                                    strokeWidth="1.5"
                                />
                            </svg>
                        </motion.div>
                    ))}

                    {/* Main logo container */}
                    <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                        className="relative flex flex-col items-center"
                    >
                        {/* Glow */}
                        <div
                            className="absolute inset-0 blur-3xl opacity-20 rounded-full"
                            style={{ background: 'radial-gradient(circle, #9B1C1C 0%, transparent 70%)', transform: 'scale(2)' }}
                        />

                        {/* Brand name */}
                        <div className="relative text-center mb-2">
                            <h1
                                className="font-display brand-text-shimmer"
                                style={{ fontSize: 'clamp(8rem, 25vw, 14rem)', lineHeight: 1, letterSpacing: '0.02em' }}
                            >
                                D95
                            </h1>
                            {/* Drip decoration */}
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 flex justify-center gap-4">
                                {[0, 1, 2, 3].map(i => (
                                    <motion.div
                                        key={i}
                                        initial={{ scaleY: 0, opacity: 0 }}
                                        animate={{ scaleY: 1, opacity: 1 }}
                                        transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                                        className="origin-top"
                                        style={{
                                            width: 2,
                                            height: 8 + i * 3,
                                            background: 'var(--brand-primary)',
                                            borderRadius: '0 0 2px 2px',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="font-display text-lg tracking-widest mt-6"
                            style={{ color: 'var(--text-3)', letterSpacing: '0.3em' }}
                        >
                            GAMING & CAFÉ
                        </motion.p>

                        {/* Tagline */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                            className="text-xs tracking-widest mt-3 font-body"
                            style={{ color: 'var(--text-4)', letterSpacing: '0.25em' }}
                        >
                            PLAY · COMPETE · RELAX · REPEAT
                        </motion.p>
                    </motion.div>

                    {/* Steam wisps */}
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none">
                        {[0, 1, 2].map(i => (
                            <motion.svg
                                key={i}
                                width="20"
                                height="40"
                                viewBox="0 0 20 40"
                                className="absolute"
                                style={{ left: `${(i - 1) * 20}px`, top: '-30px' }}
                                initial={{ opacity: 0, y: 0 }}
                                animate={{ opacity: [0, 0.4, 0], y: -30, scaleX: [1, 1.3, 0.8] }}
                                transition={{ duration: 1.8, delay: 1.2 + i * 0.3, repeat: Infinity, ease: 'easeOut' }}
                            >
                                <path
                                    d="M10 35 C8 28 14 22 10 15 C6 8 12 3 10 0"
                                    fill="none"
                                    stroke="rgba(155,28,28,0.45)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </motion.svg>
                        ))}
                    </div>

                    {/* Loading dots */}
                    <div className="absolute bottom-16 flex gap-2">
                        {[0, 1, 2].map(i => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 rounded-full"
                                style={{ background: 'var(--brand-primary)' }}
                                animate={{ opacity: [0.2, 1, 0.2] }}
                                transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
