/**
 * services/downloadService.ts
 * Chunked download với Range header — resume nếu mất mạng giữa chừng.
 * Lưu progress vào AsyncStorage để tải tiếp từ byte đã dừng.
 */
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DownloadState {
  totalBytes: number;
  downloadedBytes: number;
  destPath: string;
}

// ── Public API ──────────────────────────────────────────────────

export async function downloadWithResume(
  url: string,
  destPath: string,
  onProgress?: (pct: number) => void,
): Promise<boolean> {
  const stateKey = buildStateKey(url);
  const savedState = await loadDownloadState(stateKey);
  const startByte = savedState?.downloadedBytes ?? 0;

  try {
    const result = await executeDownload(
      url, destPath, startByte, stateKey, onProgress,
    );
    if (result) await clearDownloadState(stateKey);
    return result;
  } catch (e) {
    console.error('[Download] Resume failed:', e);
    return false;
  }
}

export async function getDownloadProgress(
  url: string,
): Promise<number> {
  const state = await loadDownloadState(buildStateKey(url));
  if (!state || state.totalBytes === 0) return 0;
  return state.downloadedBytes / state.totalBytes;
}

export async function clearDownloadState(
  stateKey: string,
): Promise<void> {
  await AsyncStorage.removeItem(stateKey);
}

// ── Private helpers ─────────────────────────────────────────────

function buildStateKey(url: string): string {
  // Simple hash từ URL
  const hash = url.split('').reduce((a, c) => {
    return ((a << 5) - a + c.charCodeAt(0)) | 0;
  }, 0);
  return `@download_state_${Math.abs(hash)}`;
}

async function loadDownloadState(
  key: string,
): Promise<DownloadState | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function saveDownloadState(
  key: string,
  state: DownloadState,
): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(state));
}

async function executeDownload(
  url: string,
  destPath: string,
  startByte: number,
  stateKey: string,
  onProgress?: (pct: number) => void,
): Promise<boolean> {
  const headers: Record<string, string> = {};
  if (startByte > 0) {
    headers['Range'] = `bytes=${startByte}-`;
  }

  const download = RNFS.downloadFile({
    fromUrl: url,
    toFile: destPath,
    headers,
    begin: (res) => {
      const total = res.contentLength + startByte;
      saveDownloadState(stateKey, {
        totalBytes: total,
        downloadedBytes: startByte,
        destPath,
      });
    },
    progress: (res) => {
      const current = startByte + res.bytesWritten;
      const total = res.contentLength + startByte;
      const pct = total > 0 ? current / total : 0;
      onProgress?.(pct);
      saveDownloadState(stateKey, {
        totalBytes: total,
        downloadedBytes: current,
        destPath,
      });
    },
    progressDivider: 5,
  });

  const res = await download.promise;
  return res.statusCode === 200 || res.statusCode === 206;
}
