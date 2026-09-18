import { getStoredToken } from './authService';

/**
 * Resolves the backend base URL.
 * In development or same-host, default to proxy /api or VITE_API_URL.
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (envUrl) {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  // If in dev environment, use localhost:5000 or proxy
  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }
  // In production, fallback to Render cloud backend URL
  return 'https://god-of-realms.onrender.com';
}

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

export async function checkBackendHealth(): Promise<{ online: boolean; storage?: string }> {
  try {
    const url = `${getApiBaseUrl()}/api/health`;
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      return { online: true, storage: data.storage };
    }
    return { online: false };
  } catch {
    return { online: false };
  }
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const token = getStoredToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error || `Server responded with status ${res.status}`,
      };
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error: backend server is currently unreachable.',
    };
  }
}
