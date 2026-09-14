import React, { useState } from 'react';
import type { AppState, SubjectId } from '../types';
import {
  getDailyStudyData, getTotalMinutesForPeriod,
  getSubjectMinutesForPeriod, formatTime, calculateStreak
} from '../utils/gameLogic';
import { AncientJournalPanel } from '../components/journal/AncientJournalPanel';
import { RuneStatTablet } from '../components/journal/RuneStatTablet';
import { RelicDisplay } from '../components/journal/RelicDisplay';
import {
  BarChart, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts';


import { Scroll, Sparkles } from 'lucide-react';

interface StatsProps {
  state: AppState;
}

const SUBJECT_IDS: SubjectId[] = ['daa', 'os', 'nosql', 'hda_cognitive', 'gv'];
const COLORS: Record<SubjectId, string> = {
  daa: '#4ade80',
  os: '#67e8f9',
  nosql: '#f472b6',
  hda_cognitive: '#c084fc',
  gv: '#fb923c',
};
const LABELS: Record<SubjectId, string> = {
  daa: 'Tree Realm (DAA)',
  os: 'Mountain Realm (OS)',
  nosql: 'City Ruins (NoSQL)',
  hda_cognitive: 'Sanctuary (HDA & CI)',
  gv: 'Floating Isles (GV)',
};

export const Statistics: React.FC<StatsProps> = ({ state }) => {
  const [period, setPeriod] = useState<7 | 30>(7);
  const [piePeriod, setPiePeriod] = useState<'today' | '7d' | '30d' | 'all'>('today');
  const sessions = state.sessions;
  const timeFormat = state.settings.timeFormat || 'hours_decimal';

  const todayMin = getTotalMinutesForPeriod(sessions, 'today');
  const weekMin = getTotalMinutesForPeriod(sessions, 'week');
  const monthMin = getTotalMinutesForPeriod(sessions, 'month');
  const allMin = getTotalMinutesForPeriod(sessions, 'all');
  const totalSessions = sessions.filter(s => s.completed).length;
  const globalStreak = calculateStreak(sessions);

  const uniqueDays = new Set(sessions.filter(s => s.completed).map(s => s.startTime.slice(0, 10))).size;
  const avgDaily = uniqueDays > 0 ? allMin / uniqueDays : 0;

  // Most studied
  const mostStudied = SUBJECT_IDS.reduce((best, id) => {
    const m = getSubjectMinutesForPeriod(sessions, id, 'all');
    return m > (best.minutes || 0) ? { id, minutes: m } : best;
  }, { id: 'daa' as SubjectId, minutes: 0 });

  // Daily chart data
  const dailyData = getDailyStudyData(sessions, period);

  // Subject distribution for Pie Chart (Supports Today / Daily, 7 Days, 30 Days, All Time)
  const subjectDistribution = SUBJECT_IDS.map(id => {
    const mins = piePeriod === 'today'
      ? getSubjectMinutesForPeriod(sessions, id, 'today')
      : piePeriod === '7d'
      ? getSubjectMinutesForPeriod(sessions, id, 'week')
      : piePeriod === '30d'
      ? getSubjectMinutesForPeriod(sessions, id, 'month')
      : getSubjectMinutesForPeriod(sessions, id, 'all');
    return {
      id,
      name: LABELS[id],
      shortName: state.subjects[id].shortName,
      value: mins,
      color: COLORS[id],
    };
  }).filter(d => d.value > 0);

  const totalPieMinutes = subjectDistribution.reduce((sum, d) => sum + d.value, 0);

  // Realm progress data with today's minutes
  const realmProgress = SUBJECT_IDS.map(id => ({
    id,
    name: LABELS[id],
    realmName: state.subjects[id].realmName,
    level: state.subjects[id].level,
    elements: state.subjects[id].unlockedElements.length,
    minutes: state.subjects[id].totalMinutes,
    todayMinutes: getSubjectMinutesForPeriod(sessions, id, 'today'),
    color: COLORS[id],
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Deduplicate entries if both Bar and Line track 'total'
      const uniquePayload = payload.filter((p: any, idx: number, arr: any[]) =>
        arr.findIndex((x: any) => (x.dataKey || x.name) === (p.dataKey || p.name)) === idx
      );
      return (
        <div className="bg-white border-2 border-pink-500 rounded-lg p-2.5 text-xs font-pixel shadow-xl text-slate-800">
          <p className="text-pink-600 font-bold mb-1 border-b border-pink-100 pb-1">📅 {label}</p>
          {uniquePayload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color || p.fill || p.stroke || '#db2777' }} className="flex justify-between gap-3 font-semibold">
              <span>{p.name}:</span>
              <span className="font-mono font-bold">{formatTime(Number(p.value), timeFormat)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };


  return (
    <div className="p-4 md:p-8 w-full animate-fade-up max-w-7xl mx-auto bg-[#fff5f8] text-slate-900">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b-2 border-pink-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 text-[10px] font-pixel text-pink-600 uppercase tracking-wider">
            <Scroll className="w-4 h-4 text-pink-500" />
            <span>Observatory & Study Ledger</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-pixel-heading text-pink-950">
            CHRONICLES OF SCHOLARSHIP
          </h1>
          <p className="text-slate-600 text-sm font-pixel mt-1">
            Study tracking across the five sacred miniature realms. Observe your dedication, consistency, and world restoration metrics.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white border-2 border-pink-200 px-4 py-2.5 rounded shadow-[3px_3px_0px_#fbcfe8]">
          <Sparkles className="w-4 h-4 text-pink-500" />
          <div className="text-xs font-pixel">
            <span className="text-slate-500 block text-[10px] uppercase">All-Time Scholarship</span>
            <span className="text-pink-600 font-bold">{formatTime(allMin, timeFormat)} Recorded</span>
          </div>
        </div>
      </div>

      {/* Primary Rune Tablets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <RuneStatTablet
          label="Today's Focus"
          value={formatTime(todayMin, timeFormat)}
          subValue="Session study"
          icon="hourglass"
          color="#ec4899"
        />
        <RuneStatTablet
          label="Seven-Day Yield"
          value={formatTime(weekMin, timeFormat)}
          subValue="Weekly tally"
          icon="trophy"
          color="#f43f5e"
        />
        <RuneStatTablet
          label="Monthly Arc"
          value={formatTime(monthMin, timeFormat)}
          subValue="Monthly tally"
          icon="compass"
          color="#f59e0b"
        />
        <RuneStatTablet
          label="All-Time Mastery"
          value={formatTime(allMin, timeFormat)}
          subValue="Total focus time"
          icon="scroll"
          color="#db2777"
        />
      </div>

      {/* Secondary Rune Tablets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <RuneStatTablet
          label="Total Expeditions"
          value={totalSessions}
          subValue="Completed sessions"
          icon="chest"
          color="#ec4899"
        />
        <RuneStatTablet
          label="Active Streak"
          value={`${globalStreak.current} Days`}
          subValue="Consecutive study"
          icon="flame"
          color="#f43f5e"
        />
        <RuneStatTablet
          label="Legendary Record"
          value={`${globalStreak.longest} Days`}
          subValue="All-time longest"
          icon="trophy"
          color="#f59e0b"
        />
        <RuneStatTablet
          label="Daily Average"
          value={formatTime(avgDaily, timeFormat)}
          subValue="Per active day"
          icon="compass"
          color="#db2777"
        />
      </div>

      {/* Most Studied Domain Banner */}
      {mostStudied.minutes > 0 && (
        <div className="mb-8 p-4 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-100 border-2 border-pink-300 rounded-lg flex items-center justify-between shadow-[4px_4px_0px_#fbcfe8]">
          <div className="flex items-center gap-4">
            <RelicDisplay subjectId={mostStudied.id} level={state.subjects[mostStudied.id].level} size="sm" />
            <div>
              <div className="text-[10px] font-pixel uppercase tracking-wider text-pink-600 font-bold">
                ⭐ Foremost Patron Realm
              </div>
              <div className="text-base font-pixel-heading text-pink-950 flex items-center gap-2 mt-0.5">
                <span>{state.subjects[mostStudied.id].realmName}</span>
                <span className="text-[10px] font-pixel-mono px-2 py-0.5 rounded border border-pink-300 bg-pink-100 text-pink-700">
                  {state.subjects[mostStudied.id].shortName}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-pixel-heading text-pink-600">
              {formatTime(mostStudied.minutes, timeFormat)}
            </div>
            <div className="text-[10px] font-pixel text-slate-500">Channeled Time</div>
          </div>
        </div>
      )}

      {/* Daily Study Timeline Chart */}
      <div className="mb-8">
        <AncientJournalPanel
          variant="stone"
          className="border-pink-300 shadow-[4px_4px_0px_#fbcfe8]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-pink-200 pb-3">
            <div>
              <h3 className="text-sm font-pixel-heading text-pink-950">
                DAILY STUDY ARCHIVE
              </h3>
              <p className="text-xs font-pixel text-slate-500">
                Hours and minutes invested across day intervals
              </p>
            </div>

            <div className="flex gap-1 bg-pink-50 p-1 rounded border border-pink-200 self-start sm:self-auto">
              <button
                onClick={() => setPeriod(7)}
                className={`px-3 py-1 rounded text-xs font-pixel cursor-pointer transition-all ${
                  period === 7 ? 'bg-pink-500 text-white font-bold shadow-sm' : 'text-slate-600 hover:text-pink-700'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setPeriod(30)}
                className={`px-3 py-1 rounded text-xs font-pixel cursor-pointer transition-all ${
                  period === 30 ? 'bg-pink-500 text-white font-bold shadow-sm' : 'text-slate-600 hover:text-pink-700'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={dailyData} margin={{ top: 15, right: 15, bottom: 5, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey="label" tick={{ fill: '#db2777', fontSize: 10, fontFamily: 'Pixelify Sans, monospace' }} />
              <YAxis tick={{ fill: '#db2777', fontSize: 10, fontFamily: 'Pixelify Sans, monospace' }} unit="m" />
              <Tooltip content={<CustomTooltip />} />
              {/* Daily Study Bars */}
              <Bar
                dataKey="total"
                fill="#f472b6"
                opacity={0.65}
                name="Minutes"
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
              {/* Connected Node Line matching sketch */}
              <Line
                type="monotone"
                dataKey="total"
                stroke="#db2777"
                strokeWidth={3}
                name="Study Pulse"
                dot={{ stroke: '#be185d', strokeWidth: 2.5, r: 5.5, fill: '#ffffff' }}
                activeDot={{ stroke: '#9d174d', strokeWidth: 3.5, r: 8, fill: '#ec4899' }}
              />
            </ComposedChart>
          </ResponsiveContainer>

        </AncientJournalPanel>
      </div>

      {/* Subject Distribution & Realm Development Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart: Domain Distribution */}
        <AncientJournalPanel
          variant="stone"
          className="border-pink-300 shadow-[4px_4px_0px_#fbcfe8]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-pink-200 pb-3">
            <div>
              <h3 className="text-sm font-pixel-heading text-pink-950">
                SCHOLARSHIP HARMONY
              </h3>
              <p className="text-xs font-pixel text-slate-500">
                {piePeriod === 'today' ? "Today's daily subject breakdown" : 'Proportion of time across each realm'}
              </p>
            </div>

            <div className="flex gap-1 bg-pink-50 p-1 rounded border border-pink-200 self-start sm:self-auto flex-wrap">
              {[
                { id: 'today', label: '📅 Today' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: 'all', label: 'All Time' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPiePeriod(p.id as any)}
                  className={`px-2.5 py-1 rounded text-[11px] font-pixel cursor-pointer transition-all ${
                    piePeriod === p.id
                      ? 'bg-pink-500 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-pink-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {subjectDistribution.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={subjectDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={32}
                    dataKey="value"
                    paddingAngle={4}
                  >
                    {subjectDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, name: any) => [
                      `${formatTime(Number(v), timeFormat)} (${totalPieMinutes > 0 ? Math.round((Number(v) / totalPieMinutes) * 100) : 0}%)`,
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: state.settings.theme === 'dark' ? '#111827' : '#ffffff',
                      borderColor: state.settings.theme === 'dark' ? '#374151' : '#f472b6',
                      borderRadius: '8px',
                      color: state.settings.theme === 'dark' ? '#f8fafc' : '#1e1b2e',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                    }}
                  />
                  <Legend formatter={(v) => <span style={{ fontSize: 11, fontFamily: 'Pixelify Sans, monospace', color: '#9d174d' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>

              {/* Subject Breakdown List with Daily Minutes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-pink-100">
                {subjectDistribution.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between text-xs font-pixel p-1.5 rounded bg-pink-50/50">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sub.color }} />
                      <span className="truncate font-semibold">{sub.shortName}</span>
                    </div>
                    <span className="font-mono font-bold text-pink-700 text-[11px]">
                      {formatTime(sub.value, timeFormat)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 font-pixel text-slate-500 text-xs space-y-2">
              <div className="text-2xl">🌱</div>
              <p className="font-bold text-slate-700">No study sessions logged {piePeriod === 'today' ? 'today' : 'in this period'} yet.</p>
              <p className="text-[11px] text-slate-400">Complete a study session or toggle to view past periods:</p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => setPiePeriod('7d')}
                  className="px-2.5 py-1 rounded bg-pink-100 text-pink-800 text-xs font-pixel hover:bg-pink-200 cursor-pointer border border-pink-300"
                >
                  View 7 Days
                </button>
                <button
                  onClick={() => setPiePeriod('all')}
                  className="px-2.5 py-1 rounded bg-pink-100 text-pink-800 text-xs font-pixel hover:bg-pink-200 cursor-pointer border border-pink-300"
                >
                  View All Time
                </button>
              </div>
            </div>
          )}
        </AncientJournalPanel>

        {/* Realm Level Progress Bars with Today's Study Minutes */}
        <AncientJournalPanel
          variant="stone"
          className="border-pink-300 shadow-[4px_4px_0px_#fbcfe8]"
        >
          <div className="mb-4 border-b border-pink-200 pb-3">
            <h3 className="text-sm font-pixel-heading text-pink-950">
              ISOMETRIC REALM DEVELOPMENT
            </h3>
            <p className="text-xs font-pixel text-slate-500">
              Restoration levels and daily focus invested today
            </p>
          </div>

          <div className="space-y-3.5 py-1">
            {realmProgress.map(r => (
              <div key={r.name} className="space-y-1.5 p-2 rounded-lg bg-pink-50/40 border border-pink-100 hover:bg-pink-50/80 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-pixel">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                    <span className="font-bold" style={{ color: r.color }}>{r.name}</span>
                    <span className="text-slate-600 text-[11px] truncate max-w-[140px] sm:max-w-none">— {r.realmName}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] font-bold">
                    {/* Minutes / Hours spent today on this subject */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 ${
                        r.todayMinutes > 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                      title={`Today's study time in ${r.name}`}
                    >
                      <span>⏱️ Today:</span>
                      <span className="font-bold">{formatTime(r.todayMinutes, timeFormat)}</span>
                    </span>

                    <span className="text-pink-700 bg-pink-100/60 px-1.5 py-0.5 rounded border border-pink-200">
                      Lv.{r.level} • {r.elements} monuments
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-pink-100 rounded-full overflow-hidden border border-pink-200">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (r.level / 10) * 100)}%`,
                      backgroundColor: r.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </AncientJournalPanel>
      </div>

      {/* Stacked Subject Breakdown Chart */}
      <AncientJournalPanel
        variant="stone"
        className="border-pink-300 shadow-[4px_4px_0px_#fbcfe8]"
      >
        <div className="mb-4 border-b border-pink-200 pb-3">
          <h3 className="text-sm font-pixel-heading text-pink-950">
            SEVEN-DAY MULTI-REALM WEAVE
          </h3>
          <p className="text-xs font-pixel text-slate-500">
            Stacked daily contributions by subject
          </p>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={getDailyStudyData(sessions, 7)} margin={{ top: 10, right: 10, bottom: 5, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
            <XAxis dataKey="label" tick={{ fill: '#db2777', fontSize: 10, fontFamily: 'Pixelify Sans, monospace' }} />
            <YAxis tick={{ fill: '#db2777', fontSize: 10, fontFamily: 'Pixelify Sans, monospace' }} unit="m" />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(v) => <span style={{ fontSize: 11, fontFamily: 'Pixelify Sans, monospace', color: '#9d174d' }}>{v}</span>} />
            {SUBJECT_IDS.map(id => (
              <Bar key={id} dataKey={`bySubject.${id}`} name={LABELS[id]} stackId="a" fill={COLORS[id]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </AncientJournalPanel>
    </div>
  );
};
