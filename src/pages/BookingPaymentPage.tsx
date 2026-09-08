import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Clock, User, Smartphone, Banknote, Check, Zap, Wallet, Copy, Info, CheckCircle2, ShieldCheck, Tag, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type PaymentMethod = 'instapay' | 'wallet' | 'cash';

export default function BookingPaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Booking context from state with rock-solid defaults
    const bookingState = location.state || {
        room: { name: 'غرفة 01 (PlayStation 5)', type: 'standard', rate: 100 },
        date: new Date().toISOString().split('T')[0],
        startTime: '06:00 م',
        endTime: '08:00 م',
        durationHours: 2,
        roomSubtotal: 200,
        snacks: [],
        snacksTotal: 0,
        total: 200
    };

    const { room, date, startTime, endTime, durationHours, roomSubtotal, snacks, snacksTotal } = bookingState;

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
            setAppliedPromo(cleaned);
            toast.success('🎉 تم تفعيل خصم 10% بنجاح!');
        } else {
            toast.error('كود الخصم غير صالح أو منتهي الصلاحية');
        }
    };

    // Calculate discount and net total
    const rawTotal = (roomSubtotal || 200) + (snacksTotal || 0);
    const discountAmount = appliedPromo ? Math.round(rawTotal * 0.1) : 0;
    const netTotal = Math.max(0, rawTotal - discountAmount);

    const handleConfirm = () => {
        if (!name.trim() || name.trim().length < 3) {
            toast.error('برجاء كتابة اسمك الكريم بالكامل');
            return;
        }

        // Egyptian phone number check (at least 10-11 digits)
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            toast.error('برجاء إدخال رقم هاتف صحيح للتواصل وتأكيد الحجز');
            return;
        }

        // Generate a VIP Reservation ID
        const reservationId = `D95-PS-${Math.floor(1000 + Math.random() * 9000)}`;

        navigate('/playstation/success', {
            state: {
                reservationId,
                room,
                date,
                startTime,
                endTime,
                durationHours,
                roomSubtotal,
                snacks,
                snacksTotal,
                discountAmount,
                netTotal,
                paymentMethod,
                name: name.trim(),
                phone: cleanPhone,
                notes: notes.trim(),
                appliedPromo
            }
        });
    };

    return (
        <div className="bg-[#090707] text-white font-body text-sm flex flex-col min-h-screen selection:bg-red-500/30">
            {/* Top Bar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-[#090707]/95 backdrop-blur-xl pt-safe border-b border-white/5">
                <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-6xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="الرجوع"
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:text-red-400 transition-colors active:scale-95 cursor-pointer"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col text-right">
                            <h1 className="font-display text-lg md:text-xl font-bold uppercase tracking-wider text-white">طريقة الدفع والتأكيد</h1>
                            <span className="font-body text-[10px] md:text-xs text-neutral-400">D95 SECURE CHECKOUT</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-body bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        <ShieldCheck className="w-4 h-4" />
                        <span>دفع آمن ومعتمد</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col relative w-full pt-20 pb-32 lg:pb-16 px-3.5 md:px-8 max-w-6xl mx-auto" dir="rtl">
                {/* 2-COLUMN RESPONSIVE LAYOUT FOR DESKTOP */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
                    {/* RIGHT COLUMN: CONTACT & PAYMENT SELECTION (7 of 12) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* CUSTOMER CONTACT INFORMATION */}
                        <section className="bg-neutral-900/90 rounded-3xl p-5 border border-white/5 shadow-lg">
                            <label className="font-bold text-xs md:text-sm text-neutral-200 flex items-center gap-2 mb-3 font-body">
                                <User className="w-4 h-4 text-red-400" />
                                بيانات التواصل لتأكيد حجز مكانك
                            </label>

                            <div className="space-y-3">
                                <div className="relative flex items-center bg-neutral-800/90 rounded-2xl px-3.5 py-3 border border-white/5 focus-within:border-red-500 transition-colors">
                                    <User className="w-4 h-4 text-neutral-400 ml-3 shrink-0" />
                                    <input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-transparent font-body text-xs md:text-sm text-white placeholder:text-neutral-500 outline-none"
                                        placeholder="الاسم بالكامل (مثال: كريم محمد)"
                                        type="text"
                                        required
                                    />
                                </div>

                                <div className="relative flex items-center bg-neutral-800/90 rounded-2xl px-3.5 py-3 border border-white/5 focus-within:border-red-500 transition-colors">
                                    <Smartphone className="w-4 h-4 text-neutral-400 ml-3 shrink-0" />
                                    <input
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full bg-transparent font-body text-xs md:text-sm text-white placeholder:text-neutral-500 outline-none"
                                        placeholder="رقم الموبايل (مثال: 01012345678)"
                                        type="tel"
                                        dir="rtl"
                                        required
                                    />
                                </div>

                                <div className="relative flex items-center bg-neutral-800/90 rounded-2xl px-3.5 py-3 border border-white/5 focus-within:border-red-500 transition-colors">
                                    <FileText className="w-4 h-4 text-neutral-400 ml-3 shrink-0" />
                                    <input
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="w-full bg-transparent font-body text-xs md:text-sm text-white placeholder:text-neutral-500 outline-none"
                                        placeholder="ملاحظات خاصة (مثال: ٤ دراعات، فيفا ٢٥ جاهزة)"
                                        type="text"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* PAYMENT METHOD SELECTION */}
                        <section className="space-y-3">
                            <span className="font-bold text-xs md:text-sm text-neutral-300 flex items-center gap-2 font-body px-1">
                                <Banknote className="w-4 h-4 text-red-400" />
                                اختر طريقة الدفع المناسبة
                            </span>

                            {/* METHOD 1: INSTAPAY */}
                            <div
                                onClick={() => setPaymentMethod('instapay')}
                                className={`w-full text-right p-5 rounded-3xl border transition-all flex flex-col gap-3 cursor-pointer shadow-lg ${
                                    paymentMethod === 'instapay'
                                        ? 'bg-gradient-to-br from-red-950/50 via-neutral-900 to-neutral-950 border-red-500/80 shadow-[0_0_20px_rgba(196,30,58,0.25)]'
                                        : 'bg-neutral-900/90 border-white/5 hover:border-white/15'
                                }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center shrink-0 shadow-md">
                                            <Zap className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm md:text-base text-white font-body">إنستاباي (InstaPay)</span>
                                                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold font-body">فوري بدون رسوم</span>
                                            </div>
                                            <span className="text-xs text-neutral-400 font-body">تحويل لحظي مباشر وسهل لعنوان الدفع (IPA)</span>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                        paymentMethod === 'instapay' ? 'bg-red-600 text-white' : 'border border-neutral-600'
                                    }`}>
                                        {paymentMethod === 'instapay' && <Check className="w-4 h-4 stroke-[3]" />}
                                    </div>
                                </div>

                                {paymentMethod === 'instapay' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="overflow-hidden pt-3 border-t border-white/10 flex flex-col gap-3"
                                    >
                                        <div className="bg-black/60 p-3.5 rounded-2xl flex items-center justify-between border border-white/10">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs text-neutral-400 font-body">معرف إنستاباي المعتمد (IPA):</span>
                                                <span className="text-sm md:text-base font-bold text-red-300 font-mono tracking-wider select-all" dir="ltr">
                                                    d95cairo@instapay
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleCopy('d95cairo@instapay', 'instapay'); }}
                                                className="shrink-0 flex items-center gap-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-200 px-3.5 py-2 rounded-xl text-xs font-bold font-body transition-colors cursor-pointer border border-red-500/30 active:scale-95"
                                            >
                                                {copiedKey === 'instapay' ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                        <span className="text-emerald-400">تم النسخ</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4" />
                                                        <span>نسخ المعرف</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <div className="bg-neutral-800/50 p-3 rounded-2xl border border-white/5 text-xs text-neutral-300 font-body space-y-1">
                                            <p className="text-red-400 font-bold">⚡ خطوات بسيطة وسريعة:</p>
                                            <p>١. افتح تطبيق إنستاباي ➔ تحويل إلى عنوان دفع لحظي (IPA).</p>
                                            <p>٢. الصق المعرف المنسوخ أعلاه وحوّل المبلغ المطلوب ({netTotal} ج.م).</p>
                                            <p>٣. اضغط بالأسفل لإرسال سكرين شوت الإيصال عبر واتساب لتأكيد الغرفة فوراً.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* METHOD 2: CASH ON ARRIVAL */}
                            <div
                                onClick={() => setPaymentMethod('cash')}
                                className={`w-full text-right p-5 rounded-3xl border transition-all flex flex-col gap-2 cursor-pointer shadow-lg ${
                                    paymentMethod === 'cash'
                                        ? 'bg-gradient-to-br from-amber-950/40 via-neutral-900 to-neutral-950 border-amber-500/80 shadow-[0_0_20px_rgba(212,160,23,0.25)]'
                                        : 'bg-neutral-900/90 border-white/5 hover:border-white/15'
                                }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center shrink-0 shadow-md">
                                            <Banknote className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm md:text-base text-white font-body">كاش في الصالة</span>
                                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold font-body">بدون دفع مسبق</span>
                                            </div>
                                            <span className="text-xs text-neutral-400 font-body">ادفع نقداً في فرع D95 عند الوصول وبدء وقت اللعب</span>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                        paymentMethod === 'cash' ? 'bg-amber-500 text-black' : 'border border-neutral-600'
                                    }`}>
                                        {paymentMethod === 'cash' && <Check className="w-4 h-4 stroke-[3]" />}
                                    </div>
                                </div>

                                {paymentMethod === 'cash' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="overflow-hidden pt-2 border-t border-white/10"
                                    >
                                        <p className="text-xs text-neutral-300 font-body leading-relaxed bg-amber-950/20 p-3 rounded-2xl border border-amber-500/20">
                                            سيتم حجز الغرفة باسمك فوراً. يرجى الحضور قبل الموعد بـ ١٠ دقائق لضمان حفظ الحجز.
                                        </p>
                                    </motion.div>
                                )}
                            </div>

                            {/* METHOD 3: MOBILE WALLET */}
                            <div
                                onClick={() => setPaymentMethod('wallet')}
                                className={`w-full text-right p-5 rounded-3xl border transition-all flex flex-col gap-3 cursor-pointer shadow-lg ${
                                    paymentMethod === 'wallet'
                                        ? 'bg-gradient-to-br from-emerald-950/40 via-neutral-900 to-neutral-950 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                                        : 'bg-neutral-900/90 border-white/5 hover:border-white/15'
                                }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center shrink-0 shadow-md">
                                            <Wallet className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm md:text-base text-white font-body">فودافون كاش ومحافظ المحمول</span>
                                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold font-body">كل المحافظ</span>
                                            </div>
                                            <span className="text-xs text-neutral-400 font-body">تحويل كاش من فودافون كاش، أورنج، اتصالات، تيلدا أو وي</span>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                        paymentMethod === 'wallet' ? 'bg-emerald-500 text-black' : 'border border-neutral-600'
                                    }`}>
                                        {paymentMethod === 'wallet' && <Check className="w-4 h-4 stroke-[3]" />}
                                    </div>
                                </div>

                                {paymentMethod === 'wallet' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="overflow-hidden pt-3 border-t border-white/10 flex flex-col gap-2"
                                    >
                                        <div className="bg-black/60 p-3.5 rounded-2xl flex items-center justify-between border border-white/10">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs text-neutral-400 font-body">رقم المحفظة المعتمد للتحويل:</span>
                                                <span className="text-sm md:text-base font-bold text-emerald-300 font-mono tracking-wider select-all" dir="ltr">
                                                    01099238475
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleCopy('01099238475', 'wallet'); }}
                                                className="shrink-0 flex items-center gap-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold font-body transition-colors cursor-pointer border border-emerald-500/30 active:scale-95"
                                            >
                                                {copiedKey === 'wallet' ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                        <span className="text-emerald-400">تم النسخ</span>
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
                        <section className="bg-neutral-900/90 rounded-3xl p-5 border border-white/5 shadow-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <Tag className="w-4 h-4 text-red-400" />
                                <span className="text-xs md:text-sm font-bold text-white font-body">كوبون الخصم (Promo Code)</span>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={promoInput}
                                    onChange={e => setPromoInput(e.target.value)}
                                    placeholder="اكتب كود الخصم (جرب: D95VIP)"
                                    className="flex-1 bg-neutral-800/90 rounded-2xl px-4 py-2.5 text-xs md:text-sm font-body text-white uppercase placeholder:text-neutral-500 outline-none border border-white/5 focus:border-red-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleApplyPromo}
                                    className="px-5 py-2.5 rounded-2xl bg-red-600/20 hover:bg-red-600/40 text-red-300 font-bold text-xs md:text-sm font-body border border-red-500/30 cursor-pointer transition-colors active:scale-95"
                                >
                                    تطبيق
                                </button>
                            </div>

                            {appliedPromo && (
                                <div className="mt-2.5 text-xs text-emerald-400 font-body flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4" />
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
                            className="relative w-full overflow-hidden rounded-3xl bg-neutral-900/90 p-5 border border-white/10 shadow-xl"
                        >
                            <div className="flex items-start justify-between gap-3 relative z-10">
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                        <span className="font-body text-xs text-red-400 font-bold uppercase tracking-wider">ملخص الجلسة المحددة</span>
                                    </div>
                                    <h2 className="font-bold text-base md:text-lg text-white font-body truncate">{room.name}</h2>
                                    <div className="flex items-center gap-2 text-neutral-300 font-body text-xs md:text-sm mt-1">
                                        <Clock className="w-4 h-4 text-red-400 shrink-0" />
                                        <span>{date} • {startTime} - {endTime} ({durationHours} س)</span>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-red-600 to-red-800 px-4 py-2.5 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-md">
                                    <span className="font-body text-[10px] text-white/80 font-bold">المطلوب</span>
                                    <span className="font-display text-2xl font-black text-white leading-tight">{netTotal}</span>
                                    <span className="font-body text-[11px] text-white/90 leading-none">ج.م</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* ITEMIZED FINANCIAL BILL */}
                        <section className="bg-neutral-900/90 rounded-3xl p-5 border border-white/10 shadow-xl space-y-3">
                            <h3 className="font-bold text-xs md:text-sm text-neutral-400 uppercase tracking-wider pb-2 border-b border-white/5">
                                تفاصيل الفاتورة الإلكترونية
                            </h3>

                            <div className="space-y-2.5 text-xs md:text-sm font-body text-neutral-300">
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-400">حجز {room.name} ({durationHours} س):</span>
                                    <span className="font-bold text-white">{roomSubtotal} ج.م</span>
                                </div>

                                {snacks && snacks.length > 0 && snacks.map((s: any) => (
                                    <div key={s.id} className="flex justify-between items-center text-neutral-400">
                                        <span>{s.icon} {s.name}:</span>
                                        <span className="text-amber-300 font-bold">+{s.price} ج.م</span>
                                    </div>
                                ))}

                                {appliedPromo && (
                                    <div className="flex justify-between items-center text-emerald-400">
                                        <span>خصم الكوبون ({appliedPromo}):</span>
                                        <span className="font-bold">-{discountAmount} ج.م</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                                    <span className="font-bold text-sm md:text-base text-white">المبلغ النهائي المستحق:</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-display font-black text-2xl md:text-3xl text-red-400">{netTotal}</span>
                                        <span className="text-xs text-neutral-400">ج.م</span>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop CTA Button */}
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="hidden lg:flex w-full py-4 px-6 rounded-2xl font-bold font-body text-base text-white transition-all shadow-[0_4px_25px_rgba(196,30,58,0.45)] active:scale-[0.98] cursor-pointer items-center justify-center gap-2.5 mt-4"
                                style={{
                                    background: 'linear-gradient(135deg, #c41e3a, #8b1020)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                <span>تأكيد الحجز والحصول على التذكرة</span>
                                <ArrowRight className="w-5 h-5 rotate-180" />
                            </button>
                        </section>
                    </div>
                </div>
            </main>

            {/* STICKY CONFIRMATION ACTION (MOBILE ONLY: lg:hidden) */}
            <div className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#090707]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] lg:hidden">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-3" dir="rtl">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-400 font-body">طريقة الدفع:</span>
                        <span className="text-xs font-bold text-white font-body">
                            {paymentMethod === 'instapay' ? 'إنستاباي لحظي' : paymentMethod === 'cash' ? 'كاش بالصالة' : 'محفظة إلكترونية'}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="flex-1 py-3.5 px-4 rounded-2xl font-bold font-body text-sm text-white transition-all shadow-[0_4px_25px_rgba(196,30,58,0.45)] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                        style={{
                            background: 'linear-gradient(135deg, #c41e3a, #8b1020)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                    >
                        <span>تأكيد الحجز</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
}
