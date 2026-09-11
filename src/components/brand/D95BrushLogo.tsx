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

        {/* Letter "D" - Pure Chalk White Grunge Brush */}
        <div className="relative inline-block">
          <span
            className={`font-brush font-black ${sizeMap.dSize} leading-none text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.9)]`}
            style={{
              display: 'inline-block',
              transform: 'skewX(-4deg) rotate(-1deg)',
              WebkitTextStroke: '1px rgba(0,0,0,0.4)',
            }}
          >
            D
          </span>

          {/* Dripping paint trails streaming from D in white */}
          <div className="absolute -bottom-1 left-2 flex items-start gap-1 pointer-events-none opacity-90">
            <span
              className={`w-[2.5px] ${sizeMap.dripH} bg-white rounded-b-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
              style={{ animation: 'pulse 2.5s infinite ease-in-out' }}
            />
            <span
              className={`w-[1.5px] h-2 bg-neutral-200 rounded-b-full ml-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]`}
            />
            <span
              className={`w-[1px] h-1.5 bg-neutral-300 rounded-b-full`}
            />
          </div>
        </div>

        {/* Number "95" - Sweeping Japanese / Graffiti Crimson Brush Stroke in Vibrant Red */}
        <div className="relative inline-block -ml-1 md:-ml-2">
          <span
            className={`font-brush font-black ${sizeMap.numSize} leading-none tracking-tight text-red-600`}
            style={{
              display: 'inline-block',
              transform: 'skewX(-6deg) rotate(2deg)',
              textShadow: '0 0 1px #000, 0 3px 12px rgba(220, 38, 38, 0.75), 0 0 28px rgba(220, 38, 38, 0.5)',
              background: 'linear-gradient(135deg, #FF2633 0%, #DC2626 50%, #991B1B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            95
          </span>

          {/* Artistic paint splatters around the 95 */}
          <span
            className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-[#DC2626] opacity-90 blur-[0.3px]"
            aria-hidden="true"
          />
          <span
            className="absolute top-4 -right-3 w-1 h-1 rounded-full bg-[#FF2633] opacity-80"
            aria-hidden="true"
          />
          <span
            className="absolute -bottom-1 right-1 w-1 h-2 bg-[#991B1B] rounded-full opacity-80 rotate-12"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Subtitle: — GAMING & CAFÉ — */}
      {showSubtitle && (
        <div className="mt-1.5 flex items-center justify-center gap-2">
          <span className="w-4 md:w-6 h-[1.5px] bg-red-600 rounded-full" />
          <p
            className={`font-bebas font-bold text-white uppercase ${sizeMap.subSize} tracking-[0.35em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]`}
          >
            GAMING &amp; CAFÉ
          </p>
          <span className="w-4 md:w-6 h-[1.5px] bg-red-600 rounded-full" />
        </div>
      )}

      {/* Motto: PLAY • COMPETE • RELAX • REPEAT */}
      {showMotto && (
        <div className="mt-2 flex flex-col items-center">
          <p
            className={`font-bebas font-bold text-neutral-400 uppercase ${sizeMap.mottoSize} tracking-[0.28em] drop-shadow-sm`}
          >
            PLAY • COMPETE • RELAX • REPEAT
          </p>
          <span className="text-red-600 font-black text-xs md:text-sm mt-0.5 leading-none">
            ✕
          </span>
        </div>
      )}
    </div>
  );
}
