import { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Gamepad2, Calendar, Clock, Receipt, CheckCircle2, Sparkles, Coffee, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface SnackAddon {
    id: string;
    name: string;
    price: number;
    description: string;
    icon: string;
}

const SNACK_OPTIONS: SnackAddon[] = [
    {
        id: 'redbull_combo',
        name: 'كومبو الجيمرز (ريدبول + سناك شيبس ومكسرات)',
        price: 55,
        description: 'طاقة وتركيز إضافي للجلسات الطويلة',
        icon: '⚡'
    },
    {
        id: 'coffee_specialty',
        name: 'قهوة سبيشالتي دبل إسبريسو / آيس لاتيه',
        price: 40,
        description: 'بُن برازيلي فاخر محمص طازجاً',
        icon: '☕'
    },
    {
        id: 'water_cold',
        name: 'مياه معدنية مثلجة (حجم كبير)',
        price: 15,
        description: 'انتعاش مستمر أثناء اللعب',
        icon: '💧'
    }
];

// Pre-calculated popular time chips
const TIME_SLOTS = [
    { time: '14:00', label: '02:00 م', period: 'الظهيرة' },
    { time: '16:00', label: '04:00 م', period: 'العصر' },
    { time: '18:00', label: '06:00 م', period: 'المغرب' },
    { time: '20:00', label: '08:00 م', period: 'ذروة الجيمرز 🔥' },
    { time: '22:00', label: '10:00 م', period: 'السهرة' },
    { time: '00:00', label: '12:00 ص', period: 'منتصف الليل' }
];

export default function BookingDetailsPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Read room details from router state or fallback
    const roomDetails = location.state?.room || {
        name: 'غرفة 01 (PlayStation 5)',
        type: 'standard',
        rate: 100
    };

    const ratePerHour = roomDetails.rate || (roomDetails.type === 'vip' ? 120 : 100);

    // Generate 7-day dynamic calendar list
    const calendarDays = useMemo(() => {
        const days = [];
        const arabicDayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        
        const now = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(now.getTime() + i * 86400000);
            const iso = d.toISOString().split('T')[0];
            const dayName = i === 0 ? 'اليوم' : i === 1 ? 'غداً' : arabicDayNames[d.getDay()];
            const dayNumber = d.getDate();
            const monthName = arabicMonths[d.getMonth()];
            days.push({ iso, dayName, dayNumber, monthName });
        }
        return days;
    }, []);

    const [selectedDate, setSelectedDate] = useState(calendarDays[0].iso);
    const [selectedDuration, setSelectedDuration] = useState(2); // 2 hours default
    const [startTime, setStartTime] = useState('18:00');
    const [selectedSnacks, setSelectedSnacks] = useState<string[]>([]);

    // Calculate end time dynamically
    const endTime = useMemo(() => {
        const [h, m] = startTime.split(':').map(Number);
        const endH = (h + selectedDuration) % 24;
        const period = endH >= 12 ? 'م' : 'ص';
        const displayH = endH % 12 === 0 ? 12 : endH % 12;
        return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
    }, [startTime, selectedDuration]);

    const displayStartTime = useMemo(() => {
        const [h, m] = startTime.split(':').map(Number);
        const period = h >= 12 ? 'م' : 'ص';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
    }, [startTime]);

    // Calculate Financials (with special gamer bundle discount for 5 hours)
    const roomSubtotal = selectedDuration === 5 
        ? Math.round(selectedDuration * ratePerHour * 0.85) // 15% OFF for 5-hr night
        : selectedDuration * ratePerHour;

    const snacksTotal = useMemo(() => {
        return selectedSnacks.reduce((sum, id) => {
            const snack = SNACK_OPTIONS.find(s => s.id === id);
            return sum + (snack ? snack.price : 0);
        }, 0);
    }, [selectedSnacks]);

    const grandTotal = roomSubtotal + snacksTotal;

    const toggleSnack = (id: string) => {
        setSelectedSnacks(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleContinue = () => {
        if (!selectedDate) {
            toast.error('يرجى اختيار يوم الحجز');
            return;
        }

        const chosenSnackObjects = SNACK_OPTIONS.filter(s => selectedSnacks.includes(s.id));

        navigate('/playstation/payment', {
            state: {
                room: roomDetails,
                date: selectedDate,
                startTime: displayStartTime,
                endTime,
                rawStartTime: startTime,
                durationHours: selectedDuration,
                roomSubtotal,
                snacks: chosenSnackObjects,
                snacksTotal,
                total: grandTotal
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
                            to="/playstation"
                            aria-label="الرجوع للأجهزة"
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:text-red-400 transition-colors active:scale-95 cursor-pointer"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div className="flex flex-col text-right">
                            <h1 className="font-display text-lg md:text-xl font-bold uppercase tracking-wider text-white">تفاصيل وموعد الحجز</h1>
                            <span className="font-body text-[10px] md:text-xs text-neutral-400">D95 ESPORTS LOUNGE</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-bold font-body">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span>حجز فوري مباشر</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col relative w-full pt-20 pb-32 lg:pb-16 px-3.5 md:px-8 max-w-6xl mx-auto" dir="rtl">
                {/* 2-COLUMN RESPONSIVE LAYOUT FOR DESKTOP */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
                    {/* RIGHT COLUMN: BOOKING CONTROLS (7 of 12) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* STEP 1: 7-DAY HORIZONTAL CALENDAR STRIP */}
                        <section className="bg-neutral-900/90 rounded-3xl p-5 border border-white/5 shadow-lg">
                            <div className="flex items-center justify-between mb-3.5">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-red-400" />
                                    <h3 className="font-bold text-sm md:text-base text-white font-body">١. اختر يوم الحجز</h3>
                                </div>
                                <span className="text-xs text-neutral-400 font-body">الأيام المتاحة</span>
                            </div>

                            {/* Horizontal Calendar Strip */}
                            <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1">
                                {calendarDays.map((day) => {
                                    const isSelected = selectedDate === day.iso;
                                    return (
                                        <button
                                            key={day.iso}
                                            type="button"
                                            onClick={() => setSelectedDate(day.iso)}
                                            className={`shrink-0 flex flex-col items-center justify-center w-16 py-3 rounded-2xl transition-all cursor-pointer border ${
                                                isSelected
                                                    ? 'bg-gradient-to-b from-red-600 to-red-700 text-white border-red-400 shadow-[0_0_15px_rgba(196,30,58,0.5)] scale-105'
                                                    : 'bg-neutral-800/80 text-neutral-300 border-white/5 hover:border-white/20'
                                            }`}
                                        >
                                            <span className={`text-[11px] font-bold font-body ${isSelected ? 'text-white' : 'text-neutral-400'}`}>
                                                {day.dayName}
                                            </span>
                                            <span className="font-display font-black text-lg my-0.5">
                                                {day.dayNumber}
                                            </span>
                                            <span className={`text-[10px] font-body ${isSelected ? 'text-red-100' : 'text-neutral-500'}`}>
                                                {day.monthName.slice(0, 5)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* STEP 2: SESSION DURATION */}
                        <section className="bg-neutral-900/90 rounded-3xl p-5 border border-white/5 shadow-lg">
                            <div className="flex items-center justify-between mb-3.5">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-red-400" />
                                    <h3 className="font-bold text-sm md:text-base text-white font-body">٢. مدة اللعب والتحدي</h3>
                                </div>
                                <span className="text-xs bg-red-600/20 text-red-400 px-3 py-1 rounded-full font-bold">
                                    {selectedDuration === 5 ? 'سهرة 5 ساعات' : `${selectedDuration} ${selectedDuration === 1 ? 'ساعة' : 'ساعات'}`}
                                </span>
                            </div>

                            <div className="grid grid-cols-4 gap-2.5">
                                {[
                                    { hours: 1, label: 'ساعة' },
                                    { hours: 2, label: 'ساعتان', popular: true },
                                    { hours: 3, label: '٣ ساعات' },
                                    { hours: 5, label: 'سهرة ٥ س', discount: 'وفر 15%' }
                                ].map((item) => (
                                    <button
                                        key={item.hours}
                                        type="button"
                                        onClick={() => setSelectedDuration(item.hours)}
                                        className={`relative py-3.5 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                                            selectedDuration === item.hours
                                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-400 shadow-md shadow-red-600/30'
                                                : 'bg-neutral-800/80 text-neutral-300 border-white/5 hover:bg-neutral-700/80'
                                        }`}
                                    >
                                        {item.popular && (
                                            <span className="absolute -top-2.5 bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow">
                                                الأفضل ⭐
                                            </span>
                                        )}
                                        {item.discount && (
                                            <span className="absolute -top-2.5 bg-emerald-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow">
                                                {item.discount}
                                            </span>
                                        )}
                                        <span className="font-bold text-xs md:text-sm font-body">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* STEP 3: QUICK TIME SLOTS */}
                        <section className="bg-neutral-900/90 rounded-3xl p-5 border border-white/5 shadow-lg">
                            <div className="flex items-center justify-between mb-3.5">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-red-400" />
                                    <h3 className="font-bold text-sm md:text-base text-white font-body">٣. اختر موعد البدء</h3>
                                </div>
                                <span className="text-xs text-neutral-400 font-body">المواعيد المتاحة</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2.5 mb-3">
                                {TIME_SLOTS.map((slot) => {
                                    const isSelected = startTime === slot.time;
                                    return (
                                        <button
                                            key={slot.time}
                                            type="button"
                                            onClick={() => setStartTime(slot.time)}
                                            className={`py-3 px-2 rounded-xl text-center transition-all cursor-pointer border flex flex-col items-center ${
                                                isSelected
                                                    ? 'bg-red-600/30 border-red-500 text-white shadow-[0_0_12px_rgba(196,30,58,0.4)]'
                                                    : 'bg-neutral-800/80 text-neutral-300 border-white/5 hover:border-white/20'
                                            }`}
                                        >
                                            <span className="font-bold text-xs md:text-sm font-body">{slot.label}</span>
                                            <span className="text-[10px] text-neutral-400 mt-0.5">{slot.period}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom Time Selector Pill */}
                            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs md:text-sm">
                                <span className="text-neutral-400 font-body">أو حدد توقيتاً مخصصاً:</span>
                                <div className="flex items-center gap-2 bg-neutral-800 px-3.5 py-2 rounded-xl border border-white/10">
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="mt-3 bg-black/40 rounded-xl p-2.5 flex items-center justify-between text-xs md:text-sm text-neutral-300 font-body border border-white/5">
                                <span>جلسة اللعب:</span>
                                <span className="text-red-300 font-bold" dir="ltr">
                                    {displayStartTime} ➔ {endTime}
                                </span>
                            </div>
                        </section>

                        {/* STEP 4: SNACKS & GAMING COMBOS (UPSELL) */}
                        <section className="bg-neutral-900/90 rounded-3xl p-5 border border-white/5 shadow-lg">
                            <div className="flex items-center justify-between mb-3.5">
                                <div className="flex items-center gap-2">
                                    <Coffee className="w-5 h-5 text-amber-400" />
                                    <h3 className="font-bold text-sm md:text-base text-white font-body">٤. مشروبات وسناكس اللعب (اختياري)</h3>
                                </div>
                                <span className="text-[11px] text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full font-bold border border-amber-500/20">
                                    كافيه D95
                                </span>
                            </div>

                            <div className="space-y-2.5">
                                {SNACK_OPTIONS.map((snack) => {
                                    const isChecked = selectedSnacks.includes(snack.id);
                                    return (
                                        <button
                                            key={snack.id}
                                            type="button"
                                            onClick={() => toggleSnack(snack.id)}
                                            className={`w-full text-right p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                                                isChecked
                                                    ? 'bg-amber-950/30 border-amber-500/50 shadow-md shadow-amber-900/20'
                                                    : 'bg-neutral-800/60 border-white/5 hover:border-white/15'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-2xl shrink-0">{snack.icon}</span>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-xs md:text-sm text-white truncate font-body">{snack.name}</span>
                                                    <span className="text-xs text-neutral-400 font-body mt-0.5">{snack.description}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5 shrink-0 pl-1">
                                                <span className="font-display font-bold text-sm md:text-base text-amber-300">+{snack.price} ج.م</span>
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                                                    isChecked ? 'bg-amber-500 border-amber-500 text-black' : 'border-neutral-600'
                                                }`}>
                                                    {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    {/* LEFT COLUMN: ROOM CARD & STICKY SUMMARY (5 of 12) */}
                    <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
                        {/* Room Overview Pill Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-neutral-900/90 rounded-3xl p-5 border border-white/10 shadow-xl"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600/20 to-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                                        <Gamepad2 className="w-7 h-7" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-base md:text-lg text-white truncate font-body">{roomDetails.name}</span>
                                            {roomDetails.type === 'vip' && (
                                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30 shrink-0">VIP</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-neutral-400 font-body mt-1">شاشة 4K HDR 120Hz • دراعات لاسلكية • تكييف</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0 pl-1">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold font-display text-red-400">{ratePerHour}</span>
                                        <span className="text-xs text-neutral-400 font-body">ج.م</span>
                                    </div>
                                    <span className="text-[11px] text-neutral-500 font-body">/ ساعة</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Booking Summary Card */}
                        <div className="bg-neutral-900/90 rounded-3xl p-5 border border-white/10 shadow-xl space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <Receipt className="w-5 h-5 text-red-400" />
                                    <span className="text-sm md:text-base font-bold text-white font-body">ملخص التكلفة</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-display font-black text-2xl text-red-400">{grandTotal}</span>
                                    <span className="text-xs text-neutral-400 font-body">ج.م</span>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs md:text-sm text-neutral-300 font-body">
                                <div className="flex items-center justify-between">
                                    <span className="text-neutral-400">اليوم والموعد:</span>
                                    <span className="font-bold text-white">{selectedDate} ({displayStartTime})</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-neutral-400">المدة والتسعيرة:</span>
                                    <span className="font-bold text-white">{selectedDuration} ساعات × {ratePerHour} ج.م</span>
                                </div>
                                {selectedDuration === 5 && (
                                    <div className="flex items-center justify-between text-emerald-400">
                                        <span>خصم باقة السهرة (15%):</span>
                                        <span className="font-bold">مطبّق تلقائياً</span>
                                    </div>
                                )}
                                {snacksTotal > 0 && (
                                    <div className="flex items-center justify-between text-amber-300">
                                        <span>سناكس ومشروبات إضافية:</span>
                                        <span className="font-bold">+{snacksTotal} ج.م</span>
                                    </div>
                                )}
                            </div>

                            {/* Desktop Button (Only visible on lg screens) */}
                            <button
                                type="button"
                                onClick={handleContinue}
                                className="hidden lg:flex w-full py-4 px-6 rounded-2xl font-bold font-body text-base text-white transition-all shadow-[0_4px_25px_rgba(196,30,58,0.45)] active:scale-[0.98] cursor-pointer items-center justify-center gap-2.5 mt-4"
                                style={{
                                    background: 'linear-gradient(135deg, #c41e3a, #8b1020)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                <span>متابعة للدفع والتأكيد</span>
                                <ArrowRight className="w-5 h-5 rotate-180" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* STICKY BOTTOM CHECKOUT ACTION BAR (MOBILE ONLY: lg:hidden) */}
            <div className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#090707]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] lg:hidden">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-3" dir="rtl">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] text-neutral-400 font-body">الإجمالي:</span>
                            {selectedDuration === 5 && (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold">خصم 15%</span>
                            )}
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="font-display font-black text-2xl text-red-400 leading-tight">
                                {grandTotal}
                            </span>
                            <span className="text-xs text-neutral-400 font-body">ج.م</span>
                        </div>
                    </div>

                    <button
                        onClick={handleContinue}
                        className="flex-1 py-3.5 px-4 rounded-2xl font-bold font-body text-sm text-white transition-all shadow-[0_4px_25px_rgba(196,30,58,0.45)] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                        style={{
                            background: 'linear-gradient(135deg, #c41e3a, #8b1020)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                    >
                        <span>متابعة للدفع والتأكيد</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
}
