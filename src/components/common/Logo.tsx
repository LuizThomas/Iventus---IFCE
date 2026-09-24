import React from 'react';

interface LogoProps {
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showSubtitle = false
}) => {
  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center select-none ${className}`}>
        {/* IFCE "iv" symbol */}
        <div className="relative flex items-end gap-1.5 mb-2">
          {/* Left pillar: 1 red dot on top + 3 green squares */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-[#e11d48]" />
            <div className="w-5 h-5 rounded-xs bg-[#168038]" />
            <div className="w-5 h-5 rounded-xs bg-[#168038]" />
            <div className="w-5 h-5 rounded-xs bg-[#168038]" />
          </div>
          {/* Right letter 'V' in IFCE green */}
          <div className="flex items-end pb-0.5">
            <svg width="48" height="68" viewBox="0 0 54 76" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.5 0H20.5L34.5 50.5L48.5 0H63.5L42 75H27L5.5 0Z"
                fill="#168038"
              />
            </svg>
          </div>
        </div>

        {/* Brand Text */}
        <h1 className="text-3xl font-black text-[#168038] tracking-tight flex items-center gap-1.5">
          IFCE Iventus
        </h1>
        {showSubtitle && (
          <p className="text-sm text-neutral-500 font-normal mt-1 text-center max-w-[280px]">
            Plataforma de gestão dos eventos científicos do IFCE
          </p>
        )}
      </div>
    );
  }

  // Horizontal variant (used in Header across all screens)
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Mini IFCE emblem */}
      <div className="flex items-end gap-0.5">
        <div className="flex flex-col items-center gap-0.5">
          <div className={`${isSm ? 'w-1.5 h-1.5' : isLg ? 'w-2.5 h-2.5' : 'w-2 h-2'} rounded-full bg-[#e11d48]`} />
          <div className={`${isSm ? 'w-1.5 h-1.5' : isLg ? 'w-2.5 h-2.5' : 'w-2 h-2'} rounded-[1px] bg-[#168038]`} />
          <div className={`${isSm ? 'w-1.5 h-1.5' : isLg ? 'w-2.5 h-2.5' : 'w-2 h-2'} rounded-[1px] bg-[#168038]`} />
        </div>
        <div className="flex items-end">
          <svg
            width={isSm ? "16" : isLg ? "24" : "20"}
            height={isSm ? "20" : isLg ? "28" : "24"}
            viewBox="0 0 54 76"
            fill="none"
          >
            <path d="M5.5 0H20.5L34.5 50.5L48.5 0H63.5L42 75H27L5.5 0Z" fill="#168038" />
          </svg>
        </div>
      </div>

      {/* Wordmark */}
      <div className="flex items-baseline">
        <span className={`font-black tracking-tight text-[#168038] ${isSm ? 'text-xl' : isLg ? 'text-3xl' : 'text-2xl'}`}>
          iventus
        </span>
      </div>
    </div>
  );
};
