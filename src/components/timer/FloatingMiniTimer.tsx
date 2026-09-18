import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Maximize2, Pin, PinOff, GripHorizontal, Check } from 'lucide-react';
import type { AppState, SubjectId } from '../../types';
import { formatSeconds } from '../../utils/gameLogic';

interface FloatingMiniTimerProps {
  state: AppState;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onComplete?: (minutes: number) => void;
  getElapsedMs?: () => number;
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
  onComplete,
  getElapsedMs,
  onNavigateToTimer,
  onClose,
  getRemainingMs,
}) => {
  const [remMs, setRemMs] = useState(getRemainingMs());
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Draggable position state
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      const defaultX = Math.max(16, window.innerWidth - 290);
      return { x: defaultX, y: 70 };
    }
    return { x: 500, y: 70 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pipWindowRef = useRef<any>(null);

  // Keep fresh references for callbacks and state inside intervals / PiP events
  const timerRef = useRef(state.timer);
  timerRef.current = state.timer;
  const onPauseRef = useRef(onPause);
  onPauseRef.current = onPause;
  const onResumeRef = useRef(onResume);
  onResumeRef.current = onResume;
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const getElapsedMsRef = useRef(getElapsedMs);
  getElapsedMsRef.current = getElapsedMs;
  const getRemainingMsRef = useRef(getRemainingMs);
  getRemainingMsRef.current = getRemainingMs;
  const stateRef = useRef(state);
  stateRef.current = state;

  const handleCompleteSession = () => {
    if (onCompleteRef.current) {
      const rawElapsed = getElapsedMsRef.current ? Math.floor(getElapsedMsRef.current() / 60000) : 0;
      const targetMin = Math.max(1, Math.round(timerRef.current.targetDurationMs / 60000));
      const credited = Math.max(1, Math.min(180, rawElapsed > 0 ? rawElapsed : targetMin));
      onCompleteRef.current(credited);
    } else {
      onResetRef.current();
    }
  };

  const timer = state.timer;
  const currentSubjectId: SubjectId = timer.selectedSubject || 'daa';
  const currentSubject = state.subjects[currentSubjectId];
  const subjectColor = SUBJECT_COLORS[currentSubjectId] || '#ec4899';

  // Tick remaining time every 250ms
  useEffect(() => {
    const interval = setInterval(() => {
      setRemMs(getRemainingMsRef.current());
    }, 250);
    return () => clearInterval(interval);
  }, []);

  const totalSecs = Math.max(1, Math.ceil(timer.targetDurationMs / 1000));
  const remSecs = Math.max(0, Math.ceil(remMs / 1000));
  const progress = Math.min(1, Math.max(0, 1 - remSecs / totalSecs));

  // --- DRAG HANDLING (MOUSE & TOUCH) ---
  const handleDragStart = (clientX: number, clientY: number, target: EventTarget | null) => {
    if ((target as HTMLElement)?.closest('button')) return;
    setIsDragging(true);
    dragOffsetRef.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientX, e.clientY, e.target);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const widgetWidth = isMinimized ? 210 : 270;
      const widgetHeight = isMinimized ? 70 : 310;
      const maxX = Math.max(10, window.innerWidth - widgetWidth - 10);
      const maxY = Math.max(10, window.innerHeight - widgetHeight - 10);

      const newX = Math.min(maxX, Math.max(10, e.clientX - dragOffsetRef.current.x));
      const newY = Math.min(maxY, Math.max(10, e.clientY - dragOffsetRef.current.y));

      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const widgetWidth = isMinimized ? 210 : 270;
        const widgetHeight = isMinimized ? 70 : 310;
        const maxX = Math.max(10, window.innerWidth - widgetWidth - 10);
        const maxY = Math.max(10, window.innerHeight - widgetHeight - 10);

        const newX = Math.min(maxX, Math.max(10, e.touches[0].clientX - dragOffsetRef.current.x));
        const newY = Math.min(maxY, Math.max(10, e.touches[0].clientY - dragOffsetRef.current.y));

        setPosition({ x: newX, y: newY });
      }
    };

    const handleEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isMinimized]);

  // Clean up PiP window on unmount
  useEffect(() => {
    return () => {
      if (pipWindowRef.current) {
        try {
          pipWindowRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // --- PIN ON TOP OF ALL SCREENS (DOCUMENT PICTURE-IN-PICTURE API) ---
  const togglePinOnTop = async () => {
    if (isPinned && pipWindowRef.current) {
      try {
        pipWindowRef.current.close();
      } catch (err) {
        console.warn('Error closing PiP window:', err);
      }
      setIsPinned(false);
      pipWindowRef.current = null;
      return;
    }

    if (typeof window !== 'undefined' && 'documentPictureInPicture' in window) {
      try {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 280,
          height: 330,
        });
        pipWindowRef.current = pipWindow;
        setIsPinned(true);

        pipWindow.document.title = `${currentSubject.shortName} Timer • God of Realms`;

        // Copy styles into PiP window
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

        // Setup PiP container styling
        const isDark = stateRef.current.settings.theme === 'dark';
        pipWindow.document.body.style.margin = '0';
        pipWindow.document.body.style.padding = '0';
        pipWindow.document.body.style.backgroundColor = isDark ? '#090d16' : '#fff5f8';
        pipWindow.document.body.style.color = isDark ? '#f8fafc' : '#0f172a';
        pipWindow.document.body.style.fontFamily = "'Pixelify Sans', cursive, sans-serif";
        pipWindow.document.body.style.overflow = 'hidden';
        pipWindow.document.body.style.boxSizing = 'border-box';
        pipWindow.document.body.style.display = 'flex';
        pipWindow.document.body.style.justifyContent = 'center';
        pipWindow.document.body.style.alignItems = 'center';
        pipWindow.document.body.style.height = '100vh';

        const container = pipWindow.document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.padding = '14px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.justifyContent = 'space-between';
        container.style.alignItems = 'center';
        container.style.boxSizing = 'border-box';
        container.style.textAlign = 'center';

        // Append container directly to PiP body
        pipWindow.document.body.appendChild(container);

        const pipSize = 130;
        const pipStroke = 8;
        const pipR = (pipSize - pipStroke) / 2;
        const pipCircumference = 2 * Math.PI * pipR;

        // Build PiP structure once
        container.innerHTML = `
          <div style="width: 100%; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${isDark ? '#1e293b' : '#fce7f3'}; padding-bottom: 6px; margin-bottom: 4px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${subjectColor};"></span>
              <span style="font-size: 12px; font-weight: bold; color: ${isDark ? '#f8fafc' : '#0f172a'};">${currentSubject.shortName}</span>
            </div>
            <span id="pip-mode-badge" style="font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: ${isDark ? '#1e293b' : '#fdf2f8'}; color: ${subjectColor};">
              ${timerRef.current.mode === 'study' ? 'FOCUS' : 'BREAK'}
            </span>
          </div>

          <div style="position: relative; width: ${pipSize}px; height: ${pipSize}px; display: flex; align-items: center; justify-content: center; margin: 4px auto;">
            <svg width="${pipSize}" height="${pipSize}" style="transform: rotate(-90deg);">
              <circle cx="${pipSize / 2}" cy="${pipSize / 2}" r="${pipR}" stroke="${isDark ? '#1e293b' : '#fce7f3'}" stroke-width="${pipStroke}" fill="none" />
              <circle id="pip-circle" cx="${pipSize / 2}" cy="${pipSize / 2}" r="${pipR}" stroke="${subjectColor}" stroke-width="${pipStroke}" stroke-dasharray="${pipCircumference}" stroke-dashoffset="0" stroke-linecap="round" fill="none" style="transition: stroke-dashoffset 0.3s ease;" />
            </svg>
            <div style="position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <div id="pip-time-text" style="font-size: 26px; font-weight: bold; font-family: monospace; color: ${subjectColor}; letter-spacing: 1px;">
                00:00
              </div>
              <div id="pip-status-text" style="font-size: 9px; color: ${isDark ? '#94a3b8' : '#64748b'}; text-transform: uppercase;">
                ${timerRef.current.isPaused ? 'PAUSED' : timerRef.current.mode}
              </div>
            </div>
          </div>

          ${timerRef.current.currentBuildTarget ? `
            <div style="font-size: 10px; color: ${isDark ? '#94a3b8' : '#64748b'}; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 2px 0;">
              🔨 ${timerRef.current.currentBuildTarget}
            </div>
          ` : ''}

          <div style="display: flex; align-items: center; gap: 6px; width: 100%; margin-top: 6px;">
            <button id="pip-toggle-btn" style="flex: 1; padding: 7px 8px; border-radius: 8px; border: none; background-color: #ec4899; color: white; font-weight: bold; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
              ⏸ Pause
            </button>
            <button id="pip-complete-btn" style="flex: 1; padding: 7px 8px; border-radius: 8px; border: none; background-color: #22c55e; color: white; font-weight: bold; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
              ✓ Complete
            </button>
            <button id="pip-reset-btn" style="padding: 7px 8px; border-radius: 8px; border: 1px solid ${isDark ? '#475569' : '#cbd5e1'}; background: transparent; color: ${isDark ? '#cbd5e1' : '#475569'}; font-size: 11px; cursor: pointer;" title="Reset">
              ↺
            </button>
          </div>
        `;

        const circleEl = container.querySelector('#pip-circle') as SVGCircleElement | null;
        const timeEl = container.querySelector('#pip-time-text') as HTMLElement | null;
        const statusEl = container.querySelector('#pip-status-text') as HTMLElement | null;
        const modeBadge = container.querySelector('#pip-mode-badge') as HTMLElement | null;
        const toggleBtn = container.querySelector('#pip-toggle-btn') as HTMLButtonElement | null;
        const completeBtn = container.querySelector('#pip-complete-btn') as HTMLButtonElement | null;
        const resetBtn = container.querySelector('#pip-reset-btn') as HTMLButtonElement | null;

        if (toggleBtn) {
          toggleBtn.onclick = () => {
            if (timerRef.current.isPaused) {
              onResumeRef.current();
            } else {
              onPauseRef.current();
            }
          };
        }

        if (completeBtn) {
          completeBtn.onclick = () => {
            handleCompleteSession();
          };
        }

        if (resetBtn) {
          resetBtn.onclick = () => {
            onResetRef.current();
          };
        }

        const updatePipDOM = () => {
          if (!pipWindow || pipWindow.closed) return;
          const currentTimer = timerRef.current;
          const currentRemMs = getRemainingMsRef.current();
          const rem = Math.max(0, Math.ceil(currentRemMs / 1000));
          const total = Math.max(1, Math.ceil(currentTimer.targetDurationMs / 1000));
          const prog = Math.min(1, Math.max(0, 1 - rem / total));
          const dashoffset = pipCircumference * (1 - prog);
          const isPaused = currentTimer.isPaused;

          if (circleEl) {
            circleEl.style.strokeDashoffset = `${dashoffset}px`;
          }
          if (timeEl) {
            timeEl.textContent = formatSeconds(rem);
          }
          if (statusEl) {
            statusEl.textContent = isPaused ? 'PAUSED' : currentTimer.mode.toUpperCase();
          }
          if (modeBadge) {
            modeBadge.textContent = currentTimer.mode === 'study' ? 'FOCUS' : 'BREAK';
          }
          if (toggleBtn) {
            toggleBtn.textContent = isPaused ? '▶ Resume' : '⏸ Pause';
            toggleBtn.style.backgroundColor = isPaused ? '#ec4899' : (isDark ? '#334155' : '#475569');
          }
        };

        updatePipDOM();
        const pipInterval = setInterval(updatePipDOM, 250);

        pipWindow.addEventListener('pagehide', () => {
          clearInterval(pipInterval);
          setIsPinned(false);
          pipWindowRef.current = null;
        });
      } catch (err) {
        console.warn('PiP window request rejected or not allowed:', err);
        setIsPinned(false);
      }
    } else {
      // Fallback for browsers that do not support Document PiP
      alert('Always-on-Top desktop pin is supported in Chrome or Edge 116+. The widget is draggable inside this browser window!');
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
      className={`fixed z-[9999] rounded-2xl border-2 overflow-hidden select-none animate-fade-in transition-[width,padding] duration-200 ${
        isDragging
          ? 'shadow-[0_20px_35px_-5px_rgba(0,0,0,0.5)] ring-2 ring-amber-400'
          : 'shadow-[6px_6px_0px_rgba(0,0,0,0.35)]'
      } ${
        isMinimized ? 'w-52 p-2.5' : 'w-64 p-3.5'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        backgroundColor: state.settings.theme === 'dark' ? '#111827' : '#ffffff',
        borderColor: state.settings.theme === 'dark' ? '#f59e0b' : '#f472b6',
        color: state.settings.theme === 'dark' ? '#f8fafc' : '#0f172a',
      }}
    >
      {/* Draggable Top Header Controls */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-pink-200/40 cursor-grab active:cursor-grabbing select-none"
        title="Click & hold to drag anywhere on screen"
      >
        <div className="flex items-center gap-1.5 truncate pointer-events-none">
          <GripHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ backgroundColor: subjectColor }} />
          <span className="text-[11px] font-pixel font-bold truncate">
            {currentSubject.shortName}
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          {/* Always-on-top Desktop Pin Button */}
          <button
            type="button"
            onClick={togglePinOnTop}
            title={isPinned ? 'Close Always-on-Top desktop window' : 'Pin Always-on-Top of all screens (PiP)'}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isPinned
                ? 'text-amber-400 bg-amber-500/20 hover:bg-amber-500/30'
                : 'hover:text-amber-400 hover:bg-slate-800/30'
            }`}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>

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
          <div className="flex items-center justify-center gap-1.5 mt-3 w-full">
            {timer.isPaused ? (
              <button
                type="button"
                onClick={onResume}
                className="flex-1 py-1.5 px-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-pixel font-bold text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onPause}
                className="flex-1 py-1.5 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-pixel font-bold text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer transition-colors"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            )}

            {timer.mode === 'study' && (
              <button
                type="button"
                onClick={handleCompleteSession}
                className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-pixel font-bold text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer transition-colors"
                title="Complete and credit study time"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Complete</span>
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
