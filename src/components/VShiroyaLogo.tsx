import React from 'react';

interface VShiroyaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  animateNode?: boolean;
}

export const VShiroyaLogo: React.FC<VShiroyaLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  animateNode = true,
}) => {
  // Dimensions scaling
  const dimensions = {
    sm: { box: 'w-8 h-8', text: 'text-xs', sub: 'text-[9px]', gap: 'gap-2' },
    md: { box: 'w-10 h-10', text: 'text-sm', sub: 'text-[10px]', gap: 'gap-2.5' },
    lg: { box: 'w-14 h-14', text: 'text-lg', sub: 'text-xs', gap: 'gap-3' },
    xl: { box: 'w-20 h-20', text: 'text-2xl', sub: 'text-sm', gap: 'gap-4' },
  }[size];

  return (
    <div className={`inline-flex items-center ${dimensions.gap} group select-none ${className}`}>
      {/* Emblem SVG Container with Gold Metallic & Navy Sheen */}
      <div className={`relative ${dimensions.box} shrink-0 flex items-center justify-center`}>
        {/* Subtle Ambient Glow Aura */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-yellow-400/10 to-indigo-600/20 blur-md group-hover:blur-lg transition-all duration-300 opacity-70 group-hover:opacity-100" />

        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-md group-hover:scale-105 transition-transform duration-300 ease-out"
        >
          <defs>
            {/* Gold Metallic Gradients */}
            <linearGradient id="goldPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F9E088" />
              <stop offset="35%" stopColor="#DFAC37" />
              <stop offset="70%" stopColor="#C28919" />
              <stop offset="100%" stopColor="#8A5A00" />
            </linearGradient>

            <linearGradient id="goldLight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF2B2" />
              <stop offset="50%" stopColor="#E0B13D" />
              <stop offset="100%" stopColor="#9C6B03" />
            </linearGradient>

            <linearGradient id="navyAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Light Sweep Shimmer */}
            <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.8)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Outer Shield Wings (Left & Right Contours) */}
          <path
            d="M 22 36 C 22 58, 38 82, 60 98 C 82 82, 98 58, 98 36"
            stroke="url(#goldPrimary)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            className="opacity-90"
          />

          {/* Top Double Arch Crest */}
          <path
            d="M 28 26 C 42 22, 54 18, 60 14 C 66 18, 78 22, 92 26"
            stroke="url(#goldPrimary)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Main Gold Metallic 'V' Character */}
          <path
            d="M 36 32 L 60 86 L 84 32 L 73 32 L 60 66 L 47 32 Z"
            fill="url(#goldPrimary)"
            stroke="url(#goldLight)"
            strokeWidth="1"
          />

          {/* Navy Leaf Accent Tip on Right Wing of 'V' */}
          <path
            d="M 72 24 C 84 20, 94 28, 86 38 C 80 34, 76 28, 72 24 Z"
            fill="url(#navyAccent)"
            stroke="url(#goldLight)"
            strokeWidth="1.5"
          />

          {/* Pulsing AI Node Dot on Crest Tip */}
          {animateNode && (
            <circle
              cx="85"
              cy="25"
              r="3.5"
              className="fill-amber-300 animate-pulse"
              style={{ filter: 'drop-shadow(0 0 6px #F59E0B)' }}
            />
          )}

          {/* Light Sweep Shimmer Effect Overlay on Logo */}
          <rect
            x="-100%"
            y="0"
            width="100%"
            height="100%"
            fill="url(#shimmer)"
            className="group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out pointer-events-none opacity-40"
          />
        </svg>
      </div>

      {/* Brand Text Header */}
      {showText && (
        <div className="flex flex-col tracking-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-serif font-black ${dimensions.text} tracking-[0.18em] text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors uppercase`}
              style={{ fontFamily: "'Cinzel', 'Georgia', 'Playfair Display', serif" }}
            >
              V SHIROYA
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-500/80 via-amber-400/50 to-transparent" />
            <span
              className={`font-semibold ${dimensions.sub} tracking-[0.3em] text-amber-700 dark:text-amber-400 uppercase`}
            >
              INSURANCE
            </span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-amber-500/80 via-amber-400/50 to-transparent" />
          </div>
        </div>
      )}
    </div>
  );
};
