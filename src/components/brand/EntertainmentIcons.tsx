export function BeinSportsIcon({ className = 'w-4 h-4' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect width="48" height="48" rx="10" fill="#582C83" />
            <circle cx="11" cy="24" r="4.5" fill="#FFCC00" />
            <path
                d="M17 15h4.8c3.2 0 5 1.7 5 3.8 0 1.4-.7 2.5-2 3.2 1.6.6 2.5 1.9 2.5 3.6 0 2.4-1.9 4.6-5.3 4.6H17V15zm3.4 6h1.7c1.2 0 2-.5 2-1.6s-.8-1.5-2-1.5h-1.7v3.1zm0 6.3h2.1c1.3 0 2.3-.6 2.3-1.8s-1-1.7-2.3-1.7h-2.1v3.5z"
                fill="#FFFFFF"
            />
            <path
                d="M27.5 15h7.2v2.9h-4v3.3h3.6v2.8h-3.6v3.4h4.3v2.9h-7.5V15z"
                fill="#FFFFFF"
            />
        </svg>
    );
}

export function NetflixIcon({ className = 'w-4 h-4' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect width="48" height="48" rx="10" fill="#000000" />
            <path
                d="M14 11h4.2v26H14z"
                fill="#B81D24"
            />
            <path
                d="M29.8 11H34v26h-4.2z"
                fill="#B81D24"
            />
            <path
                d="M14 11h4.6l11.2 26h-4.6z"
                fill="#E50914"
            />
        </svg>
    );
}

export function InstagramGradientIcon({ className = 'w-5 h-5' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="d95IgGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFDC80" />
                    <stop offset="25%" stopColor="#F77737" />
                    <stop offset="50%" stopColor="#F56040" />
                    <stop offset="75%" stopColor="#FD1D1D" />
                    <stop offset="100%" stopColor="#C13584" />
                </linearGradient>
            </defs>
            <rect width="48" height="48" rx="12" fill="url(#d95IgGrad)" />
            <rect x="11" y="11" width="26" height="26" rx="7" stroke="#FFFFFF" strokeWidth="3" fill="none" />
            <circle cx="24" cy="24" r="6.5" stroke="#FFFFFF" strokeWidth="3" fill="none" />
            <circle cx="31.5" cy="16.5" r="1.8" fill="#FFFFFF" />
        </svg>
    );
}
