import { useState, useEffect, useCallback } from 'react';
import type { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth';
import {
  loginUser,
  registerUser,
  verifyCurrentSession,
  clearStoredToken,
  getStoredToken,
  seedDemoAccountIfNeeded,
} from '../services/authService';
import { decodeJwt, isTokenExpired } from '../services/jwt';

function getInitialAuth(): { user: User | null; token: string | null } {
  try {
    const token = getStoredToken();
    if (!token) return { user: null, token: null };
    const payload = decodeJwt(token);
    if (!payload || isTokenExpired(payload)) {
      clearStoredToken();
      return { user: null, token: null };
    }
    return {
      user: {
        id: payload.sub,
        username: payload.username,
        email: payload.email,
        title: payload.title,
        avatarId: payload.avatarId,
        createdAt: new Date(payload.iat * 1000).toISOString(),
      },
      token,
    };
  } catch {
    return { user: null, token: null };
  }
}

export function useAuth() {
  const [initial] = useState(getInitialAuth);
  const [user, setUser] = useState<User | null>(initial.user);
  const [token, setToken] = useState<string | null>(initial.token);
  const [isLoading, setIsLoading] = useState<boolean>(!initial.user);

  // Background verification & demo account seeding
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        await seedDemoAccountIfNeeded();
        const { user: verifiedUser, token: verifiedToken } = await verifyCurrentSession();
        if (mounted) {
          setUser(verifiedUser);
          setToken(verifiedToken);
        }
      } catch (err) {
        console.error('Session verification error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await loginUser(credentials);
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await registerUser(credentials);
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    setToken(null);
  }, []);

  return {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
  };
}
