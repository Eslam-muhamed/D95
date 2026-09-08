import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowRight,
    Gamepad2,
    Flame,
    Coffee,
    Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import D95BrushLogo from '@/components/brand/D95BrushLogo';
import wallPricesImg from '@/assets/wall/d95-wall-prices.jpg';

interface PricingRow {
    id: string;
    iconType: 'door' | 'ps' | 'billiards';
    name: string;
    sub: string;
    price: number;
    unit: string;
    unitAr: string;
    bookingType: 'standard' | 'vip' | 'outside' | 'billiards';
    bookingName: string;
    topPercent: string; // for hotspot on real photo
    onlineBooking: boolean;
    badgeAr: string;
}

const PRICING_BOARD: PricingRow[] = [
    {
        id: 'room-1',
        iconType: 'door',
        name: 'ROOM 1',
        sub: 'PLAY ROOM',
        price: 100,
        unit: 'EGP / HOUR',
        unitAr: 'ج.م / ساعة',
        bookingType: 'standard',
        bookingName: 'غرفة 01 (Play Room)',
        topPercent: '47%',
        onlineBooking: true,
        badgeAr: 'حجز أونلاين',
    },
    {
        id: 'room-2',
        iconType: 'door',
        name: 'ROOM 2',
        sub: 'PLAY ROOM',
        price: 100,
        unit: 'EGP / HOUR',
        unitAr: 'ج.م / ساعة',
        bookingType: 'standard',
        bookingName: 'غرفة 02 (Play Room)',
        topPercent: '59%',
        onlineBooking: true,
        badgeAr: 'حجز أونلاين',
    },
    {
        id: 'ps-outside',
        iconType: 'ps',
        name: 'PS OUTSIDE',
        sub: '2 DEVICES',
        price: 80,
        unit: 'EGP / HOUR',
        unitAr: 'ج.م / ساعة',
        bookingType: 'outside',
        bookingName: 'بلايستيشن صالة خارجية (PS Outside)',
        topPercent: '71%',
        onlineBooking: false,
        badgeAr: 'حجز من المحل فقط',
    },
    {
        id: 'billiards',
        iconType: 'billiards',
        name: 'BILLIARDS',
        sub: 'GAME',
        price: 15,
        unit: 'EGP / GAME',
        unitAr: 'ج.م / جيم',
        bookingType: 'billiards',
        bookingName: 'طاولة بلياردو احترافية (Billiards)',
        topPercent: '83%',
        onlineBooking: false,
        badgeAr: 'حجز من المحل فقط',
    },
];

export default function PlaystationPage() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'mural' | 'photo'>('mural');
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);

    const handleRowClick = (item: PricingRow) => {
        if (item.onlineBooking) {
            navigate('/playstation/booking', {
                state: {
                    room: {
                        name: item.bookingName,
                        type: item.bookingType,
                        rate: item.price,
                    },
                },
            });
        } else {
            toast.info(`📍 ${item.name} (${item.sub}) يتم الحجز واللعب مباشرة داخل المحل عند الحضور دون الحاجة لحجز مسبق عبر الموقع 🎱🎮`);
        }
    };

    return (
        <div className="bg-[#0e0c0c] text-white font-body text-sm flex flex-col min-h-screen selection:bg-red-500/30 bg-concrete-wall">
            {/* Overhead Spotlight Lighting Cones */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,245,230,0.18)_0%,transparent_75%)]" />
                <div className="absolute top-0 left-[15%] w-72 h-80 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgba(255,250,240,0.14)_0%,transparent_70%)] blur-md" />
                <div className="absolute top-0 right-[15%] w-72 h-80 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgba(255,250,240,0.14)_0%,transparent_70%)] blur-md" />
            </div>

            {/* Top Navigation Bar */}
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
                            <div className="flex items-center gap-2">
                                <div dir="ltr" className="flex items-baseline leading-none">
                                    <span className="font-brush font-black text-xl text-white">D</span>
                                    <span className="font-brush font-black text-2xl text-red-500 -ml-0.5">95</span>
                                </div>
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

            <main className="flex-1 flex flex-col relative z-10 w-full pt-20 pb-28 px-3 md:px-8 max-w-4xl mx-auto" dir="rtl">
                {/* Mode Selector Toggle: Authentic Stencil Mural vs Live Wall Photo */}
                <div className="flex items-center justify-center gap-2 mb-3 mt-1">
                    <div className="inline-flex p-1 rounded-2xl bg-black/60 border border-neutral-700/60 backdrop-blur-md">
                        <button
                            onClick={() => setViewMode('mural')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                viewMode === 'mural'
                                    ? 'bg-red-700 text-white shadow-md'
                                    : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>تصميم الجدارية (Mural)</span>
                        </button>
                        <button
                            onClick={() => setViewMode('photo')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                viewMode === 'photo'
                                    ? 'bg-red-700 text-white shadow-md'
                                    : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <Flame className="w-3.5 h-3.5" />
                            <span>صورة الجدار الحقيقية (Photo)</span>
                        </button>
                    </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    MODE A: AUTHENTIC STENCIL MURAL BOARD (EXACT TO VENUE PHOTO)
                   ───────────────────────────────────────────────────────────── */}
                {viewMode === 'mural' && (
                    <motion.section
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="relative my-2 p-3 sm:p-6 rounded-3xl bg-[#141212]/90 border border-neutral-700/60 shadow-[0_16px_50px_rgba(0,0,0,0.95)]"
                    >
                        {/* Header: D95 Mural Mark + GAMING & CAFE */}
                        <div className="flex flex-col items-center text-center mb-4">
                            <D95BrushLogo size="md" showSubtitle={true} showMotto={false} glow={false} />

                            {/* Crimson Brush Banner: ROOM PRICES */}
                            <div className="relative mt-2 px-6 sm:px-10 py-1.5 bg-gradient-to-r from-[#7A0D14] via-[#9E121B] to-[#7A0D14] rounded shadow-lg border border-red-950 transform -rotate-0.5">
                                <h2 className="font-brush text-2xl sm:text-4xl text-white tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                    ROOM PRICES
                                </h2>
                            </div>

                            {/* Motto + Red Crossmark */}
                            <p className="font-body text-[10px] sm:text-xs text-neutral-300 uppercase tracking-[0.28em] mt-2 font-bold">
                                PLAY • COMPETE • RELAX • REPEAT
                            </p>
                            <span className="text-red-500 text-sm font-black leading-none mt-0.5">✕</span>
                        </div>

                        {/* THE AUTHENTIC LIGHT CEMENT PLASTER BOARD (Direct 1:1 replica of the photo) */}
                        <div
                            dir="ltr"
                            className="w-full max-w-2xl mx-auto rounded-xl border-4 border-neutral-900 shadow-2xl overflow-hidden relative select-none"
                            style={{
                                backgroundColor: '#ded8cf',
                                backgroundImage: 'linear-gradient(180deg, #eae5dc 0%, #ded7cb 50%, #d4cdc1 100%)',
                                boxShadow: '0 12px 40px rgba(0,0,0,0.85), inset 0 0 40px rgba(0,0,0,0.12)',
                            }}
                        >
                            {/* Subtle Plaster Noise & Stain Overlay */}
                            <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-multiply bg-[radial-gradient(#555_1px,transparent_1px)] [background-size:12px_12px]" />

                            {/* The 4 Pricing Rows */}
                            <div className="divide-y-2 divide-neutral-900">
                                {PRICING_BOARD.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        whileHover={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => handleRowClick(item)}
                                        className="grid grid-cols-12 divide-x-2 divide-neutral-900 p-2.5 sm:p-4 cursor-pointer transition-colors group relative"
                                    >
                                        {/* LEFT SIDE (7 Cols): Icon + Room Name (Black) + Sub (Red) */}
                                        <div className="col-span-7 sm:col-span-7 flex items-center gap-2.5 sm:gap-4 pr-2 sm:pr-4">
                                            {/* Custom Stencil Icon matching Photo 2 */}
                                            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0">
                                                {item.iconType === 'door' && (
                                                    <svg
                                                        className="w-7 h-7 sm:w-9 sm:h-9 text-neutral-950"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <path d="M4 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17" />
                                                        <path d="M4 21h16" />
                                                        <circle cx="12.5" cy="12" r="1.5" fill="currentColor" />
                                                    </svg>
                                                )}

                                                {item.iconType === 'ps' && (
                                                    <Gamepad2 className="w-7 h-7 sm:w-9 sm:h-9 text-neutral-950" strokeWidth={2.5} />
                                                )}

                                                {item.iconType === 'billiards' && (
                                                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-neutral-950 flex items-center justify-center shadow-inner">
                                                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white flex items-center justify-center">
                                                            <span className="font-brush text-[9px] sm:text-[11px] font-black text-neutral-950 leading-none">
                                                                8
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Text Block: Bold Black Title + Blood Red Subtitle + In-Store/Online Badge */}
                                            <div className="flex flex-col justify-center text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-brush text-base sm:text-2xl font-black text-neutral-950 tracking-wide leading-tight group-hover:text-red-950 transition-colors">
                                                        {item.name}
                                                    </span>
                                                    <span
                                                        className={`font-body text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${
                                                            item.onlineBooking
                                                                ? 'bg-emerald-700/15 text-emerald-800 border-emerald-800/30'
                                                                : 'bg-neutral-900/10 text-neutral-700 border-neutral-900/20'
                                                        }`}
                                                    >
                                                        {item.badgeAr}
                                                    </span>
                                                </div>
                                                <span className="font-brush text-[10px] sm:text-xs font-bold text-[#8B1119] tracking-wider uppercase leading-none mt-0.5">
                                                    {item.sub}
                                                </span>
                                            </div>
                                        </div>

                                        {/* RIGHT SIDE (5 Cols): Crimson Red Price + Dark Unit */}
                                        <div className="col-span-5 sm:col-span-5 flex items-baseline justify-end pl-2 sm:pl-4 gap-1 sm:gap-2 self-center">
                                            <span
                                                className="font-brush text-2xl sm:text-4xl font-black text-[#8B1119] group-hover:scale-105 transition-transform"
                                                style={{
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                                }}
                                            >
                                                {item.price}
                                            </span>
                                            <span className="font-brush text-[10px] sm:text-xs font-bold text-neutral-800 uppercase tracking-tight">
                                                {item.unit}
                                            </span>
                                        </div>

                                        {/* Subtle Hover Action Pill */}
                                        <div
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:flex items-center gap-1 px-2.5 py-1 rounded text-white text-[10px] font-bold shadow-md ${
                                                item.onlineBooking ? 'bg-red-800/90' : 'bg-neutral-800/90'
                                            }`}
                                        >
                                            <span>{item.onlineBooking ? 'احجز أونلاين ←' : 'حجز بالمحل 🏬'}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Signoff Banner: THANK YOU & ENJOY YOUR TIME! */}
                        <div className="mt-4 text-center">
                            <div className="inline-block px-6 sm:px-8 py-1.5 bg-gradient-to-r from-[#7A0D14] via-[#9E121B] to-[#7A0D14] rounded-lg shadow-lg border border-red-950 transform rotate-0.5">
                                <p className="font-brush text-xs sm:text-sm text-white tracking-wider uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                                    THANK YOU &amp; ENJOY YOUR TIME!
                                </p>
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    MODE B: LIVE INTERACTIVE WALL PHOTO (HOTSPOTS ON REAL MURAL)
                   ───────────────────────────────────────────────────────────── */}
                {viewMode === 'photo' && (
                    <motion.section
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="relative my-2 rounded-3xl overflow-hidden border-2 border-red-900/50 shadow-2xl bg-black"
                    >
                        <div className="relative w-full">
                            {/* The Real Wall Mural Photograph */}
                            <img
                                src={wallPricesImg}
                                alt="جدارية أسعار D95 الأصلية"
                                className="w-full h-auto object-cover select-none"
                            />

                            {/* Hotspot Clickable Strips positioned over each row on the real wall photo */}
                            <div className="absolute inset-0 z-10">
                                {PRICING_BOARD.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleRowClick(item)}
                                        onMouseEnter={() => setHoveredRow(item.id)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                        className="absolute left-[18%] right-[18%] h-[9%] rounded cursor-pointer transition-all border border-transparent hover:border-red-500/80 hover:bg-red-950/20 flex items-center justify-end px-3"
                                        style={{ top: item.topPercent }}
                                        title={item.onlineBooking ? `انقر لحجز ${item.bookingName}` : `${item.name}: حجز من المحل فقط`}
                                    >
                                        <span
                                            className={`opacity-0 hover:opacity-100 transition-opacity px-2.5 py-1 rounded text-white font-body font-bold text-[10px] shadow-lg border border-white/20 ${
                                                item.onlineBooking ? 'bg-red-700' : 'bg-neutral-800'
                                            }`}
                                        >
                                            {item.onlineBooking ? 'احجز أونلاين ←' : 'حجز من المحل فقط 🏬'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-3 bg-neutral-950 text-center border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
                            <span className="font-brush text-red-400">الصورة الحقيقية من داخل الفرع</span>
                            <span>اضغط على أي غرفة على الجدارية للحجز الفوري</span>
                        </div>
                    </motion.section>
                )}

            </main>
        </div>
    );
}
