import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
    ArrowRight, User, Phone, CheckCircle2, Trophy, Loader2, 
    Wallet, Zap, Copy, ExternalLink, AlertCircle, PhoneCall, GitBranch, PenTool, Gamepad2, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { tournamentService } from '@/services/tournamentService';
import { DBTournament } from '@/types/database';
import { CONTACT_INFO } from '@/constants/contactInfo';
import { fetchPaymentSettings, PaymentSettings } from '@/services/paymentSettingsService';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';
import TournamentClientBracket from './TournamentClientBracket';

const getGameBackground = (gameName: string) => {
    const name = gameName.toLowerCase();
    if (name.includes('tekken') || name.includes('kombat') || name.includes('street fighter')) {
        return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop'; 
    }
    if (name.includes('call of duty') || name.includes('cod') || name.includes('valorant')) {
        return 'https://images.unsplash.com/photo-1505705694340-019e1e335916?q=80&w=1000&auto=format&fit=crop'; 
    }
    // Default to Football/FC/FIFA
    return '/images/tournaments/fifa_hero.jpg'; 
};

export default function TournamentRegistrationPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    
    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get('tab') as 'register' | 'bracket' || 'register';
    
    const [tournament, setTournament] = useState<DBTournament | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'register' | 'bracket'>(initialTab);

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
                
                if (data.status === 'active' || data.status === 'completed') {
                    setActiveTab('bracket');
                }
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
            <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-red-500" />
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="min-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mb-4">
                    <AlertCircle className="w-8 h-8 text-neutral-500" />
                </div>
                <p className="text-neutral-400 mb-6 font-bold text-lg">{error || 'البطولة غير موجودة'}</p>
                <button 
                    onClick={() => navigate('/tournaments')} 
                    className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition-all border border-white/10"
                >
                    العودة للبطولات
                </button>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-900/10" />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20 border-4 border-emerald-400/20">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-4 drop-shadow-lg">تم تسجيلك بنجاح!</h1>
                    <p className="text-neutral-400 mb-10 max-w-sm leading-relaxed text-lg">
                        استعد للمواجهة.. سيقوم مسؤول الصالة بمراجعة الدفع وتأكيد مقعدك في البطولة.
                    </p>
                    <button
                        onClick={() => navigate('/tournaments')}
                        className="px-8 py-4 bg-white text-black font-black text-lg rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                        العودة لساحة البطولات
                    </button>
                </div>
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
        <div className="min-h-[100dvh] bg-[#050505] text-white pb-24 md:pb-6 font-body">
            {/* Transparent Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>
                <div className="flex-1 text-center pr-6">
                    <h1 className="font-bebas text-xl uppercase tracking-widest font-bold text-white/90 drop-shadow-md">
                        {tournament?.status === 'active' || tournament?.status === 'completed' ? 'D95 LIVE MATCHES' : 'D95 REGISTRATION'}
                    </h1>
                </div>
            </div>

            {/* Dynamic Hero Banner */}
            <div className="relative w-full h-[280px] md:h-[350px]">
                <div className="absolute inset-0 bg-black/60 z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent z-10" />
                <img 
                    src={getGameBackground(tournament.game)} 
                    alt={tournament.game}
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-600/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center mb-4 shadow-xl">
                        <Trophy className="w-8 h-8 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-2 drop-shadow-xl">{tournament.name}</h2>
                    <div className="flex items-center justify-center gap-3 text-red-400 font-bold uppercase tracking-wider text-sm md:text-base">
                        <Gamepad2 className="w-5 h-5" />
                        <span>{tournament.game}</span>
                    </div>
                </div>
            </div>

            <div className={`mx-auto px-4 relative z-30 transition-all duration-300 ${(activeTab === 'register' && tournament?.status === 'upcoming') ? 'max-w-xl' : 'max-w-[1400px]'}`}>
                
                {/* Tabs - Only show if tournament is upcoming */}
                {tournament?.status === 'upcoming' && (
                    <div className="flex p-1 bg-white/5 backdrop-blur-md rounded-2xl mb-8 border border-white/10 shadow-lg">
                        <button
                            onClick={() => { playPs5NavigateSound(); setActiveTab('register'); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                                activeTab === 'register' 
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg' 
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <PenTool className="w-4 h-4" />
                            التسجيل
                        </button>
                        <button
                            onClick={() => { playPs5NavigateSound(); setActiveTab('bracket'); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                                activeTab === 'bracket' 
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg' 
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <GitBranch className="w-4 h-4" />
                            شجرة البطولة
                        </button>
                    </div>
                )}

                {activeTab === 'register' && tournament?.status === 'upcoming' ? (
                    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    
                    {/* Tournament Info Summary */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <Calendar className="w-5 h-5 text-neutral-300" />
                            </div>
                            <div>
                                <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-0.5">موعد البطولة</p>
                                <p className="font-bold text-sm text-white">
                                    {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('ar-EG') : 'يحدد لاحقاً'}
                                </p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-500/10 to-amber-600/5 backdrop-blur-md rounded-2xl p-4 border border-yellow-500/20 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center shrink-0">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-yellow-500/70 uppercase font-bold tracking-wider mb-0.5">الجائزة</p>
                                <p className="font-bold text-sm text-yellow-400">{tournament.prize || 'يحدد لاحقاً'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-neutral-300 mb-2">اسم اللاعب / الفريق</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-neutral-400 group-focus-within:text-red-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    name="playerName"
                                    value={formData.playerName}
                                    onChange={handleChange}
                                    className="block w-full pl-4 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-bold backdrop-blur-sm"
                                    placeholder="اكتب اسمك الثلاثي أو اسم فريقك"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-neutral-300 mb-2">رقم الهاتف (الواتساب)</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-neutral-400 group-focus-within:text-red-500 transition-colors" />
                                </div>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    dir="ltr"
                                    className="block w-full pl-4 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-bold text-left backdrop-blur-sm"
                                    placeholder="01xxxxxxxxx"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-sm font-bold text-neutral-300">اختر طريقة الدفع</span>
                            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30">
                                {tournament.entry_fee} ج.م
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button
                                type="button"
                                onClick={() => handleSelectPayment('instapay')}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all backdrop-blur-sm ${
                                    formData.paymentMethod === 'instapay'
                                        ? 'border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                        : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/20 hover:text-white'
                                }`}
                            >
                                <Zap className={`w-6 h-6 ${formData.paymentMethod === 'instapay' ? 'text-red-500' : ''}`} />
                                <span className="font-bold text-sm">إنستاباي</span>
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => handleSelectPayment('wallet')}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all backdrop-blur-sm ${
                                    formData.paymentMethod === 'wallet'
                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                        : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/20 hover:text-white'
                                }`}
                            >
                                <Wallet className={`w-6 h-6 ${formData.paymentMethod === 'wallet' ? 'text-emerald-500' : ''}`} />
                                <span className="font-bold text-sm">محفظة كاش</span>
                            </button>
                        </div>

                        {/* Payment Details Container */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-xl">
                            <AnimatePresence mode="wait">
                                {formData.paymentMethod === 'instapay' ? (
                                    <motion.div
                                        key="instapay"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex flex-col gap-4"
                                    >
                                        <div className="bg-black/40 p-4 rounded-2xl flex items-center justify-between border border-white/10">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[11px] text-neutral-400 font-bold mb-1 uppercase tracking-wider">معرف إنستاباي (IPA)</span>
                                                <span className="text-base font-black text-red-400 font-mono tracking-wider select-all" dir="ltr">
                                                    {activeInstapayHandle}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopy(activeInstapayHandle, 'instapay');
                                                }}
                                                className="shrink-0 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 border border-white/10"
                                            >
                                                {copiedKey === 'instapay' ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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
                                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-4 rounded-2xl text-base font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                            <span>فتح تطبيق InstaPay للتحويل</span>
                                        </button>
                                        
                                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2 leading-relaxed">
                                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                            <div>يرجى تحويل مبلغ <span className="font-bold text-red-400 font-mono">{netTotal} ج.م</span> بالضبط لتأكيد اشتراكك.</div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="wallet"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex flex-col gap-4"
                                    >
                                        <div className="bg-black/40 p-4 rounded-2xl flex items-center justify-between border border-white/10">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[11px] text-neutral-400 font-bold mb-1 uppercase tracking-wider">رقم المحفظة للتحويل</span>
                                                <span className="text-base font-black text-emerald-400 font-mono tracking-wider select-all" dir="ltr">
                                                    {activeWalletNumber}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopy(activeWalletNumber, 'wallet');
                                                }}
                                                className="shrink-0 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 border border-white/10"
                                            >
                                                {copiedKey === 'wallet' ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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

                                        <div className="bg-emerald-500/10 rounded-2xl border border-emerald-500/20 p-4 flex flex-col gap-4">
                                            <div className="flex flex-col text-center">
                                                <span className="text-[11px] font-bold text-emerald-400/80 mb-1 uppercase tracking-wider">
                                                    كود التحويل المباشر لـ فودافون كاش
                                                </span>
                                                <span className="font-mono font-black text-xl text-white tracking-widest" dir="ltr">
                                                    {ussdTransferCode}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <a
                                                    href={ussdTelUri}
                                                    onClick={(e) => { e.stopPropagation(); playPs5SelectSound(); }}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
                                                >
                                                    <PhoneCall className="w-5 h-5" />
                                                    <span>اتصال وتحويل</span>
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleCopy(ussdTransferCode, 'ussd'); }}
                                                    className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl transition-all cursor-pointer active:scale-95"
                                                >
                                                    {copiedKey === 'ussd' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2 leading-relaxed">
                                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                            <div>يرجى تحويل مبلغ <span className="font-bold text-emerald-400 font-mono">{netTotal} ج.م</span> بالضبط لتأكيد اشتراكك.</div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-bold text-center flex items-center justify-center gap-2">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-4 mt-8 bg-white text-black font-black text-lg rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] disabled:opacity-70 disabled:active:scale-100"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <span>تأكيد وانضمام للبطولة</span>
                                <ArrowRight className="w-5 h-5 rotate-180" />
                            </>
                        )}
                    </button>
                </form>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl p-4 md:p-8 min-h-[500px]">
                        <TournamentClientBracket tournamentId={tournament.id} />
                    </div>
                )}
            </div>
        </div>
    );
}
