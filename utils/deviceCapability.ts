/**
 * utils/deviceCapability.ts
 * Phát hiện thiết bị Android low-end để tắt hiệu ứng nặng (BlurView).
 * Target: Samsung A-series, Xiaomi Redmi — Mali GPU cũ không HW-accel blur.
 */
import { Platform } from 'react-native';

const LOW_END_RAM_THRESHOLD = 4 * 1024 * 1024 * 1024; // 4GB
let _isLowEnd: boolean | null = null;

/**
 * Check RAM < 4GB trên Android → coi là low-end.
 * iOS luôn trả false (Metal GPU xử lý blur tốt).
 */
export async function detectLowEndDevice(): Promise<boolean> {
  if (_isLowEnd !== null) return _isLowEnd;
  if (Platform.OS !== 'android') {
    _isLowEnd = false;
    return false;
  }

  try {
    const DeviceInfo = require('react-native-device-info');
    const totalMemory = await DeviceInfo.getTotalMemory();
    _isLowEnd = totalMemory < LOW_END_RAM_THRESHOLD;
  } catch {
    _isLowEnd = false; // Fallback: giả sử high-end
  }

  return _isLowEnd;
}

/** Sync getter — chỉ dùng SAU khi đã gọi detectLowEndDevice */
export function isLowEndCached(): boolean {
  return _isLowEnd ?? false;
}
