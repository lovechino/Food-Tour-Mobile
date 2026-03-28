import Config from 'react-native-config';

/**
 * constants/api.ts
 * Cấu hình API base URL.
 * - Android emulator: http://10.0.2.2:8000
 * - Thiết bị thật: đổi thành IP máy tính trong LAN, ví dụ http://192.168.1.x:8000
 */
export const API_BASE_URL = Config.API_BASE_URL || 'PLACEHOLDER_API_URL';
