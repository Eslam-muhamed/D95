import beinSportsImg from '@/assets/brand/bein-sports.png';

export function BeinSportsIcon({ className = 'w-4 h-4' }: { className?: string }) {
    return (
        <img
            src={beinSportsImg}
            alt="beIN SPORTS"
            className={`${className} object-contain inline-block shrink-0`}
            loading="eager"
            decoding="async"
        />
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
