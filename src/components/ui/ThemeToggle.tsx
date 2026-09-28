import { useTheme } from '@/stores/themeStore';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className="relative flex items-center justify-center p-0 m-0 bg-transparent border-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            aria-label="تبديل المظهر"
            title={isDark ? 'تفعيل الوضع المضيء' : 'تفعيل الوضع الليلي'}
        >
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 200 100" 
                className="w-16 h-8 sm:w-20 sm:h-10"
            >
                <defs>
                    <filter id="moon-glow-toggle" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                {/* Background Pill */}
                <rect 
                    x="10" y="10" width="180" height="80" rx="40" 
                    className={`transition-colors duration-500 ease-in-out ${isDark ? 'fill-slate-800' : 'fill-slate-200'}`} 
                />

                {/* Sliding Group */}
                <g 
                    className="transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]" 
                    style={{ transform: isDark ? 'translateX(100px)' : 'translateX(0px)' }}
                >
                    {/* Thumb */}
                    <circle 
                        cx="50" cy="50" r="34" 
                        className={`transition-colors duration-500 ease-in-out ${isDark ? 'fill-slate-900' : 'fill-white'}`} 
                        style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} 
                    />
                    
                    {/* Moon Glow */}
                    <circle 
                        cx="50" cy="50" r="16" 
                        className="fill-indigo-400 transition-opacity duration-500 ease-in-out" 
                        style={{ opacity: isDark ? 0.6 : 0, filter: 'url(#moon-glow-toggle)' }} 
                    />

                    {/* Sun Icon */}
                    <g 
                        className="transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]" 
                        style={{ transformOrigin: '50px 50px', opacity: isDark ? 0 : 1, transform: isDark ? 'rotate(90deg) scale(0.3)' : 'rotate(0deg) scale(1)' }}
                    >
                        <circle cx="50" cy="50" r="10" className="fill-amber-500" strokeWidth="0" />
                        <path d="M50 26 v-6 M50 74 v6 M26 50 h-6 M74 50 h6 M33 33 l-4.2 -4.2 M67 67 l4.2 4.2 M33 67 l-4.2 4.2 M67 33 l4.2 -4.2" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                    </g>

                    {/* Moon Icon */}
                    <g 
                        className="transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]" 
                        style={{ transformOrigin: '50px 50px', opacity: isDark ? 1 : 0, transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.3)' }}
                    >
                        <path d="M54 34 A 14 14 0 1 0 66 56 A 18 18 0 0 1 54 34 Z" className="fill-indigo-100" strokeWidth="0" />
                    </g>
                </g>
            </svg>
        </button>
    );
}
