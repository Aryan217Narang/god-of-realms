import React, { useState } from 'react';
import type { CreateSubjectInput, RealmThemeType, Subject } from '../../types';
import { X, Sparkles, Compass, Shield, Clock, Plus, Check } from 'lucide-react';

interface ConstructRealmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSubject: (input: CreateSubjectInput) => Promise<Subject | null>;
  onCreated?: (subject: Subject) => void;
}

const THEME_OPTIONS: Array<{
  id: RealmThemeType;
  label: string;
  icon: string;
  desc: string;
  defaultColor: string;
}> = [
  { id: 'forest', label: 'Verdant Forest', icon: '🌲', desc: 'Canopies, ancient trees, and recursive groves', defaultColor: '#22c55e' },
  { id: 'mountain', label: 'Alpine Summit', icon: '⛰️', desc: 'Rocky peaks, steep hiking trails, and frozen summits', defaultColor: '#38bdf8' },
  { id: 'ancient-city', label: 'Ancient Stone Ruins', icon: '🏛️', desc: 'Classical colonnades, marble arches, and stone crypts', defaultColor: '#f472b6' },
  { id: 'sanctuary', label: 'Botanical Sanctuary', icon: '🧠', desc: 'Water terraces, glowing lotus flowers, and neural arches', defaultColor: '#c084fc' },
  { id: 'floating-islands', label: 'Sky Archipelago', icon: '🏝️', desc: 'Levitating islands connected by glowing ley bridges', defaultColor: '#fb923c' },
];

const PRESET_COLORS = [
  '#22c55e', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Sky
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#f97316', // Orange
  '#eab308', // Amber Gold
  '#ec4899', // Pink
  '#10b981', // Teal
  '#6366f1', // Indigo
];

export const ConstructRealmModal: React.FC<ConstructRealmModalProps> = ({
  isOpen,
  onClose,
  onAddSubject,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [realmName, setRealmName] = useState('');
  const [theme, setTheme] = useState<RealmThemeType>('forest');
  const [color, setColor] = useState('#22c55e');
  const [relic, setRelic] = useState('');
  const [relicLore, setRelicLore] = useState('');
  const [studyGoalMinutes, setStudyGoalMinutes] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!shortName || shortName.length <= 4) {
      // Auto-suggest short abbreviation from capital letters or first word
      const words = val.trim().split(/\s+/);
      let autoShort = '';
      if (words.length > 1) {
        autoShort = words.map(w => w[0]).join('').slice(0, 4).toUpperCase();
      } else if (words[0]) {
        autoShort = words[0].slice(0, 4).toUpperCase();
      }
      setShortName(autoShort);
    }
    if (!realmName || realmName.endsWith('Realm')) {
      setRealmName(val.trim() ? `${val.trim()} Realm` : '');
    }
  };

  const handleThemeChange = (newTheme: RealmThemeType) => {
    setTheme(newTheme);
    const matched = THEME_OPTIONS.find(t => t.id === newTheme);
    if (matched) {
      setColor(matched.defaultColor);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    const trimmedShort = shortName.trim().toUpperCase();

    if (!trimmedName) {
      setErrorMsg('Please enter a subject name.');
      return;
    }
    if (!trimmedShort) {
      setErrorMsg('Please provide a short 2-5 letter realm code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await onAddSubject({
        name: trimmedName,
        shortName: trimmedShort,
        realmName: realmName.trim() || `${trimmedName} Realm`,
        theme,
        color,
        relic: relic.trim(),
        relicLore: relicLore.trim(),
        studyGoalMinutes,
      });

      if (created) {
        if (onCreated) onCreated(created);
        onClose();
      } else {
        setErrorMsg('Failed to construct realm. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error constructing realm.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white border-2 border-pink-400 rounded-xl shadow-[0_0_35px_rgba(236,72,153,0.3)] overflow-hidden animate-pixel-in text-slate-900 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-pink-200 bg-gradient-to-r from-pink-50 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-lg bg-white border border-pink-300 shadow-xs">
              🏛️
            </span>
            <div>
              <h2 className="text-lg font-bold text-pink-700 pixel-font tracking-wide flex items-center gap-2">
                <span>CONSTRUCT NEW REALM</span>
                <Sparkles className="w-4 h-4 text-pink-500" />
              </h2>
              <p className="text-xs text-slate-500 font-pixel mt-0.5">
                Awaken a new academic domain with custom biomes and relics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 font-pixel text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Name & Short Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-pixel text-slate-700 font-bold">
                Subject Name <span className="text-pink-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Machine Learning, Computer Networks, Linear Algebra"
                required
                className="w-full bg-[#fff8fa] border-2 border-pink-300 rounded px-3 py-2 text-slate-900 font-pixel text-xs focus:border-pink-500 focus:outline-none placeholder-slate-400"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-pixel text-slate-700 font-bold">
                Short Code <span className="text-pink-600">*</span>
              </label>
              <input
                type="text"
                value={shortName}
                onChange={e => setShortName(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="e.g. ML, CN, LA"
                required
                className="w-full bg-[#fff8fa] border-2 border-pink-300 rounded px-3 py-2 text-slate-900 font-pixel text-xs focus:border-pink-500 focus:outline-none uppercase font-bold"
              />
            </div>
          </div>

          {/* Realm Title */}
          <div className="space-y-1">
            <label className="block text-xs font-pixel text-slate-700 font-bold">
              Mythic Realm Title
            </label>
            <input
              type="text"
              value={realmName}
              onChange={e => setRealmName(e.target.value)}
              placeholder="e.g. Spire of Neural Synapses, Floating Nexus"
              className="w-full bg-[#fff8fa] border-2 border-pink-300 rounded px-3 py-2 text-slate-900 font-pixel text-xs focus:border-pink-500 focus:outline-none placeholder-slate-400"
            />
          </div>

          {/* Theme Archetype */}
          <div className="space-y-2">
            <label className="block text-xs font-pixel text-slate-700 font-bold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-pink-500" />
              <span>Biome Archetype</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {THEME_OPTIONS.map(opt => {
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleThemeChange(opt.id)}
                    className={`p-2.5 rounded-lg border-2 text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50 shadow-[2px_2px_0px_#f472b6]'
                        : 'border-pink-200 bg-white hover:bg-pink-50/50'
                    }`}
                  >
                    <span className="text-xl p-1 bg-white rounded border border-pink-200 shadow-xs">
                      {opt.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold font-pixel text-pink-950 flex items-center gap-1">
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-pink-600 inline" />}
                      </div>
                      <div className="text-[10px] font-pixel text-slate-500 line-clamp-1 mt-0.5">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Palette Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-pixel text-slate-700 font-bold flex items-center justify-between">
              <span>Aura & Chart Color</span>
              <span className="font-mono text-[11px]" style={{ color }}>{color}</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                    color === c ? 'border-slate-900 scale-110 shadow-md ring-2 ring-pink-400' : 'border-white hover:scale-105'
                  }`}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-7 h-7 rounded border border-pink-300 cursor-pointer p-0 bg-transparent"
                title="Custom Color"
              />
            </div>
          </div>

          {/* Relic & Lore (Optional) */}
          <div className="space-y-3 bg-pink-50/60 p-3.5 rounded-lg border border-pink-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-pixel text-slate-700 font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3 text-pink-500" />
                  <span>Sacred Relic Name (Optional)</span>
                </label>
                <input
                  type="text"
                  value={relic}
                  onChange={e => setRelic(e.target.value)}
                  placeholder="e.g. Prism of Logic, Vector Blade"
                  className="w-full bg-white border border-pink-300 rounded px-2.5 py-1.5 text-slate-900 font-pixel text-xs focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-pixel text-slate-700 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-pink-500" />
                  <span>Daily Goal (Minutes)</span>
                </label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  value={studyGoalMinutes}
                  onChange={e => setStudyGoalMinutes(parseInt(e.target.value) || 60)}
                  className="w-full bg-white border border-pink-300 rounded px-2.5 py-1.5 text-slate-900 font-pixel text-xs focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-pixel text-slate-700 font-bold">
                Relic Lore / Legend (Optional)
              </label>
              <input
                type="text"
                value={relicLore}
                onChange={e => setRelicLore(e.target.value)}
                placeholder="e.g. A shimmering blade forged from abstract mathematical logic."
                className="w-full bg-white border border-pink-300 rounded px-2.5 py-1.5 text-slate-900 font-pixel text-xs focus:border-pink-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-3 bg-white border-2 border-pink-300 rounded-lg shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-pixel font-bold shadow-xs text-sm"
                style={{ backgroundColor: color }}
              >
                {shortName || '??'}
              </div>
              <div>
                <div className="text-xs font-bold font-pixel text-slate-900">
                  {realmName || name || 'Your New Realm'}
                </div>
                <div className="text-[10px] font-pixel text-slate-500">
                  {THEME_OPTIONS.find(t => t.id === theme)?.label} • Goal: {studyGoalMinutes}m/day
                </div>
              </div>
            </div>
            <span
              className="text-[10px] font-pixel font-bold px-2 py-0.5 rounded border uppercase"
              style={{ borderColor: color, color }}
            >
              Custom Realm
            </span>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-pixel text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 text-xs font-pixel font-bold text-white bg-pink-600 hover:bg-pink-700 disabled:opacity-50 rounded border-2 border-pink-700 shadow-[2px_2px_0px_#9d174d] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Awakening Realm...' : 'Awaken Realm'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
