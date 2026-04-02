/**
 * navigation/RootNavigator.tsx
 * Phase-based navigation — dùng AppPhaseContext thay vì 3 boolean.
 * Mỗi phase map 1:1 với 1 screen/stack, không có invalid state.
 */
import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/WelcomeScreen';
import CitySelectScreen from '../screens/CitySelectScreen';
import TabNavigator from './TabNavigator';
import AiNearbyScreen from '../screens/AiNearbyScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginPromptModal from '../screens/LoginPromptModal';

import { AppPhaseProvider, useAppPhase } from '../contexts/AppModeContext';
import { navigationRef } from '../services/apiClient';
import { useTheme } from '../contexts/ThemeContext';

export type RootStackParamList = {
  Welcome: undefined;
  CitySelect: undefined;
  MainTabs: undefined;
  AiNearby: undefined;
  Settings: undefined;
  LoginPromptModal: { reason?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ── Main Content ────────────────────────────────────────────────

function RootNavigatorContent() {
  const { state, dispatch } = useAppPhase();

  if (state.phase === 'initializing') {
    return <LoadingView />;
  }

  if (state.phase === 'error') {
    return (
      <ErrorView
        reason={state.reason}
        onRetry={() => dispatch({ type: 'RECOVER_ERROR' })}
      />
    );
  }

  const initialRoute = resolveInitialRoute(state.phase);

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="CitySelect" component={CitySelectScreen} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="AiNearby" component={AiNearbyScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Group screenOptions={{ presentation: 'transparentModal' }}>
        <Stack.Screen name="LoginPromptModal" component={LoginPromptModal} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

// ── Route Resolver ──────────────────────────────────────────────

function resolveInitialRoute(
  phase: string,
): keyof RootStackParamList {
  switch (phase) {
    case 'unauthenticated': return 'Welcome';
    case 'online_ready': return 'MainTabs';
    case 'offline_ready': return 'MainTabs';
    case 'offline_downloading': return 'MainTabs';
    default: return 'Welcome';
  }
}

// ── Loading View ────────────────────────────────────────────────

function LoadingView() {
  return (
    <View style={viewStyles.centered}>
      <ActivityIndicator size="large" color="#8b5cf6" />
    </View>
  );
}

// ── Error View ──────────────────────────────────────────────────

function ErrorView(
  { reason, onRetry }: { reason: string; onRetry: () => void },
) {
  const messages: Record<string, string> = {
    disk_full: 'Điện thoại không đủ dung lượng (cần thêm ít nhất 120MB).',
    network: 'Không thể kết nối mạng. Kiểm tra lại WiFi/4G nhé!',
    auth_expired: 'Phiên đăng nhập đã hết hạn. Đăng nhập lại nhé!',
  };

  return (
    <View style={viewStyles.centered}>
      <Text style={viewStyles.errorEmoji}>⚠️</Text>
      <Text style={viewStyles.errorText}>
        {messages[reason] || 'Có lỗi xảy ra.'}
      </Text>
      <TouchableOpacity style={viewStyles.retryBtn} onPress={onRetry}>
        <Text style={viewStyles.retryText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Root Export ──────────────────────────────────────────────────

export default function RootNavigator() {
  return (
    <AppPhaseProvider>
      <NavigationContainer ref={navigationRef}>
        <RootNavigatorContent />
      </NavigationContainer>
    </AppPhaseProvider>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const viewStyles = StyleSheet.create({
  centered: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', padding: 24,
    backgroundColor: '#121212',
  },
  errorEmoji: { fontSize: 48, marginBottom: 16 },
  errorText: {
    fontSize: 16, color: '#f8fafc',
    textAlign: 'center', lineHeight: 24, marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 20,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
