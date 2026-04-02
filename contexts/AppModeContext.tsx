/**
 * contexts/AppPhaseContext.tsx
 * Thay thế AppModeContext — dùng Reducer pattern.
 * Mỗi phase chỉ chuyển sang phase hợp lệ → 0 invalid state.
 */
import React, {
  createContext, useContext, useReducer,
  useEffect, ReactNode, Dispatch,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isModelDownloaded } from '../services/model';
import { getDownloadedPacks } from '../services/pack';
import {
  AppPhase, AppAction, appPhaseReducer, INITIAL_PHASE,
} from './appPhaseReducer';

// ── Context Types ───────────────────────────────────────────────
interface AppPhaseContextType {
  state: AppPhase;
  dispatch: Dispatch<AppAction>;
}

const AppPhaseContext = createContext<AppPhaseContextType | undefined>(
  undefined,
);

const MODE_KEY = '@app_mode';
const CITY_KEY = '@preferred_city';

// ── Provider ────────────────────────────────────────────────────
export const AppPhaseProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appPhaseReducer, INITIAL_PHASE);

  useEffect(() => { initializePhase(dispatch); }, []);

  return (
    <AppPhaseContext.Provider value={{ state, dispatch }}>
      {children}
    </AppPhaseContext.Provider>
  );
};

// ── Init Logic ──────────────────────────────────────────────────
async function initializePhase(dispatch: Dispatch<AppAction>) {
  try {
    const [savedMode, savedCity] = await Promise.all([
      AsyncStorage.getItem(MODE_KEY),
      AsyncStorage.getItem(CITY_KEY),
    ]);
    const hasToken = savedMode === 'online' || savedMode === 'offline';

    dispatch({ type: 'INIT_COMPLETE', hasToken });

    if (savedMode === 'offline') {
      await handleSavedOffline(dispatch, savedCity);
    }
  } catch (e) {
    console.error('[AppPhase] Init error:', e);
    dispatch({ type: 'INIT_COMPLETE', hasToken: false });
  }
}

async function handleSavedOffline(
  dispatch: Dispatch<AppAction>,
  savedCity: string | null,
) {
  const city = savedCity || 'ha_noi';
  const packs = await getDownloadedPacks();
  const modelOk = await isModelDownloaded();

  if (packs.length > 0 && modelOk) {
    dispatch({ type: 'DOWNLOAD_START', city });
    dispatch({ type: 'DOWNLOAD_COMPLETE' });
  }
}

// ── Hook mới ────────────────────────────────────────────────────
export function useAppPhase() {
  const ctx = useContext(AppPhaseContext);
  if (!ctx) throw new Error('useAppPhase must be within AppPhaseProvider');
  return ctx;
}

// ── Backward-compatible bridge ──────────────────────────────────
/**
 * @deprecated Dùng useAppPhase() thay thế.
 * Giữ lại để existing components không break ngay.
 */
export function useAppMode() {
  const { state, dispatch } = useAppPhase();

  const mode = mapPhaseToMode(state.phase);
  const isDataReady = state.phase === 'offline_ready';
  const isLoading = state.phase === 'initializing';

  const setAppMode = async (newMode: string) => {
    await AsyncStorage.setItem(MODE_KEY, newMode);
    if (newMode === 'online') {
      dispatch({ type: 'LOGIN_SUCCESS' });
    }
  };

  const refreshDataStatus = async () => { /* no-op in new system */ };

  return { mode, setAppMode, isDataReady, refreshDataStatus, isLoading };
}

function mapPhaseToMode(phase: string): string {
  if (phase === 'online_ready') return 'online';
  if (phase === 'offline_ready') return 'offline';
  if (phase === 'offline_downloading') return 'offline';
  if (phase === 'initializing') return 'pending';
  return 'pending';
}
