import type {
  User,
  StoredUserAccount,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse
} from '../types/auth';
import { signJwt, verifyJwt } from './jwt';

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

/**
 * Seed initial demo adventurer account if none exist
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
}

/**
 * Register a new Adventurer account and issue a signed JWT
 */
export async function registerUser(credentials: RegisterCredentials): Promise<AuthResponse> {
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

    // Check existing
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

    // Sign JWT
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
  try {
    // Ensure demo user exists
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

    // Sign JWT
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
 * Validate active session from token
 */
export async function verifyCurrentSession(): Promise<{ user: User | null; token: string | null }> {
  const token = getStoredToken();
  if (!token) return { user: null, token: null };

  const result = await verifyJwt(token);
  if (!result.valid || !result.payload) {
    clearStoredToken();
    return { user: null, token: null };
  }

  const users = loadUsers();
  const account = users[result.payload.sub];
  if (!account) {
    // User was deleted or payload payload doesn't exist locally
    // Still use payload info
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
