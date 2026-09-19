import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ArrowRight, User, Phone, CheckCircle2, Trophy, Loader2, 
    Wallet, Zap, Check, Copy, ExternalLink, AlertCircle, PhoneCall, GitBranch, PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { tournamentService } from '@/services/tournamentService';
import { DBTournament } from '@/types/database';
import { CONTACT_INFO } from '@/constants/contactInfo';
import { fetchPaymentSettings, PaymentSettings } from '@/services/paymentSettingsService';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';
import TournamentClientBracket from './TournamentClientBracket';

export default function TournamentRegistrationPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [tournament, setTournament] = useState<DBTournament | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'register' | 'bracket'>('register');

    const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
        walletNumber: CONTACT_INFO.walletNumber,
        instapayHandle: CONTACT_INFO.instapayHandle,
        instapayLink: '',
    });

    const [formData, setFormData] = useState({
        playerName: '',
        phone: '',
        paymentMethod: 'instapay' as 'instapay' | 'wallet'
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
            
        fetchPaymentSettings().then((res) => {
            if (res) {
                setPaymentSettings(res);
            }
        });
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectPayment = (method: 'instapay' | 'wallet') => {
        playPs5NavigateSound();
        setFormData(prev => ({ ...prev, paymentMethod: method }));
    };

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.success(`تم نسخ ${text} بنجاح!`);
        setTimeout(() => setCopiedKey(null), 2500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !tournament) return;
        
        if (formData.playerName.length < 2 || formData.phone.length < 10) {
            setError('يرجى التأكد من كتابة الاسم ورقم الهاتف بشكل صحيح');
            return;
        }

        playPs5SelectSound();
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
                <h1 className="text-3xl font-black text-neutral-900 dark:text-white mb-2">تم استلام طلبك بنجاح!</h1>
                <p className="text-neutral-600 dark:text-neutral-300 mb-8 max-w-sm leading-relaxed">
                    تم تسجيل طلب الاشتراك الخاص بك. سيقوم مسؤول الصالة بمراجعة عملية الدفع وتأكيد مقعدك في البطولة قريباً.
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

    const netTotal = tournament.entry_fee;
    const activeWalletNumber = paymentSettings.walletNumber || CONTACT_INFO.walletNumber;
    const cleanWalletNumber = activeWalletNumber.replace(/\D/g, '');
    const activeInstapayHandle = paymentSettings.instapayHandle || CONTACT_INFO.instapayHandle;
    const activeInstapayLink = paymentSettings.instapayLink;

    const ussdTransferCode = `*9*7*${cleanWalletNumber}*${netTotal}#`;
    const ussdTelUri = `tel:*9*7*${cleanWalletNumber}*${netTotal}%23`;

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

                {/* Tabs */}
                <div className="flex p-1 bg-neutral-200/50 dark:bg-[#1a1416] rounded-xl mb-6">
                    <button
                        onClick={() => { playPs5NavigateSound(); setActiveTab('register'); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeTab === 'register' 
                            ? 'bg-white dark:bg-[#251b1f] text-red-600 dark:text-red-400 shadow-sm' 
                            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                        }`}
                    >
                        <PenTool className="w-4 h-4" />
                        التسجيل
                    </button>
                    <button
                        onClick={() => { playPs5NavigateSound(); setActiveTab('bracket'); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeTab === 'bracket' 
                            ? 'bg-white dark:bg-[#251b1f] text-red-600 dark:text-red-400 shadow-sm' 
                            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                        }`}
                    >
                        <GitBranch className="w-4 h-4" />
                        شجرة البطولة
                    </button>
                </div>

                {activeTab === 'register' ? (
                    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
                        <div className="flex items-center gap-2 px-1 text-sm font-bold text-neutral-900 dark:text-white">
                            <Wallet className="w-4 h-4 text-red-600 dark:text-red-500" />
                            <span>رسوم الاشتراك: {tournament.entry_fee} جنيه</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button
                                type="button"
                                onClick={() => handleSelectPayment('instapay')}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                    formData.paymentMethod === 'instapay'
                                        ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 shadow-sm scale-[1.02]'
                                        : 'border-neutral-200 dark:border-white/5 bg-white dark:bg-[#150f11] text-neutral-500 hover:border-neutral-300 dark:hover:border-white/10'
                                }`}
                            >
                                <Zap className={`w-5 h-5 ${formData.paymentMethod === 'instapay' ? 'text-red-500' : ''}`} />
                                <span className="font-bold text-sm">إنستاباي</span>
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => handleSelectPayment('wallet')}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                    formData.paymentMethod === 'wallet'
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shadow-sm scale-[1.02]'
                                        : 'border-neutral-200 dark:border-white/5 bg-white dark:bg-[#150f11] text-neutral-500 hover:border-neutral-300 dark:hover:border-white/10'
                                }`}
                            >
                                <Wallet className={`w-5 h-5 ${formData.paymentMethod === 'wallet' ? 'text-emerald-500' : ''}`} />
                                <span className="font-bold text-sm">محفظة كاش</span>
                            </button>
                        </div>

                        {/* Payment Details Container */}
                        <div className="bg-white dark:bg-[#150f11] border border-neutral-200 dark:border-white/5 rounded-2xl p-4 shadow-sm">
                            <AnimatePresence mode="wait">
                                {formData.paymentMethod === 'instapay' ? (
                                    <motion.div
                                        key="instapay"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex flex-col gap-3"
                                    >
                                        <div className="bg-neutral-100 dark:bg-black/60 p-3 rounded-xl flex items-center justify-between border border-neutral-200 dark:border-white/10 shadow-sm">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-semibold">معرف إنستاباي المعتمد (IPA):</span>
                                                <span className="text-sm font-bold text-red-600 dark:text-red-400 font-mono tracking-wider select-all" dir="ltr">
                                                    {activeInstapayHandle}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopy(activeInstapayHandle, 'instapay');
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
                                                        <span>نسخ</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <div className="p-3 bg-red-500/10 dark:bg-red-950/40 rounded-xl border border-red-500/30 flex flex-col gap-2.5">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopy(activeInstapayHandle, 'instapay');
                                                    playPs5SelectSound();
                                                    toast.success(`تم نسخ معرف إنستاباي والمبلغ!`);
                                                    if (activeInstapayLink) {
                                                        window.open(activeInstapayLink, '_blank');
                                                    } else {
                                                        window.location.href = 'instapay://';
                                                    }
                                                }}
                                                className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer w-full"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                <span>فتح تطبيق InstaPay للتحويل</span>
                                            </button>
                                        </div>
                                        
                                        <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 leading-relaxed">
                                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                            <div>يرجى تحويل مبلغ <span className="font-bold text-red-600 font-mono">{netTotal} ج.م</span> بالضبط لتأكيد اشتراكك.</div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="wallet"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex flex-col gap-3"
                                    >
                                        <div className="bg-neutral-100 dark:bg-black/60 p-3 rounded-xl flex items-center justify-between border border-neutral-200 dark:border-white/10 shadow-sm">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-semibold">رقم المحفظة المعتمد للتحويل:</span>
                                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-wider select-all" dir="ltr">
                                                    {activeWalletNumber}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopy(activeWalletNumber, 'wallet');
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
                                                        <span>نسخ</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <div className="p-3 bg-emerald-500/10 dark:bg-emerald-950/40 rounded-xl border border-emerald-500/30 flex flex-col gap-2.5">
                                            <div className="flex flex-col text-center mb-1">
                                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                                                    كود فودافون كاش المباشر:
                                                </span>
                                                <span className="font-mono font-bold text-lg text-neutral-800 dark:text-neutral-200" dir="ltr">
                                                    {ussdTransferCode}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={ussdTelUri}
                                                    onClick={(e) => { e.stopPropagation(); playPs5SelectSound(); }}
                                                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                                                >
                                                    <PhoneCall className="w-4 h-4" />
                                                    <span>اتصال وتحويل فوري</span>
                                                </a>

                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleCopy(ussdTransferCode, 'ussd'); }}
                                                    className="flex items-center justify-center gap-1.5 bg-white dark:bg-black/60 hover:bg-neutral-50 border border-neutral-300 dark:border-white/15 text-neutral-700 dark:text-neutral-200 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer active:scale-95"
                                                >
                                                    {copiedKey === 'ussd' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 leading-relaxed">
                                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                            <div>يرجى تحويل مبلغ <span className="font-bold text-emerald-600 font-mono">{netTotal} ج.م</span> بالضبط لتأكيد اشتراكك.</div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
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
                                <span>تأكيد التسجيل والدفع</span>
                                <ArrowRight className="w-4 h-4 rotate-180" />
                            </>
                        )}
                    </button>
                </form>
                ) : (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                        <TournamentClientBracket tournamentId={tournament.id} />
                    </div>
                )}
            </div>
        </div>
    );
}
