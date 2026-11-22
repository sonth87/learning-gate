import React, { useId } from 'react';
import { cn } from '@/utils/cn';

export interface AppLogoProps {
  className?: string;
  size?: number | string;
  style?: React.CSSProperties;
  strokeWidth?: number | string;
}

function useSvgId(prefix: string): string {
  const raw = useId();
  return `${prefix}-${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

/**
 * Monochrome Menu-Bar Glyph for Learning Gate (16px–20px OS chrome)
 */
export const LearningGateGlyph: React.FC<AppLogoProps> = ({ className, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    style={style}
    className={cn('h-4 w-4 select-none', className)}
  >
    <path
      d="M5.5 19.5V11C5.5 7.41015 8.41015 4.5 12 4.5C15.5899 4.5 18.5 7.41015 18.5 11V19.5"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    <path
      d="M12 9.2Q13 12.6 16.4 13.6Q13 14.6 12 18Q11 14.6 7.6 13.6Q11 12.6 12 9.2Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * 0. Learning Gate — Minimalist Portal Arch + Spark
 */
export const LearningGateLogo: React.FC<AppLogoProps> = ({ className, style }) => {
  const id = useSvgId('lg');
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      style={style}
      className={cn('w-full h-full select-none', className)}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="12" y1="8" x2="108" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>
      </defs>

      <rect width="120" height="120" fill={`url(#${id}-bg)`} />

      {/* Minimalist Portal Arch */}
      <path
        d="M35 86V55C35 41.1929 46.1929 30 60 30C73.8071 30 85 41.1929 85 55V86"
        stroke="#FFFFFF"
        strokeWidth="13"
        strokeLinecap="round"
      />

      {/* Soft 4-Point Knowledge Spark */}
      <path
        d="M60 47Q63.4 59.6 76 63Q63.4 66.4 60 79Q56.6 66.4 44 63Q56.6 59.6 60 47Z"
        fill="#FFFFFF"
        opacity="0.6"
      />
    </svg>
  );
};

/**
 * 1. Python Mastery — Minimalist Code Prompt `>_`
 */
export const PyMasteryLogo: React.FC<AppLogoProps> = ({ className, style }) => {
  const id = useSvgId('py');
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      style={style}
      className={cn('w-full h-full select-none', className)}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="12" y1="8" x2="108" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      <rect width="120" height="120" fill={`url(#${id}-bg)`} />

      <path
        d="M34 40L56 60L34 80"
        stroke="#FFFFFF"
        strokeWidth="13.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M64 80H86"
        stroke="#FFFFFF"
        opacity="0.52"
        strokeWidth="13.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * 2. Docker & K8s Mastery — Minimalist 3-Facet Isometric Pod Cube
 */
export const KubeMasteryLogo: React.FC<AppLogoProps> = ({ className, style }) => {
  const id = useSvgId('kube');
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      style={style}
      className={cn('w-full h-full select-none', className)}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="12" y1="8" x2="108" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>

      <rect width="120" height="120" fill={`url(#${id}-bg)`} />

      {/* Top Facet */}
      <polygon
        points="60,30.4 82.5,43.4 60,56.4 37.5,43.4"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      {/* Left Facet */}
      <polygon
        points="34.4,48.8 56.9,61.8 56.9,87.8 34.4,74.8"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinejoin="round"
        opacity="0.68"
      />
      {/* Right Facet */}
      <polygon
        points="63.1,61.8 85.6,48.8 85.6,74.8 63.1,87.8"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinejoin="round"
        opacity="0.4"
      />
    </svg>
  );
};

/**
 * 3. CI/CD Architecture — Minimalist Two-Tone Infinity Loop
 */
export const CicdMasteryLogo: React.FC<AppLogoProps> = ({ className, style }) => {
  const id = useSvgId('cicd');
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      style={style}
      className={cn('w-full h-full select-none', className)}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="12" y1="8" x2="108" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
      </defs>

      <rect width="120" height="120" fill={`url(#${id}-bg)`} />

      {/* Base Continuous Loop */}
      <path
        d="M50.5 50.5A13.44 13.44 0 1 0 50.5 69.5L69.5 50.5A13.44 13.44 0 1 1 69.5 69.5Z"
        stroke="#FFFFFF"
        opacity="0.38"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Primary Symmetric S-Wave Over-Sweep */}
      <path
        d="M27.56 60A13.44 13.44 0 0 1 50.5 50.5L69.5 69.5A13.44 13.44 0 0 0 92.44 60"
        stroke="#FFFFFF"
        strokeWidth="12"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * 4. PMP Mastery — Minimalist Two-Tone Compass Needle
 */
export const PmpMasteryLogo: React.FC<AppLogoProps> = ({ className, style }) => {
  const id = useSvgId('pmp');
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      style={style}
      className={cn('w-full h-full select-none', className)}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="12" y1="8" x2="108" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>

      <rect width="120" height="120" fill={`url(#${id}-bg)`} />

      <circle cx="60" cy="60" r="34" stroke="#FFFFFF" opacity="0.28" strokeWidth="5.5" />

      <g transform="rotate(45 60 60)">
        <polygon
          points="60,29 68,56.5 52,56.5"
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <polygon
          points="60,91 68,63.5 52,63.5"
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinejoin="round"
          opacity="0.46"
        />
      </g>
    </svg>
  );
};

/**
 * 5. Redis Mastery — Minimalist 3-Layer In-Memory Stack
 */
export const RedisMasteryLogo: React.FC<AppLogoProps> = ({ className, style }) => {
  const id = useSvgId('redis');
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      style={style}
      className={cn('w-full h-full select-none', className)}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="12" y1="8" x2="108" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#BE123C" />
        </linearGradient>
      </defs>

      <rect width="120" height="120" fill={`url(#${id}-bg)`} />

      {/* Top Solid Layer */}
      <polygon
        points="60,29.5 88,44.5 60,59.5 32,44.5"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      {/* Middle Layer */}
      <path
        d="M32 59.5L60 74.5L88 59.5"
        stroke="#FFFFFF"
        opacity="0.65"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom Layer */}
      <path
        d="M32 74.5L60 89.5L88 74.5"
        stroke="#FFFFFF"
        opacity="0.36"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
