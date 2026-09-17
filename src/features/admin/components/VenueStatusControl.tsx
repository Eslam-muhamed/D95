import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Store, CheckCircle2, XCircle } from 'lucide-react';
import {
    fetchVenueStatus,
    updateVenueStatus,
    subscribeVenueStatus,
    type VenueStatus,
    DEFAULT_VENUE_STATUS,
} from '@/services/venueStatusService';
import { playPs5SelectSound } from '@/lib/sound';

interface Props {
    userEmail?: string;
    variant?: 'badge' | 'card';
    className?: string;
}

export default function VenueStatusControl({ userEmail = 'admin@d95.com', variant = 'badge', className = '' }: Props) {
    const [status, setStatus] = useState<VenueStatus>(DEFAULT_VENUE_STATUS);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        // Initial fetch
        fetchVenueStatus().then(setStatus);

        // Realtime subscription
        const unsubscribe = subscribeVenueStatus((newStatus) => {
            setStatus(newStatus);
        });

        return () => unsubscribe();
    }, []);

    const handleToggle = async (nextState?: boolean) => {
        const targetState = nextState !== undefined ? nextState : !status.isOpen;
        if (targetState === status.isOpen || isUpdating) return;

        setIsUpdating(true);
        playPs5SelectSound();

        const roleLabel = 'الإدارة';

        try {
            const updated = await updateVenueStatus(targetState, roleLabel);
            setStatus(updated);
            if (targetState) {
                toast.success('تم فتح الصالة وتحديث الحالة إلى: مفتوح الآن 🟢', {
                    description: 'تظهر الآن باللون الأخضر للعملاء في الصفحة الرئيسية.',
                    duration: 4000,
                });
            } else {
                toast.error('تم إغلاق الصالة وتحديث الحالة إلى: مغلق الآن 🔴', {
                    description: 'تظهر الآن مغلقة للعملاء في الصفحة الرئيسية.',
                    duration: 4000,
                });
            }
        } catch (error) {
            console.error(error);
            toast.error('تعذر تحديث حالة الصالة، يرجى المحاولة مرة أخرى.');
        } finally {
            setIsUpdating(false);
        }
    };

    if (variant === 'card') {
        return (
            <div className={`bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs ${className}`} dir="rtl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                            status.isOpen
                                ? 'bg-emerald-100 text-emerald-700 shadow-xs'
                                : 'bg-rose-100 text-rose-700 shadow-xs'
                        }`}>
                            <Store className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-body">
                                    حالة استقبال العملاء (Live Status)
                                </h3>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                                    status.isOpen
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : 'bg-rose-50 text-rose-800 border-rose-300'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                    <span>{status.isOpen ? 'مفتوح الآن' : 'مغلق الآن'}</span>
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-body mt-0.5">
                                تحدد ما إذا كانت الصالة تظهر كـ "مفتوح الآن 🟢" أو "مغلق الآن 🔴" في الصفحة الرئيسية للعملاء.
                            </p>
                        </div>
                    </div>

                    {/* Action Segmented Controls */}
                    <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200 shrink-0">
                        <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleToggle(true)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                status.isOpen
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                        >
                            {isUpdating && status.isOpen ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>مفتوح الآن</span>
                        </button>

                        <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleToggle(false)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                !status.isOpen
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                        >
                            {isUpdating && !status.isOpen ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <XCircle className="w-3.5 h-3.5" />
                            )}
                            <span>مغلق الآن</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default 'badge' variant for Header
    return (
        <button
            type="button"
            onClick={() => handleToggle()}
            disabled={isUpdating}
            title={status.isOpen ? 'اضغط للتحويل إلى: مغلق الآن 🔴' : 'اضغط للتحويل إلى: مفتوح الآن 🟢'}
            className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs select-none active:scale-95 ${
                status.isOpen
                    ? 'bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300/90 text-emerald-800'
                    : 'bg-rose-50 hover:bg-rose-100/80 border border-rose-300/90 text-rose-800'
            } ${className}`}
        >
            {isUpdating ? (
                <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
            ) : (
                <span className={`w-2 h-2 rounded-full ${status.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            )}
            <span className="font-body text-[11px] sm:text-xs">
                {status.isOpen ? 'مفتوح الآن' : 'مغلق الآن'}
            </span>
            <span className="hidden xl:inline text-[9px] font-normal text-slate-500 border-r border-slate-300/70 pr-1.5 mr-0.5">
                {status.isOpen ? 'اضغط للإغلاق' : 'اضغط للفتح'}
            </span>
        </button>
    );
}
