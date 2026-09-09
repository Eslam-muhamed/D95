import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import astroBotImg from '@/assets/astro-bot.png';
import { playAstroBotChirp } from '@/lib/sound';

export default function AstroBotPeeker() {
    const [chirpCount, setChirpCount] = useState(0);
    const [showMessage, setShowMessage] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        playAstroBotChirp();
        setChirpCount((prev) => prev + 1);
        setShowMessage(true);
        setTimeout(() => {
            setShowMessage(false);
        }, 3200);
    };

    const MESSAGES = [
        'أهلاً بيك في D95! 🎮👋',
        'مستنيك جوه غرفة 01! 🚀',
        'جاهز للتحدي يا بطل؟ 🏆',
        'Astro Bot يحب الـ PS5! 💙✨',
    ];

    const currentMessage = MESSAGES[chirpCount % MESSAGES.length];

    return (
        <div
            className="absolute -top-12 -right-3 xs:-top-16 xs:-right-4 sm:-top-20 sm:-right-6 z-0 pointer-events-auto select-none"
            dir="ltr"
        >
            {/* Speech Bubble when clicked */}
            <AnimatePresence>
                {showMessage && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.7, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: -8 }}
                        exit={{ opacity: 0, scale: 0.8, y: -15 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="absolute -top-10 right-2 sm:right-6 z-30 whitespace-nowrap bg-black/90 text-white font-bold text-[10px] sm:text-xs py-1.5 px-3 rounded-xl border border-cyan-400/60 shadow-[0_0_18px_rgba(0,210,255,0.5)] backdrop-blur-md font-body"
                        dir="rtl"
                    >
                        <span>{currentMessage}</span>
                        {/* Little speech tail pointing down to Astro */}
                        <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-black/90 border-r border-b border-cyan-400/60 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Astro Bot Interactive Character */}
            <motion.div
                onClick={handleClick}
                initial={{ y: 20, opacity: 0 }}
                animate={{
                    y: [0, -7, 0],
                    rotate: [-1.5, 3.5, -2, 2.5, -1.5],
                }}
                transition={{
                    duration: 3.6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                whileHover={{
                    scale: 1.12,
                    y: -14,
                    transition: { duration: 0.2 },
                }}
                whileTap={{
                    scale: 0.95,
                    y: -4,
                }}
                style={{ transformOrigin: 'bottom right' }}
                className="relative cursor-pointer group"
                title="Astro Bot بيشاورلك! اضغط عليه 🤖"
            >
                {/* Cyan Neon Ambient Halo */}
                <div className="absolute inset-0 bg-cyan-400/25 blur-xl rounded-full scale-90 pointer-events-none -z-10 group-hover:bg-cyan-400/40 transition-colors" />

                {/* Astro Bot Image with waving hand */}
                <img
                    src={astroBotImg}
                    alt="Astro Bot PlayStation Mascot"
                    className="w-16 h-auto xs:w-20 sm:w-24 md:w-28 drop-shadow-[0_4px_16px_rgba(0,210,255,0.45)] transition-all duration-300 group-hover:drop-shadow-[0_6px_22px_rgba(0,210,255,0.7)]"
                />

                {/* Cute "Wave" Micro-Motion indicator on hover */}
                <motion.div
                    animate={{
                        opacity: [0.6, 1, 0.6],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    className="absolute top-1 right-2 w-2.5 h-2.5 rounded-full bg-cyan-300 blur-[1.5px] pointer-events-none"
                />
            </motion.div>
        </div>
    );
}
