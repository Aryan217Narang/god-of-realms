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
  // Cloud sessions first
  for (const s of cloudSessions) {
    if (s && s.id) sessionMap.set(s.id, s);
  }
  // Incoming sessions (override or add)
  for (const s of incomingSessions) {
    if (s && s.id) sessionMap.set(s.id, s);
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

// PUT /api/state - Sync state from client
router.put('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const incomingState = req.body?.state;
    if (!incomingState) {
      res.status(400).json({ success: false, error: 'No state payload provided.' });
      return;
    }

    const currentState = await getUserState(req.userId!);
    const mergedState = mergeStateSessions(currentState, incomingState);

    await saveUserState(req.userId!, mergedState);
    res.json({ success: true, state: mergedState, updatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Save state error:', err);
    res.status(500).json({ success: false, error: 'Failed to save user state.' });
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
