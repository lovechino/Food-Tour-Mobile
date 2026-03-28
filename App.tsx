/**
 * FoodTourAI - Root App Component
 * Push Notifications: Firebase Cloud Messaging (FCM) via @react-native-firebase/messaging
 * Auth: Google Sign-In via @react-native-google-signin/google-signin
 */

import React, { useEffect, useRef } from 'react';
import { StatusBar, useColorScheme, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { GlobalToast } from './components/GlobalToast';
import { initPushNotifications } from './services/pushService';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

import Config from 'react-native-config';

// ── Cấu hình Google Sign-In ──────────────────────────────────────────────────
// Gọi configure() 1 lần duy nhất khi app mount.
// webClientId: lấy từ Google Cloud Console → OAuth 2.0 Client ID (Web client).
try {
  const { GoogleSignin } = require('@react-native-google-signin/google-signin');
  GoogleSignin.configure({
    webClientId: Config.GOOGLE_WEB_CLIENT_ID || 'PLACEHOLDER_GOOGLE_WEB_CLIENT_ID', // TODO: Điền Web Client ID từ Google Cloud Console
    offlineAccess: true,
  });
} catch (e) {
  console.warn('[App] Google Sign-In not configured (library may not be installed):', e);
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Khởi tạo FCM Push Notifications khi app mount
    initPushNotifications({
      // userId: currentUserId, // TODO: truyền userId khi user đã đăng nhập
      topics: 'all',

      // Xử lý notification khi app đang mở (foreground)
      onMessage: (msg: FirebaseMessagingTypes.RemoteMessage) => {
        const { title, body } = msg.notification ?? {};
        console.log('[App] Foreground notification:', title, body);
        // Hiển thị in-app toast thay vì system notification
        // (System notification tự động hiện khi background)
        if (title && body) {
          Alert.alert(title, body);
        }
      },

      // Xử lý khi user tap vào notification để mở app
      onOpen: (msg: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('[App] Notification opened:', msg.data);
        // TODO: Navigate đến màn hình tương ứng dựa theo msg.data
        // Ví dụ: msg.data?.screen === 'city' → navigate to OnlineHomeScreen
      },
    }).then(({ unsubscribe }) => {
      unsubscribeRef.current = unsubscribe;
    });

    // Cleanup khi app unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthProvider>
        <ThemeProvider>
          <ChatProvider>
            <RootNavigator />
            <GlobalToast />
          </ChatProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
