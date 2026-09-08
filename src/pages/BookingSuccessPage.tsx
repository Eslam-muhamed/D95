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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const WHATSAPP_NUMBER = '201000000000';

export default function BookingSuccessPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const bookingData = location.state || {
        reservationId: 'D95-PS-8821',
        room: { name: 'غرفة 01 (Play Room)', type: 'standard' },
        date: new Date().toISOString().split('T')[0],
        startTime: '06:00 م',
        endTime: '08:00 م',
        durationHours: 2,
        roomSubtotal: 200,
        snacks: [],
        snacksTotal: 0,
        discountAmount: 0,
        netTotal: 200,
        paymentMethod: 'instapay',
        name: 'ضيف D95',
        phone: '01012345678',
        notes: '',
    };

    const {
        reservationId,
        room,
        date,
        startTime,
        endTime,
        durationHours,
        snacks,
        discountAmount,
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
            ? 'إنستاباي (InstaPay - d95cairo@instapay)'
            : 'محفظة إلكترونية (01099238475)';

    const handleSendWhatsApp = () => {
        let snacksListText = '';
        if (snacks && snacks.length > 0) {
            snacksListText =
                `🍿 *المشروبات والسناكس:* \n` +
                snacks.map((s: any) => `  - ${s.name} (+${s.price} ج.م)`).join('\n') +
                `\n\n`;
        }

        let msg = `🎮 *--- تذكرة حجز غرفة بلايستيشن VIP ---*\n*D95 GAMING & CAFÉ*\n\n`;
        msg += `🎫 *رقم التذكرة:* ${reservationId}\n`;
        msg += `👤 *اسم اللاعب:* ${name}\n`;
        msg += `📱 *رقم الموبايل:* ${phone}\n\n`;
        msg += `🚪 *الغرفة:* ${room.name}\n`;
        msg += `📅 *اليوم:* ${date}\n`;
        msg += `⏰ *وقت الجلسة:* من ${startTime} إلى ${endTime} (${durationHours} ساعات)\n\n`;

        if (snacksListText) msg += snacksListText;
        if (notes) msg += `📝 *ملاحظات خاصة:* ${notes}\n\n`;

        msg += `💳 *طريقة الدفع:* ${paymentLabel}\n`;
        if (discountAmount > 0) msg += `🎁 *خصم الكوبون:* ${discountAmount} ج.م\n`;
        msg += `💰 *المبلغ النهائي المستحق:* ${netTotal} ج.م\n\n`;

        if (paymentMethod !== 'cash') {
            msg += `📌 *مرفق مع هذه الرسالة إيصال التحويل لتأكيد الحجز فوراً.*`;
        } else {
            msg += `📌 *سأقوم بالدفع كاش بالصالة عند الحضور قبل الموعد بـ ١٠ دقائق.*`;
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
        <div className="min-h-screen w-full bg-[#F4F1EA] text-neutral-900 font-body text-sm flex flex-col selection:bg-red-600 selection:text-white relative select-none">
            {/* Ambient Warm Concrete Texture & Glow */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[350px] bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(255,255,255,0.85)_0%,rgba(220,38,38,0.06)_50%,transparent_80%)] blur-[40px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />
            </div>

            {/* Top Navigation Bar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl pt-safe border-b border-neutral-200/80 shadow-[0_2px_15px_rgba(0,0,0,0.05)]">
                <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-2xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="الرجوع للأجهزة"
                            className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-900 hover:text-red-600 transition-all active:scale-95 cursor-pointer border border-neutral-200 shadow-sm"
                            onClick={() => navigate('/playstation')}
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col text-right">
                            <h1 className="font-bold text-base text-neutral-950 leading-tight font-body">
                                تأكيد وتذكرة الحجز
                            </h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-brush text-sm text-red-600 font-bold">D95</span>
                                <span className="text-[11px] text-neutral-500 font-semibold tracking-wider">BOARDING PASS</span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleShare}
                        className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 hover:text-red-600 transition-all active:scale-95 cursor-pointer border border-neutral-200 shadow-sm"
                        aria-label="مشاركة التذكرة"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
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
                    <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-400 rounded-full flex items-center justify-center mb-2.5 shadow-md">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 stroke-[2.5]" />
                    </div>

                    <h2 className="font-bold text-xl text-neutral-950 mb-1 font-body">
                        تم إصدار تذكرة الحجز بنجاح!
                    </h2>
                    <p className="text-neutral-600 mb-4 text-xs px-3 leading-relaxed font-body font-medium">
                        {paymentMethod === 'cash'
                            ? 'تم حجز مكانك. يرجى إرسال التذكرة عبر واتساب لتأكيد حضورك مع موظف الاستقبال.'
                            : 'تم تجهيز تذكرتك. اضغط على الزر الأخضر لإرسال بيانات الحجز وإرفاق إيصال التحويل عبر واتساب.'}
                    </p>

                    {/* VIP DIGITAL BOARDING PASS TICKET (CRISP LIGHT CARD) */}
                    <div className="relative w-full rounded-2xl overflow-hidden bg-white border-2 border-neutral-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.06)] mb-4 text-right">
                        {/* Top Athletic Header */}
                        <div className="p-3.5 sm:p-4 bg-neutral-950 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="bg-red-600 text-white font-brush text-sm font-black px-2 py-0.5 rounded tracking-wider">
                                    D95
                                </span>
                                <div className="flex flex-col">
                                    <span className="font-brush text-sm tracking-wider text-white">VIP BOARDING PASS</span>
                                    <span className="text-[10px] text-neutral-400 font-semibold">ESPORTS &amp; GAMING SUITES</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="font-mono text-xs font-bold text-red-400">{reservationId}</span>
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                                    مؤكد
                                </span>
                            </div>
                        </div>

                        {/* Middle Ticket Details */}
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[11px] text-neutral-500 font-medium block">اسم اللاعب</span>
                                    <span className="font-bold text-sm sm:text-base text-neutral-950 font-body">{name}</span>
                                </div>
                                <div className="text-left">
                                    <span className="text-[11px] text-neutral-500 font-medium block">رقم الهاتف</span>
                                    <span className="font-mono text-xs sm:text-sm font-bold text-neutral-900" dir="ltr">
                                        {phone}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-neutral-100 text-xs">
                                <div>
                                    <span className="text-[11px] text-neutral-500 font-medium block">الغرفة المجهزة</span>
                                    <span className="font-bold text-neutral-950 font-body text-xs sm:text-sm">{room.name}</span>
                                </div>
                                <div className="text-left">
                                    <span className="text-[11px] text-neutral-500 font-medium block">تاريخ الحجز</span>
                                    <span className="font-bold text-neutral-950 font-body text-xs sm:text-sm">{date}</span>
                                </div>
                            </div>

                            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 flex items-center justify-between text-xs font-body">
                                <div className="flex items-center gap-1.5 text-neutral-700 font-semibold">
                                    <Clock className="w-3.5 h-3.5 text-red-600" />
                                    <span>وقت الجلسة:</span>
                                </div>
                                <div dir="rtl" className="flex items-center gap-1.5 font-bold text-red-600">
                                    <span>{startTime}</span>
                                    <span>←</span>
                                    <span>{endTime}</span>
                                    <span className="text-neutral-500 font-medium">({durationHours} س)</span>
                                </div>
                            </div>

                            {snacks && snacks.length > 0 && (
                                <div className="pt-2 border-t border-neutral-100 text-xs font-body">
                                    <span className="text-[11px] text-neutral-500 font-medium block mb-1">
                                        المشروبات والسناكس الإضافية:
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                        {snacks.map((s: any) => (
                                            <span
                                                key={s.id}
                                                className="text-[11px] bg-red-50 text-neutral-900 px-2 py-0.5 rounded-md border border-red-200 font-semibold"
                                            >
                                                {s.icon} {s.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {notes && (
                                <div className="pt-1 text-[11px] text-neutral-500 font-body">
                                    <span className="font-bold">ملاحظة: </span>
                                    <span className="text-neutral-800 font-medium">{notes}</span>
                                </div>
                            )}
                        </div>

                        {/* Ticket Perforation / Notched Divider (Matches Concrete Background) */}
                        <div className="relative flex items-center justify-between my-1">
                            {/* Left cutout circle */}
                            <div className="w-5 h-5 rounded-full bg-[#F4F1EA] -mr-2.5 border-r border-neutral-300" />
                            {/* Dashed line */}
                            <div className="flex-1 border-b-2 border-dashed border-neutral-200 mx-2" />
                            {/* Right cutout circle */}
                            <div className="w-5 h-5 rounded-full bg-[#F4F1EA] -ml-2.5 border-l border-neutral-300" />
                        </div>

                        {/* Bottom Ticket Stub (Financial & QR Code) */}
                        <div className="p-4 bg-neutral-50 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] text-neutral-500 font-medium block">طريقة الدفع</span>
                                <span className="text-xs font-bold text-neutral-950 font-body">
                                    {paymentMethod === 'instapay'
                                        ? 'إنستاباي لحظي'
                                        : paymentMethod === 'cash'
                                        ? 'كاش بالصالة'
                                        : 'محفظة إلكترونية'}
                                </span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-neutral-500 text-xs font-body">الإجمالي:</span>
                                    <span className="font-brush font-black text-2xl text-red-600">{netTotal}</span>
                                    <span className="text-xs text-neutral-500 font-bold">ج.م</span>
                                </div>
                            </div>

                            {/* Stylized QR Code Visual */}
                            <div className="flex flex-col items-center">
                                <div className="w-14 h-14 bg-white p-1 rounded-xl border border-neutral-200 flex items-center justify-center shadow-sm">
                                    <QrCode className="w-full h-full text-neutral-900" />
                                </div>
                                <span className="font-mono text-[8px] text-neutral-400 mt-1 uppercase tracking-wider">
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
                            className="w-full py-3.5 px-4 rounded-xl font-bold font-body text-sm text-white flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all cursor-pointer border border-emerald-500"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span>إرسال التذكرة عبر واتساب لتأكيد الحجز</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2 w-full">
                            <Link
                                to="/menu"
                                className="py-2.5 px-3 rounded-xl bg-white hover:bg-neutral-50 border-2 border-neutral-200 text-neutral-800 font-bold text-xs font-body transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                            >
                                <Coffee className="w-4 h-4 text-amber-600" />
                                <span>تصفح منيو الكافيه</span>
                            </Link>

                            <Link
                                to="/playstation"
                                className="py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs font-body transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                            >
                                <Gamepad2 className="w-4 h-4 text-red-500" />
                                <span>صالة الأجهزة</span>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
