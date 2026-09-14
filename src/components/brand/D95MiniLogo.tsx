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
      <img
        src="/new-logo.png"
        alt="D95"
        className={`hidden dark:inline-block ${sizeMap} object-contain drop-shadow-[0_1px_8px_rgba(229,37,42,0.4)]`}
      />
      {/* Light theme: Dark D + Red 95 */}
      <img
        src="/new-logo-dark.png"
        alt="D95"
        className={`inline-block dark:hidden ${sizeMap} object-contain`}
      />
    </span>
  );
}
