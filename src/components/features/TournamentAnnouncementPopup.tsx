import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, X, Gamepad2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournamentStore } from '@/stores/tournamentStore';

const getGameBackground = (gameName: string) => {
    const name = gameName.toLowerCase();
    if (name.includes('tekken') || name.includes('kombat') || name.includes('street fighter')) {
        return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop'; 
    }
    if (name.includes('call of duty') || name.includes('cod') || name.includes('valorant')) {
        return 'https://images.unsplash.com/photo-1505705694340-019e1e335916?q=80&w=1000&auto=format&fit=crop'; 
    }
    // Default to Football/FC/FIFA
    return '/images/tournaments/fifa_card.webp'; 
};

export default function TournamentAnnouncementPopup() {
    const { activeTournaments } = useTournamentStore();
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Show if there is at least one upcoming tournament
        // and user hasn't closed it recently
        const hasClosed = sessionStorage.getItem('tournament_popup_closed');
        const hasUpcoming = activeTournaments.some(t => t.status === 'upcoming');
        
        if (hasUpcoming && !hasClosed) {
            setIsVisible(true);
        }
    }, [activeTournaments]);

    const handleClose = () => {
        setIsVisible(false);
        sessionStorage.setItem('tournament_popup_closed', 'true');
    };

    const handleJoin = () => {
        handleClose();
        navigate('/tournaments');
    };

    const upcomingTournaments = activeTournaments.filter(t => t.status === 'upcoming');
    
    if (!isVisible || upcomingTournaments.length === 0) return null;

    const latestTournament = upcomingTournaments[0];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="relative w-full max-w-sm overflow-hidden bg-black rounded-[2rem] shadow-2xl border border-red-500/30"
                >
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0">
                        <img 
                            src={getGameBackground(latestTournament.game)} 
                            alt={latestTournament.game}
                            className="w-full h-full object-cover opacity-50"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/20" />
                    </div>
                    
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 left-4 p-2 rounded-full bg-black/20 hover:bg-black/40 border border-white/10 transition-colors z-20 cursor-pointer backdrop-blur-md"
                    >
                        <X className="w-5 h-5 text-white/70" />
                    </button>

                    <div className="p-6 pt-12 text-center relative z-10 flex flex-col items-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-100 text-[10px] font-bold mb-4 backdrop-blur-sm uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            بطولة جديدة
                        </div>

                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600/40 to-transparent flex items-center justify-center mb-6 shadow-xl border border-red-500/30 backdrop-blur-sm transform -rotate-6">
                            <Trophy className="w-10 h-10 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                        </div>
                        
                        <div className="flex items-center gap-2 text-red-400 font-black text-xs mb-2 uppercase tracking-wider">
                            <Gamepad2 className="w-4 h-4" />
                            <span>{latestTournament.game}</span>
                        </div>

                        <h2 className="text-3xl font-black text-white mb-2 leading-tight drop-shadow-lg">
                            {latestTournament.name}
                        </h2>
                        
                        <p className="text-neutral-300 text-sm mb-8 leading-relaxed max-w-[250px]">
                            التسجيل مفتوح الآن! أثبت مهارتك واربح جوائز قيمة في أقوى بطولات D95.
                        </p>

                        <button
                            onClick={handleJoin}
                            className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-95 group/btn"
                        >
                            <span className="flex items-center gap-2 text-lg">
                                اشترك الآن 🔥
                            </span>
                            <ArrowRight className="w-5 h-5 rotate-180 transition-transform group-hover/btn:-translate-x-1" />
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
