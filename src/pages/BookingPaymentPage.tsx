import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowRight,
    Clock,
    User,
    Smartphone,
    Banknote,
    Check,
    Zap,
    Wallet,
    Copy,
    CheckCircle2,
    ShieldCheck,
    Tag,
    FileText,
    Sun,
    Moon,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useTheme } from '@/stores/themeStore';
import { useCart } from '@/stores/cartStore';
import { getItemUnitPrice } from '@/lib/cartUtils';
import CategoryIcon from '@/components/features/CategoryIcon';
import { CONTACT_INFO } from '@/constants/contactInfo';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';
import { createBooking } from '@/services/bookingService';
import { createDateTimeFromBusinessDate, calculateEndDateTime } from '@/lib/bookingDatetime';

type PaymentMethod = 'instapay' | 'wallet' | 'cash';

interface SnackItem {
    id: string;
    name: string;
    price: number;
    icon?: string;
    category?: string;
    description?: string;
}

export default function BookingPaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { items: cartItems, cafeTotal, clearCart } = useCart();

    // Booking context from state or session storage fallback
    const [bookingState] = useState(() => {
        if (location.state && location.state.room) {
            try {
                sessionStorage.setItem('d95_pending_booking', JSON.stringify(location.state));
            } catch (e) {
                console.warn('Could not cache pending booking:', e);
            }
            return location.state;
        }

        try {
            const cached = sessionStorage.getItem('d95_pending_booking');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed?.room) return parsed;
            }
        } catch (e) {
            console.warn('Could not read cached booking:', e);
        }

        return null;
    });

    useEffect(() => {
        if (!bookingState || !bookingState.room) {
            toast.info('يرجى اختيار الغرفة والموعد المناسب أولاً 🎮');
            navigate('/playstation', { replace: true });
        }
    }, [bookingState, navigate]);

    if (!bookingState) {
        return null;
    }

    const {
        room,
        date,
        startTime,
        endTime,
        startDateTime,
        endDateTime,
        durationHours,
        roomSubtotal,
        snacks,
        snacksTotal
    } = bookingState;

    // Harmonize snacks: use state snacks if provided, otherwise integrate live cart cafe items
    const effectiveSnacks: SnackItem[] = (snacks && snacks.length > 0)
        ? snacks
        : cartItems.map(item => ({
            id: item.id,
            name: `${item.name}${item.customization.quantity > 1 ? ` × ${item.customization.quantity}` : ''}`,
            price: getItemUnitPrice(item) * item.customization.quantity,
            icon: '☕',
        }));

    const effectiveSnacksTotal = (snacksTotal && snacksTotal > 0)
        ? snacksTotal
        : (snacks && snacks.length > 0)
        ? snacks.reduce((sum: number, s: SnackItem) => sum + (s.price || 0), 0)
        : cafeTotal;

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('instapay');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [promoInput, setPromoInput] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Copy with animated feedback
    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.success(`تم نسخ ${text} بنجاح!`);
        setTimeout(() => setCopiedKey(null), 2500);
    };

    // Promo code handler (D95VIP or GAMER10 gives 10% discount)
    const handleApplyPromo = () => {
        const cleaned = promoInput.trim().toUpperCase();
        if (!cleaned) {
            toast.error('يرجى إدخال كود الخصم');
            return;
        }
        if (cleaned === 'D95VIP' || cleaned === 'GAMER10' || cleaned === 'D95') {
            playPs5SelectSound();
            setAppliedPromo(cleaned);
            toast.success('🎉 تم تفعيل خصم 10% بنجاح!');
        } else {
            toast.error('كود الخصم غير صالح أو منتهي الصلاحية');
        }
    };

    // Calculate discount and net total
    const rawTotal = (roomSubtotal || 200) + (effectiveSnacksTotal || 0);
    const discountAmount = appliedPromo ? Math.round(rawTotal * 0.1) : 0;
    const netTotal = Math.max(0, rawTotal - discountAmount);
    const [submitting, setSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (!name.trim() || name.trim().length < 3) {
            toast.error('برجاء كتابة اسمك الكريم بالكامل');
            return;
        }

        // Egyptian phone number check (010, 011, 012, 015 - 11 digits)
        const cleanPhone = phone.replace(/\D/g, '');
        const isValidEgyptianPhone = /^(01[0125][0-9]{8}|201[0125][0-9]{8})$/.test(cleanPhone);
        if (!isValidEgyptianPhone) {
            toast.error('برجاء إدخال رقم هاتف محمول صحيح (مثال: 01012345678) لتأكيد الحجز');
            return;
        }

        playPs5SelectSound();
        setSubmitting(true);

        // Generate a VIP Reservation ID with high entropy
        const reservationId = `D95-PS-${Date.now().toString(36).slice(-4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Resolve exact start_datetime and end_datetime
        let finalStartDateTime = startDateTime;
        let finalEndDateTime = endDateTime;

        if (!finalStartDateTime || !finalEndDateTime) {
            // Fallback: parse startTime (e.g. "06:00 م" or "18:00")
            const isPM = startTime.includes('م') || startTime.includes('PM');
            const cleanTime = startTime.replace(/[^\d:]/g, '').trim();
            const [hStr, mStr] = cleanTime.split(':');
            let h = parseInt(hStr || '18', 10);
            const m = parseInt(mStr || '0', 10);
            if (isPM && h < 12) h += 12;
            if (!isPM && h === 12) h = 0;
            const time24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const sDate = createDateTimeFromBusinessDate(date, time24);
            const eDate = calculateEndDateTime(sDate, Number(durationHours) || 1);
            finalStartDateTime = sDate.toISOString();
            finalEndDateTime = eDate.toISOString();
        }

        // Record booking to Supabase database
        try {
            await createBooking({
                reservation_id: reservationId,
                customer_name: name.trim(),
                customer_phone: cleanPhone,
                room_id: room?.id || 'room-1',
                room_name: room?.name || 'غرفة 01 (Play Room)',
                booking_date: date,
                start_time: startTime,
                end_time: endTime,
                start_datetime: finalStartDateTime,
                end_datetime: finalEndDateTime,
                duration_hours: Number(durationHours) || 1,
                subtotal: Number(roomSubtotal) || 0,
                snacks_total: Number(effectiveSnacksTotal) || 0,
                discount_amount: Number(discountAmount) || 0,
                total_amount: Number(netTotal) || 0,
                payment_method: paymentMethod,
                status: 'pending',
                snacks: effectiveSnacks || [],
                notes: notes.trim() || null,
            });

            // Booking successfully recorded - clear cart & pending session
            try {
                sessionStorage.removeItem('d95_pending_booking');
            } catch (e) {
                console.warn('Could not clear pending session:', e);
            }
            clearCart();
        } catch (err: unknown) {
            console.error('Failed to save booking to Supabase:', err);
            const msg = err instanceof Error ? err.message : 'عذراً، تعذر إتمام الحجز لوجود تعارض في الموعد أو مشكلة في الاتصال';
            toast.error(msg);
            setSubmitting(false);
            return; // Abort on failure - do NOT navigate to success!
        } finally {
            setSubmitting(false);
        }

        navigate('/playstation/success', {
            state: {
                reservationId,
                room,
                date,
                startTime,
                endTime,
                durationHours,
                roomSubtotal,
                snacks: effectiveSnacks,
                snacksTotal: effectiveSnacksTotal,
                discountAmount,
                netTotal,
                paymentMethod,
                name: name.trim(),
                phone: cleanPhone,
                notes: notes.trim(),
                appliedPromo,
            },
        });
    };

    return (
        <div className="min-h-screen w-full bg-[#F6F5F2] dark:bg-[#0a0809] text-neutral-900 dark:text-white font-body text-sm flex flex-col selection:bg-red-600 selection:text-white relative select-none transition-colors duration-200">
            {/* Ambient Dark Gaming Glow (Dark Mode only) */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden dark:block hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[380px] bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(220,38,38,0.18)_0%,transparent_75%)] blur-[60px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
            </div>

            {/* Top Navigation Bar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-white/95 dark:bg-[#0e0a0c]/95 backdrop-blur-xl pt-safe border-b border-neutral-200 dark:border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.7)] transition-colors duration-200">
                <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-5xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="الرجوع"
                            className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-neutral-800 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-95 cursor-pointer border border-neutral-200 dark:border-white/15 shadow-sm"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col text-right">
                            <h1 className="font-bold text-base text-neutral-900 dark:text-white leading-tight font-body">
                                طريقة الدفع وتأكيد الحجز
                            </h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-bebas text-lg font-black tracking-wider leading-none">
                                    <span className="text-neutral-900 dark:text-white">D</span><span className="text-red-600">95</span>
                                </span>
                                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider">SECURE CHECKOUT</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Theme Toggle Button */}
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-white/15 transition-all cursor-pointer shadow-sm active:scale-95"
                            aria-label="تبديل المظهر"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-neutral-700" />}
                        </button>

                        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-sm">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>دفع آمن ومعتمد</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative z-10 w-full pt-20 pb-32 lg:pb-16 px-3.5 sm:px-6 max-w-5xl mx-auto" dir="rtl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start mt-2">
                    {/* RIGHT COLUMN: CONTACT & PAYMENT SELECTION (7 of 12) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* CUSTOMER CONTACT INFORMATION */}
                        <section className="bg-white dark:bg-[#140e10]/95 border border-neutral-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-xl backdrop-blur-md transition-colors">
                            <div className="flex items-center gap-2 mb-3 text-neutral-900 dark:text-white font-bold text-sm">
                                <User className="w-4 h-4 text-red-600 dark:text-red-500" />
                                <span>بيانات التواصل لتأكيد حجز مكانك</span>
                            </div>

                            <div className="space-y-3">
                                <div className="relative flex items-center bg-neutral-50 dark:bg-[#1c1417]/80 rounded-xl px-3.5 py-2.5 border border-neutral-200 dark:border-white/10 focus-within:border-red-500 focus-within:bg-white dark:focus-within:bg-[#241a1e] transition-all">
                                    <User className="w-4 h-4 text-neutral-400 ml-3 shrink-0" />
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-transparent font-body text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none font-medium"
                                        placeholder="الاسم بالكامل (مثال: كريم محمد)"
                                        type="text"
                                        required
                                    />
                                </div>

                                <div className="relative flex items-center bg-neutral-50 dark:bg-[#1c1417]/80 rounded-xl px-3.5 py-2.5 border border-neutral-200 dark:border-white/10 focus-within:border-red-500 focus-within:bg-white dark:focus-within:bg-[#241a1e] transition-all">
                                    <Smartphone className="w-4 h-4 text-neutral-400 ml-3 shrink-0" />
                                    <input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-transparent font-body text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none font-medium"
                                        placeholder="رقم الموبايل (مثال: 01012345678)"
                                        type="tel"
                                        dir="rtl"
                                        required
                                    />
                                </div>

                                <div className="relative flex items-center bg-neutral-50 dark:bg-[#1c1417]/80 rounded-xl px-3.5 py-2.5 border border-neutral-200 dark:border-white/10 focus-within:border-red-500 focus-within:bg-white dark:focus-within:bg-[#241a1e] transition-all">
                                    <FileText className="w-4 h-4 text-neutral-400 ml-3 shrink-0" />
                                    <input
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full bg-transparent font-body text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none font-medium"
                                        placeholder="ملاحظات خاصة (مثال: ٤ دراعات، فيفا ٢٥ جاهزة)"
                                        type="text"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* PAYMENT METHOD SELECTION */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 px-1 text-sm font-bold text-neutral-900 dark:text-white">
                                <Banknote className="w-4 h-4 text-red-600 dark:text-red-500" />
                                <span>اختر طريقة الدفع المناسبة</span>
                            </div>

                            {/* METHOD 1: INSTAPAY */}
                            <div
                                onClick={() => {
                                    setPaymentMethod('instapay');
                                    playPs5NavigateSound();
                                }}
                                className={`w-full text-right p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 cursor-pointer ${paymentMethod === 'instapay'
                                        ? 'bg-red-50 dark:bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.15)] dark:shadow-[0_0_20px_rgba(220,38,38,0.25)] scale-[1.01]'
                                        : 'bg-white dark:bg-[#140e10]/95 border-neutral-200 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20 text-neutral-700 dark:text-neutral-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-neutral-900 dark:text-white font-body">إنستاباي (InstaPay)</span>
                                                <span className="text-[10px] bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-bold border border-red-300 dark:border-red-500/40">
                                                    فوري بدون رسوم
                                                </span>
                                            </div>
                                            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">تحويل لحظي مباشر وسهل لعنوان الدفع (IPA)</span>
                                        </div>
                                    </div>
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${paymentMethod === 'instapay' ? 'bg-red-600 border-red-500 text-white' : 'border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-black/40'
                                            }`}
                                    >
                                        {paymentMethod === 'instapay' && <Check className="w-4 h-4 stroke-[3]" />}
                                    </div>
                                </div>

                                {paymentMethod === 'instapay' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="overflow-hidden pt-3 border-t border-neutral-200 dark:border-white/10 flex flex-col gap-2.5"
                                    >
                                        <div className="bg-neutral-100 dark:bg-black/60 p-3 rounded-xl flex items-center justify-between border border-neutral-200 dark:border-white/10 shadow-sm">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-semibold">معرف إنستاباي المعتمد (IPA):</span>
                                                <span className="text-sm sm:text-base font-bold text-red-600 dark:text-red-400 font-mono tracking-wider select-all" dir="ltr">
                                                    {CONTACT_INFO.instapayHandle}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopy(CONTACT_INFO.instapayHandle, 'instapay');
                                                }}
                                                className="shrink-0 flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
                                            >
                                                {copiedKey === 'instapay' ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                                        <span>تم النسخ</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4" />
                                                        <span>نسخ المعرف</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <div className="bg-red-50 dark:bg-[#1c1417]/80 p-3 rounded-xl border border-red-200 dark:border-white/10 text-xs text-neutral-700 dark:text-neutral-300 font-medium space-y-1">
                                            <p className="text-red-600 dark:text-red-400 font-bold">⚡ خطوات بسيطة وسريعة:</p>
                                            <p>١. افتح تطبيق إنستاباي ➔ تحويل إلى عنوان دفع لحظي (IPA).</p>
                                            <p>٢. الصق المعرف المنسوخ أعلاه وحوّل المبلغ المطلوب ({netTotal} ج.م).</p>
                                            <p>٣. اضغط بالأسفل لإرسال سكرين شوت الإيصال عبر واتساب لتأكيد الغرفة فوراً.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* METHOD 2: CASH ON ARRIVAL */}
                            <div
                                onClick={() => {
                                    setPaymentMethod('cash');
                                    playPs5NavigateSound();
                                }}
                                className={`w-full text-right p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 cursor-pointer ${paymentMethod === 'cash'
                                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-[0_0_20px_rgba(212,160,23,0.15)] dark:shadow-[0_0_20px_rgba(212,160,23,0.25)] scale-[1.01]'
                                        : 'bg-white dark:bg-[#140e10]/95 border-neutral-200 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20 text-neutral-700 dark:text-neutral-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                            <Banknote className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-neutral-900 dark:text-white font-body">كاش في الصالة</span>
                                                <span className="text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-300 dark:border-amber-500/40">
                                                    بدون دفع مسبق
                                                </span>
                                            </div>
                                            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">ادفع نقداً في فرع D95 عند الوصول وبدء وقت اللعب</span>
                                        </div>
                                    </div>
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${paymentMethod === 'cash' ? 'bg-amber-500 border-amber-500 text-black' : 'border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-black/40'
                                            }`}
                                    >
                                        {paymentMethod === 'cash' && <Check className="w-4 h-4 stroke-[3]" />}
                                    </div>
                                </div>

                                {paymentMethod === 'cash' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="overflow-hidden pt-2 border-t border-neutral-200 dark:border-white/10"
                                    >
                                        <p className="text-xs text-amber-900 dark:text-amber-200 font-medium leading-relaxed bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-500/30">
                                            سيتم حجز الغرفة باسمك فوراً. يرجى الحضور قبل الموعد بـ ١٠ دقائق لضمان حفظ الحجز.
                                        </p>
                                    </motion.div>
                                )}
                            </div>

                            {/* METHOD 3: MOBILE WALLET */}
                            <div
                                onClick={() => {
                                    setPaymentMethod('wallet');
                                    playPs5NavigateSound();
                                }}
                                className={`w-full text-right p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 cursor-pointer ${paymentMethod === 'wallet'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] dark:shadow-[0_0_20px_rgba(16,185,129,0.25)] scale-[1.01]'
                                        : 'bg-white dark:bg-[#140e10]/95 border-neutral-200 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20 text-neutral-700 dark:text-neutral-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                            <Wallet className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-neutral-900 dark:text-white font-body">فودافون كاش ومحافظ المحمول</span>
                                                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-300 dark:border-emerald-500/40">
                                                    كل المحافظ
                                                </span>
                                            </div>
                                            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">تحويل كاش من فودافون كاش، أورنج، اتصالات، تيلدا أو وي</span>
                                        </div>
                                    </div>
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${paymentMethod === 'wallet' ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-black/40'
                                            }`}
                                    >
                                        {paymentMethod === 'wallet' && <Check className="w-4 h-4 stroke-[3]" />}
                                    </div>
                                </div>

                                {paymentMethod === 'wallet' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="overflow-hidden pt-3 border-t border-neutral-200 dark:border-white/10 flex flex-col gap-2"
                                    >
                                        <div className="bg-neutral-100 dark:bg-black/60 p-3 rounded-xl flex items-center justify-between border border-neutral-200 dark:border-white/10 shadow-sm">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-semibold">رقم المحفظة المعتمد للتحويل:</span>
                                                <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-wider select-all" dir="ltr">
                                                    {CONTACT_INFO.walletNumber}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopy(CONTACT_INFO.walletNumber, 'wallet');
                                                }}
                                                className="shrink-0 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
                                            >
                                                {copiedKey === 'wallet' ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                                        <span>تم النسخ</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4" />
                                                        <span>نسخ الرقم</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </section>

                        {/* PROMO CODE SECTION */}
                        <section className="bg-white dark:bg-[#140e10]/95 border border-neutral-200 dark:border-white/10 rounded-2xl p-4 shadow-sm dark:shadow-xl backdrop-blur-md transition-colors">
                            <div className="flex items-center gap-2 mb-2.5 text-neutral-900 dark:text-white font-bold text-xs sm:text-sm">
                                <Tag className="w-4 h-4 text-red-600 dark:text-red-500" />
                                <span>كوبون الخصم (Promo Code)</span>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={promoInput}
                                    onChange={(e) => setPromoInput(e.target.value)}
                                    placeholder="اكتب كود الخصم (جرب: D95VIP)"
                                    className="flex-1 bg-neutral-50 dark:bg-[#1c1417]/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-body text-neutral-900 dark:text-white uppercase placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none border border-neutral-200 dark:border-white/10 focus:border-red-500 focus:bg-white dark:focus:bg-[#241a1e]"
                                />
                                <button
                                    type="button"
                                    onClick={handleApplyPromo}
                                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm cursor-pointer transition-all active:scale-95 shadow-sm"
                                >
                                    تطبيق
                                </button>
                            </div>

                            {appliedPromo && (
                                <div className="mt-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded-lg border border-emerald-200 dark:border-emerald-500/40">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <span>تم تطبيق الكود ({appliedPromo}) - خصم 10% ({discountAmount} ج.م)</span>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* LEFT COLUMN: PREVIEW & TRANSPARENT BILL (5 of 12, sticky on desktop) */}
                    <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
                        {/* Booking Preview Header Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative w-full overflow-hidden rounded-2xl bg-white dark:bg-[#140e10]/95 border border-neutral-200 dark:border-white/10 p-4 sm:p-5 shadow-sm dark:shadow-xl backdrop-blur-md transition-colors"
                        >
                            <div className="flex items-start justify-between gap-3 relative z-10">
                                <div className="flex flex-col gap-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                                        <span className="font-body text-xs text-emerald-600 dark:text-emerald-400 font-bold">ملخص الجلسة المحددة</span>
                                    </div>
                                    <h2 className="font-bold text-base text-neutral-900 dark:text-white font-body truncate">{room.name}</h2>
                                    <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 font-body text-xs mt-0.5 font-medium">
                                        <Clock className="w-3.5 h-3.5 text-red-600 dark:text-red-500 shrink-0" />
                                        <span>{date} • {startTime} - {endTime} ({durationHours} س)</span>
                                    </div>
                                </div>

                                <div className="bg-red-600 px-3.5 py-2 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-md text-white">
                                    <span className="text-[10px] font-bold text-white/80">المطلوب</span>
                                    <span className="font-brush text-2xl font-black leading-tight">{netTotal}</span>
                                    <span className="text-[10px] font-bold">ج.م</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* ITEMIZED FINANCIAL BILL */}
                        <section className="bg-white dark:bg-[#140e10]/95 border border-neutral-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-xl backdrop-blur-md space-y-3 transition-colors">
                            <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white uppercase tracking-wider pb-2 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
                                <span>تفاصيل الفاتورة الإلكترونية</span>
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">D95 INVOICE</span>
                            </h3>

                            <div className="space-y-2 text-xs sm:text-sm font-body text-neutral-600 dark:text-neutral-300">
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-500 dark:text-neutral-400">حجز {room.name} ({durationHours} س):</span>
                                    <span className="font-bold text-neutral-900 dark:text-white">{roomSubtotal} ج.م</span>
                                </div>

                                {effectiveSnacks && effectiveSnacks.length > 0 && effectiveSnacks.map((s: SnackItem) => (
                                    <div key={s.id} className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                                        <span className="flex items-center gap-1.5">
                                            <CategoryIcon categoryId={s.category} icon={s.icon} size={13} className="text-red-500 shrink-0" />
                                            <span>{s.name}:</span>
                                        </span>
                                        <span className="text-red-600 dark:text-red-400 font-bold">+{s.price} ج.م</span>
                                    </div>
                                ))}

                                {appliedPromo && (
                                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                                        <span>خصم الكوبون ({appliedPromo}):</span>
                                        <span>-{discountAmount} ج.م</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-3 border-t border-neutral-200 dark:border-white/10">
                                    <span className="font-bold text-sm text-neutral-900 dark:text-white">المبلغ النهائي المستحق:</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-bebas text-3xl sm:text-4xl font-black text-red-600 dark:text-red-500">{netTotal}</span>
                                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-bold">ج.م</span>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop CTA Button */}
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={submitting}
                                className={`hidden lg:flex w-full py-3.5 px-6 rounded-xl font-bold font-body text-sm text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all shadow-[0_4px_20px_rgba(220,38,38,0.35)] active:scale-[0.98] items-center justify-center gap-2 mt-4 border border-red-500/50 ${
                                    submitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                                }`}
                            >
                                <span>{submitting ? 'جاري تأكيد الحجز...' : 'تأكيد الحجز والحصول على التذكرة'}</span>
                                <ArrowRight className="w-4 h-4 rotate-180" />
                            </button>
                        </section>
                    </div>
                </div>
            </main>

            {/* STICKY CONFIRMATION ACTION (MOBILE ONLY: lg:hidden) */}
            <div className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-white/98 dark:bg-[#0e0a0c]/98 backdrop-blur-xl border-t border-neutral-200 dark:border-white/10 shadow-[0_-10px_35px_rgba(0,0,0,0.08)] dark:shadow-[0_-10px_35px_rgba(0,0,0,0.9)] lg:hidden transition-colors">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-3" dir="rtl">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold font-body">طريقة الدفع:</span>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white font-body">
                            {paymentMethod === 'instapay' ? 'إنستاباي لحظي' : paymentMethod === 'cash' ? 'كاش بالصالة' : 'محفظة إلكترونية'}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={submitting}
                        className={`flex-1 py-3 px-5 rounded-xl font-bold font-body text-sm text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all shadow-[0_0_20px_rgba(220,38,38,0.35)] active:scale-[0.98] flex items-center justify-center gap-2 border border-red-500/50 ${
                            submitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                    >
                        <span>{submitting ? 'جاري التأكيد...' : 'تأكيد الحجز'}</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
}
