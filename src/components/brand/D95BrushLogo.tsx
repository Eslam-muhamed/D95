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
      dSize: 'text-2xl',
      numSize: 'text-3xl',
      subSize: 'text-[9px] tracking-[0.3em]',
      mottoSize: 'text-[8px] tracking-[0.2em]',
      drip1: 'w-[1.5px] h-2 -bottom-2 left-[28%]',
      drip2: 'w-[1.5px] h-1.5 -bottom-1.5 right-[30%]',
      dripD: 'w-[1.5px] h-2 -bottom-1 left-2',
      sprayLg: 'w-1 h-1 -top-1 -right-1.5',
      sprayMd: 'w-0.5 h-0.5 top-1 -right-2',
      containerPy: 'py-1',
    },
    md: {
      dSize: 'text-4xl md:text-5xl',
      numSize: 'text-5xl md:text-6xl',
      subSize: 'text-[11px] md:text-xs tracking-[0.35em]',
      mottoSize: 'text-[9px] md:text-[10px] tracking-[0.25em]',
      drip1: 'w-[2px] h-3.5 -bottom-3 left-[28%]',
      drip2: 'w-[1.5px] h-2.5 -bottom-2 right-[30%]',
      dripD: 'w-[2px] h-3 -bottom-1 left-2',
      sprayLg: 'w-1.5 h-1.5 -top-1.5 -right-2.5',
      sprayMd: 'w-1 h-1 top-1.5 -right-3',
      containerPy: 'py-2',
    },
    lg: {
      dSize: 'text-6xl md:text-8xl',
      numSize: 'text-7xl md:text-9xl',
      subSize: 'text-xs md:text-sm tracking-[0.4em]',
      mottoSize: 'text-[10px] md:text-xs tracking-[0.3em]',
      drip1: 'w-[2.5px] md:w-[3.5px] h-4 md:h-7 -bottom-3.5 md:-bottom-6 left-[28%]',
      drip2: 'w-[2px] md:w-[2.5px] h-3 md:h-5 -bottom-2.5 md:-bottom-4 right-[30%]',
      dripD: 'w-[2.5px] md:w-[3px] h-4 md:h-6 -bottom-1.5 left-2 md:left-3',
      sprayLg: 'w-2 h-2 md:w-3 md:h-3 -top-2 md:-top-3 -right-3 md:-right-4',
      sprayMd: 'w-1.5 h-1.5 md:w-2 md:h-2 top-2 md:top-3 -right-4 md:-right-5',
      containerPy: 'py-3',
    },
    xl: {
      dSize: 'text-7xl md:text-9xl',
      numSize: 'text-8xl md:text-[11rem]',
      subSize: 'text-sm md:text-base tracking-[0.45em]',
      mottoSize: 'text-xs md:text-sm tracking-[0.35em]',
      drip1: 'w-[3.5px] md:w-[4.5px] h-6 md:h-9 -bottom-5 md:-bottom-8 left-[28%]',
      drip2: 'w-[2.5px] md:w-[3.5px] h-4 md:h-7 -bottom-3.5 md:-bottom-6 right-[30%]',
      dripD: 'w-[3px] md:w-[4px] h-5 md:h-8 -bottom-2 left-3 md:left-4',
      sprayLg: 'w-3 h-3 md:w-4 md:h-4 -top-3 md:-top-4 -right-4 md:-right-6',
      sprayMd: 'w-2 h-2 md:w-2.5 md:h-2.5 top-3 md:top-4 -right-5 md:-right-7',
      containerPy: 'py-4',
    },
  }[size];

  return (
    <div dir="ltr" className={`flex flex-col items-center select-none text-center ${sizeMap.containerPy} ${className}`}>
      {/* Main D95 Brushed Graffiti Mark */}
      <div dir="ltr" className="relative inline-flex items-baseline justify-center tracking-tighter">
        {/* Glow behind the logo */}
        {glow && (
          <div
            className="absolute inset-0 -inset-x-8 bg-red-900/30 blur-2xl rounded-full pointer-events-none -z-10"
            aria-hidden="true"
          />
        )}

        {/* Letter "D" - Solid Distressed Ink in Light mode / Chalk White in Dark mode */}
        <div className="relative inline-block">
          <span
            className={`font-brush font-black ${sizeMap.dSize} leading-none text-neutral-900 dark:text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]`}
            style={{
              display: 'inline-block',
              transform: 'skewX(-4deg) rotate(-1deg)',
            }}
          >
            D
          </span>

          {/* Dripping paint trails streaming from D */}
          <div className="absolute -bottom-1 left-2 flex items-start gap-1 pointer-events-none opacity-85">
            <span
              className={`${sizeMap.dripD} bg-neutral-800 dark:bg-white rounded-b-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]`}
              style={{ animation: 'pulse 2.5s infinite ease-in-out' }}
            />
          </div>
        </div>

        {/* Number "95" - Iconic Vivid Graffiti Crimson Spray */}
        <div className="relative inline-block -ml-1 md:-ml-2">
          <span
            className={`font-brush font-black ${sizeMap.numSize} leading-none tracking-tight`}
            style={{
              color: '#E5252A',
              display: 'inline-block',
              transform: 'skewX(-6deg) rotate(2deg)',
              filter: 'drop-shadow(0 2px 14px rgba(229, 37, 42, 0.5)) drop-shadow(0 0 2px rgba(0, 0, 0, 0.8))',
            }}
          >
            95
          </span>

          {/* Authentic graffiti spray drips and splatters matching the photo */}
          {/* Drip under the 9 loop */}
          <span
            className={`absolute ${sizeMap.drip1} bg-[#E5252A] rounded-b-full shadow-[0_0_6px_rgba(229,37,42,0.8)] pointer-events-none`}
            aria-hidden="true"
          />
          {/* Drip under the 5 hook */}
          <span
            className={`absolute ${sizeMap.drip2} bg-[#E5252A] rounded-b-full shadow-[0_0_6px_rgba(229,37,42,0.8)] pointer-events-none`}
            aria-hidden="true"
          />
          {/* Top-right spray particles on the 5 */}
          <span
            className={`absolute ${sizeMap.sprayLg} rounded-full bg-[#E5252A] opacity-90 blur-[0.2px] pointer-events-none`}
            aria-hidden="true"
          />
          <span
            className={`absolute ${sizeMap.sprayMd} rounded-full bg-[#E5252A] opacity-80 pointer-events-none`}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Stencil Subtitle: GAMING & CAFÉ */}
      {showSubtitle && (
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="w-3 md:w-5 h-[1px] bg-red-600/70" />
          <p
            className={`font-display font-black text-neutral-800 dark:text-neutral-200 uppercase ${sizeMap.subSize} drop-shadow-sm`}
            style={{ letterSpacing: '0.35em' }}
          >
            GAMING &amp; CAFÉ
          </p>
          <span className="w-3 md:w-5 h-[1px] bg-red-600/70" />
        </div>
      )}

      {/* Motto: PLAY. COMPETE. RELAX. REPEAT. */}
      {showMotto && (
        <div className="mt-2 flex flex-col items-center">
          <p
            className={`font-body font-bold text-neutral-600 dark:text-neutral-400 uppercase ${sizeMap.mottoSize}`}
            style={{ letterSpacing: '0.28em' }}
          >
            PLAY • COMPETE • RELAX • REPEAT
          </p>
          {/* Centered Red Crossmark from the wall */}
          <span className="text-red-600 font-black text-xs md:text-sm mt-0.5 leading-none">
            ✕
          </span>
        </div>
      )}
    </div>
  );
}
