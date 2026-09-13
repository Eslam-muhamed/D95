import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SplashScene from './SplashScene';
import LogoReveal from './LogoReveal';

interface SplashScreenProps {
    onComplete: () => void;
    forceShow?: boolean;
    customLogo?: React.ReactNode;
}

export default function SplashScreen({
    onComplete,
    forceShow = false,
    customLogo,
}: SplashScreenProps) {
    const [visible, setVisible] = useState(() => {
        if (forceShow) return true;
        try {
            return !sessionStorage.getItem('d95_splash_shown');
        } catch {
            return true;
        }
    });

    const [phase, setPhase] = useState<'3d' | 'logo' | 'complete'>('3d');
    const [isReducedMotion, setIsReducedMotion] = useState(false);

    // 1. Accessibility: Detect prefers-reduced-motion
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mediaQuery.matches) {
            setIsReducedMotion(true);
            setPhase('logo'); // Skip 3D and go straight to clean logo reveal
        }

        const handleChange = (e: MediaQueryListEvent) => {
            if (e.matches) {
                setIsReducedMotion(true);
                setPhase('logo');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // 2. Mark splash as shown in sessionStorage
    const markDismissed = useCallback(() => {
        try {
            sessionStorage.setItem('d95_splash_shown', '1');
        } catch {
            // Silently ignore storage quota or privacy mode restrictions
        }
    }, []);

    // 3. User skip handler
    const handleSkip = () => {
        markDismissed();
        setVisible(false);
    };

    // 4. Sequence transitions
    const handle3DComplete = useCallback(() => {
        setPhase('logo');
    }, []);

    const handleLogoComplete = useCallback(() => {
        markDismissed();
        setVisible(false);
    }, [markDismissed]);

    if (!visible) return null;

    return (
        <AnimatePresence onExitComplete={onComplete}>
            {visible && (
                <motion.div
                    key="d95-cinematic-splash"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                    }}
                    className="fixed inset-0 z-[99999] w-full h-full bg-[#080406] select-none overflow-hidden"
                    style={{
                        backgroundImage:
                            'radial-gradient(ellipse at 50% 40%, rgba(22, 12, 18, 0.7) 0%, rgba(8, 4, 6, 0.98) 75%)',
                    }}
                >
                    {/* 3D WebGL Canvas Layer */}
                    {!isReducedMotion && phase === '3d' && (
                        <SplashScene
                            on3DComplete={handle3DComplete}
                            onSceneFallback={() => setPhase('logo')}
                        />
                    )}

                    {/* Logo Reveal Phase */}
                    {phase === 'logo' && (
                        <LogoReveal
                            onFinished={handleLogoComplete}
                            customLogo={customLogo}
                        />
                    )}

                    {/* Top Bar: Minimal Status & Quick Skip Button */}
                    <div className="absolute top-0 left-0 right-0 z-40 p-4 sm:p-6 flex items-center justify-between pointer-events-none">
                        {/* Subtle Brand Tag */}
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md text-[11px] font-bebas tracking-wider text-neutral-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span>D95 CINEMATIC</span>
                        </div>

                        {/* Minimalist Skip Button */}
                        <button
                            type="button"
                            onClick={handleSkip}
                            className="pointer-events-auto px-4 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-red-500/40 backdrop-blur-md text-xs font-bebas tracking-widest text-neutral-300 hover:text-white transition-all duration-200 active:scale-95 shadow-lg"
                        >
                            تخطي • SKIP
                        </button>
                    </div>

                    {/* Subtle Cinematic Vignette Overlay */}
                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.85)]" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
