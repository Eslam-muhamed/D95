import { useTheme } from '@/stores/themeStore';

export default function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="text-center py-10 px-4 border-t border-neutral-200 dark:border-red-900/20 bg-neutral-50/50 dark:bg-black/20">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-red-600/50" />
        <span className="text-xl">🎮</span>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-red-600/50" />
      </div>

      {/* Official D95 Brand Mark */}
      <img
        src={theme === 'dark' ? '/brand/d95-mark-dark.png' : '/brand/d95-mark-light.png'}
        alt="D95"
        className="h-10 sm:h-12 w-auto mx-auto mb-2 object-contain"
        draggable={false}
      />

      <p className="text-xs mb-4 font-mono font-bold tracking-[0.3em] uppercase text-neutral-500 dark:text-neutral-400">
        GAMING &amp; CAFÉ
      </p>
      <p className="text-xs text-neutral-600 dark:text-neutral-400 font-body">
        حيث المتعة تلتقي بالاحترافية • جميع الحقوق محفوظة © 2026
      </p>
      <p className="text-xs mt-4 text-neutral-500 dark:text-neutral-500 font-body">
        designed &amp; developed by{' '}
        <a
          href="https://wa.me/201000000000"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-opacity hover:opacity-70 font-semibold text-red-600 dark:text-red-400"
        >
          Eng. Eslam
        </a>
      </p>
    </footer>
  );
}
