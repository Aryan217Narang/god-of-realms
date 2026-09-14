import React from 'react';

export type StatIconType = 'hourglass' | 'flame' | 'chest' | 'trophy' | 'compass' | 'scroll';

interface StatTabletProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: StatIconType;
  color?: string;
  className?: string;
}

export const RuneStatTablet: React.FC<StatTabletProps> = ({
  label,
  value,
  subValue,
  icon,
  color = '#4ade80',
  className = '',
}) => {
  const renderIcon = () => {
    switch (icon) {
      case 'hourglass':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-pink-400">
            <path d="M5 2H19M5 22H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
            <path d="M6 2L12 12L6 22M18 2L12 12L18 22" stroke="#ec4899" strokeWidth="2" strokeLinejoin="miter" />
            <rect x="11" y="11" width="2" height="2" fill="#fef08a" />
            <path d="M9 18H15L12 15Z" fill="#f472b6" />
          </svg>
        );
      case 'flame':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-orange-400">
            <path d="M12 2C9 7 5 11 5 16C5 19.8 8.1 22 12 22C15.9 22 19 19.8 19 16C19 11 15 7 12 2Z" fill="#ea580c" stroke="#f97316" strokeWidth="1.5" />
            <path d="M12 9C10.5 12 8 14 8 17C8 19 9.8 20.5 12 20.5C14.2 20.5 16 19 16 17C16 14 13.5 12 12 9Z" fill="#fef08a" />
          </svg>
        );
      case 'chest':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
            <rect x="3" y="6" width="18" height="14" fill="#1b3824" stroke="#4ade80" strokeWidth="2" />
            <path d="M3 11H21" stroke="#86efac" strokeWidth="2" />
            <circle cx="12" cy="11" r="2" fill="#fef08a" stroke="#1b3824" strokeWidth="1" />
          </svg>
        );
      case 'trophy':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-pink-400">
            <path d="M6 3H18V11C18 14.3 15.3 17 12 17C8.7 17 6 14.3 6 11V3Z" fill="#831843" stroke="#f472b6" strokeWidth="2" />
            <path d="M6 6H3C2 6 2 9 3 10C4 11 6 10 6 10M18 6H21C22 6 22 9 21 10C20 11 18 10 18 10" stroke="#f472b6" strokeWidth="1.5" />
            <path d="M12 17V20M8 21H16" stroke="#f472b6" strokeWidth="2" strokeLinecap="square" />
            <circle cx="12" cy="9" r="2" fill="#fef08a" />
          </svg>
        );
      case 'compass':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
            <circle cx="12" cy="12" r="9" stroke="#4ade80" strokeWidth="2" fill="#0f2419" />
            <polygon points="12,5 15,12 12,19 9,12" fill="#ec4899" stroke="#f472b6" strokeWidth="0.8" />
            <circle cx="12" cy="12" r="2" fill="#fef08a" />
          </svg>
        );
      case 'scroll':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-amber-300">
            <path d="M4 19C4 17.3 5.3 16 7 16H18C19.7 16 21 17.3 21 19C21 20.7 19.7 22 18 22H7C5.3 22 4 20.7 4 19Z" fill="#3d2b1f" stroke="#c4924a" strokeWidth="2" />
            <path d="M4 19V5C4 3.3 5.3 2 7 2H17C18.7 2 20 3.3 20 5V16" stroke="#c4924a" strokeWidth="2" />
            <line x1="8" y1="7" x2="16" y2="7" stroke="#e8ba6e" strokeWidth="1.5" />
            <line x1="8" y1="11" x2="14" y2="11" stroke="#e8ba6e" strokeWidth="1.5" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative rounded-lg border-2 p-3.5 bg-white border-pink-200 shadow-[3px_3px_0px_#fbcfe8] flex items-center gap-3 ${className}`}
    >
      {/* Corner metallic pixel accents */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-pink-400" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-pink-400" />
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-pink-400" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-pink-400" />

      {/* Rune Plaque Icon */}
      <div
        className="w-11 h-11 rounded flex items-center justify-center flex-shrink-0 border-2"
        style={{
          backgroundColor: '#fff0f5',
          borderColor: color,
          boxShadow: `0 0 8px ${color}33`,
        }}
      >
        {renderIcon()}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="text-lg font-pixel-heading tracking-wide leading-tight text-slate-900" style={{ color }}>
          {value}
        </div>
        <div className="text-xs text-pink-600 font-pixel font-bold mt-0.5 truncate uppercase">
          {label}
        </div>
        {subValue && (
          <div className="text-[11px] font-pixel text-slate-500 truncate">
            {subValue}
          </div>
        )}
      </div>
    </div>
  );
};
