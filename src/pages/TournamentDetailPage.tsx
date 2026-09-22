import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, Trophy, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import TournamentClientBracket from './TournamentClientBracket';

export default function TournamentDetailPage() {
    const { id } = useParams<{ id: string }>();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [searchParams] = useSearchParams();
    const [tournament, setTournament] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchTournament = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('tournaments')
                .select('*')
                .eq('id', id)
                .single();
            setTournament(data);
            setLoading(false);
        };
        fetchTournament();
    }, [id]);

    if (!id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: 'var(--bg-main)' }}>
                <span className="font-display text-6xl brand-text">404</span>
                <p className="font-body text-lg" style={{ color: 'var(--text-3)' }}>البطولة غير موجودة</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-28" style={{ background: 'var(--bg-main)' }} dir="rtl">
            {/* Header */}
            <div className="sticky top-0 z-40 backdrop-blur-xl bg-black/70 border-b border-white/5">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/tournaments"
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="font-black text-lg text-white flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                {loading ? '...' : tournament?.title || 'بطولة'}
                            </h1>
                            {tournament?.game_title && (
                                <p className="text-xs text-neutral-400 mt-0.5">{tournament.game_title}</p>
                            )}
                        </div>
                    </div>

                    {tournament?.status && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            tournament.status === 'active'
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : tournament.status === 'completed'
                                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                    : 'bg-white/10 text-neutral-400 border-white/10'
                        }`}>
                            {tournament.status === 'active' ? '🔴 جارية الآن' : tournament.status === 'completed' ? '🏆 انتهت' : 'قادمة'}
                        </span>
                    )}
                </div>
            </div>

            {/* Bracket */}
            <div className="max-w-6xl mx-auto px-4 pt-6">
                <TournamentClientBracket tournamentId={id} />
            </div>
        </div>
    );
}
