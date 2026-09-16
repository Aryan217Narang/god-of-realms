import type {
  User,
  StoredUserAccount,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse
} from '../types/auth';
import { signJwt, verifyJwt } from './jwt';
import { apiFetch } from './apiClient';

const USERS_STORAGE_KEY = 'god_of_realms_users_v1';
const TOKEN_STORAGE_KEY = 'god_of_realms_jwt';

/**
 * Hash password with salt using Web Crypto SHA-256
 */
async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${password}:${salt}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Loads stored accounts
 */
function loadUsers(): Record<string, StoredUserAccount> {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Saves stored accounts
 */
function saveUsers(users: Record<string, StoredUserAccount>): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to persist user database:', err);
  }
}

import type { AppState, StudySession, SubjectId } from '../types';
import { getDefaultState } from '../utils/gameLogic';

function createDemoInitialState(): AppState {
  const base = getDefaultState();
  const now = Date.now();
  const sessions: StudySession[] = [];

  // Create realistic completed sessions across the last 7 days with natural dynamic fluctuations
  const schedule: Array<{ daysAgo: number; subjectId: SubjectId; duration: number; target: string }> = [
    { daysAgo: 6, subjectId: 'hda_cognitive', duration: 45, target: 'Plant Healing Lavender Garden' },
    { daysAgo: 5, subjectId: 'daa', duration: 50, target: 'Pave Mossy Forest Path' },
    { daysAgo: 5, subjectId: 'os', duration: 35, target: 'Place Stone Hiking Steps' },
    { daysAgo: 4, subjectId: 'nosql', duration: 60, target: 'Excavate Sunken Plaza' },
    { daysAgo: 4, subjectId: 'gv', duration: 60, target: 'Erect Graph Coordinate Pylon' },
    { daysAgo: 3, subjectId: 'os', duration: 40, target: 'Kindle Campfire Hearth' },
    { daysAgo: 3, subjectId: 'hda_cognitive', duration: 25, target: 'Carve Serene Reflection Pond' },
    { daysAgo: 2, subjectId: 'gv', duration: 75, target: 'Weave Glowing Sky Ley Bridge' },
    { daysAgo: 2, subjectId: 'daa', duration: 65, target: 'Nurture Mystic Mushroom Ring' },
    { daysAgo: 1, subjectId: 'os', duration: 45, target: 'Carve Mountain Hiking Trail' },
    { daysAgo: 1, subjectId: 'nosql', duration: 40, target: 'Erect Ancient City Obelisk' },
    { daysAgo: 0, subjectId: 'daa', duration: 60, target: 'Plant Ancient Alpine Pine' },
    { daysAgo: 0, subjectId: 'hda_cognitive', duration: 50, target: 'Build Medical Research Pavilion' },
  ];

  schedule.forEach((item, index) => {
    const sessionTime = new Date(now - item.daysAgo * 86400000 - 3600000 * 2).toISOString();
    sessions.push({
      id: `demo_sess_${index}`,
      subjectId: item.subjectId,
      buildTarget: item.target,
      startTime: sessionTime,
      endTime: new Date(now - item.daysAgo * 86400000 - 3600000).toISOString(),
      durationMinutes: item.duration,
      completed: true,
      xpEarned: item.duration + 25,
    });
  });

  // Calculate subject stats
  const subjectIds: SubjectId[] = ['daa', 'os', 'nosql', 'hda_cognitive', 'gv'];
  subjectIds.forEach(id => {
    const subSessions = sessions.filter(s => s.subjectId === id);
    const totalMinutes = subSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const xp = subSessions.reduce((acc, s) => acc + s.xpEarned, 0);
    const todayMinutes = subSessions.filter(s => s.startTime.slice(0, 10) === base.lastDailyReset).reduce((acc, s) => acc + s.durationMinutes, 0);

    const unlocked: Record<SubjectId, string[]> = {
      daa: ['daa_sapling', 'daa_path', 'daa_bush', 'daa_flowers', 'daa_stream'],
      os: ['os_basecamp', 'os_trail', 'os_tent', 'os_cave', 'os_flag1'],
      nosql: ['nosql_road', 'nosql_terminal', 'nosql_small_building', 'nosql_neon', 'nosql_server'],
      hda_cognitive: ['hda_entrance', 'hda_station', 'hda_lab', 'hda_garden', 'hda_brain_monument'],
      gv: ['gv_portal', 'gv_island1', 'gv_bridge', 'gv_temple'],
    };

    base.subjects[id] = {
      ...base.subjects[id],
      totalMinutes,
      todayMinutes,
      weekMinutes: totalMinutes,
      monthMinutes: totalMinutes,
      xp,
      level: 5,
      sessionsCompleted: subSessions.length,
      currentStreak: 5,
      longestStreak: 7,
      lastStudiedDate: base.lastDailyReset,
      unlockedElements: unlocked[id] || base.subjects[id].unlockedElements,
    };
  });

  base.sessions = sessions;
  base.globalStreak = 5;
  base.globalLongestStreak = 7;
  base.globalLastStudiedDate = base.lastDailyReset;

  // Unlock demo achievements
  base.achievements = base.achievements.map(a => {
    if (['consistency_master', 'speed_learner', 'knowledge_explorer'].includes(a.id)) {
      return { ...a, unlocked: true, unlockedAt: new Date(now - 86400000 * 2).toISOString() };
    }
    return a;
  });

  return base;
}

/**
 * Seed initial demo adventurer account and pre-built flourishing realm progress
 */
export async function seedDemoAccountIfNeeded(): Promise<void> {
  const users = loadUsers();
  const demoEmail = 'hero@realms.com';
  if (!Object.values(users).some(u => u.email === demoEmail)) {
    const salt = 'realm_sacred_salt_2026';
    const passwordHash = await hashPassword('realmquest', salt);
    const demoUser: StoredUserAccount = {
      id: 'usr_demo_hero',
      username: 'RealmWalker',
      email: demoEmail,
      title: 'Grand Realm Sovereign',
      avatarId: 'warrior',
      createdAt: new Date().toISOString(),
      passwordHash,
      salt,
    };
    users[demoUser.id] = demoUser;
    saveUsers(users);
  }

  // Ensure pre-leveled realm progress exists for demo account
  const demoStorageKey = 'god_of_realms_user_usr_demo_hero';
  try {
    const raw = localStorage.getItem(demoStorageKey);
    // If not seeded or if it was the old flat 100m version, update to dynamic varied heights
    let shouldReseed = !raw;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.sessions?.every((s: any) => s.durationMinutes === 50)) {
        shouldReseed = true;
      }
    }
    if (shouldReseed) {
      localStorage.setItem(demoStorageKey, JSON.stringify(createDemoInitialState()));
    }
  } catch (err) {
    console.error('Failed to seed demo realm state:', err);
  }
}



/**
 * Register a new Adventurer account and issue a signed JWT
 */
export async function registerUser(credentials: RegisterCredentials): Promise<AuthResponse> {
  // 1. Attempt registration via backend API
  try {
    const apiRes = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (apiRes.success && apiRes.user && apiRes.token) {
      setStoredToken(apiRes.token);
      const users = loadUsers();
      users[apiRes.user.id] = {
        id: apiRes.user.id,
        username: apiRes.user.username,
        email: apiRes.user.email,
        title: apiRes.user.title,
        avatarId: apiRes.user.avatarId,
        createdAt: apiRes.user.createdAt,
        passwordHash: '',
        salt: '',
      };
      saveUsers(users);
      return { success: true, user: apiRes.user, token: apiRes.token };
    }

    // If server sent an explicit error message (e.g. duplicate username/email)
    if (apiRes.error && !apiRes.error.includes('Network error') && !apiRes.error.includes('unreachable')) {
      return { success: false, error: apiRes.error };
    }
  } catch {
    // Backend offline, proceed to local registration
  }

  // 2. Offline / Local fallback registration
  try {
    const users = loadUsers();
    const cleanUsername = credentials.username.trim();
    const cleanEmail = credentials.email.trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters long.' };
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please provide a valid email address.' };
    }

    if (!credentials.password || credentials.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const existing = Object.values(users).find(
      u => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (existing) {
      return { success: false, error: 'An adventurer with this username or email already exists.' };
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(credentials.password, salt);
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newUser: StoredUserAccount = {
      id,
      username: cleanUsername,
      email: cleanEmail,
      title: 'Novice Realm Walker',
      avatarId: credentials.avatarId || 'scholar',
      createdAt: new Date().toISOString(),
      passwordHash,
      salt,
    };

    users[id] = newUser;
    saveUsers(users);

    const token = await signJwt({
      sub: newUser.id,
      username: newUser.username,
      email: newUser.email,
      title: newUser.title,
      avatarId: newUser.avatarId,
    });

    setStoredToken(token);

    const user: User = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      title: newUser.title,
      avatarId: newUser.avatarId,
      createdAt: newUser.createdAt,
    };

    return { success: true, user, token };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Registration failed.' };
  }
}

/**
 * Log in an existing Adventurer and issue a fresh signed JWT
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  // 1. Attempt login via backend API
  try {
    const apiRes = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (apiRes.success && apiRes.user && apiRes.token) {
      setStoredToken(apiRes.token);
      const users = loadUsers();
      users[apiRes.user.id] = {
        id: apiRes.user.id,
        username: apiRes.user.username,
        email: apiRes.user.email,
        title: apiRes.user.title,
        avatarId: apiRes.user.avatarId,
        createdAt: apiRes.user.createdAt,
        passwordHash: '',
        salt: '',
      };
      saveUsers(users);
      return { success: true, user: apiRes.user, token: apiRes.token };
    }

    if (apiRes.error && !apiRes.error.includes('Network error') && !apiRes.error.includes('unreachable')) {
      return { success: false, error: apiRes.error };
    }
  } catch {
    // Backend offline, proceed to local login
  }

  // 2. Offline / Local fallback login
  try {
    await seedDemoAccountIfNeeded();

    const users = loadUsers();
    const identifier = credentials.emailOrUsername.trim().toLowerCase();

    const account = Object.values(users).find(
      u => u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier
    );

    if (!account) {
      return { success: false, error: 'Adventurer account not found.' };
    }

    const testHash = await hashPassword(credentials.password, account.salt);
    if (testHash !== account.passwordHash) {
      return { success: false, error: 'Invalid password. Check your mystical phrase.' };
    }

    const token = await signJwt({
      sub: account.id,
      username: account.username,
      email: account.email,
      title: account.title,
      avatarId: account.avatarId,
    });

    setStoredToken(token);

    const user: User = {
      id: account.id,
      username: account.username,
      email: account.email,
      title: account.title,
      avatarId: account.avatarId,
      createdAt: account.createdAt,
    };

    return { success: true, user, token };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Login failed.' };
  }
}

/**
 * Validate active session from token (verifying with backend if available)
 */
export async function verifyCurrentSession(): Promise<{ user: User | null; token: string | null }> {
  const token = getStoredToken();
  if (!token) return { user: null, token: null };

  // 1. Check with backend
  try {
    const meRes = await apiFetch('/api/auth/me');
    if (meRes.success && meRes.user) {
      return { user: meRes.user, token };
    }
  } catch {
    // Network offline, fall back to local token decode
  }

  // 2. Fallback to local JWT verification
  const result = await verifyJwt(token);
  if (!result.valid || !result.payload) {
    clearStoredToken();
    return { user: null, token: null };
  }

  const users = loadUsers();
  const account = users[result.payload.sub];
  if (!account) {
    return {
      user: {
        id: result.payload.sub,
        username: result.payload.username,
        email: result.payload.email,
        title: result.payload.title,
        avatarId: result.payload.avatarId,
        createdAt: new Date(result.payload.iat * 1000).toISOString(),
      },
      token,
    };
  }

  return {
    user: {
      id: account.id,
      username: account.username,
      email: account.email,
      title: account.title,
      avatarId: account.avatarId,
      createdAt: account.createdAt,
    },
    token,
  };
}

/**
 * LocalStorage token helpers
 */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (err) {
    console.error('Failed to store JWT:', err);
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to remove JWT:', err);
  }
}

export const DEMO_CREDENTIALS = {
  usernameOrEmail: 'hero@realms.com',
  password: 'realmquest',
  username: 'RealmWalker',
};
