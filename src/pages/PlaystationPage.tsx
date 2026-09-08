import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowRight,
    Gamepad2,
    Tv,
    Volume2,
    Wind,
    Coffee,
    Sparkles,
    Clock,
    Wifi,
    ShieldCheck,
    Disc3,
    Flame,
    KeyRound,
    Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import room01DoorImg from '@/assets/doors/room-01-door.jpg';
import room02DoorImg from '@/assets/doors/room-02-door.jpg';
import roomInteriorImg from '@/assets/doors/room-interior.jpg';

interface RoomData {
    id: string;
    code: string;
    titleEn: string;
    titleAr: string;
    subtitle: string;
    rate: number;
    badge: string;
    doorImage: string;
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
        badge: 'متاح للحجز الفوري',
        doorImage: room01DoorImg,
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
        titleAr: 'الجناح الملكي (Play Room 02)',
        subtitle: 'فخامة وراحة قصوى • عزل صوتي متكامل وضيافة مخصصة',
        rate: 100,
        badge: 'متاح للحجز الفوري',
        doorImage: room02DoorImg,
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
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [activeRoomData, setActiveRoomData] = useState<RoomData | null>(null);

    // ─────────────────────────────────────────────────────────────
    // SYNTHESIZED WEB AUDIO API SOUND FX (HYDRAULIC DOOR OPENING)
    // ─────────────────────────────────────────────────────────────
    const playDoorOpenSound = () => {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();

            // Electronic access chime
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);

            // Heavy pneumatic door release whoosh
            const bufferSize = Math.floor(ctx.sampleRate * 0.45);
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, ctx.currentTime + 0.05);
            filter.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.45);

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.16, ctx.currentTime + 0.05);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noise.start(ctx.currentTime + 0.05);
        } catch {
            // Audio fallback gracefully ignores
        }
    };

    // ─────────────────────────────────────────────────────────────
    // INTERACTIVE DOOR CLICK & CINEMATIC TRANSITION SEQUENCE
    // ─────────────────────────────────────────────────────────────
    const handleDoorEnter = (room: RoomData) => {
        if (openingDoorId) return; // Prevent double click
        setActiveRoomData(room);
        setOpeningDoorId(room.id);
        playDoorOpenSound();

        // Trigger the cinematic fly-through warp overlay
        setTimeout(() => {
            setIsTransitioning(true);
        }, 320);

        // Smooth navigation handoff to booking details
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
        }, 800);
    };

    const handleWalkInClick = (hint: string) => {
        toast.info(hint, {
            duration: 4500,
        });
    };

    return (
        <div className="bg-[#0e0709] text-white font-body text-sm flex flex-col min-h-screen selection:bg-red-600/40 relative overflow-x-hidden">
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
                                صالة البلايستيشن والأبواب الخاصة VIP
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

            {/* Ceiling Industrial Rig Graphic */}
            <div className="relative z-10 w-full max-w-xl mx-auto flex items-center justify-between px-8 pt-20 pb-1 opacity-75">
                <div className="flex flex-col items-center">
                    <span className="w-2.5 h-1.5 rounded-t bg-neutral-400" />
                    <span className="w-3.5 h-1 bg-yellow-100 rounded-full shadow-[0_0_10px_#fff]" />
                </div>
                <div className="h-[2px] flex-1 mx-3 bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-600" />
                <div className="flex flex-col items-center">
                    <span className="w-3 h-2 rounded-t bg-neutral-300" />
                    <span className="w-4 h-1 bg-yellow-100 rounded-full shadow-[0_0_12px_#fff]" />
                </div>
                <div className="h-[2px] flex-1 mx-3 bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-600" />
                <div className="flex flex-col items-center">
                    <span className="w-2.5 h-1.5 rounded-t bg-neutral-400" />
                    <span className="w-3.5 h-1 bg-yellow-100 rounded-full shadow-[0_0_10px_#fff]" />
                </div>
            </div>

            {/* Main Content Container */}
            <main className="flex-1 flex flex-col relative z-10 w-full pb-20 px-3.5 sm:px-6 max-w-6xl mx-auto" dir="rtl">
                {/* Hero Header Section */}
                <motion.section
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="text-center my-4 space-y-2"
                >
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/70 border border-red-500/50 text-red-300 text-xs font-bold shadow-lg shadow-red-950/50">
                        <Sparkles className="w-3.5 h-3.5 text-red-400" />
                        <span>أبواب غرف الـ VIP الفاخرة • اضغط على الباب للدخول والحجز</span>
                    </div>

                    <div className="space-y-1">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-wide font-brush drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                            <span className="text-white">VIP PORTALS</span>
                            <span className="text-red-500 mx-2">//</span>
                            <span className="text-neutral-100">أبواب الغرف الخاصة</span>
                        </h1>
                        <p className="font-body text-xs sm:text-sm text-neutral-300 max-w-2xl mx-auto leading-relaxed">
                            اختر غرفتك واضغط على الباب للانتقال مباشرة إلى داخل الغرفة واختيار الموعد المناسب لك ولأصدقائك بخصوصية تامة.
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-0.5 text-[11px] text-neutral-400">
                        <span className="font-brush text-red-400 tracking-widest">
                            PLAY • COMPETE • RELAX • REPEAT
                        </span>
                        <span className="text-red-600 font-bold">✕</span>
                    </div>
                </motion.section>

                {/* ─────────────────────────────────────────────────────────────
                    PHOTOREALISTIC 3D INTERACTIVE DOORS (ROOM 01 & ROOM 02)
                   ───────────────────────────────────────────────────────────── */}
                <section className="mt-4 mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {ROOMS.map((room) => {
                            const isOpening = openingDoorId === room.id;

                            return (
                                <div
                                    key={room.id}
                                    style={{ perspective: '1500px' }}
                                    className="relative flex flex-col items-center"
                                >
                                    {/* HEAVY REINFORCED STEEL FRAME */}
                                    <div className="w-full rounded-3xl bg-[#1c0c11]/95 border-2 border-red-600/40 shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_30px_rgba(196,30,58,0.2)] p-2.5 relative overflow-hidden backdrop-blur-md">
                                        {/* Frame Corner Rivets */}
                                        <span className="absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-neutral-300 border border-black shadow-[inset_0_1px_2px_#fff]" />
                                        <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-neutral-300 border border-black shadow-[inset_0_1px_2px_#fff]" />
                                        <span className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-neutral-300 border border-black shadow-[inset_0_1px_2px_#fff]" />
                                        <span className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-neutral-300 border border-black shadow-[inset_0_1px_2px_#fff]" />

                                        {/* HEADER LINTEL STRIP */}
                                        <div className="w-full bg-[#14080b] border border-red-900/40 rounded-2xl p-3 mb-2.5 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-lg bg-red-950/80 border border-red-600/50 flex items-center justify-center text-red-400 font-bold text-xs shadow-sm">
                                                    <KeyRound className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-brush text-sm sm:text-base text-white tracking-wide font-bold leading-tight">
                                                        {room.code} // {room.titleEn}
                                                    </div>
                                                    <div className="text-[11px] text-neutral-300 font-medium">
                                                        {room.titleAr}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Digital Lock Status Indicator */}
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                                                <span className="relative flex h-2 w-2">
                                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOpening ? 'bg-cyan-400' : 'bg-emerald-400'} opacity-75`} />
                                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isOpening ? 'bg-cyan-400' : 'bg-emerald-500'}`} />
                                                </span>
                                                <span>{isOpening ? 'ACCESS GRANTED' : 'DOOR READY'}</span>
                                            </div>
                                        </div>

                                        {/* DOOR FRAME CAVITY & 3D DOOR LEAF */}
                                        <div className="relative w-full h-[500px] sm:h-[540px] rounded-2xl overflow-hidden select-none border-2 border-black bg-black">
                                            {/* ─────────────────────────────────────────────────────────────
                                                REVEALED ROOM INTERIOR (PHOTOREALISTIC BEHIND THE DOOR)
                                               ───────────────────────────────────────────────────────────── */}
                                            <div className="absolute inset-0 z-0 overflow-hidden">
                                                <img
                                                    src={roomInteriorImg}
                                                    alt="VIP Room Interior"
                                                    className="w-full h-full object-cover brightness-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60" />

                                                {/* Glowing Welcome HUD */}
                                                <div className="absolute inset-0 p-5 flex flex-col justify-between items-center text-center z-10">
                                                    <div className="pt-4">
                                                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-600/80 text-white border border-red-400 shadow-[0_0_15px_#c41e3a]">
                                                            ✦ مرحباً بك داخل {room.code} ✦
                                                        </span>
                                                    </div>

                                                    <div className="pb-6 space-y-1">
                                                        <h3 className="font-brush text-2xl sm:text-3xl text-white drop-shadow-[0_2px_10px_#000]">
                                                            ENTERING THE SUITE...
                                                        </h3>
                                                        <p className="text-xs text-red-200 font-bold">
                                                            جاري نقلك لصفحة الحجز واختيار المواعيد 🚪✨
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ─────────────────────────────────────────────────────────────
                                                PHOTOREALISTIC 3D DOOR LEAF (SWINGS OPEN ON HINGES)
                                               ───────────────────────────────────────────────────────────── */}
                                            <motion.div
                                                animate={{
                                                    rotateY: isOpening ? -88 : 0,
                                                    boxShadow: isOpening
                                                        ? '-30px 0 60px rgba(0,0,0,0.95)'
                                                        : '0 0 15px rgba(0,0,0,0.6)',
                                                }}
                                                transition={{
                                                    duration: 0.65,
                                                    ease: [0.22, 1, 0.36, 1],
                                                }}
                                                style={{
                                                    transformOrigin: 'right center',
                                                    transformStyle: 'preserve-3d',
                                                }}
                                                onClick={() => handleDoorEnter(room)}
                                                className="absolute inset-0 z-10 rounded-2xl overflow-hidden cursor-pointer group border-2 border-red-600/40 hover:border-red-400 transition-colors duration-300"
                                            >
                                                {/* Photorealistic Door Image */}
                                                <img
                                                    src={room.doorImage}
                                                    alt={`${room.code} Door`}
                                                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                                                />

                                                {/* Subtle Rim Lighting & Vignette Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none" />

                                                {/* Hinges on Right Edge */}
                                                <div className="absolute right-0 top-14 w-2.5 h-10 rounded-l bg-neutral-300 border-l border-white/60 shadow-lg pointer-events-none" />
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-10 rounded-l bg-neutral-300 border-l border-white/60 shadow-lg pointer-events-none" />
                                                <div className="absolute right-0 bottom-14 w-2.5 h-10 rounded-l bg-neutral-300 border-l border-white/60 shadow-lg pointer-events-none" />

                                                {/* Top Floating Badge Bar */}
                                                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-none">
                                                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-black/80 text-white border border-red-500/50 backdrop-blur-md shadow-md flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                        <span>VIP ENTRANCE</span>
                                                    </span>

                                                    <span className="font-brush text-sm font-black px-3 py-1 rounded-full bg-red-600 text-white shadow-[0_0_15px_#c41e3a] border border-red-400">
                                                        {room.rate} EGP / HR
                                                    </span>
                                                </div>

                                                {/* Specs Chips Floating on Lower Half */}
                                                <div className="absolute bottom-16 inset-x-3 z-20 space-y-2 pointer-events-none">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-black/80 text-white border border-white/20 backdrop-blur-md flex items-center gap-1">
                                                            <Tv className="w-3 h-3 text-red-400" />
                                                            <span>شاشة 65&quot; 4K 120Hz</span>
                                                        </span>
                                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-black/80 text-white border border-white/20 backdrop-blur-md flex items-center gap-1">
                                                            <Gamepad2 className="w-3 h-3 text-red-400" />
                                                            <span>4 دراعات PS5</span>
                                                        </span>
                                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-black/80 text-white border border-white/20 backdrop-blur-md flex items-center gap-1">
                                                            <Wind className="w-3 h-3 text-red-400" />
                                                            <span>تكييف مستقل</span>
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        {room.popularGames.slice(0, 4).map((g, gi) => (
                                                            <span
                                                                key={gi}
                                                                className="text-[9px] font-bold px-2 py-0.5 rounded bg-black/70 text-red-200 border border-red-500/30 backdrop-blur-sm"
                                                            >
                                                                {g}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* High-Impact Interactive Click Button */}
                                                <div className="absolute bottom-3 inset-x-3 z-20">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDoorEnter(room);
                                                        }}
                                                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-[#881337] hover:from-[#F43F5E] hover:to-[#BE123C] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(225,29,72,0.7)] active:scale-95 transition-all cursor-pointer border border-white/40"
                                                    >
                                                        <span>اضغط لفتح الباب والدخول للحجز</span>
                                                        <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1.5 transition-transform" />
                                                    </button>
                                                </div>
                                            </motion.div>
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
                        <p className="text-xs text-neutral-400 max-w-lg mx-auto">
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
                CINEMATIC FLY-THROUGH PORTAL TRANSITION OVERLAY
               ───────────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {isTransitioning && activeRoomData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center overflow-hidden bg-black/95"
                    >
                        {/* Zooming Interior Background Image */}
                        <motion.img
                            src={roomInteriorImg}
                            alt="Entering Room"
                            initial={{ scale: 1, opacity: 0.7 }}
                            animate={{ scale: 1.45, opacity: 1 }}
                            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 w-full h-full object-cover"
                        />

                        {/* Light Warp Flash Overlay */}
                        <motion.div
                            initial={{ opacity: 0.2, scale: 0.5 }}
                            animate={{ opacity: [0.3, 0.9, 0.2], scale: [0.8, 3] }}
                            transition={{ duration: 0.75, ease: 'easeOut' }}
                            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.85)_0%,rgba(139,17,25,0.4)_50%,transparent_75%)] blur-2xl"
                        />

                        {/* Foreground High-Energy Message */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.35 }}
                            className="relative z-10 text-center space-y-3 px-6 py-4 rounded-3xl bg-black/80 border border-white/20 backdrop-blur-xl shadow-[0_0_50px_rgba(225,29,72,0.8)]"
                        >
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-red-600 to-rose-400 flex items-center justify-center text-white shadow-[0_0_30px_#e11d48]">
                                <Tv className="w-8 h-8 animate-pulse" />
                            </div>

                            <h2 className="font-brush text-3xl sm:text-5xl font-black text-white tracking-wider drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                                ENTERING {activeRoomData.code}...
                            </h2>

                            <p className="font-body text-sm sm:text-base text-red-300 font-bold">
                                جاري فتح باب {activeRoomData.titleAr} واختيار موعدك 🚪✨
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
