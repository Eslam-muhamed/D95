import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowLeft, Gamepad2, Eye, EyeOff, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('admin@d95.com');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/admin';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
            });

            if (error || !data?.session) {
                console.warn('Login attempt failed:', error?.message);
                toast.error(error?.message === 'Invalid login credentials' 
                    ? 'بيانات الدخول غير صحيحة! تأكد من كلمة المرور والبريد' 
                    : error?.message || 'فشل تسجيل الدخول');
                setLoading(false);
                return;
            }

            localStorage.setItem('d95_admin_auth', 'authenticated');
            localStorage.setItem('d95_admin_auth_time', Date.now().toString());
            toast.success('تم تسجيل الدخول بنجاح! أهلاً بك في لوحة تحكم D95');
            navigate(from, { replace: true });
        } catch (err: unknown) {
            console.error('Auth exception:', err);
            toast.error('حدث خطأ أثناء الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#0a0809] text-white font-body flex items-center justify-center p-4 relative overflow-hidden select-none" dir="rtl">
            {/* Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-red-600/15 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-red-950/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md relative z-10 bg-[#140e11]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl"
            >
                {/* Brand Header */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.5)] mb-4 border border-red-400/30">
                        <Gamepad2 className="w-9 h-9" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-brush text-3xl font-bold tracking-tight">
                            <span className="text-white">D</span><span className="text-red-500">95</span>
                        </span>
                        <span className="text-xs bg-red-950 text-red-400 font-bold px-2.5 py-0.5 rounded-full border border-red-500/30">
                            ADMIN PORTAL
                        </span>
                    </div>
                    <h1 className="text-lg font-bold text-white mt-2">لوحة تحكم إدارة الصالة والكافيه</h1>
                    <p className="text-xs text-neutral-400 mt-1">الرجاء إدخال بيانات الدخول المعتمدة لمتابعة العمل</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                            البريد الإلكتروني للإدارة
                        </label>
                        <div className="relative flex items-center">
                            <Mail className="w-5 h-5 text-neutral-500 absolute right-3.5 pointer-events-none" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@d95.com"
                                required
                                className="w-full bg-[#1c1417] border border-white/10 rounded-xl pr-11 pl-4 py-3 text-white text-xs sm:text-sm font-mono placeholder:text-neutral-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-left"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                            كلمة المرور المشفرة
                        </label>
                        <div className="relative flex items-center">
                            <Lock className="w-5 h-5 text-neutral-500 absolute right-3.5 pointer-events-none" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••••"
                                required
                                autoFocus
                                className="w-full bg-[#1c1417] border border-white/10 rounded-xl pr-11 pl-11 py-3 text-white text-xs sm:text-sm font-mono placeholder:text-neutral-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-left"
                                dir="ltr"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-3.5 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                                aria-label="إظهار/إخفاء كلمة المرور"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all shadow-[0_0_25px_rgba(220,38,38,0.4)] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border border-red-500/50 disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <ShieldCheck className="w-5 h-5" />
                                <span>دخول آمن للوحة التحكم</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                        <span>العودة لصفحة الزبائن الرئيسية</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
