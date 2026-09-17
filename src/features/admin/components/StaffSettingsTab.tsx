import { useState, useEffect } from 'react';
import { Users, Trash2, ShieldCheck, Plus, AlertCircle, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchStaffUsers, removeStaffUser, addStaffUser, StaffUser } from '@/services/staffService';
import { playPs5NavigateSound, playPs5SelectSound } from '@/lib/sound';
import { supabase } from '@/lib/supabase';

export default function StaffSettingsTab() {
    const [staffList, setStaffList] = useState<StaffUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [newEmail, setNewEmail] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [currentAdminEmail, setCurrentAdminEmail] = useState<string>('');

    const loadStaff = async () => {
        setLoading(true);
        try {
            const data = await fetchStaffUsers();
            setStaffList(data);
        } catch {
            toast.error('تعذر جلب بيانات المديرين');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStaff();
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.email) {
                setCurrentAdminEmail(session.user.email.toLowerCase().trim());
            }
        });
    }, []);

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        const clean = newEmail.trim().toLowerCase();
        if (!clean || !clean.includes('@')) {
            toast.error('يرجى إدخال بريد إلكتروني صحيح');
            return;
        }

        if (staffList.some(u => u.email.toLowerCase() === clean)) {
            toast.info('هذا الحساب مسجل بالفعل كمدير');
            return;
        }

        setIsAdding(true);
        try {
            await addStaffUser(clean);
            playPs5SelectSound();
            toast.success(`تمت إضافة ${clean} كمدير بنجاح 🛡️`);
            setNewEmail('');
            await loadStaff();
        } catch (err: unknown) {
            console.error(err);
            toast.error('فشل إضافة المدير الجديد');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveStaff = async (email: string) => {
        const cleanTarget = email.trim().toLowerCase();

        // 1. Prevent self-lockout
        if (currentAdminEmail && cleanTarget === currentAdminEmail) {
            toast.error('لا يمكنك حذف حسابك الحالي المسجل به في لوحة التحكم');
            return;
        }

        // 2. Prevent deleting the last admin
        if (staffList.length <= 1) {
            toast.error('لا يمكن حذف المدير الأخير في النظام!');
            return;
        }

        if (!window.confirm(`هل أنت متأكد من إلغاء صلاحية المدير عن ${email}؟`)) {
            return;
        }

        try {
            await removeStaffUser(email);
            playPs5NavigateSound();
            toast.success('تمت إزالة المدير بنجاح');
            await loadStaff();
        } catch {
            toast.error('تعذر الإزالة');
        }
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="font-bold text-base sm:text-lg text-slate-900">إدارة حسابات المديرين (Admin Accounts)</h2>
                    <p className="text-sm text-slate-500 mt-0.5 font-medium">التحكم في الحسابات المصرح لها بالدخول كمدير للوحة التحكم</p>
                </div>
            </div>

            {/* Add New Admin Form */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-red-600" />
                    إضافة بريد مدير جديد
                </h3>
                <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="email"
                            required
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="مثال: partner@gmail.com أو admin@d95.com"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-red-500 font-mono"
                            dir="ltr"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isAdding || !newEmail.trim()}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-xs"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isAdding ? 'جارٍ الإضافة...' : 'اعتماد كمدير'}</span>
                    </button>
                </form>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                    أي بريد يتم اعتماده هنا سيتمكن من تسجيل الدخول وإدارة كافة إعدادات الكافيه والبلايستيشن.
                </p>
            </div>

            {/* Admins List */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        المديرون المعتمدون حالياً
                    </h3>
                    <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                        {staffList.length} مدير
                    </span>
                </div>
                
                <div className="divide-y divide-slate-100/70">
                    {loading ? (
                        <div className="p-10 flex justify-center">
                            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : staffList.length === 0 ? (
                        <div className="p-10 text-center text-slate-500 text-sm">
                            لا توجد حسابات مضافة
                        </div>
                    ) : (
                        staffList.map((user) => {
                            const isCurrent = currentAdminEmail && user.email.toLowerCase() === currentAdminEmail;
                            return (
                                <div key={user.email} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-red-50 border border-red-200/60 text-red-600 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 text-sm sm:text-base font-mono" dir="ltr">
                                                    {user.email}
                                                </span>
                                                {isCurrent && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        حسابك الحالي
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                                    مدير كامل الصلاحيات (Admin)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => handleRemoveStaff(user.email)}
                                        disabled={Boolean(isCurrent || staffList.length <= 1)}
                                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors ${
                                            isCurrent || staffList.length <= 1
                                                ? 'text-slate-300 cursor-not-allowed'
                                                : 'text-rose-500 hover:bg-rose-50 cursor-pointer'
                                        }`}
                                        title={
                                            isCurrent 
                                                ? 'لا يمكنك حذف حسابك الحالي' 
                                                : staffList.length <= 1 
                                                ? 'لا يمكن حذف المدير الوحيد' 
                                                : 'إلغاء صلاحية المدير'
                                        }
                                    >
                                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
