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
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-xl rounded-t-3xl sm:rounded-3xl bg-white border-t sm:border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
            >
                {/* Mobile drag handle indicator */}
                <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-slate-50">
                    <div className="w-12 h-1 bg-slate-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="bg-slate-50 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                            <Gamepad2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-slate-900">تفاصيل الحجز الكاملة</h2>
                                {isOngoing && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                        <span>جاري اللعب الآن</span>
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-slate-500 font-mono">
                                    #{booking.reservation_id}
                                </span>
                                <button
                                    type="button"
                                    onClick={copyReservationId}
                                    className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                                    title="نسخ كود الحجز"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        title="إغلاق"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-sm bg-slate-50/50">
                    {/* Status Banner */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-slate-600 font-medium">حالة الحجز الحالية:</span>
                        <div>
                            {booking.status === 'pending' && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse flex items-center gap-1.5">
                                    <span>⏳ بانتظار موافقة الأدمن</span>
                                </span>
                            )}
                            {booking.status === 'confirmed' && (
                                isOngoing ? (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                        <span>🎮 مؤكد - الجلسة جارية بالفرع</span>
                                    </span>
                                ) : isEnded ? (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                                        <span>⌛ مؤكد - انتهى وقت الجلسة</span>
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                                        <span>🔒 مؤكد وقادم</span>
                                    </span>
                                )
                            )}
                            {booking.status === 'completed' && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                    <span>✅ جلسة مكتملة</span>
                                </span>
                            )}
                            {booking.status === 'cancelled' && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>❌ حجز ملغي</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Customer Profile Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            بيانات العميل والتواصل
                        </span>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold text-lg font-bebas">
                                    {booking.customer_name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                                        <User className="w-4 h-4 text-red-500" />
                                        <span>{booking.customer_name}</span>
                                    </div>
                                    <div className="text-xs text-slate-600 font-mono mt-0.5 flex items-center gap-1.5" dir="ltr">
                                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{booking.customer_phone}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Action Buttons */}
                            <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                <button
                                    type="button"
                                    onClick={openWhatsApp}
                                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>محادثة واتساب</span>
                                </button>
                                <a
                                    href={`tel:${booking.customer_phone}`}
                                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                                    title="اتصال هاتفي"
                                >
                                    <Phone className="w-4 h-4 text-slate-500" />
                                    <span>اتصال</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Timing & Room Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Time & Duration */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-2xs">
                            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-red-500" />
                                <span>التاريخ والتوقيت</span>
                            </span>
                            <div className="text-sm font-bold text-slate-900">
                                {booking.booking_date}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-red-600 font-semibold">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{booking.start_time} - {booking.end_time}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-100 font-mono">
                                <Timer className="w-3 h-3 text-slate-400" />
                                <span>المدة: {booking.duration_hours} ساعة ({booking.duration_hours * 60} دقيقة)</span>
                            </div>
                        </div>

                        {/* Room Info */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-2xs">
                            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                <Gamepad2 className="w-3.5 h-3.5 text-purple-500" />
                                <span>الغرفة المحجوزة</span>
                            </span>
                            <div className="text-sm font-bold text-slate-900">
                                {booking.room_name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                                صالة بلايستيشن D95 الرئيسية
                            </div>
                            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 font-mono">
                                كود المعرف: {booking.room_id || 'room-default'}
                            </div>
                        </div>
                    </div>

                    {/* Financial & Payment Breakdown */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                            <span>تفاصيل الدفع والحساب</span>
                        </span>

                        <div className="space-y-2 divide-y divide-slate-100 text-xs">
                            <div className="flex justify-between items-center py-1">
                                <span className="text-slate-500">طريقة الدفع المحددة:</span>
                                <span className="font-bold text-slate-800 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                                    {booking.payment_method === 'instapay'
                                        ? 'إنستاباي (InstaPay) 📱'
                                        : booking.payment_method === 'cash'
                                        ? 'كاش بالفرع 💵'
                                        : 'محفظة إلكترونية 💳'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-1 text-slate-600">
                                <span>سعر مدة الحجز ({booking.duration_hours} س):</span>
                                <span className="font-mono text-slate-900 font-semibold">{booking.subtotal || booking.total_amount} ج.م</span>
                            </div>

                            {Number(booking.snacks_total) > 0 && (
                                <div className="flex justify-between items-center py-1 text-slate-600">
                                    <span>المسليات والطلبات:</span>
                                    <span className="font-mono text-slate-900 font-semibold">{booking.snacks_total} ج.م</span>
                                </div>
                            )}

                            {Number(booking.discount_amount) > 0 && (
                                <div className="flex justify-between items-center py-1 text-emerald-600">
                                    <span>الخصم المطبق:</span>
                                    <span className="font-mono font-semibold">-{booking.discount_amount} ج.م</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2 text-sm font-bold">
                                <span className="text-slate-900">المبلغ الإجمالي المطلوب:</span>
                                <span className="text-emerald-600 font-bebas text-2xl tracking-wider">
                                    {booking.total_amount} ج.م
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Snacks / Extras List if present */}
                    {booking.snacks && booking.snacks.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                <Coffee className="w-3.5 h-3.5 text-amber-500" />
                                <span>المسليات والمشروبات المطلوبة مع الحجز ({booking.snacks.length})</span>
                            </span>
                            <div className="space-y-1.5">
                                {booking.snacks.map((snack, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                                                {snack.quantity || 1}x
                                            </span>
                                            <span className="text-slate-800 font-medium">{snack.name}</span>
                                        </div>
                                        <span className="font-mono text-slate-700 font-semibold">
                                            {snack.price * (snack.quantity || 1)} ج.م
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes Section if exists */}
                    {booking.notes && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5">
                            <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span>ملاحظات ورغبات العميل:</span>
                            </span>
                            <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">
                                {booking.notes}
                            </p>
                        </div>
                    )}

                    {/* Creation Timestamp */}
                    <div className="text-center text-[11px] text-slate-400 font-mono">
                        تم إنشاء هذا الحجز في: {new Date(booking.created_at).toLocaleString('ar-EG')}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-white px-4 sm:px-5 py-3 sm:py-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                        {booking.status === 'pending' && !isEnded && (
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleAction('confirmed')}
                                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
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
                                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
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
                                className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs transition-colors cursor-pointer text-center"
                            >
                                إلغاء الحجز
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {onSwitchToBookingsTab && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onSwitchToBookingsTab(booking);
                                }}
                                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>فتح بالحجوزات</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer text-center border border-slate-200"
                        >
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
