import { useState, useEffect } from 'react';
import { Trophy, User, CheckCircle2, GitBranch } from 'lucide-react';
import { tournamentService } from '@/services/tournamentService';
import { DBTournamentMatch } from '@/types/database';

interface Props {
    tournamentId: string;
}

export default function TournamentClientBracket({ tournamentId }: Props) {
    const [matches, setMatches] = useState<DBTournamentMatch[]>([]);
    const [participants, setParticipants] = useState<{id: string, player_name: string}[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [m, p] = await Promise.all([
                    tournamentService.fetchMatches(tournamentId),
                    tournamentService.fetchPublicParticipants(tournamentId)
                ]);
                setMatches(m);
                setParticipants(p);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadData();
    }, [tournamentId]);

    const getPlayerName = (id: string | null) => {
        if (!id) return 'بانتظار المتأهل';
        return participants.find(p => p.id === id)?.player_name || 'غير معروف';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (matches.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-neutral-200 dark:border-white/10 rounded-3xl bg-white dark:bg-[#150f11]">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-black/40 rounded-full flex items-center justify-center mb-4">
                    <GitBranch className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-xl font-black text-neutral-800 dark:text-neutral-200 mb-2">لم تبدأ بعد</h3>
                <p className="text-neutral-500 max-w-sm text-sm">
                    لم يتم الإعلان عن قرعة ومباريات البطولة بعد. يرجى العودة لاحقاً أو متابعة مسؤول الصالة.
                </p>
            </div>
        );
    }

    const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);

    return (
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar" dir="rtl">
            <div className="flex gap-8 md:gap-16 min-w-max px-4 md:px-8 py-4">
                {rounds.map((round, rIdx) => {
                    const roundMatches = matches.filter(m => m.round === round);
                    const isFinal = roundMatches.length === 1 && matches.length > 1;
                    
                    return (
                        <div key={round} className="w-[280px] flex flex-col gap-6 justify-around">
                            <h3 className="font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2 text-center shrink-0">
                                {isFinal ? (
                                    <><Trophy className="w-4 h-4 text-amber-500" /> النهائي</>
                                ) : (
                                    `الجولة ${round}`
                                )}
                            </h3>
                            
                            <div className="flex flex-col justify-around flex-1 gap-4">
                                {Array.from({ length: Math.ceil(roundMatches.length / 2) }).map((_, pairIdx) => {
                                    const pair = roundMatches.slice(pairIdx * 2, pairIdx * 2 + 2);
                                    
                                    return (
                                    <div key={pairIdx} className="relative flex flex-col justify-around flex-1 gap-4 py-2">
                                        
                                        {/* Connector to next round (Left line in RTL) */}
                                        {rIdx < rounds.length - 1 && (
                                            <div className="absolute -left-12 top-1/2 w-12 border-t-2 border-neutral-300 dark:border-white/10 hidden md:block z-0" />
                                        )}
                                        
                                        {/* Vertical Connector for the pair */}
                                        {pair.length === 2 && rIdx < rounds.length - 1 && (
                                            <div className="absolute -left-6 top-1/4 bottom-1/4 w-6 border-l-2 border-y-2 border-neutral-300 dark:border-white/10 rounded-l-xl hidden md:block z-0" />
                                        )}

                                        {pair.map(match => (
                                            <div key={match.id} className="relative z-10 bg-white dark:bg-[#150f11] border border-neutral-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[90px]">
                                                {match.status === 'completed' && (
                                                    <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500" />
                                                )}
                                                
                                                {/* Player 1 */}
                                                <div className={`p-3 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between flex-1 ${match.winner_id === match.player1_id ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''}`}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${match.player1_id ? 'bg-neutral-100 dark:bg-white/5' : 'bg-transparent border border-dashed border-neutral-300 dark:border-neutral-700'}`}>
                                                            <User className="w-3 h-3 text-neutral-500" />
                                                        </div>
                                                        <span className={`font-bold text-sm line-clamp-1 ${!match.player1_id ? 'text-neutral-400 italic' : 'text-neutral-700 dark:text-neutral-200'}`}>
                                                            {getPlayerName(match.player1_id)}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        {match.status === 'completed' && match.player2_id && (
                                                            <span className="font-black text-sm text-neutral-600 dark:text-neutral-300 w-6 text-center">{match.score1}</span>
                                                        )}
                                                        {match.winner_id === match.player1_id && (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-1" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Player 2 */}
                                                <div className={`p-3 flex items-center justify-between flex-1 ${match.winner_id === match.player2_id ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''}`}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${match.player2_id ? 'bg-neutral-100 dark:bg-white/5' : 'bg-transparent border border-dashed border-neutral-300 dark:border-neutral-700'}`}>
                                                            <User className="w-3 h-3 text-neutral-500" />
                                                        </div>
                                                        <span className={`font-bold text-sm line-clamp-1 ${!match.player2_id ? 'text-neutral-400 italic' : 'text-neutral-700 dark:text-neutral-200'}`}>
                                                            {getPlayerName(match.player2_id)}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        {match.status === 'completed' && match.player2_id && (
                                                            <span className="font-black text-sm text-neutral-600 dark:text-neutral-300 w-6 text-center">{match.score2}</span>
                                                        )}
                                                        {match.winner_id === match.player2_id && (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-1" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
