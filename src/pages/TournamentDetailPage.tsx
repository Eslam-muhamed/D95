import { useParams, useSearchParams } from 'react-router-dom';
import TournamentClientBracket from './TournamentClientBracket';

export default function TournamentDetailPage() {
    const { id } = useParams<{ id: string }>();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [searchParams] = useSearchParams();

    if (!id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: 'var(--bg-main)' }}>
                <span className="font-display text-6xl brand-text">404</span>
                <p className="font-body text-lg" style={{ color: 'var(--text-3)' }}>البطولة غير موجودة</p>
            </div>
        );
    }

    return <TournamentClientBracket tournamentId={id} />;
}
