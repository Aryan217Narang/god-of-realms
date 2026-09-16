import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmailOrUsername, findUserById, createUser, UserRecord } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'realm_quest_jwt_secret_sacred_key_2026_super_secure';

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, avatarId } = req.body || {};

    const cleanUsername = String(username || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    if (!cleanUsername || cleanUsername.length < 3) {
      res.status(400).json({ success: false, error: 'Username must be at least 3 characters long.' });
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
      return;
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
      return;
    }

    const existing = await findUserByEmailOrUsername(cleanEmail);
    if (existing) {
      res.status(409).json({ success: false, error: 'An adventurer with this email already exists.' });
      return;
    }

    const existingName = await findUserByEmailOrUsername(cleanUsername);
    if (existingName) {
      res.status(409).json({ success: false, error: 'An adventurer with this username already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 10);
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newUser: UserRecord = {
      id,
      username: cleanUsername,
      email: cleanEmail,
      password_hash: passwordHash,
      avatar_id: avatarId || 'scholar',
      title: 'Novice Realm Walker',
      created_at: new Date().toISOString(),
    };

    await createUser(newUser);

    // Issue JWT
    const token = jwt.sign(
      {
        sub: newUser.id,
        username: newUser.username,
        email: newUser.email,
        title: newUser.title,
        avatarId: newUser.avatar_id,
      },
      JWT_SECRET,
      { expiresIn: '90d' }
    );

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        title: newUser.title,
        avatarId: newUser.avatar_id,
        createdAt: newUser.created_at,
      },
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to register.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { emailOrUsername, password } = req.body || {};
    const identifier = String(emailOrUsername || '').trim();
    const cleanPassword = String(password || '');

    if (!identifier || !cleanPassword) {
      res.status(400).json({ success: false, error: 'Please enter both your identifier and password.' });
      return;
    }

    const account = await findUserByEmailOrUsername(identifier);
    if (!account) {
      res.status(404).json({ success: false, error: 'Adventurer account not found.' });
      return;
    }

    const isValid = await bcrypt.compare(cleanPassword, account.password_hash);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid password. Check your mystical phrase.' });
      return;
    }

    const token = jwt.sign(
      {
        sub: account.id,
        username: account.username,
        email: account.email,
        title: account.title,
        avatarId: account.avatar_id,
      },
      JWT_SECRET,
      { expiresIn: '90d' }
    );

    res.json({
      success: true,
      user: {
        id: account.id,
        username: account.username,
        email: account.email,
        title: account.title,
        avatarId: account.avatar_id,
        createdAt: account.created_at,
      },
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Login failed.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await findUserById(req.userId!);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        title: user.title,
        avatarId: user.avatar_id,
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    console.error('Me endpoint error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Error verifying account.' });
  }
});

export default router;
