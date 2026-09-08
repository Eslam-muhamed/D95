import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowRight,
    Gamepad2,
    Tv,
    Headphones,
    Users,
    Sparkles,
    Flame,
    Coffee,
    DoorClosed,
    CircleDot,
    Image as ImageIcon,
    X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import D95BrushLogo from '@/components/brand/D95BrushLogo';
import wallPricesImg from '@/assets/wall/d95-wall-prices.jpg';

interface PricingRow {
    id: string;
    icon: 'door' | 'ps' | 'billiards';
    name: string;
    sub: string;
    price: number;
    unit: string;
    unitAr: string;
    bookingType: 'standard' | 'vip' | 'outside' | 'billiards';
    bookingName: string;
}

const PRICING_BOARD: PricingRow[] = [
    {
        id: 'room-1',
        icon: 'door',
        name: 'ROOM 1',
        sub: 'PLAY ROOM',
        price: 100,
        unit: 'EGP / HOUR',
        unitAr: 'ج.م / ساعة',
        bookingType: 'standard',
        bookingName: 'غرفة 01 (Play Room)',
    },
    {
        id: 'room-2',
        icon: 'door',
        name: 'ROOM 2',
        sub: 'PLAY ROOM',
        price: 100,
        unit: 'EGP / HOUR',
        unitAr: 'ج.م / ساعة',
        bookingType: 'standard',
        bookingName: 'غرفة 02 (Play Room)',
    },
    {
        id: 'ps-outside',
        icon: 'ps',
        name: 'PS OUTSIDE',
        sub: '2 DEVICES',
        price: 80,
        unit: 'EGP / HOUR',
        unitAr: 'ج.م / ساعة',
        bookingType: 'outside',
        bookingName: 'بلايستيشن صالة خارجية (PS Outside)',
    },
    {
        id: 'billiards',
        icon: 'billiards',
        name: 'BILLIARDS',
        sub: 'GAME',
        price: 15,
        unit: 'EGP / GAME',
        unitAr: 'ج.م / جيم',
        bookingType: 'billiards',
        bookingName: 'طاولة بلياردو احترافية (Billiards)',
    },
];

export default function PlaystationPage() {
    const navigate = useNavigate();
    const [showWallPhoto, setShowWallPhoto] = useState(false);

    const handleBooking = (roomName: string, type: 'standard' | 'vip' | 'outside' | 'billiards', rate: number) => {
        navigate('/playstation/booking', {
            state: {
                room: {
                    name: roomName,
                    type,
                    rate,
                },
            },
        });
    };

    return (
        <div className="bg-[#0e0c0c] text-white font-body text-sm flex flex-col min-h-screen selection:bg-red-500/30 bg-concrete-wall">
            {/* Ambient Overhead Spotlights */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-56 bg-[radial-gradient(ellipse_75%_50%_at_50%_0%,rgba(255,245,230,0.16)_0%,transparent_75%)]" />
                <div className="absolute top-0 left-[20%] w-64 h-72 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgba(255,250,240,0.12)_0%,transparent_70%)] blur-md" />
                <div className="absolute top-0 right-[20%] w-64 h-72 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgba(255,250,240,0.12)_0%,transparent_70%)] blur-md" />
            </div>

            {/* Top Bar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-[#0e0c0c]/90 backdrop-blur-xl pt-safe border-b border-white/10">
                <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-6xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            aria-label="الرجوع للرئيسية"
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:text-red-400 transition-colors active:scale-95 cursor-pointer border border-white/10"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div className="flex flex-col text-right">
                            <div className="flex items-center gap-1.5">
                                <span className="font-brush text-xl tracking-wider text-red-500">D95</span>
                                <span className="h-1.5 w-1.5 bg-red-600 rounded-full inline-block shadow-[0_0_8px_#c41e3a]" />
                                <span className="text-[10px] font-bold bg-red-600/20 text-red-300 px-1.5 py-0.5 rounded font-brush tracking-wider">
                                    GAMING LOUNGE
                                </span>
                            </div>
                            <span className="font-body text-[10px] text-neutral-400 -mt-0.5">
                                صالة البلايستيشن والألعاب التنافسية
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowWallPhoto(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-body text-neutral-300 transition-all cursor-pointer"
                        >
                            <ImageIcon className="w-3.5 h-3.5 text-red-400" />
                            <span className="hidden sm:inline">جدارية الأسعار</span>
                        </button>
                        <Link
                            to="/menu"
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-xs font-body font-bold text-amber-200 transition-all cursor-pointer shadow-sm"
                        >
                            <Coffee className="w-3.5 h-3.5 text-amber-400" />
                            <span>منيو الكافيه</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col relative z-10 w-full pt-20 pb-28 px-3.5 md:px-8 max-w-5xl mx-auto" dir="rtl">
                {/* ─────────────────────────────────────────────────────────────
                    AUTHENTIC WALL PRICING BOARD (DIRECT FROM VENUE PHOTO)
                   ───────────────────────────────────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative my-4 p-4 sm:p-7 rounded-3xl bg-black/75 backdrop-blur-md border-2 border-neutral-300/30 shadow-[0_12px_45px_rgba(0,0,0,0.9)] overflow-hidden grunge-frame"
                >
                    {/* Corner Screws / Crossmarks */}
                    <span className="absolute top-2 left-2 text-xs text-neutral-500 font-brush">✕</span>
                    <span className="absolute top-2 right-2 text-xs text-neutral-500 font-brush">✕</span>
                    <span className="absolute bottom-2 left-2 text-xs text-neutral-500 font-brush">✕</span>
                    <span className="absolute bottom-2 right-2 text-xs text-neutral-500 font-brush">✕</span>

                    {/* Board Header as in Photo 2 */}
                    <div className="flex flex-col items-center text-center mb-5">
                        <D95BrushLogo size="md" showSubtitle={true} showMotto={false} glow={false} />

                        {/* Crimson Brushed ROOM PRICES Banner */}
                        <div className="relative mt-2 px-6 py-1 bg-gradient-to-r from-transparent via-[#8B1119]/80 to-transparent">
                            <h2 className="font-brush text-2xl sm:text-3xl md:text-4xl text-white tracking-widest uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                                ROOM PRICES
                            </h2>
                        </div>

                        {/* Motto */}
                        <p className="font-body text-[10px] sm:text-xs text-neutral-400 uppercase tracking-[0.25em] mt-1">
                            PLAY • COMPETE • RELAX • REPEAT
                        </p>
                        <span className="text-red-500 text-xs font-black leading-none mt-0.5">✕</span>
                    </div>

                    {/* The 4 Framed Pricing Rows (Photo 2 Structure) */}
                    <div className="space-y-2.5 max-w-2xl mx-auto">
                        {PRICING_BOARD.map((item) => (
                            <motion.div
                                key={item.id}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => handleBooking(item.bookingName, item.bookingType, item.price)}
                                className="group cursor-pointer relative flex items-center justify-between p-3 sm:p-4 rounded-xl border border-neutral-400/30 bg-neutral-950/80 hover:border-red-500/70 hover:bg-neutral-900/90 transition-all shadow-md"
                            >
                                {/* Left Side (RTL): Price & Unit (Matches Right side of Wall) */}
                                <div className="flex items-baseline gap-1.5 shrink-0" dir="ltr">
                                    <span className="font-brush text-2xl sm:text-3xl font-black text-red-500 group-hover:text-red-400 drop-shadow-[0_2px_8px_rgba(181,24,36,0.5)]">
                                        {item.price}
                                    </span>
                                    <span className="font-brush text-[11px] sm:text-xs text-neutral-300 font-bold uppercase">
                                        {item.unit}
                                    </span>
                                </div>

                                {/* Divider line (like the wall) */}
                                <div className="hidden sm:block h-8 w-[1px] bg-neutral-600/50 mx-4" />

                                {/* Right Side (RTL): Icon & Room Name */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-neutral-200 group-hover:text-red-400 group-hover:border-red-500/50 transition-colors">
                                        {item.icon === 'door' && <DoorClosed className="w-5 h-5" />}
                                        {item.icon === 'ps' && <Gamepad2 className="w-5 h-5" />}
                                        {item.icon === 'billiards' && <CircleDot className="w-5 h-5 text-emerald-400" />}
                                    </div>
                                    <div className="text-right">
                                        <div className="font-brush text-base sm:text-xl text-white group-hover:text-red-400 transition-colors tracking-wide">
                                            {item.name}
                                        </div>
                                        <div className="font-brush text-[10px] sm:text-xs text-red-400 font-bold">
                                            {item.sub}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Signoff Banner: THANK YOU & ENJOY YOUR TIME! */}
                    <div className="mt-5 text-center">
                        <div className="inline-block px-5 py-1.5 rounded-lg bg-red-950/70 border border-red-700/50">
                            <p className="font-brush text-xs sm:text-sm text-red-300 tracking-wider">
                                THANK YOU &amp; ENJOY YOUR TIME!
                            </p>
                        </div>
                    </div>
                </motion.section>

                {/* Section Title: Full Experience Breakdown */}
                <div className="flex items-center justify-between px-1 mb-4 mt-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                        <h3 className="font-bold text-base md:text-xl text-white font-body">
                            تفاصيل ومواصفات الألعاب
                        </h3>
                    </div>
                    <span className="text-xs text-neutral-400 font-body">اختر واحجز الآن</span>
                </div>

                {/* DETAILED ROOM CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* CARD 1: ROOM 1 & ROOM 2 (Play Rooms) */}
                    <div className="rounded-3xl concrete-card overflow-hidden border border-white/10 p-5 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-brush text-xl text-white">ROOM 1 &amp; ROOM 2</h4>
                                    <span className="text-[10px] bg-red-600/30 text-red-300 font-bold px-2 py-0.5 rounded-full">
                                        PLAY ROOMS
                                    </span>
                                </div>
                                <span className="font-brush text-lg text-red-500">100 ج.م / س</span>
                            </div>
                            <p className="text-xs text-neutral-300 font-body leading-relaxed mb-4">
                                غرف خاصة مغلقة مجهزة بالكامل للبطولات والتحديات الكبرى بين الأصدقاء.
                            </p>

                            <div className="grid grid-cols-2 gap-2.5 text-xs text-neutral-300 font-body mb-4">
                                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl">
                                    <Tv className="w-4 h-4 text-red-400" />
                                    <span>شاشة 65 بوصة 4K 120Hz</span>
                                </div>
                                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl">
                                    <Gamepad2 className="w-4 h-4 text-red-400" />
                                    <span>٤ دراعات DualSense لاسلكية</span>
                                </div>
                                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl">
                                    <Headphones className="w-4 h-4 text-amber-400" />
                                    <span>سماعات Pulse 3D</span>
                                </div>
                                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl">
                                    <Users className="w-4 h-4 text-amber-400" />
                                    <span>كنبة مريحة وتكييف</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <button
                                onClick={() => handleBooking('غرفة 01 (Play Room)', 'standard', 100)}
                                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-700 to-red-600 text-white font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-md shadow-red-900/30"
                            >
                                <span>حجز غرفة 1</span>
                                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                            </button>
                            <button
                                onClick={() => handleBooking('غرفة 02 (Play Room)', 'standard', 100)}
                                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-700 to-red-600 text-white font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-md shadow-red-900/30"
                            >
                                <span>حجز غرفة 2</span>
                                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                            </button>
                        </div>
                    </div>

                    {/* CARD 2: PS OUTSIDE & BILLIARDS */}
                    <div className="rounded-3xl concrete-card overflow-hidden border border-white/10 p-5 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-brush text-xl text-white">PS OUTSIDE &amp; BILLIARDS</h4>
                                    <span className="text-[10px] bg-amber-600/30 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                                        OPEN ZONE
                                    </span>
                                </div>
                                <span className="font-brush text-lg text-amber-400">80 / 15 ج.م</span>
                            </div>
                            <p className="text-xs text-neutral-300 font-body leading-relaxed mb-4">
                                أجهزة البلايستيشن بالصالة المفتوحة وطاولات البلياردو الاحترافية للألعاب السريعة.
                            </p>

                            <div className="grid grid-cols-2 gap-2.5 text-xs text-neutral-300 font-body mb-4">
                                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl">
                                    <Gamepad2 className="w-4 h-4 text-amber-400" />
                                    <span>جهازين PS5 بالصالة</span>
                                </div>
                                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl">
                                    <CircleDot className="w-4 h-4 text-emerald-400" />
                                    <span>طاولة بلياردو متكاملة</span>
                                </div>
                                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl">
                                    <Flame className="w-4 h-4 text-red-400" />
                                    <span>أجواء حماسية وتنافسية</span>
                                </div>
                                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl">
                                    <Coffee className="w-4 h-4 text-amber-400" />
                                    <span>خدمة مشروبات فورية</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <button
                                onClick={() => handleBooking('بلايستيشن صالة خارجية (PS Outside)', 'outside', 80)}
                                className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer border border-white/10"
                            >
                                <span>حجز PS خارجي</span>
                                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                            </button>
                            <button
                                onClick={() => handleBooking('طاولة بلياردو احترافية (Billiards)', 'billiards', 15)}
                                className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer border border-white/10"
                            >
                                <span>حجز بلياردو</span>
                                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Lightbox for Real Wall Prices Photo */}
            <AnimatePresence>
                {showWallPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowWallPhoto(false)}
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
                                onClick={() => setShowWallPhoto(false)}
                                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white hover:text-red-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <img
                                src={wallPricesImg}
                                alt="جدارية أسعار D95 الأصلية"
                                className="w-full h-auto rounded-xl object-contain max-h-[75vh]"
                            />

                            <div className="p-3 text-center">
                                <h3 className="font-brush text-lg text-white">
                                    لوحة الأسعار الرسمية — ROOM PRICES
                                </h3>
                                <p className="font-body text-xs text-neutral-400 mt-0.5">
                                    تصوير الجدار الواقعي المعتمد من داخل فرع D95 Gaming &amp; Café
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
