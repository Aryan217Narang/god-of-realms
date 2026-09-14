import React from 'react';

interface ProgressBarProps {
  value: number; // 0-1
  subjectId?: string;
  className?: string;
  height?: string;
  showLabel?: boolean;
  label?: string;
  color?: string;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value, subjectId, className = '', height = 'h-2', showLabel = false, label, color, animated = true
}) => {
  const pct = Math.min(100, Math.max(0, value * 100));
  
  const getBarClass = () => {
    if (color) return '';
    if (subjectId === 'daa') return 'progress-daa';
    if (subjectId === 'os') return 'progress-os';
    if (subjectId === 'nosql') return 'progress-nosql';
    if (subjectId === 'hda_cognitive') return 'progress-hda';
    if (subjectId === 'gv') return 'progress-gv';
    return 'bg-gradient-to-r from-amber-500 to-yellow-400';
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{label || 'Progress'}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className={`w-full ${height} bg-pink-100 rounded-full overflow-hidden border border-pink-200`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${getBarClass()}`}
          style={{
            width: `${pct}%`,
            backgroundColor: color || undefined,
            boxShadow: animated ? `0 0 8px currentColor` : undefined,
          }}
        />
      </div>
    </div>
  );
};

interface StatBadgeProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  small?: boolean;
}

export const StatBadge: React.FC<StatBadgeProps> = ({ label, value, icon, color = 'text-slate-700', small = false }) => (
  <div className={`flex flex-col gap-0.5 ${small ? '' : ''}`}>
    <span className={`${small ? 'text-xs' : 'text-xs'} text-slate-500 uppercase tracking-wider pixel-font`}>{label}</span>
    <span className={`${small ? 'text-sm' : 'text-base'} font-bold ${color} pixel-font flex items-center gap-1`}>
      {icon && <span>{icon}</span>}
      {value}
    </span>
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'pixel';
  size?: 'sm' | 'md' | 'lg';
  subjectId?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', subjectId, children, className = '', ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const getVariantClasses = () => {
    if (variant === 'pixel') {
      const colorMap: Record<string, string> = {
        daa: 'bg-green-600 hover:bg-green-500 border-green-400 text-white',
        os: 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white',
        nosql: 'bg-pink-600 hover:bg-pink-500 border-pink-400 text-white',
        hda_cognitive: 'bg-purple-600 hover:bg-purple-500 border-purple-400 text-white',
        gv: 'bg-orange-600 hover:bg-orange-500 border-orange-400 text-white',
      };
      return `${colorMap[subjectId || 'daa']} border-2 border-b-4 active:border-b-2 active:translate-y-0.5 font-bold pixel-font`;
    }
    if (variant === 'primary') return 'bg-pink-500 hover:bg-pink-600 text-white font-bold border-2 border-pink-600 border-b-4 active:border-b-2 active:translate-y-0.5 pixel-font shadow-sm';
    if (variant === 'secondary') return 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-2 border-pink-300 pixel-font';
    if (variant === 'danger') return 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-700 pixel-font';
    if (variant === 'ghost') return 'bg-transparent hover:bg-pink-50 text-slate-600 hover:text-pink-700 pixel-font';
    return '';
  };

  return (
    <button
      className={`rounded transition-all duration-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${getVariantClasses()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface PixelCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: string;
  onClick?: () => void;
}

export const PixelCard: React.FC<PixelCardProps> = ({ children, className = '', glow, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white border-2 border-pink-200 shadow-[3px_3px_0px_#fbcfe8] rounded-lg p-4 text-slate-800 ${glow ? `box-glow-${glow}` : ''} ${onClick ? 'cursor-pointer realm-card' : ''} ${className}`}
  >
    {children}
  </div>
);

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  const colors = {
    success: 'bg-pink-50 border-pink-400 text-pink-900 shadow-[3px_3px_0px_#fbcfe8]',
    info: 'bg-white border-pink-300 text-pink-800 shadow-[3px_3px_0px_#fbcfe8]',
    warning: 'bg-amber-50 border-amber-400 text-amber-900 shadow-[3px_3px_0px_#fde68a]',
  };
  
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border-2 ${colors[type]} pixel-font text-sm max-w-xs shadow-xl`}>
      {message}
    </div>
  );
};

// Need to import useEffect
import { useEffect } from 'react';
