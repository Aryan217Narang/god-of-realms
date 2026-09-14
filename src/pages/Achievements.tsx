import React, { useState } from 'react';
import type { AppState, Achievement } from '../types';
import { AncientJournalPanel } from '../components/journal/AncientJournalPanel';
import { Trophy, Lock, Star, Sparkles, Scroll, CheckCircle2 } from 'lucide-react';

interface AchievementsProps {
  state: AppState;
}

const CATEGORY_LABELS: Record<string, { title: string; rune: string; color: string }> = {
  general: { title: 'General Feats', rune: '🌟', color: '#f59e0b' },
  daa: { title: 'Algorithmic Forest', rune: '🌲', color: '#4ade80' },
  os: { title: 'Mountain of Systems', rune: '⛰️', color: '#67e8f9' },
  nosql: { title: 'Lost Data City', rune: '🏙️', color: '#f472b6' },
  hda_cognitive: { title: 'Mind & Healthcare Sanctum', rune: '🔬', color: '#c084fc' },
  gv: { title: 'Graph Archipelagos', rune: '🔗', color: '#fb923c' },
};

const CATEGORY_ORDER = ['general', 'daa', 'os', 'nosql', 'hda_cognitive', 'gv'];

export const Achievements: React.FC<AchievementsProps> = ({ state }) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const unlockedCount = state.achievements.filter(a => a.unlocked).length;
  const total = state.achievements.length;
  const percentage = Math.round((unlockedCount / total) * 100);

  const rankTitle =
    percentage >= 80 ? 'Archmage of All Realms' :
    percentage >= 50 ? 'Master Chronicler' :
    percentage >= 25 ? 'Adept Explorer' : 'Novice Scholar';

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    if (categoryFilter !== 'all' && categoryFilter !== cat) return acc;
    const items = state.achievements.filter(a => {
      if (a.category !== cat) return false;
      if (filter === 'unlocked') return a.unlocked;
      if (filter === 'locked') return !a.unlocked;
      return true;
    });
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, Achievement[]>);

  return (
    <div className="p-4 md:p-8 w-full animate-fade-up max-w-7xl mx-auto bg-[#fff5f8] text-slate-900">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b-2 border-pink-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 text-[10px] font-pixel text-pink-600 uppercase tracking-wider">
            <Scroll className="w-4 h-4 text-pink-500" />
            <span>Mythical Accolades</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-pixel-heading text-pink-950">
            HALL OF TRIUMPHS
          </h1>
          <p className="text-slate-600 text-sm font-pixel mt-1">
            Permanent accolades bestowed upon scholars who push past exhaustion, maintain unbroken streaks, and develop the five miniature realms.
          </p>
        </div>
        <div className="achievement-rank-card flex items-center gap-3 bg-white border-2 border-pink-200 px-4 py-2.5 rounded shadow-[3px_3px_0px_#fbcfe8]">
          <Sparkles className="w-4 h-4 text-pink-500" />
          <div className="text-xs font-pixel">
            <span className="text-slate-500 block text-[10px] uppercase">Honorary Rank</span>
            <span className="text-pink-600 font-bold">{rankTitle}</span>
          </div>
        </div>
      </div>

      {/* Progress Summary Hero Tablet */}
      <div className="mb-8">
        <AncientJournalPanel
          variant="stone"
          hasVines={true}
          className="border-pink-300 shadow-[4px_4px_0px_#fbcfe8]"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded bg-pink-50 border-2 border-pink-400 flex items-center justify-center shadow-[2px_2px_0px_#fbcfe8]">
                <Trophy className="w-7 h-7 text-pink-500 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] font-pixel uppercase tracking-wider text-pink-600 font-bold mb-0.5">
                  Triumph Completion Record
                </div>
                <div className="text-xl font-bold font-pixel-heading text-pink-950 flex items-baseline gap-2">
                  <span>{unlockedCount}</span>
                  <span className="text-slate-500 text-sm font-normal">/ {total} Unlocked</span>
                </div>
                <div className="text-xs font-pixel text-slate-600 mt-0.5">
                  Rank: <span className="text-pink-700 font-bold">{rankTitle}</span>
                </div>
              </div>
            </div>

            <div className="md:w-72 space-y-2">
              <div className="flex justify-between text-xs font-pixel text-slate-700">
                <span>Codex Progress</span>
                <span className="font-mono text-pink-700 font-bold">{percentage}%</span>
              </div>
              <div className="h-3 w-full bg-pink-100 rounded overflow-hidden border border-pink-200">
                <div
                  className="h-full rounded transition-all duration-700 bg-gradient-to-r from-pink-400 to-rose-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="text-right text-[10px] font-pixel text-slate-500">
                {total - unlockedCount} trials remain undiscovered
              </div>
            </div>
          </div>
        </AncientJournalPanel>
      </div>

      {/* Filters Toolbar */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-lg border-2 border-pink-200 shadow-[3px_3px_0px_#fbcfe8] achievement-toolbar">
        {/* Status filter */}
        <div className="flex gap-2">
          {(['all', 'unlocked', 'locked'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-pixel capitalize transition-all cursor-pointer border ${
                filter === f
                  ? 'achievement-filter-active bg-pink-500 text-white font-bold border-pink-600 shadow-[2px_2px_0px_#fbcfe8]'
                  : 'achievement-filter-inactive bg-pink-50 text-slate-600 border-pink-200 hover:bg-pink-100 hover:text-pink-700'
              }`}
            >
              {f === 'all' ? 'All Accolades' : f}
            </button>
          ))}
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded text-[11px] font-pixel transition-all cursor-pointer ${
              categoryFilter === 'all'
                ? 'achievement-filter-active bg-pink-500 text-white border border-pink-600 font-bold shadow-sm'
                : 'achievement-filter-inactive text-slate-600 hover:text-pink-700 bg-pink-50 border border-pink-200'
            }`}
          >
            All Biomes
          </button>
          {CATEGORY_ORDER.map(cat => {
            const meta = CATEGORY_LABELS[cat];
            const active = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded text-[11px] font-pixel transition-all cursor-pointer ${
                  active
                    ? 'achievement-filter-active bg-pink-500 text-white border border-pink-600 font-bold shadow-sm'
                    : 'achievement-filter-inactive text-slate-600 hover:text-pink-700 bg-pink-50 border border-pink-200'
                }`}
              >
                {meta.rune} {meta.title.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Achievement Groups by Category */}
      <div className="space-y-10">
        {CATEGORY_ORDER.map(cat => {
          const items = grouped[cat];
          if (!items || items.length === 0) return null;
          const meta = CATEGORY_LABELS[cat];

          return (
            <div key={cat} className="space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-pink-200 pb-2 achievement-category-header">
                <span className="text-xl">{meta.rune}</span>
                <h2 className="text-base font-pixel-heading text-pink-950 achievement-category-title">
                  {meta.title}
                </h2>
                <span className="text-xs font-pixel text-pink-600 font-bold ml-auto achievement-category-counter">
                  {items.filter(i => i.unlocked).length} / {items.length} Completed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`relative p-4 rounded-lg border-2 transition-all overflow-hidden flex items-start gap-4 ${
                      achievement.unlocked
                        ? 'achievement-card-unlocked bg-white border-pink-400 shadow-[3px_3px_0px_#fbcfe8]'
                        : 'achievement-card-locked bg-pink-50/50 border-pink-200'
                    }`}
                  >
                    {/* Metal corner bracket */}
                    {achievement.unlocked && (
                      <>
                        <div className="achievement-corner-bracket absolute top-1 left-1 w-2 h-2 bg-pink-400 pointer-events-none" />
                        <div className="achievement-corner-bracket absolute top-1 right-1 w-2 h-2 bg-pink-400 pointer-events-none" />
                      </>
                    )}

                    {/* Left: Icon Plaque */}
                    <div
                      className={`achievement-icon-plaque w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 text-xl border-2 shadow-inner ${
                        achievement.unlocked
                          ? 'bg-pink-50 border-pink-300 text-pink-600'
                          : 'bg-pink-100/50 border-pink-200 text-slate-400 grayscale'
                      }`}
                    >
                      {achievement.unlocked ? achievement.icon : <Lock className="w-4 h-4 text-slate-400" />}
                    </div>

                    {/* Center: Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={`font-pixel text-sm font-bold truncate achievement-title ${
                          achievement.unlocked ? 'text-pink-950' : 'text-slate-500'
                        }`}>
                          {achievement.name}
                        </h3>
                        {achievement.unlocked && (
                          <CheckCircle2 className="w-4 h-4 text-pink-600 flex-shrink-0 checkmark-icon" />
                        )}
                      </div>

                      <p className="achievement-desc text-xs font-sans text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                        {achievement.description}
                      </p>

                      {achievement.unlocked && achievement.unlockedAt ? (
                        <div className="achievement-date text-[10px] font-pixel text-pink-600 flex items-center gap-1 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          <span>
                            Conquered {new Date(achievement.unlockedAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </span>
                        </div>
                      ) : (
                        <div className="achievement-locked-note text-[10px] font-pixel text-slate-400">
                          🔒 Undiscovered milestone
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
