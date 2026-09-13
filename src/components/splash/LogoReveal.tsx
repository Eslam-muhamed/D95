import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import D95BrushLogo from '@/components/brand/D95BrushLogo';

interface LogoRevealProps {
    onFinished?: () => void;
    /**
     * Optional custom logo component or image.
     * If not provided, defaults to the high-end D95 Brush Logo.
     */
    customLogo?: React.ReactNode;
}

export default function LogoReveal({ onFinished, customLogo }: LogoRevealProps) {
    useEffect(() => {
        // Hold logo for 1.4s then trigger final transition to main website
        const timer = setTimeout(() => {
            onFinished?.();
        }, 1400);

        return () => clearTimeout(timer);
    }, [onFinished]);

    return (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none p-6 select-none">
            {/* Ambient subtle radial glow behind the logo */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.22, scale: 1 }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
                className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(229,37,42,0.4)_0%,transparent_70%)] blur-3xl pointer-events-none"
            />

            {/* Cinematic Logo Reveal Container */}
            <motion.div
                initial={{
                    opacity: 0,
                    scale: 1.08,
                    filter: 'blur(20px)',
                }}
                animate={{
                    opacity: 1,
                    scale: 1.0,
                    filter: 'blur(0px)',
                }}
                transition={{
                    duration: 0.95,
                    ease: [0.16, 1, 0.3, 1],
                }}
                className="relative flex flex-col items-center"
            >
                {/* 
                  PLACEHOLDER / BRAND LOGO COMPONENT:
                  Replace this slot or pass `customLogo` prop when you have a new asset.
                */}
                {customLogo ? (
                    customLogo
                ) : (
                    <div className="flex flex-col items-center">
                        <D95BrushLogo
                            size="lg"
                            showSubtitle={true}
                            showMotto={true}
                            glow={true}
                        />
                    </div>
                )}
            </motion.div>
        </div>
    );
}
