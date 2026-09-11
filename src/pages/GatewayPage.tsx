import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Gamepad2, Utensils, Sun, Moon } from 'lucide-react';
import D95BrushLogo from '@/components/brand/D95BrushLogo';
import { playPs5StartupSound, playCafeEntranceSound } from '@/lib/sound';
import { useTheme } from '@/stores/themeStore';

export default function GatewayPage() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [isBootingPs5, setIsBootingPs5] = useState(false);
    const [isEnteringMenu, setIsEnteringMenu] = useState(false);

    const handlePlaystationClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isBootingPs5) return;
        setIsBootingPs5(true);
        playPs5StartupSound();

        // Brief delay to allow sound ignition & button press tactile feedback before routing
        setTimeout(() => {
            navigate('/playstation');
        }, 200);
    };

    const handleMenuClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isEnteringMenu) return;
        setIsEnteringMenu(true);
        playCafeEntranceSound();

        setTimeout(() => {
            navigate('/menu');
        }, 200);
    };

    return (
        <main className="min-h-[100dvh] w-full bg-[#F6F5F2] dark:bg-[#0d0c0c] text-neutral-900 dark:text-white overflow-y-auto relative flex flex-col justify-between p-3.5 sm:p-6 pb-6 sm:pb-8 select-none bg-concrete-wall transition-colors duration-200">
            {/* Ambient Lighting Cones (Optimized hardware-accelerated CSS) */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(220,38,38,0.12)_0%,rgba(220,38,38,0.02)_50%,transparent_80%)]" />
                <div className="absolute top-0 left-[18%] w-56 h-64 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(255,255,255,0.06)_0%,transparent_70%)]" />
                <div className="absolute top-0 right-[18%] w-56 h-64 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(255,255,255,0.06)_0%,transparent_70%)]" />
                <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 md:w-[700px] h-72 bg-[radial-gradient(circle,rgba(155,28,28,0.12)_0%,transparent_70%)]" />
            </div>

            {/* Ceiling Industrial Rig Graphic & Theme Switcher */}
            <div className="relative z-20 w-full max-w-xl mx-auto flex items-center justify-between px-2 sm:px-6 pt-1">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-400 dark:bg-neutral-300 shadow-[0_0_8px_#dc2626]" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-bold">D95 GATEWAY</span>
                </div>

                <button
                    onClick={toggleTheme}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer bg-white/80 dark:bg-black/60 border border-neutral-300 dark:border-white/15 text-neutral-800 dark:text-neutral-200 shadow-sm hover:scale-105 active:scale-95"
                    aria-label="تبديل المظهر"
                    title={theme === 'dark' ? 'تفعيل الوضع المضيء' : 'تفعيل الوضع الليلي'}
                >
                    {theme === 'dark' ? (
                        <>
                            <Sun size={14} className="text-amber-400" />
                            <span className="font-body text-[11px]">نهاري</span>
                        </>
                    ) : (
                        <>
                            <Moon size={14} className="text-neutral-800" />
                            <span className="font-body text-[11px]">ليلي</span>
                        </>
                    )}
                </button>
            </div>

            {/* Header: D95 Brand & Working Hours */}
            <header className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center text-center pt-2 shrink-0">
                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/80 dark:bg-black/60 rounded-full border border-neutral-300 dark:border-neutral-700/60 mb-2 shadow-md backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-brush text-xs text-neutral-800 dark:text-neutral-200 tracking-wider">OFFICIAL PORTAL</span>
                    <span className="text-neutral-400 text-xs">•</span>
                    <span className="font-body text-[11px] text-red-600 dark:text-red-400 font-bold">مفتوح الآن</span>
                </div>

                {/* Branded Brush Logo */}
                <D95BrushLogo size="lg" showSubtitle={true} showMotto={false} glow={true} />

                {/* Styled WE ARE OPEN Title */}
                <div className="relative my-2 w-full flex items-center justify-center">
                    <span
                        className="hidden sm:inline-block font-brush text-3xl md:text-5xl text-neutral-400 select-none mr-4 opacity-70 -rotate-12"
                        style={{ WebkitTextStroke: '1px currentColor' }}
                    >
                        ✕
                    </span>

                    <div className="relative text-center px-4">
                        <h1
                            className="font-bebas text-4xl sm:text-5xl md:text-6xl uppercase tracking-[0.08em] text-neutral-900 dark:text-neutral-100 drop-shadow-sm dark:drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] font-black leading-none"
                        >
                            WE ARE OPEN
                        </h1>
                        <div className="w-32 sm:w-44 h-[3px] bg-red-600 mx-auto mt-1.5 rounded-full shadow-[0_0_12px_rgba(220,38,38,0.7)]" />
                    </div>

                    <span
                        className="hidden sm:inline-block font-brush text-3xl md:text-5xl text-neutral-400 select-none ml-4 opacity-70 rotate-12"
                        style={{ WebkitTextStroke: '1px currentColor' }}
                    >
                        ✕
                    </span>
                </div>

                {/* Framed Working Hours Box */}
                <div className="w-full max-w-sm sm:max-w-md mx-auto my-1.5 px-2">
                    <div className="relative border-2 border-neutral-300 dark:border-neutral-300/40 bg-white/90 dark:bg-black/65 backdrop-blur-md rounded-xl p-2.5 sm:p-3 shadow-lg dark:shadow-[0_8px_25px_rgba(0,0,0,0.9)] grunge-frame">
                        <span className="absolute -top-1.5 -left-1.5 text-xs text-neutral-400 font-brush">✕</span>
                        <span className="absolute -top-1.5 -right-1.5 text-xs text-neutral-400 font-brush">✕</span>
                        <span className="absolute -bottom-1.5 -left-1.5 text-xs text-neutral-400 font-brush">✕</span>
                        <span className="absolute -bottom-1.5 -right-1.5 text-xs text-neutral-400 font-brush">✕</span>

                        <div className="grid grid-cols-2 divide-x divide-neutral-300 dark:divide-neutral-500/50 text-center" dir="ltr">
                            {/* FROM */}
                            <div className="px-2 sm:px-4 flex flex-col items-center">
                                <span className="font-brush text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 tracking-widest uppercase">
                                    FROM
                                </span>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                    <span className="font-brush text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                                        08:00
                                    </span>
                                    <span className="font-brush text-xs sm:text-sm font-bold text-red-600">
                                        AM
                                    </span>
                                </div>
                            </div>

                            {/* TO */}
                            <div className="px-2 sm:px-4 flex flex-col items-center">
                                <span className="font-brush text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 tracking-widest uppercase">
                                    TO
                                </span>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                    <span className="font-brush text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                                        04:00
                                    </span>
                                    <span className="font-brush text-xs sm:text-sm font-bold text-red-600">
                                        AM
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Motto */}
                <div className="flex flex-col items-center mt-1">
                    <p className="font-bebas text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 uppercase tracking-[0.25em] font-bold">
                        PLAY • COMPETE • RELAX • REPEAT
                    </p>
                    <span className="text-red-600 font-black text-xs leading-none mt-0.5">✕</span>
                </div>
            </header>

            {/* Core Interactive Center: Dual Portals */}
            <section className="relative z-10 w-full max-w-4xl mx-auto my-auto py-3 sm:py-5 shrink-0">
                <div className="grid grid-cols-2 gap-3 sm:gap-6 w-full mx-auto">
                    {/* PORTAL 1: PLAYSTATION & ROOMS */}
                    <Link
                        to="/playstation"
                        onClick={handlePlaystationClick}
                        className={`group relative flex flex-col items-center justify-between p-3.5 sm:p-6 concrete-card rounded-2xl sm:rounded-3xl border transition-all duration-300 active:scale-95 cursor-pointer h-60 sm:h-76 shadow-sm ${
                            isBootingPs5
                                ? 'border-red-500 scale-[0.97] shadow-[0_0_45px_rgba(225,29,72,0.85)] brightness-110'
                                : 'border-neutral-300/80 dark:border-white/10 hover:border-red-500/60 hover:shadow-[0_0_35px_rgba(181,24,36,0.35)]'
                        }`}
                    >
                        {/* Corner Industrial Marks */}
                        <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t-2 border-l-2 border-red-600" />
                        <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t-2 border-r-2 border-red-600" />
                        <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b-2 border-l-2 border-red-600" />
                        <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b-2 border-r-2 border-red-600" />

                        {/* Top tag */}
                        <div className="w-full flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="font-brush text-neutral-500 dark:text-neutral-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors tracking-wider">
                                ZONE 01
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-600/30 text-red-700 dark:text-red-300 font-bold text-[9px] flex items-center gap-1 border border-red-200 dark:border-transparent">
                                {isBootingPs5 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
                                PS5 ARENA
                            </span>
                        </div>

                        {/* Center Icon */}
                        <div className="my-auto flex flex-col items-center justify-center relative">
                            <div className={`absolute w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-red-600/10 dark:bg-red-600/15 blur-xl transition-all ${isBootingPs5 ? 'scale-125 bg-red-600/50' : 'group-hover:bg-red-600/30'}`} />
                            <Gamepad2 className={`w-12 h-12 sm:w-16 sm:h-16 text-neutral-800 dark:text-white transition-all duration-300 relative z-10 drop-shadow-sm dark:drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] ${isBootingPs5 ? 'scale-110 text-red-600 dark:text-red-400' : 'group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:scale-110'}`} />
                        </div>

                        {/* Details & Action */}
                        <div className="w-full text-center space-y-1">
                            <h2 className="font-brush text-sm sm:text-xl uppercase font-bold text-neutral-900 dark:text-white tracking-wide group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                                PLAYSTATION
                            </h2>
                            <div className="font-body text-[11px] sm:text-xs text-neutral-600 dark:text-red-300 font-bold">
                                {isBootingPs5 ? 'جاري تشغيل PS5...' : 'صالة الألعاب والغرف'}
                            </div>
                            <div className={`mt-1.5 w-full py-2 px-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-body font-bold text-[11px] sm:text-xs rounded-xl flex items-center justify-center gap-1 transition-all shadow-md shadow-red-900/30 ${isBootingPs5 ? 'from-red-500 to-red-400 shadow-red-600/60 ring-2 ring-red-400/50' : 'group-hover:from-red-700 group-hover:to-red-600'}`}>
                                <span>{isBootingPs5 ? 'STARTING...' : 'دخول الصالة'}</span>
                                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                            </div>
                        </div>
                    </Link>

                    {/* PORTAL 2: CAFÉ & DIGITAL MENU */}
                    <Link
                        to="/menu"
                        onClick={handleMenuClick}
                        className={`group relative flex flex-col items-center justify-between p-3.5 sm:p-6 concrete-card rounded-2xl sm:rounded-3xl border transition-all duration-300 active:scale-95 cursor-pointer h-60 sm:h-76 shadow-sm ${
                            isEnteringMenu
                                ? 'border-amber-500 shadow-[0_0_35px_rgba(212,160,23,0.6)] scale-[1.02]'
                                : 'border-neutral-300/80 dark:border-white/10 hover:border-amber-500/60 hover:shadow-[0_0_35px_rgba(212,160,23,0.35)]'
                        }`}
                    >
                        {/* Corner Industrial Marks */}
                        <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-500" />
                        <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-500" />
                        <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-500" />
                        <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-500" />

                        {/* Top tag */}
                        <div className="w-full flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="font-brush text-neutral-500 dark:text-neutral-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors tracking-wider">
                                ZONE 02
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-600/30 text-amber-800 dark:text-amber-300 font-bold text-[9px] flex items-center gap-1 border border-amber-200 dark:border-transparent">
                                {isEnteringMenu && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />}
                                CAFÉ BAR
                            </span>
                        </div>

                        {/* Center Icon */}
                        <div className="my-auto flex flex-col items-center justify-center relative">
                            <div className={`absolute w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-amber-600/10 dark:bg-amber-600/15 blur-xl transition-all ${isEnteringMenu ? 'scale-125 bg-amber-600/50' : 'group-hover:bg-amber-600/30'}`} />
                            <Utensils className={`w-12 h-12 sm:w-16 sm:h-16 text-neutral-800 dark:text-white transition-all duration-300 relative z-10 drop-shadow-sm dark:drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] ${isEnteringMenu ? 'scale-110 text-amber-500' : 'group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:scale-110'}`} />
                        </div>

                        {/* Details & Action */}
                        <div className="w-full text-center space-y-1">
                            <h2 className="font-brush text-sm sm:text-xl uppercase font-bold text-neutral-900 dark:text-white tracking-wide group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight">
                                CAFÉ &amp; MENU
                            </h2>
                            <div className="font-body text-[11px] sm:text-xs text-neutral-600 dark:text-amber-300 font-bold">
                                {isEnteringMenu ? 'جاري تحضير القهوة والمنيو...' : 'قائمة المشروبات والمأكولات'}
                            </div>
                            <div className={`mt-1.5 w-full py-2 px-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-body font-bold text-[11px] sm:text-xs rounded-xl flex items-center justify-center gap-1 transition-all shadow-md shadow-amber-900/30 ${isEnteringMenu ? 'from-amber-500 to-amber-400 shadow-amber-600/60 ring-2 ring-amber-400/50' : 'group-hover:from-amber-700 group-hover:to-amber-600'}`}>
                                <span>{isEnteringMenu ? 'OPENING...' : 'تصفح المنيو'}</span>
                                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                            </div>
                        </div>
                    </Link>
                </div>
            </section>

            {/* Bottom Signoff */}
            <footer className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center space-y-1.5 shrink-0">
                <div className="px-4 py-1.5 rounded-lg bg-red-100 dark:bg-red-950/70 border border-red-300 dark:border-red-700/50 shadow-sm dark:shadow-lg">
                    <p className="font-brush text-xs sm:text-sm text-red-800 dark:text-red-200 tracking-wider">
                        THANK YOU &amp; ENJOY YOUR TIME!
                    </p>
                </div>
                <p className="font-body text-[10px] text-neutral-600 dark:text-neutral-400 tracking-widest uppercase">
                    D95 GAMING &amp; CAFÉ • CAIRO, EGYPT
                </p>
            </footer>
        </main>
    );
}
