import React from 'react';

interface TrendzLogoProps {
  variant?: 'horizontal' | 'vertical' | 'mark-only' | 'invoice-header' | 'receipt-header';
  theme?: 'dark' | 'light' | 'print' | 'gold-on-dark' | 'gold-on-light';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  subtitleText?: string;
  className?: string;
}

export const TrendzLogoMark: React.FC<{ size?: number; className?: string; strokeWidth?: number; variant?: 'gold' | 'dark' | 'print' }> = ({
  size = 48,
  className = '',
  strokeWidth = 3.5,
  variant = 'gold',
}) => {
  const gradientId = React.useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Trendz Interior Logo"
    >
      <defs>
        {/* Luxury Metallic Gold Gradient matching original brand logo */}
        <linearGradient id={`goldGrad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DFBA73" />
          <stop offset="25%" stopColor="#F9E8B2" />
          <stop offset="50%" stopColor="#C89D4B" />
          <stop offset="75%" stopColor="#E5C77E" />
          <stop offset="100%" stopColor="#A87A2C" />
        </linearGradient>
        <linearGradient id={`goldGradH-${gradientId}`} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#C89D4B" />
          <stop offset="50%" stopColor="#FDF0C8" />
          <stop offset="100%" stopColor="#B3822E" />
        </linearGradient>
      </defs>

      {/* Background Frame for dark theme contrast */}
      <rect width="100" height="100" rx="8" fill={variant === 'gold' ? '#0b0f14' : 'transparent'} />

      {/* Golden Architectural Square Box with bottom opening */}
      {/* Top bar */}
      <line
        x1="18"
        y1="18"
        x2="82"
        y2="18"
        stroke={variant === 'print' ? '#111827' : `url(#goldGrad-${gradientId})`}
        strokeWidth={strokeWidth * 1.6}
        strokeLinecap="square"
      />
      {/* Left bar */}
      <line
        x1="18"
        y1="18"
        x2="18"
        y2="82"
        stroke={variant === 'print' ? '#111827' : `url(#goldGrad-${gradientId})`}
        strokeWidth={strokeWidth * 1.6}
        strokeLinecap="square"
      />
      {/* Right bar */}
      <line
        x1="82"
        y1="18"
        x2="82"
        y2="82"
        stroke={variant === 'print' ? '#111827' : `url(#goldGrad-${gradientId})`}
        strokeWidth={strokeWidth * 1.6}
        strokeLinecap="square"
      />
      {/* Bottom Left Segment */}
      <line
        x1="18"
        y1="82"
        x2="38"
        y2="82"
        stroke={variant === 'print' ? '#111827' : `url(#goldGrad-${gradientId})`}
        strokeWidth={strokeWidth * 1.6}
        strokeLinecap="square"
      />
      {/* Bottom Right Segment */}
      <line
        x1="62"
        y1="82"
        x2="82"
        y2="82"
        stroke={variant === 'print' ? '#111827' : `url(#goldGrad-${gradientId})`}
        strokeWidth={strokeWidth * 1.6}
        strokeLinecap="square"
      />

      {/* Inside 3 Geometric Pillars */}
      {/* Left Pillar */}
      <line
        x1="34"
        y1="34"
        x2="34"
        y2="54"
        stroke={variant === 'print' ? '#111827' : `url(#goldGradH-${gradientId})`}
        strokeWidth={strokeWidth * 1.6}
        strokeLinecap="square"
      />
      {/* Center Pillar (Long, descends all the way down) */}
      <line
        x1="50"
        y1="34"
        x2="50"
        y2="84"
        stroke={variant === 'print' ? '#111827' : `url(#goldGradH-${gradientId})`}
        strokeWidth={strokeWidth * 1.6}
        strokeLinecap="square"
      />
      {/* Right Pillar */}
      <line
        x1="66"
        y1="34"
        x2="66"
        y2="54"
        stroke={variant === 'print' ? '#111827' : `url(#goldGradH-${gradientId})`}
        strokeWidth={strokeWidth * 1.6}
        strokeLinecap="square"
      />
    </svg>
  );
};

export const TrendzLogo: React.FC<TrendzLogoProps> = ({
  variant = 'horizontal',
  theme = 'dark',
  size = 'md',
  showSubtitle = true,
  subtitleText,
  className = '',
}) => {
  const sizeMap = {
    sm: { mark: 32, text: 'text-sm', sub: 'text-[9px]' },
    md: { mark: 44, text: 'text-base', sub: 'text-[11px]' },
    lg: { mark: 56, text: 'text-xl', sub: 'text-xs' },
    xl: { mark: 72, text: 'text-2xl', sub: 'text-sm' },
  };

  const isDark = theme === 'dark' || theme === 'gold-on-dark';
  const isPrint = theme === 'print';

  // Specific Invoice Header with exact branding
  if (variant === 'invoice-header') {
    return (
      <div className={`flex items-center justify-between gap-4 p-4 rounded-xl ${isPrint ? 'bg-white border-b-2 border-slate-900' : 'bg-slate-950 text-white border border-amber-900/40 shadow-lg'} ${className}`}>
        <div className="flex items-center gap-3.5">
          <div className="p-1 rounded-lg bg-black border border-amber-500/30 shadow-md shrink-0">
            <TrendzLogoMark size={sizeMap[size].mark} variant={isPrint ? 'print' : 'gold'} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold tracking-[0.22em] text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA73] via-[#FFF3D1] to-[#C89D4B] uppercase font-serif drop-shadow-xs m-0">
                TRENDZ
              </h1>
              <span className="font-medium tracking-[0.3em] text-sm sm:text-base text-amber-200/90 uppercase font-serif">
                INTERIOR
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-amber-200/70 tracking-widest uppercase mt-0.5 font-medium">
              Architecture • Turnkey Fitouts • Bespoke Interiors
            </p>
            <p className="text-[10px] text-amber-300/80 font-medium tracking-wide mt-0.5">
              Suite # LG - 11 Continental Shopping Mall
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black tracking-[0.25em] text-xs sm:text-sm rounded uppercase shadow-sm">
            INVOICE
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-1">
            TRENDZ / COMMERCIAL BILL
          </p>
          <p className="text-[9px] text-slate-400">
            Suite # LG - 11 Continental Shopping Mall
          </p>
        </div>
      </div>
    );
  }

  // Specific Receipt Header with exact branding
  if (variant === 'receipt-header') {
    return (
      <div className={`flex items-center justify-between gap-4 p-4 rounded-xl ${isPrint ? 'bg-white border-b-2 border-slate-900' : 'bg-slate-950 text-white border border-purple-900/40 shadow-lg'} ${className}`}>
        <div className="flex items-center gap-3.5">
          <div className="p-1 rounded-lg bg-black border border-amber-500/30 shadow-md shrink-0">
            <TrendzLogoMark size={sizeMap[size].mark} variant={isPrint ? 'print' : 'gold'} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold tracking-[0.22em] text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA73] via-[#FFF3D1] to-[#C89D4B] uppercase font-serif drop-shadow-xs m-0">
                TRENDZ
              </h1>
              <span className="font-medium tracking-[0.3em] text-sm sm:text-base text-amber-200/90 uppercase font-serif">
                INTERIOR
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-amber-200/70 tracking-widest uppercase mt-0.5 font-medium">
              Turnkey Fitouts • Official Accounts & Receipt Voucher
            </p>
            <p className="text-[10px] text-amber-300/80 font-medium tracking-wide mt-0.5">
              Suite # LG - 11 Continental Shopping Mall
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black tracking-[0.25em] text-xs sm:text-sm rounded uppercase shadow-sm">
            RECEIPT
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-1">
            TRENDZ / PAYMENT MEMO
          </p>
          <p className="text-[9px] text-slate-400">
            Suite # LG - 11 Continental Shopping Mall
          </p>
        </div>
      </div>
    );
  }

  // Mark only
  if (variant === 'mark-only') {
    return (
      <TrendzLogoMark
        size={sizeMap[size].mark}
        className={className}
        variant={isPrint ? 'print' : 'gold'}
      />
    );
  }

  // Vertical stacked layout (Center aligned)
  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="p-1.5 rounded-xl bg-black/90 border border-amber-500/40 shadow-md mb-2">
          <TrendzLogoMark size={sizeMap[size].mark} variant={isPrint ? 'print' : 'gold'} />
        </div>
        <div className="font-extrabold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA73] via-[#FFF3D1] to-[#C89D4B] uppercase font-serif text-lg">
          TRENDZ
        </div>
        <div className="text-[11px] tracking-[0.35em] text-amber-300 font-medium uppercase font-serif">
          INTERIOR
        </div>
        <div className="text-[10px] text-amber-200/90 font-medium tracking-wide mt-1">
          Suite # LG - 11 Continental Shopping Mall
        </div>
        {showSubtitle && (
          <div className="text-[9px] tracking-widest text-slate-400 uppercase mt-0.5">
            {subtitleText || 'Turnkey Architectural & Fitout Solutions'}
          </div>
        )}
      </div>
    );
  }

  // Default Horizontal Layout
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="p-1 rounded-lg bg-black border border-amber-500/30 shadow-xs shrink-0">
        <TrendzLogoMark size={sizeMap[size].mark} variant={isPrint ? 'print' : 'gold'} />
      </div>
      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-[0.18em] font-serif uppercase ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA73] via-[#FFF3D1] to-[#C89D4B]' : 'text-slate-900'}`}>
            TRENDZ
          </span>
          <span className={`font-semibold tracking-[0.22em] font-serif uppercase text-xs sm:text-sm ${isDark ? 'text-amber-300/90' : 'text-amber-700'}`}>
            INTERIOR
          </span>
        </div>
        <p className={`text-[10px] tracking-wide font-medium mt-0.5 m-0 ${isDark ? 'text-amber-200/90' : 'text-amber-800'}`}>
          Suite # LG - 11 Continental Shopping Mall
        </p>
        {showSubtitle && (
          <p className={`text-[9px] tracking-wider uppercase mt-0.5 m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {subtitleText || 'Architecture & Fitouts'}
          </p>
        )}
      </div>
    </div>
  );
};
