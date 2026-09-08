import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Gamepad2, Tv, Headphones, Armchair, Monitor, Users, Sparkles, CheckCircle2, ShieldCheck, Flame, Coffee } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PlaystationPage() {
    const navigate = useNavigate();

    const handleBooking = (roomName: string, type: 'standard' | 'vip', rate: number) => {
        navigate('/playstation/booking', {
            state: {
                room: {
                    name: roomName,
                    type,
                    rate
                }
            }
        });
    };

    return (
        <div className="bg-[#090707] text-white font-body text-sm flex flex-col min-h-screen selection:bg-red-500/30">
            {/* Top Bar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-[#090707]/95 backdrop-blur-xl pt-safe border-b border-white/5">
                <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-6xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            aria-label="الرجوع للرئيسية"
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:text-red-400 transition-colors active:scale-95 cursor-pointer"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div className="flex flex-col text-right">
                            <div className="flex items-center gap-1.5">
                                <span className="font-serif font-black text-xl tracking-wider text-[#ffc8d2]">D95</span>
                                <span className="h-1.5 w-1.5 bg-red-600 rounded-full inline-block shadow-[0_0_8px_#c41e3a]"></span>
                                <span className="text-[10px] font-bold bg-red-600/20 text-red-400 px-1.5 py-0.2 rounded font-body">PS5 ARENA</span>
                            </div>
                            <span className="font-body text-[10px] text-neutral-400 -mt-0.5">صالة البلايستيشن والألعاب التنافسية</span>
                        </div>
                    </div>

                    <Link
                        to="/menu"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs md:text-sm font-body font-bold text-neutral-200 transition-all cursor-pointer"
                    >
                        <Coffee className="w-4 h-4 text-amber-400" />
                        <span>منيو الكافيه</span>
                    </Link>
                </div>
            </header>

            <main className="flex-1 flex flex-col relative w-full pt-20 pb-28 px-3.5 md:px-8 max-w-6xl mx-auto" dir="rtl">
                {/* Hero Feature Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative rounded-3xl overflow-hidden p-6 md:p-8 my-4 shadow-2xl border border-white/10"
                    style={{
                        background: 'linear-gradient(135deg, rgba(35, 10, 15, 0.95), rgba(15, 6, 8, 0.95))',
                    }}
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-bold mb-3">
                            <Flame className="w-4 h-4 text-red-400" />
                            <span>تجهيزات وبطولات احترافية 2026</span>
                        </div>
                        <h2 className="font-serif text-2xl md:text-4xl font-black text-white leading-tight mb-2">
                            عالم البلايستيشن بأعلى جودة
                        </h2>
                        <p className="text-xs md:text-sm text-neutral-300 font-body leading-relaxed mb-4">
                            أجهزة PS5 Pro بشاشات 4K 120Hz، أحدث ألعاب الموسم، وأجواء تكتيكية خاصة للشلل والتحديات.
                        </p>

                        {/* Feature Badges */}
                        <div className="grid grid-cols-2 gap-3 text-xs font-body text-neutral-300">
                            <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                                <Tv className="w-4 h-4 text-red-400 shrink-0" />
                                <span className="truncate">شاشات OLED 4K 120Hz</span>
                            </div>
                            <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                                <Gamepad2 className="w-4 h-4 text-amber-400 shrink-0" />
                                <span className="truncate">٤ أذرع DualSense أصلية</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Rooms Section Header */}
                <div className="flex items-center justify-between px-1 mb-4 mt-2">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-gradient-to-b from-red-500 to-red-700 rounded-full" />
                        <h3 className="font-bold text-base md:text-xl text-white font-body">اختر الغرفة المناسبة لك</h3>
                    </div>
                    <span className="text-xs text-neutral-400 font-body">٢ غرف مجهزة بالكامل</span>
                </div>

                {/* ROOM CARDS - 2 COLUMNS ON DESKTOP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ROOM 01: Standard Esports Arena */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className="rounded-3xl bg-neutral-900/90 border border-white/10 overflow-hidden shadow-2xl transition-all hover:border-red-500/40 group flex flex-col justify-between"
                    >
                        {/* Image Showcase */}
                        <div className="relative h-48 md:h-56 w-full overflow-hidden">
                            <img
                                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80"
                                alt="D95 Room 01 Esports"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
                            
                            {/* Live Badge */}
                            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-white font-body">متاح للحجز الفوري</span>
                            </div>

                            {/* Rate Badge */}
                            <div className="absolute bottom-3 left-3 flex items-baseline gap-1 bg-red-950/80 backdrop-blur-md border border-red-500/40 px-3.5 py-1.5 rounded-xl">
                                <span className="font-display font-black text-2xl text-white">100</span>
                                <span className="text-xs text-red-200 font-body">ج.م / ساعة</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-display text-xl md:text-2xl font-bold text-white tracking-wide">ROOM 01 // ARENA</h4>
                                            <span className="text-[10px] bg-white/10 text-neutral-300 px-2.5 py-0.5 rounded-full font-bold">Standard</span>
                                        </div>
                                        <p className="text-xs md:text-sm text-neutral-400 font-body mt-0.5">غرفة التحدي والبطولات • مثالية لـ ٢ إلى ٤ لاعبين</p>
                                    </div>
                                </div>

                                {/* Specs Pills */}
                                <div className="grid grid-cols-2 gap-2.5 my-4 text-xs md:text-sm text-neutral-300 font-body">
                                    <div className="flex items-center gap-2">
                                        <Tv className="w-4 h-4 text-red-400" />
                                        <span>شاشة 65 بوصة 4K 120Hz</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Gamepad2 className="w-4 h-4 text-red-400" />
                                        <span>٤ دراعات DualSense لاسلكية</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Headphones className="w-4 h-4 text-amber-400" />
                                        <span>سماعات Pulse 3D محيطية</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-amber-400" />
                                        <span>كنبة مريحة وتكييف قوي</span>
                                    </div>
                                </div>

                                {/* Top Games Included */}
                                <div className="pt-3 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 mb-4">
                                    <span className="text-xs text-neutral-400 font-bold whitespace-nowrap">الألعاب:</span>
                                    {['FC 25', 'GTA V', 'Tekken 8', 'Call of Duty', 'Mortal Kombat'].map((g, i) => (
                                        <span key={i} className="text-[11px] bg-neutral-800 text-neutral-300 px-2.5 py-1 rounded-lg whitespace-nowrap border border-white/5">
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Book CTA */}
                            <button
                                onClick={() => handleBooking('غرفة 01 (PlayStation 5)', 'standard', 100)}
                                className="w-full py-3.5 px-4 rounded-2xl font-bold font-body text-sm md:text-base text-white flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(196,30,58,0.35)] active:scale-[0.98] transition-all cursor-pointer mt-2"
                                style={{
                                    background: 'linear-gradient(135deg, #c41e3a, #8b1020)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                <span>احجز غرفة 01 الآن</span>
                                <ArrowRight className="w-4 h-4 rotate-180" />
                            </button>
                        </div>
                    </motion.div>

                    {/* ROOM 02: VIP Presidential Suite */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="rounded-3xl bg-neutral-900/90 border border-amber-500/30 overflow-hidden shadow-2xl transition-all hover:border-amber-500/60 group relative flex flex-col justify-between"
                    >
                        {/* VIP Glow Accent */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                        {/* Image Showcase */}
                        <div className="relative h-48 md:h-56 w-full overflow-hidden">
                            <img
                                src="https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=800&auto=format&fit=crop&q=80"
                                alt="D95 Room 02 VIP Suite"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
                            
                            {/* VIP Gold Badge */}
                            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-950/80 backdrop-blur-md border border-amber-500/50">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                                <span className="text-xs font-bold text-amber-300 font-body">جناح VIP الفندقي الفاخر</span>
                            </div>

                            {/* Rate Badge */}
                            <div className="absolute bottom-3 left-3 flex items-baseline gap-1 bg-amber-950/90 backdrop-blur-md border border-amber-500/40 px-3.5 py-1.5 rounded-xl">
                                <span className="font-display font-black text-2xl text-amber-300">120</span>
                                <span className="text-xs text-amber-200 font-body">ج.م / ساعة</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-display text-xl md:text-2xl font-bold text-amber-300 tracking-wide">ROOM 02 // VIP SUITE</h4>
                                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-bold border border-amber-500/30">ELITE</span>
                                        </div>
                                        <p className="text-xs md:text-sm text-neutral-400 font-body mt-0.5">صالون فندقي معزول بالكامل • يتسع حتى ٦ أشخاص براحة تامة</p>
                                    </div>
                                </div>

                                {/* Specs Pills */}
                                <div className="grid grid-cols-2 gap-2.5 my-4 text-xs md:text-sm text-neutral-300 font-body">
                                    <div className="flex items-center gap-2">
                                        <Monitor className="w-4 h-4 text-amber-400" />
                                        <span>شاشة سينمائية 75" 4K HDR</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Armchair className="w-4 h-4 text-amber-400" />
                                        <span>كراسي Lazy Boy جلد فاخرة</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                        <span>نظام صوتي Dolby Atmos 5.1</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                                        <span>خصوصية تامة وخدمة ويتر مميزة</span>
                                    </div>
                                </div>

                                {/* Top Games Included */}
                                <div className="pt-3 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 mb-4">
                                    <span className="text-xs text-neutral-400 font-bold whitespace-nowrap">مكتبة VIP:</span>
                                    {['كل ألعاب PS5 Pro', 'EA FC 25', 'Gran Turismo 7', 'Spider-Man 2', 'NBA 2K25'].map((g, i) => (
                                        <span key={i} className="text-[11px] bg-amber-950/40 text-amber-200 px-2.5 py-1 rounded-lg whitespace-nowrap border border-amber-500/20">
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Book CTA */}
                            <button
                                onClick={() => handleBooking('غرفة 02 VIP (Presidential Suite)', 'vip', 120)}
                                className="w-full py-3.5 px-4 rounded-2xl font-bold font-body text-sm md:text-base text-black flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(212,160,23,0.35)] active:scale-[0.98] transition-all cursor-pointer mt-2"
                                style={{
                                    background: 'linear-gradient(135deg, #D4A017, #F5D77F)',
                                    border: '1px solid rgba(255, 255, 255, 0.4)'
                                }}
                            >
                                <span>احجز جناح VIP الآن</span>
                                <ArrowRight className="w-4 h-4 rotate-180" />
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Assurance Bar */}
                <div className="mt-6 bg-neutral-900/60 rounded-2xl p-4 border border-white/5 flex items-center justify-between text-xs md:text-sm text-neutral-400 font-body">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>الدفع متاح كاش أو إنستاباي عند الوصول</span>
                    </div>
                    <span className="font-mono text-xs text-neutral-500">D95 // CAIRO LOUNGE</span>
                </div>
            </main>
        </div>
    );
}
