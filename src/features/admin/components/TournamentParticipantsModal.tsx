import { useState, useEffect } from 'react';
import { X, Check, Trash2, Loader2, Phone, User, Calendar } from 'lucide-react';
import { tournamentService } from '@/services/tournamentService';
import { DBTournament, DBTournamentParticipant } from '@/types/database';
import { toast } from 'sonner';

interface TournamentParticipantsModalProps {
    tournament: DBTournament;
    onClose: () => void;
}

export default function TournamentParticipantsModal({ tournament, onClose }: TournamentParticipantsModalProps) {
    const [participants, setParticipants] = useState<DBTournamentParticipant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadParticipants = async () => {
        setIsLoading(true);
        try {
            const data = await tournamentService.fetchParticipants(tournament.id);
            setParticipants(data);
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ في جلب المشتركين');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadParticipants();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tournament.id]);

    const handleConfirm = async (id: string) => {
        try {
            await tournamentService.updateParticipantStatus(id, 'confirmed');
            toast.success('تم تأكيد اشتراك اللاعب');
            loadParticipants();
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ في التحديث');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المشترك؟')) return;
        try {
            await tournamentService.deleteParticipant(id);
            toast.success('تم حذف المشترك بنجاح');
            loadParticipants();
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ في الحذف');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
            <div className="bg-white dark:bg-[#150f11] w-full max-w-2xl rounded-2xl shadow-xl border border-neutral-200 dark:border-white/10 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-white/10">
                    <div>
                        <h2 className="text-xl font-black text-neutral-900 dark:text-white">مشتركي بطولة {tournament.name}</h2>
                        <span className="text-sm text-neutral-500">إجمالي المشتركين: {participants.length}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                        </div>
                    ) : participants.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                            <User className="w-12 h-12 mb-4 opacity-50" />
                            <p className="font-bold">لا يوجد مشتركون حتى الآن.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {participants.map(p => (
                                <div key={p.id} className="p-4 bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-white/5 rounded-xl flex items-center justify-between">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg text-neutral-900 dark:text-white">{p.player_name}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                                p.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                            }`}>
                                                {p.status === 'confirmed' ? 'مؤكد' : 'معلق'}
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                                p.payment_method === 'instapay' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800' : 'bg-neutral-200 text-neutral-700 dark:bg-white/10 dark:text-neutral-300 border border-neutral-300 dark:border-white/10'
                                            }`}>
                                                {p.payment_method === 'instapay' ? 'إنستاباي' : 'كاش'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                <span dir="ltr">{p.phone}</span>
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(p.created_at).toLocaleString('ar-EG')}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {p.status === 'pending' && (
                                            <button
                                                onClick={() => handleConfirm(p.id)}
                                                className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                                                title="تأكيد الاشتراك"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-colors"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
