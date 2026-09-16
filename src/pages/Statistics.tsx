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
  const [selectedBarDate, setSelectedBarDate] = useState<string | null>(null);
  const [selectedBarLabel, setSelectedBarLabel] = useState<string | null>(null);

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

  // Helper to extract minutes for a specific ISO date (YYYY-MM-DD)
  const getSubjectMinutesForDate = (dateStr: string, subjectId: SubjectId): number => {
    return sessions
      .filter(s => s.completed && s.subjectId === subjectId && s.startTime.slice(0, 10) === dateStr)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
  };

  // Subject distribution for Pie Chart (Supports clicked bar date, Today, 7 Days, 30 Days, All Time)
  const subjectDistribution = SUBJECT_IDS.map(id => {
    let mins = 0;
    if (selectedBarDate) {
      mins = getSubjectMinutesForDate(selectedBarDate, id);
    } else if (piePeriod === 'today') {
      mins = getSubjectMinutesForPeriod(sessions, id, 'today');
    } else if (piePeriod === '7d') {
      mins = getSubjectMinutesForPeriod(sessions, id, 'week');
    } else if (piePeriod === '30d') {
      mins = getSubjectMinutesForPeriod(sessions, id, 'month');
    } else {
      mins = getSubjectMinutesForPeriod(sessions, id, 'all');
    }
    return {
      id,
      name: LABELS[id],
      shortName: state.subjects[id].shortName,
      value: mins,
      color: COLORS[id],
    };
  }).filter(d => d.value > 0);

  const totalPieMinutes = subjectDistribution.reduce((sum, d) => sum + d.value, 0);

  // Subject study times for the active inspection (selectedBarDate or piePeriod)
  const allSubjectTimes = SUBJECT_IDS.map(id => {
    let mins = 0;
    if (selectedBarDate) {
      mins = getSubjectMinutesForDate(selectedBarDate, id);
    } else if (piePeriod === 'today') {
      mins = getSubjectMinutesForPeriod(sessions, id, 'today');
    } else if (piePeriod === '7d') {
      mins = getSubjectMinutesForPeriod(sessions, id, 'week');
    } else if (piePeriod === '30d') {
      mins = getSubjectMinutesForPeriod(sessions, id, 'month');
    } else {
      mins = getSubjectMinutesForPeriod(sessions, id, 'all');
    }
    return {
      id,
      name: LABELS[id],
      shortName: state.subjects[id].shortName,
      realmName: state.subjects[id].realmName,
      level: state.subjects[id].level,
      elements: state.subjects[id].unlockedElements.length,
      minutes: mins,
      color: COLORS[id],
    };
  });

  const totalPeriodMinutes = allSubjectTimes.reduce((sum, s) => sum + s.minutes, 0);

  // Realm architectural restoration progress (purely levels, monuments, world development - time removed)
  const realmProgress = SUBJECT_IDS.map(id => ({
    id,
    name: LABELS[id],
    shortName: state.subjects[id].shortName,
    realmName: state.subjects[id].realmName,
    level: state.subjects[id].level,
    elements: state.subjects[id].unlockedElements.length,
    color: COLORS[id],
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Deduplicate entries if both Bar and Line track 'total'
      const uniquePayload = payload.filter((p: any, idx: number, arr: any[]) =>
        arr.findIndex((x: any) => (x.dataKey || x.name) === (p.dataKey || p.name)) === idx
      );
      return (
        <div className="bg-white border-2 border-pink-500 rounded-lg p-2.5 text-xs font-mono shadow-xl text-slate-800">
          <p className="text-pink-600 font-bold mb-1 border-b border-pink-100 pb-1 flex items-center justify-between gap-2">
            <span>📅 {label}</span>
            <span className="text-[10px] text-slate-400 font-normal">Click bar to view</span>
          </p>
          {uniquePayload.map((p: any, i: number) => {
            const isTotal = p.name === 'Minutes' || p.name === 'Total' || p.name === 'Study Time' || p.name === 'Study Pulse';
            const labelName = isTotal
              ? (timeFormat.startsWith('hours') ? 'Study Time' : 'Minutes')
              : p.name;
            return (
              <p key={i} style={{ color: p.color || p.fill || p.stroke || '#db2777' }} className="flex justify-between gap-3 font-semibold">
                <span>{labelName}:</span>
                <span className="font-bold">{formatTime(Number(p.value), timeFormat)}</span>
              </p>
            );
          })}
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
          <div className="text-xs">
            <span className="text-slate-500 block text-[10px] uppercase font-pixel">All-Time Scholarship</span>
            <span className="text-pink-600 font-mono font-bold text-sm">{formatTime(allMin, timeFormat)} Recorded</span>
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
            <div className="text-xl font-mono font-bold text-pink-600">
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
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-pixel-heading text-pink-950">
                  DAILY STUDY ARCHIVE
                </h3>
                {selectedBarDate && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-pink-500 text-white animate-pulse">
                    Selected: {selectedBarLabel || selectedBarDate}
                  </span>
                )}
              </div>
              <p className="text-xs font-pixel text-slate-500 mt-0.5">
                Hours and minutes invested across day intervals • <span className="text-pink-600 font-bold">Click any bar to inspect in pie chart below</span>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {selectedBarDate && (
                <button
                  onClick={() => {
                    setSelectedBarDate(null);
                    setSelectedBarLabel(null);
                  }}
                  className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 text-[11px] font-mono font-bold hover:bg-rose-200 cursor-pointer border border-rose-300"
                  title="Clear selected date"
                >
                  ✕ Clear
                </button>
              )}
              <div className="flex gap-1 bg-pink-50 p-1 rounded border border-pink-200 self-start sm:self-auto">
                <button
                  onClick={() => {
                    setPeriod(7);
                    setSelectedBarDate(null);
                    setSelectedBarLabel(null);
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold cursor-pointer transition-all ${
                    period === 7
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-pink-700 hover:bg-pink-100'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => {
                    setPeriod(30);
                    setSelectedBarDate(null);
                    setSelectedBarLabel(null);
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold cursor-pointer transition-all ${
                    period === 30
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-pink-700 hover:bg-pink-100'
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart
              data={dailyData}
              margin={{ top: 15, right: 15, bottom: 5, left: -15 }}
              barSize={period === 30 ? 14 : 26}
              maxBarSize={period === 30 ? 16 : 30}
              className="cursor-pointer"
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                  const entry = e.activePayload[0].payload;
                  if (entry && entry.date) {
                    setSelectedBarDate(entry.date);
                    setSelectedBarLabel(entry.label);
                  }
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey="label" tick={{ fill: '#db2777', fontSize: 10, fontFamily: 'Consolas, "Courier New", monospace' }} />
              <YAxis
                tick={{ fill: '#db2777', fontSize: 10, fontFamily: 'Consolas, "Courier New", monospace' }}
                tickFormatter={(val) => {
                  if (timeFormat.startsWith('hours')) {
                    if (val === 0) return '0h';
                    const h = Math.round((val / 60) * 10) / 10;
                    return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`;
                  }
                  return `${val}m`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Daily Study Bars with Interactive Bar Click */}
              <Bar
                dataKey="total"
                name={timeFormat.startsWith('hours') ? 'Study Time' : 'Minutes'}
                radius={[4, 4, 0, 0]}
                barSize={period === 30 ? 14 : 26}
                maxBarSize={period === 30 ? 16 : 30}
                cursor="pointer"
                onClick={(entry: any) => {
                  const payload = entry && (entry.payload || entry);
                  if (payload && payload.date) {
                    setSelectedBarDate(payload.date);
                    setSelectedBarLabel(payload.label);
                  }
                }}
              >
                {dailyData.map((entry) => {
                  const isSelected = selectedBarDate === entry.date;
                  return (
                    <Cell
                      key={entry.date}
                      fill={isSelected ? '#db2777' : '#f472b6'}
                      stroke={isSelected ? '#9d174d' : 'transparent'}
                      strokeWidth={isSelected ? 2.5 : 0}
                      opacity={selectedBarDate ? (isSelected ? 1 : 0.45) : 0.75}
                    />
                  );
                })}
              </Bar>
              {/* Connected Node Line matching sketch */}
              <Line
                type="monotone"
                dataKey="total"
                stroke="#db2777"
                strokeWidth={3}
                name={timeFormat.startsWith('hours') ? 'Study Time' : 'Minutes'}
                dot={{ stroke: '#be185d', strokeWidth: 2.5, r: 5.5, fill: '#ffffff' }}
                activeDot={{ stroke: '#9d174d', strokeWidth: 3.5, r: 8, fill: '#ec4899' }}
              />
            </ComposedChart>
          </ResponsiveContainer>

        </AncientJournalPanel>
      </div>

      {/* 2-Column Grid: Left = SCHOLARSHIP HARMONY (Pie Chart), Right = REALM STUDY TIMES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left Column: Pie Chart (Scholarship Harmony) */}
        <AncientJournalPanel
          variant="stone"
          className="border-pink-300 shadow-[4px_4px_0px_#fbcfe8] flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-pink-200 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-pixel-heading text-pink-950">
                    SCHOLARSHIP HARMONY
                  </h3>
                  {selectedBarDate && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500 text-white font-bold animate-pulse">
                      📅 {selectedBarLabel || selectedBarDate}
                    </span>
                  )}
                </div>
                <p className="text-xs font-pixel text-slate-500 mt-0.5">
                  {selectedBarDate
                    ? `Showing proportion for ${selectedBarLabel || selectedBarDate}`
                    : piePeriod === 'today'
                    ? "Today's daily subject breakdown"
                    : 'Proportion of time across each realm'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedBarDate && (
                  <button
                    onClick={() => {
                      setSelectedBarDate(null);
                      setSelectedBarLabel(null);
                      setPiePeriod('today');
                    }}
                    className="px-2 py-1 rounded bg-rose-100 text-rose-800 hover:bg-rose-200 text-[11px] font-mono font-bold cursor-pointer border border-rose-300"
                    title="Reset to today"
                  >
                    ✕ Reset
                  </button>
                )}
                <div className="flex gap-1 bg-pink-50 p-1 rounded border border-pink-200 self-start sm:self-auto flex-wrap">
                  {[
                    { id: 'today', label: '📅 Today' },
                    { id: '7d', label: '7 Days' },
                    { id: '30d', label: '30 Days' },
                    { id: 'all', label: 'All Time' },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedBarDate(null);
                        setSelectedBarLabel(null);
                        setPiePeriod(p.id as any);
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold cursor-pointer transition-all ${
                        !selectedBarDate && piePeriod === p.id
                          ? 'bg-pink-500 text-white shadow-sm'
                          : 'text-slate-600 hover:text-pink-700 hover:bg-pink-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {subjectDistribution.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={subjectDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={36}
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
                        fontFamily: 'Consolas, "Courier New", monospace',
                        fontWeight: 'bold',
                      }}
                    />
                    <Legend formatter={(v) => <span style={{ fontSize: 11, fontFamily: 'Consolas, "Courier New", monospace', color: '#9d174d' }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 font-pixel text-slate-500 text-xs space-y-2">
                <div className="text-2xl">🌱</div>
                <p className="font-bold text-slate-700">
                  {selectedBarDate
                    ? `No study sessions logged on ${selectedBarLabel || selectedBarDate}.`
                    : `No study sessions logged ${piePeriod === 'today' ? 'today' : 'in this period'} yet.`}
                </p>
                <p className="text-[11px] text-slate-400">Complete a study session or toggle to view past periods:</p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => { setSelectedBarDate(null); setSelectedBarLabel(null); setPiePeriod('7d'); }}
                    className="px-2.5 py-1 rounded bg-pink-100 text-pink-800 text-xs font-mono font-bold hover:bg-pink-200 cursor-pointer border border-pink-300"
                  >
                    View 7 Days
                  </button>
                  <button
                    onClick={() => { setSelectedBarDate(null); setSelectedBarLabel(null); setPiePeriod('all'); }}
                    className="px-2.5 py-1 rounded bg-pink-100 text-pink-800 text-xs font-mono font-bold hover:bg-pink-200 cursor-pointer border border-pink-300"
                  >
                    View All Time
                  </button>
                </div>
              </div>
            )}
          </div>
        </AncientJournalPanel>

        {/* Right Column: SUBJECT STUDY TIMES (In place of Isometric Realm Data) */}
        <AncientJournalPanel
          variant="stone"
          className="border-pink-300 shadow-[4px_4px_0px_#fbcfe8]"
        >
          <div className="flex items-center justify-between gap-2 mb-4 border-b border-pink-200 pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-pixel-heading text-pink-950">
                  REALM STUDY TIMES
                </h3>
                {selectedBarDate && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500 text-white font-bold animate-pulse">
                    📅 {selectedBarLabel || selectedBarDate}
                  </span>
                )}
              </div>
              <p className="text-xs font-pixel text-slate-600 mt-0.5">
                {selectedBarDate
                  ? `Specific study times for ${selectedBarLabel || selectedBarDate}`
                  : piePeriod === 'today'
                  ? "Today's specific study times per subject"
                  : 'Specific study times invested in this period'}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[10px] font-pixel text-slate-500 block uppercase font-bold">Total Studied</span>
              <span className="text-sm font-mono font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                {formatTime(totalPeriodMinutes, timeFormat)}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {allSubjectTimes.map(sub => {
              const percent = totalPeriodMinutes > 0 ? Math.round((sub.minutes / totalPeriodMinutes) * 100) : 0;
              const hasTime = sub.minutes > 0;
              return (
                <div
                  key={sub.id}
                  className={`p-2.5 rounded-lg border transition-all ${
                    hasTime
                      ? 'bg-pink-50/70 border-pink-300 shadow-sm'
                      : 'bg-white border-pink-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-pixel mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs" style={{ backgroundColor: sub.color }} />
                      <span className="font-bold truncate" style={{ color: sub.color }}>
                        {sub.name}
                      </span>
                      <span className="text-slate-600 text-[11px] font-semibold truncate hidden sm:inline">
                        — {sub.realmName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px] font-bold flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded border ${
                          hasTime
                            ? 'bg-pink-100 text-pink-800 border-pink-300'
                            : 'bg-pink-50 text-slate-700 border-pink-200'
                        }`}
                      >
                        {formatTime(sub.minutes, timeFormat)}
                      </span>
                      <span className="text-[10px] text-slate-700 bg-white px-1.5 py-0.5 rounded border border-pink-200 min-w-[36px] text-center font-bold">
                        {percent}%
                      </span>
                    </div>
                  </div>
                  {/* Proportional focus bar */}
                  <div className="w-full h-2 bg-pink-100 rounded-full overflow-hidden border border-pink-200">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: sub.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </AncientJournalPanel>
      </div>

      {/* SEVEN-DAY MULTI-REALM WEAVE (Placed on top of Isometric Realm Architecture) */}
      <div className="mb-8">
        <AncientJournalPanel
          variant="stone"
          className="border-pink-300 shadow-[4px_4px_0px_#fbcfe8]"
        >
          <div className="mb-4 border-b border-pink-200 pb-3">
            <h3 className="text-sm font-pixel-heading text-pink-950">
              SEVEN-DAY MULTI-REALM WEAVE
            </h3>
            <p className="text-xs font-pixel text-slate-600">
              Stacked daily contributions by subject
            </p>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={getDailyStudyData(sessions, 7)}
              margin={{ top: 10, right: 10, bottom: 5, left: -15 }}
              barSize={26}
              maxBarSize={30}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey="label" tick={{ fill: '#db2777', fontSize: 10, fontFamily: 'Consolas, "Courier New", monospace' }} />
              <YAxis
                tick={{ fill: '#db2777', fontSize: 10, fontFamily: 'Consolas, "Courier New", monospace' }}
                tickFormatter={(val) => formatTime(val, timeFormat)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ fontSize: 11, fontFamily: 'Consolas, "Courier New", monospace', color: '#9d174d' }}>{v}</span>} />
              {SUBJECT_IDS.map(id => (
                <Bar key={id} dataKey={`bySubject.${id}`} name={LABELS[id]} stackId="a" fill={COLORS[id]} barSize={26} maxBarSize={30} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </AncientJournalPanel>
      </div>

      {/* ISOMETRIC REALM ARCHITECTURE & RESTORATION (Rolled back to architectural cards, time removed) */}
      <div className="mb-8">
        <AncientJournalPanel
          variant="stone"
          className="border-pink-300 shadow-[4px_4px_0px_#fbcfe8]"
        >
          <div className="mb-5 border-b border-pink-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm md:text-base font-pixel-heading text-pink-950">
                ISOMETRIC REALM ARCHITECTURE & RESTORATION
              </h3>
              <p className="text-xs font-pixel text-slate-600 mt-0.5">
                World restoration levels and sacred monument awakenings across the five realms
              </p>
            </div>
            <span className="text-[11px] font-pixel text-pink-600 bg-pink-50 px-3 py-1 rounded border border-pink-200 font-bold self-start sm:self-auto">
              5 Mythic Domains
            </span>
          </div>

          <div className="space-y-4">
            {realmProgress.map(r => {
              const maxLevel = 20;
              const levelPercent = Math.min(100, Math.round((r.level / maxLevel) * 100));
              return (
                <div
                  key={r.id}
                  className="p-4 rounded-xl bg-white border-2 border-pink-200 shadow-[3px_3px_0px_#fbcfe8] hover:border-pink-400 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center border-2 flex-shrink-0"
                        style={{
                          backgroundColor: `${r.color}15`,
                          borderColor: r.color,
                        }}
                      >
                        <RelicDisplay subjectId={r.id} level={r.level} size="sm" showTooltip={false} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold font-pixel text-sm" style={{ color: r.color }}>
                            {r.realmName}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-pink-200 bg-pink-50 text-pink-700 font-bold">
                            {r.shortName}
                          </span>
                        </div>
                        <p className="text-xs font-pixel text-slate-600 mt-0.5">
                          {r.name}
                        </p>
                      </div>
                    </div>

                    {/* Realm Stats (Purely Level and Monuments - Time Removed!) */}
                    <div className="flex items-center gap-2 font-mono text-xs font-bold self-start sm:self-auto flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-pink-50 text-pink-800 border border-pink-200 shadow-sm">
                        🏛️ Lv.{r.level} / {maxLevel}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
                        ✨ {r.elements} Monuments Awoken
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                        {levelPercent}% Restored
                      </span>
                    </div>
                  </div>

                  {/* Big, spacious architectural restoration progress bar */}
                  <div className="space-y-1">
                    <div className="w-full h-4 bg-pink-100 rounded-full overflow-hidden border-2 border-pink-200 relative shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-700 relative"
                        style={{
                          width: `${levelPercent}%`,
                          backgroundColor: r.color,
                        }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] font-pixel text-slate-600 px-1 font-bold">
                      <span>Restoration Progress: {levelPercent}%</span>
                      <span>Tier {Math.min(5, Math.floor(r.level / 4) + 1)} Architectural Stage</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </AncientJournalPanel>
      </div>
    </div>
  );
};
