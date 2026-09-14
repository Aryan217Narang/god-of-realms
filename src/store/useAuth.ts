import { useState, useEffect, useCallback } from 'react';
import type { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth';
import {
  loginUser,
  registerUser,
  verifyCurrentSession,
  clearStoredToken,
  seedDemoAccountIfNeeded,
} from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on mount
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
