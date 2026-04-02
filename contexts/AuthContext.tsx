/**
 * contexts/AuthContext.tsx
 * Quản lý trạng thái đăng nhập toàn app.
 * Hỗ trợ: Google Sign-In, Guest Mode (với permissions framework).
 */
import React, {
  createContext, useContext, useState,
  useEffect, ReactNode, useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthUser,
  loginWithGoogle as apiLoginWithGoogle,
  getStoredAuth,
  logout as apiLogout,
  isTokenExpired,
} from '../services/authService';

// ── Guest Permissions ───────────────────────────────────────────
export const GUEST_PERMISSIONS = {
  canBrowse: true,
  canSearch: true,
  canChat: false,
  canNearby: false,
  canOffline: false,
  canSaveFavorite: false,
} as const;

export type GuestPermissions = typeof GUEST_PERMISSIONS;

// ── Types ───────────────────────────────────────────────────────

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  isGuest: boolean;
  isAuthLoading: boolean;
  guestPermissions: GuestPermissions;
  loginWithGoogle: (googleIdToken: string) => Promise<void>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const UPSELL_COUNT_KEY = '@guest_upsell_count';

// ── Provider ────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => { loadAuth(); }, []);

  const loadAuth = async () => {
    try {
      const stored = await getStoredAuth();
      if (stored.token && stored.user) {
        if (!isTokenExpired(stored.token)) {
          setUser(stored.user);
          setToken(stored.token);
        } else {
          console.log('[Auth] Token expired, clearing...');
          await apiLogout();
        }
      }
    } catch (e) {
      console.error('[Auth] Load failed:', e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loginWithGoogle = useCallback(async (googleIdToken: string) => {
    const result = await apiLoginWithGoogle(googleIdToken);
    setUser(result.user);
    setToken(result.token);
    setIsGuest(false);
    await trackUpsellReset();
  }, []);

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
    setUser(null);
    setToken(null);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setToken(null);
    setIsGuest(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoggedIn: !!user && !!token,
      isGuest,
      isAuthLoading,
      guestPermissions: GUEST_PERMISSIONS,
      loginWithGoogle,
      continueAsGuest,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ────────────────────────────────────────────────────────

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
};

// ── Upsell Tracking ─────────────────────────────────────────────

async function trackUpsellReset() {
  await AsyncStorage.removeItem(UPSELL_COUNT_KEY);
}

/**
 * Đếm số lần Guest đã dùng app.
 * Sau 3 lần → trả true để hiện gentle nudge.
 */
export async function shouldShowGuestNudge(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(UPSELL_COUNT_KEY);
    const count = raw ? parseInt(raw, 10) : 0;
    const next = count + 1;
    await AsyncStorage.setItem(UPSELL_COUNT_KEY, next.toString());
    return next >= 3;
  } catch {
    return false;
  }
}
