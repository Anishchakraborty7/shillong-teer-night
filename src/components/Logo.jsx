import React from "react";

export function Logo({ size = 38, showText = true, textClass = "" }) {
  return (
    <div className="brand-logo-container" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="brand-logo-svg"
        aria-label="Shillong Teer Night Logo"
      >
        <defs>
          <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="logoNight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Circular badge */}
        <circle cx="24" cy="24" r="22" fill="#0C152B" stroke="#23355E" strokeWidth="1.5" />

        {/* Night Crescent Moon */}
        <path
          d="M 28 8 A 15 15 0 1 0 38 27 A 17 17 0 0 1 28 8 Z"
          fill="url(#logoNight)"
          opacity="0.4"
        />

        {/* Archery Bow Curve */}
        <path
          d="M 12 36 C 14 26 14 22 24 12 C 26 10 28 10 30 11"
          stroke="url(#logoGold)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Bowstring */}
        <line
          x1="12"
          y1="36"
          x2="30"
          y2="11"
          stroke="#94A3B8"
          strokeWidth="0.8"
          strokeDasharray="2 1"
          opacity="0.6"
        />

        {/* Arrow (Teer) Shaft */}
        <line
          x1="15"
          y1="33"
          x2="36"
          y2="12"
          stroke="url(#logoGold)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Teer Arrowhead */}
        <path
          d="M 36 12 L 30 14 L 34 18 Z"
          fill="url(#logoGold)"
          filter="url(#logoGlow)"
        />

        {/* Arrow Fletching */}
        <path
          d="M 15 33 L 13 36 M 17 31 L 15 34 M 14 34 L 16 37"
          stroke="url(#logoGold)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Celestial Night Stars */}
        <circle cx="34" cy="28" r="1.1" fill="#FDE047" opacity="0.85" />
        <circle cx="16" cy="16" r="0.9" fill="#F8FAFC" opacity="0.7" />
        <circle cx="28" cy="38" r="1" fill="#38BDF8" opacity="0.75" />
      </svg>

      {showText && (
        <div className={`brand-text ${textClass}`}>
          <span className="brand-name-main">SHILLONG TEER</span>
          <span className="brand-name-sub">NIGHT</span>
        </div>
      )}
    </div>
  );
}
export default Logo;
