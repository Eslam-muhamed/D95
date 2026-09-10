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
    CheckCircle2,
    MapPin,
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
    interiorImg: string;
    features: {
        icon: LucideIcon;
        label: string;
        desc: string;
    }[];
}

const ROOMS: RoomData[] = [
    {
        id: 'room-1',
        code: 'ROOM 01',
        titleEn: 'THE ARENA',
        titleAr: 'غرفة الأبطال (VIP Room 01)',
        subtitle: 'أجواء حماسية خاصة مع شاشة 65 بوصة 4K 120Hz وعزل صوتي كامل',
        rate: 100,
        badge: 'متاح للحجز الآن',
        interiorImg: room01InteriorImg,
        features: [
            { icon: Tv, label: 'شاشة 65" 4K 120Hz', desc: 'معدل تحديث فائق وسرعة استجابة 1ms' },
            { icon: Gamepad2, label: '4 دراعات DualSense', desc: 'أذرع تحكم أصلية للعب الرباعي' },
            { icon: Volume2, label: 'صوت محيطي معزول', desc: 'عزل صوتي كامل ونظام صوت 3D' },
            { icon: Wind, label: 'تكييف VIP مستقل', desc: 'جلسة كنب مريحة مع تحكم بالحرارة' },
        ],
    },
    {
        id: 'room-2',
        code: 'ROOM 02',
        titleEn: 'VIP SUITE',
        titleAr: 'غرفة النجوم (VIP Room 02)',
        subtitle: 'إضاءة نيون راقية ونجوم سقفية مع شاشة 65 بوصة 4K 120Hz وراحة فندقية',
        rate: 100,
        badge: 'متاح للحجز الآن',
        interiorImg: room02InteriorImg,
        features: [
            { icon: Tv, label: 'شاشة 65" 4K 120Hz', desc: 'دقة فائقة وألوان سينمائية' },
            { icon: Gamepad2, label: '4 دراعات DualSense', desc: 'أذرع معقمة وجاهزة للعب الفوري' },
            { icon: Volume2, label: 'صوت سينمائي محيطي', desc: 'مؤثرات واقعية وخصوصية تامة' },
            { icon: Wind, label: 'تكييف خاص وركن استرخاء', desc: 'أقصى درجات الراحة طوال الجلسة' },
        ],
    },
];

const PRICING_ITEMS = [
    {
        id: 'vip-rooms',
        title: 'غرف البلايستيشن VIP (01 & 02)',
        category: 'حجز مسبق عبر الموقع',
        price: '100',
        unit: 'ج.م / ساعة',
        highlight: 'شاشة 65" 4K • 4 دراعات • عزل تام',
        isActionable: true,
        actionLabel: 'احجز غرفتك الآن',
        icon: Gamepad2,
        accent: 'rose',
    },
    {
        id: 'open-floor',
        title: 'بلايستيشن الصالة المفتوحة (PS5)',
        category: 'حضور مباشر بالفرع',
        price: '80',
        unit: 'ج.م / ساعة',
        highlight: '2 أجهزة PS5 متوفرة في صالة اللعب التنافسية',
        isActionable: false,
        actionLabel: 'متاح بالفرع فور وصولك',
        icon: Tv,
        accent: 'amber',
    },
    {
        id: 'billiards',
        title: 'طاولة البلياردو الدولية',
        category: 'حضور مباشر بالفرع',
        price: '15',
        unit: 'ج.م / جيم',
        highlight: 'طاولة قياسية وكرات وعصي مستوردة احترافية',
        isActionable: false,
        actionLabel: 'متاح بالفرع فور وصولك',
        icon: Disc3,
        accent: 'emerald',
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
        desc: 'أحدث إصدارات الألعاب محدثة دائماً وجاهزة للتشغيل الفوري (EA FC 25، GTA V، Tekken 8)',
    },
    {
        icon: Coffee,
        title: 'ضيافة الكافيه حتى غرفتك',
        desc: 'طلب القهوة المختصة والمشروبات والسناكس مباشرة داخل الغرفة بضغطة زر',
    },
    {
        icon: ShieldCheck,
        title: 'نظافة وتعقيم مستمر',
        desc: 'تعقيم كامل للدراعات والشاشات ونظافة فندقية معتمدة بعد كل جلسة',
    },
];

export default function PlaystationPage() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { itemCount, openCart } = useCart();

    const handleRoomEnter = (room: RoomData) => {
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

    const handleWalkInNotice = (serviceName: string) => {
        toast.info(`خدمة ${serviceName} متاحة للعب المباشر فور حضورك للفرع دون الحاجة لحجز مسبق! مرحباً بك دائماً 🎮`, {
            duration: 4000,
        });
    };

    return (
        <div className="bg-[#f8f9fa] dark:bg-[#0b080a] text-neutral-900 dark:text-neutral-100 font-body text-sm flex flex-col min-h-screen selection:bg-red-600/40 relative overflow-x-hidden transition-colors duration-200">
            {/* Top Navigation Bar */}
            <header className="fixed top-0 inset-x-0 z-40 bg-white/95 dark:bg-[#120a0d]/95 backdrop-blur-xl pt-safe border-b border-neutral-200 dark:border-white/10 shadow-sm transition-colors duration-200">
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
                                    <span className="font-extrabold text-xl tracking-tight text-neutral-900 dark:text-white">D</span>
                                    <span className="font-black text-2xl text-red-600 -ml-0.5">95</span>
                                </div>
                                <span className="h-1.5 w-1.5 bg-red-600 rounded-full inline-block shadow-[0_0_8px_#c41e3a]" />
                                <span className="text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full tracking-wider border border-red-500/20">
                                    GAMING LOUNGE
                                </span>
                            </div>
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                                صالة الألعاب والغرف الخاصة VIP والبلياردو
                            </span>
                        </div>
                    </div>

                    {/* Center: Desktop Navigation Tabs (Visible on md: and above) */}
                    <div className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-neutral-100/80 dark:bg-white/[0.05] border border-neutral-200/80 dark:border-white/10 text-xs font-semibold">
                        <Link
                            to="/"
                            className="px-3.5 py-1.5 rounded-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 transition-all"
                        >
                            البوابة الرئيسية
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
                            {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-neutral-800" />}
                        </button>

                        <button
                            onClick={() => openCart('playstation')}
                            className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 border border-neutral-200 dark:border-white/15 text-neutral-800 dark:text-neutral-200 hover:text-red-600 dark:hover:text-white shadow-sm active:scale-95"
                            aria-label="سلة التسوق"
                            title="سلة التسوق"
                        >
                            <ShoppingBag size={18} />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center text-white font-mono font-bold rounded-full bg-red-600 border-2 border-white dark:border-[#120a0d] shadow-xs text-[9px] w-5 h-5">
                                    {itemCount > 99 ? '99+' : itemCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Container */}
            <main className="flex-1 flex flex-col relative z-10 w-full pt-20 sm:pt-24 pb-32 sm:pb-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-10" dir="rtl">

                {/* ─────────────────────────────────────────────────────────────
                    HERO HEADER: CRISP, PREMIUM & DECLUTTERED
                   ───────────────────────────────────────────────────────────── */}
                <div className="text-center mt-2 space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold shadow-xs">
                        <Sparkles size={13} />
                        <span>D95 GAMING &amp; ENTERTAINMENT LOUNGE</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-neutral-950 dark:text-white tracking-tight leading-tight">
                        صالات البلايستيشن والغرف الخاصة والبلياردو
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto font-medium leading-relaxed">
                        اختر غرفتك الخاصة VIP للاستمتاع بخصوصية تامة، أو العب في الصالة المفتوحة وطاولة البلياردو مباشرة عند حضورك للفرع
                    </p>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    1. CENTRAL PRICING SHOWCASE (HIGH VISIBILITY & TRANSPARENCY)
                   ───────────────────────────────────────────────────────────── */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-white/10">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                                قائمة أسعار الألعاب والترفيه المعتمدة
                            </h2>
                        </div>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                            أسعار واضحة ومباشرة
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {PRICING_ITEMS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.id}
                                    className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-[#150d10] border border-neutral-200/90 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 relative overflow-hidden group"
                                >
                                    {/* Top info */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                                                    <Icon size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                                                        {item.title}
                                                    </h3>
                                                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">
                                                        {item.category}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
                                            {item.highlight}
                                        </p>
                                    </div>

                                    {/* Price & Action */}
                                    <div className="pt-3 border-t border-neutral-100 dark:border-white/10 flex items-center justify-between gap-3">
                                        <div className="flex items-baseline gap-1" dir="ltr">
                                            <span className="font-black text-2xl sm:text-3xl text-neutral-950 dark:text-white">
                                                {item.price}
                                            </span>
                                            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                                                {item.unit}
                                            </span>
                                        </div>

                                        {item.isActionable ? (
                                            <button
                                                onClick={() => handleRoomEnter(ROOMS[0])}
                                                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-xs flex items-center gap-1"
                                            >
                                                <span>احجز موعدك</span>
                                                <ArrowRight size={13} className="rotate-180" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleWalkInNotice(item.title)}
                                                className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 font-bold text-xs cursor-pointer active:scale-95 transition-all border border-neutral-200 dark:border-white/10"
                                            >
                                                {item.actionLabel}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    2. VIP GAMING SUITES (CLEAR, LUXURIOUS & INTUITIVE)
                   ───────────────────────────────────────────────────────────── */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-white/10">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                <Gamepad2 className="w-5 h-5 text-red-600" />
                                <span>غرف البلايستيشن VIP الخاصة (احجز غرفتك أونلاين)</span>
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                خصوصية تامة • شاشات 65 بوصة 4K 120Hz • 4 دراعات تحكم • عزل صوتي كامل
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-5xl mx-auto">
                        {ROOMS.map((room) => {
                            const isRoom1 = room.id === 'room-1';

                            return (
                                <div
                                    key={room.id}
                                    onClick={() => handleRoomEnter(room)}
                                    className="group rounded-3xl bg-white dark:bg-[#140b0e] border border-neutral-200/90 dark:border-white/10 hover:border-red-500/60 dark:hover:border-red-500/60 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl active:scale-[0.99]"
                                >
                                    {/* Room Image Showcase */}
                                    <div className="relative w-full aspect-[16/10] overflow-hidden bg-neutral-950">
                                        <img
                                            src={room.interiorImg}
                                            alt={room.titleAr}
                                            loading="eager"
                                            className="w-full h-full object-cover brightness-90 group-hover:scale-105 group-hover:brightness-100 transition-all duration-500 ease-out"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#140b0e] via-black/20 to-black/60 pointer-events-none" />

                                        {/* Top Floating Badge */}
                                        <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between pointer-events-none">
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-emerald-500/40 shadow-xs">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[11px] font-bold text-emerald-300 font-sans">
                                                    {room.badge}
                                                </span>
                                            </div>

                                            <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white font-mono text-[11px] font-bold">
                                                {room.code}
                                            </span>
                                        </div>

                                        {/* Bottom Image Caption */}
                                        <div className="absolute bottom-3 inset-x-4 z-10 pointer-events-none">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-600/80 text-white border border-red-400/30">
                                                {room.titleEn}
                                            </span>
                                            <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-md mt-1">
                                                {isRoom1 ? 'غرفة الأبطال (VIP 01)' : 'غرفة النجوم (VIP 02)'}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Card Body: Features */}
                                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4 text-right">
                                        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
                                            {room.subtitle}
                                        </p>

                                        {/* 4 Feature Pills */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {room.features.map((feat, fIdx) => {
                                                const FeatIcon = feat.icon;
                                                return (
                                                    <div
                                                        key={fIdx}
                                                        className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200/80 dark:border-white/10"
                                                    >
                                                        <FeatIcon className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                                                        <div className="min-w-0">
                                                            <div className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                                                                {feat.label}
                                                            </div>
                                                            <div className="text-[9px] text-neutral-500 dark:text-neutral-400 truncate">
                                                                {feat.desc}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Footer: Rate & Action CTA */}
                                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-200 dark:border-white/10">
                                            <div className="flex flex-col text-right">
                                                <div className="flex items-baseline gap-1" dir="ltr">
                                                    <span className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                                                        {room.rate}
                                                    </span>
                                                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 font-sans">
                                                        ج.م / ساعة
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                                    حجز مؤكد وفوري
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRoomEnter(room);
                                                }}
                                                className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md bg-red-600 hover:bg-red-700 text-white active:scale-95"
                                            >
                                                <span>اختيار الموعد والحجز</span>
                                                <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    3. WALK-IN ENTERTAINMENT: OPEN FLOOR & BILLIARDS
                   ───────────────────────────────────────────────────────────── */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-white/10">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                <Disc3 className="w-5 h-5 text-amber-500" />
                                <span>صالة الألعاب المفتوحة وطاولة البلياردو (حضور مباشر)</span>
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                بدون حجز مسبق عبر الموقع • تفضل بزيارتنا في الفرع وابدأ اللعب فوراً
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
                        {/* Open Floor PS5 Card */}
                        <div
                            onClick={() => handleWalkInNotice('بلايستيشن الصالة المفتوحة')}
                            className="rounded-2xl p-5 bg-white dark:bg-[#150d10] border border-neutral-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 cursor-pointer"
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                            <Gamepad2 size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                                                بلايستيشن الصالة المفتوحة (PS5 Open Floor)
                                            </h3>
                                            <span className="text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">
                                                أجهزة بلايستيشن 5 مع دراعات أصلية في الصالة التنافسية
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                                        🎮 أحدث ألعاب PS5
                                    </span>
                                    <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                                        ⚡ لعب مباشر وفوري
                                    </span>
                                    <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                                        ☕ مشروبات وسناكس من الكافيه
                                    </span>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-neutral-100 dark:border-white/10 flex items-center justify-between">
                                <div className="flex items-baseline gap-1" dir="ltr">
                                    <span className="font-black text-2xl text-amber-600 dark:text-amber-400">
                                        80
                                    </span>
                                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                                        ج.م / ساعة
                                    </span>
                                </div>
                                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1">
                                    <MapPin size={13} className="text-amber-500" />
                                    <span>متاح بالفرع فور وصولك</span>
                                </span>
                            </div>
                        </div>

                        {/* Pro Billiards Card */}
                        <div
                            onClick={() => handleWalkInNotice('طاولة البلياردو الاحترافية')}
                            className="rounded-2xl p-5 bg-white dark:bg-[#150d10] border border-neutral-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 cursor-pointer"
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                            <Disc3 size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                                                طاولة البلياردو الدولية (Pro Billiards)
                                            </h3>
                                            <span className="text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">
                                                طاولة قياسية مستوية بدقة مع إضاءة مخصصة وعصي احترافية
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                                        🎱 كرات وعصي مستوردة
                                    </span>
                                    <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                                        👌 طاولة نظيفة وموزونة
                                    </span>
                                    <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                                        🏆 أجواء لعب راقية
                                    </span>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-neutral-100 dark:border-white/10 flex items-center justify-between">
                                <div className="flex items-baseline gap-1" dir="ltr">
                                    <span className="font-black text-2xl text-emerald-600 dark:text-emerald-400">
                                        15
                                    </span>
                                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                                        ج.م / جيم
                                    </span>
                                </div>
                                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1">
                                    <MapPin size={13} className="text-emerald-500" />
                                    <span>متاحة بالفرع فور وصولك</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    4. VENUE AMENITIES (CLEAN & TRUSTWORTHY)
                   ───────────────────────────────────────────────────────────── */}
                <section className="rounded-3xl bg-white dark:bg-[#140b0e] border border-neutral-200 dark:border-white/10 p-5 sm:p-7 shadow-sm space-y-6">
                    <div className="text-center space-y-1">
                        <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                            تجربة لعب لا مثيل لها في D95 Gaming Lounge
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            أعلى معايير الراحة والجودة لضمان جلسة تنافسية واستثنائية مع أصدقائك
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {AMENITIES.map((amenity, aIdx) => {
                            const Icon = amenity.icon;
                            return (
                                <div
                                    key={aIdx}
                                    className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/10 flex flex-col items-center text-center space-y-2"
                                >
                                    <div className="w-11 h-11 rounded-2xl bg-red-600/10 text-red-600 dark:text-red-400 flex items-center justify-center shadow-xs">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
                                        {amenity.title}
                                    </h4>
                                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                        {amenity.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    FOOTER: OPERATING HOURS & BRAND SIGNOFF
                   ───────────────────────────────────────────────────────────── */}
                <footer className="text-center space-y-3 pt-2">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-[#140b0e] border border-neutral-200 dark:border-white/10 text-xs text-neutral-800 dark:text-neutral-200 shadow-xs">
                        <Clock className="w-4 h-4 text-red-600" />
                        <span>مواعيد العمل المعتمدة: يومياً من <strong>08:00 صباحاً</strong> حتى <strong>04:00 فجراً</strong></span>
                    </div>

                    <div className="pt-2">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 tracking-wider">
                            D95 GAMING LOUNGE &amp; CAFÉ
                        </p>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mt-0.5">
                            PREMIUM GAMING • SPECIALTY COFFEE • CAIRO
                        </p>
                    </div>
                </footer>
            </main>
        </div>
    );
}
