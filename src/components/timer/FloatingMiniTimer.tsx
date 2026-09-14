import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Maximize2, ExternalLink } from 'lucide-react';
import type { AppState, SubjectId } from '../../types';
import { formatSeconds } from '../../utils/gameLogic';

interface FloatingMiniTimerProps {
  state: AppState;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onNavigateToTimer: () => void;
  onClose: () => void;
  getRemainingMs: () => number;
}

const SUBJECT_COLORS: Record<SubjectId, string> = {
  daa: '#22c55e',
  os: '#0284c7',
  nosql: '#ec4899',
  hda_cognitive: '#a855f7',
  gv: '#f97316',
};

export const FloatingMiniTimer: React.FC<FloatingMiniTimerProps> = ({
  state,
  onPause,
  onResume,
  onReset,
  onNavigateToTimer,
  onClose,
  getRemainingMs,
}) => {
  const [remMs, setRemMs] = useState(getRemainingMs());
  const [isMinimized, setIsMinimized] = useState(false);

  const timer = state.timer;
  const currentSubjectId: SubjectId = timer.selectedSubject || 'daa';
  const currentSubject = state.subjects[currentSubjectId];
  const subjectColor = SUBJECT_COLORS[currentSubjectId] || '#ec4899';

  // Tick remaining time every 250ms
  useEffect(() => {
    const interval = setInterval(() => {
      setRemMs(getRemainingMs());
    }, 250);
    return () => clearInterval(interval);
  }, [getRemainingMs]);

  const totalSecs = Math.max(1, Math.ceil(timer.targetDurationMs / 1000));
  const remSecs = Math.max(0, Math.ceil(remMs / 1000));
  const progress = Math.min(1, Math.max(0, 1 - remSecs / totalSecs));

  // Native Picture-in-Picture window support (Chrome 111+ / Edge)
  const openNativePiP = async () => {
    if ('documentPictureInPicture' in window) {
      try {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 280,
          height: 310,
        });

        // Copy styles into the PiP window
        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
            const style = document.createElement('style');
            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
          } catch {
            if (styleSheet.href) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = styleSheet.href;
              pipWindow.document.head.appendChild(link);
            }
          }
        });

        // Create container in PiP
        const container = pipWindow.document.createElement('div');
        container.className = `p-4 h-full flex flex-col justify-between items-center text-center select-none theme-${state.settings.theme}`;
        container.style.backgroundColor = state.settings.theme === 'dark' ? '#090d16' : '#fff5f8';
        container.style.color = state.settings.theme === 'dark' ? '#f8fafc' : '#1e1b2e';
        container.style.fontFamily = 'Pixelify Sans, sans-serif';

        const renderPipContent = () => {
          const rem = Math.max(0, Math.ceil(getRemainingMs() / 1000));
          container.innerHTML = `
            <div style="font-size: 11px; font-weight: bold; color: ${subjectColor}; margin-bottom: 4px;">
              ${currentSubject.shortName} · ${timer.mode === 'study' ? 'FOCUS' : 'BREAK'}
            </div>
            <div style="font-size: 42px; font-weight: bold; font-family: monospace; letter-spacing: 1px; color: ${subjectColor};">
              ${formatSeconds(rem)}
            </div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
              ${timer.currentBuildTarget || 'God of Realms Expedition'}
            </div>
          `;
        };

        renderPipContent();
        const pipInterval = setInterval(renderPipContent, 500);
        pipWindow.addEventListener('pagehide', () => clearInterval(pipInterval));
      } catch (err) {
        console.warn('PiP window request rejected or not allowed:', err);
      }
    }
  };

  // Circular SVG ring dimensions
  const size = 130;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      className={`fixed top-16 right-3 md:right-6 z-50 transition-all duration-200 shadow-[6px_6px_0px_rgba(0,0,0,0.3)] rounded-2xl border-2 overflow-hidden select-none animate-fade-in ${
        isMinimized ? 'w-48 p-2.5' : 'w-64 p-4'
      }`}

      style={{
        backgroundColor: state.settings.theme === 'dark' ? '#111827' : '#ffffff',
        borderColor: state.settings.theme === 'dark' ? '#f59e0b' : '#f472b6',
        color: state.settings.theme === 'dark' ? '#f8fafc' : '#0f172a',
      }}
    >
      {/* Top Header Controls */}
      <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-pink-200/40">
        <div className="flex items-center gap-1.5 truncate">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: subjectColor }} />
          <span className="text-[11px] font-pixel font-bold truncate">
            {currentSubject.shortName}
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          {/* Native OS PiP Window button */}
          {'documentPictureInPicture' in window && (
            <button
              type="button"
              onClick={openNativePiP}
              title="Pop out to OS Desktop Window"
              className="p-1 hover:text-amber-500 rounded hover:bg-slate-800/30 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Minimize / Expand */}
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand mini timer' : 'Minimize'}
            className="p-1 hover:text-pink-500 rounded hover:bg-slate-800/30 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Close mini widget */}
          <button
            type="button"
            onClick={onClose}
            title="Close mini timer"
            className="p-1 hover:text-red-500 rounded hover:bg-slate-800/30 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isMinimized ? (
        /* Minimized Compact View */
        <div className="flex items-center justify-between gap-2">
          <div
            onClick={onNavigateToTimer}
            className="font-pixel font-bold text-lg cursor-pointer hover:opacity-80 font-mono"
            style={{ color: subjectColor }}
          >
            {formatSeconds(remSecs)}
          </div>
          <div className="flex items-center gap-1">
            {timer.isPaused ? (
              <button
                onClick={onResume}
                className="p-1.5 rounded-lg bg-pink-500 text-white hover:bg-pink-600 cursor-pointer"
                title="Resume"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                onClick={onPause}
                className="p-1.5 rounded-lg bg-slate-700 text-white hover:bg-slate-600 cursor-pointer"
                title="Pause"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Full Expanded Mini View (Matches Windows Clock App in Screenshot) */
        <div className="flex flex-col items-center">
          {/* Target lore */}
          {timer.currentBuildTarget && (
            <div className="text-[10px] font-pixel text-slate-400 mb-2 truncate max-w-[200px] text-center">
              🔨 {timer.currentBuildTarget}
            </div>
          )}

          {/* Circular Progress Ring */}
          <div
            onClick={onNavigateToTimer}
            className="relative flex items-center justify-center my-2 cursor-pointer group"
            title="Click to open full timer page"
          >
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={state.settings.theme === 'dark' ? '#1e293b' : '#fce7f3'}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Active progress ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={subjectColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-300"
              />
            </svg>

            {/* Centered Countdown Number */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className="text-2xl font-bold font-pixel font-mono group-hover:scale-105 transition-transform"
                style={{ color: subjectColor }}
              >
                {formatSeconds(remSecs)}
              </div>
              <div className="text-[9px] font-pixel text-slate-400 uppercase tracking-widest mt-0.5">
                {timer.mode === 'study' ? 'FOCUS' : 'BREAK'}
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-center gap-2 mt-3 w-full">
            {timer.isPaused ? (
              <button
                type="button"
                onClick={onResume}
                className="flex-1 py-1.5 px-3 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-pixel font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onPause}
                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-pixel font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            )}

            <button
              type="button"
              onClick={onReset}
              className="p-1.5 rounded-lg border border-slate-600 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 cursor-pointer transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
