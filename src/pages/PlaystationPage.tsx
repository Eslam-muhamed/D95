import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowRight,
    Gamepad2,
    DoorClosed,
    CircleDot,
    Coffee,
    Sparkles,
    ShieldCheck,
    Clock,
    Flame,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface PricingItem {
    id: string;
    icon: 'door' | 'ps' | 'billiards';
    nameEn: string;
    nameAr: string;
    sub: string;
    price: number;
    unit: string;
    onlineBooking: boolean;
    badgeText: string;
    specs: string[];
}

const PRICING_ITEMS: PricingItem[] = [
    {
        id: 'room-1',
        icon: 'door',
        nameEn: 'ROOM 1',
        nameAr: 'غرفة 01 (Play Room)',
        sub: 'PLAY ROOM // شاشة 65 بوصة 4K 120Hz',
        price: 100,
        unit: 'EGP / HOUR',
        onlineBooking: true,
        badgeText: 'حجز أونلاين متاح',
        specs: ['شاشة 65" 4K 120Hz', '4 أذرع DualSense', 'تكييف وخصوصية تامة'],
    },
    {
        id: 'room-2',
        icon: 'door',
        nameEn: 'ROOM 2',
        nameAr: 'غرفة 02 (Play Room)',
        sub: 'PLAY ROOM // شاشة 65 بوصة 4K 120Hz',
        price: 100,
        unit: 'EGP / HOUR',
        onlineBooking: true,
        badgeText: 'حجز أونلاين متاح',
        specs: ['شاشة 65" 4K 120Hz', '4 أذرع DualSense', 'تكييف وخصوصية تامة'],
    },
    {
        id: 'ps-outside',
        icon: 'ps',
        nameEn: 'PS OUTSIDE',
        nameAr: 'بلايستيشن صالة مفتوحة',
        sub: '2 DEVICES // أجهزة PS5 بصالة اللعب',
        price: 80,
        unit: 'EGP / HOUR',
        onlineBooking: false,
        badgeText: 'حجز من المحل فقط',
        specs: ['جهازين PS5 بالصالة', 'لعب تنافسي وسريع', 'خدمة مشروبات فورية'],
    },
    {
        id: 'billiards',
        icon: 'billiards',
        nameEn: 'BILLIARDS',
        nameAr: 'طاولة بلياردو احترافية',
        sub: 'GAME // طاولة قياسية وتجهيزات كاملة',
        price: 15,
        unit: 'EGP / GAME',
        onlineBooking: false,
        badgeText: 'حجز من المحل فقط',
        specs: ['طاولة بلياردو متكاملة', 'كرات وعصي احترافية', 'أجواء حماسية'],
    },
];

export default function PlaystationPage() {
    const navigate = useNavigate();

    const handleAction = (item: PricingItem) => {
        if (item.onlineBooking) {
            navigate('/playstation/booking', {
                state: {
                    room: {
                        name: item.nameAr,
                        type: 'standard',
                        rate: item.price,
                    },
                },
            });
        } else {
            toast.info(`📍 ${item.nameEn}: يتم الحجز واللعب مباشرة داخل المحل عند الحضور دون الحاجة لحجز مسبق عبر الموقع 🎱🎮`);
        }
    };

    return (
        <div className="bg-[#090707] text-white font-body text-sm flex flex-col min-h-screen selection:bg-red-500/30">
            {/* Ambient Background Glow */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-950/25 blur-[120px] rounded-full" />
                <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-amber-950/15 blur-[120px] rounded-full" />
            </div>

            {/* Top Navigation Bar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-[#090707]/90 backdrop-blur-xl pt-safe border-b border-white/10">
                <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-5xl mx-auto">
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
                                صالة البلايستيشن وقائمة الأسعار
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

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative z-10 w-full pt-20 pb-24 px-3.5 sm:px-6 max-w-3xl mx-auto" dir="rtl">
                {/* Header Title Section */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center my-4 space-y-2"
                >
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-600/30 text-red-400 text-xs font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>الأسعار الرسمية المعتمدة لعام 2026</span>
                    </div>

                    <h1 className="font-brush text-3xl sm:text-4xl md:text-5xl text-white tracking-wide">
                        ROOM PRICES // أسعار الصالة
                    </h1>

                    <p className="font-body text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
                        اختر الغرفة أو النشاط المفضل لديك • حجز الغرف متاح أونلاين عبر الموقع، وأجهزة الصالة والبلياردو حجز مباشر عند الحضور.
                    </p>

                    <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-neutral-400">
                        <span className="font-brush text-red-400 tracking-widest">PLAY • COMPETE • RELAX • REPEAT</span>
                    </div>
                </motion.div>

                {/* Sleek Digital Pricing Board */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="rounded-2xl sm:rounded-3xl bg-[#120d0f]/90 border border-red-950/60 shadow-[0_16px_50px_rgba(0,0,0,0.85)] p-3 sm:p-5 backdrop-blur-xl space-y-3"
                >
                    {PRICING_ITEMS.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleAction(item)}
                            className="group relative rounded-xl sm:rounded-2xl p-3.5 sm:p-4 bg-neutral-900/60 hover:bg-neutral-900 border border-white/5 hover:border-red-600/40 transition-all duration-300 cursor-pointer shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                            {/* Right (RTL): Icon + Title + Specs */}
                            <div className="flex items-center gap-3.5">
                                {/* Stencil-inspired Icon */}
                                <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-red-500/50 group-hover:text-red-400 transition-colors">
                                    {item.icon === 'door' && <DoorClosed className="w-6 h-6 text-neutral-200" />}
                                    {item.icon === 'ps' && <Gamepad2 className="w-6 h-6 text-neutral-200" />}
                                    {item.icon === 'billiards' && (
                                        <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-950 font-black flex items-center justify-center text-xs font-brush">
                                            8
                                        </div>
                                    )}
                                </div>

                                {/* Names & Badges */}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-brush text-lg sm:text-xl text-white group-hover:text-red-400 transition-colors">
                                            {item.nameEn}
                                        </span>
                                        <span className="text-xs text-neutral-400 font-bold hidden sm:inline">
                                            • {item.nameAr}
                                        </span>
                                        <span
                                            className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                                item.onlineBooking
                                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                                                    : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                                            }`}
                                        >
                                            {item.badgeText}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-400 font-body mt-0.5">
                                        {item.sub}
                                    </p>
                                </div>
                            </div>

                            {/* Left (RTL): Price & CTA */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 shrink-0">
                                {/* Price Tag */}
                                <div className="text-left" dir="ltr">
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-brush text-2xl sm:text-3xl font-black text-red-500 group-hover:scale-105 transition-transform">
                                            {item.price}
                                        </span>
                                        <span className="font-brush text-xs text-neutral-300 uppercase">
                                            {item.unit}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                {item.onlineBooking ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAction(item);
                                        }}
                                        className="py-2 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-red-700 to-red-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-900/40 hover:from-red-600 hover:to-red-500 active:scale-95 transition-all cursor-pointer"
                                    >
                                        <span>احجز الآن</span>
                                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                                    </button>
                                ) : (
                                    <div className="py-2 px-3 rounded-xl bg-neutral-800/80 text-neutral-300 border border-neutral-700 text-xs font-bold flex items-center gap-1">
                                        <span>بالفرع فقط 🏬</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Venue Note & Signoff */}
                <div className="mt-5 text-center space-y-1.5 text-xs text-neutral-400">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                        <Clock className="w-3.5 h-3.5 text-red-400" />
                        <span>مواعيد العمل: يومياً من 08:00 صباحاً حتى 04:00 فجراً</span>
                    </div>
                    <p className="font-brush text-xs text-red-400/90 tracking-wider pt-1">
                        THANK YOU &amp; ENJOY YOUR TIME!
                    </p>
                </div>
            </main>
        </div>
    );
}
