import React from 'react';
import type { ThemeMode } from '../../types';
import { Moon, Sun, Sparkles } from 'lucide-react';

interface ThemeToggleProps {
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  className?: string;
}

const THEMES: { id: ThemeMode; label: string; icon: React.FC<{ className?: string }>; emoji: string }[] = [
  { id: 'pink', label: 'Pink', icon: Sparkles, emoji: '🌸' },
  { id: 'dark', label: 'Dark', icon: Moon, emoji: '🌙' },
  { id: 'white', label: 'White', icon: Sun, emoji: '☀️' },
];

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  currentTheme,
  onSelectTheme,
  className = '',
}) => {
  return (
    <div
      className={`theme-toggle-container flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-lg border-2 border-pink-300 shadow-[2px_2px_0px_rgba(244,114,182,0.6)] select-none transition-all duration-200 ${className}`}
      role="group"
      aria-label="Theme Selector"
    >
      {THEMES.map(th => {
        const active = currentTheme === th.id;
        const Icon = th.icon;

        return (
          <button
            key={th.id}
            type="button"
            onClick={() => onSelectTheme(th.id)}
            title={`Switch to ${th.label} Mode`}
            className={`theme-pill-btn flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-pixel font-bold transition-all duration-150 cursor-pointer ${
              active
                ? th.id === 'pink'
                  ? 'bg-pink-500 text-white shadow-sm border border-pink-600'
                  : th.id === 'dark'
                  ? 'bg-amber-500 text-slate-950 shadow-sm border border-amber-600'
                  : 'bg-slate-900 text-white shadow-sm border border-slate-950'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-pixel">{th.label}</span>
          </button>
        );
      })}
    </div>
  );
};
