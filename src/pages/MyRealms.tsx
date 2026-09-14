import React, { useState } from 'react';
import type { AppState, SubjectId } from '../types';
import { AncientJournalPanel } from '../components/journal/AncientJournalPanel';
import { IsometricRealmPlot } from '../components/journal/IsometricRealmPlot';
import { RelicDisplay } from '../components/journal/RelicDisplay';
import { VineDecoration } from '../components/journal/VineDecoration';
import { ProgressBar } from '../components/ui';
import { formatMinutes, getLevelProgress } from '../utils/gameLogic';
import { Play, LogIn, Star, Flame, Sparkles, Compass, Shield, Scroll } from 'lucide-react';
import type { Page } from '../components/layout/Navigation';

interface MyRealmsProps {
  state: AppState;
  onNavigate: (page: Page, extra?: string) => void;
  onStartStudy: (subjectId: SubjectId) => void;
}

const SUBJECT_IDS: SubjectId[] = ['daa', 'os', 'nosql', 'hda_cognitive', 'gv'];

const REALM_LORE: Record<SubjectId, { subtitle: string; guardian: string; biome: string; nextDiscovery: string }> = {
  daa: {
    subtitle: 'Tree Realm • Ancient Canopy Forest & Algorithmic Foundations',
    guardian: 'Elder Tree Warden',
    biome: 'Dense Enchanted Forest, Alpine Pines & Ancient World Tree',
    nextDiscovery: 'Canopy Bridge to Recursive Heights',
  },
  os: {
    subtitle: 'Mountain Realm • Rocky Summits, Hiking Trails & Glacial Spires',
    guardian: 'Summit Mountain Mountaineer',
    biome: 'Stepped Mountain Cliffs, Switchback Trails & Snowy Peaks',
    nextDiscovery: 'High Summit Watchtower & Observatory',
  },
  nosql: {
    subtitle: 'City Ruins Realm • Ancient Stone Colonnades & Magenta Data Streams',
    guardian: 'Archivist of Lost Records',
    biome: 'Classical Marble Colonnades & Subterranean Data Veins',
    nextDiscovery: 'Sanctum Vault of Distributed Shards',
  },
  hda_cognitive: {
    subtitle: 'Sanctuary Realm • Mind & Healthcare Research Pavilion & Neural Arch',
    guardian: 'Oracle of Mind & Medicine',
    biome: 'Clinical Research Sanctuary, Reflection Pond & Neural Synapse Arch',
    nextDiscovery: 'The Neural Convergence Dais',
  },
  gv: {
    subtitle: 'Floating Islands Realm • Skyward Archipelago & Glowing Vector Bridges',
    guardian: 'Master of Geometric Bridges',
    biome: 'Floating Sky Islands, Celestial Astrolabe & Energy Ley Bridges',
    nextDiscovery: 'Celestial Graph Core & Astrolabe',
  },
};

export const MyRealms: React.FC<MyRealmsProps> = ({ state, onNavigate, onStartStudy }) => {
  const [activeHighlight, setActiveHighlight] = useState<SubjectId>('daa');
  const highlightedSubject = state.subjects[activeHighlight];
  const highlightLvl = getLevelProgress(highlightedSubject.xp);
  const lore = REALM_LORE[activeHighlight];
  const worldDev = Math.min(100, Math.round((highlightedSubject.level / 10) * 100));

  return (
    <div className="p-4 md:p-8 w-full animate-fade-up max-w-7xl mx-auto bg-[#fff5f8] text-slate-900">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b-2 border-pink-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 text-[10px] font-pixel text-pink-600 uppercase tracking-wider">
            <Scroll className="w-4 h-4 text-pink-500" />
            <span>Atlas of Five Worlds</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-pixel-heading text-pink-950">
            THE FIVE SACRED REALMS
          </h1>
          <p className="text-slate-600 text-sm font-pixel mt-1 max-w-2xl">
            Each realm is a living miniature isometric world. Every minute of dedicated study restores the ancient monuments, forges relics, and grows lush vegetation.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white border-2 border-pink-200 px-4 py-2.5 rounded shadow-[3px_3px_0px_#fbcfe8]">
          <Sparkles className="w-4 h-4 text-pink-500" />
          <div className="text-xs font-pixel">
            <span className="text-slate-500 block text-[10px] uppercase">Atlas Status</span>
            <span className="text-pink-600 font-bold">5 of 5 Sanctums Active</span>
          </div>
        </div>
      </div>

      {/* Featured Realm Grand Showcase */}
      <div className="mb-10 relative">
        <AncientJournalPanel
          variant="stone"
          hasVines={true}
          className="overflow-hidden shadow-[4px_4px_0px_#fbcfe8] border-pink-300 !p-0"
        >
          <div className="flex flex-col lg:flex-row">
            {/* Left: Lore, Metrics, Relic Inscription & Launch */}
            <div className="realm-featured-info p-6 md:p-8 lg:w-5/12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r-2 border-pink-200 bg-[#fff8fa] relative">
              <VineDecoration position="top-left" flowerColor="#f472b6" />

              <div>
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className="text-xs font-pixel-heading px-2.5 py-1 rounded border border-pink-300 bg-pink-100 text-pink-700"
                  >
                    {highlightedSubject.shortName} • {lore.guardian}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-pixel text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-300 shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>Tier {Math.min(5, Math.floor(highlightedSubject.level / 2) + 1)}</span>
                  </div>
                </div>

                {/* Realm Name & Subtitle */}
                <h2 className="text-xl md:text-2xl font-pixel-heading text-pink-950 mb-1">
                  {highlightedSubject.realmName}
                </h2>
                <div className="text-xs font-pixel text-pink-600 italic mb-4">
                  {lore.subtitle}
                </div>

                <p className="text-slate-700 text-xs font-pixel leading-relaxed mb-6 bg-white p-3 rounded border border-pink-200 shadow-[2px_2px_0px_#fce7f3]">
                  {highlightedSubject.description}
                </p>

                {/* Relic Preview Card */}
                <div className="mb-6 p-3 bg-white rounded border-2 border-pink-200 flex items-center gap-3.5 shadow-[2px_2px_0px_#fbcfe8]">
                  <RelicDisplay
                    subjectId={activeHighlight}
                    level={highlightedSubject.level}
                    size="md"
                    showTooltip={false}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-pixel text-pink-600">
                      <Shield className="w-3 h-3 text-pink-500" />
                      <span className="uppercase tracking-wide font-bold">Sacred Relic</span>
                    </div>
                    <div className="text-sm font-bold font-pixel text-pink-950 truncate">
                      {highlightedSubject.relic}
                    </div>
                    <div className="text-[11px] font-pixel text-slate-500 line-clamp-1 italic">
                      "{highlightedSubject.relicLore}"
                    </div>
                  </div>
                </div>

                {/* Quick Status Plaque */}
                <div className="grid grid-cols-3 gap-2.5 mb-5">
                  <div className="bg-white p-2.5 rounded text-center border border-pink-200 shadow-[2px_2px_0px_#fce7f3]">
                    <div className="text-sm font-bold font-pixel-heading text-pink-600">
                      Lv.{highlightLvl.level}
                    </div>
                    <div className="text-[9px] text-slate-500 font-pixel uppercase">Level</div>
                  </div>
                  <div className="bg-white p-2.5 rounded text-center border border-pink-200 shadow-[2px_2px_0px_#fce7f3]">
                    <div className="text-sm font-bold font-pixel-mono text-slate-800">
                      {formatMinutes(highlightedSubject.totalMinutes)}
                    </div>
                    <div className="text-[9px] text-slate-500 font-pixel uppercase">Studied</div>
                  </div>
                  <div className="bg-white p-2.5 rounded text-center border border-pink-200 shadow-[2px_2px_0px_#fce7f3]">
                    <div className="text-sm font-bold font-pixel-mono text-rose-500 flex items-center justify-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-rose-500" />{highlightedSubject.currentStreak}d
                    </div>
                    <div className="text-[9px] text-slate-500 font-pixel uppercase">Streak</div>
                  </div>
                </div>

                {/* XP & World Restoration Gauge */}
                <div className="space-y-3 mb-6 bg-white p-3 rounded border border-pink-200 shadow-[2px_2px_0px_#fce7f3]">
                  <div>
                    <div className="flex justify-between text-xs font-pixel text-slate-600 mb-1">
                      <span>XP Progress</span>
                      <span className="text-pink-600 font-mono font-bold">{highlightLvl.currentLevelXp} / {highlightLvl.nextLevelXp} XP</span>
                    </div>
                    <ProgressBar value={highlightLvl.progress} subjectId={activeHighlight} height="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-pixel text-slate-600 mb-1">
                      <span className="flex items-center gap-1 font-bold">
                        <Compass className="w-3 h-3 text-pink-500" />
                        World Restoration
                      </span>
                      <span className="font-bold font-pixel text-pink-600">
                        {worldDev}% Complete
                      </span>
                    </div>
                    <div className="h-2 w-full bg-pink-100 rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-700 bg-gradient-to-r from-pink-400 to-rose-500"
                        style={{ width: `${worldDev}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => onStartStudy(activeHighlight)}
                  className="pixel-btn pixel-btn-pink flex-1 py-2.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Focus Study
                </button>
                <button
                  onClick={() => onNavigate('realm-detail', activeHighlight)}
                  className="pixel-btn pixel-btn-parchment flex-1 py-2.5"
                >
                  <LogIn className="w-3.5 h-3.5" /> Full Sanctum
                </button>
              </div>
            </div>

            {/* Right: 3D Isometric Realm Plot */}
            <div className="realm-stage-backdrop lg:w-7/12 min-h-[360px] lg:min-h-[440px] bg-gradient-to-b from-[#fff0f5] to-[#fdf2f8] relative overflow-hidden flex items-center justify-center">
              <IsometricRealmPlot
                subjectId={activeHighlight}
                level={highlightedSubject.level}
                totalMinutes={highlightedSubject.totalMinutes}
                width={500}
                height={380}
                animated={true}
                showRelic={true}
              />
              <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <div className="realm-status-header bg-white/95 border border-pink-300 px-3 py-1.5 rounded text-xs font-pixel text-pink-800 shadow-[2px_2px_0px_#fbcfe8]">
                  🗺️ Biome: {lore.biome}
                </div>
              </div>
            </div>
          </div>
        </AncientJournalPanel>
      </div>

      {/* Grid of All Five Realms */}
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-pixel-heading text-pink-950 flex items-center gap-2">
          <span>📜</span> ALL FIVE ISOMETRIC WORLDS
        </h3>
        <span className="text-xs font-pixel text-pink-600 font-bold">
          Click any realm to inspect in atlas
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-5">
        {SUBJECT_IDS.map(id => {
          const subject = state.subjects[id];
          const lvl = getLevelProgress(subject.xp);
          const isSelected = activeHighlight === id;
          const realmWorldDev = Math.min(100, Math.round((subject.level / 10) * 100));

          return (
            <div
              key={id}
              onClick={() => setActiveHighlight(id)}
              className={`realm-catalog-card group relative bg-white border-2 rounded-lg overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-[4px_4px_0px_#fbcfe8] ${
                isSelected
                  ? 'border-pink-500 ring-2 ring-pink-400/50 -translate-y-1 shadow-[4px_4px_0px_#f472b6]'
                  : 'border-pink-200 hover:border-pink-400 hover:shadow-[4px_4px_0px_#f472b6]'
              }`}
            >
              {/* Corner pixel accents */}
              <div className="corner-bracket absolute top-1 left-1 w-1.5 h-1.5 bg-pink-400 pointer-events-none z-20" />
              <div className="corner-bracket absolute top-1 right-1 w-1.5 h-1.5 bg-pink-400 pointer-events-none z-20" />

              {/* Miniature Isometric Scene preview */}
              <div className="realm-preview-stage relative h-44 bg-gradient-to-b from-[#fff5f8] to-[#fce7f3] overflow-hidden flex items-center justify-center border-b border-pink-100">
                <IsometricRealmPlot
                  subjectId={id}
                  level={subject.level}
                  totalMinutes={subject.totalMinutes}
                  width={260}
                  height={170}
                  animated={true}
                  showRelic={true}
                />

                {/* Level badge */}
                <div className="absolute top-2 right-2 bg-white/90 border border-pink-300 px-2 py-0.5 rounded text-[9px] font-pixel-heading text-pink-700 flex items-center gap-1 shadow">
                  <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                  <span>Lv.{subject.level}</span>
                </div>

                {/* Relic badge in corner */}
                <div className="absolute bottom-2 right-2 z-10">
                  <RelicDisplay subjectId={id} level={subject.level} size="sm" showTooltip={true} />
                </div>
              </div>

              {/* Information */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-[9px] font-pixel-heading px-2 py-0.5 rounded border border-pink-300 bg-pink-50 text-pink-700"
                    >
                      {subject.shortName}
                    </span>
                    <span className="text-[11px] font-pixel text-slate-700 font-bold font-mono">
                      {formatMinutes(subject.totalMinutes)}
                    </span>
                  </div>

                  <h4 className="font-pixel-heading text-xs text-pink-950 mb-1 truncate group-hover:text-pink-600 transition-colors">
                    {subject.realmName}
                  </h4>

                  <div className="text-[10px] font-pixel text-slate-500 italic mb-3 truncate">
                    {subject.relic}
                  </div>

                  {/* Restoration progress */}
                  <div className="mb-3 space-y-1">
                    <div className="flex justify-between text-[10px] font-pixel text-slate-600">
                      <span>Restored</span>
                      <span className="text-pink-600 font-pixel-mono font-bold">{realmWorldDev}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-pink-100 rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-700 bg-gradient-to-r from-pink-400 to-rose-500"
                        style={{ width: `${realmWorldDev}%` }}
                      />
                    </div>
                  </div>

                  {/* Level progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] font-pixel text-slate-500 mb-1">
                      <span>XP</span>
                      <span className="font-mono">{lvl.currentLevelXp}/{lvl.nextLevelXp}</span>
                    </div>
                    <ProgressBar value={lvl.progress} subjectId={id} height="h-1.5" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-pink-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('realm-detail', id);
                    }}
                    className="flex-1 py-1.5 px-2 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded text-[11px] font-pixel flex items-center justify-center gap-1 border border-pink-200 hover:border-pink-400 transition-colors cursor-pointer shadow-sm"
                  >
                    <LogIn className="w-3 h-3 text-pink-500" /> Sanctum
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartStudy(id);
                    }}
                    className="flex-1 py-1.5 px-2 rounded text-[11px] font-pixel font-bold flex items-center justify-center gap-1 text-white bg-pink-500 hover:bg-pink-600 border border-pink-600 shadow cursor-pointer transition-transform hover:scale-105"
                  >
                    <Play className="w-3 h-3 fill-white" /> Focus
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
