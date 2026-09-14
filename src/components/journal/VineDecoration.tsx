import React from 'react';

interface VineProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  flowerColor?: string;
  className?: string;
  glow?: boolean;
}

export const VineDecoration: React.FC<VineProps> = ({
  position = 'top-left',
  flowerColor = '#f472b6',
  className = '',
  glow = false,
}) => {
  const glowStyle = glow ? { filter: 'drop-shadow(0 0 6px #4ade80)' } : {};

  if (position === 'top-left') {
    return (
      <div
        className={`absolute -top-2 -left-2 pointer-events-none z-10 animate-sway ${className}`}
        style={glowStyle}
      >
        <svg width="68" height="68" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Main vine stem */}
          <path
            d="M2 2C8 12 14 18 24 22C34 26 42 22 52 30C58 36 62 48 64 60"
            stroke="#2d5a27"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M2 2C8 12 14 18 24 22C34 26 42 22 52 30C58 36 62 48 64 60"
            stroke="#528e38"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Secondary tendril */}
          <path
            d="M24 22C28 14 34 8 44 4"
            stroke="#386641"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M52 30C46 38 40 46 42 56"
            stroke="#386641"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Pixel leaves */}
          <path d="M12 12C16 8 22 10 20 16C18 20 14 18 12 12Z" fill="#6a994e" stroke="#2d5a27" strokeWidth="0.8" />
          <path d="M30 18C36 16 40 20 36 26C32 28 28 24 30 18Z" fill="#4ade80" stroke="#2d5a27" strokeWidth="0.8" />
          <path d="M42 6C48 4 52 8 48 12C44 14 40 10 42 6Z" fill="#6a994e" stroke="#2d5a27" strokeWidth="0.8" />
          <path d="M48 38C54 36 58 40 54 46C50 48 46 44 48 38Z" fill="#528e38" stroke="#2d5a27" strokeWidth="0.8" />
          <path d="M58 52C64 50 66 56 62 60C58 62 56 56 58 52Z" fill="#86efac" stroke="#2d5a27" strokeWidth="0.8" />

          {/* Small blooming fantasy flower */}
          <circle cx="28" cy="24" r="3.5" fill={flowerColor} />
          <circle cx="28" cy="24" r="1.5" fill="#fef08a" />
          <circle cx="50" cy="32" r="3" fill={flowerColor} />
          <circle cx="50" cy="32" r="1.2" fill="#fef08a" />
        </svg>
      </div>
    );
  }

  if (position === 'top-right') {
    return (
      <div
        className={`absolute -top-2 -right-2 pointer-events-none z-10 animate-sway ${className}`}
        style={{ ...glowStyle, transform: 'scaleX(-1)' }}
      >
        <svg width="68" height="68" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 2C8 12 14 18 24 22C34 26 42 22 52 30C58 36 62 48 64 60" stroke="#2d5a27" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M2 2C8 12 14 18 24 22C34 26 42 22 52 30C58 36 62 48 64 60" stroke="#528e38" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M24 22C28 14 34 8 44 4" stroke="#386641" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 12C16 8 22 10 20 16C18 20 14 18 12 12Z" fill="#6a994e" stroke="#2d5a27" strokeWidth="0.8" />
          <path d="M30 18C36 16 40 20 36 26C32 28 28 24 30 18Z" fill="#4ade80" stroke="#2d5a27" strokeWidth="0.8" />
          <circle cx="28" cy="24" r="3.5" fill={flowerColor} />
          <circle cx="28" cy="24" r="1.5" fill="#fef08a" />
        </svg>
      </div>
    );
  }

  if (position === 'bottom-left') {
    return (
      <div
        className={`absolute -bottom-2 -left-2 pointer-events-none z-10 ${className}`}
        style={{ ...glowStyle, transform: 'scaleY(-1)' }}
      >
        <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 2C8 10 14 16 22 20C30 24 38 20 46 28C50 34 52 44 54 52" stroke="#2d5a27" strokeWidth="3" strokeLinecap="round" />
          <path d="M2 2C8 10 14 16 22 20C30 24 38 20 46 28C50 34 52 44 54 52" stroke="#528e38" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 12C16 8 20 10 18 14C16 18 14 16 12 12Z" fill="#6a994e" stroke="#2d5a27" strokeWidth="0.8" />
          <circle cx="22" cy="20" r="3" fill={flowerColor} />
        </svg>
      </div>
    );
  }

  // default bottom-right
  return (
    <div
      className={`absolute -bottom-2 -right-2 pointer-events-none z-10 ${className}`}
      style={{ ...glowStyle, transform: 'scale(-1)' }}
    >
      <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2C8 10 14 16 22 20C30 24 38 20 46 28C50 34 52 44 54 52" stroke="#2d5a27" strokeWidth="3" strokeLinecap="round" />
        <path d="M2 2C8 10 14 16 22 20C30 24 38 20 46 28C50 34 52 44 54 52" stroke="#528e38" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 12C16 8 20 10 18 14C16 18 14 16 12 12Z" fill="#6a994e" stroke="#2d5a27" strokeWidth="0.8" />
        <circle cx="22" cy="20" r="3" fill={flowerColor} />
      </svg>
    </div>
  );
};
