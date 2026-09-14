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
  showSubtitle = true, // We might ignore this since the image has it
  showMotto = false,
  className = '',
  glow = true,
}: D95BrushLogoProps) {
  const sizeMap = {
    sm: {
      imgWidth: 'w-20 sm:w-28',
      strokeWidth: 'w-24 sm:w-32',
      subSize: 'text-[9px] sm:text-[10px]',
      dashWidth: 'w-3 sm:w-4',
    },
    md: {
      imgWidth: 'w-36 sm:w-44 md:w-52',
      strokeWidth: 'w-40 sm:w-48 md:w-56',
      subSize: 'text-[11px] md:text-xs',
      dashWidth: 'w-4 md:w-5',
    },
    lg: {
      imgWidth: 'w-52 sm:w-60 md:w-68',
      strokeWidth: 'w-56 sm:w-64 md:w-72',
      subSize: 'text-xs md:text-sm',
      dashWidth: 'w-5 md:w-6',
    },
    xl: {
      imgWidth: 'w-72 sm:w-80 md:w-[26rem]',
      strokeWidth: 'w-80 sm:w-96 md:w-[28rem]',
      subSize: 'text-sm md:text-base',
      dashWidth: 'w-6 md:w-8',
    },
  }[size];

  return (
    <div dir="ltr" className={`relative flex flex-col items-center select-none text-center ${className}`}>
      {/* Ambient Glow behind the logo */}
      {glow && (
        <div
          className="absolute inset-0 -inset-x-8 bg-red-600/20 blur-3xl rounded-full pointer-events-none -z-10"
          aria-hidden="true"
        />
      )}
      
      {/* Dark theme: White letters on dark background with bright red 95 */}
      <picture className={`hidden dark:block ${sizeMap.imgWidth}`}>
        <source srcSet="/new-logo.webp" type="image/webp" />
        <img 
          src="/new-logo.png" 
          alt="D95" 
          width="840"
          height="460"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="w-full h-auto object-contain drop-shadow-[0_2px_16px_rgba(229,37,42,0.65)]" 
        />
      </picture>

      {/* Light theme: Dark letters on light background */}
      <picture className={`block dark:hidden ${sizeMap.imgWidth}`}>
        <source srcSet="/new-logo-dark.webp" type="image/webp" />
        <img 
          src="/new-logo-dark.png" 
          alt="D95" 
          width="840"
          height="460"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="w-full h-auto object-contain drop-shadow-[0_1px_6px_rgba(114,1,11,0.2)]" 
        />
      </picture>

      {/* Red Brush Stroke Underline */}
      <div className="relative w-full flex items-center justify-center -mt-1 sm:-mt-2">
        <svg
          viewBox="0 0 160 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${sizeMap.strokeWidth} h-auto text-[#72010B] dark:text-[#E5252A] drop-shadow-[0_1px_4px_rgba(114,1,11,0.25)] dark:drop-shadow-[0_0_12px_rgba(229,37,42,0.7)]`}
        >
          <path
            d="M2 7.5C28 5.8 62 4.5 98 5.2C122 5.6 145 6.6 158 8C152 9.6 130 9.8 104 9.5C65 9 32 9.8 4 10.5C2 10.5 1.5 8.5 2 7.5Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Subtitle: GAMING & CAFÉ */}
      {showSubtitle && (
        <div className="mt-2 sm:mt-2.5 flex items-center justify-center gap-2 sm:gap-2.5">
          <span className={`${sizeMap.dashWidth} h-[1.5px] bg-[#72010B]/80 dark:bg-[#E5252A]/80 rounded-full`} />
          <p
            className={`font-bebas font-black text-neutral-800 dark:text-neutral-200 uppercase ${sizeMap.subSize} tracking-[0.35em] drop-shadow-sm`}
          >
            GAMING &amp; CAFÉ
          </p>
          <span className={`${sizeMap.dashWidth} h-[1.5px] bg-[#72010B]/80 dark:bg-[#E5252A]/80 rounded-full`} />
        </div>
      )}

      {/* Motto: PLAY • COMPETE • RELAX • REPEAT */}
      {showMotto && (
        <div className="mt-2 flex flex-col items-center">
          <p
            className={`font-bebas font-bold text-neutral-600 dark:text-neutral-400 uppercase text-xs tracking-[0.25em]`}
          >
            PLAY • COMPETE • RELAX • REPEAT
          </p>
          <span className="text-[#E5252A] font-black text-sm mt-1 leading-none">
            ✕
          </span>
        </div>
      )}
    </div>
  );
}
