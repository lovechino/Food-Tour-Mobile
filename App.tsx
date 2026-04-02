/**
 * FoodTourAI - Root App Component
 * Push Notifications: Firebase Cloud Messaging (FCM) via @react-native-firebase/messaging
 * Auth: Google Sign-In via @react-native-google-signin/google-signin
 */

import React, { useEffect, useRef } from 'react';
import { StatusBar, useColorScheme, Alert, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { GlobalToast } from './components/GlobalToast';
import { initPushNotifications } from './services/pushService';
import { syncPendingSuggestions } from './services/suggestionQueue';
import { getStoredAuth } from './services/authService';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

import Config from 'react-native-config';
import { detectLowEndDevice } from './utils/deviceCapability';

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

  const runSync = async () => {
    try {
      const { token } = await getStoredAuth();
      if (token) {
        await syncPendingSuggestions(token);
      }
    } catch (e) {
      console.warn('[App] Sync pending suggestions failed:', e);
    }
  };

  useEffect(() => {
    detectLowEndDevice();

    runSync();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') runSync();
    });

    initPushNotifications({
      topics: 'all',

      onMessage: (msg: FirebaseMessagingTypes.RemoteMessage) => {
        const { title, body } = msg.notification ?? {};
        console.log('[App] Foreground notification:', title, body);
        if (title && body) {
          Alert.alert(title, body);
        }
      },

      onOpen: (msg: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('[App] Notification opened:', msg.data);
      },
    }).then(({ unsubscribe }) => {
      unsubscribeRef.current = unsubscribe;
    });

    return () => {
      subscription.remove();
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
