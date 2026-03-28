/**
 * services/authService.ts
 * Xử lý Google Sign-In và xác thực với Backend.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';
import { atob } from '../utils/base64';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
    userId: string;
    email: string;
    name: string;
    avatarUrl: string; // Renamed from picture
    geminiKey?: string; // Decrypted key from backend
}

export interface AuthState {
    user: AuthUser | null;
    token: string | null;       // JWT from our backend
    googleToken: string | null; // Google ID token (for re-auth)
    isLoggedIn: boolean;
}

// ── Storage Keys ─────────────────────────────────────────────────────────────

const AUTH_TOKEN_KEY = '@auth_token';
const AUTH_USER_KEY = '@auth_user';

// ── API ──────────────────────────────────────────────────────────────────────

/**
 * Gửi Google ID Token lên backend để xác thực và nhận JWT.
 */
export async function loginWithGoogle(googleIdToken: string): Promise<{ token: string; user: AuthUser }> {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleIdToken }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `Login failed (${response.status})`);
    }

    const data = await response.json();
    const { token, user } = data;

    // Lưu vào AsyncStorage
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

    return { token, user };
}

/**
 * Đọc thông tin auth đã lưu từ AsyncStorage.
 */
export async function getStoredAuth(): Promise<{ token: string | null; user: AuthUser | null }> {
    try {
        const [token, userJson] = await Promise.all([
            AsyncStorage.getItem(AUTH_TOKEN_KEY),
            AsyncStorage.getItem(AUTH_USER_KEY),
        ]);

        const user = userJson ? JSON.parse(userJson) as AuthUser : null;
        return { token, user };
    } catch {
        return { token: null, user: null };
    }
}

/**
 * Đăng xuất: xoá dữ liệu auth khỏi AsyncStorage.
 */
export async function logout(): Promise<void> {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
}

/**
 * Kiểm tra JWT token có hết hạn chưa (decode đơn giản, không verify signature).
 */
export function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        return Date.now() >= exp;
    } catch {
        return true; // Coi như hết hạn nếu parse lỗi
    }
}

/**
 * Helper: Lấy auth header cho các API call.
 */
export async function getAuthHeader(): Promise<Record<string, string>> {
    const { token } = await getStoredAuth();
    if (token && !isTokenExpired(token)) {
        return { 'Authorization': `Bearer ${token}` };
    }
    return {};
}
