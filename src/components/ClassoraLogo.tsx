import React from 'react';

interface ClassoraLogoProps {
  size?: number | string;
  className?: string;
}

export const ClassoraLogo: React.FC<ClassoraLogoProps> = ({ size = 64, className = '' }) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/30 via-indigo-500/30 to-purple-500/30 blur-md -z-10" />

      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_10px_25px_rgba(79,70,229,0.35)]"
      >
        <defs>
          {/* Main 3D Glossy Gradient */}
          <linearGradient id="classora_bg_grad" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="35%" stopColor="#6366F1" />
            <stop offset="70%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>

          {/* Chat bubble body gradient */}
          <linearGradient id="classora_bubble_grad" x1="20" y1="30" x2="100" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="50%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>

          {/* Cap diamond highlight */}
          <linearGradient id="classora_cap_top" x1="30" y1="20" x2="90" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#E0E7FF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#C7D2FE" stopOpacity="0.8" />
          </linearGradient>

          {/* Cap underside depth */}
          <linearGradient id="classora_cap_depth" x1="60" y1="52" x2="60" y2="76" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#312E81" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0.95" />
          </linearGradient>

          {/* Top gloss reflection */}
          <linearGradient id="classora_gloss" x1="30" y1="8" x2="90" y2="55" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Tassel gradient */}
          <linearGradient id="classora_tassel" x1="88" y1="42" x2="100" y2="72" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>

          {/* Soft inner shadow filter */}
          <filter id="soft_shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* 1. App Icon Rounded Squircle Container with 3D Bevel */}
        <rect
          x="8"
          y="8"
          width="104"
          height="104"
          rx="28"
          fill="url(#classora_bg_grad)"
        />

        {/* Inner Border Rim */}
        <rect
          x="8.5"
          y="8.5"
          width="103"
          height="103"
          rx="27.5"
          stroke="url(#classora_gloss)"
          strokeWidth="1.5"
        />

        {/* Glassmorphic overlay curve on top corner */}
        <path
          d="M8 36C8 20.536 20.536 8 36 8H84C99.464 8 112 20.536 112 36V50C112 50 82 44 60 48C38 52 8 68 8 68V36Z"
          fill="url(#classora_gloss)"
        />

        {/* 2. Chat Bubble Base with Speech Pointer (Unified with Education) */}
        <path
          d="M32 46C32 38 38 32 46 32H74C82 32 88 38 88 46V70C88 78 82 84 74 84H52L38 94V84H46C38 84 32 78 32 70V46Z"
          fill="rgba(15, 23, 42, 0.35)"
        />

        {/* 3. Modern Graduation Mortarboard (Education Symbol) */}
        {/* Cap Diamond Top */}
        <path
          d="M60 32L94 48L60 64L26 48L60 32Z"
          fill="url(#classora_cap_top)"
          filter="url(#soft_shadow)"
        />

        {/* Cap Under-Band / Skullcap */}
        <path
          d="M38 54V68C38 74.5 48 80 60 80C72 80 82 74.5 82 68V54C76 58 68 60 60 60C52 60 44 58 38 54Z"
          fill="url(#classora_cap_depth)"
        />

        {/* Chat dots inside the cap base to signify communication */}
        <circle cx="50" cy="70" r="2.5" fill="#38BDF8" />
        <circle cx="60" cy="70" r="2.5" fill="#818CF8" />
        <circle cx="70" cy="70" r="2.5" fill="#C084FC" />

        {/* Cap Center Button */}
        <ellipse cx="60" cy="48" rx="3.5" ry="2" fill="#4F46E5" />

        {/* Cap Tassel Ribbon */}
        <path
          d="M60 48Q78 50 86 58T90 74"
          stroke="url(#classora_tassel)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Tassel Bobble */}
        <circle cx="90" cy="74" r="3" fill="#38BDF8" />
      </svg>
    </div>
  );
};
