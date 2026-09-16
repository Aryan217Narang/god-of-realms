import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  avatar_id: string;
  title: string;
  created_at: string;
}

export interface UserStateRecord {
  user_id: string;
  state_json: any;
  updated_at: string;
}

const DATABASE_URL = process.env.DATABASE_URL;
let pgPool: pg.Pool | null = null;

// Local JSON File DB config
const DATA_DIR = path.resolve(__dirname, '../data');
const FILE_DB_PATH = path.join(DATA_DIR, 'realms_db.json');

interface LocalDbSchema {
  users: Record<string, UserRecord>;
  states: Record<string, any>;
}

let localDb: LocalDbSchema = { users: {}, states: {} };

function loadLocalDb(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(FILE_DB_PATH)) {
      const raw = fs.readFileSync(FILE_DB_PATH, 'utf-8');
      localDb = JSON.parse(raw);
    } else {
      localDb = { users: {}, states: {} };
      saveLocalDb();
    }
  } catch (err) {
    console.error('Error loading local JSON DB:', err);
    localDb = { users: {}, states: {} };
  }
}

function saveLocalDb(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpPath = `${FILE_DB_PATH}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(localDb, null, 2), 'utf-8');
    fs.renameSync(tmpPath, FILE_DB_PATH);
  } catch (err) {
    console.error('Error writing local JSON DB:', err);
  }
}

export async function initDb(): Promise<void> {
  if (DATABASE_URL) {
    console.log('🔗 Connecting to PostgreSQL database...');
    pgPool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    });

    // Run table migrations
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_id TEXT DEFAULT 'scholar',
        title TEXT DEFAULT 'Novice Realm Walker',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_state (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        state_json JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ PostgreSQL database tables initialized.');
  } else {
    console.log(`📁 Using local persistent file database at: ${FILE_DB_PATH}`);
    loadLocalDb();
  }
}

export function getStorageType(): string {
  return DATABASE_URL ? 'postgresql' : 'file_json';
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  if (pgPool) {
    const res = await pgPool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      username: r.username,
      email: r.email,
      password_hash: r.password_hash,
      avatar_id: r.avatar_id,
      title: r.title,
      created_at: new Date(r.created_at).toISOString(),
    };
  }

  return localDb.users[id] || null;
}

export async function findUserByEmailOrUsername(identifier: string): Promise<UserRecord | null> {
  const clean = identifier.trim().toLowerCase();
  if (pgPool) {
    const res = await pgPool.query(
      'SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1 LIMIT 1',
      [clean]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      username: r.username,
      email: r.email,
      password_hash: r.password_hash,
      avatar_id: r.avatar_id,
      title: r.title,
      created_at: new Date(r.created_at).toISOString(),
    };
  }

  const found = Object.values(localDb.users).find(
    u => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean
  );
  return found || null;
}

export async function createUser(user: UserRecord): Promise<UserRecord> {
  if (pgPool) {
    await pgPool.query(
      `INSERT INTO users (id, username, email, password_hash, avatar_id, title, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, user.username, user.email, user.password_hash, user.avatar_id, user.title, user.created_at]
    );
    return user;
  }

  localDb.users[user.id] = user;
  saveLocalDb();
  return user;
}

export async function deleteUser(id: string): Promise<void> {
  if (pgPool) {
    await pgPool.query('DELETE FROM user_state WHERE user_id = $1', [id]);
    await pgPool.query('DELETE FROM users WHERE id = $1', [id]);
    return;
  }

  delete localDb.users[id];
  delete localDb.states[id];
  saveLocalDb();
}

export async function updateUserPassword(id: string, newPasswordHash: string): Promise<void> {
  if (pgPool) {
    await pgPool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, id]);
    return;
  }

  if (localDb.users[id]) {
    localDb.users[id].password_hash = newPasswordHash;
    saveLocalDb();
  }
}

export async function getUserState(userId: string): Promise<any | null> {
  if (pgPool) {
    const res = await pgPool.query('SELECT state_json FROM user_state WHERE user_id = $1', [userId]);
    if (res.rows.length === 0) return null;
    return res.rows[0].state_json;
  }

  return localDb.states[userId] || null;
}

export async function saveUserState(userId: string, state: any): Promise<void> {
  if (pgPool) {
    await pgPool.query(
      `INSERT INTO user_state (user_id, state_json, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         state_json = EXCLUDED.state_json,
         updated_at = NOW()`,
      [userId, JSON.stringify(state)]
    );
    return;
  }

  localDb.states[userId] = state;
  saveLocalDb();
}
