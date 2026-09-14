import React from 'react';
import { VineDecoration } from './VineDecoration';

interface JournalPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'parchment' | 'stone' | 'wood';
  hasVines?: boolean;
  vinePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  flowerColor?: string;
  glowColor?: string;
  onClick?: () => void;
}

export const AncientJournalPanel: React.FC<JournalPanelProps> = ({
  children,
  className = '',
  variant = 'stone',
  hasVines = false,
  vinePosition = 'top-left',
  flowerColor = '#f472b6',
  glowColor,
  onClick,
}) => {
  const bgStyles = {
    parchment: 'journal-panel journal-parchment bg-white border-pink-200 text-slate-800',
    stone: 'journal-panel journal-stone bg-[#fffbfc] border-pink-300 text-slate-900',
    wood: 'journal-panel journal-wood bg-gradient-to-br from-pink-50 to-white border-pink-300 text-slate-900',
  }[variant];

  const customBorderGlow = glowColor
    ? { borderColor: `${glowColor}88`, boxShadow: `4px 4px 0px #f472b6, 0 0 16px ${glowColor}33` }
    : { boxShadow: '4px 4px 0px #fbcfe8' };

  return (
    <div
      onClick={onClick}
      className={`relative rounded-lg border-2 p-5 transition-all duration-200 ${bgStyles} ${
        onClick ? 'cursor-pointer hover:border-pink-500 hover:-translate-y-0.5' : ''
      } ${className}`}
      style={customBorderGlow}
    >
      {/* Pink Pixel Corner Brackets */}
      <div className="corner-bracket absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-pink-400 pointer-events-none z-20" />
      <div className="corner-bracket absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-pink-400 pointer-events-none z-20" />
      <div className="corner-bracket absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-pink-400 pointer-events-none z-20" />
      <div className="corner-bracket absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-pink-400 pointer-events-none z-20" />

      {/* Living Pixel Vine Decoration */}
      {hasVines && (
        <VineDecoration position={vinePosition} flowerColor={flowerColor} />
      )}

      {children}
    </div>
  );
};
