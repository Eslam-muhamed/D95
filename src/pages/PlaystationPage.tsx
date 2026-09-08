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
    CheckCircle2,
    Users,
    Flame,
    Disc3,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface RoomData {
    id: string;
    code: string;
    titleEn: string;
    titleAr: string;
    subtitle: string;
    rate: number;
    badge: string;
    accentColor: 'crimson' | 'ruby';
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
        badge: 'متاح للحجز الفوري اليوم',
        accentColor: 'crimson',
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
                label: 'صوت محيطي 3D مع عزل',
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
        badge: 'متاح للحجز الفوري اليوم',
        accentColor: 'ruby',
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

    const handleRoomSelect = (room: RoomData) => {
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
        <div className="bg-[#090707] text-white font-body text-sm flex flex-col min-h-screen selection:bg-red-600/30">
            {/* Ambient Background Glow & Spotlight */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-[radial-gradient(ellipse_at_top,rgba(196,30,58,0.22)_0%,rgba(139,17,25,0.06)_55%,transparent_75%)] blur-[90px]" />
                <div className="absolute top-1/3 left-[-10%] w-[500px] h-[450px] bg-red-950/20 blur-[130px] rounded-full" />
                <div className="absolute bottom-10 right-[-10%] w-[500px] h-[450px] bg-amber-950/15 blur-[130px] rounded-full" />
            </div>

            {/* Top Navigation Bar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-[#090707]/90 backdrop-blur-xl pt-safe border-b border-white/10">
                <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-6xl mx-auto">
                    {/* Brand & Back Link */}
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            aria-label="الرجوع للرئيسية"
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:text-red-400 transition-all active:scale-95 cursor-pointer border border-white/10 hover:border-red-500/30 shadow-sm"
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
                                صالة البلايستيشن والغرف الخاصة VIP
                            </span>
                        </div>
                    </div>

                    {/* Quick Link to Café Menu */}
                    <Link
                        to="/menu"
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-600/15 hover:bg-amber-600/25 border border-amber-500/40 text-xs font-body font-bold text-amber-200 transition-all cursor-pointer shadow-sm hover:border-amber-400"
                    >
                        <Coffee className="w-3.5 h-3.5 text-amber-400" />
                        <span>منيو الكافيه</span>
                    </Link>
                </div>
            </header>

            {/* Main Content Container */}
            <main className="flex-1 flex flex-col relative z-10 w-full pt-20 pb-20 px-3.5 sm:px-6 max-w-6xl mx-auto" dir="rtl">
                {/* Hero Header Section */}
                <motion.section
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="text-center my-6 space-y-3"
                >
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/60 border border-red-600/40 text-red-400 text-xs font-bold shadow-lg shadow-red-950/30">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>غرف الألعاب الخاصة الفاخرة • VIP PLAY ROOMS</span>
                    </div>

                    <div className="space-y-1">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-wide font-brush drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                            <span className="text-white">PRIVATE SUITES</span>
                            <span className="text-red-500 mx-2">//</span>
                            <span className="text-neutral-100">غرف الـ VIP</span>
                        </h1>
                        <p className="font-body text-xs sm:text-sm text-neutral-300 max-w-2xl mx-auto leading-relaxed pt-1">
                            اختر غرفتك المفضلة واستمتع بتجربة ألعاب استثنائية مع أصدقائك بخصوصية تامة، شاشات 65 بوصة 4K 120Hz، وأحدث مكتبة ألعاب PS5 لعام 2026.
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-neutral-400">
                        <span className="font-brush text-red-400 tracking-widest">
                            PLAY • COMPETE • RELAX • REPEAT
                        </span>
                        <span className="text-red-600 font-bold">✕</span>
                    </div>
                </motion.section>

                {/* THE HERO SHOWCASE: THE TWO VIP ROOMS (SIDE BY SIDE ON DESKTOP) */}
                <section className="mt-4 mb-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {ROOMS.map((room, idx) => (
                            <motion.div
                                key={room.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.12 }}
                                className="group relative rounded-3xl bg-gradient-to-b from-[#181114] to-[#100b0d] border-2 border-red-950/70 hover:border-red-600/70 transition-all duration-500 shadow-[0_12px_45px_rgba(0,0,0,0.85)] hover:shadow-[0_16px_60px_rgba(181,24,36,0.35)] overflow-hidden flex flex-col justify-between"
                            >
                                {/* Industrial Corner Accents */}
                                <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-red-500/80 pointer-events-none group-hover:scale-110 transition-transform" />
                                <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-red-500/80 pointer-events-none group-hover:scale-110 transition-transform" />
                                <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-red-500/80 pointer-events-none group-hover:scale-110 transition-transform" />
                                <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-red-500/80 pointer-events-none group-hover:scale-110 transition-transform" />

                                {/* Ambient Lighting inside Card */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-red-600/20 transition-all duration-500" />

                                {/* Card Header & Meta */}
                                <div className="p-5 sm:p-7 relative z-10 space-y-4">
                                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-brush text-2xl sm:text-3xl font-black text-white tracking-wider group-hover:text-red-400 transition-colors">
                                                    {room.code}
                                                </span>
                                                <span className="text-neutral-500">•</span>
                                                <span className="font-brush text-xs sm:text-sm text-red-400 uppercase tracking-wider font-bold">
                                                    {room.titleEn}
                                                </span>
                                            </div>
                                            <h2 className="text-sm sm:text-base font-bold text-neutral-200 mt-0.5">
                                                {room.titleAr}
                                            </h2>
                                        </div>

                                        {/* Dynamic Live Status Badge */}
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold shrink-0 shadow-sm">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                            </span>
                                            <span>{room.badge}</span>
                                        </div>
                                    </div>

                                    {/* Subtitle / Description */}
                                    <p className="text-xs sm:text-sm text-neutral-300 font-medium">
                                        {room.subtitle}
                                    </p>

                                    {/* Tech & Gaming Specs Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                        {room.features.map((feat, fIdx) => {
                                            const Icon = feat.icon;
                                            return (
                                                <div
                                                    key={fIdx}
                                                    className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-black/40 border border-white/5 group-hover:border-red-900/30 transition-all"
                                                >
                                                    <div className="w-8 h-8 rounded-xl bg-red-950/50 border border-red-700/40 flex items-center justify-center shrink-0 text-red-400 mt-0.5">
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-xs text-white">
                                                            {feat.label}
                                                        </div>
                                                        <div className="text-[11px] text-neutral-400 leading-snug mt-0.5">
                                                            {feat.desc}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Popular Games Ticker / Chips */}
                                    <div className="pt-2">
                                        <div className="text-[11px] text-neutral-400 font-bold mb-1.5 flex items-center gap-1.5">
                                            <Flame className="w-3.5 h-3.5 text-red-500" />
                                            <span>أبرز الألعاب المثبتة والجاهزة للتشغيل:</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {room.popularGames.map((game, gIdx) => (
                                                <span
                                                    key={gIdx}
                                                    className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-neutral-300 text-[10px] font-bold group-hover:border-red-600/30 transition-colors"
                                                >
                                                    {game}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing & High-Conversion Action Footer */}
                                <div className="p-5 sm:p-7 pt-4 bg-[#0d090b] border-t border-white/10 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    {/* Price Display */}
                                    <div className="flex items-baseline gap-2 text-right">
                                        <div className="flex items-baseline gap-1" dir="ltr">
                                            <span className="font-brush text-4xl sm:text-5xl font-black text-red-500 tracking-tight drop-shadow-[0_2px_8px_rgba(181,24,36,0.6)]">
                                                {room.rate}
                                            </span>
                                            <span className="font-brush text-xs sm:text-sm text-neutral-300 tracking-wider">
                                                EGP / HOUR
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-neutral-400 font-medium hidden sm:block">
                                            (شامل كافة الأجهزة لـ 4 أفراد)
                                        </div>
                                    </div>

                                    {/* Instant Booking CTA Button */}
                                    <button
                                        onClick={() => handleRoomSelect(room)}
                                        className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 hover:from-red-600 hover:to-red-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 hover:shadow-red-700/50 active:scale-[0.98] transition-all duration-300 cursor-pointer border border-red-400/30"
                                    >
                                        <span>احجز الغرفة واختر الموعد</span>
                                        <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {WALK_IN_ITEMS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleWalkInClick(item.hint)}
                                    className="group relative rounded-2xl p-4 sm:p-5 bg-neutral-900/70 hover:bg-neutral-900 border border-white/10 hover:border-amber-500/40 transition-all duration-300 cursor-pointer shadow-md flex flex-col justify-between gap-4"
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

                                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 whitespace-nowrap shrink-0">
                                            {item.badge}
                                        </span>
                                    </div>

                                    {/* Specs chips */}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {item.specs.map((spec, sIdx) => (
                                            <span
                                                key={sIdx}
                                                className="px-2 py-0.5 rounded-md bg-black/40 border border-white/5 text-[10px] text-neutral-300 font-medium"
                                            >
                                                {spec}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Price & Footnote */}
                                    <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                                        <div className="text-left" dir="ltr">
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-brush text-2xl font-black text-amber-400">
                                                    {item.price}
                                                </span>
                                                <span className="font-brush text-[11px] text-neutral-400">
                                                    {item.unit}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-xs text-neutral-400 font-bold flex items-center gap-1 group-hover:text-neutral-200 transition-colors">
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
                <section className="mb-10">
                    <div className="rounded-3xl bg-neutral-950/80 border border-white/10 p-5 sm:p-7 shadow-xl">
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
                                        className="p-4 rounded-2xl bg-black/50 border border-white/5 flex flex-col items-center text-center space-y-2"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-800/40 flex items-center justify-center text-red-400">
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
                <footer className="text-center space-y-3 pt-2">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black/70 border border-neutral-700/80 text-xs text-neutral-300 shadow-md">
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
        </div>
    );
}
