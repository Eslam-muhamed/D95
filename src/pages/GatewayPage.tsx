import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gamepad2, Utensils, Clock, Sparkles, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import D95BrushLogo from '@/components/brand/D95BrushLogo';
import wallOpenImg from '@/assets/wall/d95-wall-open.jpg';
import wallPricesImg from '@/assets/wall/d95-wall-prices.jpg';

export default function GatewayPage() {
    const [activeModal, setActiveModal] = useState<'none' | 'wall-open' | 'wall-prices'>('none');

    return (
        <main className="min-h-[100dvh] w-full bg-[#0d0c0c] text-white overflow-y-auto relative flex flex-col justify-between p-3.5 sm:p-6 pb-20 md:pb-10 select-none bg-concrete-wall">
            {/* Ambient Wall Lighting & Spotlight Effect */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                {/* Overhead Stage Lights - 3 Spotlights shining down onto concrete */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,245,235,0.18)_0%,rgba(255,245,235,0.03)_50%,transparent_80%)]" />
                <div className="absolute top-0 left-[18%] w-56 h-64 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(255,250,240,0.14)_0%,transparent_70%)] blur-md" />
                <div className="absolute top-0 right-[18%] w-56 h-64 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(255,250,240,0.14)_0%,transparent_70%)] blur-md" />

                {/* Subtle Real Mural Backdrop Texture */}
                <img
                    src={wallOpenImg}
                    alt="D95 Graffiti Wall Mural"
                    className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-luminosity filter contrast-125 scale-105 pointer-events-none"
                />

                {/* Crimson Ambient Floor Glow */}
                <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 md:w-[700px] h-72 bg-red-950/30 rounded-full blur-[110px]" />
            </div>

            {/* Ceiling Industrial Rig Graphic */}
            <div className="relative z-10 w-full max-w-xl mx-auto flex items-center justify-between px-6 pt-1 opacity-60">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 shadow-[0_0_8px_#fff]" />
                <div className="h-[2px] flex-1 mx-3 bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-600" />
                <span className="w-3 h-3 rounded-full bg-neutral-200 shadow-[0_0_10px_#fff]" />
                <div className="h-[2px] flex-1 mx-3 bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-600" />
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 shadow-[0_0_8px_#fff]" />
            </div>

            {/* Header: Authentic D95 Mural Logo */}
            <header className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center text-center pt-2 shrink-0">
                {/* Venue Status Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/60 rounded-full border border-neutral-700/60 mb-2 shadow-lg backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-brush text-xs text-neutral-200 tracking-wider">OFFICIAL PORTAL</span>
                    <span className="text-neutral-500 text-xs">•</span>
                    <span className="font-body text-[11px] text-red-400 font-bold">مفتوح الآن</span>
                </div>

                {/* Branded Brush Logo */}
                <D95BrushLogo size="lg" showSubtitle={true} showMotto={false} glow={true} />

                {/* Graffiti "WE ARE OPEN" Section from the Physical Wall */}
                <div className="relative my-2 w-full flex items-center justify-center">
                    {/* Left Distressed Cross */}
                    <span
                        className="hidden sm:inline-block font-brush text-3xl md:text-5xl text-neutral-400 select-none mr-4 opacity-70 -rotate-12"
                        style={{ WebkitTextStroke: '1px #000' }}
                    >
                        ✕
                    </span>

                    <div className="relative text-center px-4">
                        <h1
                            className="font-brush text-3xl sm:text-4xl md:text-5xl uppercase tracking-wider text-neutral-100 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
                            style={{
                                transform: 'skewX(-2deg)',
                                textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.1)',
                            }}
                        >
                            WE ARE OPEN
                        </h1>
                        {/* Drip line under text */}
                        <div className="w-28 sm:w-36 h-[2px] bg-neutral-300 mx-auto mt-1 rounded-full opacity-60" />
                    </div>

                    {/* Right Distressed Cross */}
                    <span
                        className="hidden sm:inline-block font-brush text-3xl md:text-5xl text-neutral-400 select-none ml-4 opacity-70 rotate-12"
                        style={{ WebkitTextStroke: '1px #000' }}
                    >
                        ✕
                    </span>
                </div>

                {/* Authentic Framed Working Hours Box from the Physical Wall */}
                <div className="w-full max-w-sm sm:max-w-md mx-auto my-1.5 px-2">
                    <div className="relative border-2 border-neutral-300/40 bg-black/65 backdrop-blur-md rounded-xl p-2.5 sm:p-3 shadow-[0_8px_25px_rgba(0,0,0,0.9)] grunge-frame">
                        {/* Corner Accents */}
                        <span className="absolute -top-1.5 -left-1.5 text-xs text-neutral-400 font-brush">✕</span>
                        <span className="absolute -top-1.5 -right-1.5 text-xs text-neutral-400 font-brush">✕</span>
                        <span className="absolute -bottom-1.5 -left-1.5 text-xs text-neutral-400 font-brush">✕</span>
                        <span className="absolute -bottom-1.5 -right-1.5 text-xs text-neutral-400 font-brush">✕</span>

                        <div className="grid grid-cols-2 divide-x divide-neutral-500/50 text-center" dir="ltr">
                            {/* FROM */}
                            <div className="px-2 sm:px-4 flex flex-col items-center">
                                <span className="font-brush text-[10px] sm:text-xs text-neutral-400 tracking-widest uppercase">
                                    FROM
                                </span>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                    <span className="font-brush text-xl sm:text-2xl font-black text-white">
                                        08:00
                                    </span>
                                    <span className="font-brush text-xs sm:text-sm font-bold text-red-500">
                                        AM
                                    </span>
                                </div>
                            </div>

                            {/* TO */}
                            <div className="px-2 sm:px-4 flex flex-col items-center">
                                <span className="font-brush text-[10px] sm:text-xs text-neutral-400 tracking-widest uppercase">
                                    TO
                                </span>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                    <span className="font-brush text-xl sm:text-2xl font-black text-white">
                                        04:00
                                    </span>
                                    <span className="font-brush text-xs sm:text-sm font-bold text-red-500">
                                        AM
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wall Motto & Centered Red Cross */}
                <div className="flex flex-col items-center mt-1">
                    <p className="font-body text-[10px] sm:text-xs text-neutral-400 uppercase tracking-[0.28em] font-semibold">
                        PLAY • COMPETE • RELAX • REPEAT
                    </p>
                    <span className="text-red-500 font-black text-xs leading-none mt-0.5">✕</span>
                </div>
            </header>

            {/* Core Interactive Center: Dual Industrial Portals */}
            <section className="relative z-10 w-full max-w-4xl mx-auto my-auto py-3 sm:py-5 shrink-0">
                <div className="grid grid-cols-2 gap-3 sm:gap-6 w-full mx-auto">
                    {/* PORTAL 1: PLAYSTATION & ROOMS */}
                    <Link
                        to="/playstation"
                        className="group relative flex flex-col items-center justify-between p-3.5 sm:p-6 concrete-card rounded-2xl sm:rounded-3xl border border-white/10 hover:border-red-500/60 transition-all duration-300 active:scale-95 cursor-pointer h-60 sm:h-76 hover:shadow-[0_0_35px_rgba(181,24,36,0.45)]"
                    >
                        {/* Corner Industrial Marks */}
                        <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t-2 border-l-2 border-red-500" />
                        <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t-2 border-r-2 border-red-500" />
                        <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b-2 border-l-2 border-red-500" />
                        <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b-2 border-r-2 border-red-500" />

                        {/* Top tag */}
                        <div className="w-full flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="font-brush text-neutral-400 group-hover:text-red-400 transition-colors tracking-wider">
                                ZONE 01
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-red-600/30 text-red-300 font-bold text-[9px]">
                                PS5 ARENA
                            </span>
                        </div>

                        {/* Center Icon */}
                        <div className="my-auto flex flex-col items-center justify-center relative">
                            <div className="absolute w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-red-600/15 blur-xl group-hover:bg-red-600/35 transition-all" />
                            <Gamepad2 className="w-12 h-12 sm:w-16 sm:h-16 text-white group-hover:text-red-400 group-hover:scale-110 transition-all duration-300 relative z-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]" />
                        </div>

                        {/* Details & Action */}
                        <div className="w-full text-center space-y-1">
                            <h2 className="font-brush text-sm sm:text-xl uppercase font-bold text-white tracking-wide group-hover:text-red-400 transition-colors leading-tight">
                                PLAYSTATION
                            </h2>
                            <div className="font-body text-[11px] sm:text-xs text-red-300 font-bold">
                                صالة الألعاب والغرف
                            </div>
                            <div className="mt-1.5 w-full py-2 px-2 bg-gradient-to-r from-red-700 to-red-600 text-white font-body font-bold text-[11px] sm:text-xs rounded-xl flex items-center justify-center gap-1 group-hover:from-red-600 group-hover:to-red-500 transition-all shadow-md shadow-red-900/40">
                                <span>دخول الصالة</span>
                                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                            </div>
                        </div>
                    </Link>

                    {/* PORTAL 2: CAFÉ & DIGITAL MENU */}
                    <Link
                        to="/menu"
                        className="group relative flex flex-col items-center justify-between p-3.5 sm:p-6 concrete-card rounded-2xl sm:rounded-3xl border border-white/10 hover:border-amber-500/60 transition-all duration-300 active:scale-95 cursor-pointer h-60 sm:h-76 hover:shadow-[0_0_35px_rgba(212,160,23,0.45)]"
                    >
                        {/* Corner Industrial Marks */}
                        <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-500" />
                        <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-500" />
                        <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-500" />
                        <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-500" />

                        {/* Top tag */}
                        <div className="w-full flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="font-brush text-neutral-400 group-hover:text-amber-400 transition-colors tracking-wider">
                                ZONE 02
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-600/30 text-amber-300 font-bold text-[9px]">
                                CAFÉ BAR
                            </span>
                        </div>

                        {/* Center Icon */}
                        <div className="my-auto flex flex-col items-center justify-center relative">
                            <div className="absolute w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-amber-600/15 blur-xl group-hover:bg-amber-600/35 transition-all" />
                            <Utensils className="w-12 h-12 sm:w-16 sm:h-16 text-white group-hover:text-amber-400 group-hover:scale-110 transition-all duration-300 relative z-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]" />
                        </div>

                        {/* Details & Action */}
                        <div className="w-full text-center space-y-1">
                            <h2 className="font-brush text-sm sm:text-xl uppercase font-bold text-white tracking-wide group-hover:text-amber-400 transition-colors leading-tight">
                                CAFÉ &amp; MENU
                            </h2>
                            <div className="font-body text-[11px] sm:text-xs text-amber-300 font-bold">
                                قائمة المشروبات والمأكولات
                            </div>
                            <div className="mt-1.5 w-full py-2 px-2 bg-gradient-to-r from-amber-700 to-amber-600 text-white font-body font-bold text-[11px] sm:text-xs rounded-xl flex items-center justify-center gap-1 group-hover:from-amber-600 group-hover:to-amber-500 transition-all shadow-md shadow-amber-900/40">
                                <span>تصفح المنيو</span>
                                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                            </div>
                        </div>
                    </Link>
                </div>

                {/* View Real Mural Photos Trigger */}
                <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                        onClick={() => setActiveModal('wall-open')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-xs font-body transition-colors cursor-pointer"
                    >
                        <ImageIcon className="w-3.5 h-3.5 text-red-400" />
                        <span>شاهد جدارية D95 الحقيقية</span>
                    </button>
                    <button
                        onClick={() => setActiveModal('wall-prices')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-xs font-body transition-colors cursor-pointer"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>لوحة أسعار الصالة</span>
                    </button>
                </div>
            </section>

            {/* Bottom Signoff: Authentic Wall Banner */}
            <footer className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center space-y-1.5 shrink-0">
                <div className="px-4 py-1.5 rounded-lg bg-red-950/70 border border-red-700/50 shadow-lg">
                    <p className="font-brush text-xs sm:text-sm text-red-200 tracking-wider">
                        THANK YOU &amp; ENJOY YOUR TIME!
                    </p>
                </div>
                <p className="font-body text-[10px] text-neutral-400 tracking-widest uppercase">
                    D95 GAMING &amp; CAFÉ • CAIRO, EGYPT
                </p>
            </footer>

            {/* Modal for Authentic Real Mural Photo */}
            <AnimatePresence>
                {activeModal !== 'none' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActiveModal('none')}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-2xl w-full bg-neutral-900 border border-white/20 rounded-2xl overflow-hidden shadow-2xl p-2 cursor-default"
                        >
                            <button
                                onClick={() => setActiveModal('none')}
                                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white hover:text-red-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <img
                                src={activeModal === 'wall-open' ? wallOpenImg : wallPricesImg}
                                alt="جدارية D95 الأصلية"
                                className="w-full h-auto rounded-xl object-contain max-h-[75vh]"
                            />

                            <div className="p-3 text-center">
                                <h3 className="font-brush text-base sm:text-lg text-white">
                                    {activeModal === 'wall-open'
                                        ? 'جدارية D95 الأصلية — WE ARE OPEN'
                                        : 'لوحة الأسعار الرسمية على الجدار — ROOM PRICES'}
                                </h3>
                                <p className="font-body text-xs text-neutral-400 mt-0.5">
                                    الصورة الواقعية المعتمدة من داخل فرع D95 Gaming &amp; Café
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
