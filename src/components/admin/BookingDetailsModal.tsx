import React, { useState } from 'react';
import {
    X,
    Calendar,
    Clock,
    Phone,
    User,
    Gamepad2,
    CheckCircle2,
    AlertCircle,
    MessageCircle,
    Copy,
    Check,
    Banknote,
    Coffee,
    ExternalLink,
    Timer,
    ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { getBookingDates } from '@/services/bookingService';
import type { DBBooking } from '@/types/database';

interface BookingDetailsModalProps {
    booking: DBBooking | null;
    onClose: () => void;
    onStatusChange?: (id: string, newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed') => Promise<void>;
    onSwitchToBookingsTab?: (booking: DBBooking) => void;
}

export default function BookingDetailsModal({
    booking,
    onClose,
    onStatusChange,
    onSwitchToBookingsTab,
}: BookingDetailsModalProps) {
    const [copied, setCopied] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    if (!booking) return null;

    const { start: bStart, end: bEnd } = getBookingDates(booking);
    const nowMs = Date.now();
    const isEnded = bEnd.getTime() <= nowMs;
    const isStarted = bStart.getTime() <= nowMs;
    const isOngoing = isStarted && !isEnded;

    const copyReservationId = () => {
        navigator.clipboard.writeText(booking.reservation_id);
        setCopied(true);
        toast.success('تم نسخ كود الحجز بنجاح');
        setTimeout(() => setCopied(false), 2000);
    };

    const openWhatsApp = () => {
        let phone = booking.customer_phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
            phone = '2' + phone;
        } else if (!phone.startsWith('20')) {
            phone = '20' + phone;
        }
        const text = `أهلاً بحضرتك يا أستاذ ${booking.customer_name} 👋\nمعاك إدارة D95 Gaming Lounge 🎮\n\nبخصوص حجزك رقم (${booking.reservation_id}):\n📍 الغرفة: ${booking.room_name}\n📅 التاريخ: ${booking.booking_date}\n⏰ التوقيت: ${booking.start_time} - ${booking.end_time} (${booking.duration_hours} س)\n💰 الإجمالي: ${booking.total_amount} ج.م (${booking.payment_method === 'instapay' ? 'إنستاباي' : booking.payment_method === 'cash' ? 'كاش بالفرع' : 'محفظة'})\n\nتم تأكيد الحجز وجاهزين لاستقبالك! في انتظارك تنورنا.`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleAction = async (newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
        if (!onStatusChange) return;
        setActionLoading(true);
        try {
            await onStatusChange(booking.id, newStatus);
        } catch {
            // Handled in parent
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-xl rounded-t-3xl sm:rounded-3xl bg-[#140e11] border-t sm:border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
            >
                {/* Mobile drag handle indicator */}
                <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-[#1c1215]">
                    <div className="w-12 h-1 bg-white/25 rounded-full" />
                </div>

                {/* Header */}
                <div className="bg-gradient-to-r from-red-950/60 via-[#1c1215] to-[#140e11] px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shadow-inner shrink-0">
                            <Gamepad2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-white">تفاصيل الحجز الكاملة</h2>
                                {isOngoing && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                        <span>جاري اللعب الآن</span>
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-neutral-400 font-mono">
                                    #{booking.reservation_id}
                                </span>
                                <button
                                    type="button"
                                    onClick={copyReservationId}
                                    className="text-neutral-500 hover:text-white transition-colors p-0.5"
                                    title="نسخ كود الحجز"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        title="إغلاق"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
                    {/* Status Banner */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1c1417] border border-white/10">
                        <span className="text-neutral-400 font-medium">حالة الحجز الحالية:</span>
                        <div>
                            {booking.status === 'pending' && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1.5">
                                    <span>⏳ بانتظار موافقة الأدمن</span>
                                </span>
                            )}
                            {booking.status === 'confirmed' && (
                                isOngoing ? (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                        <span>🎮 مؤكد - الجلسة جارية بالفرع</span>
                                    </span>
                                ) : isEnded ? (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-800 text-neutral-400 border border-white/10 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-neutral-500" />
                                        <span>⌛ مؤكد - انتهى وقت الجلسة</span>
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                                        <span>🔒 مؤكد وقادم</span>
                                    </span>
                                )
                            )}
                            {booking.status === 'completed' && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                                    <span>✅ جلسة مكتملة</span>
                                </span>
                            )}
                            {booking.status === 'cancelled' && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                                    <span>❌ حجز ملغي</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Customer Profile Card */}
                    <div className="bg-[#1a1215] border border-white/10 rounded-2xl p-4 space-y-3">
                        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                            بيانات العميل والتواصل
                        </span>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600/30 to-purple-600/30 border border-red-500/30 flex items-center justify-center text-white font-bold text-lg font-bebas">
                                    {booking.customer_name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-base font-bold text-white flex items-center gap-1.5">
                                        <User className="w-4 h-4 text-red-400" />
                                        <span>{booking.customer_name}</span>
                                    </div>
                                    <div className="text-xs text-neutral-300 font-mono mt-0.5 flex items-center gap-1.5" dir="ltr">
                                        <Phone className="w-3.5 h-3.5 text-neutral-500" />
                                        <span>{booking.customer_phone}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Action Buttons */}
                            <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                                <button
                                    type="button"
                                    onClick={openWhatsApp}
                                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-900/30"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>محادثة واتساب</span>
                                </button>
                                <a
                                    href={`tel:${booking.customer_phone}`}
                                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                    title="اتصال هاتفي"
                                >
                                    <Phone className="w-4 h-4 text-neutral-300" />
                                    <span>اتصال</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Timing & Room Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Time & Duration */}
                        <div className="bg-[#1a1215] border border-white/10 rounded-2xl p-4 space-y-2">
                            <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-red-400" />
                                <span>التاريخ والتوقيت</span>
                            </span>
                            <div className="text-sm font-bold text-white">
                                {booking.booking_date}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-red-400 font-semibold">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{booking.start_time} - {booking.end_time}</span>
                            </div>
                            <div className="text-[11px] text-neutral-400 flex items-center gap-1 pt-1 border-t border-white/5 font-mono">
                                <Timer className="w-3 h-3 text-neutral-500" />
                                <span>المدة: {booking.duration_hours} ساعة ({booking.duration_hours * 60} دقيقة)</span>
                            </div>
                        </div>

                        {/* Room Info */}
                        <div className="bg-[#1a1215] border border-white/10 rounded-2xl p-4 space-y-2">
                            <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1.5">
                                <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                                <span>الغرفة المحجوزة</span>
                            </span>
                            <div className="text-sm font-bold text-white">
                                {booking.room_name}
                            </div>
                            <div className="text-[11px] text-neutral-400">
                                صالة بلايستيشن D95 الرئيسية
                            </div>
                            <div className="text-[11px] text-neutral-500 pt-1 border-t border-white/5 font-mono">
                                كود المعرف: {booking.room_id || 'room-default'}
                            </div>
                        </div>
                    </div>

                    {/* Financial & Payment Breakdown */}
                    <div className="bg-[#1a1215] border border-white/10 rounded-2xl p-4 space-y-3">
                        <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1.5">
                            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                            <span>تفاصيل الدفع والحساب</span>
                        </span>

                        <div className="space-y-2 divide-y divide-white/5 text-xs">
                            <div className="flex justify-between items-center py-1">
                                <span className="text-neutral-400">طريقة الدفع المحددة:</span>
                                <span className="font-bold text-white px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                                    {booking.payment_method === 'instapay'
                                        ? 'إنستاباي (InstaPay) 📱'
                                        : booking.payment_method === 'cash'
                                        ? 'كاش بالفرع 💵'
                                        : 'محفظة إلكترونية 💳'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-1 text-neutral-400">
                                <span>سعر مدة الحجز ({booking.duration_hours} س):</span>
                                <span className="font-mono text-neutral-200">{booking.subtotal || booking.total_amount} ج.م</span>
                            </div>

                            {Number(booking.snacks_total) > 0 && (
                                <div className="flex justify-between items-center py-1 text-neutral-400">
                                    <span>المسليات والطلبات:</span>
                                    <span className="font-mono text-neutral-200">{booking.snacks_total} ج.م</span>
                                </div>
                            )}

                            {Number(booking.discount_amount) > 0 && (
                                <div className="flex justify-between items-center py-1 text-emerald-400">
                                    <span>الخصم المطبق:</span>
                                    <span className="font-mono">-{booking.discount_amount} ج.م</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2 text-sm font-bold">
                                <span className="text-white">المبلغ الإجمالي المطلوب:</span>
                                <span className="text-emerald-400 font-bebas text-2xl tracking-wider">
                                    {booking.total_amount} ج.م
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Snacks / Extras List if present */}
                    {booking.snacks && booking.snacks.length > 0 && (
                        <div className="bg-[#1a1215] border border-white/10 rounded-2xl p-4 space-y-2.5">
                            <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1.5">
                                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                                <span>المسليات والمشروبات المطلوبة مع الحجز ({booking.snacks.length})</span>
                            </span>
                            <div className="space-y-1.5">
                                {booking.snacks.map((snack, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-[#140e11] p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-300 flex items-center justify-center font-bold text-[10px]">
                                                {snack.quantity || 1}x
                                            </span>
                                            <span className="text-white font-medium">{snack.name}</span>
                                        </div>
                                        <span className="font-mono text-neutral-300">
                                            {snack.price * (snack.quantity || 1)} ج.م
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes Section if exists */}
                    {booking.notes && (
                        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 space-y-1.5">
                            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>ملاحظات ورغبات العميل:</span>
                            </span>
                            <p className="text-xs text-amber-200/90 leading-relaxed whitespace-pre-wrap">
                                {booking.notes}
                            </p>
                        </div>
                    )}

                    {/* Creation Timestamp */}
                    <div className="text-center text-[11px] text-neutral-500 font-mono">
                        تم إنشاء هذا الحجز في: {new Date(booking.created_at).toLocaleString('ar-EG')}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-[#1c1417] px-4 sm:px-5 py-3 sm:py-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                        {booking.status === 'pending' && !isEnded && (
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleAction('confirmed')}
                                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-900/30"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>تأكيد الحجز فوراً</span>
                            </button>
                        )}

                        {booking.status === 'confirmed' && isEnded && (
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleAction('completed')}
                                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-blue-900/30"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>تسجيل كمكتملة ✅</span>
                            </button>
                        )}

                        {booking.status !== 'cancelled' && (
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleAction('cancelled')}
                                className="px-3 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/20 font-bold text-xs transition-colors cursor-pointer text-center"
                            >
                                إلغاء الحجز
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        {onSwitchToBookingsTab && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onSwitchToBookingsTab(booking);
                                }}
                                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>فتح بالحجوزات</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white font-bold text-xs transition-colors cursor-pointer text-center"
                        >
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
