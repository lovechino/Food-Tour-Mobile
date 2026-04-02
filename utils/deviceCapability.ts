/**
 * utils/deviceCapability.ts
 * Phát hiện thiết bị low-end để tắt hiệu ứng nặng (BlurView).
 * 
 * Android: RAM < 4GB → low-end (Mali GPU cũ không HW-accel blur)
 * iOS: iPhone < 12 → low-end (A-series cũ, GPU yếu)
 * 
 * Uses react-native-device-info for cross-platform detection.
 */
import { Platform } from 'react-native';

const LOW_END_RAM_THRESHOLD = 4 * 1024 * 1024 * 1024; // 4GB
let _isLowEnd: boolean | null = null;

/**
 * Extract iPhone generation from device identifier (e.g. "iPhone10,6" → 10)
 */
function extractIphoneGeneration(deviceId: string): number {
    const match = deviceId.match(/iPhone(\d+),/);
    if (!match) return 99; // Unknown → assume high-end
    return parseInt(match[1], 10);
}

/**
 * Detect low-end device with platform-specific heuristics.
 * Android: RAM < 4GB
 * iOS: iPhone generation < 12 (iPhone X and older)
 */
export async function detectLowEndDevice(): Promise<boolean> {
    if (_isLowEnd !== null) return _isLowEnd;

    try {
        const DeviceInfo = require('react-native-device-info');

        if (Platform.OS === 'android') {
            const totalMemory = await DeviceInfo.getTotalMemory();
            _isLowEnd = totalMemory < LOW_END_RAM_THRESHOLD;
        } else if (Platform.OS === 'ios') {
            const deviceId = DeviceInfo.getDeviceId(); // e.g. "iPhone10,6"
            const generation = extractIphoneGeneration(deviceId);
            _isLowEnd = generation < 12; // iPhone X (10) and older
        } else {
            _isLowEnd = false; // web, macOS, etc.
        }
    } catch {
        _isLowEnd = false; // Fallback: assume high-end
    }

    return _isLowEnd;
}

/** Sync getter — chỉ dùng SAU khi đã gọi detectLowEndDevice */
export function isLowEndCached(): boolean {
    return _isLowEnd ?? false;
}
