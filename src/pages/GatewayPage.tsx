import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Gamepad2, Coffee, Sun, Moon, ExternalLink, MapPin, UserCircle2, Trophy } from 'lucide-react';
import D95BrushLogo from '@/components/brand/D95BrushLogo';
import { playPs5StartupSound, playCafeEntranceSound } from '@/lib/sound';
import { useTheme } from '@/stores/themeStore';
import { CONTACT_INFO } from '@/constants/contactInfo';
import { BeinSportsIcon, NetflixIcon, InstagramGradientIcon } from '@/components/brand/EntertainmentIcons';
import TournamentAnnouncementPopup from '@/components/features/TournamentAnnouncementPopup';
import {
    fetchVenueStatus,
    subscribeVenueStatus,
    DEFAULT_VENUE_STATUS,
    type VenueStatus,
} from '@/services/venueStatusService';
import { useTournamentStore } from '@/stores/tournamentStore';

export default function GatewayPage() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [isBootingPs5, setIsBootingPs5] = useState(false);
    const [isEnteringMenu, setIsEnteringMenu] = useState(false);
    const [venueStatus, setVenueStatus] = useState<VenueStatus>(DEFAULT_VENUE_STATUS);
    const hasTournaments = useTournamentStore(state => state.hasActiveTournament());

    useEffect(() => {
        fetchVenueStatus().then(setVenueStatus);
        const unsubscribe = subscribeVenueStatus((newStatus) => {
            setVenueStatus(newStatus);
        });
        return () => unsubscribe();
    }, []);

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

                <div className="flex items-center gap-2">
                    <Link
                        to="/customer"
                        className="group relative flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer bg-gradient-to-tr from-red-600 to-red-800 border border-red-500/50 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] hover:scale-110 active:scale-95 overflow-hidden"
                        title="حساب العميل"
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%] bg-[position:-100%_0] group-hover:animate-[shimmer_1.5s_infinite]" />
                        <UserCircle2 size={18} className="shrink-0 relative z-10" />
                    </Link>

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
            </div>

            {/* Header: D95 Brand & Working Hours */}
            <header className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center text-center pt-2 shrink-0">
                {/* Status Badge */}
                <div className={`inline-flex items-center gap-2 px-3.5 py-1 bg-white/80 dark:bg-black/60 rounded-full border transition-all duration-300 mb-2 shadow-md backdrop-blur-sm ${
                    venueStatus.isOpen
                        ? 'border-emerald-500/30'
                        : 'border-rose-500/30'
                }`}>
                    <span className={`w-2 h-2 rounded-full ${
                        venueStatus.isOpen
                            ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]'
                            : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                    }`} />
                    <span className="font-bebas text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 tracking-wider">OFFICIAL PORTAL</span>
                    <span className="text-neutral-400 text-xs">•</span>
                    <span className={`font-body text-[11px] font-bold ${
                        venueStatus.isOpen
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                    }`}>
                        {venueStatus.isOpen ? 'مفتوح الآن' : 'مغلق الآن'}
                    </span>
                </div>

                {/* Branded Brush Logo */}
                <D95BrushLogo size="lg" showSubtitle={true} showMotto={false} glow={true} />

                {/* Styled WE ARE OPEN / CURRENTLY CLOSED Title */}
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
                            {venueStatus.isOpen ? 'WE ARE OPEN' : 'CURRENTLY CLOSED'}
                        </h1>
                        <div className={`w-32 sm:w-44 h-[3px] mx-auto mt-1.5 rounded-full transition-all duration-300 ${
                            venueStatus.isOpen
                                ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]'
                                : 'bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.7)]'
                        }`} />
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
                                <span className="font-bebas text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 tracking-widest uppercase font-bold">
                                    FROM
                                </span>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                    <span className="font-bebas text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                                        08:00
                                    </span>
                                    <span className="font-bebas text-sm sm:text-base font-bold text-red-600">
                                        AM
                                    </span>
                                </div>
                            </div>

                            {/* TO */}
                            <div className="px-2 sm:px-4 flex flex-col items-center">
                                <span className="font-bebas text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 tracking-widest uppercase font-bold">
                                    TO
                                </span>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                    <span className="font-bebas text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                                        04:00
                                    </span>
                                    <span className="font-bebas text-sm sm:text-base font-bold text-red-600">
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

                {/* Closed Notice Banner */}
                {!venueStatus.isOpen && (
                    <div className="mt-2.5 px-4 py-1.5 rounded-full bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold font-body flex items-center gap-2 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span>الصالة مغلقة حالياً — نتشرف باستقبالكم خلال ساعات العمل الرسمية</span>
                    </div>
                )}
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
                            <span className="font-bebas text-sm text-neutral-500 dark:text-neutral-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors tracking-wider font-bold">
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
                            <h2 className="font-bebas text-lg sm:text-2xl uppercase font-black text-neutral-900 dark:text-white tracking-wide group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
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
                            <span className="font-bebas text-sm text-neutral-500 dark:text-neutral-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors tracking-wider font-bold">
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
                            <Coffee className={`w-12 h-12 sm:w-16 sm:h-16 text-neutral-800 dark:text-white transition-all duration-300 relative z-10 drop-shadow-sm dark:drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] ${isEnteringMenu ? 'scale-110 text-amber-500' : 'group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:scale-110'}`} />
                        </div>

                        {/* Details & Action */}
                        <div className="w-full text-center space-y-1">
                            <h2 className="font-bebas text-lg sm:text-2xl uppercase font-black text-neutral-900 dark:text-white tracking-wide group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight">
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

                {/* PORTAL 3: ESPORTS TOURNAMENTS (Only visible if active) */}
                {hasTournaments && (
                    <Link
                        to="/tournaments"
                        className="mt-3 sm:mt-6 group relative w-full flex items-center justify-between p-3.5 sm:p-6 concrete-card rounded-2xl sm:rounded-3xl border border-neutral-300/80 dark:border-white/10 hover:border-amber-500/60 transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-sm hover:shadow-[0_0_35px_rgba(245,158,11,0.25)] overflow-hidden"
                    >
                        {/* Background subtle glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="flex items-center gap-3 sm:gap-5 relative z-10 w-full">
                            <div className="flex-1 text-right">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-600/30 text-amber-800 dark:text-amber-300 font-bold text-[9px] flex items-center gap-1 border border-amber-200 dark:border-transparent">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                        LIVE TOURNAMENTS
                                    </span>
                                    <span className="font-bebas text-xs text-neutral-500 dark:text-neutral-400 tracking-wider font-bold">
                                        ZONE 03
                                    </span>
                                </div>
                                <h2 className="font-bebas text-lg sm:text-2xl uppercase font-black text-neutral-900 dark:text-white tracking-wide group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight">
                                    ESPORTS ARENA
                                </h2>
                                <p className="font-body text-[10px] sm:text-xs text-neutral-600 dark:text-neutral-400 font-bold mt-0.5 line-clamp-1">
                                    بطولات تنافسية نشطة، انضم الآن ونافس على الجوائز!
                                </p>
                            </div>

                            <div className="shrink-0 flex flex-col items-center justify-center relative w-12 h-12 sm:w-16 sm:h-16">
                                <div className="absolute inset-0 rounded-full bg-amber-600/10 dark:bg-amber-600/20 blur-lg group-hover:scale-125 transition-all" />
                                <Trophy className="w-7 h-7 sm:w-9 sm:h-9 text-amber-500 relative z-10 drop-shadow-sm group-hover:scale-110 transition-transform" />
                            </div>
                        </div>
                    </Link>
                )}
            </section>

            {/* VIP Entertainment Features (beIN SPORTS & Netflix 4K) */}
            <section className="relative z-10 w-full max-w-2xl mx-auto my-2 px-2 shrink-0">
                <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-2xl bg-white/75 dark:bg-[#150f11]/85 border border-neutral-300/80 dark:border-white/10 backdrop-blur-md shadow-sm">
                    {/* beIN SPORTS */}
                    <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-neutral-50/90 dark:bg-white/[0.04] border border-neutral-200/70 dark:border-white/5">
                        <BeinSportsIcon className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 object-contain drop-shadow-xs" />
                        <div className="flex flex-col text-right min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="font-bebas text-xs sm:text-sm font-black tracking-wider text-neutral-900 dark:text-white">
                                    beIN SPORTS
                                </span>
                                <span className="text-[9px] font-bold px-1 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                                    4K
                                </span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-neutral-600 dark:text-neutral-400 font-body truncate">
                                بث مباشر لكافة البطولات
                            </span>
                        </div>
                    </div>

                    {/* NETFLIX */}
                    <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-neutral-50/90 dark:bg-white/[0.04] border border-neutral-200/70 dark:border-white/5">
                        <NetflixIcon className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-lg shadow-xs" />
                        <div className="flex flex-col text-right min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="font-bebas text-xs sm:text-sm font-black tracking-wider text-neutral-900 dark:text-white">
                                    NETFLIX
                                </span>
                                <span className="text-[9px] font-bold px-1 rounded bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50">
                                    PREMIUM
                                </span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-neutral-600 dark:text-neutral-400 font-body truncate">
                                سينما وترفيه متواصل
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Official Instagram Showcase Card */}
            <div className="relative z-10 w-full max-w-md mx-auto my-1.5 px-2 shrink-0">
                <a
                    href={CONTACT_INFO.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white/80 dark:bg-[#160e11]/90 hover:bg-white dark:hover:bg-[#1e1317] border border-neutral-300/80 dark:border-white/10 hover:border-pink-500/50 dark:hover:border-pink-500/40 backdrop-blur-md shadow-sm hover:shadow-[0_4px_20px_rgba(225,48,108,0.2)] transition-all active:scale-[0.98]"
                    aria-label="صفحة إنستجرام الرسمية"
                >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <InstagramGradientIcon className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-sm shrink-0 group-hover:scale-105 transition-transform" />
                        <div className="flex flex-col text-right min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="font-body text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                                    تابعنا على إنستجرام
                                </span>
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40">
                                    {CONTACT_INFO.instagramHandle}
                                </span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 font-body truncate">
                                كواليس الصالة، مواعيد البطولات وأجدد العروض 📸
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-100 group-hover:bg-pink-50 dark:bg-white/10 dark:group-hover:bg-pink-950/50 text-neutral-700 group-hover:text-pink-600 dark:text-neutral-200 dark:group-hover:text-pink-300 text-xs font-bold transition-colors shrink-0">
                        <span className="hidden xs:inline">زيارة</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                </a>
            </div>

            {/* Bottom Signoff */}
            <footer className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center space-y-1.5 shrink-0">
                <div className="px-4 py-1.5 rounded-lg bg-red-100 dark:bg-red-950/70 border border-red-300 dark:border-red-700/50 shadow-sm dark:shadow-lg">
                    <p className="font-bebas text-sm sm:text-base text-red-800 dark:text-red-200 tracking-wider font-bold">
                        THANK YOU &amp; ENJOY YOUR TIME!
                    </p>
                </div>
                <a
                    href={CONTACT_INFO.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-body text-[10px] text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 tracking-widest uppercase transition-colors group cursor-pointer"
                    title="فتح الموقع على خرائط جوجل"
                >
                    <MapPin size={11} className="text-red-600 shrink-0 group-hover:scale-110 transition-transform" />
                    <span>D95 GAMING &amp; CAFÉ • EL-QUDAH, KAFR SAQR</span>
                    <ExternalLink size={9} className="opacity-60 group-hover:opacity-100" />
                </a>
            </footer>

            <TournamentAnnouncementPopup />
        </main>
    );
}
