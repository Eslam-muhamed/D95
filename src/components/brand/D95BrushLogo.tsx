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
    sm: 'w-20 sm:w-28',
    md: 'w-36 sm:w-44 md:w-52',
    lg: 'w-52 sm:w-60 md:w-68',
    xl: 'w-72 sm:w-80 md:w-[26rem]',
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
      <img 
        src="/new-logo.png" 
        alt="D95" 
        className={`hidden dark:block ${sizeMap} object-contain drop-shadow-[0_2px_16px_rgba(229,37,42,0.65)]`} 
      />
      {/* Light theme: Dark letters on light background */}
      <img 
        src="/new-logo-dark.png" 
        alt="D95" 
        className={`block dark:hidden ${sizeMap} object-contain drop-shadow-[0_2px_14px_rgba(229,37,42,0.3)]`} 
      />

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
