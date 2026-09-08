import { useState } from 'react';
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
    User,
    Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import door01HdImg from '@/assets/doors/door-01-hd.jpg';
import door02HdImg from '@/assets/doors/door-02-hd.jpg';
import door01LeafImg from '@/assets/doors/door-01-leaf.jpg';
import door02LeafImg from '@/assets/doors/door-02-leaf.jpg';
import room01InteriorImg from '@/assets/doors/room-01-interior.jpg';
import room02InteriorImg from '@/assets/doors/room-02-interior.jpg';
import hallwayFloorImg from '@/assets/doors/hallway-floor.jpg';
import { playPs5StartupSound } from '@/lib/sound';

interface RoomData {
    id: string;
    code: string;
    number: string;
    titleEn: string;
    titleAr: string;
    subtitle: string;
    rate: number;
    badge: string;
    accentColor: string;
    glowColor: string;
    neonBorder: string;
    neonShadow: string;
    doorHdImg: string;
    doorLeafImg: string;
    interiorImg: string;
    hingeSide: 'left' | 'right';
    features: {
        icon: any;
        label: string;
        desc: string;
    }[];
    popularGames: string[];
}

const ROOMS: RoomData[] = [
    {
        id: 'room-1',
        code: 'ROOM 01',
        number: '01',
        titleEn: 'THE ARENA',
        titleAr: 'غرفة الأبطال (Play Room 01)',
        subtitle: 'أجواء تنافسية حماسية • شاشة 65 بوصة 4K 120Hz عملاقة',
        rate: 100,
        badge: 'Available',
        accentColor: '#00d2ff',
        glowColor: 'rgba(0, 210, 255, 0.45)',
        neonBorder: 'border-[#00d2ff]',
        neonShadow: 'shadow-[0_0_35px_rgba(0,210,255,0.35)]',
        doorHdImg: door01HdImg,
        doorLeafImg: door01LeafImg,
        interiorImg: room01InteriorImg,
        hingeSide: 'left',
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
        number: '02',
        titleEn: 'VIP SUITE',
        titleAr: 'غرفة النجوم (VIP Room 02)',
        subtitle: 'إضاءة نيون ونجوم سقفية • شاشة 65 بوصة 4K 120Hz',
        rate: 100,
        badge: 'Available',
        accentColor: '#b026ff',
        glowColor: 'rgba(176, 38, 255, 0.45)',
        neonBorder: 'border-[#b026ff]',
        neonShadow: 'shadow-[0_0_35px_rgba(176,38,255,0.35)]',
        doorHdImg: door02HdImg,
        doorLeafImg: door02LeafImg,
        interiorImg: room02InteriorImg,
        hingeSide: 'right',
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
        nameEn: 'PS5 OPEN FLOOR',
        nameAr: 'بلايستيشن الصالة المفتوحة',
        subtitle: '2 أجهزة PS5 متوفرة في صالة اللعب التنافسية',
        price: 80,
        unit: 'EGP / HOUR',
        badge: 'حجز مباشر بالفرع فقط 🏬',
        icon: Gamepad2,
        specs: ['أحدث أجهزة PS5 مع دراعات أصلية', 'لعب سريع ومباشر بدون انتظار', 'طلب مشروبات وسناكس من الكافيه'],
        hint: 'الحجز واللعب متاح مباشرة عند حضورك للمحل دون الحاجة لحجز مسبق عبر الموقع 🎮',
    },
    {
        id: 'billiards',
        nameEn: 'PRO BILLIARDS',
        nameAr: 'طاولة بلياردو احترافية',
        subtitle: 'طاولة قياسية عالمية بتجهيزات كاملة وإضاءة مخصصة',
        price: 15,
        unit: 'EGP / GAME',
        badge: 'حجز مباشر بالفرع فقط 🏬',
        icon: Disc3,
        specs: ['كرات وعصي مستوردة احترافية', 'طاولة نظيفة وموزونة بدقة', 'أجواء استراحة ولعب راقية'],
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

function PlayStationLogoSvg({ className = 'w-5 h-5' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M8.567 19.902c-.752-.294-1.29-.861-1.37-1.464-.09-.691.31-1.288 1.09-1.636l2.13-.951v-3.32l-2.02.899c-1.899.852-3.23 2.11-3.23 3.65 0 2.298 2.65 3.84 6.35 3.84 1.25 0 2.37-.18 3.32-.51v-2.01c-.96.34-2.05.51-3.2.51-1.21 0-2.31-.34-3.07-1.008zM14.73 8.35v6.52c1.4-.49 2.45-1.38 2.45-2.45 0-1.21-.92-2.14-2.45-2.67v-1.4zm5.09 3.01c-.04-2.83-2.73-4.83-6.22-4.83-1.61 0-3.07.44-4.14 1.19l-.33.23v10.82l3.4-1.52v-6.93c1.51.52 2.67 1.63 2.67 3.01 0 1.28-.97 2.36-2.47 2.87l-.2.07v2.24l.58-.11c3.87-.71 6.71-3.29 6.71-7.04z" />
        </svg>
    );
}

export default function PlaystationPage() {
    const navigate = useNavigate();
    const [hoveredDoor, setHoveredDoor] = useState<'room-1' | 'room-2' | null>(null);
    const [openingDoorId, setOpeningDoorId] = useState<string | null>(null);
    const [handleTurningDoorId, setHandleTurningDoorId] = useState<string | null>(null);
    const [isWalkingThrough, setIsWalkingThrough] = useState(false);
    const [activeRoomData, setActiveRoomData] = useState<RoomData | null>(null);

    // ─────────────────────────────────────────────────────────────
    // INTERACTIVE REALISTIC 3D DOOR OPENING & CAMERA WALK-IN
    // ─────────────────────────────────────────────────────────────
    const handleDoorEnter = (room: RoomData) => {
        if (openingDoorId) return; // Prevent double trigger
        setActiveRoomData(room);
        setOpeningDoorId(room.id);
        setHandleTurningDoorId(room.id);

        // 1. Authentic PS5 startup sound plays immediately
        playPs5StartupSound();

        // 2. Mechanical handle returns after latch release (180ms)
        setTimeout(() => {
            setHandleTurningDoorId(null);
        }, 180);

        // 3. Cinematic camera dollies forward through the open doorway into the room
        setTimeout(() => {
            setIsWalkingThrough(true);
        }, 460);

        // 4. Smooth handoff into the room booking page with pre-selected room
        setTimeout(() => {
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
        }, 1280);
    };

    const handleWalkInClick = (hint: string) => {
        toast.info(hint, {
            duration: 4500,
        });
    };

    return (
        <div className="bg-[#080508] text-white font-body text-sm flex flex-col min-h-screen selection:bg-red-600/40 relative overflow-x-hidden">
            {/* Ambient Background Architectural Lighting */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-[radial-gradient(ellipse_at_top,rgba(0,210,255,0.12)_0%,rgba(176,38,255,0.08)_40%,transparent_75%)] blur-[90px]" />
                <div className="absolute top-1/4 left-[-8%] w-[500px] h-[500px] bg-cyan-950/20 blur-[130px] rounded-full" />
                <div className="absolute top-1/4 right-[-8%] w-[500px] h-[500px] bg-purple-950/20 blur-[130px] rounded-full" />
            </div>

            {/* ─────────────────────────────────────────────────────────────
                TOP NAVIGATION BAR
                [LOGO]  Home  Rooms  About  Contact  •  Profile  Book Now
               ───────────────────────────────────────────────────────────── */}
            <header className="fixed top-0 inset-x-0 z-40 bg-[#0b070d]/90 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.85)]">
                <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-7xl mx-auto">
                    {/* Brand & Logo: D95 & PlayStation */}
                    <Link to="/" className="flex items-center gap-3 group cursor-pointer" aria-label="D95 Gaming Lounge">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition-all shadow-sm">
                            <PlayStationLogoSvg className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col text-left">
                            <div className="flex items-center gap-2">
                                <div dir="ltr" className="flex items-baseline leading-none">
                                    <span className="font-brush font-black text-xl text-neutral-100">D</span>
                                    <span className="font-brush font-black text-2xl text-red-500 -ml-0.5">95</span>
                                </div>
                                <span className="text-sm font-brush tracking-wider text-white">
                                    PlayZone
                                </span>
                            </div>
                            <span className="text-[10px] text-neutral-400 font-sans tracking-wide">
                                Play • Relax • Repeat
                            </span>
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link
                            to="/"
                            className="text-sm font-medium text-neutral-300 hover:text-white transition-colors"
                        >
                            Home
                        </Link>
                        <Link
                            to="/playstation"
                            className="text-sm font-bold text-white relative py-1 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-400 after:shadow-[0_0_8px_#00d2ff]"
                        >
                            Rooms
                        </Link>
                        <Link
                            to="/menu"
                            className="text-sm font-medium text-neutral-300 hover:text-white transition-colors"
                        >
                            About
                        </Link>
                        <a
                            href="#contact"
                            className="text-sm font-medium text-neutral-300 hover:text-white transition-colors"
                        >
                            Contact
                        </a>
                    </nav>

                    {/* Right Side: Profile & Primary CTA */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => toast.info('أهلاً بك في صالة D95 Gaming Lounge')}
                            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-all cursor-pointer"
                            aria-label="حساب المستخدم"
                        >
                            <User className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                const el = document.getElementById('hallway-section');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:shadow-[0_0_22px_rgba(225,29,72,0.65)] active:scale-95"
                        >
                            Book Now
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative z-10 w-full pt-20 sm:pt-24 pb-28 sm:pb-24 px-3 sm:px-6 max-w-7xl mx-auto">
                {/* ─────────────────────────────────────────────────────────────
                    CINEMATIC HEADING
                    CHOOSE YOUR GAMING ROOM
                   ───────────────────────────────────────────────────────────── */}
                <div className="text-center mt-3 mb-6 sm:mb-10 space-y-2">
                    <span className="text-xs sm:text-sm font-brush tracking-[0.32em] text-neutral-400 uppercase">
                        CHOOSE YOUR
                    </span>
                    <h1 className="font-brush text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-wider flex items-center justify-center gap-2.5 drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
                        <span>GAMING</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 drop-shadow-[0_0_30px_rgba(6,182,212,0.7)]">
                            ROOM
                        </span>
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-300 max-w-lg mx-auto font-body font-medium px-2">
                        Choose your room and start your gaming experience.
                        <span className="block text-neutral-500 text-[11px] sm:text-xs mt-0.5">
                            غرفتان مجهزتان بأحدث تقنيات الـ PlayStation 5 وشاشات 4K 120Hz
                        </span>
                    </p>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    THE REALISTIC GAMING LOUNGE HALLWAY (DESKTOP & TABLET)
                    BALANCED & SYMMETRICAL • REAL ARCHITECTURAL DOORS
                   ───────────────────────────────────────────────────────────── */}
                <section id="hallway-section" className="hidden md:block mb-14 w-full">
                    <div className="relative w-full rounded-3xl overflow-hidden bg-[#070509] border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
                        {/* Ceiling Bulkhead & Recessed Spotlights */}
                        <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-[#140e18] to-transparent z-20 pointer-events-none border-b border-white/5" />

                        {/* Ceiling Spotlight Cones aimed down directly onto Door 01 & Door 02 */}
                        <div className="absolute top-0 left-[34%] -translate-x-1/2 w-64 h-72 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.22)_0%,rgba(0,210,255,0.18)_35%,transparent_70%)] pointer-events-none blur-xl z-10" />
                        <div className="absolute top-0 left-[66%] -translate-x-1/2 w-64 h-72 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.22)_0%,rgba(176,38,255,0.18)_35%,transparent_70%)] pointer-events-none blur-xl z-10" />

                        {/* Top Spot Fixtures */}
                        <div className="absolute top-2 left-[34%] -translate-x-1/2 w-8 h-2 rounded-full bg-neutral-800 border border-white/30 shadow-[0_0_12px_#fff] z-20 pointer-events-none" />
                        <div className="absolute top-2 left-[66%] -translate-x-1/2 w-8 h-2 rounded-full bg-neutral-800 border border-white/30 shadow-[0_0_12px_#fff] z-20 pointer-events-none" />

                        {/* Hallway Interior Stage */}
                        <div className="relative z-10 px-6 pt-10 pb-4 flex items-center justify-between gap-4 max-w-6xl mx-auto min-h-[580px]">
                            {/* 1. FAR LEFT WALL: Neon Wall Art & Ambient Planter */}
                            <div className="w-[140px] flex flex-col items-center justify-between self-stretch py-8 shrink-0 select-none">
                                <div className="space-y-1 text-center font-brush tracking-wider leading-tight">
                                    <div className="text-cyan-400 text-xs font-black drop-shadow-[0_0_10px_rgba(0,210,255,0.8)]">
                                        GOOD
                                    </div>
                                    <div className="text-cyan-300 text-xs font-black drop-shadow-[0_0_10px_rgba(0,210,255,0.8)]">
                                        GAMES
                                    </div>
                                    <div className="text-blue-400 text-xs font-black drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">
                                        BETTER
                                    </div>
                                    <div className="text-cyan-400 text-xs font-black drop-shadow-[0_0_10px_rgba(0,210,255,0.8)]">
                                        VIBES
                                    </div>
                                    <div className="pt-2 text-cyan-400/80 flex justify-center">
                                        <PlayStationLogoSvg className="w-5 h-5 drop-shadow-[0_0_8px_rgba(0,210,255,0.9)]" />
                                    </div>
                                </div>

                                {/* Architectural Planter with Floor Uplight */}
                                <div className="relative flex flex-col items-center mt-auto">
                                    <div className="absolute -top-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                                    <div className="text-2xl mb-1 filter drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                        🪴
                                    </div>
                                    <div className="w-16 h-14 rounded-md bg-gradient-to-b from-[#18111e] to-[#0d0910] border border-white/10 shadow-lg" />
                                    <div className="w-14 h-1 bg-amber-400/30 blur-[2px] mt-0.5 rounded-full" />
                                </div>
                            </div>

                            {/* 2. ROOM 01 WALL PLAQUE (Mounted to the left of Door 01) */}
                            <div
                                className={`w-[155px] rounded-2xl bg-[#0e0a12]/95 border transition-all duration-300 p-3.5 flex flex-col justify-between shrink-0 shadow-2xl backdrop-blur-md ${
                                    hoveredDoor === 'room-1'
                                        ? 'border-cyan-400/80 shadow-[0_0_25px_rgba(0,210,255,0.35)] scale-105'
                                        : hoveredDoor === 'room-2'
                                        ? 'border-white/5 opacity-50'
                                        : 'border-white/15'
                                }`}
                            >
                                <div className="space-y-3.5">
                                    {/* PS5 Spec */}
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                            <Gamepad2 className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-xs text-white">PS5</span>
                                    </div>

                                    {/* Players Spec */}
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium text-[11px] text-neutral-300">Up to 4 Players</span>
                                    </div>

                                    {/* Rate Spec */}
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-xs text-white">100 EGP / Hr</span>
                                    </div>
                                </div>

                                {/* Available Status Pill */}
                                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 justify-center">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
                                    <span className="text-[11px] font-bold text-emerald-300 font-sans">
                                        Available
                                    </span>
                                </div>
                            </div>

                            {/* 3. REALISTIC ROOM 01 DOOR (Left Entrance) */}
                            <div
                                onMouseEnter={() => setHoveredDoor('room-1')}
                                onMouseLeave={() => setHoveredDoor(null)}
                                onClick={() => handleDoorEnter(ROOMS[0])}
                                className={`relative w-[340px] lg:w-[370px] aspect-[520/910] cursor-pointer select-none transition-all duration-500 ${
                                    hoveredDoor === 'room-1'
                                        ? 'scale-[1.025] z-30 drop-shadow-[0_0_40px_rgba(0,210,255,0.7)]'
                                        : hoveredDoor === 'room-2'
                                        ? 'opacity-55 filter brightness-75 scale-[0.985] z-10'
                                        : 'opacity-100 z-20 drop-shadow-[0_0_20px_rgba(0,210,255,0.35)]'
                                }`}
                                style={{ perspective: '1200px' }}
                            >
                                {/* Base Door Casing & Frame (Cropped from photographic 2K lounge) */}
                                <img
                                    src={door01HdImg}
                                    alt="Room 01 Entrance"
                                    className="w-full h-full object-contain pointer-events-none rounded-xl"
                                />

                                {/* 3D Rotating Door Leaf & Interior Cavity */}
                                <div
                                    className="absolute overflow-hidden rounded-md"
                                    style={{
                                        left: '12.5%',
                                        top: '19.23%',
                                        width: '75%',
                                        height: '76.37%',
                                    }}
                                >
                                    {/* Interior Revealed When Door Swings Open */}
                                    <div className="absolute inset-0 z-0 bg-black">
                                        <img
                                            src={room01InteriorImg}
                                            alt="Room 01 Interior"
                                            className="w-full h-full object-cover brightness-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                                        {/* Volumetric Cyan Light Spill */}
                                        <motion.div
                                            animate={
                                                openingDoorId === 'room-1'
                                                    ? { opacity: [0, 1, 0.85], scale: [0.9, 1.4, 1.7], x: [0, 25, 45] }
                                                    : { opacity: 0, scale: 0.9, x: 0 }
                                            }
                                            transition={{ duration: 0.75, ease: 'easeOut' }}
                                            className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_left,rgba(0,210,255,0.95)_0%,rgba(14,165,233,0.4)_45%,transparent_75%)] mix-blend-screen blur-xl"
                                        />
                                    </div>

                                    {/* The Photographic Door Leaf (Rotates on left hinges into room) */}
                                    <motion.div
                                        animate={{
                                            rotateY: openingDoorId === 'room-1' ? 82 : 0,
                                            boxShadow: openingDoorId === 'room-1'
                                                ? '30px 0 60px rgba(0,0,0,0.98)'
                                                : '0 0 15px rgba(0,0,0,0.7)',
                                        }}
                                        transition={{
                                            duration: 0.72,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        style={{
                                            transformOrigin: 'left center',
                                            transformStyle: 'preserve-3d',
                                        }}
                                        className="absolute inset-0 z-20 overflow-hidden"
                                    >
                                        <img
                                            src={door01LeafImg}
                                            alt="Door 01 Leaf"
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Subtle Observation Window Sheen Highlight */}
                                        <div
                                            className={`absolute top-[18%] right-[18%] w-[28%] h-[64%] pointer-events-none rounded transition-opacity duration-300 ${
                                                hoveredDoor === 'room-1' ? 'opacity-30' : 'opacity-10'
                                            } bg-gradient-to-tr from-cyan-400/40 via-transparent to-white/40`}
                                        />

                                        {/* Mechanical Handle Click Actuation Indicator */}
                                        <motion.div
                                            animate={{
                                                rotate: handleTurningDoorId === 'room-1' ? 14 : 0,
                                                y: handleTurningDoorId === 'room-1' ? 2 : 0,
                                            }}
                                            transition={{ duration: 0.12 }}
                                            style={{ transformOrigin: 'right center' }}
                                            className="absolute top-[52%] right-[11%] w-8 h-2 pointer-events-none"
                                        />
                                    </motion.div>
                                </div>

                                {/* Floating Premium CTA Pill (Appears Smoothly on Hover) */}
                                <div
                                    className={`absolute bottom-8 inset-x-0 mx-auto w-max z-30 transition-all duration-300 ${
                                        hoveredDoor === 'room-1'
                                            ? 'opacity-100 translate-y-0'
                                            : 'opacity-0 translate-y-3 pointer-events-none'
                                    }`}
                                >
                                    <div className="px-5 py-2 rounded-full bg-black/85 backdrop-blur-md border border-cyan-400 text-cyan-300 font-brush tracking-wider text-xs font-black flex items-center gap-2 shadow-[0_0_25px_rgba(0,210,255,0.7)] group">
                                        <span>ENTER ROOM 01</span>
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>

                            {/* 4. REALISTIC ROOM 02 DOOR (Right Entrance) */}
                            <div
                                onMouseEnter={() => setHoveredDoor('room-2')}
                                onMouseLeave={() => setHoveredDoor(null)}
                                onClick={() => handleDoorEnter(ROOMS[1])}
                                className={`relative w-[340px] lg:w-[370px] aspect-[520/910] cursor-pointer select-none transition-all duration-500 ${
                                    hoveredDoor === 'room-2'
                                        ? 'scale-[1.025] z-30 drop-shadow-[0_0_40px_rgba(176,38,255,0.7)]'
                                        : hoveredDoor === 'room-1'
                                        ? 'opacity-55 filter brightness-75 scale-[0.985] z-10'
                                        : 'opacity-100 z-20 drop-shadow-[0_0_20px_rgba(176,38,255,0.35)]'
                                }`}
                                style={{ perspective: '1200px' }}
                            >
                                {/* Base Door Casing & Frame */}
                                <img
                                    src={door02HdImg}
                                    alt="Room 02 Entrance"
                                    className="w-full h-full object-contain pointer-events-none rounded-xl"
                                />

                                {/* 3D Rotating Door Leaf & Interior Cavity */}
                                <div
                                    className="absolute overflow-hidden rounded-md"
                                    style={{
                                        left: '12.5%',
                                        top: '19.23%',
                                        width: '75%',
                                        height: '76.37%',
                                    }}
                                >
                                    {/* Interior Revealed When Door Swings Open */}
                                    <div className="absolute inset-0 z-0 bg-black">
                                        <img
                                            src={room02InteriorImg}
                                            alt="Room 02 Interior"
                                            className="w-full h-full object-cover brightness-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                                        {/* Volumetric Purple Light Spill */}
                                        <motion.div
                                            animate={
                                                openingDoorId === 'room-2'
                                                    ? { opacity: [0, 1, 0.85], scale: [0.9, 1.4, 1.7], x: [0, -25, -45] }
                                                    : { opacity: 0, scale: 0.9, x: 0 }
                                            }
                                            transition={{ duration: 0.75, ease: 'easeOut' }}
                                            className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_right,rgba(176,38,255,0.95)_0%,rgba(217,70,239,0.4)_45%,transparent_75%)] mix-blend-screen blur-xl"
                                        />
                                    </div>

                                    {/* The Photographic Door Leaf (Rotates on right hinges into room) */}
                                    <motion.div
                                        animate={{
                                            rotateY: openingDoorId === 'room-2' ? -82 : 0,
                                            boxShadow: openingDoorId === 'room-2'
                                                ? '-30px 0 60px rgba(0,0,0,0.98)'
                                                : '0 0 15px rgba(0,0,0,0.7)',
                                        }}
                                        transition={{
                                            duration: 0.72,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        style={{
                                            transformOrigin: 'right center',
                                            transformStyle: 'preserve-3d',
                                        }}
                                        className="absolute inset-0 z-20 overflow-hidden"
                                    >
                                        <img
                                            src={door02LeafImg}
                                            alt="Door 02 Leaf"
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Observation Window Sheen Highlight */}
                                        <div
                                            className={`absolute top-[18%] left-[18%] w-[28%] h-[64%] pointer-events-none rounded transition-opacity duration-300 ${
                                                hoveredDoor === 'room-2' ? 'opacity-30' : 'opacity-10'
                                            } bg-gradient-to-tl from-purple-400/40 via-transparent to-white/40`}
                                        />

                                        {/* Mechanical Handle Click Actuation Indicator */}
                                        <motion.div
                                            animate={{
                                                rotate: handleTurningDoorId === 'room-2' ? 14 : 0,
                                                y: handleTurningDoorId === 'room-2' ? 2 : 0,
                                            }}
                                            transition={{ duration: 0.12 }}
                                            style={{ transformOrigin: 'left center' }}
                                            className="absolute top-[52%] left-[11%] w-8 h-2 pointer-events-none"
                                        />
                                    </motion.div>
                                </div>

                                {/* Floating Premium CTA Pill */}
                                <div
                                    className={`absolute bottom-8 inset-x-0 mx-auto w-max z-30 transition-all duration-300 ${
                                        hoveredDoor === 'room-2'
                                            ? 'opacity-100 translate-y-0'
                                            : 'opacity-0 translate-y-3 pointer-events-none'
                                    }`}
                                >
                                    <div className="px-5 py-2 rounded-full bg-black/85 backdrop-blur-md border border-purple-400 text-purple-300 font-brush tracking-wider text-xs font-black flex items-center gap-2 shadow-[0_0_25px_rgba(176,38,255,0.7)] group">
                                        <span>ENTER ROOM 02</span>
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>

                            {/* 5. ROOM 02 WALL PLAQUE (Mounted to the right of Door 02) */}
                            <div
                                className={`w-[155px] rounded-2xl bg-[#0e0a12]/95 border transition-all duration-300 p-3.5 flex flex-col justify-between shrink-0 shadow-2xl backdrop-blur-md ${
                                    hoveredDoor === 'room-2'
                                        ? 'border-purple-400/80 shadow-[0_0_25px_rgba(176,38,255,0.35)] scale-105'
                                        : hoveredDoor === 'room-1'
                                        ? 'border-white/5 opacity-50'
                                        : 'border-white/15'
                                }`}
                            >
                                <div className="space-y-3.5">
                                    {/* PS5 Spec */}
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
                                            <Gamepad2 className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-xs text-white">PS5</span>
                                    </div>

                                    {/* Players Spec */}
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium text-[11px] text-neutral-300">Up to 4 Players</span>
                                    </div>

                                    {/* Rate Spec */}
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-xs text-white">100 EGP / Hr</span>
                                    </div>
                                </div>

                                {/* Available Status Pill */}
                                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 justify-center">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
                                    <span className="text-[11px] font-bold text-emerald-300 font-sans">
                                        Available
                                    </span>
                                </div>
                            </div>

                            {/* 6. FAR RIGHT WALL: PlayStation Neon Symbol & Ambient Planter */}
                            <div className="w-[140px] flex flex-col items-center justify-between self-stretch py-8 shrink-0 select-none">
                                <div className="space-y-3 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(176,38,255,0.6)]">
                                        <PlayStationLogoSvg className="w-7 h-7" />
                                    </div>
                                    <div className="font-brush text-[10px] text-neutral-400 tracking-widest uppercase">
                                        VIP LOUNGE
                                    </div>
                                </div>

                                {/* Architectural Planter with Floor Uplight */}
                                <div className="relative flex flex-col items-center mt-auto">
                                    <div className="absolute -top-10 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
                                    <div className="text-2xl mb-1 filter drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                        🪴
                                    </div>
                                    <div className="w-16 h-14 rounded-md bg-gradient-to-b from-[#18111e] to-[#0d0910] border border-white/10 shadow-lg" />
                                    <div className="w-14 h-1 bg-amber-400/30 blur-[2px] mt-0.5 rounded-full" />
                                </div>
                            </div>
                        </div>

                        {/* Dark Reflective Hallway Floor with Specular Neon Sheen */}
                        <div className="relative w-full h-24 bg-gradient-to-b from-[#09060b] via-[#040206] to-black border-t border-white/5 overflow-hidden">
                            <img
                                src={hallwayFloorImg}
                                alt="Hallway Floor Reflections"
                                className="w-full h-full object-cover opacity-80 mix-blend-screen pointer-events-none"
                            />
                            {/* Dynamic Floor Reflection Under Room 01 (Cyan) */}
                            <div
                                className={`absolute top-0 left-[34%] -translate-x-1/2 w-72 h-16 bg-cyan-500/30 blur-2xl transition-opacity duration-500 pointer-events-none ${
                                    hoveredDoor === 'room-1' ? 'opacity-100' : 'opacity-40'
                                }`}
                            />
                            {/* Dynamic Floor Reflection Under Room 02 (Purple) */}
                            <div
                                className={`absolute top-0 left-[66%] -translate-x-1/2 w-72 h-16 bg-purple-500/30 blur-2xl transition-opacity duration-500 pointer-events-none ${
                                    hoveredDoor === 'room-2' ? 'opacity-100' : 'opacity-40'
                                }`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#080508] via-transparent to-transparent" />
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    MOBILE ROOMS COMPOSITION (STACKED VERTICALLY)
                    LARGE ROOM ENTRANCE • NUMBER • AVAILABILITY • PRICE • ENTER BUTTON
                   ───────────────────────────────────────────────────────────── */}
                <section className="block md:hidden mb-12 space-y-6">
                    {ROOMS.map((room) => {
                        const isOpening = openingDoorId === room.id;
                        const isHandleTurned = handleTurningDoorId === room.id;
                        const isCyan = room.id === 'room-1';

                        return (
                            <div
                                key={room.id}
                                className={`relative w-full rounded-2xl bg-[#0d0912] border p-3 sm:p-4 transition-all duration-300 shadow-2xl overflow-hidden ${
                                    isCyan
                                        ? 'border-cyan-500/40 shadow-[0_0_30px_rgba(0,210,255,0.2)]'
                                        : 'border-purple-500/40 shadow-[0_0_30px_rgba(176,38,255,0.2)]'
                                }`}
                            >
                                {/* Header: Room Code, Title, and Available Badge */}
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                                                isCyan
                                                    ? 'bg-cyan-500 text-black shadow-[0_0_12px_#00d2ff]'
                                                    : 'bg-purple-500 text-white shadow-[0_0_12px_#b026ff]'
                                            }`}
                                        >
                                            {room.number}
                                        </div>
                                        <div className="font-brush text-base text-white tracking-wider">
                                            {room.code}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 border border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[10px] font-bold text-emerald-300 font-sans">
                                            Available
                                        </span>
                                    </div>
                                </div>

                                {/* Large Realistic Architectural Door Entrance */}
                                <div
                                    onClick={() => handleDoorEnter(room)}
                                    className="relative w-full aspect-[520/800] max-h-[420px] rounded-xl overflow-hidden cursor-pointer select-none border border-black/80 bg-black group"
                                    style={{ perspective: '1100px' }}
                                >
                                    {/* Base Photographic Frame */}
                                    <img
                                        src={room.doorHdImg}
                                        alt={room.code}
                                        className="w-full h-full object-contain pointer-events-none"
                                    />

                                    {/* 3D Door Leaf & Interior Reveal */}
                                    <div
                                        className="absolute overflow-hidden rounded-md"
                                        style={{
                                            left: '12.5%',
                                            top: '19.23%',
                                            width: '75%',
                                            height: '76.37%',
                                        }}
                                    >
                                        {/* Interior behind door */}
                                        <div className="absolute inset-0 z-0 bg-black">
                                            <img
                                                src={room.interiorImg}
                                                alt={room.titleAr}
                                                className="w-full h-full object-cover brightness-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                                            {/* Volumetric Light Spill on Open */}
                                            <motion.div
                                                animate={
                                                    isOpening
                                                        ? { opacity: [0, 1, 0.8], scale: [0.9, 1.4, 1.6], x: isCyan ? [0, 20, 35] : [0, -20, -35] }
                                                        : { opacity: 0, scale: 0.9, x: 0 }
                                                }
                                                transition={{ duration: 0.75, ease: 'easeOut' }}
                                                className={`absolute inset-0 pointer-events-none z-10 ${
                                                    isCyan
                                                        ? 'bg-[radial-gradient(ellipse_at_left,rgba(0,210,255,0.95)_0%,rgba(14,165,233,0.4)_45%,transparent_75%)]'
                                                        : 'bg-[radial-gradient(ellipse_at_right,rgba(176,38,255,0.95)_0%,rgba(217,70,239,0.4)_45%,transparent_75%)]'
                                                } mix-blend-screen blur-xl`}
                                            />
                                        </div>

                                        {/* Rotating Door Leaf */}
                                        <motion.div
                                            animate={{
                                                rotateY: isOpening ? (room.hingeSide === 'left' ? 82 : -82) : 0,
                                                boxShadow: isOpening
                                                ? '20px 0 40px rgba(0,0,0,0.98)'
                                                : '0 0 10px rgba(0,0,0,0.7)',
                                            }}
                                            transition={{
                                                duration: 0.72,
                                                ease: [0.22, 1, 0.36, 1],
                                            }}
                                            style={{
                                                transformOrigin: room.hingeSide === 'left' ? 'left center' : 'right center',
                                                transformStyle: 'preserve-3d',
                                            }}
                                            className="absolute inset-0 z-20 overflow-hidden"
                                        >
                                            <img
                                                src={room.doorLeafImg}
                                                alt={room.code}
                                                className="w-full h-full object-cover"
                                            />

                                            {/* Handle Click Motion */}
                                            <motion.div
                                                animate={{
                                                    rotate: isHandleTurned ? 14 : 0,
                                                    y: isHandleTurned ? 2 : 0,
                                                }}
                                                transition={{ duration: 0.12 }}
                                                style={{ transformOrigin: room.hingeSide === 'left' ? 'right center' : 'left center' }}
                                                className="absolute top-[52%] inset-x-0 w-8 h-2 pointer-events-none"
                                            />
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Architectural Plaque Specs Bar */}
                                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-center">
                                    <div className="bg-black/60 rounded-xl p-2 border border-white/10 flex flex-col items-center">
                                        <span className="text-[10px] text-neutral-400">الكونسول</span>
                                        <span className="font-bold text-xs text-white">PS5</span>
                                    </div>
                                    <div className="bg-black/60 rounded-xl p-2 border border-white/10 flex flex-col items-center">
                                        <span className="text-[10px] text-neutral-400">السعة</span>
                                        <span className="font-bold text-xs text-white">4 لاعبين</span>
                                    </div>
                                    <div className="bg-black/60 rounded-xl p-2 border border-white/10 flex flex-col items-center">
                                        <span className="text-[10px] text-neutral-400">السعر</span>
                                        <span className="font-bold text-xs text-white">100 ج.م / س</span>
                                    </div>
                                </div>

                                {/* Full-Width ENTER ROOM Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDoorEnter(room);
                                    }}
                                    className={`w-full mt-3 py-3 px-4 rounded-xl font-brush font-black text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg ${
                                        isCyan
                                            ? 'bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/40 border border-cyan-400/50'
                                            : 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/40 border border-purple-400/50'
                                    }`}
                                >
                                    <span>ENTER {room.code}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    SECONDARY SECTION: OPEN FLOOR & BILLIARDS (WALK-IN ONLY)
                   ───────────────────────────────────────────────────────────── */}
                <section className="mb-12">
                    <div className="text-center mb-5 space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-bold">
                            <span>OPEN FLOOR &amp; BILLIARDS</span>
                            <span className="text-neutral-500">•</span>
                            <span className="text-amber-400">حجز مباشر بالفرع فقط</span>
                        </div>
                        <h2 className="font-brush text-xl sm:text-2xl text-white">
                            صالة اللعب المفتوحة والبلياردو
                        </h2>
                        <p className="text-xs text-neutral-400 max-w-lg mx-auto px-2">
                            أجهزة الصالة وطاولة البلياردو متاحة للعب الفوري عند حضورك للفرع دون الحاجة لحجز مسبق عبر الموقع.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
                        {WALK_IN_ITEMS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleWalkInClick(item.hint)}
                                    className="group relative rounded-2xl p-4 sm:p-5 bg-[#1a0c10]/95 hover:bg-[#241016] border-2 border-red-600/30 hover:border-amber-500/60 transition-all duration-300 cursor-pointer shadow-md flex flex-col justify-between gap-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center shrink-0 text-neutral-200 group-hover:text-amber-400 group-hover:border-amber-500/40 transition-colors">
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-brush text-base sm:text-lg text-white group-hover:text-amber-300 transition-colors">
                                                        {item.nameEn}
                                                    </span>
                                                    <span className="text-xs text-neutral-400 font-bold hidden sm:inline">
                                                        • {item.nameAr}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-neutral-400 mt-0.5">
                                                    {item.subtitle}
                                                </p>
                                            </div>
                                        </div>

                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/60 text-neutral-300 border border-neutral-700 whitespace-nowrap shrink-0">
                                            {item.badge}
                                        </span>
                                    </div>

                                    {/* Specs chips */}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {item.specs.map((spec, sIdx) => (
                                            <span
                                                key={sIdx}
                                                className="px-2.5 py-1 rounded-md bg-black/50 border border-white/10 text-[11px] text-neutral-200 font-medium"
                                            >
                                                {spec}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Price & Footnote */}
                                    <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-1">
                                        <div className="text-left" dir="ltr">
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-brush text-2xl font-black text-amber-400">
                                                    {item.price}
                                                </span>
                                                <span className="font-brush text-xs text-neutral-300">
                                                    {item.unit}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-xs text-neutral-300 font-bold flex items-center gap-1 group-hover:text-white transition-colors">
                                            <span>متاح بالفرع فور وصولك</span>
                                            <span className="text-amber-400">🏬</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    VENUE AMENITIES & TRUST GUARANTEE
                   ───────────────────────────────────────────────────────────── */}
                <section className="mb-10 max-w-5xl mx-auto w-full">
                    <div className="rounded-3xl bg-[#140b10]/95 border border-white/10 p-5 sm:p-7 shadow-xl">
                        <div className="text-center mb-6">
                            <h3 className="font-brush text-lg sm:text-xl text-white">
                                تجربة لا مثيل لها في D95 GAMING LOUNGE
                            </h3>
                            <p className="text-xs text-neutral-400 mt-1">
                                أعلى معايير الجودة والراحة لنوفر لك أفضل جلسة لعب مع أصدقائك
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {AMENITIES.map((amenity, aIdx) => {
                                const Icon = amenity.icon;
                                return (
                                    <div
                                        key={aIdx}
                                        className="p-4 rounded-2xl bg-[#1c1117] border border-white/10 flex flex-col items-center text-center space-y-2 shadow-sm"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-600/50 flex items-center justify-center text-red-400 shadow-sm">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-bold text-xs text-white">
                                            {amenity.title}
                                        </h4>
                                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                                            {amenity.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Operating Hours Box & Brand Signoff */}
                <footer id="contact" className="text-center space-y-3 pt-2">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#140a0e] border border-white/10 text-xs text-neutral-300 shadow-md">
                        <Clock className="w-4 h-4 text-red-500" />
                        <span>مواعيد العمل المعتمدة: يومياً من <strong>08:00 صباحاً</strong> حتى <strong>04:00 فجراً</strong></span>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-1 pt-2">
                        <p className="font-brush text-xs sm:text-sm text-red-500/90 tracking-[0.25em]">
                            THANK YOU &amp; ENJOY YOUR TIME!
                        </p>
                        <p className="font-body text-[10px] text-neutral-400 uppercase tracking-widest">
                            D95 GAMING LOUNGE &amp; CAFÉ • CAIRO
                        </p>
                    </div>
                </footer>
            </main>

            {/* ─────────────────────────────────────────────────────────────
                CINEMATIC FIRST-PERSON CAMERA WALK-IN OVERLAY
                DOORWAY FRAME RUSHES PAST • ROOM ILLUMINATES • MOTION BLUR
               ───────────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {isWalkingThrough && activeRoomData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden bg-black select-none"
                    >
                        {/* The Room Interior - First Person Camera Dolly Forward */}
                        <motion.div
                            initial={{
                                scale: 1.05,
                                filter: 'blur(0px)',
                            }}
                            animate={{
                                scale: 1.75,
                                filter: ['blur(0px)', 'blur(3.5px)', 'blur(0px)'],
                            }}
                            transition={{
                                duration: 0.82,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="absolute inset-0 w-full h-full"
                        >
                            <img
                                src={activeRoomData.interiorImg}
                                alt={activeRoomData.titleAr}
                                className="w-full h-full object-cover brightness-110"
                            />
                        </motion.div>

                        {/* Threshold Doorway Frame Passing Past Camera Viewport */}
                        <motion.div
                            initial={{ scale: 1, opacity: 1 }}
                            animate={{ scale: 3.2, opacity: 0 }}
                            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                            className={`absolute inset-0 border-[32px] sm:border-[48px] pointer-events-none shadow-[inset_0_0_80px_#000] ${
                                activeRoomData.id === 'room-1'
                                    ? 'border-cyan-900/80 shadow-[0_0_60px_rgba(6,182,212,0.8)]'
                                    : 'border-purple-900/80 shadow-[0_0_60px_rgba(176,38,255,0.8)]'
                            }`}
                        />

                        {/* Radiant Ambient Light Flare Spilling into Hallway / Viewport */}
                        <motion.div
                            initial={{ opacity: 0.4, scale: 0.8 }}
                            animate={{ opacity: [0.4, 0.95, 0.25], scale: [0.8, 1.8, 2.5] }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`absolute inset-0 pointer-events-none ${
                                activeRoomData.id === 'room-1'
                                    ? 'bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.7)_0%,rgba(14,165,233,0.3)_40%,transparent_75%)]'
                                    : 'bg-[radial-gradient(circle_at_center,rgba(176,38,255,0.7)_0%,rgba(217,70,239,0.3)_40%,transparent_75%)]'
                            } mix-blend-screen blur-2xl`}
                        />

                        {/* First-person Cinematic HUD Status */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: [0, 1, 0], y: [15, 0, -8] }}
                            transition={{ duration: 0.8, times: [0, 0.4, 1] }}
                            className="relative z-10 flex flex-col items-center gap-2 text-center"
                        >
                            <div
                                className={`px-4 py-1.5 rounded-full backdrop-blur-xl border flex items-center gap-2 shadow-2xl ${
                                    activeRoomData.id === 'room-1'
                                        ? 'bg-cyan-950/85 border-cyan-400/60 text-cyan-200 shadow-cyan-500/40'
                                        : 'bg-purple-950/85 border-purple-400/60 text-purple-200 shadow-purple-500/40'
                                }`}
                            >
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                <span className="font-brush text-sm tracking-widest uppercase text-white">
                                    ENTERING {activeRoomData.code}...
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
