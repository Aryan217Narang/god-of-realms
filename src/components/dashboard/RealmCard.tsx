import React from 'react';
import type { Subject } from '../../types';
import { ProgressBar } from '../ui';
import { IsometricRealmPlot } from '../journal/IsometricRealmPlot';
import { RelicDisplay } from '../journal/RelicDisplay';
import { getLevelProgress, formatMinutes } from '../../utils/gameLogic';
import { Flame, Star, Play, LogIn, Compass } from 'lucide-react';

interface RealmCardProps {
  subject: Subject;
  onEnterRealm: () => void;
  onStartStudy: () => void;
}

export const RealmCard: React.FC<RealmCardProps> = ({ subject, onEnterRealm, onStartStudy }) => {
  const lvlInfo = getLevelProgress(subject.xp);

  // Next discovery milestones
  const discoveries = {
    daa: 'Ancient Knowledge Tree Canopy',
    os: 'Frozen Gate & Summit Observatory',
    nosql: 'Colossal Vault & Data Cascades',
    hda_cognitive: 'Cognitive Brain Portal & Archives',
    gv: 'Celestial Astrolabe & Sky Bridges',
  }[subject.id];

  const worldDevelopment = Math.min(100, Math.round((subject.level / 10) * 100));

  return (
    <div
      className="realm-card relative flex flex-col justify-between bg-white border-2 border-pink-200 rounded-lg overflow-hidden transition-all duration-200 shadow-[4px_4px_0px_#fbcfe8] hover:border-pink-500 hover:shadow-[4px_4px_0px_#f472b6] hover:-translate-y-0.5"
    >
      {/* Corner Pixel Accents */}
      <div className="absolute top-1 left-1 w-2 h-2 bg-pink-400 pointer-events-none z-20" />
      <div className="absolute top-1 right-1 w-2 h-2 bg-pink-400 pointer-events-none z-20" />
      <div className="absolute bottom-1 left-1 w-2 h-2 bg-pink-400 pointer-events-none z-20" />
      <div className="absolute bottom-1 right-1 w-2 h-2 bg-pink-400 pointer-events-none z-20" />

      {/* Top Miniature 3D Isometric Realm Preview (Visually Dominant) */}
      <div
        className="realm-preview-stage relative h-48 overflow-hidden bg-gradient-to-b from-[#fff0f5] via-[#fff5f8] to-[#fdf2f8] cursor-pointer flex items-center justify-center border-b-2 border-pink-100"
        onClick={onEnterRealm}
      >
        <IsometricRealmPlot
          subjectId={subject.id}
          level={subject.level}
          totalMinutes={subject.totalMinutes}
          width={280}
          height={180}
          animated={true}
          showRelic={true}
        />

        {/* Level badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/95 border border-pink-400 px-2 py-0.5 rounded shadow-sm">
          <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
          <span className="text-[10px] font-pixel-heading text-pink-700">Lv.{subject.level}</span>
        </div>

        {/* Streak badge */}
        {subject.currentStreak > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/95 border border-orange-300 px-2 py-0.5 rounded shadow-sm">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-[10px] font-pixel-mono text-orange-600 font-bold">{subject.currentStreak}d</span>
          </div>
        )}

        {/* Floating Relic Badge in Scene corner */}
        <div className="absolute bottom-2 right-2 z-10" onClick={e => e.stopPropagation()}>
          <RelicDisplay subjectId={subject.id} level={subject.level} size="sm" showTooltip={true} />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Header & Subject Code */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span
              className="text-[10px] font-pixel-heading px-2 py-0.5 rounded border border-pink-400 bg-pink-50 text-pink-700"
            >
              {subject.shortName}
            </span>
            <span className="text-[11px] font-pixel text-pink-600 font-bold">
              {formatMinutes(subject.totalMinutes)} total
            </span>
          </div>

          <h3
            className="text-sm font-pixel-heading text-slate-800 hover:text-pink-600 transition-colors cursor-pointer truncate mb-2 leading-tight"
            onClick={onEnterRealm}
            title={subject.realmName}
          >
            {subject.realmName}
          </h3>

          {/* XP Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-[10px] font-pixel text-slate-500 mb-1">
              <span>Level {lvlInfo.level}</span>
              <span className="font-mono text-pink-600 font-bold">{lvlInfo.currentLevelXp}/{lvlInfo.nextLevelXp} XP</span>
            </div>
            <ProgressBar value={lvlInfo.progress} subjectId={subject.id} height="h-2" />
          </div>

          {/* World Development & Next Discovery */}
          <div className="bg-pink-50/70 p-2.5 rounded border border-pink-200 mb-3 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-pixel text-slate-600">
              <span>World Restoration</span>
              <span className="font-bold text-pink-600 font-pixel-mono">{worldDevelopment}%</span>
            </div>
            <div className="w-full bg-pink-100 h-1.5 rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-700 bg-gradient-to-r from-pink-400 to-pink-600"
                style={{ width: `${worldDevelopment}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-pixel text-slate-600 truncate pt-0.5">
              <Compass className="w-3 h-3 text-pink-500 flex-shrink-0" />
              <span className="truncate">Next: {discoveries}</span>
            </div>
          </div>

          {/* Micro Stats Grid */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-pixel text-slate-500 py-1.5 border-t border-pink-100 mb-3">
            <div>
              <div className="font-bold text-slate-800 font-pixel-mono">{formatMinutes(subject.todayMinutes)}</div>
              <div className="text-[9px] text-slate-400">Today</div>
            </div>
            <div>
              <div className="font-bold text-slate-800 font-pixel-mono">{subject.sessionsCompleted}</div>
              <div className="text-[9px] text-slate-400">Sessions</div>
            </div>
            <div>
              <div className="font-bold font-pixel-mono text-pink-600">{(subject.relic || 'Relic').split(' ')[0]}</div>
              <div className="text-[9px] text-slate-400">Relic</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-pink-100">
          <button
            onClick={onEnterRealm}
            className="flex-1 py-1.5 px-2 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded text-xs font-pixel flex items-center justify-center gap-1.5 cursor-pointer border border-pink-200 transition-all hover:border-pink-400 shadow-[2px_2px_0px_#fbcfe8]"
          >
            <LogIn className="w-3 h-3 text-pink-500" /> Enter
          </button>
          <button
            onClick={onStartStudy}
            className="flex-1 py-1.5 px-2 rounded text-xs font-bold font-pixel flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#f472b6] transition-transform hover:scale-[1.02] bg-pink-500 hover:bg-pink-600 text-white border border-pink-600"
          >
            <Play className="w-3 h-3 fill-white" /> Study
          </button>
        </div>
      </div>
    </div>
  );
};
