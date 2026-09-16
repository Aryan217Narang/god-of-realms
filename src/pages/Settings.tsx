import React, { useState, useRef } from 'react';
import type { AppState, SubjectId, TimeFormat } from '../types';
import { AncientJournalPanel } from '../components/journal/AncientJournalPanel';
import { Volume2, VolumeX, Sun, Moon, Download, Upload, Trash2, Sparkles, Sliders, ShieldAlert, BookOpen, Clock, Cloud, CloudUpload, CloudDownload } from 'lucide-react';

interface SettingsProps {
  state: AppState;
  onUpdateSettings: (updates: Partial<AppState['settings']>) => void;
  onResetData: () => void;
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
  onExportData,
  onImportData,
  cloudStatus = 'local',
  onPushToCloud,
  onPullFromCloud,
  user,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const s = state.settings;

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
          </AncientJournalPanel>

          {/* Danger Zone: Data Reset */}
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg relative overflow-hidden shadow-[3px_3px_0px_#fecdd3]">
            <div className="flex items-center gap-2 text-red-700 font-pixel-heading text-xs mb-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>DANGER ZONE: RESET DATA</span>
            </div>

            {!confirmReset ? (
              <div>
                <p className="text-slate-600 text-xs font-pixel mb-3 leading-relaxed">
                  Reset all study logs, return all five realms back to level 1, and wipe stored sessions.
                </p>
                <button
                  onClick={() => setConfirmReset(true)}
                  className="pixel-btn bg-red-100 border-red-400 text-red-700 hover:bg-red-200 py-2 text-xs flex items-center gap-1.5 font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Reset Study Data
                </button>
              </div>
            ) : (
              <div className="p-3 bg-red-100 border border-red-400 rounded">
                <p className="text-red-800 font-pixel text-xs mb-3 font-bold">
                  ⚠️ Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { onResetData(); setConfirmReset(false); }}
                    className="pixel-btn bg-red-600 border-red-700 text-white hover:bg-red-700 py-1.5 text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Yes, Wipe Everything
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="pixel-btn pixel-btn-parchment py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
