import React from 'react';
import { cn } from '@/utils/cn';

export interface AppLogoProps {
  className?: string;
  size?: number | string;
}

/**
 * 1. Python Mastery (PyMastery) Custom Vector Brand Logo
 * Interlocking Python dual-module emblem (Emerald/Cyan + Amber/Gold) with center `>_` REPL badge.
 */
export const PyMasteryLogo: React.FC<AppLogoProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 120 120"
    fill="none"
    aria-hidden="true"
    className={cn('w-full h-full select-none', className)}
  >
    <defs>
      <linearGradient id="pyBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#062E22" />
        <stop offset="48%" stopColor="#041914" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      <radialGradient id="pyGlow" cx="60" cy="54" r="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.34" />
        <stop offset="65%" stopColor="#0EA5E9" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#020617" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="pyRim" x1="12" y1="6" x2="108" y2="114" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.75" />
        <stop offset="50%" stopColor="#10B981" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.55" />
      </linearGradient>
      <linearGradient id="pyTop" x1="24" y1="18" x2="88" y2="76" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6EE7B7" />
        <stop offset="45%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="pyBottom" x1="34" y1="46" x2="96" y2="104" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
    </defs>

    <rect width="120" height="120" rx="26" fill="url(#pyBg)" />
    <circle cx="60" cy="58" r="52" fill="url(#pyGlow)" />
    <rect x="2.5" y="2.5" width="115" height="115" rx="24" stroke="url(#pyRim)" strokeWidth="2.5" />

    <path
      d="M22 32H98M22 60H98M22 88H98"
      stroke="#34D399"
      strokeOpacity="0.09"
      strokeWidth="1.5"
      strokeDasharray="4 4"
    />

    {/* Upper Python Block */}
    <path
      d="M59 17C41 17 37 24.5 37 33V43H61V47.5H27C17.5 47.5 13 55 13 66C13 77 17.5 84.5 27 84.5H35V73C35 63.5 42.5 56 52 56H74C81.5 56 87 50.5 87 43V33C87 23.5 79 17 59 17Z"
      fill="url(#pyTop)"
    />
    <circle cx="47.5" cy="27.5" r="4.2" fill="#022C22" />
    <circle cx="47.5" cy="27.5" r="2" fill="#A7F3D0" />

    {/* Lower Python Block */}
    <path
      d="M61 103C79 103 83 95.5 83 87V77H59V72.5H93C102.5 72.5 107 65 107 54C107 43 102.5 35.5 93 35.5H85V47C85 56.5 77.5 64 68 64H46C38.5 64 33 69.5 33 77V87C33 96.5 41 103 61 103Z"
      fill="url(#pyBottom)"
    />
    <circle cx="72.5" cy="92.5" r="4.2" fill="#451A03" />
    <circle cx="72.5" cy="92.5" r="2" fill="#FEF3C7" />

    {/* Center Terminal Prompt ('>_') */}
    <rect
      x="42"
      y="45"
      width="36"
      height="30"
      rx="9"
      fill="#020617"
      fillOpacity="0.92"
      stroke="#6EE7B7"
      strokeOpacity="0.65"
      strokeWidth="2"
    />
    <path
      d="M49 54L56.5 60L49 66"
      stroke="#34D399"
      strokeWidth="3.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M60 66H70"
      stroke="#FBBF24"
      strokeWidth="3.6"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * 2. Docker & K8s Mastery (KubeMastery) Custom Vector Brand Logo
 * Kubernetes 8-spoke helm wheel surrounding a 3D isometric Docker container cube.
 */
export const KubeMasteryLogo: React.FC<AppLogoProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 120 120"
    fill="none"
    aria-hidden="true"
    className={cn('w-full h-full select-none', className)}
  >
    <defs>
      <linearGradient id="kubeBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#082F49" />
        <stop offset="48%" stopColor="#0B192C" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      <radialGradient id="kubeGlow" cx="60" cy="60" r="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.38" />
        <stop offset="60%" stopColor="#2563EB" stopOpacity="0.14" />
        <stop offset="100%" stopColor="#020617" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="kubeRim" x1="10" y1="8" x2="110" y2="112" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#0EA5E9" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#6366F1" stopOpacity="0.65" />
      </linearGradient>
      <linearGradient id="helmGrad" x1="20" y1="18" x2="100" y2="102" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7DD3FC" />
        <stop offset="45%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
      <linearGradient id="cubeTop" x1="42" y1="38" x2="78" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
      <linearGradient id="cubeLeft" x1="38" y1="50" x2="60" y2="82" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
      <linearGradient id="cubeRight" x1="60" y1="50" x2="82" y2="82" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </linearGradient>
    </defs>

    <rect width="120" height="120" rx="26" fill="url(#kubeBg)" />
    <circle cx="60" cy="60" r="54" fill="url(#kubeGlow)" />
    <rect x="2.5" y="2.5" width="115" height="115" rx="24" stroke="url(#kubeRim)" strokeWidth="2.5" />

    <polygon
      points="60,13 94,27 107,60 94,93 60,107 26,93 13,60 26,27"
      stroke="url(#helmGrad)"
      strokeWidth="3.2"
      strokeOpacity="0.55"
      fill="#041022"
      fillOpacity="0.55"
    />

    <g stroke="url(#helmGrad)" strokeWidth="4.2" strokeLinecap="round">
      <line x1="60" y1="12" x2="60" y2="34" />
      <line x1="60" y1="86" x2="60" y2="108" />
      <line x1="12" y1="60" x2="34" y2="60" />
      <line x1="86" y1="60" x2="108" y2="60" />
      <line x1="25" y1="25" x2="41" y2="41" />
      <line x1="79" y1="79" x2="95" y2="95" />
      <line x1="95" y1="25" x2="79" y2="41" />
      <line x1="41" y1="79" x2="25" y2="95" />
    </g>

    <circle cx="60" cy="60" r="35" stroke="url(#helmGrad)" strokeWidth="5.5" fill="#06152D" />

    <g fill="#7DD3FC">
      <circle cx="60" cy="12" r="3.5" />
      <circle cx="60" cy="108" r="3.5" />
      <circle cx="12" cy="60" r="3.5" />
      <circle cx="108" cy="60" r="3.5" />
      <circle cx="25" cy="25" r="3" />
      <circle cx="95" cy="25" r="3" />
      <circle cx="25" cy="95" r="3" />
      <circle cx="95" cy="95" r="3" />
    </g>

    {/* 3D Isometric Docker Container Cube */}
    <polygon points="60,36 81,48 60,60 39,48" fill="url(#cubeTop)" />
    <polygon points="39,48 60,60 60,84 39,72" fill="url(#cubeLeft)" />
    <polygon points="60,60 81,48 81,72 60,84" fill="url(#cubeRight)" />

    <path d="M39 48L60 36L81 48L60 60L39 48Z" stroke="#E0F2FE" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M39 48V72L60 84L81 72V48" stroke="#7DD3FC" strokeWidth="1.6" strokeLinejoin="round" />
    <line x1="60" y1="60" x2="60" y2="84" stroke="#E0F2FE" strokeWidth="1.8" />
    <line x1="46" y1="57" x2="46" y2="71" stroke="#BAE6FD" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="53" y1="61" x2="53" y2="75" stroke="#BAE6FD" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="67" y1="61" x2="67" y2="75" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="74" y1="57" x2="74" y2="71" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/**
 * 3. CI/CD Architecture (CicdMastery) Custom Vector Brand Logo
 * Glowing DevOps Infinity Pipeline Loop with CI, DAG, and CD stages & zero-downtime check node.
 */
export const CicdMasteryLogo: React.FC<AppLogoProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 120 120"
    fill="none"
    aria-hidden="true"
    className={cn('w-full h-full select-none', className)}
  >
    <defs>
      <linearGradient id="cicdBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1E1B4B" />
        <stop offset="50%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#042F2E" />
      </linearGradient>
      <radialGradient id="cicdGlow" cx="60" cy="60" r="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.34" />
        <stop offset="55%" stopColor="#8B5CF6" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#020617" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="cicdRim" x1="8" y1="8" x2="112" y2="112" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#34D399" stopOpacity="0.75" />
      </linearGradient>
      <linearGradient id="ciLoop" x1="12" y1="34" x2="108" y2="86" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#22D3EE" />
        <stop offset="48%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#34D399" />
      </linearGradient>
      <linearGradient id="cdHighlight" x1="18" y1="78" x2="102" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="50%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
    </defs>

    <rect width="120" height="120" rx="26" fill="url(#cicdBg)" />
    <circle cx="60" cy="60" r="54" fill="url(#cicdGlow)" />
    <rect x="2.5" y="2.5" width="115" height="115" rx="24" stroke="url(#cicdRim)" strokeWidth="2.5" />

    <path d="M24 25H96" stroke="#38BDF8" strokeOpacity="0.28" strokeWidth="2" strokeDasharray="4 4" />
    <path d="M24 95H96" stroke="#34D399" strokeOpacity="0.28" strokeWidth="2" strokeDasharray="4 4" />

    <rect x="18" y="16" width="24" height="13" rx="6.5" fill="#083344" stroke="#22D3EE" strokeWidth="1.5" />
    <text x="30" y="25.5" textAnchor="middle" fill="#67E8F9" fontFamily="monospace" fontSize="8.5" fontWeight="800">
      CI
    </text>

    <rect x="48" y="16" width="24" height="13" rx="6.5" fill="#1E1B4B" stroke="#A78BFA" strokeWidth="1.5" />
    <text x="60" y="25.5" textAnchor="middle" fill="#DDD6FE" fontFamily="monospace" fontSize="8" fontWeight="800">
      DAG
    </text>

    <rect x="78" y="16" width="24" height="13" rx="6.5" fill="#064E3B" stroke="#34D399" strokeWidth="1.5" />
    <text x="90" y="25.5" textAnchor="middle" fill="#6EE7B7" fontFamily="monospace" fontSize="8.5" fontWeight="800">
      CD
    </text>

    <path
      d="M36 42C22.5 42 15 50 15 60C15 70 22.5 78 36 78C49 78 71 42 84 42C97.5 42 105 50 105 60C105 70 97.5 78 84 78C71 78 49 42 36 42Z"
      stroke="url(#cdHighlight)"
      strokeWidth="13"
      strokeOpacity="0.25"
      strokeLinecap="round"
    />

    <path
      d="M36 42C22.5 42 15 50 15 60C15 70 22.5 78 36 78C49 78 71 42 84 42C97.5 42 105 50 105 60C105 70 97.5 78 84 78C71 78 49 42 36 42Z"
      stroke="url(#ciLoop)"
      strokeWidth="8.5"
      strokeLinecap="round"
    />

    <path d="M32 37L39 42L32 47" stroke="#A5F3FC" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M88 73L81 78L88 83" stroke="#6EE7B7" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />

    <circle cx="34" cy="60" r="9.5" fill="#083344" stroke="#22D3EE" strokeWidth="2.5" />
    <circle cx="34" cy="60" r="4" fill="#67E8F9" />

    <circle cx="86" cy="60" r="9.5" fill="#064E3B" stroke="#34D399" strokeWidth="2.5" />
    <path
      d="M82 60.2L84.8 63L90.5 57.3"
      stroke="#6EE7B7"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <circle cx="60" cy="60" r="12" fill="#090D16" stroke="#C084FC" strokeWidth="2.8" />
    <path d="M60 53L66 60L60 67L54 60L60 53Z" fill="#A855F7" stroke="#F3E8FF" strokeWidth="1.2" />

    <circle cx="30" cy="95" r="4" fill="#22D3EE" />
    <circle cx="60" cy="95" r="4" fill="#A855F7" />
    <circle cx="90" cy="95" r="4" fill="#34D399" />
  </svg>
);
