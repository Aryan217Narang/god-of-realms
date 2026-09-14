import React from 'react';
import type { AppState, SubjectId } from '../types';
import { RealmCard } from '../components/dashboard/RealmCard';
import { AncientJournalPanel } from '../components/journal/AncientJournalPanel';
import { RuneStatTablet } from '../components/journal/RuneStatTablet';
import { VineDecoration } from '../components/journal/VineDecoration';
import { ProgressBar } from '../components/ui';
import { getTotalMinutesForPeriod, formatMinutes } from '../utils/gameLogic';
import { ChevronRight, Sparkles, Scroll } from 'lucide-react';
import type { Page } from '../components/layout/Navigation';

interface DashboardProps {
  state: AppState;
  onNavigate: (page: Page, extra?: string) => void;
  onStartStudy: (subjectId: SubjectId) => void;
}

const SUBJECT_IDS: SubjectId[] = ['daa', 'os', 'nosql', 'hda_cognitive', 'gv'];

const ADVENTURE_QUOTES = [
  'With every minute studied, an isometric world springs into lush life.',
  'Your knowledge is an ancient relic; forged in focus, awakened by discipline.',
  'The path through the algorithmic trees opens only to the steadfast explorer.',
  'Deep within the lost city, data crystals hum in harmony with your study.',
  'The summits of operating systems are conquered one kernel step at a time.',
  'Restore the five miniature realms. Your chronicle records every discovery.',
  'In the silence of contemplation, tiny pixel-art civilizations find new breath.',
];

export const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate, onStartStudy }) => {
  const todayMinutes = getTotalMinutesForPeriod(state.sessions, 'today');
  const allTimeMinutes = getTotalMinutesForPeriod(state.sessions, 'all');
  const totalSessions = state.sessions.filter(s => s.completed).length;
  const dailyGoal = state.settings.dailyGoalMinutes;
  const dailyProgress = Math.min(1, todayMinutes / dailyGoal);
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const quote = ADVENTURE_QUOTES[new Date().getDate() % ADVENTURE_QUOTES.length];
  const unlockedAchievements = state.achievements.filter(a => a.unlocked).length;

  return (
    <div className="p-4 md:p-8 w-full animate-fade-up relative max-w-7xl mx-auto bg-[#fff5f8] text-slate-900">
      {/* Living Vine climbing from corner */}
      <VineDecoration position="top-right" flowerColor="#f472b6" className="hidden lg:block opacity-90" />

      {/* Pixel Header Banner */}
      <div className="mb-7 pb-5 border-b-2 border-pink-200 relative">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-pixel text-pink-600 tracking-wider uppercase mb-1 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>Pixel Study Chronicle</span>
              <span>✦</span>
              <span className="text-pink-400">{todayDate}</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-pixel-heading text-slate-800 tracking-wider leading-tight">
              GOD OF REALMS
            </h1>
            <p className="text-pink-600 font-bold text-sm font-pixel mt-1">
              "Master Your Knowledge. Build Your Worlds."
            </p>
          </div>

          {/* Adventure quote card */}
          <div className="max-w-md p-3 rounded-lg bg-white border-2 border-pink-200 shadow-[3px_3px_0px_#fbcfe8] text-right hidden md:block">
            <div className="flex items-center justify-end gap-1.5 text-[10px] font-pixel text-pink-600 font-bold mb-1">
              <Scroll className="w-3 h-3 text-pink-500" />
              <span>Explorer's Log</span>
            </div>
            <p className="text-xs text-slate-700 italic font-pixel leading-relaxed">
              "{quote}"
            </p>
          </div>
        </div>
      </div>

      {/* Core Chronicle Stat Tablets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <RuneStatTablet
          label="Today's Study"
          value={formatMinutes(todayMinutes)}
          subValue={`${Math.round(todayMinutes)} min logged`}
          icon="hourglass"
          color="#db2777"
        />
        <RuneStatTablet
          label="Consecutive Streak"
          value={`${state.globalStreak} Days`}
          subValue={state.globalStreak > 0 ? 'Flame ignited' : 'Study to ignite'}
          icon="flame"
          color="#ea580c"
        />
        <RuneStatTablet
          label="Completed Sessions"
          value={totalSessions}
          subValue="Focus rites recorded"
          icon="chest"
          color="#db2777"
        />
        <RuneStatTablet
          label="Total Study Time"
          value={formatMinutes(allTimeMinutes)}
          subValue="All chronicles"
          icon="trophy"
          color="#db2777"
        />
      </div>

      {/* Quest Goal Progress & Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* Daily Study Target */}
        <AncientJournalPanel variant="stone" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧭</span>
              <div>
                <h3 className="text-sm font-pixel-heading text-slate-800">Daily Exploration Quest</h3>
                <p className="text-xs text-slate-500 font-pixel">Daily focus required to expand your miniature worlds</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-pixel-heading text-pink-600">
                {formatMinutes(todayMinutes)} / {formatMinutes(dailyGoal)}
              </span>
              <span className="text-[11px] font-pixel text-pink-500 font-bold block">
                {Math.round(dailyProgress * 100)}% Complete
              </span>
            </div>
          </div>

          <ProgressBar value={dailyProgress} height="h-3" color="#ec4899" />

          <div className="flex items-center justify-between text-xs font-pixel mt-3 text-slate-600 pt-2 border-t border-pink-100">
            <span>
              {dailyProgress >= 1
                ? '🎉 Daily goal fulfilled! Your isometric worlds flourish.'
                : `⚡ ${formatMinutes(Math.max(0, dailyGoal - todayMinutes))} remaining today.`}
            </span>
            <span className="text-pink-600 font-bold text-[11px] font-pixel">+25 XP bonus on completion</span>
          </div>
        </AncientJournalPanel>

        {/* Quest Achievements Tablet */}
        <AncientJournalPanel
          variant="stone"
          className="cursor-pointer hover:border-pink-500 transition-all flex flex-col justify-between"
          onClick={() => onNavigate('achievements')}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <h3 className="text-sm font-pixel-heading text-slate-800">Relic Trophies</h3>
              </div>
              <span className="text-xs font-pixel-mono text-pink-600 font-bold">
                {unlockedAchievements}/{state.achievements.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-pixel mb-3">
              Uncovered milestones and realm achievements
            </p>
            <ProgressBar value={unlockedAchievements / Math.max(1, state.achievements.length)} height="h-2" color="#ec4899" />
          </div>

          <div className="flex items-center justify-between text-xs font-pixel text-pink-600 font-bold pt-3 border-t border-pink-100 mt-3">
            <span>Inspect All Milestones</span>
            <ChevronRight className="w-4 h-4 text-pink-500" />
          </div>
        </AncientJournalPanel>
      </div>

      {/* Five Sacred Realms Showcase Grid */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-pixel-heading text-slate-800 tracking-wide flex items-center gap-2">
            <span>🌸</span> The Five Isometric Realms
          </h2>
          <p className="text-xs font-pixel text-slate-500 mt-0.5">
            Each focused study session develops your miniature isometric 3D plots and forges relics
          </p>
        </div>
        <button
          onClick={() => onNavigate('realms')}
          className="text-pink-600 hover:text-pink-500 font-bold text-xs font-pixel flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Open Atlas</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 5-Column Responsive Realm Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {SUBJECT_IDS.map(id => (
          <RealmCard
            key={id}
            subject={state.subjects[id]}
            onEnterRealm={() => onNavigate('realm-detail', id)}
            onStartStudy={() => onStartStudy(id)}
          />
        ))}
      </div>
    </div>
  );
};
