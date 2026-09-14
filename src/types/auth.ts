// ============================================================
// Authentication & JWT TypeScript Interfaces
// ============================================================

export interface User {
  id: string;
  username: string;
  email: string;
  title: string;          // e.g. "Novice Realm Walker", "Grand Sage"
  avatarId: string;       // e.g. "warrior", "mage", "ranger", "scholar"
  createdAt: string;
}

export interface JwtHeader {
  alg: 'HS256';
  typ: 'JWT';
}

export interface JwtPayload {
  sub: string;            // User ID
  username: string;
  email: string;
  title: string;
  avatarId: string;
  iat: number;            // Issued at (seconds)
  exp: number;            // Expiration (seconds)
}

export interface AuthTokens {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;      // Duration in seconds
}

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  avatarId?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface StoredUserAccount extends User {
  passwordHash: string;
  salt: string;
}
