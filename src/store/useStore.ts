import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppState, Subject, SubjectId, StudySession } from '../types';
import {
  getDefaultState, getLevelFromXp, calculateXpForSession,
  getUnlockedElements, calculateStreak, checkAchievements,
  getSubjectMinutesForPeriod, todayDateString,
} from '../utils/gameLogic';

function getStorageKey(userId?: string | null): string {
  return userId ? `god_of_realms_user_${userId}` : 'god_of_realms_v1';
}

function loadState(userId?: string | null): AppState {
  try {
    const key = getStorageKey(userId);
    let raw = localStorage.getItem(key);
    // If user has no saved state yet but guest state exists, migrate guest state
    if (!raw && userId) {
      raw = localStorage.getItem('god_of_realms_v1');
    }
    if (!raw) return getDefaultState();
    const stored = JSON.parse(raw) as AppState;
    const defaults = getDefaultState();
    const storedSubjects = stored.subjects || {};
    const mergedSubjects: Record<SubjectId, Subject> = {} as any;
    for (const id of Object.keys(defaults.subjects) as SubjectId[]) {
      const def = defaults.subjects[id];
      const stor = (storedSubjects as Record<string, any>)[id] || {};
      mergedSubjects[id] = {
        ...def,
        ...stor,
        relic: stor.relic || def.relic,
        relicLore: stor.relicLore || def.relicLore,
        theme: stor.theme || def.theme,
        realmName: def.realmName,
        shortName: def.shortName,
        name: def.name,
      };
    }

    return {
      ...defaults,
      ...stored,
      subjects: mergedSubjects,
      settings: { ...defaults.settings, ...stored.settings },
      timer: { ...defaults.timer, ...stored.timer },
      achievements: stored.achievements?.length ? stored.achievements : defaults.achievements,
    };
  } catch {
    return getDefaultState();
  }
}

function saveState(state: AppState, userId?: string | null): void {
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

// ============================================================
// The Main Store Hook
// ============================================================

export function useStore(userId?: string | null) {
  const [state, setState] = useState<AppState>(() => loadState(userId));
  const stateRef = useRef(state);
  stateRef.current = state;

  // Sync state when active adventurer user changes
  const prevUserIdRef = useRef(userId);
  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      prevUserIdRef.current = userId;
      setState(loadState(userId));
    }
  }, [userId]);

  // Persist on change
  useEffect(() => {
    saveState(state, userId);
  }, [state, userId]);

  // Timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.timer.isRunning && !s.timer.isPaused && s.timer.startTime !== null) {
        // Just trigger a re-render for the timer display; actual time calculation is derived
        setState(prev => ({ ...prev }));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ---- Timer Actions ----

  const startTimer = useCallback((subjectId: SubjectId, buildTarget?: string) => {
    setState(prev => {
      const settings = prev.settings;
      const targetMs = settings.studyDurationMinutes * 60 * 1000;
      return {
        ...prev,
        timer: {
          ...prev.timer,
          isRunning: true,
          isPaused: false,
          selectedSubject: subjectId,
          currentBuildTarget: buildTarget || prev.timer.currentBuildTarget || null,
          startTime: Date.now(),
          pausedAt: null,
          accumulatedMs: 0,
          targetDurationMs: targetMs,
          sessionStartTime: new Date().toISOString(),
          mode: 'study',
        },
      };
    });
  }, []);

  const pauseTimer = useCallback(() => {
    setState(prev => {
      if (!prev.timer.isRunning || prev.timer.isPaused) return prev;
      const elapsed = prev.timer.startTime ? Date.now() - prev.timer.startTime : 0;
      return {
        ...prev,
        timer: {
          ...prev.timer,
          isPaused: true,
          pausedAt: Date.now(),
          accumulatedMs: prev.timer.accumulatedMs + elapsed,
          startTime: null,
        },
      };
    });
  }, []);

  const resumeTimer = useCallback(() => {
    setState(prev => {
      if (!prev.timer.isPaused) return prev;
      return {
        ...prev,
        timer: {
          ...prev.timer,
          isPaused: false,
          startTime: Date.now(),
          pausedAt: null,
        },
      };
    });
  }, []);

  const resetTimer = useCallback(() => {
    setState(prev => ({
      ...prev,
      timer: {
        ...prev.timer,
        isRunning: false,
        isPaused: false,
        startTime: null,
        pausedAt: null,
        accumulatedMs: 0,
        sessionStartTime: null,
        currentBuildTarget: null,
        targetDurationMs: prev.settings.studyDurationMinutes * 60 * 1000,
      },
    }));
  }, []);

  const startBreak = useCallback((type: 'shortBreak' | 'longBreak') => {
    setState(prev => {
      const ms = type === 'shortBreak'
        ? prev.settings.shortBreakMinutes * 60 * 1000
        : prev.settings.longBreakMinutes * 60 * 1000;
      return {
        ...prev,
        timer: {
          ...prev.timer,
          isRunning: true,
          isPaused: false,
          mode: type,
          startTime: Date.now(),
          pausedAt: null,
          accumulatedMs: 0,
          targetDurationMs: ms,
          sessionStartTime: null,
        },
      };
    });
  }, []);

  const completeSession = useCallback((actualMinutes: number) => {
    setState(prev => {
      const subjectId = prev.timer.selectedSubject;
      if (!subjectId) return prev;

      const session: StudySession = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        subjectId,
        buildTarget: prev.timer.currentBuildTarget || undefined,
        startTime: prev.timer.sessionStartTime || new Date().toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes: actualMinutes,
        completed: true,
        xpEarned: calculateXpForSession(actualMinutes, true),
      };

      const newSessions = [...prev.sessions, session];
      const newXp = prev.subjects[subjectId].xp + session.xpEarned;
      const newLevel = getLevelFromXp(newXp);
      const newTotalMinutes = prev.subjects[subjectId].totalMinutes + actualMinutes;
      const unlockedElements = getUnlockedElements(subjectId, newTotalMinutes, newLevel);
      const { current, longest } = calculateStreak(newSessions, subjectId);
      const globalStreak = calculateStreak(newSessions);

      const today = todayDateString();
      const updatedSubject: Subject = {
        ...prev.subjects[subjectId],
        xp: newXp,
        level: newLevel,
        totalMinutes: newTotalMinutes,
        todayMinutes: getSubjectMinutesForPeriod(newSessions, subjectId, 'today') + actualMinutes,
        weekMinutes: getSubjectMinutesForPeriod(newSessions, subjectId, 'week') + actualMinutes,
        monthMinutes: getSubjectMinutesForPeriod(newSessions, subjectId, 'month') + actualMinutes,
        sessionsCompleted: prev.subjects[subjectId].sessionsCompleted + 1,
        currentStreak: current,
        longestStreak: Math.max(longest, prev.subjects[subjectId].longestStreak),
        lastStudiedDate: today,
        unlockedElements,
      };

      const updatedSubjects = { ...prev.subjects, [subjectId]: updatedSubject };
      const { updated: newAchievements } = checkAchievements(
        prev.achievements, updatedSubjects, newSessions, globalStreak.current
      );

      return {
        ...prev,
        subjects: updatedSubjects,
        sessions: newSessions,
        achievements: newAchievements,
        globalStreak: globalStreak.current,
        globalLongestStreak: Math.max(globalStreak.longest, prev.globalLongestStreak),
        globalLastStudiedDate: today,
        timer: {
          ...prev.timer,
          isRunning: false,
          isPaused: false,
          startTime: null,
          pausedAt: null,
          accumulatedMs: 0,
          sessionStartTime: null,
          currentBuildTarget: null,
          sessionCount: prev.timer.sessionCount + 1,
          targetDurationMs: prev.settings.studyDurationMinutes * 60 * 1000,
        },
      };
    });
  }, []);

  // Compute elapsed ms from timer state
  const getElapsedMs = useCallback((): number => {
    const t = stateRef.current.timer;
    let elapsed = t.accumulatedMs;
    if (t.isRunning && !t.isPaused && t.startTime !== null) {
      elapsed += Date.now() - t.startTime;
    }
    return elapsed;
  }, []);

  const getRemainingMs = useCallback((): number => {
    const t = stateRef.current.timer;
    return Math.max(0, t.targetDurationMs - getElapsedMs());
  }, [getElapsedMs]);

  // ---- Settings ----

  const updateSettings = useCallback((updates: Partial<AppState['settings']>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

  // ---- Data Management ----

  const resetAllData = useCallback(() => {
    const fresh = getDefaultState();
    setState(fresh);
    saveState(fresh);
  }, []);

  const exportData = useCallback((): string => {
    return JSON.stringify(stateRef.current, null, 2);
  }, []);

  const importData = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json) as AppState;
      setState(parsed);
      saveState(parsed);
      return true;
    } catch {
      return false;
    }
  }, []);

  // ---- Recalculate subject stats from sessions ----
  const recalcSubjectStats = useCallback(() => {
    setState(prev => {
      const newSubjects = { ...prev.subjects };
      const subjectIds: SubjectId[] = ['daa', 'os', 'nosql', 'hda_cognitive', 'gv'];
      subjectIds.forEach(id => {
        const totalMinutes = getSubjectMinutesForPeriod(prev.sessions, id, 'all');
        const todayMinutes = getSubjectMinutesForPeriod(prev.sessions, id, 'today');
        const weekMinutes = getSubjectMinutesForPeriod(prev.sessions, id, 'week');
        const monthMinutes = getSubjectMinutesForPeriod(prev.sessions, id, 'month');
        const totalXp = prev.sessions.filter(s => s.subjectId === id && s.completed).reduce((sum, s) => sum + s.xpEarned, 0);
        const level = getLevelFromXp(totalXp);
        const unlockedElements = getUnlockedElements(id, totalMinutes, level);
        const streak = calculateStreak(prev.sessions, id);
        newSubjects[id] = {
          ...prev.subjects[id],
          totalMinutes, todayMinutes, weekMinutes, monthMinutes,
          xp: totalXp, level,
          unlockedElements,
          currentStreak: streak.current,
          longestStreak: Math.max(streak.longest, prev.subjects[id].longestStreak),
          sessionsCompleted: prev.sessions.filter(s => s.subjectId === id && s.completed).length,
        };
      });
      return { ...prev, subjects: newSubjects };
    });
  }, []);

  return {
    state,
    setState,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    startBreak,
    completeSession,
    getElapsedMs,
    getRemainingMs,
    updateSettings,
    resetAllData,
    exportData,
    importData,
    recalcSubjectStats,
  };
}
