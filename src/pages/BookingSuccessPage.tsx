import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
    ArrowRight,
    CheckCircle2,
    MessageCircle,
    Clock,
    Gamepad2,
    QrCode,
    Share2,
    Coffee,
    Sun,
    Moon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '@/stores/themeStore';
import { CONTACT_INFO } from '@/constants/contactInfo';

interface SnackAddon {
    id: string;
    name: string;
    price: number;
    icon?: string;
}

const WHATSAPP_NUMBER = CONTACT_INFO.whatsappNumber;

export default function BookingSuccessPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

    const [bookingData] = useState(() => {
        if (location.state && location.state.reservationId) {
            try {
                sessionStorage.setItem('d95_last_confirmed_booking', JSON.stringify(location.state));
            } catch (e) {
                console.warn('Could not cache booking:', e);
            }
            return location.state;
        }

        try {
            const cached = sessionStorage.getItem('d95_last_confirmed_booking');
            if (cached) return JSON.parse(cached);
        } catch (e) {
            console.warn('Could not read cached booking:', e);
        }

        return null;
    });

    useEffect(() => {
        if (!bookingData) {
            toast.info('لا يوجد حجز نشط لعرضه، يمكنك حجز جلستك الآن 🎮');
            navigate('/playstation', { replace: true });
        }
    }, [bookingData, navigate]);

    if (!bookingData) {
        return null;
    }

    const {
        reservationId,
        room,
        date,
        startTime,
        endTime,
        durationHours,
        snacks,
        netTotal,
        paymentMethod,
        name,
        phone,
        notes,
    } = bookingData;

    const paymentLabel =
        paymentMethod === 'cash'
            ? 'كاش في الصالة عند الوصول'
            : paymentMethod === 'instapay'
            ? `إنستاباي (InstaPay - ${CONTACT_INFO.instapayHandle})`
            : CONTACT_INFO.walletNumber
            ? `محفظة إلكترونية (${CONTACT_INFO.walletNumber})`
            : 'محفظة إلكترونية (فودافون كاش)';

    const handleSendWhatsApp = () => {
        let snacksListText = '';
        if (snacks && snacks.length > 0) {
            snacksListText =
                `🍿 *المشروبات والسناكس:* \n` +
                snacks.map((s: SnackAddon) => `  - ${s.name} (+${s.price} ج.م)`).join('\n') +
                `\n\n`;
        }

        let msg = `🎮 *--- طلب حجز غرفة بلايستيشن VIP (بانتظار التأكيد) ---*\n*D95 GAMING & CAFÉ*\n\n`;
        msg += `🎫 *رقم التذكرة:* ${reservationId}\n`;
        msg += `👤 *اسم اللاعب:* ${name}\n`;
        msg += `📱 *رقم الموبايل:* ${phone}\n\n`;
        msg += `🚪 *الغرفة:* ${room.name}\n`;
        msg += `📅 *اليوم:* ${date}\n`;
        msg += `⏰ *وقت الجلسة:* من ${startTime} إلى ${endTime} (${durationHours} ساعات)\n\n`;

        if (snacksListText) msg += snacksListText;
        if (notes) msg += `📝 *ملاحظات خاصة:* ${notes}\n\n`;

        msg += `💳 *طريقة الدفع:* ${paymentLabel}\n`;
        msg += `💰 *المبلغ النهائي المستحق:* ${netTotal} ج.م\n\n`;

        if (paymentMethod !== 'cash') {
            msg += `📌 *مرفق مع هذه الرسالة إيصال التحويل لتأكيد الحجز وقفل الموعد.*`;
        } else {
            msg += `📌 *سأقوم بالدفع كاش بالصالة - برجاء مراجعة الطلب وتأكيد الحجز لقفل الموعد.*`;
        }

        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator
                .share({
                    title: `تذكرة حجز D95 - ${reservationId}`,
                    text: `حجزت في صالة D95 Gaming - ${room.name} يوم ${date} من ${startTime} إلى ${endTime}`,
                    url: window.location.href,
                })
                .catch(() => {});
        } else {
            navigator.clipboard.writeText(
                `تذكرة حجز D95 (${reservationId}) - ${room.name} في ${date} (${startTime})`
            );
            toast.success('تم نسخ بيانات التذكرة!');
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#F6F5F2] dark:bg-[#0a0809] text-neutral-900 dark:text-white font-body text-sm flex flex-col selection:bg-red-600 selection:text-white relative select-none transition-colors duration-200">
            {/* Ambient Dark Glow (Dark mode only) */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden dark:block hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[380px] bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(220,38,38,0.18)_0%,transparent_75%)] blur-[60px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
            </div>

            {/* Top Navigation Bar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-white/95 dark:bg-[#0e0a0c]/95 backdrop-blur-xl pt-safe border-b border-neutral-200 dark:border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.7)] transition-colors duration-200">
                <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-2xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="الرجوع للأجهزة"
                            className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-neutral-800 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-95 cursor-pointer border border-neutral-200 dark:border-white/15 shadow-sm"
                            onClick={() => navigate('/playstation')}
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col text-right">
                            <h1 className="font-bold text-base text-neutral-900 dark:text-white leading-tight font-body">
                                تأكيد وتذكرة الحجز
                            </h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div dir="ltr" className="flex items-baseline leading-none select-none">
                                    <span className="font-brush font-black text-xs text-neutral-900 dark:text-neutral-100">D</span>
                                    <span className="font-brush font-black text-sm text-[#E5252A] -ml-0.5">95</span>
                                </div>
                                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider font-bebas">BOARDING PASS</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-white/15 transition-all cursor-pointer shadow-sm active:scale-95"
                            aria-label="تبديل المظهر"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-neutral-700" />}
                        </button>

                        <button
                            type="button"
                            onClick={handleShare}
                            className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer border border-neutral-200 dark:border-white/15 shadow-sm"
                            aria-label="مشاركة التذكرة"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative z-10 w-full pt-20 pb-20 px-3.5 sm:px-6 max-w-xl mx-auto items-center" dir="rtl">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 22 }}
                    className="w-full flex flex-col items-center mt-2 text-center"
                >
                    {/* Glowing Success Badge */}
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500/60 rounded-full flex items-center justify-center mb-2.5 shadow-[0_0_25px_rgba(16,185,129,0.2)] dark:shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                    </div>

                    <h2 className="font-bold text-xl text-neutral-900 dark:text-white mb-1 font-body">
                        تم تسجيل طلب الحجز بنجاح! 🎮
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4 text-xs px-3 leading-relaxed font-body font-medium">
                        {paymentMethod === 'cash'
                            ? 'تم إرسال طلبك بنجاح. يرجى إرسال التذكرة عبر واتساب للإدارة لتأكيد الموعد وقفله باسمك.'
                            : 'تم تجهيز تذكرتك المبدئية. اضغط على الزر الأخضر لإرسال التذكرة وإيصال التحويل عبر واتساب ليتم تأكيد الموعد فوراً.'}
                    </p>

                    {/* VIP DIGITAL BOARDING PASS TICKET (ATHLETIC CARD) */}
                    <div className="relative w-full rounded-2xl overflow-hidden bg-white dark:bg-[#140e10]/95 border border-neutral-200 dark:border-white/15 shadow-[0_15px_45px_rgba(0,0,0,0.08)] dark:shadow-[0_15px_45px_rgba(0,0,0,0.8)] mb-4 text-right transition-colors">
                        {/* Top Athletic Header */}
                        <div className="p-3.5 sm:p-4 bg-neutral-100 dark:bg-black/60 border-b border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="bg-red-600 text-white font-brush text-sm font-black px-2 py-0.5 rounded tracking-wider">
                                    D95
                                </span>
                                <div className="flex flex-col">
                                    <span className="font-bebas text-base tracking-wider text-neutral-900 dark:text-white font-bold">VIP BOARDING PASS</span>
                                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold">ESPORTS &amp; GAMING SUITES</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">{reservationId}</span>
                                <span className="text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold border border-amber-500/30">
                                    بانتظار تأكيد الإدارة ⏳
                                </span>
                            </div>
                        </div>

                        {/* Middle Ticket Details */}
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium block">اسم اللاعب</span>
                                    <span className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white font-body">{name}</span>
                                </div>
                                <div className="text-left">
                                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium block">رقم الهاتف</span>
                                    <span className="font-mono text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200" dir="ltr">
                                        {phone}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-neutral-200 dark:border-white/10 text-xs">
                                <div>
                                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium block">الغرفة المجهزة</span>
                                    <span className="font-bold text-neutral-900 dark:text-white font-body text-xs sm:text-sm">{room.name}</span>
                                </div>
                                <div className="text-left">
                                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium block">تاريخ الحجز</span>
                                    <span className="font-bold text-neutral-900 dark:text-white font-body text-xs sm:text-sm">{date}</span>
                                </div>
                            </div>

                            <div className="bg-neutral-50 dark:bg-black/50 p-3 rounded-xl border border-neutral-200 dark:border-white/10 flex items-center justify-between text-xs font-body">
                                <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-semibold">
                                    <Clock className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                    <span>وقت الجلسة:</span>
                                </div>
                                <div dir="rtl" className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
                                    <span>{startTime}</span>
                                    <span>←</span>
                                    <span>{endTime}</span>
                                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">({durationHours} س)</span>
                                </div>
                            </div>

                            {snacks && snacks.length > 0 && (
                                <div className="pt-2 border-t border-neutral-200 dark:border-white/10 text-xs font-body">
                                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium block mb-1">
                                        المشروبات والسناكس الإضافية:
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                        {snacks.map((s: SnackAddon) => (
                                            <span
                                                key={s.id}
                                                className="text-[11px] bg-neutral-100 dark:bg-[#1c1417] text-neutral-800 dark:text-white px-2 py-0.5 rounded-md border border-neutral-200 dark:border-white/10 font-semibold"
                                            >
                                                {s.icon} {s.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {notes && (
                                <div className="pt-1 text-[11px] text-neutral-500 dark:text-neutral-400 font-body">
                                    <span className="font-bold text-neutral-700 dark:text-neutral-300">ملاحظة: </span>
                                    <span className="text-neutral-800 dark:text-neutral-200 font-medium">{notes}</span>
                                </div>
                            )}
                        </div>

                        {/* Ticket Perforation / Notched Divider */}
                        <div className="relative flex items-center justify-between my-1">
                            {/* Left cutout circle */}
                            <div className="w-5 h-5 rounded-full bg-[#F6F5F2] dark:bg-[#0a0809] -mr-2.5 border-r border-neutral-200 dark:border-white/10 transition-colors" />
                            {/* Dashed line */}
                            <div className="flex-1 border-b-2 border-dashed border-neutral-200 dark:border-white/10 mx-2" />
                            {/* Right cutout circle */}
                            <div className="w-5 h-5 rounded-full bg-[#F6F5F2] dark:bg-[#0a0809] -ml-2.5 border-l border-neutral-200 dark:border-white/10 transition-colors" />
                        </div>

                        {/* Bottom Ticket Stub (Financial & QR Code) */}
                        <div className="p-4 bg-neutral-50 dark:bg-black/40 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium block">طريقة الدفع</span>
                                <span className="text-xs font-bold text-neutral-900 dark:text-white font-body">
                                    {paymentMethod === 'instapay'
                                        ? 'إنستاباي لحظي'
                                        : paymentMethod === 'cash'
                                        ? 'كاش بالصالة'
                                        : 'محفظة إلكترونية'}
                                </span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-neutral-500 dark:text-neutral-400 text-xs font-body">الإجمالي:</span>
                                    <span className="font-bebas font-black text-3xl text-red-600 dark:text-red-400 tracking-wider">{netTotal}</span>
                                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-bold">ج.م</span>
                                </div>
                            </div>

                            {/* Stylized QR Code Visual */}
                            <div className="flex flex-col items-center">
                                <div className="w-14 h-14 bg-white p-1 rounded-xl border border-neutral-200 dark:border-white/10 flex items-center justify-center shadow-md">
                                    <QrCode className="w-full h-full text-black" />
                                </div>
                                <span className="font-mono text-[8px] text-neutral-500 mt-1 uppercase tracking-wider">
                                    SCAN AT DESK
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="w-full space-y-2.5">
                        <button
                            type="button"
                            onClick={handleSendWhatsApp}
                            className="w-full py-3.5 px-4 rounded-xl font-bold font-body text-sm text-white flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-[0_4px_25px_rgba(37,211,102,0.35)] active:scale-[0.98] transition-all cursor-pointer border border-emerald-500/50"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span>إرسال التذكرة عبر واتساب لتأكيد الحجز</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2 w-full">
                            <Link
                                to="/menu"
                                className="py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-300 font-bold text-xs font-body transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                            >
                                <Coffee className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                                <span>تصفح منيو الكافيه</span>
                            </Link>

                            <Link
                                to="/playstation"
                                className="py-2.5 px-3 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-600/20 dark:hover:bg-red-600/30 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300 font-bold text-xs font-body transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                            >
                                <Gamepad2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                <span>صالة الأجهزة</span>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
