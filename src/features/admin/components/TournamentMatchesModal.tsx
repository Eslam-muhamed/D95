import { useState, useEffect } from 'react';
import { X, GitBranch, Shuffle, Settings2, Trash2, CheckCircle2, User, Play, Trophy } from 'lucide-react';
import { tournamentService } from '@/services/tournamentService';
import { DBTournament, DBTournamentMatch, DBTournamentParticipant } from '@/types/database';
import { toast } from 'sonner';

interface Props {
    tournament: DBTournament;
    onClose: () => void;
}

export default function TournamentMatchesModal({ tournament, onClose }: Props) {
    const [matches, setMatches] = useState<DBTournamentMatch[]>([]);
    const [participants, setParticipants] = useState<DBTournamentParticipant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [matchScores, setMatchScores] = useState<Record<string, { s1: number; s2: number }>>({});
    
    // Manual Setup State
    const [isManualSetup, setIsManualSetup] = useState(false);
    const [manualMatches, setManualMatches] = useState<{p1: string; p2: string}[]>([]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [m, p] = await Promise.all([
                tournamentService.fetchMatches(tournament.id),
                tournamentService.fetchParticipants(tournament.id)
            ]);
            setMatches(m);
            setParticipants(p);
        } catch (error: any) {
            toast.error('فشل تحميل بيانات المباريات');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [tournament.id]);

    const confirmedParticipants = participants.filter(p => p.status === 'confirmed');

    const handleRandomGenerate = async () => {
        if (confirmedParticipants.length < 2) {
            toast.error('يجب أن يكون هناك لاعبان على الأقل');
            return;
        }
        if (confirmedParticipants.length % 2 !== 0) {
            toast.error('يجب أن يكون عدد المشتركين زوجياً (مثال: 2, 4, 8, 16...) لتوليد القرعة');
            return;
        }
        
        if (!confirm('سيتم حذف أي مباريات حالية وتوليد قرعة عشوائية جديدة. هل أنت متأكد؟')) return;
        setIsGenerating(true);
        try {
            await tournamentService.generateRandomMatches(tournament.id);
            toast.success('تم إنشاء القرعة بنجاح');
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'فشل توليد القرعة');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleClearMatches = async () => {
        if (!confirm('سيتم حذف جميع المباريات. هل أنت متأكد؟')) return;
        setIsGenerating(true);
        try {
            await tournamentService.clearMatches(tournament.id);
            toast.success('تم تصفير المباريات');
            loadData();
        } catch (error: any) {
            toast.error('حدث خطأ');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleStartManualSetup = () => {
        if (confirmedParticipants.length % 2 !== 0) {
            toast.error('يجب أن يكون عدد المشتركين المؤكدين زوجياً');
            return;
        }
        setIsManualSetup(true);
        const pairsCount = confirmedParticipants.length / 2;
        setManualMatches(Array.from({ length: pairsCount }).map(() => ({ p1: '', p2: '' })));
    };

    const handleSaveManualMatches = async () => {
        // Validate all slots are filled and unique
        const selectedIds = new Set();
        let isValid = true;
        
        for (const m of manualMatches) {
            if (!m.p1 || !m.p2) isValid = false;
            if (selectedIds.has(m.p1) || selectedIds.has(m.p2)) isValid = false;
            selectedIds.add(m.p1);
            selectedIds.add(m.p2);
        }

        if (!isValid) {
            toast.error('يجب اختيار لاعبين مختلفين لكل مباراة ولا يمكن تكرار اللاعب');
            return;
        }

        setIsGenerating(true);
        try {
            await tournamentService.clearMatches(tournament.id);
            
            const matchesToInsert = manualMatches.map((m, idx) => ({
                tournament_id: tournament.id,
                round: 1,
                match_number: idx + 1,
                player1_id: m.p1,
                player2_id: m.p2,
                status: 'pending'
            }));
            
            const { supabase } = await import('@/lib/supabase');
            await supabase.from('tournament_matches').insert(matchesToInsert);
            
            toast.success('تم حفظ المباريات بنجاح');
            setIsManualSetup(false);
            loadData();
        } catch (error: any) {
            toast.error('حدث خطأ أثناء الحفظ');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAdvanceWinner = async (matchId: string, winnerId: string, currentRound: number, currentMatchNumber: number) => {
        if (!confirm('تأكيد صعود اللاعب للبطولة أو فوزه؟ (لا يمكن التراجع عن هذا الإجراء)')) return;
        
        const scores = matchScores[matchId] || { s1: 0, s2: 0 };
        
        try {
            await tournamentService.advanceWinner(matchId, winnerId, tournament.id, currentRound, currentMatchNumber, scores.s1, scores.s2);
            toast.success('تم تسجيل النتيجة وتصعيد اللاعب بنجاح');
            loadData();
        } catch (error: any) {
            toast.error('فشل في تسجيل النتيجة');
        }
    };

    const handleScoreChange = (matchId: string, player: 's1' | 's2', value: string) => {
        const numValue = value ? parseInt(value, 10) : 0;
        setMatchScores(prev => ({
            ...prev,
            [matchId]: {
                ...prev[matchId],
                [player]: numValue
            }
        }));
    };

    const getPlayerName = (id: string | null) => {
        if (!id) return 'بانتظار المتأهل';
        return participants.find(p => p.id === id)?.player_name || 'غير معروف';
    };

    // Group matches by round
    const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <GitBranch className="w-5 h-5 text-amber-500" />
                            شجرة البطولة: {tournament.name}
                        </h2>
                        <p className="text-sm text-slate-500 font-bold mt-1">المشتركين المؤكدين: {confirmedParticipants.length}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <GitBranch className="w-10 h-10 text-amber-400" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">توليد مباريات البطولة</h3>
                            <p className="text-slate-500 mb-8 max-w-md leading-relaxed">
                                اختر الطريقة التي تفضلها لترتيب المباريات بين المشتركين المؤكدين. (العدد الحالي: {confirmedParticipants.length})
                            </p>
                            
                            {!isManualSetup ? (
                                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                                    <button
                                        onClick={handleRandomGenerate}
                                        disabled={isGenerating || confirmedParticipants.length < 2}
                                        className="flex-1 p-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex flex-col items-center gap-2 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                                    >
                                        <Shuffle className="w-6 h-6" />
                                        <span>توزيع عشوائي (القرعة)</span>
                                    </button>
                                    <button
                                        onClick={handleStartManualSetup}
                                        disabled={confirmedParticipants.length < 2}
                                        className="flex-1 p-4 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-bold flex flex-col items-center gap-2 hover:border-blue-500 hover:text-blue-600 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        <Settings2 className="w-6 h-6" />
                                        <span>ترتيب يدوي (أنت تختار)</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 text-right animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="font-bold text-lg">ترتيب المباريات (الدور الأول)</h4>
                                        <button onClick={() => setIsManualSetup(false)} className="text-sm text-slate-500 underline cursor-pointer">إلغاء</button>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {manualMatches.map((m, idx) => (
                                            <div key={idx} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <select 
                                                    value={m.p1}
                                                    onChange={e => {
                                                        const newM = [...manualMatches];
                                                        newM[idx].p1 = e.target.value;
                                                        setManualMatches(newM);
                                                    }}
                                                    className="flex-1 p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                                >
                                                    <option value="">-- اللاعب الأول --</option>
                                                    {confirmedParticipants.map(p => (
                                                        <option key={p.id} value={p.id}>{p.player_name}</option>
                                                    ))}
                                                </select>
                                                <span className="font-bold text-slate-400 text-sm shrink-0">ضد</span>
                                                <select 
                                                    value={m.p2}
                                                    onChange={e => {
                                                        const newM = [...manualMatches];
                                                        newM[idx].p2 = e.target.value;
                                                        setManualMatches(newM);
                                                    }}
                                                    className="flex-1 p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                                >
                                                    <option value="">-- اللاعب الثاني --</option>
                                                    {confirmedParticipants.map(p => (
                                                        <option key={p.id} value={p.id}>{p.player_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <button
                                        onClick={handleSaveManualMatches}
                                        disabled={isGenerating}
                                        className="w-full mt-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                                    >
                                        حفظ المباريات والبدء
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-8 h-full">
                            <div className="flex justify-end shrink-0">
                                <button
                                    onClick={handleClearMatches}
                                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-lg font-bold text-sm hover:bg-rose-100 transition-colors cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>إعادة ضبط البطولة (مسح)</span>
                                </button>
                            </div>
                            
                            <div className="flex-1 flex flex-col md:flex-row gap-8 md:gap-16 overflow-x-auto pb-4 px-4 md:px-8 custom-scrollbar">
                                {rounds.map((round, rIdx) => {
                                    const roundMatches = matches.filter(m => m.round === round);
                                    
                                    return (
                                        <div key={round} className="flex-1 min-w-[280px] flex flex-col gap-6 justify-around">
                                            <h3 className="font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2 text-center shrink-0">
                                                الجولة {round}
                                            </h3>
                                            
                                            <div className="flex flex-col justify-around flex-1 gap-4">
                                                {Array.from({ length: Math.ceil(roundMatches.length / 2) }).map((_, pairIdx) => {
                                                    const pair = roundMatches.slice(pairIdx * 2, pairIdx * 2 + 2);
                                                    
                                                    return (
                                                    <div key={pairIdx} className="relative flex flex-col justify-around flex-1 gap-4 py-2">
                                                        
                                                        {/* Connector to next round (Left line in RTL) */}
                                                        {rIdx < rounds.length - 1 && (
                                                            <div className="absolute -left-12 top-1/2 w-12 border-t-2 border-slate-200 hidden md:block z-0" />
                                                        )}
                                                        
                                                        {/* Vertical Connector for the pair */}
                                                        {pair.length === 2 && rIdx < rounds.length - 1 && (
                                                            <div className="absolute -left-6 top-1/4 bottom-1/4 w-6 border-l-2 border-y-2 border-slate-200 rounded-l-xl hidden md:block z-0" />
                                                        )}

                                                        {pair.map(match => {
                                                            const scores = matchScores[match.id] || { s1: match.score1 || 0, s2: match.score2 || 0 };
                                                            
                                                            return (
                                                            <div key={match.id} className="relative z-10 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[90px]">
                                                                {match.status === 'completed' && (
                                                                    <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500" />
                                                                )}
                                                                
                                                                {/* Player 1 */}
                                                                <div className={`p-3 border-b border-slate-100 flex items-center justify-between transition-colors flex-1 ${match.winner_id === match.player1_id ? 'bg-emerald-50' : ''}`}>
                                                                    <div className="flex items-center gap-2 flex-1">
                                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${match.player1_id ? 'bg-slate-100' : 'bg-slate-50 border border-dashed border-slate-200'}`}>
                                                                            <User className="w-3 h-3 text-slate-500" />
                                                                        </div>
                                                                        <span className={`font-bold text-sm line-clamp-1 ${!match.player1_id ? 'text-slate-400 italic' : 'text-slate-700'}`}>
                                                                            {getPlayerName(match.player1_id)}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center gap-3">
                                                                        {match.player1_id && match.player2_id && match.status !== 'completed' && (
                                                                            <input 
                                                                                type="number"
                                                                                min="0"
                                                                                className="w-12 h-7 text-center font-bold text-sm border border-slate-200 rounded bg-slate-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                                                                value={scores.s1}
                                                                                onChange={(e) => handleScoreChange(match.id, 's1', e.target.value)}
                                                                                dir="ltr"
                                                                            />
                                                                        )}
                                                                        {match.status === 'completed' && match.player2_id && (
                                                                            <div className="w-8 text-center font-bold text-slate-700">{match.score1}</div>
                                                                        )}
                                                                        
                                                                        {match.player1_id && match.status !== 'completed' && (match.player2_id || match.winner_id) && (
                                                                            <button 
                                                                                onClick={() => handleAdvanceWinner(match.id, match.player1_id!, match.round, match.match_number)}
                                                                                className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded hover:bg-emerald-200 transition-colors cursor-pointer shrink-0"
                                                                            >
                                                                                فوز
                                                                            </button>
                                                                        )}
                                                                        {match.winner_id === match.player1_id && (
                                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Player 2 */}
                                                                <div className={`p-3 flex items-center justify-between transition-colors flex-1 ${match.winner_id === match.player2_id ? 'bg-emerald-50' : ''}`}>
                                                                    <div className="flex items-center gap-2 flex-1">
                                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${match.player2_id ? 'bg-slate-100' : 'bg-slate-50 border border-dashed border-slate-200'}`}>
                                                                            <User className="w-3 h-3 text-slate-500" />
                                                                        </div>
                                                                        <span className={`font-bold text-sm line-clamp-1 ${!match.player2_id ? 'text-slate-400 italic' : 'text-slate-700'}`}>
                                                                            {getPlayerName(match.player2_id)}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center gap-3">
                                                                        {match.player1_id && match.player2_id && match.status !== 'completed' && (
                                                                            <input 
                                                                                type="number"
                                                                                min="0"
                                                                                className="w-12 h-7 text-center font-bold text-sm border border-slate-200 rounded bg-slate-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                                                                value={scores.s2}
                                                                                onChange={(e) => handleScoreChange(match.id, 's2', e.target.value)}
                                                                                dir="ltr"
                                                                            />
                                                                        )}
                                                                        {match.status === 'completed' && match.player2_id && (
                                                                            <div className="w-8 text-center font-bold text-slate-700">{match.score2}</div>
                                                                        )}
                                                                        
                                                                        {match.player2_id && match.status !== 'completed' && match.player1_id && (
                                                                            <button 
                                                                                onClick={() => handleAdvanceWinner(match.id, match.player2_id!, match.round, match.match_number)}
                                                                                className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded hover:bg-emerald-200 transition-colors cursor-pointer shrink-0"
                                                                            >
                                                                                فوز
                                                                            </button>
                                                                        )}
                                                                        {match.winner_id === match.player2_id && (
                                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            );
                                                        })}
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
