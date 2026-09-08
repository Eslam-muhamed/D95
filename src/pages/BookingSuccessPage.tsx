import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MessageCircle, Home, Calendar, Clock, Gamepad2, QrCode, Sparkles, Download, Share2, Coffee } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const WHATSAPP_NUMBER = '201000000000';

export default function BookingSuccessPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const bookingData = location.state || {
        reservationId: 'D95-PS-8821',
        room: { name: 'غرفة 01 (PlayStation 5)', type: 'standard' },
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
        notes: ''
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
        notes
    } = bookingData;

    const paymentLabel = paymentMethod === 'cash' 
        ? 'كاش في الصالة عند الوصول' 
        : paymentMethod === 'instapay' 
        ? 'إنستاباي (InstaPay - d95cairo@instapay)' 
        : 'محفظة إلكترونية (01099238475)';

    const handleSendWhatsApp = () => {
        let snacksListText = '';
        if (snacks && snacks.length > 0) {
            snacksListText = `🍿 *المشروبات والسناكس:* \n` + snacks.map((s: any) => `  - ${s.name} (+${s.price} ج.م)`).join('\n') + `\n\n`;
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
            navigator.share({
                title: `تذكرة حجز D95 - ${reservationId}`,
                text: `حجزت في صالة D95 Gaming - ${room.name} يوم ${date} من ${startTime} إلى ${endTime}`,
                url: window.location.href,
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(`تذكرة حجز D95 (${reservationId}) - ${room.name} في ${date} (${startTime})`);
            toast.success('تم نسخ بيانات التذكرة!');
        }
    };

    return (
        <div className="bg-[#090707] text-white font-body text-sm flex flex-col min-h-screen selection:bg-red-500/30">
            {/* Top Bar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-[#090707]/95 backdrop-blur-xl pt-safe border-b border-white/5">
                <div className="h-16 px-4 md:px-8 flex items-center justify-between max-w-6xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="الرجوع للأجهزة"
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:text-red-400 transition-colors active:scale-95 cursor-pointer"
                            onClick={() => navigate('/playstation')}
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col text-right">
                            <h1 className="font-display text-lg md:text-xl font-bold uppercase tracking-wider text-white">تأكيد وتذكرة الحجز</h1>
                            <span className="font-body text-[10px] md:text-xs text-neutral-400">D95 BOARDING PASS</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleShare}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
                        aria-label="مشاركة التذكرة"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col relative w-full pt-20 pb-20 px-4 max-w-xl mx-auto items-center" dir="rtl">
                <motion.div
                    initial={{ scale: 0.94, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="w-full flex flex-col items-center mt-3 text-center"
                >
                    {/* Glowing Success Badge */}
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mb-3 shadow-[0_0_35px_rgba(16,185,129,0.3)]">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>

                    <h2 className="font-bold text-xl text-white mb-1 font-body">تم إصدار تذكرة الحجز بنجاح!</h2>
                    <p className="text-neutral-400 mb-5 text-xs px-3 leading-relaxed font-body">
                        {paymentMethod === 'cash'
                            ? 'تم حجز مكانك. يرجى إرسال التذكرة عبر واتساب لتأكيد حضورك مع موظف الاستقبال.'
                            : 'تم تجهيز تذكرتك. اضغط على الزر الأخضر لإرسال بيانات الحجز وإرفاق إيصال التحويل عبر واتساب.'
                        }
                    </p>

                    {/* VIP DIGITAL BOARDING PASS TICKET */}
                    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-neutral-900 to-neutral-950 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9)] mb-5 text-right">
                        {/* Top Gold / Crimson Luxury Accent Header */}
                        <div className="p-4 bg-gradient-to-r from-red-950/80 via-neutral-900 to-amber-950/60 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="bg-red-600 text-white font-display text-sm font-black px-2 py-0.5 rounded tracking-wider">
                                    D95
                                </span>
                                <div className="flex flex-col">
                                    <span className="font-display font-black text-xs tracking-wider text-white">VIP BOARDING PASS</span>
                                    <span className="font-body text-[9px] text-neutral-400">ESPORTS & GAMING SUITES</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="font-mono text-xs font-bold text-red-300">{reservationId}</span>
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold font-body">
                                    CONFIRMED
                                </span>
                            </div>
                        </div>

                        {/* Middle Ticket Details */}
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] text-neutral-400 font-body block">اسم اللاعب</span>
                                    <span className="font-bold text-sm text-white font-body">{name}</span>
                                </div>
                                <div className="text-left">
                                    <span className="text-[10px] text-neutral-400 font-body block">رقم الهاتف</span>
                                    <span className="font-mono text-xs text-neutral-200" dir="ltr">{phone}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
                                <div>
                                    <span className="text-[10px] text-neutral-400 font-body block">الغرفة المجهزة</span>
                                    <span className="font-bold text-white font-body">{room.name}</span>
                                </div>
                                <div className="text-left">
                                    <span className="text-[10px] text-neutral-400 font-body block">تاريخ الحجز</span>
                                    <span className="font-bold text-white font-body">{date}</span>
                                </div>
                            </div>

                            <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-xs font-body">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-red-400" />
                                    <span className="text-neutral-300">وقت الجلسة:</span>
                                </div>
                                <span className="font-bold text-red-300" dir="ltr">
                                    {startTime} - {endTime} ({durationHours} س)
                                </span>
                            </div>

                            {snacks && snacks.length > 0 && (
                                <div className="pt-2 border-t border-white/5 text-xs font-body">
                                    <span className="text-[10px] text-neutral-400 block mb-1">المشروبات والسناكس الإضافية:</span>
                                    <div className="flex flex-wrap gap-1">
                                        {snacks.map((s: any) => (
                                            <span key={s.id} className="text-[10px] bg-neutral-800 text-amber-200 px-2 py-0.5 rounded-md border border-white/5">
                                                {s.icon} {s.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {notes && (
                                <div className="pt-1 text-[11px] text-neutral-400 font-body">
                                    <span>ملاحظة: </span>
                                    <span className="text-neutral-300">{notes}</span>
                                </div>
                            )}
                        </div>

                        {/* Ticket Perforation / Notched Divider */}
                        <div className="relative flex items-center justify-between my-1">
                            {/* Left cutout circle */}
                            <div className="w-5 h-5 rounded-full bg-[#090707] -mr-2.5 border-r border-white/10" />
                            {/* Dashed line */}
                            <div className="flex-1 border-b-2 border-dashed border-white/10 mx-2" />
                            {/* Right cutout circle */}
                            <div className="w-5 h-5 rounded-full bg-[#090707] -ml-2.5 border-l border-white/10" />
                        </div>

                        {/* Bottom Ticket Stub (Financial & Barcode Simulation) */}
                        <div className="p-4 bg-black/40 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] text-neutral-400 font-body block">طريقة الدفع</span>
                                <span className="text-xs font-bold text-white font-body">
                                    {paymentMethod === 'instapay' ? 'إنستاباي' : paymentMethod === 'cash' ? 'كاش بالصالة' : 'محفظة إلكترونية'}
                                </span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-neutral-400 text-xs font-body">الإجمالي:</span>
                                    <span className="font-display font-black text-lg text-red-400">{netTotal}</span>
                                    <span className="text-[10px] text-neutral-400">ج.م</span>
                                </div>
                            </div>

                            {/* Simulated Stylized QR Code Visual */}
                            <div className="flex flex-col items-center">
                                <div className="w-14 h-14 bg-white p-1 rounded-xl flex items-center justify-center shadow-md">
                                    <QrCode className="w-full h-full text-black" />
                                </div>
                                <span className="font-mono text-[8px] text-neutral-500 mt-1 uppercase tracking-wider">
                                    SCAN AT DESK
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="w-full space-y-3">
                        <button
                            type="button"
                            onClick={handleSendWhatsApp}
                            className="w-full py-4 px-4 rounded-2xl font-bold font-body text-sm md:text-base text-white flex items-center justify-center gap-2.5 shadow-[0_4px_25px_rgba(37,211,102,0.4)] active:scale-[0.98] transition-all cursor-pointer"
                            style={{
                                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span>إرسال التذكرة عبر واتساب لتأكيد الحجز</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2 w-full">
                            <Link
                                to="/menu"
                                className="py-3 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-neutral-300 font-bold text-xs font-body transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Coffee className="w-4 h-4 text-amber-400" />
                                <span>تصفح منيو الكافيه</span>
                            </Link>

                            <Link
                                to="/playstation"
                                className="py-3 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-neutral-300 font-bold text-xs font-body transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Gamepad2 className="w-4 h-4 text-red-400" />
                                <span>صالة الأجهزة</span>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
