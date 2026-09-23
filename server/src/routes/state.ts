import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { getUserState, saveUserState } from '../db.js';

const router = Router();

/**
 * Helper to merge sessions by unique id so no session is ever lost during sync
 */
function mergeStateSessions(cloudState: any | null, incomingState: any): any {
  if (!cloudState) return incomingState;

  const cloudSessions = Array.isArray(cloudState.sessions) ? cloudState.sessions : [];
  const incomingSessions = Array.isArray(incomingState.sessions) ? incomingState.sessions : [];

  const sessionMap = new Map<string, any>();
  // Cloud sessions first (ignoring any runaway >= 180m sessions)
  for (const s of cloudSessions) {
    if (s && s.id && s.durationMinutes < 180) sessionMap.set(s.id, s);
  }
  // Incoming sessions (override or add)
  for (const s of incomingSessions) {
    if (s && s.id && s.durationMinutes < 180) sessionMap.set(s.id, s);
  }

  const mergedSessions = Array.from(sessionMap.values()).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return {
    ...cloudState,
    ...incomingState,
    sessions: mergedSessions,
    // Prefer higher XP/level if discrepancy
    subjects: incomingState.subjects || cloudState.subjects,
    settings: { ...(cloudState.settings || {}), ...(incomingState.settings || {}) },
    achievements: incomingState.achievements || cloudState.achievements,
  };
}

// GET /api/state - Retrieve user's realm state
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const state = await getUserState(req.userId!);
    res.json({ success: true, state: state || null });
  } catch (err: any) {
    console.error('Fetch state error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch user state.' });
  }
});

// PUT /api/state - Sync state from client (supports overwrite: true for deletions)
router.put('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const incomingState = req.body?.state;
    const isOverwrite = req.body?.overwrite === true || req.query?.force === 'true';

    if (!incomingState) {
      res.status(400).json({ success: false, error: 'No state payload provided.' });
      return;
    }

    let finalState: any;
    if (isOverwrite) {
      finalState = incomingState;
    } else {
      const currentState = await getUserState(req.userId!);
      finalState = mergeStateSessions(currentState, incomingState);
    }

    await saveUserState(req.userId!, finalState);
    res.json({ success: true, state: finalState, updatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Save state error:', err);
    res.status(500).json({ success: false, error: 'Failed to save user state.' });
  }
});

// DELETE /api/state/sessions/today - Clear all sessions logged today from cloud database
router.delete('/sessions/today', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentState = await getUserState(req.userId!);
    if (!currentState) {
      res.json({ success: true, message: 'No state found' });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const clientDate = typeof req.query.date === 'string' && req.query.date ? req.query.date : null;
    const tzOffset = req.query.tzOffset ? parseInt(req.query.tzOffset as string, 10) : null;
    const sessionIdsToDelete = new Set(
      Array.isArray(req.body?.sessionIds) ? req.body.sessionIds : []
    );

    const filteredSessions = (currentState.sessions || []).filter((s: any) => {
      if (!s || !s.startTime) return false;
      // 1. Direct match by session ID
      if (s.id && sessionIdsToDelete.has(s.id)) {
        return false;
      }
      // 2. Exact UTC date match
      const iso = s.startTime.slice(0, 10);
      if (iso === todayStr || (clientDate && iso === clientDate)) {
        return false;
      }
      // 3. Timezone-aware date match
      if (tzOffset !== null && !isNaN(tzOffset)) {
        try {
          const sessionLocal = new Date(new Date(s.startTime).getTime() - tzOffset * 60000);
          const sessionLocalDate = sessionLocal.toISOString().slice(0, 10);
          if (clientDate && sessionLocalDate === clientDate) return false;
        } catch {}
      }
      return true;
    });

    const updatedSubjects = { ...(currentState.subjects || {}) };
    Object.keys(updatedSubjects).forEach(key => {
      if (updatedSubjects[key]) {
        updatedSubjects[key] = {
          ...updatedSubjects[key],
          todayMinutes: 0,
        };
      }
    });

    const updatedState = {
      ...currentState,
      sessions: filteredSessions,
      subjects: updatedSubjects,
    };

    await saveUserState(req.userId!, updatedState);
    console.log(`🗑️ Cleared today's study sessions in cloud for user ${req.userId}. Removed count: ${(currentState.sessions || []).length - filteredSessions.length}`);
    res.json({ success: true, state: updatedState });
  } catch (err: any) {
    console.error('Delete today sessions error:', err);
    res.status(500).json({ success: false, error: 'Failed to clear today sessions.' });
  }
});

// POST /api/state/migrate - Uplink existing local state
router.post('/migrate', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const localState = req.body?.localState;
    if (!localState) {
      res.status(400).json({ success: false, error: 'No localState payload provided.' });
      return;
    }

    const currentState = await getUserState(req.userId!);
    const merged = mergeStateSessions(currentState, localState);

    await saveUserState(req.userId!, merged);
    console.log(`🚀 Migrated local state for user ${req.userId}: ${merged.sessions?.length || 0} sessions preserved.`);
    res.json({ success: true, state: merged, migrated: true });
  } catch (err: any) {
    console.error('Migrate state error:', err);
    res.status(500).json({ success: false, error: 'Failed to migrate local state.' });
  }
});

export default router;
