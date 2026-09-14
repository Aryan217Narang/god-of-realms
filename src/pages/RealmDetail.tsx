import React from 'react';
import type { AppState, SubjectId } from '../types';
import { AncientJournalPanel } from '../components/journal/AncientJournalPanel';
import { PixelRealmScene } from '../components/journal/PixelRealmScene';
import { RelicDisplay } from '../components/journal/RelicDisplay';
import { VineDecoration } from '../components/journal/VineDecoration';
import { ProgressBar } from '../components/ui';
import { getLevelProgress, formatMinutes, REALM_ELEMENTS, getDailyStudyData } from '../utils/gameLogic';
import {
  Flame, Clock, Star, Zap, Lock, CheckCircle2, Play,
  ArrowLeft, Sparkles, Scroll, Landmark
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Page } from '../components/layout/Navigation';

interface RealmDetailProps {
  state: AppState;
  subjectId: SubjectId;
  onNavigate: (page: Page, extra?: string) => void;
  onStartStudy: (subjectId: SubjectId) => void;
}

const REALM_CHRONICLES: Record<SubjectId, {
  sanctumTitle: string;
  guardianOrder: string;
  epicLore: string;
  relicPerk: string;
}> = {
  daa: {
    sanctumTitle: 'Tree Realm — Ancient Forest of Knowledge & Trees',
    guardianOrder: 'Keepers of the Recursive Grove',
    epicLore: 'In the deep algorithmic woods, the Colossal Tree of Knowledge draws arcane energy through root networks that mimic graph traversals. Its canopy branches into infinite subproblems, each solved by the keen blade of the Algorithmic Axe.',
    relicPerk: '+15% Logic Clarity & Faster Tree Blooming',
  },
  os: {
    sanctumTitle: 'Mountain Realm — Rocky Summits & Hiking Trails',
    guardianOrder: 'Sentinels of the Kernel Forge',
    epicLore: 'Carved into the frozen basalt peaks and switchback hiking trails, the Mountain of Systems regulates the balance between hardware resource and user privilege. Beneath the snowy permafrost lies the great forge where the System Guardian Hammer commands thread scheduling and virtual memory.',
    relicPerk: '+20% Thermal Stability during Long Study Respite',
  },
  nosql: {
    sanctumTitle: 'City Ruins Realm — Ancient Stone Colonnades & Vaults',
    guardianOrder: 'Archivists of Distributed Relics',
    epicLore: 'Centuries ago, the great architects of the Lost Data City built vast marble colonnades to store billions of non-relational inscriptions. Glowing magenta data conduits flow eternally through stone vaults, watched over by the Data Relic Blade.',
    relicPerk: '+10% Throughput Mastery on Multi-Session Streaks',
  },
  hda_cognitive: {
    sanctumTitle: 'Sanctuary Realm — Mind & Healthcare Research Pavilion',
    guardianOrder: 'The Ascended Neural Scribes',
    epicLore: 'A peaceful botanical convergence of clinical vital signs and synthetic neural cognition. On the western terrace stands the white-stone archive of healing methodologies; across the serene reflection pond, the colossal neural synapse arch hums with thought-energy guided by the Mind Seeker Staff.',
    relicPerk: '+25% Deep Memory Retention & Cognitive Flow',
  },
  gv: {
    sanctumTitle: 'Floating Islands Realm — Sky Archipelago & Vector Bridges',
    guardianOrder: 'Weavers of the Interconnected Web',
    epicLore: 'Floating sky islands anchored across chasms by luminous ley bridges of pure network topology. Here, complex multidimensional relationships resolve into breathtaking visual symmetry, channeled through the celestial Connector Spear.',
    relicPerk: '+15% Visual Synergy & Graph Milestone Resonance',
  },
};

export const RealmDetail: React.FC<RealmDetailProps> = ({ state, subjectId, onNavigate, onStartStudy }) => {
  const subject = state.subjects[subjectId];
  const lvl = getLevelProgress(subject.xp);
  const sessions = state.sessions.filter(s => s.subjectId === subjectId && s.completed);
  const recentSessions = [...sessions].sort((a, b) => b.startTime.localeCompare(a.startTime)).slice(0, 6);
  const dailyData = getDailyStudyData(state.sessions.filter(s => s.subjectId === subjectId), 7);
  const elements = REALM_ELEMENTS[subjectId];
  const lore = REALM_CHRONICLES[subjectId];

  const worldDev = Math.min(100, Math.round((subject.level / 10) * 100));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border-2 border-pink-500 rounded p-2 text-xs font-pixel shadow-xl">
          <p className="text-pink-600 font-bold mb-0.5">{label}</p>
          <p className="text-slate-700">
            Focused Study: <span className="text-pink-600 font-mono font-bold">{Math.round(payload[0]?.value || 0)}m</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-8 w-full animate-fade-up max-w-7xl mx-auto bg-[#fff5f8] text-slate-900">
      {/* Back Button Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => onNavigate('realms')}
          className="flex items-center gap-2 text-pink-700 hover:text-pink-900 font-pixel text-xs cursor-pointer transition-colors bg-white border-2 border-pink-200 px-3.5 py-1.5 rounded shadow-[2px_2px_0px_#fbcfe8]"
        >
          <ArrowLeft className="w-4 h-4 text-pink-500" /> Return to Atlas of Worlds
        </button>

        <div className="flex items-center gap-2 text-xs font-pixel text-pink-700">
          <Scroll className="w-4 h-4 text-pink-500" />
          <span>Sanctum Chronicle #{subjectId.toUpperCase()}</span>
        </div>
      </div>

      {/* Hero Header Banner */}
      <div className="mb-8 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-100 border-2 border-pink-300 rounded-lg p-6 md:p-8 shadow-[4px_4px_0px_#fbcfe8] relative overflow-hidden">
        <VineDecoration position="top-right" flowerColor="#f472b6" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span
                className="text-xs font-pixel-heading px-2.5 py-1 rounded border border-pink-300 bg-pink-200/60 text-pink-800"
              >
                {subject.shortName} • {lore.guardianOrder}
              </span>
              <span className="text-xs font-pixel text-amber-800 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> Sanctum Level {lvl.level}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-pixel-heading text-pink-950 mb-2">
              {subject.realmName}
            </h1>
            <div className="text-xs font-pixel text-pink-600 italic mb-3">
              {lore.sanctumTitle}
            </div>
            <p className="text-slate-700 text-xs font-pixel max-w-3xl leading-relaxed">
              {lore.epicLore}
            </p>
          </div>

          <button
            onClick={() => onStartStudy(subjectId)}
            className="pixel-btn pixel-btn-pink py-3 px-6 text-sm flex items-center justify-center gap-2 self-start md:self-center"
          >
            <Play className="w-4 h-4 fill-white" /> Channel Study Session
          </button>
        </div>
      </div>

      {/* Hero 3D Isometric Realm Canvas with Interactive POIs */}
      <div className="mb-10 relative">
        <AncientJournalPanel
          variant="stone"
          hasVines={true}
          className="overflow-hidden shadow-[4px_4px_0px_#fbcfe8] border-pink-300 !p-0"
        >
          <div className="realm-stage-backdrop relative bg-gradient-to-b from-[#fff0f5] to-[#fdf2f8] flex flex-col justify-between">
            <PixelRealmScene
              subjectId={subjectId}
              level={subject.level}
              totalMinutes={subject.totalMinutes}
              height={440}
              showOverlay={true}
              interactive={true}
            />
          </div>
        </AncientJournalPanel>
      </div>

      {/* Sacred Relic Shrine & Quick Overview Tablets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Relic Shrine Card */}
        <div className="lg:col-span-1">
          <AncientJournalPanel
            variant="stone"
            className="h-full border-pink-300 shadow-[4px_4px_0px_#fbcfe8]"
          >
            <div className="mb-4 border-b border-pink-200 pb-3">
              <h3 className="text-sm font-pixel-heading text-pink-950">
                SACRED RELIC SHRINE
              </h3>
              <p className="text-xs font-pixel text-slate-500">
                Ancient armament of this domain
              </p>
            </div>

            <div className="flex flex-col items-center text-center py-2">
              <div className="mb-4 relative">
                <RelicDisplay
                  subjectId={subjectId}
                  level={subject.level}
                  size="lg"
                  showTooltip={false}
                />
              </div>

              <span
                className="text-[10px] font-pixel-heading px-2.5 py-0.5 rounded border border-pink-300 bg-pink-100 text-pink-700 mb-2 uppercase"
              >
                Tier {Math.min(5, Math.floor(subject.level / 2) + 1)} Relic
              </span>

              <h4 className="text-base font-pixel-heading text-pink-950 mb-2">
                {subject.relic}
              </h4>

              <div className="p-3 bg-[#fff0f5] border border-pink-200 rounded text-xs font-pixel text-slate-700 italic mb-4 leading-relaxed max-w-sm">
                "{subject.relicLore}"
              </div>

              {/* Relic Perk */}
              <div className="w-full bg-pink-50 border border-pink-300 p-3 rounded text-left space-y-1 shadow-[2px_2px_0px_#fce7f3]">
                <div className="text-[10px] font-pixel uppercase text-pink-700 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-pink-500" /> Active Relic Resonance
                </div>
                <div className="text-xs font-pixel text-slate-700">
                  {lore.relicPerk}
                </div>
              </div>
            </div>
          </AncientJournalPanel>
        </div>

        {/* Level Progression & 7-Day Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Level Progress Tablet */}
          <AncientJournalPanel
            variant="stone"
            className="border-pink-300 shadow-[4px_4px_0px_#fbcfe8]"
          >
            <div className="mb-4 border-b border-pink-200 pb-3">
              <h3 className="text-sm font-pixel-heading text-pink-950">
                SANCTUM STATUS • {subject.shortName}
              </h3>
              <p className="text-xs font-pixel text-slate-500">
                Current mastery index and miniature world development
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="bg-[#fff0f5] p-3 rounded border border-pink-200 text-center shadow-[2px_2px_0px_#fce7f3]">
                <Clock className="w-4 h-4 mx-auto mb-1 text-pink-500" />
                <div className="text-base font-bold text-slate-800 font-pixel-mono">
                  {formatMinutes(subject.todayMinutes)}
                </div>
                <div className="text-[10px] text-slate-500 font-pixel">Today</div>
              </div>
              <div className="bg-[#fff0f5] p-3 rounded border border-pink-200 text-center shadow-[2px_2px_0px_#fce7f3]">
                <Star className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                <div className="text-base font-bold text-slate-800 font-pixel-mono">
                  {formatMinutes(subject.weekMinutes)}
                </div>
                <div className="text-[10px] text-slate-500 font-pixel">This Week</div>
              </div>
              <div className="bg-[#fff0f5] p-3 rounded border border-pink-200 text-center shadow-[2px_2px_0px_#fce7f3]">
                <Flame className="w-4 h-4 mx-auto mb-1 text-rose-500" />
                <div className="text-base font-bold text-rose-600 font-pixel-mono">
                  {subject.currentStreak}d
                </div>
                <div className="text-[10px] text-slate-500 font-pixel">Current Streak</div>
              </div>
              <div className="bg-[#fff0f5] p-3 rounded border border-pink-200 text-center shadow-[2px_2px_0px_#fce7f3]">
                <Zap className="w-4 h-4 mx-auto mb-1 text-pink-600" />
                <div className="text-base font-bold font-pixel-mono text-pink-700">
                  {formatMinutes(subject.totalMinutes)}
                </div>
                <div className="text-[10px] text-slate-500 font-pixel">All-Time</div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-3 bg-[#fff0f5] p-4 rounded border border-pink-200 shadow-[2px_2px_0px_#fce7f3]">
              <div>
                <div className="flex justify-between text-xs font-pixel text-slate-700 mb-1">
                  <span>Sanctum Mastery Level {lvl.level}</span>
                  <span className="font-mono text-pink-700 font-bold">{lvl.currentLevelXp} / {lvl.nextLevelXp} XP</span>
                </div>
                <ProgressBar value={lvl.progress} subjectId={subjectId} height="h-2.5" />
              </div>

              <div>
                <div className="flex justify-between text-xs font-pixel text-slate-700 mb-1">
                  <span>World Restoration Index</span>
                  <span className="font-bold font-pixel text-pink-600">{worldDev}% Restored</span>
                </div>
                <div className="w-full bg-pink-100 h-2.5 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-700 bg-gradient-to-r from-pink-400 to-rose-500"
                    style={{ width: `${worldDev}%` }}
                  />
                </div>
              </div>
            </div>
          </AncientJournalPanel>

          {/* 7-Day Expedition Record */}
          <AncientJournalPanel
            variant="stone"
            className="border-pink-300 shadow-[4px_4px_0px_#fbcfe8]"
          >
            <div className="mb-3 border-b border-pink-200 pb-2">
              <h3 className="text-sm font-pixel-heading text-pink-950">
                SEVEN-DAY EXPEDITION RECORD
              </h3>
              <p className="text-xs font-pixel text-slate-500">
                Daily study minutes channeled into this realm
              </p>
            </div>

            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dailyData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                <XAxis dataKey="label" tick={{ fill: '#db2777', fontSize: 10, fontFamily: 'Pixelify Sans, monospace' }} />
                <YAxis tick={{ fill: '#db2777', fontSize: 10, fontFamily: 'Pixelify Sans, monospace' }} unit="m" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="#ec4899" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </AncientJournalPanel>
        </div>
      </div>

      {/* Realm Architectural Restoration Milestones */}
      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-pixel-heading text-pink-950 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-pink-500" /> SANCTUM MONUMENTS & EXPEDITIONS
            </h2>
            <p className="text-xs font-pixel text-slate-600 mt-0.5">
              Architectural monuments unlocked as you advance your study time and level in this discipline.
            </p>
          </div>
          <div className="text-xs font-pixel text-pink-700 bg-white px-3 py-1.5 rounded border-2 border-pink-200 shadow-[2px_2px_0px_#fbcfe8]">
            {subject.unlockedElements.length} of {elements.length} Restored
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {elements.map(el => {
            const isUnlocked = subject.unlockedElements.includes(el.id);
            return (
              <div
                key={el.id}
                className={`p-4 rounded border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                  isUnlocked
                    ? 'element-card-unlocked bg-white border-pink-400 shadow-[3px_3px_0px_#fbcfe8]'
                    : 'element-card-locked bg-pink-50/50 border-pink-200'
                }`}
              >
                {/* Status icon badge */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {isUnlocked ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-pink-600 checkmark-icon" />
                    ) : (
                      <Lock className="w-4 h-4 flex-shrink-0 text-slate-400 lock-icon" />
                    )}
                    <span className={`font-bold font-pixel text-xs element-title ${isUnlocked ? 'text-pink-950' : 'text-slate-500'}`}>
                      {el.name}
                    </span>
                  </div>
                  {isUnlocked && (
                    <span className="text-[9px] font-pixel text-pink-700 bg-pink-100 border border-pink-300 px-2 py-0.5 rounded element-badge">
                      Awakened
                    </span>
                  )}
                </div>

                <p className="text-xs font-pixel text-slate-600 mb-3 leading-relaxed element-desc">
                  {el.description}
                </p>

                {!isUnlocked && (
                  <div className="pt-2 border-t border-pink-200 flex items-center justify-between text-[11px] font-pixel text-pink-600 element-req">
                    <span>Requirement:</span>
                    <span>{el.minutesRequired}m + Lv.{el.levelRequired}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Expedition Chronicles Ledger */}
      <AncientJournalPanel
        variant="stone"
        className="border-pink-300 shadow-[4px_4px_0px_#fbcfe8]"
      >
        <div className="mb-4 border-b border-pink-200 pb-3">
          <h3 className="text-sm font-pixel-heading text-pink-950">
            HISTORICAL EXPEDITION CHRONICLES
          </h3>
          <p className="text-xs font-pixel text-slate-500">
            Recent study sessions recorded in this realm's eternal ledger
          </p>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-center py-8 font-pixel text-slate-400 text-xs">
            No expeditions recorded yet in this sanctum. Embark on a study session to develop your world!
          </div>
        ) : (
          <div className="divide-y divide-pink-100">
            {recentSessions.map(session => (
              <div key={session.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-pink-50 border border-pink-300 flex items-center justify-center text-pink-600 font-pixel text-xs shadow-sm">
                    📜
                  </div>
                  <div>
                    <div className="text-xs font-bold font-pixel text-slate-900">
                      {formatMinutes(session.durationMinutes)} Focus Session
                    </div>
                    <div className="text-[10px] font-pixel text-slate-500">
                      {new Date(session.startTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold font-pixel text-pink-600">
                    +{session.xpEarned} XP Earned
                  </div>
                  <div className="text-[10px] font-pixel text-pink-500">
                    Realm Restored ✓
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AncientJournalPanel>
    </div>
  );
};
