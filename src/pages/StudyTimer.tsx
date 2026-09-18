import React, { useEffect, useState, useRef } from 'react';
import type { AppState, SubjectId } from '../types';
import { formatSeconds, formatMinutes, getLevelProgress } from '../utils/gameLogic';
import { AncientJournalPanel } from '../components/journal/AncientJournalPanel';
import { PixelRealmScene } from '../components/journal/PixelRealmScene';
import { RelicDisplay } from '../components/journal/RelicDisplay';
import { VineDecoration } from '../components/journal/VineDecoration';
import { ProgressBar } from '../components/ui';
import { REALM_PRESETS, getRandomRealmPreset } from '../constants/presets';
import { soundManager } from '../utils/audio';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Coffee,
  Flame,
  Star,
  Sparkles,
  Hammer,
  Dices,
  Pencil,
  Check,
  AppWindow,
  VolumeX,
} from 'lucide-react';

interface TimerProps {
  state: AppState;
  initialSubjectId?: SubjectId;
  onStartTimer: (subjectId: SubjectId, buildTarget?: string) => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onComplete: (minutes: number) => void;
  onStartBreak: (type: 'shortBreak' | 'longBreak') => void;
  getElapsedMs: () => number;
  getRemainingMs: () => number;
  showMiniTimer?: boolean;
  onToggleMiniTimer?: () => void;
}


const SUBJECT_IDS: SubjectId[] = ['daa', 'os', 'nosql', 'hda_cognitive', 'gv'];

const SUBJECT_THEMES: Record<SubjectId, { short: string; color: string; relic: string; shrine: string }> = {
  daa: { short: 'Tree Realm (DAA)', color: '#16a34a', relic: 'Algorithmic Axe', shrine: 'Great Tree & Forest Paths' },
  os: { short: 'Mountain Realm (OS)', color: '#0284c7', relic: 'System Guardian Hammer', shrine: 'Snowy Peak & Kernel Campfire' },
  nosql: { short: 'City Ruins (NoSQL)', color: '#db2777', relic: 'Data Relic Blade', shrine: 'Sunken Vault & Neon Spires' },
  hda_cognitive: { short: 'Sanctuary (HDA & CI)', color: '#9333ea', relic: 'Mind Seeker Staff', shrine: 'Healing Lotus & Mind Arch' },
  gv: { short: 'Floating Isles (GV)', color: '#ea580c', relic: 'Connector Spear', shrine: 'Sky Observatory & Windmill' },
};

export const StudyTimer: React.FC<TimerProps> = ({
  state,
  initialSubjectId,
  onStartTimer,
  onPause,
  onResume,
  onReset,
  onComplete,
  onStartBreak,
  getElapsedMs,
  getRemainingMs,
  showMiniTimer,
  onToggleMiniTimer,
}) => {

  // Controlled realm selection: defaults to initialSubjectId or stored or 'daa'
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(
    initialSubjectId || state.timer.selectedSubject || 'daa'
  );

  // Randomize preset on initial mount / reload
  const [currentProject, setCurrentProject] = useState<string>(() =>
    getRandomRealmPreset(initialSubjectId || state.timer.selectedSubject || 'daa').name
  );
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [customInputText, setCustomInputText] = useState('');

  const [remainingMs, setRemainingMs] = useState(getRemainingMs());
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastXP, setLastXP] = useState(0);
  const [lastMinutes, setLastMinutes] = useState(0);
  const [lastProject, setLastProject] = useState('');
  const completedRef = useRef(false);

  // Sync initialSubjectId when parent passes it
  useEffect(() => {
    if (initialSubjectId && initialSubjectId !== selectedSubject) {
      setSelectedSubject(initialSubjectId);
      setCurrentProject(getRandomRealmPreset(initialSubjectId).name);
    }
  }, [initialSubjectId]);

  const timer = state.timer;
  const isStudyMode = timer.mode === 'study';
  const isActive = timer.isRunning || timer.isPaused;

  // CRITICAL FIX: When timer is idle, currentSubjectId strictly follows selectedSubject!
  const currentSubjectId = isActive ? (timer.selectedSubject || selectedSubject) : selectedSubject;
  const currentSubject = state.subjects[currentSubjectId];
  const lvl = getLevelProgress(currentSubject.xp);
  const theme = SUBJECT_THEMES[currentSubjectId];

  // Presets available for currently selected realm
  const availablePresets = REALM_PRESETS[currentSubjectId] || REALM_PRESETS.daa;

  // Tick interval for remaining time
  useEffect(() => {
    const interval = setInterval(() => {
      const rem = getRemainingMs();
      setRemainingMs(rem);

      if (rem <= 0 && timer.isRunning && !timer.isPaused && !completedRef.current) {
        completedRef.current = true;
        // Ring 5-second melodic royal chime alarm
        soundManager.playTimerCompletionAlarm(5000);

        if (isStudyMode) {
          const targetMin = Math.max(1, Math.round(timer.targetDurationMs / 60000));
          const rawElapsed = Math.max(1, Math.floor(getElapsedMs() / 60000));
          // Credit full elapsed study time (honoring overtime up to 180 min)
          const elapsed = Math.max(targetMin, Math.min(180, rawElapsed));
          const earned = elapsed + 25; // 1 XP per minute + 25 XP bonus
          setLastMinutes(elapsed);
          setLastXP(earned);
          setLastProject(timer.currentBuildTarget || '');
          onComplete(elapsed);
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 7000);
        } else {
          onReset();
        }
        setTimeout(() => { completedRef.current = false; }, 8000);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [timer, getRemainingMs, getElapsedMs, onComplete, onReset, isStudyMode]);


  const handleSelectRealm = (id: SubjectId) => {
    setSelectedSubject(id);
    // Randomize a fresh preset for the newly chosen realm
    const rand = getRandomRealmPreset(id);
    setCurrentProject(rand.name);
    setIsEditingCustom(false);
  };

  const handleRerollPreset = () => {
    const others = availablePresets.filter(p => p.name !== currentProject);
    const pool = others.length > 0 ? others : availablePresets;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    setCurrentProject(picked.name);
    setIsEditingCustom(false);
  };

  const handleStart = () => {
    completedRef.current = false;
    const finalProject = isEditingCustom && customInputText.trim()
      ? customInputText.trim()
      : currentProject;
    onStartTimer(currentSubjectId, finalProject);
  };

  const totalSecs = Math.ceil(timer.targetDurationMs / 1000);
  const remSecs = Math.max(0, Math.ceil(remainingMs / 1000));
  const elapsedSecs = Math.max(0, totalSecs - remSecs);
  const progress = Math.min(1, elapsedSecs / Math.max(1, totalSecs));

  const modeLabel = timer.mode === 'study' ? 'FOCUS STUDY'
    : timer.mode === 'shortBreak' ? 'SHORT RESPITE' : 'LONG MEDITATION';

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen relative bg-[#fff5f8] text-slate-900">
      {/* Living Vine climbing left panel edge */}
      <VineDecoration position="top-left" flowerColor="#f472b6" className="hidden lg:block opacity-80" />

      {/* ===== LEFT PANEL — Pixel Chronometer & Controls ===== */}
      <div className="w-full lg:w-[500px] xl:w-[540px] flex-shrink-0 p-5 lg:p-7 flex flex-col justify-between border-b lg:border-b-0 lg:border-r-2 border-pink-200 bg-white z-10">
        <div>
          {/* Header */}
          <div className="mb-4 pb-3 border-b border-pink-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-pixel text-pink-600 uppercase tracking-wider font-bold">
                <Sparkles className="w-3 h-3 text-pink-500" />
                <span>Pixel Hourglass</span>
              </div>
              <h1 className="text-xl font-pixel-heading text-slate-800 mt-0.5">
                STUDY EXPEDITION
              </h1>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-pixel text-slate-500 block">Session #{timer.sessionCount + 1}</span>
              <span className="text-xs font-bold font-pixel-heading text-pink-600">{theme.short}</span>
            </div>
          </div>

          {/* Session Completion Celebration Banner */}
          {showCelebration && (
            <div className="mb-4 p-3 rounded border-2 border-pink-400 bg-pink-50 text-center shadow-xl relative overflow-hidden animate-fade-up">
              <div className="text-2xl mb-1 animate-bounce">🎉</div>
              <h3 className="text-sm font-pixel-heading text-pink-700">
                Expedition & Construction Complete!
              </h3>
              {lastProject && (
                <div className="my-1.5 p-2 rounded bg-white border border-pink-300 text-pink-800 text-xs font-bold font-pixel flex items-center justify-center gap-1.5 shadow-sm">
                  <Hammer className="w-3.5 h-3.5 text-pink-500" />
                  <span>"{lastProject}" added to {currentSubject.shortName}!</span>
                </div>
              )}
              <p className="text-xs font-pixel text-slate-600 mt-1">
                +{lastMinutes} minutes logged · +{lastXP} XP awarded!
              </p>
              <div className="mt-1.5 text-[11px] font-pixel text-pink-600 font-bold flex items-center justify-center gap-1">
                <span>🌿 Realm Expanded · Sacred Relic Awakened!</span>
              </div>
              <div className="mt-2.5 flex justify-center">
                <button
                  type="button"
                  onClick={() => soundManager.stopAlarm()}
                  className="px-3 py-1 rounded bg-pink-100 hover:bg-pink-200 border border-pink-400 text-pink-800 text-xs font-pixel font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Silence Alarm</span>
                </button>
              </div>
            </div>
          )}


          {/* Realm Selector Buttons (When Timer Not Active) */}
          {!isActive && (
            <AncientJournalPanel variant="stone" className="mb-4 !p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-pixel text-slate-800 font-bold uppercase flex items-center gap-1">
                  <span>🗺️</span> Select Realm
                </span>
                <span className="text-[10px] font-pixel text-pink-600 font-bold">5 Sacred Worlds</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUBJECT_IDS.map(id => {
                  const sub = state.subjects[id];
                  const sel = currentSubjectId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelectRealm(id)}
                      className={`p-2 rounded border-2 text-left transition-all cursor-pointer relative overflow-hidden ${
                        sel
                          ? 'bg-pink-100 border-pink-500 text-pink-950 shadow-[2px_2px_0px_#f472b6]'
                          : 'bg-white border-pink-200 hover:bg-pink-50 text-slate-700'
                      }`}
                    >
                      {sel && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full animate-ping" />
                      )}
                      <div className="font-bold font-pixel text-xs truncate" style={{ color: sub.color }}>
                        {sub.shortName}
                      </div>
                      <div className="text-[10px] font-pixel text-slate-400 mt-0.5">Lv.{sub.level}</div>
                    </button>
                  );
                })}
              </div>
            </AncientJournalPanel>
          )}

          {/* INLINE SUB-SELECTION: Expedition Project & Build Target (Zero Popups) */}
          {!isActive && (
            <AncientJournalPanel variant="parchment" className="mb-4 !p-3.5 border-2 border-pink-300">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-pink-200">
                <div className="flex items-center gap-1.5 text-xs font-pixel font-bold text-pink-700 uppercase">
                  <Hammer className="w-3.5 h-3.5 text-pink-600" />
                  <span>Construct Target</span>
                </div>
                <button
                  type="button"
                  onClick={handleRerollPreset}
                  className="px-2 py-0.5 text-[10px] font-pixel font-bold text-pink-700 hover:text-pink-900 bg-pink-100 hover:bg-pink-200 border border-pink-300 rounded flex items-center gap-1 transition-colors cursor-pointer"
                  title="Randomize Preset"
                >
                  <Dices className="w-3 h-3 text-pink-600" />
                  <span>Randomize</span>
                </button>
              </div>

              {/* Active Selection Display / Custom Input */}
              {isEditingCustom ? (
                <div className="flex items-center gap-1.5 mb-2.5">
                  <input
                    type="text"
                    value={customInputText}
                    onChange={e => setCustomInputText(e.target.value)}
                    placeholder="e.g. Planting Redwood Grove, Laying stone path..."
                    className="flex-1 px-2.5 py-1.5 text-xs font-pixel bg-white border-2 border-pink-400 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-600"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customInputText.trim()) {
                        setCurrentProject(customInputText.trim());
                      }
                      setIsEditingCustom(false);
                    }}
                    className="px-2 py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded text-xs font-pixel font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="p-2.5 rounded bg-white border border-pink-300 shadow-sm mb-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base flex-shrink-0">
                      {availablePresets.find(p => p.name === currentProject)?.icon || '🔨'}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10px] font-pixel text-pink-600 font-bold uppercase">
                        Building in {currentSubject.shortName}:
                      </div>
                      <div className="text-xs font-pixel font-bold text-slate-800 truncate">
                        {currentProject}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomInputText(currentProject);
                      setIsEditingCustom(true);
                    }}
                    className="p-1 text-slate-400 hover:text-pink-600 transition-colors"
                    title="Edit custom target"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Quick Preset Chips */}
              <div className="text-[10px] font-pixel text-slate-500 mb-1 font-bold">Quick Presets:</div>
              <div className="flex flex-wrap gap-1.5">
                {availablePresets.slice(0, 5).map(preset => {
                  const isChosen = currentProject === preset.name && !isEditingCustom;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setCurrentProject(preset.name);
                        setIsEditingCustom(false);
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-pixel transition-all cursor-pointer flex items-center gap-1 border ${
                        isChosen
                          ? 'bg-pink-500 border-pink-600 text-white font-bold shadow-sm'
                          : 'bg-white border-pink-200 text-slate-700 hover:bg-pink-50'
                      }`}
                    >
                      <span>{preset.icon}</span>
                      <span className="truncate max-w-[130px]">{preset.name.replace(/^(Planting|Carving|Building|Paving|Erecting|Restoring|Laying)\s+/i, '')}</span>
                    </button>
                  );
                })}
              </div>
            </AncientJournalPanel>
          )}

          {/* Chronometer Pedestal Card */}
          <AncientJournalPanel variant="stone" className="mb-4 text-center flex flex-col items-center justify-center relative">
            {/* Mode & Realm Banner */}
            <div className="text-xs font-pixel-heading tracking-wider mb-1.5 text-pink-600 font-bold">
              ✦ {modeLabel} ✦
            </div>

            {/* Active Subject & Relic Shrine Indicator */}
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <span
                className="px-3 py-0.5 rounded text-xs font-pixel font-bold border border-pink-300 bg-pink-50 text-pink-700"
              >
                {currentSubject.shortName} — {currentSubject.realmName}
              </span>
            </div>

            {/* Active Construction Project Banner (When Running) */}
            {isStudyMode && timer.currentBuildTarget && (
              <div className="w-full my-2 p-2.5 rounded bg-pink-50 border-2 border-pink-400 text-left flex items-start gap-2.5 shadow-sm animate-pulse-glow">
                <span className="p-1 rounded bg-pink-500 text-white flex-shrink-0">
                  <Hammer className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] font-pixel text-pink-600">
                    <span className="font-bold uppercase tracking-wider">Active Expedition Target</span>
                    <span className="font-mono font-bold text-pink-700">{Math.round(progress * 100)}%</span>
                  </div>
                  <div className="text-xs font-bold font-pixel text-slate-900 truncate mt-0.5">
                    {timer.currentBuildTarget}
                  </div>
                </div>
              </div>
            )}

            {/* Giant Pixel Countdown Digits */}
            <div className="relative my-1 py-3 px-6 flex items-center justify-center">
              <div
                className="timer-digits text-6xl xl:text-7xl font-pixel-heading tracking-tight tabular-nums select-none text-pink-600 drop-shadow-[0_0_12px_rgba(244,114,182,0.35)]"
              >
                {formatSeconds(remSecs)}
              </div>
            </div>

            {/* Progress Bar & Elapsed Time */}
            <div className="w-full mt-1 mb-3">
              <ProgressBar
                value={progress}
                color="#ec4899"
                height="h-3"
              />
              <div className="flex justify-between text-[11px] font-pixel text-slate-500 mt-1.5 px-0.5 font-bold">
                <span>{formatSeconds(elapsedSecs)} elapsed</span>
                <span>{formatSeconds(remSecs)} remaining</span>
              </div>
            </div>

            {/* Primary Study Controls */}
            <div className="flex items-center justify-center gap-3 w-full flex-wrap">
              {!isActive ? (
                <button
                  type="button"
                  onClick={handleStart}
                  className="pixel-btn pixel-btn-pink w-full py-3 text-sm flex items-center justify-center gap-2 shadow-[3px_3px_0px_#db2777]"
                >
                  <Play className="w-4 h-4 fill-white" />
                  START SESSION
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 w-full">
                  {timer.isPaused ? (
                    <button
                      type="button"
                      onClick={onResume}
                      className="pixel-btn pixel-btn-pink flex-1 py-2.5 flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-4 h-4 fill-white" /> Resume
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onPause}
                      className="pixel-btn pixel-btn-parchment flex-1 py-2.5 flex items-center justify-center gap-1.5"
                    >
                      <Pause className="w-4 h-4" /> Pause
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onReset}
                    className="pixel-btn pixel-btn-forest py-2.5 px-3 flex items-center justify-center gap-1"
                    title="Reset Session"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>

                  {isStudyMode && (
                    <button
                      type="button"
                      onClick={() => {
                        const rawElapsed = Math.floor(getElapsedMs() / 60000);
                        const targetMin = Math.max(1, Math.round(timer.targetDurationMs / 60000));
                        // Credit actual elapsed time up to 180m, or targetMin if elapsed is 0/timer finished
                        const elapsed = Math.max(1, Math.min(180, rawElapsed > 0 ? rawElapsed : targetMin));
                        onComplete(elapsed);
                      }}
                      className="pixel-btn pixel-btn-green flex-1 py-2.5 flex items-center justify-center gap-1"
                    >
                      <SkipForward className="w-4 h-4" /> Complete
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Mini Floating Timer (Clock App Style) toggle */}
            {onToggleMiniTimer && (
              <div className="w-full flex justify-center mt-3 pt-2.5 border-t border-pink-100/60">
                <button
                  type="button"
                  onClick={onToggleMiniTimer}
                  title={showMiniTimer ? 'Dock Floating Mini Clock' : 'Float Mini Clock (Clock App style in top-right)'}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-pixel font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    showMiniTimer
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                      : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-300'
                  }`}
                >
                  <AppWindow className="w-3.5 h-3.5" />
                  <span>{showMiniTimer ? 'Dock Mini Clock' : 'Float Mini Clock (PiP / Top Right)'}</span>
                </button>
              </div>
            )}


            {/* Respite Buttons */}
            {!isActive && (
              <div className="flex items-center justify-center gap-3 mt-3 pt-2.5 border-t border-pink-100 w-full">
                <button
                  type="button"
                  onClick={() => onStartBreak('shortBreak')}
                  className="text-xs font-pixel text-pink-700 hover:text-pink-900 flex items-center gap-1.5 transition-colors cursor-pointer bg-pink-50 px-2.5 py-1 rounded border border-pink-200 font-bold"
                >
                  <Coffee className="w-3 h-3 text-pink-500" /> Short Break ({state.settings.shortBreakMinutes}m)
                </button>
                <button
                  type="button"
                  onClick={() => onStartBreak('longBreak')}
                  className="text-xs font-pixel text-pink-700 hover:text-pink-900 flex items-center gap-1.5 transition-colors cursor-pointer bg-pink-50 px-2.5 py-1 rounded border border-pink-200 font-bold"
                >
                  <Coffee className="w-3 h-3 text-pink-500" /> Long Break ({state.settings.longBreakMinutes}m)
                </button>
              </div>
            )}
          </AncientJournalPanel>

          {/* Active Relic Lore Strip */}
          <div className="p-2.5 bg-pink-50/60 rounded border border-pink-200 flex items-center gap-3">
            <RelicDisplay subjectId={currentSubjectId} level={currentSubject.level} size="sm" showTooltip={false} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-[10px] font-pixel text-pink-600 font-bold">
                <span className="uppercase">Active Sacred Relic</span>
                <span>Tier {Math.min(5, Math.floor(currentSubject.level / 2) + 1)}</span>
              </div>
              <div className="text-xs font-pixel font-bold text-slate-900 truncate">
                {currentSubject.relic}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Level Progress */}
        <div className="pt-3 border-t border-pink-100">
          <div className="flex items-center justify-between text-xs font-pixel text-slate-700 mb-1">
            <span className="flex items-center gap-1 font-bold">
              <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
              {currentSubject.shortName} Level {lvl.level}
            </span>
            <span className="text-pink-600 font-mono font-bold">{formatMinutes(currentSubject.totalMinutes)} studied</span>
          </div>
          <ProgressBar value={lvl.progress} subjectId={currentSubjectId} height="h-1.5" />
        </div>
      </div>

      {/* ===== RIGHT PANEL — Live 3D Isometric Realm Mini-World ===== */}
      <div className="flex-1 min-h-[420px] lg:min-h-screen relative overflow-hidden realm-stage-backdrop flex flex-col justify-between p-4 lg:p-7">
        {/* Top Floating Realm Status Header */}
        <div className="relative z-20 flex items-center justify-between gap-4 realm-status-header border-2 p-3.5 rounded-lg shadow-md backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-pixel-heading px-2 py-0.5 rounded bg-pink-100 border border-pink-400 text-pink-700 font-bold realm-badge">
                {currentSubject.shortName}
              </span>
              <span className="text-xs font-pixel font-bold realm-title">
                {currentSubject.realmName}
              </span>
            </div>
            <div className="text-xs font-pixel text-slate-500 realm-shrine">
              {theme.shrine}
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-pixel">
            <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2.5 py-1 rounded border border-orange-200 font-bold realm-streak-pill">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>{currentSubject.currentStreak}d Streak</span>
            </div>
            <div className="flex items-center gap-1 text-pink-700 bg-pink-50 px-2.5 py-1 rounded border border-pink-200 font-bold realm-level-pill">
              <Star className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
              <span>Level {lvl.level}</span>
            </div>
          </div>
        </div>

        {/* Center Isometric Scene (Strictly follows currentSubjectId) */}
        <div className="flex-1 relative flex items-center justify-center my-3">
          <PixelRealmScene
            key={currentSubjectId}
            subjectId={currentSubjectId}
            level={currentSubject.level}
            totalMinutes={currentSubject.totalMinutes}
            height={480}
            showOverlay={false}
            interactive={true}
          />
        </div>

        {/* Bottom Tips */}
        <div className="relative z-20 text-center text-xs font-pixel realm-tips-bar p-2 rounded border shadow-sm">
          💡 Focus study sessions expand this realm with stepped cliff masonry, crystal waters, and sacred relics!
        </div>
      </div>

    </div>
  );
};
