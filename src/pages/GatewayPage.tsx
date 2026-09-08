import { Link } from 'react-router-dom';
import { ArrowRight, Utensils, Clock, Gamepad2, Coffee } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GatewayPage() {
    return (
        <main className="min-h-[100dvh] w-full bg-[#090707] text-white overflow-y-auto relative flex flex-col justify-between p-4 pb-24 md:pb-12 select-none">
            {/* Ambient background glow */}
            <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_15%,rgba(196,30,58,0.25)_0%,transparent_65%)]" />
            <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-72 md:w-[600px] h-72 md:h-[600px] bg-red-950/40 rounded-full blur-[90px] md:blur-[140px]" />
            <div className="pointer-events-none absolute -bottom-20 left-1/2 -translate-x-1/2 w-72 md:w-[600px] h-72 md:h-[600px] bg-amber-950/30 rounded-full blur-[90px] md:blur-[140px]" />

            {/* Top Section: Clean D95 Branding */}
            <header className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center pt-3 shrink-0">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/5 rounded-full border border-white/10 mb-2 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="font-body font-bold text-[10px] text-red-400 uppercase tracking-widest">GATEWAY PORTAL</span>
                    <span className="text-neutral-500 font-body text-xs">/</span>
                    <span className="font-body text-[10px] text-neutral-400">EST. 2025</span>
                </div>

                {/* Logo & Title */}
                <div className="flex items-center justify-center gap-2 my-1">
                    <span className="bg-red-600 text-white font-display text-2xl md:text-4xl px-3 py-0.5 tracking-wider uppercase font-black rounded-xl shadow-lg shadow-red-600/30">
                        D95
                    </span>
                    <h1 className="font-serif text-2xl md:text-4xl tracking-tight uppercase text-white font-black">
                        GAMING &amp; CAFÉ
                    </h1>
                </div>
                <p className="font-body text-[11px] md:text-xs text-neutral-400 tracking-[0.25em] uppercase mt-0.5">
                    PLAY • COMPETE • RELAX • REPEAT
                </p>
                <p className="font-body text-xs md:text-sm text-red-400 uppercase tracking-widest mt-1.5 font-bold">
                    SELECT DESTINATION <span className="text-neutral-500 font-normal">•</span> اختر وجهتك
                </p>
            </header>

            {/* Core Interactive Center: Dual Portals */}
            <div className="relative z-10 w-full max-w-4xl mx-auto my-auto py-6 shrink-0">
                <div className="grid grid-cols-2 gap-4 md:gap-8 w-full mx-auto">
                    {/* CARD 1: PLAYSTATION */}
                    <Link
                        to="/playstation"
                        className="group relative flex flex-col items-center justify-between p-4 md:p-8 bg-neutral-900/90 border border-white/10 rounded-3xl shadow-xl active:scale-95 transition-all duration-300 hover:border-red-500/50 cursor-pointer h-64 md:h-80 hover:shadow-[0_0_40px_rgba(196,30,58,0.4)]"
                    >
                        {/* Corner Accent Marks */}
                        <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
                        <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>
                        <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
                        <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>

                        {/* Card Header Tag */}
                        <div className="w-full flex items-center justify-between">
                            <span className="font-body font-bold text-[9px] md:text-xs text-neutral-400 group-hover:text-red-400 transition-colors tracking-widest">
                                PORTAL // 01
                            </span>
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        </div>

                        {/* Center Icon */}
                        <div className="my-auto flex flex-col items-center justify-center relative">
                            <div className="absolute w-24 h-24 md:w-32 md:h-32 rounded-full bg-red-600/10 blur-xl group-hover:bg-red-600/30 transition-all"></div>
                            <Gamepad2 className="w-14 h-14 md:w-20 md:h-20 text-white group-hover:text-red-400 group-hover:scale-110 transition-all duration-300 relative z-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]" />
                        </div>

                        {/* Labels & Action */}
                        <div className="w-full text-center space-y-1.5">
                            <h2 className="font-display text-base md:text-2xl uppercase font-bold text-white tracking-wider group-hover:text-red-400 transition-colors leading-tight">
                                PLAYSTATION
                            </h2>
                            <div className="font-body text-xs md:text-sm text-red-400 font-bold">
                                بلايستيشن
                            </div>
                            <div className="mt-2 w-full py-2 px-3 bg-red-600 text-white font-body font-bold text-xs md:text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 group-hover:bg-red-500 transition-colors shadow-md shadow-red-600/30">
                                <span>دخول الصالة</span>
                                <ArrowRight className="w-4 h-4 rotate-180" />
                            </div>
                        </div>
                    </Link>

                    {/* CARD 2: CAFÉ & MENU */}
                    <Link
                        to="/menu"
                        className="group relative flex flex-col items-center justify-between p-4 md:p-8 bg-neutral-900/90 border border-white/10 rounded-3xl shadow-xl active:scale-95 transition-all duration-300 hover:border-amber-500/50 cursor-pointer h-64 md:h-80 hover:shadow-[0_0_40px_rgba(212,160,23,0.4)]"
                    >
                        {/* Corner Accent Marks */}
                        <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-amber-500"></div>
                        <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-amber-500"></div>
                        <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-amber-500"></div>
                        <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-amber-500"></div>

                        {/* Card Header Tag */}
                        <div className="w-full flex items-center justify-between">
                            <span className="font-body font-bold text-[9px] md:text-xs text-neutral-400 group-hover:text-amber-400 transition-colors tracking-widest">
                                PORTAL // 02
                            </span>
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        </div>

                        {/* Center Icon */}
                        <div className="my-auto flex flex-col items-center justify-center relative">
                            <div className="absolute w-24 h-24 md:w-32 md:h-32 rounded-full bg-amber-600/10 blur-xl group-hover:bg-amber-600/30 transition-all"></div>
                            <Coffee className="w-14 h-14 md:w-20 md:h-20 text-white group-hover:text-amber-400 group-hover:scale-110 transition-all duration-300 relative z-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]" />
                        </div>

                        {/* Labels & Action */}
                        <div className="w-full text-center space-y-1.5">
                            <h2 className="font-display text-base md:text-2xl uppercase font-bold text-white tracking-wider group-hover:text-amber-400 transition-colors leading-tight">
                                CAFÉ & MENU
                            </h2>
                            <div className="font-body text-xs md:text-sm text-amber-400 font-bold">
                                كافيه ومنيو
                            </div>
                            <div className="mt-2 w-full py-2 px-3 bg-amber-600 text-white font-body font-bold text-xs md:text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 group-hover:bg-amber-500 transition-colors shadow-md shadow-amber-600/30">
                                <span>تصفح المنيو</span>
                                <Utensils className="w-4 h-4" />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Bottom Footer: Hours & Signoff */}
            <footer className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center space-y-2 pb-2 shrink-0">
                {/* Compact Hours Bar */}
                <div className="w-full bg-neutral-900/80 border border-white/10 px-4 py-2 rounded-2xl flex items-center justify-between text-xs md:text-sm shadow-inner">
                    <div className="flex items-center gap-2 text-red-400">
                        <Clock className="w-4 h-4" />
                        <span className="font-body font-bold text-xs text-neutral-300 tracking-wider">ساعات العمل الرسمية:</span>
                    </div>
                    <div className="font-body font-bold text-xs md:text-sm text-white flex items-center gap-1.5" dir="ltr">
                        <span>08:00 AM</span>
                        <span className="text-neutral-500">-</span>
                        <span className="text-red-400">04:00 AM</span>
                    </div>
                </div>

                {/* Compact Signoff */}
                <div className="text-center pt-1">
                    <p className="font-display text-xs md:text-sm tracking-wider text-red-400 uppercase font-bold drop-shadow-[0_1px_4px_rgba(196,30,58,0.5)]">
                        THANK YOU &amp; ENJOY YOUR TIME!
                    </p>
                    <p className="font-body text-[9px] md:text-[10px] text-neutral-500 tracking-widest mt-0.5">
                        D95 GAMING &amp; CAFÉ // CAIRO
                    </p>
                </div>
            </footer>
        </main>
    );
}
