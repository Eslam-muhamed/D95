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
      dripH: 'h-2',
      containerPy: 'py-1',
    },
    md: {
      dSize: 'text-4xl md:text-5xl',
      numSize: 'text-5xl md:text-6xl',
      subSize: 'text-[11px] md:text-xs tracking-[0.35em]',
      mottoSize: 'text-[9px] md:text-[10px] tracking-[0.25em]',
      dripH: 'h-3 md:h-4',
      containerPy: 'py-2',
    },
    lg: {
      dSize: 'text-6xl md:text-8xl',
      numSize: 'text-7xl md:text-9xl',
      subSize: 'text-xs md:text-sm tracking-[0.4em]',
      mottoSize: 'text-[10px] md:text-xs tracking-[0.3em]',
      dripH: 'h-4 md:h-6',
      containerPy: 'py-3',
    },
    xl: {
      dSize: 'text-7xl md:text-9xl',
      numSize: 'text-8xl md:text-[11rem]',
      subSize: 'text-sm md:text-base tracking-[0.45em]',
      mottoSize: 'text-xs md:text-sm tracking-[0.35em]',
      dripH: 'h-6 md:h-8',
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

        {/* Letter "D" - Distressed Charcoal Ink with Paint Drips */}
        <div className="relative inline-block">
          <span
            className={`font-brush font-black ${sizeMap.dSize} leading-none text-neutral-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]`}
            style={{
              display: 'inline-block',
              transform: 'skewX(-4deg) rotate(-1deg)',
              color: '#F2EDE8',
              WebkitTextStroke: '1px rgba(0,0,0,0.7)',
            }}
          >
            D
          </span>

          {/* Dripping paint trails streaming from D */}
          <div className="absolute -bottom-1 left-2 flex items-start gap-1 pointer-events-none opacity-80">
            <span
              className={`w-[2px] ${sizeMap.dripH} bg-neutral-300 rounded-b-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]`}
              style={{ animation: 'pulse 2.5s infinite ease-in-out' }}
            />
            <span
              className={`w-[1.5px] h-2 bg-neutral-400 rounded-b-full ml-1`}
            />
            <span
              className={`w-[1px] h-1.5 bg-neutral-500 rounded-b-full`}
            />
          </div>
        </div>

        {/* Number "95" - Sweeping Japanese / Graffiti Crimson Brush Stroke */}
        <div className="relative inline-block -ml-1 md:-ml-2">
          <span
            className={`font-brush font-black ${sizeMap.numSize} leading-none tracking-tight`}
            style={{
              color: '#B51824',
              display: 'inline-block',
              transform: 'skewX(-6deg) rotate(2deg)',
              textShadow: '0 0 1px #000, 0 2px 10px rgba(181, 24, 36, 0.6), 0 0 25px rgba(181, 24, 36, 0.4)',
              background: 'linear-gradient(135deg, #CF1F2D 0%, #A3141E 50%, #6E0B12 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            95
          </span>

          {/* Artistic paint splatters around the 95 */}
          <span
            className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-[#B51824] opacity-80 blur-[0.3px]"
            aria-hidden="true"
          />
          <span
            className="absolute top-4 -right-3 w-1 h-1 rounded-full bg-[#CF1F2D] opacity-70"
            aria-hidden="true"
          />
          <span
            className="absolute -bottom-1 right-1 w-1 h-2 bg-[#8B1119] rounded-full opacity-75 rotate-12"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Stencil Subtitle: GAMING & CAFÉ */}
      {showSubtitle && (
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="w-3 md:w-5 h-[1px] bg-red-700/60" />
          <p
            className={`font-display font-black text-neutral-200 uppercase ${sizeMap.subSize} drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]`}
            style={{ letterSpacing: '0.35em' }}
          >
            GAMING &amp; CAFÉ
          </p>
          <span className="w-3 md:w-5 h-[1px] bg-red-700/60" />
        </div>
      )}

      {/* Motto: PLAY. COMPETE. RELAX. REPEAT. */}
      {showMotto && (
        <div className="mt-2 flex flex-col items-center">
          <p
            className={`font-body font-bold text-neutral-400 uppercase ${sizeMap.mottoSize}`}
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
