import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournamentStore } from '@/stores/tournamentStore';

export default function TournamentAnnouncementPopup() {
    const { activeTournaments } = useTournamentStore();
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Show if there is at least one active tournament
        // and user hasn't closed it recently
        const hasClosed = sessionStorage.getItem('tournament_popup_closed');
        if (activeTournaments.length > 0 && !hasClosed) {
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

    if (!isVisible || activeTournaments.length === 0) return null;

    const latestTournament = activeTournaments[0]; // Assuming ordered by date or just taking the first

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="relative w-full max-w-sm overflow-hidden bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-red-500/20"
                >
                    {/* Decorative Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-red-600/5 pointer-events-none" />
                    
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 left-4 p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-10"
                    >
                        <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                    </button>

                    <div className="p-6 pt-10 text-center relative z-10">
                        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 mb-4">
                            <Trophy className="w-8 h-8 text-white" />
                        </div>
                        
                        <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">
                            بطولة جديدة!
                        </h2>
                        
                        <p className="text-neutral-600 dark:text-neutral-300 mb-6 leading-relaxed">
                            تم إطلاق بطولة <span className="font-bold text-red-600 dark:text-red-400">{latestTournament.name}</span> في لعبة {latestTournament.game}.
                            انضم الآن وتحدى أبطال D95.
                        </p>

                        <button
                            onClick={handleJoin}
                            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-lg shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/40 active:scale-95 transition-all duration-200"
                        >
                            سجل الآن 🔥
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
