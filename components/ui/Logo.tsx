import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  light?: boolean;
}

export default function Logo({ className = '', showText = true, light = false }: LogoProps) {
  const primaryColor = light ? 'text-white' : 'text-green-800';
  const secondaryColor = light ? 'text-green-200' : 'text-green-700';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* 3D Green Box Icon representing the logo */}
      <svg
        width="46"
        height="40"
        viewBox="0 0 110 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Top/Back inside walls of the box */}
        <path d="M50 5 L95 28 L50 50 L5 28 Z" fill="#166534" />
        <path d="M50 18 L78 32 L50 45 L22 32 Z" fill="#14532d" />
        
        {/* Left Side Face */}
        <path d="M5 28 L50 50 L50 85 L5 63 Z" fill="#15803d" />
        {/* Right Side Face */}
        <path d="M50 50 L95 28 L95 63 L50 85 Z" fill="#166534" />

        {/* Hollow inner top border lines */}
        <path d="M5 28 L50 5 M95 28 L50 5" stroke="#14532d" strokeWidth="2" />
        <path d="M50 50 L50 85" stroke="#14532d" strokeWidth="2" />

        {/* Front-left Face '0' */}
        <rect x="20" y="44" width="10" height="18" rx="5" stroke="white" strokeWidth="3" transform="skewY(24) translate(-4, -14)" />

        {/* Front-right Face '1 1' (two vertical slots/bars) */}
        <line x1="68" y1="48" x2="68" y2="66" stroke="white" strokeWidth="3.5" transform="skewY(-24) translate(4, 18)" />
        <line x1="76" y1="48" x2="76" y2="66" stroke="white" strokeWidth="3.5" transform="skewY(-24) translate(4, 18)" />
      </svg>

      {showText && (
        <div className="flex flex-col text-left select-none">
          <span className={`font-black text-xl leading-none tracking-tight ${primaryColor}`}>
            robótica
          </span>
          <span className={`font-extrabold text-lg leading-tight tracking-wide ${secondaryColor}`}>
            sustentável
          </span>
        </div>
      )}
    </div>
  );
}
