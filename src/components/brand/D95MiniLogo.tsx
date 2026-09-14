import React from 'react';

interface D95MiniLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export default function D95MiniLogo({
  size = 'sm',
  className = '',
}: D95MiniLogoProps) {
  const sizeMap = {
    xs: 'h-4 w-auto',
    sm: 'h-6 w-auto',
    md: 'h-7 w-auto',
    lg: 'h-9 w-auto',
  }[size];

  return (
    <span dir="ltr" className={`inline-flex items-center select-none ${className}`}>
      {/* Dark theme: White D + Red 95 */}
      <picture className={`hidden dark:inline-block ${sizeMap}`}>
        <source srcSet="/new-logo.webp" type="image/webp" />
        <img
          src="/new-logo.png"
          alt="D95"
          width="840"
          height="460"
          loading="eager"
          decoding="async"
          className="h-full w-auto object-contain drop-shadow-[0_1px_8px_rgba(229,37,42,0.4)]"
        />
      </picture>
      {/* Light theme: Dark D + Red 95 */}
      <picture className={`inline-block dark:hidden ${sizeMap}`}>
        <source srcSet="/new-logo-dark.webp" type="image/webp" />
        <img
          src="/new-logo-dark.png"
          alt="D95"
          width="840"
          height="460"
          loading="eager"
          decoding="async"
          className="h-full w-auto object-contain"
        />
      </picture>
    </span>
  );
}
