import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface VeyraLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showBilingualBadge?: boolean;
  variant?: 'full' | 'icon-only' | 'stacked';
  className?: string;
}

export const VeyraLogo: React.FC<VeyraLogoProps> = ({
  size = 'md',
  showTagline = true,
  showBilingualBadge = true,
  variant = 'full',
  className = '',
}) => {
  const { language } = useLanguage();

  // Size dimensions for the icon mark
  const dimensions = {
    xs: { icon: 24, text: 'text-sm', tagline: 'text-[9px]', badge: 'text-[8px]' },
    sm: { icon: 32, text: 'text-base', tagline: 'text-[10px]', badge: 'text-[9px]' },
    md: { icon: 42, text: 'text-xl', tagline: 'text-[11px]', badge: 'text-[10px]' },
    lg: { icon: 56, text: 'text-2xl', tagline: 'text-xs', badge: 'text-[11px]' },
    xl: { icon: 84, text: 'text-4xl', tagline: 'text-sm', badge: 'text-xs' },
  }[size];

  // SVG Icon Mark: Dynamic V integrated with Celestial Aperture & Infinity Prism
  const IconMark = (
    <div
      style={{ width: dimensions.icon, height: dimensions.icon }}
      className="relative flex-shrink-0 flex items-center justify-center group"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Outer V Wings Gradient */}
          <linearGradient id="veyra-v-grad-left" x1="15" y1="18" x2="50" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="45%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>

          <linearGradient id="veyra-v-grad-right" x1="85" y1="18" x2="50" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="50%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>

          {/* Central Iris Aperture Gradient */}
          <linearGradient id="veyra-aperture" x1="28" y1="28" x2="72" y2="72" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="50%" stopColor="#312E81" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Infinity Loop Gradient */}
          <linearGradient id="veyra-infinity" x1="32" y1="42" x2="68" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="35%" stopColor="#818CF8" />
            <stop offset="70%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>

          {/* Radiant Core Glow */}
          <radialGradient id="veyra-core-glow" cx="50" cy="50" r="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="25%" stopColor="#FDE047" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </radialGradient>

          {/* Filter for subtle glow */}
          <filter id="veyra-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Backdrop Shield / Lens Ring */}
        <circle cx="50" cy="46" r="26" fill="url(#veyra-aperture)" stroke="#4338CA" strokeWidth="1.5" strokeOpacity="0.6" />

        {/* 2. Aperture Facet Blades (Suggesting "Seeing Beyond") */}
        <path d="M50 20 L58 36 L50 46 Z" fill="#4F46E5" fillOpacity="0.35" />
        <path d="M72 36 L62 50 L50 46 Z" fill="#6366F1" fillOpacity="0.35" />
        <path d="M68 62 L52 58 L50 46 Z" fill="#818CF8" fillOpacity="0.35" />
        <path d="M32 62 L48 58 L50 46 Z" fill="#7C3AED" fillOpacity="0.35" />
        <path d="M28 36 L38 50 L50 46 Z" fill="#38BDF8" fillOpacity="0.35" />

        {/* 3. The Futuristic 'V' Outer Wings */}
        {/* Left Wing */}
        <path
          d="M18 20 C22 28 32 60 50 88 C44 76 34 54 26 30 C24 24 20 20 18 20 Z"
          fill="url(#veyra-v-grad-left)"
          filter="url(#veyra-glow-filter)"
        />
        {/* Right Wing */}
        <path
          d="M82 20 C78 28 68 60 50 88 C56 76 66 54 74 30 C76 24 80 20 82 20 Z"
          fill="url(#veyra-v-grad-right)"
          filter="url(#veyra-glow-filter)"
        />

        {/* 4. Bottom V Anchor Join */}
        <path
          d="M44 76 C47 84 50 88 50 88 C50 88 53 84 56 76 C52 78 48 78 44 76 Z"
          fill="#A855F7"
        />

        {/* 5. Center Infinity Horizon Loop ("See beyond") */}
        <path
          d="M38 50 C38 45 43 42 47 46 C50 49 53 52 57 52 C61 52 64 48 64 45 C64 41 60 38 56 42 C52 46 48 53 43 53 C39 53 36 49 38 50 Z"
          fill="none"
          stroke="url(#veyra-infinity)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 6. Central Starlight / Radiant Core */}
        <circle cx="50" cy="46" r="6" fill="url(#veyra-core-glow)" />
        <circle cx="50" cy="46" r="2.2" fill="#FFFFFF" />

        {/* Star Sparkle Rays */}
        <path d="M50 38 L50 54 M42 46 L58 46" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.8" />
      </svg>
    </div>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center ${className}`}>{IconMark}</div>;
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center space-y-2 ${className}`}>
        {IconMark}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className={`font-black tracking-tight text-slate-900 dark:text-white ${dimensions.text}`}>
              Veyra
            </span>
            {showBilingualBadge && (
              <span className={`font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-devanagari border border-indigo-200/60 dark:border-indigo-800/60 ${dimensions.badge}`}>
                वेयरा
              </span>
            )}
          </div>
          {showTagline && (
            <p className={`font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 font-sans ${dimensions.tagline}`}>
              {language === 'hi' ? '“जो आप जानते हैं, उससे भी आगे देखें।”' : '“See beyond what you know.”'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default horizontal full brand lockup
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {IconMark}
      <div className="text-left leading-tight">
        <div className="flex items-center gap-2">
          <span className={`font-black tracking-tight text-slate-900 dark:text-white ${dimensions.text}`}>
            Veyra
          </span>
          {showBilingualBadge && (
            <span className={`font-bold px-1.5 py-0.5 rounded bg-indigo-50/90 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-devanagari border border-indigo-200/60 dark:border-indigo-800/60 ${dimensions.badge}`}>
              वेयरा
            </span>
          )}
        </div>
        {showTagline && (
          <p className={`font-medium tracking-normal text-slate-500 dark:text-slate-400 font-sans ${dimensions.tagline}`}>
            {language === 'hi' ? '“जो आप जानते हैं, उससे भी आगे देखें।”' : '“See beyond what you know.”'}
          </p>
        )}
      </div>
    </div>
  );
};
