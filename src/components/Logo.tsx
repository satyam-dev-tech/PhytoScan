import React from 'react';
import { Sprout, Scan, Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showTagline?: boolean;
  variant?: 'light' | 'dark';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = true,
  showTagline = true,
  variant = 'light',
  className = ''
}) => {
  // Dimensions and sizing based on size prop
  const sizeConfig = {
    sm: {
      emblem: 'w-8 h-8 rounded-xl',
      reticle: 'w-6 h-6',
      icon: 'w-4 h-4',
      spark: 'w-1.5 h-1.5 top-0.5 right-0.5',
      title: 'text-base',
      badge: 'text-[8px] px-1 py-0.2',
      tagline: 'text-[9px]'
    },
    md: {
      emblem: 'w-10 h-10 sm:w-11 sm:h-11 rounded-2xl',
      reticle: 'w-8 h-8',
      icon: 'w-5 h-5',
      spark: 'w-2 h-2 top-1 right-1',
      title: 'text-lg sm:text-xl',
      badge: 'text-[9px] px-1.5 py-0.5',
      tagline: 'text-[10px] sm:text-[11px]'
    },
    lg: {
      emblem: 'w-14 h-14 rounded-2xl',
      reticle: 'w-10 h-10',
      icon: 'w-7 h-7',
      spark: 'w-2.5 h-2.5 top-1.5 right-1.5',
      title: 'text-2xl',
      badge: 'text-[10px] px-2 py-0.5',
      tagline: 'text-xs'
    },
    xl: {
      emblem: 'w-16 h-16 sm:w-20 sm:h-20 rounded-3xl',
      reticle: 'w-12 h-12 sm:w-14 sm:h-14',
      icon: 'w-8 h-8 sm:w-10 sm:h-10',
      spark: 'w-3 h-3 top-2 right-2',
      title: 'text-3xl sm:text-4xl',
      badge: 'text-xs px-2.5 py-1',
      tagline: 'text-sm'
    }
  }[size];

  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      {/* Emblem Graphic */}
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Ambient Glow on Hover */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/25 via-[#52B788]/20 to-teal-400/25 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Squircle Core Badge */}
        <div
          className={`${sizeConfig.emblem} relative bg-gradient-to-br from-[#081C15] via-[#1B4332] to-[#2D6A4F] flex items-center justify-center border border-white/25 group-hover:border-emerald-300/60 shadow-[0_4px_16px_rgba(11,37,18,0.22),inset_0_1.5px_1.5px_rgba(255,255,255,0.35)] group-hover:shadow-[0_6px_22px_rgba(45,106,79,0.38),inset_0_1.5px_2px_rgba(255,255,255,0.45)] transition-all duration-300 overflow-hidden`}
        >
          {/* Subtle Cyber Grid Reticle Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#74C69D_1px,transparent_1px)] [background-size:6px_6px] opacity-15 pointer-events-none" />

          {/* Optical Scanner Reticle */}
          <Scan
            className={`${sizeConfig.reticle} absolute text-emerald-300/40 group-hover:text-emerald-300/80 transition-all duration-300 group-hover:scale-105 pointer-events-none`}
            strokeWidth={1.75}
          />

          {/* Central Organic Sprout Icon */}
          <div className="relative z-10 flex items-center justify-center">
            <Sprout
              className={`${sizeConfig.icon} text-[#D8F3DC] group-hover:text-white filter drop-shadow-[0_2px_6px_rgba(116,198,157,0.55)] group-hover:scale-110 transition-all duration-300`}
              strokeWidth={2.2}
            />
          </div>

          {/* Active AI Telemetry Sparkle / Status Beacon */}
          <span
            className={`${sizeConfig.spark} absolute rounded-full bg-[#52B788] ring-2 ring-[#081C15] shadow-[0_0_8px_#74C69D] animate-pulse z-20`}
          />
        </div>
      </div>

      {/* Typography Wordmark & Badge */}
      {showWordmark && (
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`font-outfit font-black ${sizeConfig.title} tracking-tight leading-none whitespace-nowrap ${
                isDark ? 'text-white' : 'text-[#132A13]'
              }`}
            >
              PHYTO
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D6A4F] via-[#40916C] to-[#52B788]">
                SCAN
              </span>
            </span>
            <span
              className={`${sizeConfig.badge} font-bold uppercase tracking-wider rounded-md transition-colors hidden sm:inline-block ${
                isDark
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-[#D8F3DC]/95 text-[#1B4332] border border-[#2D6A4F]/20 shadow-xs'
              }`}
            >
              Intelligence
            </span>
          </div>

          {showTagline && (
            <span
              className={`${sizeConfig.tagline} font-medium tracking-wide mt-0.5 leading-none transition-colors hidden sm:block whitespace-nowrap ${
                isDark ? 'text-emerald-300/70' : 'text-[#40916C]'
              }`}
            >
              Scan. Understand. Protect.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
