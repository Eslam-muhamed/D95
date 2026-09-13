import React from 'react';

interface D95BrushLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  showMotto?: boolean;
  className?: string;
  glow?: boolean;
}

export default function D95BrushLogo({
  size = 'md',
  showSubtitle = true,
  showMotto = false,
  className = '',
  glow = true,
}: D95BrushLogoProps) {
  const sizeMap = {
    sm: {
      textSize: 'text-3xl sm:text-4xl',
      strokeWidth: 'w-20 sm:w-24',
      subSize: 'text-[9px]',
      mottoSize: 'text-[8px]',
      containerPy: 'py-1',
    },
    md: {
      textSize: 'text-5xl sm:text-6xl md:text-7xl',
      strokeWidth: 'w-32 sm:w-40',
      subSize: 'text-[11px] md:text-xs',
      mottoSize: 'text-[9px] md:text-[10px]',
      containerPy: 'py-2',
    },
    lg: {
      textSize: 'text-7xl sm:text-8xl md:text-9xl',
      strokeWidth: 'w-48 sm:w-60 md:w-72',
      subSize: 'text-xs md:text-sm',
      mottoSize: 'text-[10px] md:text-xs',
      containerPy: 'py-2.5',
    },
    xl: {
      textSize: 'text-8xl sm:text-9xl md:text-[11rem]',
      strokeWidth: 'w-64 sm:w-80 md:w-96',
      subSize: 'text-sm md:text-base',
      mottoSize: 'text-xs md:text-sm',
      containerPy: 'py-4',
    },
  }[size];

  return (
    <div dir="ltr" className={`flex flex-col items-center select-none text-center ${sizeMap.containerPy} ${className}`}>
      {/* Main D95 Mark in Bebas Neue */}
      <div dir="ltr" className="relative inline-flex flex-col items-center justify-center">
        {/* Ambient Glow behind the logo */}
        {glow && (
          <div
            className="absolute inset-0 -inset-x-8 bg-red-600/20 blur-3xl rounded-full pointer-events-none -z-10"
            aria-hidden="true"
          />
        )}

        {/* The D95 Lettermark */}
        <div className="flex items-baseline leading-none tracking-[0.06em] font-bebas font-black">
          <span className={`${sizeMap.textSize} text-neutral-900 dark:text-white drop-shadow-sm dark:drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]`}>
            D
          </span>
          <span className={`${sizeMap.textSize} text-[#E5252A] drop-shadow-[0_2px_14px_rgba(229,37,42,0.55)]`}>
            95
          </span>
        </div>

        {/* Red Brush Stroke Underline (Matching the reference photo) */}
        <div className="relative w-full flex items-center justify-center -mt-0.5 sm:-mt-1">
          <svg
            viewBox="0 0 160 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeMap.strokeWidth} h-auto text-[#E5252A] drop-shadow-[0_0_10px_rgba(229,37,42,0.7)]`}
          >
            <path
              d="M2 7.5C28 5.8 62 4.5 98 5.2C122 5.6 145 6.6 158 8C152 9.6 130 9.8 104 9.5C65 9 32 9.8 4 10.5C2 10.5 1.5 8.5 2 7.5Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* Subtitle: GAMING & CAFÉ */}
      {showSubtitle && (
        <div className="mt-2.5 flex items-center justify-center gap-2">
          <span className="w-3 md:w-5 h-[1.5px] bg-[#E5252A]/70" />
          <p
            className={`font-bebas font-black text-neutral-800 dark:text-neutral-200 uppercase ${sizeMap.subSize} tracking-[0.35em] drop-shadow-sm`}
          >
            GAMING &amp; CAFÉ
          </p>
          <span className="w-3 md:w-5 h-[1.5px] bg-[#E5252A]/70" />
        </div>
      )}

      {/* Motto: PLAY • COMPETE • RELAX • REPEAT */}
      {showMotto && (
        <div className="mt-1.5 flex flex-col items-center">
          <p
            className={`font-bebas font-bold text-neutral-600 dark:text-neutral-400 uppercase ${sizeMap.mottoSize} tracking-[0.25em]`}
          >
            PLAY • COMPETE • RELAX • REPEAT
          </p>
          <span className="text-[#E5252A] font-black text-xs md:text-sm mt-0.5 leading-none">
            ✕
          </span>
        </div>
      )}
    </div>
  );
}
