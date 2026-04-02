/**
 * services/apiClient.ts
 * Centralized API client với 401 queue pattern.
 * Khi nhiều request đồng thời nhận 401 → chỉ redirect 1 lần.
 */
import { API_BASE_URL } from '../constants/api';
import { getAuthHeader, logout as authLogout } from './authService';
import { createNavigationContainerRef } from '@react-navigation/native';

// ── Navigation Ref (dùng để navigate từ ngoài component) ────────
export const navigationRef = createNavigationContainerRef<any>();

// ── 401 Queue State ─────────────────────────────────────────────
let isHandling401 = false;
type QueueCallback = (success: boolean) => void;
let authQueue: QueueCallback[] = [];

// ── Public API ──────────────────────────────────────────────────

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET' });
}

export async function apiPost<T>(
  path: string,
  body: unknown,
): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ── Core Request Handler ────────────────────────────────────────

async function apiRequest<T>(
  path: string,
  options: RequestInit,
): Promise<T> {
  const authHeader = await getAuthHeader();
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    return handle401<T>(path, options);
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as any).error || `Request failed (${response.status})`,
    );
  }

  return response.json();
}

// ── 401 Handler with Queue ──────────────────────────────────────

async function handle401<T>(
  _path: string,
  _options: RequestInit,
): Promise<T> {
  if (isHandling401) {
    // Đưa request vào hàng chờ
    return new Promise((_resolve, reject) => {
      authQueue.push((success) => {
        if (!success) reject(new Error('Auth expired'));
      });
    });
  }

  isHandling401 = true;

  try {
    await authLogout();
    redirectToWelcome();
    flushQueue(false);
    throw new Error('Auth expired — redirected to login');
  } finally {
    isHandling401 = false;
    authQueue = [];
  }
}

function flushQueue(success: boolean): void {
  authQueue.forEach((cb) => cb(success));
  authQueue = [];
}

function redirectToWelcome(): void {
  if (!navigationRef.isReady()) return;
  navigationRef.reset({
    index: 0,
    routes: [{ name: 'Welcome' }],
  });
}
