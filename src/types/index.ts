// ============================================================
// Core TypeScript Interfaces for God of Realms
// ============================================================

export type SubjectId = 'daa' | 'os' | 'nosql' | 'hda_cognitive' | 'gv';

export interface Subject {
  id: SubjectId;
  name: string;
  shortName: string;
  realmName: string;
  description: string;
  theme: 'forest' | 'mountain' | 'ancient-city' | 'sanctuary' | 'floating-islands';
  relic: string;
  relicLore: string;
  color: string;
  glowColor: string;
  darkColor: string;
  totalMinutes: number;
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  xp: number;
  level: number;
  sessionsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastStudiedDate: string | null;
  unlockedElements: string[];
  studyGoalMinutes: number;
}

export interface StudySession {
  id: string;
  subjectId: SubjectId;
  buildTarget?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  completed: boolean;
  xpEarned: number;
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  mode: 'study' | 'shortBreak' | 'longBreak';
  selectedSubject: SubjectId | null;
  currentBuildTarget?: string | null;
  startTime: number | null;         // epoch ms when timer started
  pausedAt: number | null;          // epoch ms when paused
  accumulatedMs: number;            // ms accumulated before current start
  targetDurationMs: number;
  sessionStartTime: string | null;  // ISO start of current session
  sessionCount: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'general' | 'daa' | 'os' | 'nosql' | 'hda_cognitive' | 'gv';
  unlocked: boolean;
  unlockedAt: string | null;
  condition: AchievementCondition;
}

export interface AchievementCondition {
  type: 'sessions' | 'minutes' | 'level' | 'streak' | 'elements' | 'all_subjects' | 'all_levels';
  subjectId?: SubjectId;
  value: number;
}

export type ThemeMode = 'pink' | 'dark' | 'white';
export type TimeFormat = 'hours_decimal' | 'hours_mins' | 'minutes' | 'both';

export interface AppSettings {
  studyDurationMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  dailyGoalMinutes: number;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  theme: ThemeMode;
  timeFormat?: TimeFormat;
  subjectOverrides: Record<SubjectId, { name?: string; shortName?: string }>;
}

export interface AppState {
  subjects: Record<SubjectId, Subject>;
  sessions: StudySession[];
  timer: TimerState;
  achievements: Achievement[];
  settings: AppSettings;
  lastDailyReset: string;
  globalStreak: number;
  globalLongestStreak: number;
  globalLastStudiedDate: string | null;
}

export interface RealmElement {
  id: string;
  name: string;
  minutesRequired: number;
  levelRequired: number;
  description: string;
}

export interface LevelInfo {
  level: number;
  xpRequired: number;
  xpForNext: number;
  progress: number; // 0-1
}

export interface DailyStats {
  date: string;
  totalMinutes: number;
  sessionsBySubject: Record<SubjectId, number>;
}
