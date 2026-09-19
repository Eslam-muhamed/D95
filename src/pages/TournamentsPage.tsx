import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Calendar, Coins, Users, ArrowRight, Gamepad2, AlertCircle } from 'lucide-react';
import { useTournamentStore } from '@/stores/tournamentStore';
import { DBTournament } from '@/types/database';

export default function TournamentsPage() {
    const { activeTournaments, fetchActiveTournaments, isLoading } = useTournamentStore();
    const navigate = useNavigate();
    
    useEffect(() => {
        fetchActiveTournaments();
    }, [fetchActiveTournaments]);

    const handleRegisterClick = (tournament: DBTournament) => {
        navigate(`/tournaments/register/${tournament.id}`);
    };

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
                    <h1 className="font-bebas text-2xl uppercase tracking-wider font-bold">بطولات D95</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p>جاري تحميل البطولات...</p>
                    </div>
                ) : activeTournaments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-500 bg-white dark:bg-[#150f11] rounded-3xl border border-neutral-200 dark:border-white/5">
                        <Trophy className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mb-4" />
                        <p className="font-bold text-lg mb-1">لا توجد بطولات حالية</p>
                        <p className="text-sm">تابعنا لمعرفة أقرب بطولة قريباً!</p>
                    </div>
                ) : (
                    activeTournaments.map(tournament => (
                        <div key={tournament.id} className="relative bg-white dark:bg-[#150f11] rounded-3xl overflow-hidden shadow-lg border border-neutral-200 dark:border-white/10 group transition-all hover:shadow-xl hover:border-red-500/30">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="p-5 sm:p-6 relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold mb-3 ${
                                            tournament.status === 'active' 
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${tournament.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                            {tournament.status === 'active' ? 'بطولة جارية' : 'التسجيل متاح'}
                                        </span>
                                        <h2 className="text-2xl font-black text-neutral-900 dark:text-white leading-tight mb-1">
                                            {tournament.name}
                                        </h2>
                                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-sm">
                                            <Gamepad2 className="w-4 h-4" />
                                            <span>{tournament.game}</span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-700/30 shadow-sm">
                                        <Trophy className="w-6 h-6 text-red-600 dark:text-red-400" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-100 dark:border-white/5">
                                        <Calendar className="w-5 h-5 text-neutral-400" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">التاريخ</span>
                                            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                                                {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('ar-EG') : 'يحدد لاحقاً'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-100 dark:border-white/5">
                                        <Coins className="w-5 h-5 text-neutral-400" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">رسوم الاشتراك</span>
                                            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                                                {tournament.entry_fee > 0 ? `${tournament.entry_fee} جنيه` : 'مجاناً'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {tournament.prize && (
                                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-transparent border border-amber-200/50 dark:border-amber-900/30 mb-6">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                                            <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div className="flex flex-col pt-0.5">
                                            <span className="text-xs font-bold text-amber-800 dark:text-amber-500 mb-0.5">جوائز البطولة</span>
                                            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 leading-snug">{tournament.prize}</span>
                                        </div>
                                    </div>
                                )}

                                {tournament.status === 'active' || tournament.status === 'completed' ? (
                                    <button
                                        onClick={() => navigate(`/tournament/${tournament.id}?tab=bracket`)}
                                        className={`w-full flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-xl active:scale-95 transition-all shadow-md hover:shadow-lg ${
                                            tournament.status === 'active' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-600 hover:bg-slate-700'
                                        }`}
                                    >
                                        <span>تابع البطولة</span>
                                        <Trophy className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleRegisterClick(tournament)}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold rounded-xl active:scale-95 transition-all shadow-md hover:shadow-lg"
                                    >
                                        <span>اشترك الآن</span>
                                        <Users className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
                
                {/* Note */}
                <div className="flex items-start gap-2 p-4 mt-8 rounded-2xl bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 text-xs leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 opacity-70" />
                    <p>في حالة دفع رسوم الاشتراك كاش، يرجى التوجه لمسؤول الصالة لتأكيد اشتراكك بعد التسجيل للحفاظ على مكانك في البطولة.</p>
                </div>
            </div>
        </div>
    );
}
