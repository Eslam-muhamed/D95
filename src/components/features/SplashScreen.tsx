import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { playGrandOpeningSound } from '@/lib/sound';

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
    
    const [isOpening, setIsOpening] = useState(false);

    useEffect(() => {
        if (!visible) {
            onComplete();
        }
    }, [visible, onComplete]);

    const handleEnter = () => {
        setIsOpening(true);
        playGrandOpeningSound();
        try {
            sessionStorage.setItem('d95_splash_shown', '1');
        } catch {
            // ignore
        }

        // Wait for curtain animation to finish, then unmount
        setTimeout(() => {
            setVisible(false);
        }, 1200); // 1.2s matches curtain duration
    };

    if (!visible) return null;

    return (
        <AnimatePresence>
            {visible && (
                <div className="fixed inset-0 z-[9999] bg-[#0a0505] flex items-center justify-center overflow-hidden selection:bg-red-600/30" dir="ltr">
                    {/* The Background Spotlight / Stage */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,29,72,0.15)_0%,rgba(10,5,5,1)_70%)]" />

                    {/* Left Curtain */}
                    <motion.div
                        initial={{ x: 0 }}
                        animate={isOpening ? { x: '-100%' } : { x: 0 }}
                        transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                        className="absolute top-0 left-0 bottom-0 w-[55%] z-20 origin-left"
                        style={{
                            background: 'linear-gradient(90deg, #2a0000 0%, #600000 15%, #3a0000 30%, #700000 45%, #400000 60%, #800000 75%, #4a0000 90%, #900000 100%)',
                            boxShadow: 'inset -30px 0 60px rgba(0,0,0,0.9), 20px 0 40px rgba(0,0,0,0.9)',
                            borderRight: '3px solid rgba(255,100,100,0.2)',
                            borderBottomRightRadius: '10% 20%',
                        }}
                    >
                        {/* Folds */}
                        <div className="absolute inset-0 opacity-50 bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(0,0,0,0.5)_40px,transparent_60px)]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                    </motion.div>

                    {/* Right Curtain */}
                    <motion.div
                        initial={{ x: 0 }}
                        animate={isOpening ? { x: '100%' } : { x: 0 }}
                        transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                        className="absolute top-0 right-0 bottom-0 w-[55%] z-20 origin-right"
                        style={{
                            background: 'linear-gradient(-90deg, #2a0000 0%, #600000 15%, #3a0000 30%, #700000 45%, #400000 60%, #800000 75%, #4a0000 90%, #900000 100%)',
                            boxShadow: 'inset 30px 0 60px rgba(0,0,0,0.9), -20px 0 40px rgba(0,0,0,0.9)',
                            borderLeft: '3px solid rgba(255,100,100,0.2)',
                            borderBottomLeftRadius: '10% 20%',
                        }}
                    >
                        {/* Folds */}
                        <div className="absolute inset-0 opacity-50 bg-[repeating-linear-gradient(-90deg,transparent,transparent_20px,rgba(0,0,0,0.5)_40px,transparent_60px)]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                    </motion.div>

                    {/* Center Content (Fades out when opening) */}
                    <motion.div
                        animate={isOpening ? { opacity: 0, scale: 1.1 } : { opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative z-30 flex flex-col items-center justify-between h-full w-full py-12 px-4"
                    >
                        {/* Top Indicators */}
                        <div className="flex items-center justify-end w-full max-w-md px-4 pt-safe" dir="rtl">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                <span className="text-[10px] font-bold text-neutral-400 tracking-wider">D95 GATEWAY</span>
                            </div>
                        </div>

                        {/* Portal Badge */}
                        <div className="mt-4 flex items-center gap-2 bg-black/40 border border-emerald-500/30 px-5 py-1.5 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.15)]" dir="rtl">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] sm:text-xs font-bold text-emerald-400">مفتوح الآن • OFFICIAL PORTAL</span>
                        </div>

                        {/* Logo & Main Title */}
                        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm relative mt-8">
                            {/* Glowing backdrop for logo */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-600/20 blur-3xl rounded-full" />
                            
                            <picture className="w-64 sm:w-80 z-10">
                                <source srcSet="/new-logo.webp" type="image/webp" />
                                <img 
                                    src="/new-logo.png" 
                                    alt="D95" 
                                    loading="eager"
                                    fetchPriority="high"
                                    decoding="async"
                                    className="w-full h-auto object-contain drop-shadow-[0_0_40px_rgba(220,38,38,0.6)]" 
                                />
                            </picture>
                            
                            <div className="mt-4 flex items-center gap-4 text-[10px] sm:text-xs font-bold text-neutral-400 tracking-[0.3em] font-bebas z-10">
                                <span className="w-8 h-px bg-red-600/50" />
                                <span>GAMING & CAFÉ</span>
                                <span className="w-8 h-px bg-red-600/50" />
                            </div>

                            <div className="mt-8 flex flex-col items-center z-10">
                                <h1 className="font-bebas text-2xl sm:text-3xl font-bold tracking-[0.4em] text-neutral-300 mb-2">
                                    GRAND OPENING
                                </h1>
                                <h2 className="font-brush text-5xl sm:text-6xl text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)] transform -rotate-2">
                                    WELCOME
                                </h2>
                            </div>
                        </div>

                        {/* Working Hours */}
                        <div className="w-full max-w-sm flex items-center justify-between border-t border-white/10 pt-6 mt-8">
                            <div className="flex flex-col items-center text-center w-1/2 border-r border-white/10">
                                <span className="text-[10px] font-bold text-neutral-500 tracking-widest mb-1">FROM</span>
                                <div className="font-bebas text-3xl sm:text-4xl text-neutral-300 tracking-wider">08:00 <span className="text-red-600 text-xl">AM</span></div>
                            </div>
                            <div className="flex flex-col items-center text-center w-1/2">
                                <span className="text-[10px] font-bold text-neutral-500 tracking-widest mb-1">TO</span>
                                <div className="font-bebas text-3xl sm:text-4xl text-neutral-300 tracking-wider">04:00 <span className="text-red-600 text-xl">AM</span></div>
                            </div>
                        </div>

                        {/* Tagline & Button */}
                        <div className="mt-10 flex flex-col items-center w-full pb-safe z-50">
                            <span className="text-[10px] sm:text-xs font-bold text-neutral-500 tracking-[0.2em] mb-6 font-bebas">
                                PLAY - COMPETE - RELAX - REPEAT
                            </span>
                            
                            <button
                                onClick={handleEnter}
                                className="group relative flex items-center gap-3 px-8 py-3.5 bg-red-700 hover:bg-red-600 text-white rounded-full font-bold text-sm sm:text-base transition-all active:scale-95 shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:shadow-[0_0_50px_rgba(220,38,38,0.8)] z-50 cursor-pointer"
                                dir="rtl"
                            >
                                <span className="tracking-wide">دخول الموقع</span>
                                <ArrowLeft className="w-4 h-4 text-white/80 group-hover:-translate-x-1 transition-transform" />
                                
                                {/* Button Ripple/Glow */}
                                <div className="absolute inset-0 rounded-full border-2 border-red-400/50 animate-ping opacity-30" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
