import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowRight,
    Gamepad2,
    Tv,
    Volume2,
    Wind,
    Coffee,
    Clock,
    Wifi,
    ShieldCheck,
    Disc3,
    Flame,
    Sun,
    Moon,
    Sparkles,
    ShoppingBag,
    Check,
    type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import room01InteriorImg from '@/assets/doors/room-01-interior.jpg';
import room02InteriorImg from '@/assets/doors/room-02-interior.jpg';
import { useTheme } from '@/stores/themeStore';
import { useCart } from '@/stores/cartStore';

interface RoomData {
    id: string;
    code: string;
    titleEn: string;
    titleAr: string;
    subtitle: string;
    rate: number;
    badge: string;
    accentColor: string;
    glowColor: string;
    neonBorder: string;
    neonShadow: string;
    interiorImg: string;
    features: {
        icon: LucideIcon;
        label: string;
        desc: string;
    }[];
    popularGames: string[];
}

const ROOMS: RoomData[] = [
    {
        id: 'room-1',
        code: 'ROOM 01',
        titleEn: 'THE ARENA',
        titleAr: 'غرفة الأبطال (Play Room 01)',
        subtitle: 'أجواء تنافسية حماسية • شاشة 65 بوصة 4K 120Hz عملاقة',
        rate: 100,
        badge: 'Available',
        accentColor: '#00d2ff',
        glowColor: 'rgba(0, 210, 255, 0.45)',
        neonBorder: 'border-[#00d2ff]',
        neonShadow: 'shadow-[0_0_35px_rgba(0,210,255,0.35)]',
        interiorImg: room01InteriorImg,
        features: [
            {
                icon: Tv,
                label: 'شاشة 65" 4K 120Hz',
                desc: 'معدل تحديث فائق مع دعم HDR الكامل وسرعة استجابة 1ms',
            },
            {
                icon: Gamepad2,
                label: '4 دراعات DualSense',
                desc: 'أذرع تحكم لاسلكية أصلية جاهزة لمباريات اللعب الرباعي',
            },
            {
                icon: Volume2,
                label: 'صوت محيطي 3D وعزل تام',
                desc: 'نظام صوت نقي يضعك في قلب المعركة والمباريات',
            },
            {
                icon: Wind,
                label: 'تكييف مستقل وجلسة VIP',
                desc: 'كنب مريح مصمم لجلسات اللعب الطويلة مع تحكم كامل بالحرارة',
            },
        ],
        popularGames: ['EA FC 25', 'Tekken 8', 'Mortal Kombat 1', 'GTA V', 'Call of Duty'],
    },
    {
        id: 'room-2',
        code: 'ROOM 02',
        titleEn: 'VIP SUITE',
        titleAr: 'غرفة النجوم (VIP Room 02)',
        subtitle: 'إضاءة نيون ونجوم سقفية • شاشة 65 بوصة 4K 120Hz',
        rate: 100,
        badge: 'Available',
        accentColor: '#ff007f',
        glowColor: 'rgba(255, 0, 127, 0.45)',
        neonBorder: 'border-[#ff007f]',
        neonShadow: 'shadow-[0_0_35px_rgba(255,0,127,0.35)]',
        interiorImg: room02InteriorImg,
        features: [
            {
                icon: Tv,
                label: 'شاشة 65" 4K 120Hz',
                desc: 'أعلى دقة وضوح وألوان سينمائية نابضة بالحياة',
            },
            {
                icon: Gamepad2,
                label: '4 دراعات DualSense',
                desc: 'أذرع تحكم معقمة وجاهزة فوراً لكل اللاعبين',
            },
            {
                icon: Volume2,
                label: 'صوت سينمائي محيطي',
                desc: 'مؤثرات واقعية وعزل صوتي كامل لخصوصية تامة',
            },
            {
                icon: Wind,
                label: 'تكييف خاص وركن استرخاء',
                desc: 'أقصى درجات الراحة والاستجمام طوال فترة الجلسة',
            },
        ],
        popularGames: ['EA FC 25', 'Spider-Man 2', 'NBA 2K25', 'Tekken 8', 'Crash Team Racing'],
    },
];

const WALK_IN_ITEMS = [
    {
        id: 'ps-outside',
        nameEn: 'PS5 Open Floor',
        nameAr: 'بلايستيشن الصالة المفتوحة',
        subtitle: 'أجهزة PS5 متطورة في صالة اللعب التنافسية',
        price: 80,
        unitAr: 'ج.م / ساعة',
        icon: Gamepad2,
        specs: [
            'أحدث أجهزة PS5 مع دراعات DualSense أصلية',
            'لعب سريع ومباشر في الصالة التنافسية',
            'طلب مشروبات وسناكس مباشرة من الكافيه',
        ],
        hint: 'أجهزة الصالة متاحة للعب المباشر عند حضورك للمحل دون حجز مسبق 🎮',
    },
    {
        id: 'billiards',
        nameEn: 'Pro Billiards',
        nameAr: 'طاولة بلياردو احترافية',
        subtitle: 'طاولة قياسية بإضاءة وتجهيزات متكاملة',
        price: 15,
        unitAr: 'ج.م / جيم',
        icon: Disc3,
        specs: [
            'طاولة قياسية عالمية نظيفة وموزونة بدقة',
            'كرات وعصي مستوردة احترافية وإضاءة مخصصة',
            'أجواء استراحة ولعب راقية ومريحة للشلة',
        ],
        hint: 'طاولة البلياردو متاحة للعب المباشر بالفرع فور وصولك دون حجز مسبق 🎱',
    },
];

const AMENITIES = [
    {
        icon: Wifi,
        title: 'إنترنت فايبر فائق السرعة',
        desc: 'شبكة مخصصة للجيمنج مع بنج منخفض جداً للألعاب التنافسية أونلاين',
    },
    {
        icon: Flame,
        title: 'أحدث مكتبة ألعاب 2026',
        desc: 'أحدث إصدارات الألعاب محدثة دائماً وجاهزة للتشغيل الفوري',
    },
    {
        icon: Coffee,
        title: 'ضيافة الكافيه حتى غرفتك',
        desc: 'إمكانية طلب القهوة المتخصصة، المشروبات، والسناكس مباشرة داخل الغرفة',
    },
    {
        icon: ShieldCheck,
        title: 'نظافة وتعقيم مستمر',
        desc: 'تعقيم كامل للدراعات والشاشات ونظافة فندقية بعد كل جلسة',
    },
];

export default function PlaystationPage() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { itemCount, openCart } = useCart();

    // ─────────────────────────────────────────────────────────────
    // FAST & INSTANT ROOM ENTER (ZERO LAG • 60FPS SMOOTH)
    // ─────────────────────────────────────────────────────────────
    const handleDoorEnter = (room: RoomData) => {
        navigate('/playstation/booking', {
            state: {
                room: {
                    id: room.id,
                    name: room.titleAr,
                    nameEn: room.code,
                    rate: room.rate,
                },
            },
        });
    };

    const handleWalkInClick = (hint: string) => {
        toast.info(hint, {
            duration: 4500,
        });
    };

    return (
        <div className="bg-[#F6F5F2] dark:bg-[#0c0608] text-neutral-900 dark:text-white font-body text-sm flex flex-col min-h-screen selection:bg-red-600/40 relative overflow-x-hidden transition-colors duration-200">
            {/* Ambient Background Glow */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[380px] bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,0.15)_0%,rgba(139,17,25,0.04)_45%,transparent_75%)]" />
                <div className="absolute top-1/3 -left-32 w-[500px] h-[450px] bg-[radial-gradient(circle,rgba(155,28,28,0.10)_0%,transparent_70%)]" />
                <div className="absolute bottom-10 -right-32 w-[500px] h-[450px] bg-[radial-gradient(circle,rgba(212,160,23,0.08)_0%,transparent_70%)]" />
            </div>

            {/* Top Navigation Bar */}
            <header className="fixed top-0 inset-x-0 z-40 bg-white/95 dark:bg-[#14080b]/95 backdrop-blur-xl pt-safe border-b border-neutral-200 dark:border-red-900/30 shadow-md dark:shadow-[0_4px_25px_rgba(0,0,0,0.7)] transition-colors duration-200">
                <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-6xl mx-auto" dir="rtl">
                    {/* Brand & Back Link */}
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            aria-label="الرجوع للبوابة الرئيسية"
                            title="الرجوع للبوابة الرئيسية"
                            className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-neutral-800 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-95 cursor-pointer border border-neutral-200 dark:border-white/15 shadow-sm shrink-0"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div className="flex flex-col text-right">
                            <div className="flex items-center gap-2">
                                <div dir="ltr" className="flex items-baseline leading-none">
                                    <span className="font-brush font-black text-xl text-neutral-900 dark:text-neutral-100">D</span>
                                    <span className="font-brush font-black text-2xl text-red-600 dark:text-red-500 -ml-0.5">95</span>
                                </div>
                                <span className="h-1.5 w-1.5 bg-red-600 rounded-full inline-block shadow-[0_0_8px_#c41e3a]" />
                                <span className="text-[10px] font-bold bg-red-100 dark:bg-red-600/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-brush tracking-wider border border-red-200 dark:border-red-600/30">
                                    GAMING LOUNGE
                                </span>
                            </div>
                            <span className="font-body text-[10px] text-neutral-500 dark:text-neutral-400">
                                أبواب الغرف الخاصة VIP والصالة
                            </span>
                        </div>
                    </div>

                    {/* Center: Desktop Navigation Tabs (Visible on md: and above) */}
                    <div className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-neutral-100/80 dark:bg-white/[0.05] border border-neutral-200/80 dark:border-white/10 text-xs font-body font-semibold">
                        <Link
                            to="/"
                            className="px-3.5 py-1.5 rounded-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 transition-all"
                        >
                            البوابة
                        </Link>
                        <span className="px-3.5 py-1.5 rounded-full bg-red-600 text-white shadow-xs font-bold">
                            صالة الألعاب
                        </span>
                        <Link
                            to="/menu"
                            className="px-3.5 py-1.5 rounded-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 transition-all"
                        >
                            منيو الكافيه
                        </Link>
                    </div>

                    {/* Actions: Theme Toggle & Cart */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 border border-neutral-200 dark:border-white/15 text-neutral-800 dark:text-neutral-200 shadow-sm active:scale-95"
                            aria-label="تبديل المظهر"
                        >
                            {theme === 'dark' ? (
                                <Sun size={17} className="text-amber-400" />
                            ) : (
                                <Moon size={17} className="text-neutral-800" />
                            )}
                        </button>

                        <button
                            onClick={() => openCart('playstation')}
                            className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 border border-neutral-200 dark:border-white/15 text-neutral-800 dark:text-neutral-200 hover:text-red-600 dark:hover:text-white shadow-sm active:scale-95"
                            aria-label="سلة التسوق"
                        >
                            <ShoppingBag size={18} />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center text-white font-mono font-bold rounded-full bg-red-600 border-2 border-white dark:border-[#14080b] shadow-xs text-[9px] w-5 h-5">
                                    {itemCount > 99 ? '99+' : itemCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Container */}
            <main className="flex-1 flex flex-col relative z-10 w-full pt-16 sm:pt-24 pb-28 sm:pb-24 px-2 sm:px-6 max-w-6xl mx-auto" dir="rtl">

                {/* ─────────────────────────────────────────────────────────────
                    HEADER: "CHOOSE YOUR GAMING ROOM"
                   ───────────────────────────────────────────────────────────── */}
                <div className="text-center mt-0 sm:mt-1 mb-3.5 sm:mb-8 space-y-1">
                    <span className="text-[9px] sm:text-xs font-brush tracking-[0.25em] text-neutral-500 dark:text-neutral-400 uppercase">
                        CHOOSE YOUR
                    </span>
                    <h1 className="font-brush text-2xl sm:text-5xl md:text-6xl font-black text-neutral-900 dark:text-white tracking-wider flex items-center justify-center gap-2 drop-shadow-sm dark:drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                        <span>GAMING</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 dark:from-cyan-400 dark:via-sky-400 dark:to-blue-500 drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                            ROOM
                        </span>
                    </h1>
                    <p className="text-[11px] sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto font-body font-medium px-2 line-clamp-1 sm:line-clamp-none">
                        غرفتان مجهزتان بأحدث تقنيات الـ PlayStation 5 • عزل صوتي كامل وشاشات 4K 120Hz
                    </p>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    VIP GAMING SUITE PORTALS: SIDE-BY-SIDE ON MOBILE & DESKTOP
                   ───────────────────────────────────────────────────────────── */}
                <section className="mb-8 sm:mb-12">
                    <div className="grid grid-cols-2 gap-2 sm:gap-6 max-w-5xl mx-auto">
                        {ROOMS.map((room) => {
                            const isRoom1 = room.id === 'room-1';

                            return (
                                <div
                                    key={room.id}
                                    onClick={() => handleDoorEnter(room)}
                                    className={`group relative rounded-2xl sm:rounded-3xl bg-white dark:bg-[#11070a] border-2 transition-all duration-300 ease-out cursor-pointer overflow-hidden flex flex-col justify-between shadow-md sm:shadow-lg active:scale-[0.985] ${
                                        isRoom1
                                            ? 'border-cyan-500/40 hover:border-cyan-400 shadow-[0_4px_20px_rgba(0,210,255,0.12)] hover:shadow-[0_12px_40px_rgba(0,210,255,0.25)]'
                                            : 'border-rose-500/40 hover:border-rose-400 shadow-[0_4px_20px_rgba(255,0,127,0.12)] hover:shadow-[0_12px_40px_rgba(255,0,127,0.25)]'
                                    }`}
                                >
                                    {/* 1. CINEMATIC INTERIOR IMAGE SHOWCASE */}
                                    <div className="relative w-full aspect-[4/3] xs:aspect-[16/11] sm:aspect-[16/9] overflow-hidden bg-neutral-950">
                                        <img
                                            src={room.interiorImg}
                                            alt={room.titleAr}
                                            loading="eager"
                                            decoding="async"
                                            className="w-full h-full object-cover brightness-[0.85] contrast-[1.08] group-hover:scale-105 group-hover:brightness-95 transition-all duration-500 ease-out"
                                        />

                                        {/* Ambient gradient scrim */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#11070a] via-black/25 to-black/60 pointer-events-none" />

                                        {/* Floating Top Bar: Live Status Beacon & Cyber Monospace Room Code */}
                                        <div className="absolute top-2 inset-x-2 sm:top-3 sm:inset-x-3 z-10 flex items-center justify-between pointer-events-none">
                                            {/* Right (RTL Start): Live Status Beacon */}
                                            <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-black/80 backdrop-blur-md border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                                                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
                                                </span>
                                                <span className="text-[9px] sm:text-[11px] font-bold text-emerald-300 font-sans tracking-tight sm:tracking-wide">
                                                    <span className="xs:hidden">متاح</span>
                                                    <span className="hidden xs:inline">متاح للحجز الآن</span>
                                                </span>
                                            </div>

                                            {/* Left (RTL End): Cyber Room Tag */}
                                            <div className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-sm">
                                                <span
                                                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                                                        isRoom1
                                                            ? 'bg-cyan-400 shadow-[0_0_6px_#00d2ff]'
                                                            : 'bg-rose-400 shadow-[0_0_6px_#ff007f]'
                                                    }`}
                                                />
                                                <span className="font-mono text-[9px] sm:text-[11px] font-black tracking-wider uppercase">
                                                    {room.code}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Bottom Overlay over Image */}
                                        <div className="absolute bottom-2 inset-x-2 sm:bottom-3 sm:inset-x-3.5 z-10 flex items-end justify-between gap-1 sm:gap-2 pointer-events-none">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                                                    <span
                                                        className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded ${
                                                            isRoom1
                                                                ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/40'
                                                                : 'bg-rose-950/90 text-rose-300 border border-rose-500/40'
                                                        }`}
                                                    >
                                                        {room.titleEn}
                                                    </span>
                                                    <span className="text-[9px] sm:text-[11px] text-neutral-300 font-body font-semibold hidden md:inline">
                                                        PlayStation 5 VIP
                                                    </span>
                                                </div>
                                                <h3 className="font-brush text-sm sm:text-2xl font-black text-white drop-shadow-md truncate">
                                                    {isRoom1 ? 'غرفة الأبطال' : 'غرفة النجوم VIP'}
                                                </h3>
                                            </div>

                                            {/* Interactive Cue (desktop only) */}
                                            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold group-hover:bg-white/25 transition-colors">
                                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                                <span>دخول سريع</span>
                                                <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. CARD BODY: SUBTITLE & 4 SPECS */}
                                    <div className="p-2 sm:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-4 text-right">
                                        <p className="text-[10px] sm:text-xs text-neutral-600 dark:text-neutral-300 font-body leading-tight sm:leading-relaxed line-clamp-1 sm:line-clamp-2">
                                            {room.subtitle}
                                        </p>

                                        {/* 4 Feature Badges in 2x2 Grid */}
                                        <div className="grid grid-cols-2 gap-1 sm:gap-2">
                                            <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08]">
                                                <Tv
                                                    className={`w-3 h-3 sm:w-4 sm:h-4 shrink-0 ${
                                                        isRoom1 ? 'text-cyan-500' : 'text-rose-500'
                                                    }`}
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-[8px] sm:text-[9px] text-neutral-500 dark:text-neutral-400 truncate">الشاشة</div>
                                                    <div className="text-[9px] sm:text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                                                        65" 4K
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08]">
                                                <Gamepad2
                                                    className={`w-3 h-3 sm:w-4 sm:h-4 shrink-0 ${
                                                        isRoom1 ? 'text-cyan-500' : 'text-rose-500'
                                                    }`}
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-[8px] sm:text-[9px] text-neutral-500 dark:text-neutral-400 truncate">التحكم</div>
                                                    <div className="text-[9px] sm:text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                                                        4 دراعات
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08]">
                                                <Volume2
                                                    className={`w-3 h-3 sm:w-4 sm:h-4 shrink-0 ${
                                                        isRoom1 ? 'text-cyan-500' : 'text-rose-500'
                                                    }`}
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-[8px] sm:text-[9px] text-neutral-500 dark:text-neutral-400 truncate">الصوت</div>
                                                    <div className="text-[9px] sm:text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                                                        صوت 3D
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08]">
                                                <Wind
                                                    className={`w-3 h-3 sm:w-4 sm:h-4 shrink-0 ${
                                                        isRoom1 ? 'text-cyan-500' : 'text-rose-500'
                                                    }`}
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-[8px] sm:text-[9px] text-neutral-500 dark:text-neutral-400 truncate">الراحة</div>
                                                    <div className="text-[9px] sm:text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                                                        تكييف VIP
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. FOOTER: RATE & PRIMARY CTA */}
                                        <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-1.5 sm:gap-3 pt-2 sm:pt-3 border-t border-neutral-200 dark:border-white/[0.08]">
                                            <div className="flex items-baseline justify-between xs:justify-start xs:flex-col text-right">
                                                <div className="flex items-baseline gap-1" dir="ltr">
                                                    <span className="font-brush text-lg sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                                                        {room.rate}
                                                    </span>
                                                    <span className="text-[10px] sm:text-xs font-bold text-neutral-500 dark:text-neutral-400 font-sans">
                                                        EGP / HR
                                                    </span>
                                                </div>
                                                <span className="text-[8px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 font-medium hidden xs:inline">
                                                    حجز بالساعة أو مفتوح
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDoorEnter(room);
                                                }}
                                                className={`w-full xs:w-auto px-2.5 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
                                                    isRoom1
                                                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/30 border border-cyan-400/40'
                                                        : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-900/30 border border-rose-400/40'
                                                }`}
                                            >
                                                <span>احجز الآن</span>
                                                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* SECONDARY SECTION: OPEN FLOOR & BILLIARDS (WALK-IN ONLY) */}
                <section className="mb-12">
                    <div className="text-center mb-6 space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>لعب مباشر بالفرع • بدون حجز مسبق</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold font-body text-neutral-900 dark:text-white">
                            صالة اللعب المفتوحة والبلياردو
                        </h2>
                        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
                            أجهزة الصالة وطاولة البلياردو متاحة للعب الفوري عند حضورك للفرع مباشرة
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                        {WALK_IN_ITEMS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleWalkInClick(item.hint)}
                                    className="group relative rounded-2xl p-5 bg-white dark:bg-[#150a0e] hover:bg-neutral-50 dark:hover:bg-[#1e0e14] border border-neutral-200 dark:border-white/10 hover:border-amber-500/50 dark:hover:border-amber-500/40 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between gap-4 text-right"
                                >
                                    {/* Top: Icon + Titles + Direct Status */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                                                    {item.nameAr}
                                                </h3>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                    {item.nameEn} • {item.subtitle}
                                                </p>
                                            </div>
                                        </div>

                                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 whitespace-nowrap">
                                            متاح فوراً
                                        </span>
                                    </div>

                                    {/* Features Checklist */}
                                    <ul className="space-y-2 py-1">
                                        {item.specs.map((spec, sIdx) => (
                                            <li key={sIdx} className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                <span>{spec}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Footer: Price + Note */}
                                    <div className="flex items-center justify-between border-t border-neutral-100 dark:border-white/10 pt-3 mt-1">
                                        <div className="flex items-baseline gap-1.5" dir="rtl">
                                            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                                                {item.price}
                                            </span>
                                            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                                                {item.unitAr}
                                            </span>
                                        </div>

                                        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1.5">
                                            <span>حضور مباشر بالفرع</span>
                                            <span>🏬</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* VENUE AMENITIES & TRUST GUARANTEE */}
                <section className="mb-10 max-w-5xl mx-auto w-full">
                    <div className="rounded-3xl bg-white dark:bg-[#1a0c10]/95 border-2 border-neutral-200 dark:border-red-600/35 p-5 sm:p-7 shadow-xl">
                        <div className="text-center mb-6">
                            <h3 className="font-brush text-lg sm:text-xl text-neutral-900 dark:text-white">
                                تجربة لا مثيل لها في D95 GAMING LOUNGE
                            </h3>
                            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                                أعلى معايير الجودة والراحة لنوفر لك أفضل جلسة لعب مع أصدقائك
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {AMENITIES.map((amenity, aIdx) => {
                                const Icon = amenity.icon;
                                return (
                                    <div
                                        key={aIdx}
                                        className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#261016] border border-neutral-200 dark:border-red-500/25 flex flex-col items-center text-center space-y-2 shadow-sm"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-600/50 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-bold text-xs text-neutral-900 dark:text-white">
                                            {amenity.title}
                                        </h4>
                                        <p className="text-[11px] text-neutral-300 leading-relaxed">
                                            {amenity.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Operating Hours Box & Brand Signoff */}
                <footer className="text-center space-y-3 pt-2">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white dark:bg-[#18090d] border border-neutral-300 dark:border-red-600/40 text-xs text-neutral-800 dark:text-neutral-200 shadow-sm">
                        <Clock className="w-4 h-4 text-red-600 dark:text-red-500" />
                        <span>مواعيد العمل المعتمدة: يومياً من <strong>08:00 صباحاً</strong> حتى <strong>04:00 فجراً</strong></span>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-1 pt-2">
                        <p className="font-brush text-xs sm:text-sm text-red-600 dark:text-red-500/90 tracking-[0.25em]">
                            THANK YOU &amp; ENJOY YOUR TIME!
                        </p>
                        <p className="font-body text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                            D95 GAMING LOUNGE &amp; CAFÉ • CAIRO
                        </p>
                    </div>
                </footer>
            </main>
        </div>
    );
}
