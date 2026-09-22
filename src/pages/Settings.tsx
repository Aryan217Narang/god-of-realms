import React, { useState, useRef } from 'react';
import type { AppState, SubjectId, TimeFormat } from '../types';
import { AncientJournalPanel } from '../components/journal/AncientJournalPanel';
import { Volume2, VolumeX, Sun, Moon, Download, Upload, Sparkles, Sliders, BookOpen, Clock, Cloud, CloudUpload, CloudDownload, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { getTotalMinutesForPeriod, formatTime } from '../utils/gameLogic';

interface SettingsProps {
  state: AppState;
  onUpdateSettings: (updates: Partial<AppState['settings']>) => void;
  onResetData?: () => void;
  onClearToday?: () => Promise<boolean> | void;
  onLogSessionDirectly?: (subjectId: SubjectId, minutes: number, buildTarget?: string) => Promise<boolean>;
  onExportData: () => string;
  onImportData: (json: string) => boolean;
  cloudStatus?: 'connected' | 'syncing' | 'offline' | 'local';
  onPushToCloud?: () => Promise<boolean>;
  onPullFromCloud?: () => Promise<boolean>;
  user?: { id: string; username: string; email: string } | null;
}

const SUBJECT_IDS: SubjectId[] = ['daa', 'os', 'nosql', 'hda_cognitive', 'gv'];

export const Settings: React.FC<SettingsProps> = ({
  state,
  onUpdateSettings,
  onResetData,
  onClearToday,
  onLogSessionDirectly,
  onExportData,
  onImportData,
  cloudStatus = 'local',
  onPushToCloud,
  onPullFromCloud,
  user,
}) => {
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [manualSubject, setManualSubject] = useState<SubjectId>('nosql');
  const [manualMinutes, setManualMinutes] = useState<number>(105);
  const [manualProject, setManualProject] = useState<string>('Restoring Neon Data Spires');
  const [isLoggingManual, setIsLoggingManual] = useState<boolean>(false);
  const [manualLogMsg, setManualLogMsg] = useState<string | null>(null);
  const [clearMsg, setClearMsg] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [confirmClearToday, setConfirmClearToday] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const s = state.settings;
  const todayMin = getTotalMinutesForPeriod(state.sessions, 'today');

  const handleExport = () => {
    const json = onExportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `god-of-realms-chronicles-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const success = onImportData(text);
      setImportStatus(success ? 'success' : 'error');
      setTimeout(() => setImportStatus('idle'), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 md:p-8 w-full animate-fade-up max-w-7xl mx-auto bg-[#fff5f8] text-slate-900">
      {/* Header */}
      <div className="mb-8 border-b-2 border-pink-200 pb-5">
        <div className="flex items-center gap-2 mb-1 text-[10px] font-pixel text-pink-600 uppercase tracking-wider">
          <Sliders className="w-4 h-4 text-pink-500" />
          <span>Workshop of the Chronicler</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-pixel-heading text-pink-950">
          SETTINGS & CONFIGURATION
        </h1>
        <p className="text-slate-600 text-sm font-pixel mt-1">
          Fine-tune the flow of study time, configure realm inscriptions, toggle audio/animations, and preserve your data.
        </p>
      </div>

      {/* Responsive Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Timer & Ritual Preferences */}
        <div className="space-y-8">
          {/* Pomodoro Timer Configuration */}
          <AncientJournalPanel
            variant="stone"
            className="border-pink-300 shadow-[4px_4px_0px_#fbcfe8]"
          >
            <div className="mb-4 border-b border-pink-200 pb-3">
              <h3 className="text-sm font-pixel-heading text-pink-950">
                POMODORO TIMER SETTINGS
              </h3>
              <p className="text-xs font-pixel text-slate-500">
                Configure standard focus cycles and respite intervals
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div className="bg-[#fff0f5] p-3 rounded border border-pink-200 shadow-[2px_2px_0px_#fce7f3]">
                <label className="block text-xs font-pixel text-slate-700 mb-1.5 font-bold">
                  Focus Duration
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={s.studyDurationMinutes}
                    onChange={e => onUpdateSettings({ studyDurationMinutes: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-white border-2 border-pink-300 rounded px-3 py-1.5 text-slate-900 font-mono text-xs focus:border-pink-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500 font-pixel">min</span>
                </div>
              </div>

              <div className="bg-[#fff0f5] p-3 rounded border border-pink-200 shadow-[2px_2px_0px_#fce7f3]">
                <label className="block text-xs font-pixel text-slate-700 mb-1.5 font-bold">
                  Short Respite
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={s.shortBreakMinutes}
                    onChange={e => onUpdateSettings({ shortBreakMinutes: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-white border-2 border-pink-300 rounded px-3 py-1.5 text-slate-900 font-mono text-xs focus:border-pink-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500 font-pixel">min</span>
                </div>
              </div>

              <div className="bg-[#fff0f5] p-3 rounded border border-pink-200 shadow-[2px_2px_0px_#fce7f3]">
                <label className="block text-xs font-pixel text-slate-700 mb-1.5 font-bold">
                  Long Respite
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={s.longBreakMinutes}
                    onChange={e => onUpdateSettings({ longBreakMinutes: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-white border-2 border-pink-300 rounded px-3 py-1.5 text-slate-900 font-mono text-xs focus:border-pink-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500 font-pixel">min</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-pink-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-pixel text-pink-950 font-bold mb-0.5">
                  Daily Study Goal
                </label>
                <span className="text-xs font-pixel text-slate-500">
                  Target minutes required to fulfill your daily quest
                </span>
              </div>
              <div className="flex items-center gap-2 max-w-xs">
                <input
                  type="number"
                  min={10}
                  max={720}
                  value={s.dailyGoalMinutes}
                  onChange={e => onUpdateSettings({ dailyGoalMinutes: Math.max(1, Number(e.target.value)) })}
                  className="w-24 bg-white border-2 border-pink-300 rounded px-3 py-1.5 text-slate-900 font-mono text-xs focus:border-pink-500 focus:outline-none text-center"
                />
                <span className="text-xs text-slate-500 font-pixel">minutes / day</span>
              </div>
            </div>
          </AncientJournalPanel>

          {/* Sensory & Mystic Preferences */}
          <AncientJournalPanel
            variant="stone"
            className="border-pink-300 shadow-[4px_4px_0px_#fbcfe8]"
          >
            <div className="mb-4 border-b border-pink-200 pb-3">
              <h3 className="text-sm font-pixel-heading text-pink-950">
                PREFERENCES & APPEARANCE
              </h3>
              <p className="text-xs font-pixel text-slate-500">
                Audio chimes, animated canvas physics, and lighting
              </p>
            </div>

            <div className="space-y-4 divide-y divide-pink-100">
              {/* Sound */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-pink-50 border border-pink-300 flex items-center justify-center">
                    {s.soundEnabled ? <Volume2 className="w-4 h-4 text-pink-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div>
                    <span className="text-slate-900 font-pixel text-xs block font-bold">Sound Effects</span>
                    <span className="text-[11px] font-pixel text-slate-500">Audio chime on session completion</span>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ soundEnabled: !s.soundEnabled })}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer border ${
                    s.soundEnabled ? 'bg-pink-500 border-pink-600' : 'bg-pink-100 border-pink-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform mx-0.5 ${s.soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Canvas Animations */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-pink-50 border border-pink-300 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-pink-500" />
                  </div>
                  <div>
                    <span className="text-slate-900 font-pixel text-xs block font-bold">Canvas Animations</span>
                    <span className="text-[11px] font-pixel text-slate-500">Swaying trees, fireflies, and flowing water</span>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ animationsEnabled: !s.animationsEnabled })}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer border ${
                    s.animationsEnabled ? 'bg-pink-500 border-pink-600' : 'bg-pink-100 border-pink-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform mx-0.5 ${s.animationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Theme Mode: Pink, Dark, White */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-pink-50 border border-pink-300 flex items-center justify-center">
                    {s.theme === 'dark' ? <Moon className="w-4 h-4 text-cyan-400" /> : s.theme === 'white' ? <Sun className="w-4 h-4 text-blue-500" /> : <Sparkles className="w-4 h-4 text-pink-500" />}
                  </div>
                  <div>
                    <span className="text-slate-900 font-pixel text-xs block font-bold">
                      Sanctum Illumination Mode
                    </span>
                    <span className="text-[11px] font-pixel text-slate-500">
                      Current: {s.theme === 'pink' ? '🌸 Pink Fantasy' : s.theme === 'dark' ? '🌙 Dark Obsidian' : '☀️ White Minimalist'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['pink', 'dark', 'white'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onUpdateSettings({ theme: mode })}
                      className={`px-2.5 py-1 text-xs font-pixel rounded border font-bold capitalize transition-all cursor-pointer ${
                        s.theme === mode
                          ? mode === 'pink'
                            ? 'bg-pink-500 text-white border-pink-600 shadow-sm'
                            : mode === 'dark'
                            ? 'bg-slate-800 text-cyan-300 border-cyan-500 shadow-sm'
                            : 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-white border-pink-200 text-slate-600 hover:bg-pink-50'
                      }`}
                    >
                      {mode === 'pink' ? '🌸 Pink' : mode === 'dark' ? '🌙 Dark' : '☀️ White'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Representation Unit: Decimal Hours (2.5h), Hours & Mins (2h 30m), Minutes (150m), Both */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-pink-50 border border-pink-300 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-pink-600" />
                  </div>
                  <div>
                    <span className="text-slate-900 font-pixel text-xs block font-bold">
                      Time Representation Unit
                    </span>
                    <span className="text-[11px] font-sans text-slate-500">
                      Display study time in hours & minutes (e.g. 2hr 56m as 2.56h), hours & mins, or minutes
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'hours_decimal', label: '2.56h (Hours.Mins)' },
                    { id: 'hours_mins', label: '2h 56m' },
                    { id: 'minutes', label: '176m' },
                    { id: 'both', label: '2.56h (176m)' },
                  ].map(fmt => {
                    const currentFormat = s.timeFormat || 'hours_decimal';
                    const active = currentFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => onUpdateSettings({ timeFormat: fmt.id as TimeFormat })}
                        className={`px-2.5 py-1 text-xs font-mono rounded border font-bold transition-all cursor-pointer ${
                          active
                            ? 'bg-pink-500 text-white border-pink-600 shadow-sm'
                            : 'bg-white border-pink-200 text-slate-600 hover:bg-pink-50'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </AncientJournalPanel>
        </div>

        {/* Right Column: Custom Realm Inscriptions & Eternal Archive */}
        <div className="space-y-8">
          {/* Custom Subject Inscriptions */}
          <AncientJournalPanel
            variant="stone"
            className="border-pink-300 shadow-[4px_4px_0px_#fbcfe8]"
          >
            <div className="mb-4 border-b border-pink-200 pb-3">
              <h3 className="text-sm font-pixel-heading text-pink-950">
                CUSTOM REALM INSCRIPTIONS
              </h3>
              <p className="text-xs font-pixel text-slate-500">
                Rename your subjects and short codes to match your curriculum
              </p>
            </div>

            <div className="space-y-3">
              {SUBJECT_IDS.map(id => {
                const subject = state.subjects[id];
                const override = s.subjectOverrides[id];
                return (
                  <div
                    key={id}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#fff0f5] p-2.5 rounded border border-pink-200 shadow-[2px_2px_0px_#fce7f3]"
                  >
                    <div>
                      <label className="block text-[10px] font-pixel text-slate-600 mb-1 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-pink-500" />
                        <span style={{ color: subject.color }} className="font-bold">
                          {subject.shortName}
                        </span>{' '}
                        — Full Title
                      </label>
                      <input
                        type="text"
                        defaultValue={override.name || subject.name}
                        onBlur={e => onUpdateSettings({
                          subjectOverrides: { ...s.subjectOverrides, [id]: { ...override, name: e.target.value } }
                        })}
                        className="w-full bg-white border-2 border-pink-300 rounded px-2.5 py-1 text-slate-900 font-pixel text-xs focus:border-pink-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-pixel text-slate-600 mb-1">
                        Short Tag
                      </label>
                      <input
                        type="text"
                        defaultValue={override.shortName || subject.shortName}
                        onBlur={e => onUpdateSettings({
                          subjectOverrides: { ...s.subjectOverrides, [id]: { ...override, shortName: e.target.value } }
                        })}
                        className="w-full bg-white border-2 border-pink-300 rounded px-2.5 py-1 text-slate-900 font-pixel text-xs focus:border-pink-500 focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </AncientJournalPanel>

          {/* Backup & Portability */}
          <AncientJournalPanel
            variant="stone"
            className="border-pink-300 shadow-[4px_4px_0px_#fbcfe8]"
          >
            <div className="mb-3 border-b border-pink-200 pb-2">
              <h3 className="text-sm font-pixel-heading text-pink-950">
                DATA BACKUP & PORTABILITY
              </h3>
              <p className="text-xs font-pixel text-slate-500">
                Export and restore your persistent study history
              </p>
            </div>

            {/* Cloud Sync & Cross-Device Section */}
            {user ? (
              <div className="mb-5 p-3.5 bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-300 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-pink-600" />
                    <span className="text-xs font-pixel font-bold text-pink-950">Multi-Device Cloud Sync</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    cloudStatus === 'connected' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                    cloudStatus === 'syncing' ? 'bg-amber-100 text-amber-700 border border-amber-300 animate-pulse' :
                    'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}>
                    {cloudStatus === 'connected' ? '● Cloud Connected' :
                     cloudStatus === 'syncing' ? '◌ Syncing...' :
                     '○ Offline Mode'}
                  </span>
                </div>
                <p className="text-[11px] font-pixel text-slate-600 mb-3 leading-relaxed">
                  Active Account: <strong className="text-pink-700">{user.username}</strong> ({user.email}). All your study sessions, realm monuments, and levels automatically synchronize across your phone, laptop, and tablet.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={async () => {
                      if (onPushToCloud) {
                        const ok = await onPushToCloud();
                        setSyncMsg(ok ? '✓ Local study sessions successfully uplinked to cloud database!' : '✗ Cloud push failed. Check connection.');
                        setTimeout(() => setSyncMsg(null), 4000);
                      }
                    }}
                    className="pixel-btn pixel-btn-pink py-1.5 px-3 text-[11px] flex items-center gap-1.5 cursor-pointer"
                    title="Force upload all local study data from this device to cloud"
                  >
                    <CloudUpload className="w-3.5 h-3.5" /> Push to Cloud
                  </button>
                  <button
                    onClick={async () => {
                      if (onPullFromCloud) {
                        const ok = await onPullFromCloud();
                        setSyncMsg(ok ? '✓ Latest cloud data loaded onto this device!' : '✗ Cloud pull failed. Check connection.');
                        setTimeout(() => setSyncMsg(null), 4000);
                      }
                    }}
                    className="pixel-btn pixel-btn-parchment py-1.5 px-3 text-[11px] flex items-center gap-1.5 cursor-pointer"
                    title="Force refresh device with latest cloud data"
                  >
                    <CloudDownload className="w-3.5 h-3.5" /> Pull from Cloud
                  </button>
                </div>
                {syncMsg && (
                  <div className="mt-2 text-[11px] font-pixel font-bold text-pink-700 animate-fade-in">
                    {syncMsg}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4 p-3 bg-pink-50/70 border border-pink-200 rounded text-xs font-pixel text-slate-600 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-pink-400 flex-shrink-0" />
                <span>Log in to an Adventurer Account to enable automatic real-time cloud sync across devices.</span>
              </div>
            )}

            {/* Direct Study Session Recovery / Credit Widget */}
            {onLogSessionDirectly && (
              <div className="mb-5 p-3.5 bg-gradient-to-r from-pink-50 to-amber-50/60 rounded-lg border-2 border-pink-300 shadow-[2px_2px_0px_#fbcfe8]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-4 h-4 text-pink-600" />
                  <h4 className="text-xs font-pixel-heading text-pink-950 font-bold">
                    RECOVER / CREDIT STUDY SESSION
                  </h4>
                </div>
                <p className="text-[11px] font-pixel text-slate-600 mb-3">
                  Instantly credit your study time directly to local storage and sync to the cloud database.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                  <div>
                    <label className="block text-[10px] font-pixel text-slate-700 font-bold mb-1">
                      Realm
                    </label>
                    <select
                      value={manualSubject}
                      onChange={e => setManualSubject(e.target.value as SubjectId)}
                      className="w-full bg-white border border-pink-300 rounded px-2 py-1.5 text-xs font-pixel text-slate-900"
                    >
                      {SUBJECT_IDS.map(id => (
                        <option key={id} value={id}>
                          {state.subjects[id]?.shortName || id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-pixel text-slate-700 font-bold mb-1">
                      Duration (Minutes)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={180}
                        value={manualMinutes}
                        onChange={e => setManualMinutes(Math.max(1, Math.min(180, Number(e.target.value))))}
                        className="w-full bg-white border border-pink-300 rounded px-2 py-1.5 text-xs font-mono text-slate-900"
                      />
                      <span className="text-[10px] font-pixel text-slate-500">m</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-pixel text-slate-700 font-bold mb-1">
                      Quick Preset
                    </label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setManualMinutes(90)}
                        className={`px-1.5 py-1 text-[10px] rounded border font-pixel ${manualMinutes === 90 ? 'bg-pink-600 text-white border-pink-700 font-bold' : 'bg-white text-slate-700 border-pink-200'}`}
                      >
                        1.5h
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualMinutes(105)}
                        className={`px-1.5 py-1 text-[10px] rounded border font-pixel ${manualMinutes === 105 ? 'bg-pink-600 text-white border-pink-700 font-bold' : 'bg-white text-slate-700 border-pink-200'}`}
                      >
                        1h 45m
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualMinutes(120)}
                        className={`px-1.5 py-1 text-[10px] rounded border font-pixel ${manualMinutes === 120 ? 'bg-pink-600 text-white border-pink-700 font-bold' : 'bg-white text-slate-700 border-pink-200'}`}
                      >
                        2.0h
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-[10px] font-pixel text-slate-700 font-bold mb-1">
                    Expedition / Monument Built (Optional)
                  </label>
                  <input
                    type="text"
                    value={manualProject}
                    onChange={e => setManualProject(e.target.value)}
                    placeholder="e.g. Restoring Neon Data Spires"
                    className="w-full bg-white border border-pink-300 rounded px-2.5 py-1.5 text-xs font-pixel text-slate-900 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isLoggingManual}
                    onClick={async () => {
                      setIsLoggingManual(true);
                      try {
                        const ok = await onLogSessionDirectly(manualSubject, manualMinutes, manualProject);
                        setManualLogMsg(
                          ok
                            ? `✓ Successfully credited ${manualMinutes}m to ${state.subjects[manualSubject]?.shortName} and uploaded to cloud database!`
                            : `✓ Credited ${manualMinutes}m locally (cloud offline).`
                        );
                        setTimeout(() => setManualLogMsg(null), 5000);
                      } finally {
                        setIsLoggingManual(false);
                      }
                    }}
                    className="pixel-btn pixel-btn-green py-1.5 px-3 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isLoggingManual ? 'Recording & Uplinking...' : `Log ${manualMinutes}m & Sync to Cloud`}</span>
                  </button>
                </div>

                {manualLogMsg && (
                  <div className="mt-2 text-xs font-pixel font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 p-2 rounded animate-fade-in">
                    {manualLogMsg}
                  </div>
                )}
              </div>
            )}

            <p className="text-xs font-pixel text-slate-600 mb-4 leading-relaxed">
              All progress, relic awakenings, and session timestamps also reside safely within your browser's persistent offline storage. You can export or import your data JSON backup anytime.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExport}
                className="pixel-btn pixel-btn-pink py-2 text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export JSON Backup
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="pixel-btn pixel-btn-parchment py-2 text-xs flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Import JSON Backup
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </div>

            {importStatus !== 'idle' && (
              <div className={`mt-3 text-xs font-pixel p-2.5 rounded border ${
                importStatus === 'success'
                  ? 'bg-pink-100 border-pink-400 text-pink-700 font-bold'
                  : 'bg-red-100 border-red-400 text-red-700 font-bold'
              }`}>
                {importStatus === 'success'
                  ? '✓ Data restored successfully!'
                  : '✗ Import failed — invalid JSON format.'}
              </div>
            )}

            {/* Danger Zone: Session Clearing & Factory Reset */}
            <div className="mt-6 pt-5 border-t-2 border-dashed border-red-200">
              <div className="flex items-center gap-1.5 mb-1.5 text-red-900 font-pixel font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>DATA RESET & CLEAR ACTIONS</span>
              </div>
              <p className="text-[11px] font-pixel text-slate-600 mb-3">
                Wipe today's study records, or reset all your realm chronicles and progress back to factory defaults.
              </p>

              <div className="flex flex-wrap gap-2.5">
                {onClearToday && confirmClearToday ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isClearing}
                      onClick={async () => {
                        setIsClearing(true);
                        try {
                          const ok = await onClearToday();
                          const msg = ok !== false
                            ? "✓ Today's study sessions cleared locally and from cloud!"
                            : "✗ Cleared locally; cloud sync failed.";
                          setClearMsg(msg);
                          setSyncMsg(msg);
                        } catch {
                          const err = "✗ An error occurred while clearing sessions.";
                          setClearMsg(err);
                          setSyncMsg(err);
                        } finally {
                          setIsClearing(false);
                          setConfirmClearToday(false);
                          setTimeout(() => setClearMsg(null), 5000);
                          setTimeout(() => setSyncMsg(null), 5000);
                        }
                      }}
                      className="pixel-btn bg-amber-200 border-amber-400 text-amber-950 hover:bg-amber-300 py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer font-bold animate-pulse"
                      title="Click to wipe today's study records"
                    >
                      <Trash2 className={`w-3.5 h-3.5 text-amber-800 ${isClearing ? 'animate-spin' : ''}`} />
                      <span>{isClearing ? "Clearing Now..." : `⚠️ Confirm Wipe Today (${todayMin > 0 ? formatTime(todayMin, s.timeFormat || 'hours_decimal') : '0h'})`}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isClearing}
                      onClick={() => setConfirmClearToday(false)}
                      className="pixel-btn bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 py-2 px-2.5 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : onClearToday ? (
                  <button
                    type="button"
                    disabled={isClearing}
                    onClick={() => setConfirmClearToday(true)}
                    className="pixel-btn bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200 py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer font-bold transition-colors"
                    title="Clear today's study sessions recorded today"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>Clear Today's Study {todayMin > 0 ? `(${formatTime(todayMin, s.timeFormat || 'hours_decimal')})` : ''}</span>
                  </button>
                ) : null}

                {onResetData && (
                  <button
                    type="button"
                    disabled={isClearing}
                    onClick={() => {
                      if (window.confirm("⚠️ DANGER: Are you sure you want to reset all realm progress and data? This will reset all study sessions, levels, elements, and achievements back to defaults. This action cannot be undone!")) {
                        onResetData();
                        const msg = "✓ All realm data has been reset to defaults.";
                        setClearMsg(msg);
                        setSyncMsg(msg);
                        setTimeout(() => setClearMsg(null), 5000);
                        setTimeout(() => setSyncMsg(null), 5000);
                      }
                    }}
                    className="pixel-btn bg-red-100 border-red-400 text-red-800 hover:bg-red-200 py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer font-bold transition-colors"
                    title="Reset all realm progress and data"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-red-600" />
                    <span>Reset All Data</span>
                  </button>
                )}
              </div>

              {clearMsg && (
                <div className={`mt-3 p-2.5 text-xs font-pixel font-bold rounded border animate-fade-in ${
                  clearMsg.startsWith('✓')
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}>
                  {clearMsg}
                </div>
              )}
            </div>
          </AncientJournalPanel>
        </div>
      </div>
    </div>
  );
};
