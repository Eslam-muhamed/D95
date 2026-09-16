import { useState, useEffect } from 'react';
import { Users, Trash2, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { fetchStaffUsers, removeStaffUser, StaffUser } from '@/services/staffService';
import { playPs5NavigateSound } from '@/lib/sound';

export default function StaffSettingsTab() {
    const [staffList, setStaffList] = useState<StaffUser[]>([]);
    const [loading, setLoading] = useState(true);

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

            <div className="w-full">
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
    );
}
