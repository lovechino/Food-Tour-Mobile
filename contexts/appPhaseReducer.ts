/**
 * contexts/appPhaseReducer.ts
 * Discriminated-union state machine cho app lifecycle.
 * Mỗi phase chỉ chuyển sang phase hợp lệ, loại bỏ invalid state.
 */

// ── Phase Types ─────────────────────────────────────────────────
export type AppPhase =
  | { phase: 'initializing' }
  | { phase: 'unauthenticated' }
  | { phase: 'online_ready'; city?: string }
  | { phase: 'offline_downloading'; progress: number; city: string }
  | { phase: 'offline_ready'; city: string }
  | { phase: 'error'; reason: ErrorReason };

export type ErrorReason = 'disk_full' | 'network' | 'auth_expired';

// ── Action Types ────────────────────────────────────────────────
export type AppAction =
  | { type: 'INIT_COMPLETE'; hasToken: boolean }
  | { type: 'LOGIN_SUCCESS'; city?: string }
  | { type: 'GUEST_ENTER'; city?: string }
  | { type: 'DOWNLOAD_START'; city: string }
  | { type: 'DOWNLOAD_PROGRESS'; progress: number }
  | { type: 'DOWNLOAD_COMPLETE' }
  | { type: 'DOWNLOAD_FAIL'; reason: 'disk_full' | 'network' }
  | { type: 'CLEAR_OFFLINE_DATA' }
  | { type: 'TOKEN_EXPIRED' }
  | { type: 'CHANGE_CITY'; city: string }
  | { type: 'RECOVER_ERROR' };

// ── Initial State ───────────────────────────────────────────────
export const INITIAL_PHASE: AppPhase = { phase: 'initializing' };

// ── Reducer ─────────────────────────────────────────────────────
export function appPhaseReducer(
  state: AppPhase,
  action: AppAction,
): AppPhase {
  switch (action.type) {
    case 'INIT_COMPLETE':
      return handleInitComplete(action);
    case 'LOGIN_SUCCESS':
      return handleLoginSuccess(action);
    case 'GUEST_ENTER':
      return handleGuestEnter(action);
    case 'DOWNLOAD_START':
      return handleDownloadStart(state, action);
    case 'DOWNLOAD_PROGRESS':
      return handleDownloadProgress(state, action);
    case 'DOWNLOAD_COMPLETE':
      return handleDownloadComplete(state);
    case 'DOWNLOAD_FAIL':
      return { phase: 'error', reason: action.reason };
    case 'CLEAR_OFFLINE_DATA':
      return handleClearOffline(state);
    case 'TOKEN_EXPIRED':
      return { phase: 'unauthenticated' };
    case 'CHANGE_CITY':
      return handleChangeCity(state, action);
    case 'RECOVER_ERROR':
      return { phase: 'unauthenticated' };
    default:
      return state;
  }
}

// ── Transition handlers (mỗi hàm ≤ 10 dòng) ───────────────────

function handleInitComplete(
  action: Extract<AppAction, { type: 'INIT_COMPLETE' }>,
): AppPhase {
  return action.hasToken
    ? { phase: 'online_ready' }
    : { phase: 'unauthenticated' };
}

function handleLoginSuccess(
  action: Extract<AppAction, { type: 'LOGIN_SUCCESS' }>,
): AppPhase {
  return { phase: 'online_ready', city: action.city };
}

function handleGuestEnter(
  action: Extract<AppAction, { type: 'GUEST_ENTER' }>,
): AppPhase {
  return { phase: 'online_ready', city: action.city };
}

function handleDownloadStart(
  state: AppPhase,
  action: Extract<AppAction, { type: 'DOWNLOAD_START' }>,
): AppPhase {
  if (state.phase !== 'online_ready') return state;
  return {
    phase: 'offline_downloading',
    progress: 0,
    city: action.city,
  };
}

function handleDownloadProgress(
  state: AppPhase,
  action: Extract<AppAction, { type: 'DOWNLOAD_PROGRESS' }>,
): AppPhase {
  if (state.phase !== 'offline_downloading') return state;
  return { ...state, progress: action.progress };
}

function handleDownloadComplete(state: AppPhase): AppPhase {
  if (state.phase !== 'offline_downloading') return state;
  return { phase: 'offline_ready', city: state.city };
}

function handleClearOffline(state: AppPhase): AppPhase {
  if (state.phase !== 'offline_ready') return state;
  return { phase: 'online_ready', city: state.city };
}

function handleChangeCity(
  state: AppPhase,
  action: Extract<AppAction, { type: 'CHANGE_CITY' }>,
): AppPhase {
  if (state.phase === 'online_ready') {
    return { ...state, city: action.city };
  }
  if (state.phase === 'offline_ready') {
    return { ...state, city: action.city };
  }
  return state;
}
