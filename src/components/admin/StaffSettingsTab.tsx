import { useState, useEffect } from 'react';
import { Users, Trash2, Plus, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { fetchStaffUsers, addStaffUser, removeStaffUser, StaffUser } from '@/services/staffService';
import { playPs5SelectSound, playPs5NavigateSound } from '@/lib/sound';

export default function StaffSettingsTab() {
    const [staffList, setStaffList] = useState<StaffUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Form state
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'cashier'>('cashier');

    const loadStaff = async () => {
        setLoading(true);
        try {
            const data = await fetchStaffUsers();
            setStaffList(data);
        } catch {
            toast.error('تعذر جلب بيانات الصلاحيات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStaff();
    }, []);

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        const email = newEmail.trim().toLowerCase();
        
        if (!email) {
            toast.error('يرجى إدخال البريد الإلكتروني');
            return;
        }

        if (!email.includes('@')) {
            toast.error('البريد الإلكتروني غير صحيح');
            return;
        }

        setSubmitting(true);
        try {
            await addStaffUser(email, newRole);
            playPs5SelectSound();
            toast.success(`تم إضافة ${roleName(newRole)} بنجاح`);
            setNewEmail('');
            await loadStaff();
        } catch (err) {
            toast.error('حدث خطأ أثناء إضافة الصلاحية');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveStaff = async (email: string, role: string) => {
        if (!window.confirm(`هل أنت متأكد من إزالة صلاحية ${roleName(role as 'admin' | 'cashier')} من ${email}؟`)) {
            return;
        }

        try {
            await removeStaffUser(email);
            playPs5NavigateSound();
            toast.success('تمت الإزالة بنجاح');
            await loadStaff();
        } catch (err) {
            toast.error('تعذر الإزالة');
        }
    };

    const roleName = (role: 'admin' | 'cashier') => {
        return role === 'admin' ? 'مدير' : 'كاشير';
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="font-bold text-base sm:text-lg text-slate-900">إدارة الصلاحيات والموظفين</h2>
                    <p className="text-sm text-slate-500 mt-0.5 font-medium">التحكم في المديرين والكاشير المسموح لهم بالدخول</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form to add new staff */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs sticky top-4">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-blue-500" />
                            إضافة موظف جديد
                        </h3>
                        
                        <form onSubmit={handleAddStaff} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">البريد الإلكتروني (Google / Email)</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="example@d95.com"
                                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-left focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                                    dir="ltr"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">الدور الوظيفي</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewRole('cashier')}
                                        className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border-2 transition-all ${
                                            newRole === 'cashier' 
                                                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                                : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        <User className="w-5 h-5" />
                                        <span className="text-xs font-bold">كاشير</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewRole('admin')}
                                        className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border-2 transition-all ${
                                            newRole === 'admin' 
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                                : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        <ShieldCheck className="w-5 h-5" />
                                        <span className="text-xs font-bold">مدير</span>
                                    </button>
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {submitting ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        إضافة للحسابات المعتمدة
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* List of current staff */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                الحسابات المعتمدة حالياً
                            </h3>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-lg">
                                {staffList.length} حساب
                            </span>
                        </div>
                        
                        <div className="divide-y divide-slate-100/50">
                            {loading ? (
                                <div className="p-10 flex justify-center">
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : staffList.length === 0 ? (
                                <div className="p-10 text-center text-slate-500 text-sm">
                                    لا توجد حسابات مضافة
                                </div>
                            ) : (
                                staffList.map((user) => (
                                    <div key={user.email} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 ${
                                                user.role === 'admin' 
                                                    ? 'bg-emerald-100 text-emerald-600' 
                                                    : 'bg-blue-100 text-blue-600'
                                            }`}>
                                                {user.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-sm sm:text-base font-mono" dir="ltr">{user.email}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                        user.role === 'admin' 
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    }`}>
                                                        {roleName(user.role)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => handleRemoveStaff(user.email, user.role)}
                                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                                            title="حذف الصلاحية"
                                        >
                                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    );
}
