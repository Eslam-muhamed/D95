import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, User, Phone, CheckCircle2, Trophy, Loader2, Wallet, Banknote } from 'lucide-react';
import { tournamentService } from '@/services/tournamentService';
import { DBTournament } from '@/types/database';

export default function TournamentRegistrationPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [tournament, setTournament] = useState<DBTournament | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        playerName: '',
        phone: '',
        paymentMethod: 'cash' as 'cash' | 'instapay'
    });

    useEffect(() => {
        if (!id) return;
        
        tournamentService.getTournamentById(id)
            .then(data => {
                if (!data) throw new Error('Tournament not found');
                setTournament(data);
            })
            .catch(err => {
                console.error(err);
                setError('حدث خطأ أثناء تحميل بيانات البطولة');
            })
            .finally(() => setIsLoading(false));
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectPayment = (method: 'cash' | 'instapay') => {
        setFormData(prev => ({ ...prev, paymentMethod: method }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !tournament) return;
        
        if (formData.playerName.length < 2 || formData.phone.length < 10) {
            setError('يرجى التأكد من كتابة الاسم ورقم الهاتف بشكل صحيح');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await tournamentService.registerParticipant({
                tournament_id: id,
                player_name: formData.playerName,
                phone: formData.phone,
                payment_method: formData.paymentMethod
            });
            
            setIsSuccess(true);
        } catch (err: any) {
            console.error('Error registering:', err);
            setError(err.message || 'حدث خطأ أثناء التسجيل، يرجى المحاولة مرة أخرى.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[100dvh] bg-[#F6F5F2] dark:bg-[#0d0c0c] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="min-h-[100dvh] bg-[#F6F5F2] dark:bg-[#0d0c0c] flex flex-col items-center justify-center p-4">
                <p className="text-neutral-500 mb-4">{error || 'البطولة غير موجودة'}</p>
                <button onClick={() => navigate('/tournaments')} className="text-red-500 font-bold underline">العودة للبطولات</button>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-[100dvh] bg-[#F6F5F2] dark:bg-[#0d0c0c] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-3xl font-black text-neutral-900 dark:text-white mb-2">تم التسجيل بنجاح!</h1>
                <p className="text-neutral-600 dark:text-neutral-300 mb-8 max-w-sm">
                    {formData.paymentMethod === 'cash' 
                        ? 'يرجى التوجه لمسؤول الصالة لتسديد رسوم الاشتراك وتأكيد مقعدك في البطولة.'
                        : 'تم استلام طلبك. إذا كنت قد حولت على إنستاباي، سيقوم مسؤول الصالة بتأكيد الاشتراك قريباً.'}
                </p>
                <button
                    onClick={() => navigate('/tournaments')}
                    className="px-8 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold rounded-xl active:scale-95 transition-transform"
                >
                    العودة لصفحة البطولات
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-[#F6F5F2] dark:bg-[#0d0c0c] text-neutral-900 dark:text-white pb-24 md:pb-6 font-body">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#120a0d]/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 px-4 py-4 flex items-center shadow-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <ArrowRight className="w-6 h-6" />
                </button>
                <div className="flex-1 text-center pr-6">
                    <h1 className="font-bebas text-xl uppercase tracking-wider font-bold">تسجيل في البطولة</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-6">
                {/* Tournament Info Card */}
                <div className="bg-white dark:bg-[#150f11] rounded-2xl p-4 sm:p-5 border border-neutral-200 dark:border-white/5 shadow-sm mb-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                        <Trophy className="w-7 h-7 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black leading-tight mb-1">{tournament.name}</h2>
                        <div className="text-xs text-neutral-500 font-bold">لعبة: {tournament.game}</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">اسم اللاعب (أو الفريق)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-neutral-400" />
                                </div>
                                <input
                                    type="text"
                                    name="playerName"
                                    value={formData.playerName}
                                    onChange={handleChange}
                                    className="block w-full pl-4 pr-11 py-3.5 bg-white dark:bg-black border border-neutral-200 dark:border-white/10 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-bold"
                                    placeholder="اكتب اسمك الثلاثي أو اسم فريقك"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">رقم الهاتف (أو الواتساب)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-neutral-400" />
                                </div>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    dir="ltr"
                                    className="block w-full pl-4 pr-11 py-3.5 bg-white dark:bg-black border border-neutral-200 dark:border-white/10 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-bold text-left"
                                    placeholder="01xxxxxxxxx"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">رسوم الاشتراك: {tournament.entry_fee} جنيه</label>
                        <p className="text-xs text-neutral-500 mb-2">اختر طريقة دفع الرسوم:</p>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => handleSelectPayment('cash')}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                    formData.paymentMethod === 'cash'
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 shadow-sm'
                                        : 'border-neutral-200 dark:border-white/5 bg-white dark:bg-[#150f11] text-neutral-500 hover:border-neutral-300 dark:hover:border-white/10'
                                }`}
                            >
                                <Banknote className={`w-6 h-6 ${formData.paymentMethod === 'cash' ? 'text-emerald-500' : ''}`} />
                                <span className="font-bold text-sm">دفع كاش</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSelectPayment('instapay')}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                    formData.paymentMethod === 'instapay'
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 shadow-sm'
                                        : 'border-neutral-200 dark:border-white/5 bg-white dark:bg-[#150f11] text-neutral-500 hover:border-neutral-300 dark:hover:border-white/10'
                                }`}
                            >
                                <Wallet className={`w-6 h-6 ${formData.paymentMethod === 'instapay' ? 'text-purple-500' : ''}`} />
                                <span className="font-bold text-sm">إنستاباي</span>
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-sm font-bold text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl active:scale-95 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:active:scale-100"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>تأكيد التسجيل</span>
                                <ArrowRight className="w-4 h-4 rotate-180" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
