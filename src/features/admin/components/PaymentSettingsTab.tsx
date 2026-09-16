import { useState, useEffect } from 'react';
import {
    Wallet,
    Zap,
    Save,
    RotateCcw,
    Smartphone,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Info,
    PhoneCall,
    ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchPaymentSettings, updatePaymentSettings, PaymentSettings } from '@/services/paymentSettingsService';
import { CONTACT_INFO } from '@/constants/contactInfo';
import { playPs5SelectSound, playPs5NavigateSound } from '@/lib/sound';

export default function PaymentSettingsTab() {
    const [settings, setSettings] = useState<PaymentSettings>({
        walletNumber: CONTACT_INFO.walletNumber,
        instapayHandle: CONTACT_INFO.instapayHandle,
        instapayLink: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchPaymentSettings();
                setSettings(data);
                if (data.updatedAt) {
                    setLastSaved(new Date(data.updatedAt));
                }
            } catch {
                toast.error('تعذر جلب إعدادات الدفع الحالية');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!settings.walletNumber.trim()) {
            toast.error('يرجى إدخال رقم المحفظة الإلكترونية');
            return;
        }

        if (!settings.instapayHandle.trim()) {
            toast.error('يرجى إدخال معرف إنستاباي');
            return;
        }

        setSaving(true);
        try {
            const updated = await updatePaymentSettings(settings);
            setSettings(updated);
            setLastSaved(new Date());
            playPs5SelectSound();
            toast.success('تم حفظ إعدادات الدفع وتحديثها لجميع العملاء بنجاح ⚡');
        } catch (err) {
            console.error('Save failed:', err);
            toast.error('حدث خطأ أثناء حفظ الإعدادات، يرجى المحاولة مرة أخرى');
        } finally {
            setSaving(false);
        }
    };

    const handleResetDefaults = () => {
        playPs5NavigateSound();
        setSettings({
            walletNumber: CONTACT_INFO.walletNumber,
            instapayHandle: CONTACT_INFO.instapayHandle,
            instapayLink: '',
        });
        toast.info('تمت استعادة القيم الافتراضية، اضغط حفظ لتطبيقها.');
    };

    const cleanWallet = settings.walletNumber.replace(/\D/g, '');
    const sampleAmount = 150;
    const sampleUssd = `*9*7*${cleanWallet || '01000000095'}*${sampleAmount}#`;

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 flex items-center justify-center shrink-0">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-base sm:text-lg text-slate-900">
                            إعدادات الدفع السريع والمحافظ الإلكترونية
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            التحكم في أرقام فودافون كاش، محافظ المحمول ومعرف إنستاباي المعروضة للعملاء عند تأكيد الحجز
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                    {lastSaved && (
                        <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                            آخر تحديث: {lastSaved.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={handleResetDefaults}
                        disabled={loading || saving}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>الافتراضي</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSave()}
                        disabled={loading || saving}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        <span>{saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}</span>
                    </button>
                </div>
            </div>

            {/* Main Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* SETTINGS FORM (7 Cols) */}
                <div className="lg:col-span-7 space-y-5">
                    {/* 1. Mobile Wallet / Vodafone Cash Section */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <Smartphone className="w-5 h-5 text-emerald-600" />
                            <div>
                                <h3 className="font-bold text-sm text-slate-900">
                                    محفظة فودافون كاش والمحافظ الإلكترونية
                                </h3>
                                <p className="text-xs text-slate-500">
                                    يتم توليد كود الـ USSD المباشر للاتصال بناءً على هذا الرقم
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    رقم المحفظة المعتمد للتحويل:
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        type="tel"
                                        value={settings.walletNumber}
                                        onChange={(e) => setSettings({ ...settings, walletNumber: e.target.value })}
                                        placeholder="مثال: 01000000095"
                                        dir="ltr"
                                        className="w-full bg-slate-50 text-slate-900 font-mono font-bold text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:border-emerald-500 outline-none transition-colors"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    يقبل التحويل من كافة المحافظ الذكية (فودافون، أورنج، اتصالات، تيلدا، وي، المحافظ البنكية).
                                </p>
                            </div>

                            {/* USSD Direct Code Preview */}
                            <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                                        كود الاتصال السريع المحسوب تلقائياً (USSD):
                                    </span>
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                                        يفتح مسجل الهاتف مباشرة
                                    </span>
                                </div>
                                <div className="bg-white/80 p-2 rounded-lg border border-emerald-200 font-mono font-bold text-emerald-700 text-xs sm:text-sm text-center" dir="ltr">
                                    {sampleUssd}
                                </div>
                                <p className="text-[10px] text-emerald-700">
                                    عند ضغط العميل على "تحويل مباشر"، يُفتح مسجل الهاتف والكود مجهز بقيمة الحجز ليضغط اتصال فوراً ويدخل الرقم السري.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2. InstaPay Section */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <Zap className="w-5 h-5 text-red-600" />
                            <div>
                                <h3 className="font-bold text-sm text-slate-900">
                                    حساب ومعرف إنستاباي (InstaPay)
                                </h3>
                                <p className="text-xs text-slate-500">
                                    بيانات التحويل الفوري اللحظي لعنوان الدفع IPA
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    معرف إنستاباي (IPA / Username / Phone):
                                </label>
                                <input
                                    type="text"
                                    value={settings.instapayHandle}
                                    onChange={(e) => setSettings({ ...settings, instapayHandle: e.target.value })}
                                    placeholder="مثال: d95lounge@instapay أو رقم هاتف"
                                    dir="ltr"
                                    className="w-full bg-slate-50 text-slate-900 font-mono font-bold text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:border-red-500 outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    رابط الدفع المباشر لإنستاباي (اختياري):
                                </label>
                                <input
                                    type="url"
                                    value={settings.instapayLink || ''}
                                    onChange={(e) => setSettings({ ...settings, instapayLink: e.target.value })}
                                    placeholder="مثال: https://ipn.eg/S/d95lounge (اتركه فارغاً لفتح التطبيق تلقائياً)"
                                    dir="ltr"
                                    className="w-full bg-slate-50 text-slate-900 font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:border-red-500 outline-none transition-colors"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    إذا تم إدخال رابط دفع مخصص، سيتم توجيه العميل إليه فوراً، وإلا فسيتم فتح تطبيق إنستاباي مباشرة.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submit Action */}
                    <div className="pt-2 flex justify-end">
                        <button
                            type="button"
                            onClick={() => handleSave()}
                            disabled={loading || saving}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{saving ? 'جارٍ حفظ التغييرات...' : 'حفظ وتطبيق إعدادات الدفع فوراً'}</span>
                        </button>
                    </div>
                </div>

                {/* LIVE PREVIEW COLUMN (5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                            <ShieldCheck className="w-4 h-4" />
                            <span>معاينة حية لشاشة العميل عند الدفع</span>
                        </div>

                        {/* Customer Wallet Card Preview */}
                        <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                                    فودافون كاش والمحافظ
                                </span>
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                                    مباشر USSD
                                </span>
                            </div>

                            <div className="bg-black/50 p-2.5 rounded-lg flex items-center justify-between border border-white/5">
                                <span className="text-xs text-slate-400">رقم المحفظة:</span>
                                <span className="font-mono font-bold text-emerald-400 text-sm" dir="ltr">
                                    {settings.walletNumber || '01000000095'}
                                </span>
                            </div>

                            {/* Prompt/Notice preview */}
                            <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-200 leading-relaxed">
                                <span className="font-bold text-amber-300">⚠️ تنبيه هام: </span>
                                يرجى مراجعة رقم المحفظة المحول إليه بعناية قبل التأكيد: (<span className="font-mono font-bold text-white">{settings.walletNumber || '01000000095'}</span>) والمبلغ المطلوب.
                            </div>
                        </div>

                        {/* Customer InstaPay Card Preview */}
                        <div className="bg-slate-950/80 border border-red-500/40 rounded-xl p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 text-red-400" />
                                    إنستاباي (InstaPay)
                                </span>
                                <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-bold border border-red-500/30">
                                    تحويل فوري
                                </span>
                            </div>

                            <div className="bg-black/50 p-2.5 rounded-lg flex items-center justify-between border border-white/5">
                                <span className="text-xs text-slate-400">معرف الدفع:</span>
                                <span className="font-mono font-bold text-red-400 text-xs sm:text-sm" dir="ltr">
                                    {settings.instapayHandle || 'd95lounge@instapay'}
                                </span>
                            </div>

                            {/* Prompt/Notice preview */}
                            <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-200 leading-relaxed">
                                <span className="font-bold text-amber-300">⚠️ تنبيه هام: </span>
                                يرجى مراجعة معرف إنستاباي بدقة قبل إتمام العملية: (<span className="font-mono font-bold text-white">{settings.instapayHandle || 'd95lounge@instapay'}</span>) والمبلغ المطلوب.
                            </div>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            💡 أي تعديل تقوم بحفظه هنا ينعكس في أجزاء من الثانية على كل الأجهزة والهواتف التي تتصفح الموقع تلقائياً.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
