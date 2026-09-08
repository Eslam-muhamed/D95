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
    KeyRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import room01InteriorImg from '@/assets/doors/room-01-interior.jpg';
import room02InteriorImg from '@/assets/doors/room-02-interior.jpg';
import { playPs5StartupSound } from '@/lib/sound';

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

export default function PlaystationPage() {
    const navigate = useNavigate();
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

        // 1. Trigger authentic PS5 startup chime immediately on physical handle touch
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
        <div className="bg-[#0c0608] text-white font-body text-sm flex flex-col min-h-screen selection:bg-red-600/40 relative overflow-x-hidden">
            {/* Ambient Background Glow & Track Spotlights */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[380px] bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,0.25)_0%,rgba(139,17,25,0.08)_45%,transparent_75%)] blur-[80px]" />
                <div className="absolute top-1/3 left-[-10%] w-[500px] h-[450px] bg-red-950/25 blur-[130px] rounded-full" />
                <div className="absolute bottom-10 right-[-10%] w-[500px] h-[450px] bg-amber-950/15 blur-[130px] rounded-full" />
            </div>

            {/* Top Navigation Bar */}
            <header className="fixed top-0 inset-x-0 z-40 bg-[#14080b]/95 backdrop-blur-xl pt-safe border-b border-red-900/30 shadow-[0_4px_25px_rgba(0,0,0,0.7)]">
                <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-6xl mx-auto">
                    {/* Brand & Back Link */}
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            aria-label="الرجوع للرئيسية"
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:text-red-400 transition-all active:scale-95 cursor-pointer border border-white/15 shadow-sm"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div className="flex flex-col text-right">
                            <div className="flex items-center gap-2">
                                <div dir="ltr" className="flex items-baseline leading-none">
                                    <span className="font-brush font-black text-xl text-neutral-100">D</span>
                                    <span className="font-brush font-black text-2xl text-red-500 -ml-0.5">95</span>
                                </div>
                                <span className="h-1.5 w-1.5 bg-red-600 rounded-full inline-block shadow-[0_0_8px_#c41e3a]" />
                                <span className="text-[10px] font-bold bg-red-600/20 text-red-300 px-2 py-0.5 rounded-full font-brush tracking-wider border border-red-600/30">
                                    GAMING LOUNGE
                                </span>
                            </div>
                            <span className="font-body text-[10px] text-neutral-400">
                                أبواب الغرف الخاصة VIP والصالة
                            </span>
                        </div>
                    </div>

                    {/* Quick Link to Café Menu */}
                    <Link
                        to="/menu"
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-xs font-body font-bold text-amber-200 transition-all cursor-pointer shadow-sm hover:border-amber-400"
                    >
                        <Coffee className="w-3.5 h-3.5 text-amber-400" />
                        <span>منيو الكافيه</span>
                    </Link>
                </div>
            </header>

            {/* Main Content Container */}
            <main className="flex-1 flex flex-col relative z-10 w-full pt-20 sm:pt-24 pb-36 sm:pb-24 px-2 sm:px-6 max-w-6xl mx-auto" dir="rtl">

                {/* ─────────────────────────────────────────────────────────────
                    REFERENCE AESTHETICS HEADER: "CHOOSE YOUR GAMING ROOM"
                   ───────────────────────────────────────────────────────────── */}
                <div className="text-center mt-1 mb-6 sm:mb-8 space-y-1.5">
                    <span className="text-[10px] sm:text-xs font-brush tracking-[0.28em] text-neutral-400 uppercase">
                        CHOOSE YOUR
                    </span>
                    <h1 className="font-brush text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-wider flex items-center justify-center gap-2.5 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                        <span>GAMING</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]">
                            ROOM
                        </span>
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto font-body font-medium px-2">
                        غرفتان مجهزتان بأحدث تقنيات الـ PlayStation 5 • عزل صوتي كامل وشاشات 4K 120Hz
                    </p>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    AUTHENTIC 3D DOORS: ALWAYS SIDE-BY-SIDE (GRID-COLS-2)
                    REALISTIC HINGES • HANDLE MOVEMENT • LIGHT SPILL • WALK-IN
                   ───────────────────────────────────────────────────────────── */}
                <section className="mb-10">
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-6 max-w-5xl mx-auto">
                        {ROOMS.map((room) => {
                            const isOpening = openingDoorId === room.id;
                            const isHandleTurned = handleTurningDoorId === room.id;

                            return (
                                <div
                                    key={room.id}
                                    className="relative flex flex-col items-center w-full"
                                >
                                    {/* 1. OUTER NEON-GLOWING FRAME (MATCHING USER REFERENCE) */}
                                    <div
                                        className={`w-full rounded-2xl sm:rounded-3xl bg-[#0d0a10] border-2 ${room.neonBorder} ${room.neonShadow} p-1.5 sm:p-3 relative overflow-hidden backdrop-blur-md transition-all duration-500`}
                                    >
                                        {/* 2. DOORWAY CAVITY (3D PERSPECTIVE ENVIRONMENT) */}
                                        <div
                                            className="relative w-full h-[280px] xs:h-[320px] sm:h-[400px] md:h-[460px] rounded-xl sm:rounded-2xl overflow-hidden select-none border border-black/80 bg-black cursor-pointer group"
                                            style={{ perspective: '1100px' }}
                                            onClick={() => handleDoorEnter(room)}
                                        >
                                            {/* REVEALED 3D ROOM INTERIOR BEHIND THE DOOR */}
                                            <div className="absolute inset-0 z-0 overflow-hidden">
                                                <img
                                                    src={room.interiorImg}
                                                    alt={room.titleAr}
                                                    className="w-full h-full object-cover brightness-110 group-hover:scale-105 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50" />

                                                {/* Available Badge Inside Door Top */}
                                                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 border border-emerald-500/70 shadow-[0_0_12px_rgba(16,185,129,0.35)] backdrop-blur-md">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    <span className="text-[9px] sm:text-[11px] font-bold text-emerald-300 font-sans tracking-wide">
                                                        Available
                                                    </span>
                                                </div>

                                                {/* VOLUMETRIC LIGHT SPILL CONE (BURSTS THROUGH AS DOOR OPENS) */}
                                                <motion.div
                                                    animate={
                                                        isOpening
                                                            ? {
                                                                  opacity: [0, 1, 0.75],
                                                                  scale: [0.8, 1.4, 1.7],
                                                                  x: [0, -25, -45],
                                                              }
                                                            : { opacity: 0, scale: 0.8, x: 0 }
                                                    }
                                                    transition={{ duration: 0.75, ease: 'easeOut' }}
                                                    className={`absolute inset-0 pointer-events-none z-10 ${
                                                        room.id === 'room-1'
                                                            ? 'bg-[radial-gradient(ellipse_at_right,rgba(6,182,212,0.95)_0%,rgba(14,165,233,0.4)_45%,transparent_75%)]'
                                                            : 'bg-[radial-gradient(ellipse_at_right,rgba(244,63,94,0.95)_0%,rgba(168,85,247,0.4)_45%,transparent_75%)]'
                                                    } mix-blend-screen blur-xl`}
                                                />
                                            </div>

                                            {/* 3. THE PHYSICAL 3D DOOR LEAF (SWINGS OPEN ON HINGES) */}
                                            <motion.div
                                                animate={{
                                                    rotateY: isOpening ? -84 : 0,
                                                    x: isOpening ? -6 : 0,
                                                    boxShadow: isOpening
                                                        ? '-30px 0 60px rgba(0,0,0,0.98)'
                                                        : '0 0 20px rgba(0,0,0,0.8)',
                                                }}
                                                transition={{
                                                    duration: 0.72,
                                                    ease: [0.22, 1, 0.36, 1],
                                                }}
                                                style={{
                                                    transformOrigin: 'right center',
                                                    transformStyle: 'preserve-3d',
                                                }}
                                                className="absolute inset-0 z-20 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-white/10 hover:border-white/25 transition-colors duration-300 bg-gradient-to-b from-[#1b151f] via-[#120e15] to-[#0a080d] p-2.5 sm:p-4 flex flex-col justify-between"
                                            >
                                                {/* Door Metallic Brushed Texture */}
                                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06)_0%,transparent_60%)] pointer-events-none" />
                                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-40" />

                                                {/* Solid Chrome Hinges (Right Edge) */}
                                                <div className="absolute right-0 top-10 w-1.5 sm:w-2 h-7 sm:h-9 rounded-l bg-neutral-300 border-l border-white/60 shadow-md pointer-events-none" />
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 sm:w-2 h-7 sm:h-9 rounded-l bg-neutral-300 border-l border-white/60 shadow-md pointer-events-none" />
                                                <div className="absolute right-0 bottom-10 w-1.5 sm:w-2 h-7 sm:h-9 rounded-l bg-neutral-300 border-l border-white/60 shadow-md pointer-events-none" />

                                                {/* Top Door Header */}
                                                <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-1.5">
                                                    <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/80 text-neutral-300 border border-white/15 flex items-center gap-1 shadow-sm">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                        <span>{room.badge}</span>
                                                    </span>

                                                    <span className="font-sans font-extrabold text-[10px] sm:text-xs tabular-nums text-white bg-black/90 px-2 py-0.5 rounded-md border border-white/20 shadow-sm">
                                                        {room.rate} ج.م / س
                                                    </span>
                                                </div>

                                                {/* Door Stencil Plaque */}
                                                <div className="relative z-10 text-center py-1">
                                                    <h2 className="font-brush text-2xl sm:text-4xl font-black text-white tracking-wider group-hover:text-neutral-200 transition-colors drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] leading-none">
                                                        {room.code}
                                                    </h2>
                                                    <div className="text-[9px] sm:text-[11px] font-bold text-neutral-400 font-brush tracking-widest uppercase mt-0.5">
                                                        {room.titleEn}
                                                    </div>
                                                </div>

                                                {/* Observation Visor Window */}
                                                <div className="relative z-10 my-auto py-1">
                                                    <div className="relative w-full rounded-xl bg-black/85 border border-white/15 p-2 flex items-center gap-2 overflow-hidden shadow-inner group-hover:border-white/30 transition-all">
                                                        <div className={`w-8 h-8 rounded-lg ${room.id === 'room-1' ? 'bg-cyan-950/80 text-cyan-400 border-cyan-500/50' : 'bg-rose-950/80 text-rose-400 border-rose-500/50'} border flex items-center justify-center shrink-0`}>
                                                            <Tv className="w-4 h-4" />
                                                        </div>
                                                        <div className="text-right min-w-0">
                                                            <div className="text-[10px] sm:text-xs font-bold text-white leading-tight truncate">
                                                                شاشة 65" 4K 120Hz
                                                            </div>
                                                            <div className="text-[9px] sm:text-[10px] text-neutral-400 font-medium leading-tight mt-0.5 truncate">
                                                                4 دراعات DualSense
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* THE MECHANICAL DOOR HANDLE (ANIMATES DOWN 15° ON CLICK) */}
                                                <div className="relative z-10 flex items-center justify-between px-1 py-1">
                                                    <div className="flex items-center gap-2">
                                                        {/* Animated Handle Lever */}
                                                        <div className="relative w-12 h-6 flex items-center">
                                                            {/* Escutcheon Lock Plate */}
                                                            <div className="w-3.5 h-6 rounded-md bg-neutral-900 border border-neutral-600 shadow-sm flex items-center justify-center">
                                                                <span className="w-1 h-2 rounded-full bg-black" />
                                                            </div>
                                                            {/* Rotating Lever Arm */}
                                                            <motion.div
                                                                animate={{
                                                                    rotate: isHandleTurned ? 16 : 0,
                                                                    y: isHandleTurned ? 2 : 0,
                                                                }}
                                                                transition={{ duration: 0.12, ease: 'easeOut' }}
                                                                style={{ transformOrigin: 'left center' }}
                                                                className="h-2 w-8 -ml-1 rounded-r-full bg-gradient-to-r from-neutral-300 via-neutral-100 to-neutral-400 border border-neutral-600 shadow-md"
                                                            />
                                                        </div>
                                                        <span className="text-[9px] sm:text-[10px] text-neutral-300 font-bold hidden xs:inline">
                                                            مقبض الباب
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/80 border border-white/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                        <span className="text-[9px] sm:text-[10px] font-bold text-white font-sans">
                                                            اضغط للدخول
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>

                                        {/* 4. LOWER CARD DETAILS SECTION (MATCHING REFERENCE IMAGE) */}
                                        <div className="p-2 sm:p-3 space-y-2 text-right">
                                            {/* Room Identity & PS Badge */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-xl ${room.id === 'room-1' ? 'bg-cyan-950/80 text-cyan-400 border-cyan-500/40' : 'bg-rose-950/80 text-rose-400 border-rose-500/40'} border flex items-center justify-center font-bold text-sm shadow-sm`}>
                                                        <Gamepad2 className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-brush text-sm sm:text-base text-white tracking-wide leading-tight">
                                                            {room.code}
                                                        </div>
                                                        <div className="text-[10px] text-neutral-400 font-bold">
                                                            PlayStation 5
                                                        </div>
                                                    </div>
                                                </div>

                                                <span className="font-sans font-bold text-[11px] sm:text-xs text-white bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 tabular-nums">
                                                    {room.rate} EGP / HR
                                                </span>
                                            </div>

                                            {/* 3 Spec Chips Matching Reference Image */}
                                            <div className="grid grid-cols-3 gap-1 text-center py-1">
                                                <div className="bg-black/60 rounded-lg p-1 border border-white/5">
                                                    <div className="text-[9px] sm:text-[10px] text-neutral-400 truncate">السعة</div>
                                                    <div className="text-[10px] sm:text-xs font-bold text-white truncate">4 لاعبين</div>
                                                </div>
                                                <div className="bg-black/60 rounded-lg p-1 border border-white/5">
                                                    <div className="text-[9px] sm:text-[10px] text-neutral-400 truncate">الشاشة</div>
                                                    <div className="text-[10px] sm:text-xs font-bold text-white truncate">65" 120Hz</div>
                                                </div>
                                                <div className="bg-black/60 rounded-lg p-1 border border-white/5">
                                                    <div className="text-[9px] sm:text-[10px] text-neutral-400 truncate">الكونسول</div>
                                                    <div className="text-[10px] sm:text-xs font-bold text-white truncate">PS5 Pro</div>
                                                </div>
                                            </div>

                                            {/* Primary CTA Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDoorEnter(room);
                                                }}
                                                className={`w-full py-2 sm:py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border shadow-md active:scale-95 ${
                                                    room.id === 'room-1'
                                                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-400/50 shadow-cyan-900/40'
                                                        : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border-rose-400/50 shadow-rose-900/40'
                                                }`}
                                            >
                                                <span>ادخل الغرفة</span>
                                                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
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

                {/* VENUE AMENITIES & TRUST GUARANTEE */}
                <section className="mb-10 max-w-5xl mx-auto w-full">
                    <div className="rounded-3xl bg-[#1a0c10]/95 border-2 border-red-600/35 p-5 sm:p-7 shadow-xl">
                        <div className="text-center mb-6">
                            <h3 className="font-brush text-lg sm:text-xl text-white">
                                تجربة لا مثيل لها في D95 GAMING LOUNGE
                            </h3>
                            <p className="text-xs text-neutral-300 mt-1">
                                أعلى معايير الجودة والراحة لنوفر لك أفضل جلسة لعب مع أصدقائك
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {AMENITIES.map((amenity, aIdx) => {
                                const Icon = amenity.icon;
                                return (
                                    <div
                                        key={aIdx}
                                        className="p-4 rounded-2xl bg-[#261016] border border-red-500/25 flex flex-col items-center text-center space-y-2 shadow-sm"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-600/50 flex items-center justify-center text-red-400 shadow-sm">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-bold text-xs text-white">
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
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#18090d] border border-red-600/40 text-xs text-neutral-200 shadow-md">
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
                                    : 'border-rose-900/80 shadow-[0_0_60px_rgba(244,63,94,0.8)]'
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
                                    : 'bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.7)_0%,rgba(168,85,247,0.3)_40%,transparent_75%)]'
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
                                        : 'bg-rose-950/85 border-rose-400/60 text-rose-200 shadow-rose-500/40'
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
