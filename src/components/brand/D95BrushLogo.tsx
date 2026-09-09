import React from 'react';
import { useTheme } from '@/stores/themeStore';

interface D95BrushLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'mark' | 'full';
  showSubtitle?: boolean;
  showMotto?: boolean;
  className?: string;
  glow?: boolean;
}

export default function D95BrushLogo({
  size = 'md',
  variant = 'full',
  showSubtitle = true,
  showMotto = false,
  className = '',
  glow = true,
}: D95BrushLogoProps) {
  const { theme } = useTheme();

  // Responsive size mapping
  const sizeMap = {
    sm: {
      markH: 'h-7 sm:h-8',
      fullH: 'h-14 sm:h-16',
      mottoSize: 'text-[8px] tracking-[0.2em]',
      containerPy: 'py-0.5',
    },
    md: {
      markH: 'h-10 sm:h-12',
      fullH: 'h-24 sm:h-28',
      mottoSize: 'text-[9px] md:text-[10px] tracking-[0.25em]',
      containerPy: 'py-1',
    },
    lg: {
      markH: 'h-16 sm:h-20',
      fullH: 'h-36 sm:h-44',
      mottoSize: 'text-[10px] md:text-xs tracking-[0.3em]',
      containerPy: 'py-2',
    },
    xl: {
      markH: 'h-24 sm:h-32',
      fullH: 'h-52 sm:h-64',
      mottoSize: 'text-xs md:text-sm tracking-[0.35em]',
      containerPy: 'py-3',
    },
  }[size];

  const isFull = variant === 'full' && showSubtitle;
  const logoSrc = isFull
    ? theme === 'dark'
      ? '/brand/d95-logo-full-dark.png'
      : '/brand/d95-logo-full-light.png'
    : theme === 'dark'
    ? '/brand/d95-mark-dark.png'
    : '/brand/d95-mark-light.png';

  return (
    <div dir="ltr" className={`flex flex-col items-center select-none text-center ${sizeMap.containerPy} ${className}`}>
      <div className="relative inline-flex items-center justify-center">
        {/* Atmosphere glow behind the official logo */}
        {glow && (
          <div
            className="absolute inset-0 -inset-x-8 bg-red-800/20 dark:bg-red-900/35 blur-2xl rounded-full pointer-events-none -z-10"
            aria-hidden="true"
          />
        )}

        {/* Official D95 Brand Mark */}
        <img
          src={logoSrc}
          alt="D95 Gaming & Café"
          className={`${isFull ? sizeMap.fullH : sizeMap.markH} w-auto object-contain drop-shadow-sm dark:drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)] transition-all duration-300`}
          draggable={false}
        />
      </div>

      {/* Optional Motto */}
      {showMotto && (
        <div className="mt-2 flex flex-col items-center">
          <p
            className={`font-body font-bold text-neutral-600 dark:text-neutral-400 uppercase ${sizeMap.mottoSize}`}
            style={{ letterSpacing: '0.28em' }}
          >
            PLAY • COMPETE • RELAX • REPEAT
          </p>
          <span className="text-red-600 dark:text-red-500 font-black text-xs md:text-sm mt-0.5 leading-none">
            ◆
          </span>
        </div>
      )}
    </div>
  );
}
