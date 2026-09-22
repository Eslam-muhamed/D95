import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, User, CheckCircle2, Loader2, Maximize, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface TournamentClientBracketProps {
    tournamentId: string;
}

export default function TournamentClientBracket({ tournamentId }: TournamentClientBracketProps) {
    const [matches, setMatches] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBracketData = async () => {
            setIsLoading(true);
            try {
                const [matchesRes, participantsRes] = await Promise.all([
                    supabase
                        .from('tournament_matches')
                        .select('*')
                        .eq('tournament_id', tournamentId)
                        .order('round', { ascending: true })
                        .order('match_number', { ascending: true }),
                    supabase
                        .from('tournament_participants')
                        .select('*')
                        .eq('tournament_id', tournamentId)
                ]);

                if (matchesRes.data) setMatches(matchesRes.data);
                if (participantsRes.data) setParticipants(participantsRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBracketData();

        // Subscription for real-time updates
        const matchesSub = supabase
            .channel('public:tournament_matches')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_matches', filter: `tournament_id=eq.${tournamentId}` }, () => {
                fetchBracketData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(matchesSub);
        };
    }, [tournamentId]);

    const getPlayerName = (id: string | null) => {
        if (!id) return 'انتظار الفائز / Bye';
        if (id === 'BYE') return 'Bye';
        const p = participants.find(p => p.id === id);
        return p ? p.player_name : 'غير معروف';
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-transparent">
                <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
                <p className="text-neutral-400 font-bold">جاري رسم شجرة البطولة...</p>
            </div>
        );
    }

    if (matches.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-transparent">
                <Trophy className="w-16 h-16 text-neutral-600 mb-4 opacity-50" />
                <p className="text-xl font-bold text-neutral-300 mb-2">الشجرة غير متاحة بعد</p>
                <p className="text-neutral-500 max-w-sm text-sm">
                    لم يتم الإعلان عن قرعة ومباريات البطولة. يرجى العودة لاحقاً أو متابعة مسؤول الصالة.
                </p>
            </div>
        );
    }

    const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);
    
    // Calculate a good initial scale based on screen size so the whole map is visible
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const defaultScale = isMobile ? 0.4 : 0.8;

    return (
        <div className="relative w-full h-[600px] md:h-[700px] rounded-3xl overflow-hidden bg-[#0a0a0a] border border-white/5" dir="ltr">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.05),transparent_50%)] pointer-events-none" />
            
            <TransformWrapper
                initialScale={defaultScale}
                minScale={0.2}
                maxScale={2}
                centerOnInit={true}
                limitToBounds={false}
                wheel={{ step: 0.1 }}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl">
                            <button onClick={() => zoomIn()} className="p-3 bg-white/5 hover:bg-white/20 rounded-xl transition-colors text-white" title="تكبير">
                                <ZoomIn className="w-5 h-5" />
                            </button>
                            <button onClick={() => zoomOut()} className="p-3 bg-white/5 hover:bg-white/20 rounded-xl transition-colors text-white" title="تصغير">
                                <ZoomOut className="w-5 h-5" />
                            </button>
                            <button onClick={() => resetTransform()} className="p-3 bg-white/5 hover:bg-white/20 rounded-xl transition-colors text-white" title="إعادة الضبط">
                                <Maximize className="w-5 h-5" />
                            </button>
                        </div>

                        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ minWidth: "100%", minHeight: "100%", padding: "4rem" }}>
                            <div className="flex gap-16 md:gap-24 min-w-max">
                                {rounds.map((round, rIdx) => {
                                    const roundMatches = matches.filter(m => m.round === round);
                                    const isFinal = roundMatches.length === 1 && matches.length > 1;
                                    
                                    return (
                                        <div key={round} className="w-[300px] flex flex-col gap-8 justify-around">
                                            <h3 className="font-black text-xl text-neutral-400 uppercase tracking-widest mb-4 flex items-center justify-center gap-2 text-center shrink-0 drop-shadow-md">
                                                {isFinal ? (
                                                    <><Trophy className="w-6 h-6 text-yellow-500" /> النهائي</>
                                                ) : (
                                                    <span className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10">الجولة {round}</span>
                                                )}
                                            </h3>
                                            
                                            <div className="flex flex-col justify-around flex-1 gap-6">
                                                {Array.from({ length: Math.ceil(roundMatches.length / 2) }).map((_, pairIdx) => {
                                                    const pair = roundMatches.slice(pairIdx * 2, pairIdx * 2 + 2);
                                                    
                                                    return (
                                                    <div key={pairIdx} className="relative flex flex-col justify-around flex-1 gap-6 py-2">
                                                        
                                                        {/* Connector to next round (Right line in LTR) */}
                                                        {rIdx < rounds.length - 1 && (
                                                            <div className="absolute -right-12 top-1/2 w-12 border-t-2 border-white/20 z-0" />
                                                        )}
                                                        
                                                        {/* Vertical Connector for the pair */}
                                                        {pair.length === 2 && rIdx < rounds.length - 1 && (
                                                            <div className="absolute -right-6 top-[25%] bottom-[25%] w-6 border-r-2 border-y-2 border-white/20 rounded-r-xl z-0" />
                                                        )}

                                                        {pair.map(match => {
                                                            const isMatchActive = match.status === 'active';
                                                            const isMatchCompleted = match.status === 'completed';
                                                            
                                                            return (
                                                            <div key={match.id} className={`relative z-10 bg-[#0d0c0c] border rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[100px] transition-all ${isMatchActive ? 'border-red-500/50 shadow-red-900/20 shadow-2xl scale-105' : 'border-white/10 hover:border-white/20'}`}>
                                                                {isMatchActive && (
                                                                    <div className="absolute top-0 right-0 w-1 h-full bg-red-500 animate-pulse" />
                                                                )}
                                                                {isMatchCompleted && (
                                                                    <div className="absolute top-0 right-0 w-1 h-full bg-yellow-500" />
                                                                )}
                                                                
                                                                {/* Player 1 */}
                                                                <div className={`p-4 border-b border-white/5 flex items-center justify-between flex-1 transition-colors ${match.winner_id === match.player1_id ? 'bg-gradient-to-l from-yellow-500/20 to-transparent' : 'bg-white/5'}`}>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${match.player1_id && match.player1_id !== 'BYE' ? 'bg-black/50 border-white/10' : 'bg-transparent border-dashed border-white/20'}`}>
                                                                            <User className={`w-4 h-4 ${match.winner_id === match.player1_id ? 'text-yellow-500' : 'text-neutral-400'}`} />
                                                                        </div>
                                                                        <span className={`font-black text-sm tracking-wide line-clamp-1 ${!match.player1_id || match.player1_id === 'BYE' ? 'text-neutral-500 italic font-medium' : match.winner_id === match.player1_id ? 'text-yellow-400' : 'text-white'}`} dir="rtl">
                                                                            {getPlayerName(match.player1_id)}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center gap-3" dir="rtl">
                                                                        {isMatchCompleted && match.player2_id && match.player2_id !== 'BYE' && (
                                                                            <span className="font-black text-lg text-white w-8 text-center bg-black/50 rounded-lg py-0.5 border border-white/10">{match.score1}</span>
                                                                        )}
                                                                        {match.winner_id === match.player1_id && (
                                                                            <CheckCircle2 className="w-5 h-5 text-yellow-500 shrink-0" />
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Player 2 */}
                                                                <div className={`p-4 flex items-center justify-between flex-1 transition-colors ${match.winner_id === match.player2_id ? 'bg-gradient-to-l from-yellow-500/20 to-transparent' : 'bg-black/40'}`}>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${match.player2_id && match.player2_id !== 'BYE' ? 'bg-black/50 border-white/10' : 'bg-transparent border-dashed border-white/20'}`}>
                                                                            <User className={`w-4 h-4 ${match.winner_id === match.player2_id ? 'text-yellow-500' : 'text-neutral-400'}`} />
                                                                        </div>
                                                                        <span className={`font-black text-sm tracking-wide line-clamp-1 ${!match.player2_id || match.player2_id === 'BYE' ? 'text-neutral-500 italic font-medium' : match.winner_id === match.player2_id ? 'text-yellow-400' : 'text-white'}`} dir="rtl">
                                                                            {getPlayerName(match.player2_id)}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center gap-3" dir="rtl">
                                                                        {isMatchCompleted && match.player2_id && match.player2_id !== 'BYE' && (
                                                                            <span className="font-black text-lg text-white w-8 text-center bg-black/50 rounded-lg py-0.5 border border-white/10">{match.score2}</span>
                                                                        )}
                                                                        {match.winner_id === match.player2_id && (
                                                                            <CheckCircle2 className="w-5 h-5 text-yellow-500 shrink-0" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                
                                                                {isMatchActive && (
                                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-red-400 animate-pulse shadow-lg">
                                                                        LIVE
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )})}
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
        </div>
    );
}
