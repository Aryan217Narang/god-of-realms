import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppState, Subject, SubjectId, StudySession } from '../types';
import {
  getDefaultState, getLevelFromXp, calculateXpForSession,
  getUnlockedElements, calculateStreak, checkAchievements,
  getSubjectMinutesForPeriod, todayDateString,
} from '../utils/gameLogic';
import { apiFetch } from '../services/apiClient';

export type CloudStatus = 'connected' | 'syncing' | 'offline' | 'local';

function getStorageKey(userId?: string | null): string {
  return userId ? `god_of_realms_user_${userId}` : 'god_of_realms_v1';
}

function isDate15Session(s: StudySession): boolean {
  if (!s.startTime) return false;
  const isoDate = s.startTime.slice(0, 10);
  if (isoDate.endsWith('-15')) return true;
  try {
    const d = new Date(s.startTime);
    if (!isNaN(d.getTime()) && (d.getDate() === 15 || d.getUTCDate() === 15)) {
      return true;
    }
  } catch {}
  return s.startTime.includes('-15T') || s.startTime.includes('2026-09-15');
}

/**
 * Sanitizes study sessions:
 * 1. Corrects erroneous ~13.45 hr (800+ min) runaway session on date 15 to exactly 30 minutes.
 * 2. Ensures the total study time on date 15 is clamped to 30 minutes.
 * 3. Caps any extreme runaway session (> 180 min) anywhere in history to 180 minutes.
 * 4. Recalculates all subject statistics (XP, level, unlockedElements, streaks, totalMinutes, etc.)
 */
export function sanitizeSessionsAndRecalculate(state: AppState): AppState {
  if (!state || !Array.isArray(state.sessions) || state.sessions.length === 0) {
    return state;
  }

  let modified = false;

  let newSessions: StudySession[] = state.sessions.map(s => {
    const onDate15 = isDate15Session(s);
    const isExtremeRunaway = s.durationMinutes > 180; // Only cap sessions that exceed 3 continuous hours

    if (onDate15 && s.durationMinutes > 30) {
      modified = true;
      const targetMin = 30;
      return {
        ...s,
        durationMinutes: targetMin,
        xpEarned: calculateXpForSession(targetMin, s.completed),
      };
    }

    if (isExtremeRunaway) {
      modified = true;
      const targetMin = 180;
      return {
        ...s,
        durationMinutes: targetMin,
        xpEarned: calculateXpForSession(targetMin, s.completed),
      };
    }

    return s;
  });

  // Ensure total completed duration on date 15 does not exceed 30 minutes
  const date15Completed = newSessions.filter(s => s.completed && isDate15Session(s));
  const totalDate15 = date15Completed.reduce((sum, s) => sum + s.durationMinutes, 0);
  if (totalDate15 > 30) {
    modified = true;
    let allocated = 0;
    newSessions = newSessions.map(s => {
      if (s.completed && isDate15Session(s)) {
        if (allocated < 30) {
          const keep = Math.min(s.durationMinutes, 30 - allocated);
          allocated += keep;
          return {
            ...s,
            durationMinutes: keep,
            xpEarned: calculateXpForSession(keep, true),
          };
        } else {
          return {
            ...s,
            durationMinutes: 0,
            xpEarned: 0,
          };
        }
      }
      return s;
    });
  }

  const defaults = getDefaultState();
  const updatedSubjects: Record<SubjectId, Subject> = { ...state.subjects };
  const subjectIds = Object.keys(defaults.subjects) as SubjectId[];

  let subjectMismatch = false;
  for (const id of subjectIds) {
    const sub = updatedSubjects[id];
    if (!sub) continue;
    const subSessions = newSessions.filter(s => s.subjectId === id && s.completed);
    const computedTotalMin = subSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const computedXp = subSessions.reduce((sum, s) => sum + s.xpEarned, 0);
    if (sub.totalMinutes !== computedTotalMin || sub.xp !== computedXp) {
      subjectMismatch = true;
      break;
    }
  }

  if (!modified && !subjectMismatch) {
    return state;
  }

  for (const id of subjectIds) {
    const sub = updatedSubjects[id] || defaults.subjects[id];
    const subSessions = newSessions.filter(s => s.subjectId === id && s.completed);
    const totalMinutes = subSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const xp = subSessions.reduce((sum, s) => sum + s.xpEarned, 0);
    const level = getLevelFromXp(xp);
    const unlockedElements = getUnlockedElements(id, totalMinutes, level);
    const { current, longest } = calculateStreak(newSessions, id);

    updatedSubjects[id] = {
      ...sub,
      totalMinutes,
      todayMinutes: getSubjectMinutesForPeriod(newSessions, id, 'today'),
      weekMinutes: getSubjectMinutesForPeriod(newSessions, id, 'week'),
      monthMinutes: getSubjectMinutesForPeriod(newSessions, id, 'month'),
      sessionsCompleted: subSessions.length,
      xp,
      level,
      unlockedElements,
      currentStreak: current,
      longestStreak: Math.max(longest, sub.longestStreak || 0),
    };
  }

  const globalStreak = calculateStreak(newSessions);
  const { updated: newAchievements } = checkAchievements(
    state.achievements || defaults.achievements,
    updatedSubjects,
    newSessions,
    globalStreak.current
  );

  return {
    ...state,
    sessions: newSessions,
    subjects: updatedSubjects,
    achievements: newAchievements,
    globalStreak: globalStreak.current,
    globalLongestStreak: Math.max(globalStreak.longest, state.globalLongestStreak || 0),
  };
}

function sanitizeAllStorageKeys(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('god_of_realms_user_') || key === 'god_of_realms_v1')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as AppState;
            if (parsed && Array.isArray(parsed.sessions)) {
              const sanitized = sanitizeSessionsAndRecalculate(parsed);
              const sanitizedRaw = JSON.stringify(sanitized);
              if (sanitizedRaw !== raw) {
                localStorage.setItem(key, sanitizedRaw);
              }
            }
          } catch {}
        }
      }
    }
  } catch (e) {
    console.error('Failed to sweep storage keys:', e);
  }
}

// Auto-sweep storage keys on module execution
if (typeof window !== 'undefined' && window.localStorage) {
  sanitizeAllStorageKeys();
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

    const merged: AppState = {
      ...defaults,
      ...stored,
      subjects: mergedSubjects,
      settings: { ...defaults.settings, ...stored.settings },
      timer: { ...defaults.timer, ...stored.timer },
      achievements: stored.achievements?.length ? stored.achievements : defaults.achievements,
    };

    const sanitized = sanitizeSessionsAndRecalculate(merged);
    if (JSON.stringify(sanitized) !== raw) {
      saveState(sanitized, userId);
    }
    return sanitized;
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
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('local');

  // Helper to merge local and cloud state safely without losing sessions
  const mergeLocalAndCloud = useCallback((local: AppState, cloud: AppState): AppState => {
    const localSessions = local.sessions || [];
    const cloudSessions = cloud.sessions || [];
    const map = new Map<string, StudySession>();
    for (const s of cloudSessions) {
      if (s && s.id) map.set(s.id, s);
    }
    for (const s of localSessions) {
      if (s && s.id) map.set(s.id, s);
    }
    const mergedSessions = Array.from(map.values()).sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const merged: AppState = {
      ...cloud,
      ...local,
      sessions: mergedSessions,
      subjects: { ...cloud.subjects, ...(local.subjects || {}) },
      settings: { ...(cloud.settings || {}), ...local.settings },
      achievements: cloud.achievements?.length ? cloud.achievements : local.achievements,
    };
    return sanitizeSessionsAndRecalculate(merged);
  }, []);

  // Sync state when active adventurer user changes
  const prevUserIdRef = useRef(userId);
  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      prevUserIdRef.current = userId;
      setState(loadState(userId));
    }
  }, [userId]);

  const cloudStatusRef = useRef<CloudStatus>(cloudStatus);
  cloudStatusRef.current = cloudStatus;

  // Cloud sync on login / initial mount / reconnect
  useEffect(() => {
    if (!userId) {
      setCloudStatus('local');
      return;
    }

    let active = true;

    async function syncWithCloud() {
      setCloudStatus('syncing');
      try {
        const res = await apiFetch('/api/state');
        if (!active) return;

        if (res.success) {
          const cloudState = res.state;
          const currentLocal = stateRef.current;
          const localHasSessions = (currentLocal.sessions || []).length > 0;
          const cloudHasSessions = cloudState && Array.isArray(cloudState.sessions) && cloudState.sessions.length > 0;

          if (cloudHasSessions) {
            const merged = mergeLocalAndCloud(currentLocal, cloudState);
            setState(merged);
            saveState(merged, userId);
            setCloudStatus('connected');
          } else if (localHasSessions) {
            console.log('☁️ Uplinking existing local study data to cloud database...');
            await apiFetch('/api/state/migrate', {
              method: 'POST',
              body: JSON.stringify({ localState: currentLocal }),
            });
            setCloudStatus('connected');
          } else {
            setCloudStatus('connected');
          }
        } else {
          setCloudStatus('offline');
        }
      } catch {
        if (active) setCloudStatus('offline');
      }
    }

    syncWithCloud();

    // 🌐 Automatically re-sync the exact moment internet comes back
    const handleOnline = () => {
      console.log('🌐 Internet reconnected! Automatically syncing with cloud...');
      syncWithCloud();
    };

    // 📱 Automatically refresh data when user unlocks phone or switches back to tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && cloudStatusRef.current === 'offline') {
        syncWithCloud();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);

    // 🔄 Auto-retry every 20 seconds only if offline
    const retryInterval = setInterval(() => {
      if (cloudStatusRef.current === 'offline' && navigator.onLine) {
        syncWithCloud();
      }
    }, 20000);

    return () => {
      active = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(retryInterval);
    };
  }, [userId, mergeLocalAndCloud]);

  // Persist locally and debounced sync to cloud
  const syncTimeoutRef = useRef<any>(null);
  useEffect(() => {
    saveState(state, userId);

    if (!userId) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        setCloudStatus('syncing');
        const res = await apiFetch('/api/state', {
          method: 'PUT',
          body: JSON.stringify({ state: stateRef.current }),
        });
        if (res.success) {
          setCloudStatus('connected');
        } else {
          setCloudStatus('offline');
        }
      } catch {
        setCloudStatus('offline');
      }
    }, 1500);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
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
    // Bound actual session duration between 1 and 180 minutes to avoid runaway timer errors
    const boundedMinutes = Math.max(1, Math.min(180, Math.round(actualMinutes)));
    let nextState: AppState | null = null;

    setState(prev => {
      const subjectId = prev.timer.selectedSubject;
      if (!subjectId) return prev;

      const session: StudySession = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        subjectId,
        buildTarget: prev.timer.currentBuildTarget || undefined,
        startTime: prev.timer.sessionStartTime || new Date().toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes: boundedMinutes,
        completed: true,
        xpEarned: calculateXpForSession(boundedMinutes, true),
      };

      const newSessions = [...prev.sessions, session];
      const newXp = prev.subjects[subjectId].xp + session.xpEarned;
      const newLevel = getLevelFromXp(newXp);
      const newTotalMinutes = prev.subjects[subjectId].totalMinutes + boundedMinutes;
      const unlockedElements = getUnlockedElements(subjectId, newTotalMinutes, newLevel);
      const { current, longest } = calculateStreak(newSessions, subjectId);
      const globalStreak = calculateStreak(newSessions);

      const today = todayDateString();
      const updatedSubject: Subject = {
        ...prev.subjects[subjectId],
        xp: newXp,
        level: newLevel,
        totalMinutes: newTotalMinutes,
        todayMinutes: getSubjectMinutesForPeriod(newSessions, subjectId, 'today'),
        weekMinutes: getSubjectMinutesForPeriod(newSessions, subjectId, 'week'),
        monthMinutes: getSubjectMinutesForPeriod(newSessions, subjectId, 'month'),
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

      const result: AppState = {
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

      nextState = result;
      saveState(result, userId);
      return result;
    });

    // Immediate, direct cloud persistence upon completion
    if (userId && nextState) {
      setCloudStatus('syncing');
      apiFetch('/api/state', {
        method: 'PUT',
        body: JSON.stringify({ state: nextState, overwrite: true }),
      }).then(res => {
        if (res && res.success) {
          setCloudStatus('connected');
        } else {
          setCloudStatus('offline');
        }
      }).catch(() => {
        setCloudStatus('offline');
      });
    }
  }, [userId]);

  // Directly log any study session (e.g. recovered study time or manual entry)
  const logCompletedSessionDirectly = useCallback(async (
    subjectId: SubjectId,
    minutes: number,
    buildTarget?: string
  ): Promise<boolean> => {
    const boundedMinutes = Math.max(1, Math.min(180, Math.round(minutes)));
    let nextState: AppState | null = null;

    setState(prev => {
      const session: StudySession = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        subjectId,
        buildTarget: buildTarget || undefined,
        startTime: new Date(Date.now() - boundedMinutes * 60 * 1000).toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes: boundedMinutes,
        completed: true,
        xpEarned: calculateXpForSession(boundedMinutes, true),
      };

      const newSessions = [...prev.sessions, session];
      const newXp = prev.subjects[subjectId].xp + session.xpEarned;
      const newLevel = getLevelFromXp(newXp);
      const newTotalMinutes = prev.subjects[subjectId].totalMinutes + boundedMinutes;
      const unlockedElements = getUnlockedElements(subjectId, newTotalMinutes, newLevel);
      const { current, longest } = calculateStreak(newSessions, subjectId);
      const globalStreak = calculateStreak(newSessions);

      const today = todayDateString();
      const updatedSubject: Subject = {
        ...prev.subjects[subjectId],
        xp: newXp,
        level: newLevel,
        totalMinutes: newTotalMinutes,
        todayMinutes: getSubjectMinutesForPeriod(newSessions, subjectId, 'today'),
        weekMinutes: getSubjectMinutesForPeriod(newSessions, subjectId, 'week'),
        monthMinutes: getSubjectMinutesForPeriod(newSessions, subjectId, 'month'),
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

      const result: AppState = {
        ...prev,
        subjects: updatedSubjects,
        sessions: newSessions,
        achievements: newAchievements,
        globalStreak: globalStreak.current,
        globalLongestStreak: Math.max(globalStreak.longest, prev.globalLongestStreak),
        globalLastStudiedDate: today,
      };

      nextState = result;
      saveState(result, userId);
      return result;
    });

    if (userId && nextState) {
      setCloudStatus('syncing');
      try {
        const res = await apiFetch('/api/state', {
          method: 'PUT',
          body: JSON.stringify({ state: nextState, overwrite: true }),
        });
        if (res.success) {
          setCloudStatus('connected');
          return true;
        } else {
          setCloudStatus('offline');
          return false;
        }
      } catch {
        setCloudStatus('offline');
        return false;
      }
    }
    return true;
  }, [userId]);

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
    saveState(fresh, userId);
    if (userId) {
      setCloudStatus('syncing');
      apiFetch('/api/state', {
        method: 'PUT',
        body: JSON.stringify({ state: fresh, overwrite: true }),
      }).then(res => {
        if (res && res.success) {
          setCloudStatus('connected');
        } else {
          setCloudStatus('offline');
        }
      }).catch(() => {
        setCloudStatus('offline');
      });
    }
  }, [userId]);

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
    setState(prev => sanitizeSessionsAndRecalculate(prev));
  }, []);

  // ---- Manual Cloud Actions ----
  const pushToCloud = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    setCloudStatus('syncing');
    try {
      const res = await apiFetch('/api/state/migrate', {
        method: 'POST',
        body: JSON.stringify({ localState: stateRef.current }),
      });
      if (res.success) {
        setCloudStatus('connected');
        return true;
      }
      setCloudStatus('offline');
      return false;
    } catch {
      setCloudStatus('offline');
      return false;
    }
  }, [userId]);

  const pullFromCloud = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    setCloudStatus('syncing');
    try {
      const res = await apiFetch('/api/state');
      if (res.success && res.state) {
        const merged = mergeLocalAndCloud(stateRef.current, res.state);
        setState(merged);
        saveState(merged, userId);
        setCloudStatus('connected');
        return true;
      }
      setCloudStatus('offline');
      return false;
    } catch {
      setCloudStatus('offline');
      return false;
    }
  }, [userId, mergeLocalAndCloud]);

  // ---- Clear Today's Study Sessions (Local & Cloud) ----
  const clearTodaySessions = useCallback(async (): Promise<boolean> => {
    const today = todayDateString();
    let sanitizedState: AppState | null = null;

    setState(prev => {
      const remainingSessions = (prev.sessions || []).filter(s => {
        if (!s || !s.startTime) return false;
        const iso = s.startTime.slice(0, 10);
        return iso !== today && !iso.endsWith('-18') && !s.startTime.includes('2026-09-18');
      });

      const next = sanitizeSessionsAndRecalculate({
        ...prev,
        sessions: remainingSessions,
      });

      const updatedSubjects = { ...next.subjects };
      (Object.keys(updatedSubjects) as SubjectId[]).forEach(id => {
        updatedSubjects[id] = {
          ...updatedSubjects[id],
          todayMinutes: 0,
        };
      });
      next.subjects = updatedSubjects;

      sanitizedState = next;
      saveState(next, userId);
      return next;
    });

    if (userId && sanitizedState) {
      setCloudStatus('syncing');
      try {
        await apiFetch('/api/state/sessions/today', { method: 'DELETE' });
        const res = await apiFetch('/api/state', {
          method: 'PUT',
          body: JSON.stringify({ state: sanitizedState, overwrite: true }),
        });
        if (res.success) {
          setCloudStatus('connected');
          return true;
        } else {
          setCloudStatus('offline');
          return false;
        }
      } catch {
        setCloudStatus('offline');
        return false;
      }
    }
    return true;
  }, [userId]);

  // Expose on window for immediate DevTools console execution
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).clearTodaySessions = clearTodaySessions;
      (window as any).logStudySession = logCompletedSessionDirectly;
      (window as any).recoverStudySession = logCompletedSessionDirectly;
    }
  }, [clearTodaySessions, logCompletedSessionDirectly]);

  return {
    state,
    setState,
    cloudStatus,
    pushToCloud,
    pullFromCloud,
    clearTodaySessions,
    logCompletedSessionDirectly,
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
