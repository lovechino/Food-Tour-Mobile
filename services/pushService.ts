/**
 * Push Notification Service cho FoodTourAI
 * 
 * Flow:
 * 1. App khởi động → gọi initPushNotifications()
 * 2. Lấy FCM device token từ @react-native-firebase/messaging
 * 3. Đăng ký token lên Cloudflare Worker API (/push/register)
 * 4. Lắng nghe notification khi app foreground/background/quit
 * 
 * Yêu cầu setup (xem README_PUSH.md):
 * - Tải google-services.json từ Firebase Console → đặt vào android/app/
 * - Tài khoản Firebase project: PLACEHOLDER_FIREBASE_PROJECT_ID
 */

import messaging, { 
    getMessaging, 
    getToken as getFcmToken, 
    requestPermission, 
    onMessage, 
    onNotificationOpenedApp, 
    getInitialNotification, 
    onTokenRefresh as onFcmTokenRefresh,
    AuthorizationStatus,
    FirebaseMessagingTypes 
} from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants/api';
import { getAuthHeader } from './authService';

// ── Config ────────────────────────────────────────────────────────────────────
const BACKEND_URL = API_BASE_URL;
const FCM_TOKEN_KEY = '@foodtour_fcm_token';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RegisterTokenOptions {
    userId?: string;
    topics?: string; // comma-separated: 'all,ha_noi'
}

// ── Token Registration ─────────────────────────────────────────────────────────
/**
 * Lấy FCM token hiện tại từ Firebase, lưu vào AsyncStorage,
 * và đăng ký lên backend Cloudflare Worker.
 */
export async function registerFcmToken(options: RegisterTokenOptions = {}): Promise<string | null> {
    try {
        const fcmMessaging = getMessaging();
        const token = await getFcmToken(fcmMessaging);
        if (!token) {
            console.warn('[Push] Could not get FCM token');
            return null;
        }

        console.log('[Push] FCM Token obtained:', token.substring(0, 20) + '...');

        // Kiểm tra xem token này đã được đăng ký chưa (tránh request trùng)
        const cached = await AsyncStorage.getItem(FCM_TOKEN_KEY);
        if (cached === token) {
            console.log('[Push] Token already registered, skipping.');
            return token;
        }

        // Gửi lên backend
        const authHeader = await getAuthHeader();
        const res = await fetch(`${BACKEND_URL}/push/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader,
            },
            body: JSON.stringify({
                fcm_token: token,
                platform: Platform.OS, // 'android' | 'ios'
                user_id: options.userId || null,
                topics: options.topics || 'all',
            }),
        });

        if (res.ok) {
            await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
            console.log('[Push] Token registered successfully on backend.');
        } else {
            const err = await res.text();
            console.warn('[Push] Backend registration failed:', err);
        }

        return token;
    } catch (err) {
        console.error('[Push] registerFcmToken error:', err);
        return null;
    }
}

/**
 * Hủy đăng ký token khi user logout.
 */
export async function unregisterFcmToken(): Promise<void> {
    try {
        const token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
        if (!token) return;

        const authHeader = await getAuthHeader();
        await fetch(`${BACKEND_URL}/push/register`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader,
            },
            body: JSON.stringify({ fcm_token: token }),
        });

        await AsyncStorage.removeItem(FCM_TOKEN_KEY);
        console.log('[Push] Token unregistered.');
    } catch (err) {
        console.error('[Push] unregisterFcmToken error:', err);
    }
}

// ── Permission Request ─────────────────────────────────────────────────────────
/**
 * Xin quyền nhận notification (quan trọng cho iOS, Android 13+).
 * Trả về true nếu được cấp phép.
 */
export async function requestPushPermission(): Promise<boolean> {
    const fcmMessaging = getMessaging();
    const authStatus = await requestPermission(fcmMessaging);
    const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        console.log('[Push] Notification permission granted, status:', authStatus);
    } else {
        console.warn('[Push] Notification permission denied.');
    }
    return enabled;
}

// ── Listeners ─────────────────────────────────────────────────────────────────
/**
 * Xử lý notification khi app đang foreground.
 * Trả về unsubscribe function.
 */
export function onForegroundMessage(
    handler: (message: FirebaseMessagingTypes.RemoteMessage) => void
): () => void {
    const fcmMessaging = getMessaging();
    return onMessage(fcmMessaging, async (remoteMessage) => {
        console.log('[Push] Foreground message received:', remoteMessage.notification?.title);
        handler(remoteMessage);
    });
}

/**
 * Xử lý notification khi user tap vào thông báo lúc app background/quit.
 * Gọi một lần khi app mount.
 */
export function onBackgroundNotificationOpened(
    handler: (message: FirebaseMessagingTypes.RemoteMessage) => void
): void {
    const fcmMessaging = getMessaging();
    // Background: app opened from notification
    onNotificationOpenedApp(fcmMessaging, (remoteMessage) => {
        console.log('[Push] Background notification opened:', remoteMessage.notification?.title);
        handler(remoteMessage);
    });

    // Quit state: app was completely closed
    getInitialNotification(fcmMessaging).then((remoteMessage) => {
        if (remoteMessage) {
            console.log('[Push] Quit state notification opened:', remoteMessage.notification?.title);
            handler(remoteMessage);
        }
    });
}

// ── Token Refresh ─────────────────────────────────────────────────────────────
/**
 * Lắng nghe token refresh (Firebase tự rotate token định kỳ).
 * Khi token đổi, tự động đăng ký lại lên backend.
 */
export function onTokenRefresh(userId?: string): () => void {
    const fcmMessaging = getMessaging();
    return onFcmTokenRefresh(fcmMessaging, async (newToken) => {
        console.log('[Push] Token refreshed, re-registering...');
        await AsyncStorage.removeItem(FCM_TOKEN_KEY); // Clear cache để force re-register
        await registerFcmToken({ userId, topics: 'all' });
    });
}

// ── Main Init ─────────────────────────────────────────────────────────────────
/**
 * Hàm khởi tạo chính — gọi một lần trong App.tsx khi app mount.
 * 
 * @param options.userId - User ID nếu đã đăng nhập
 * @param options.topics - Subscribed topics, ví dụ: 'all,ha_noi'
 * @param options.onMessage - Callback khi nhận notification foreground
 * @param options.onOpen - Callback khi user tap vào notification
 */
export async function initPushNotifications(options: {
    userId?: string;
    topics?: string;
    onMessage?: (msg: FirebaseMessagingTypes.RemoteMessage) => void;
    onOpen?: (msg: FirebaseMessagingTypes.RemoteMessage) => void;
} = {}): Promise<{ unsubscribe: () => void }> {
    const unsubscribers: (() => void)[] = [];

    try {
        // 1. Xin quyền
        const granted = await requestPushPermission();
        if (!granted) {
            return { unsubscribe: () => { } };
        }

        // 2. Đăng ký token
        await registerFcmToken({
            userId: options.userId,
            topics: options.topics || 'all',
        });

        // 3. Foreground message listener
        if (options.onMessage) {
            unsubscribers.push(onForegroundMessage(options.onMessage));
        }

        // 4. Background / quit open listener
        if (options.onOpen) {
            onBackgroundNotificationOpened(options.onOpen);
        }

        // 5. Token refresh listener
        unsubscribers.push(onTokenRefresh(options.userId));

        console.log('[Push] Push notifications initialized.');
    } catch (err) {
        console.error('[Push] initPushNotifications error:', err);
    }

    return {
        unsubscribe: () => unsubscribers.forEach(fn => fn()),
    };
}
