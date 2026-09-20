import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Calendar, Coins, Users, ArrowRight, Gamepad2, AlertCircle, Play, ChevronLeft } from 'lucide-react';
import { useTournamentStore } from '@/stores/tournamentStore';
import { DBTournament } from '@/types/database';

const getGameBackground = (gameName: string) => {
    const name = gameName.toLowerCase();
    if (name.includes('tekken') || name.includes('kombat') || name.includes('street fighter')) {
        return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop'; 
    }
    if (name.includes('call of duty') || name.includes('cod') || name.includes('valorant')) {
        return 'https://images.unsplash.com/photo-1505705694340-019e1e335916?q=80&w=1000&auto=format&fit=crop'; 
    }
    // Default to Football/FC/FIFA
    return 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1000&auto=format&fit=crop'; 
};

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
        <div className="min-h-[100dvh] bg-[#F6F5F2] dark:bg-[#050505] text-neutral-900 dark:text-white pb-24 md:pb-6 font-body">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-neutral-200 dark:border-white/5 px-4 py-4 flex items-center shadow-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <ArrowRight className="w-6 h-6" />
                </button>
                <div className="flex-1 text-center pr-6 flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5 text-red-600" />
                    <h1 className="font-bebas text-2xl uppercase tracking-wider font-bold mt-1">D95 ESPORTS</h1>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative w-full h-[250px] sm:h-[350px] overflow-hidden">
                <div className="absolute inset-0 bg-black/60 z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#F6F5F2] dark:from-[#050505] via-transparent to-transparent z-10" />
                <img 
                    src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2000&auto=format&fit=crop" 
                    alt="Esports Arena" 
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-100 text-xs font-bold mb-4 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        المنصة الرسمية لبطولات D95
                    </div>
                    <h2 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight mb-4 drop-shadow-2xl">
                        تحدى الأبطال <br/> اصنع المجد
                    </h2>
                    <p className="text-white/80 max-w-md text-sm sm:text-base font-medium">
                        شارك في أقوى البطولات، أثبت مهاراتك، واربح جوائز قيمة في بيئة لعب احترافية.
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 relative z-20 -mt-10">
                
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-500 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-3xl border border-white/20 dark:border-white/5 shadow-xl">
                        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="font-bold">جاري تحميل البطولات...</p>
                    </div>
                ) : activeTournaments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-neutral-500 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200 dark:border-white/5 shadow-2xl">
                        <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-black/50 flex items-center justify-center mb-6">
                            <Trophy className="w-10 h-10 text-neutral-400 dark:text-neutral-600" />
                        </div>
                        <p className="font-black text-2xl text-neutral-800 dark:text-neutral-300 mb-2">لا توجد بطولات حالية</p>
                        <p className="text-sm font-medium">استعد.. البطولة القادمة في الطريق!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {activeTournaments.map(tournament => (
                            <div 
                                key={tournament.id} 
                                className="group relative rounded-3xl overflow-hidden bg-black shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-red-900/20"
                            >
                                {/* Background Image */}
                                <div className="absolute inset-0">
                                    <img 
                                        src={getGameBackground(tournament.game)} 
                                        alt={tournament.game}
                                        className="w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                                </div>
                                
                                <div className="relative z-10 p-6 flex flex-col h-full justify-end">
                                    <div className="flex justify-between items-start mb-auto pb-16">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md ${
                                            tournament.status === 'active' 
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                            : tournament.status === 'completed'
                                            ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        }`}>
                                            {tournament.status === 'active' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                            {tournament.status === 'active' ? 'بطولة جارية' : tournament.status === 'completed' ? 'منتهية' : 'التسجيل متاح'}
                                        </span>
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                                            <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 text-red-400 font-black text-sm mb-2 uppercase tracking-wider">
                                            <Gamepad2 className="w-4 h-4" />
                                            <span>{tournament.game}</span>
                                        </div>
                                        <h2 className="text-3xl font-black text-white leading-tight mb-6 drop-shadow-md">
                                            {tournament.name}
                                        </h2>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="flex flex-col gap-1 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                                <div className="flex items-center gap-1.5 text-neutral-400">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-[10px] uppercase font-bold tracking-wider">التاريخ</span>
                                                </div>
                                                <span className="text-sm font-bold text-white">
                                                    {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('ar-EG') : 'يحدد لاحقاً'}
                                                </span>
                                            </div>
                                            
                                            <div className="flex flex-col gap-1 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                                <div className="flex items-center gap-1.5 text-neutral-400">
                                                    <Coins className="w-4 h-4" />
                                                    <span className="text-[10px] uppercase font-bold tracking-wider">رسوم الاشتراك</span>
                                                </div>
                                                <span className="text-sm font-bold text-white">
                                                    {tournament.entry_fee > 0 ? `${tournament.entry_fee} جنيه` : 'مجاناً'}
                                                </span>
                                            </div>
                                        </div>

                                        {tournament.prize && (
                                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-amber-600/5 border border-yellow-500/30 mb-6 backdrop-blur-md">
                                                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 border border-yellow-500/30">
                                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-yellow-500/80 uppercase tracking-wider mb-0.5">مجموع الجوائز</span>
                                                    <span className="text-base font-black text-yellow-400">{tournament.prize}</span>
                                                </div>
                                            </div>
                                        )}

                                        {tournament.status === 'active' || tournament.status === 'completed' ? (
                                            <button
                                                onClick={() => navigate(`/tournament/${tournament.id}?tab=bracket`)}
                                                className={`w-full flex items-center justify-between px-6 py-4 text-white font-bold rounded-2xl transition-all shadow-xl group/btn ${
                                                    tournament.status === 'active' 
                                                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-600/20 hover:shadow-emerald-600/40' 
                                                    : 'bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 shadow-slate-900/50'
                                                }`}
                                            >
                                                <span className="flex items-center gap-2 text-lg">
                                                    <Play className="w-5 h-5 fill-current" />
                                                    تابع البطولة
                                                </span>
                                                <ChevronLeft className="w-5 h-5 transition-transform group-hover/btn:-translate-x-1" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleRegisterClick(tournament)}
                                                className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-2xl transition-all shadow-xl shadow-red-900/30 hover:shadow-red-600/40 group/btn"
                                            >
                                                <span className="flex items-center gap-2 text-lg">
                                                    اشترك الآن
                                                    <Users className="w-5 h-5" />
                                                </span>
                                                <ChevronLeft className="w-5 h-5 transition-transform group-hover/btn:-translate-x-1" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Note */}
                <div className="flex items-start gap-3 p-5 mt-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="pt-1">
                        <h4 className="font-bold text-neutral-900 dark:text-white mb-1">تنبيه هام للمشتركين</h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                            في حالة دفع رسوم الاشتراك كاش، يرجى التوجه لمسؤول الصالة لتأكيد اشتراكك بعد التسجيل للحفاظ على مكانك في البطولة.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
