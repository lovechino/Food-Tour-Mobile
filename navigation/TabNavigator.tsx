/**
 * navigation/TabNavigator.tsx
 * Tab layout với ⚙️ icon ở header dẫn sang Settings.
 * Tabs thay đổi theo phase (online vs offline).
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import DataScreen from '../screens/DataScreen';
import OnlineChatScreen from '../screens/OnlineChatScreen';
import OnlineHomeScreen from '../screens/OnlineHomeScreen';
import { useTheme } from '../contexts/ThemeContext';
import { useAppPhase } from '../contexts/AppModeContext';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { colors } = useTheme();
  const { state } = useAppPhase();
  const isOffline = state.phase === 'offline_ready';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        headerRight: () => <SettingsButton />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ focused }) => {
          const icon = getTabIcon(route.name);
          const opacity = focused ? 1 : 0.4;
          return <Text style={{ fontSize: 22, opacity }}>{icon}</Text>;
        },
      })}
    >
      {isOffline ? renderOfflineTabs() : renderOnlineTabs()}
    </Tab.Navigator>
  );
}

// ── Settings Button ─────────────────────────────────────────────

function SettingsButton() {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Settings')}
      style={{ marginRight: 16, padding: 4 }}
    >
      <Text style={{ fontSize: 20 }}>⚙️</Text>
    </TouchableOpacity>
  );
}

// ── Tab Configs ─────────────────────────────────────────────────

function renderOnlineTabs() {
  return (
    <>
      <Tab.Screen
        name="OnlineExplore"
        component={OnlineHomeScreen}
        options={{ title: 'Khám phá' }}
      />
      <Tab.Screen
        name="OnlineAI"
        component={OnlineChatScreen}
        options={{ title: 'AI Online' }}
      />
    </>
  );
}

function renderOfflineTabs() {
  return (
    <>
      <Tab.Screen
        name="LocalFood"
        component={HomeScreen}
        options={{ title: 'Trong máy' }}
      />
      <Tab.Screen
        name="LocalAI"
        component={ChatScreen}
        options={{ title: 'Trợ lý Ảo' }}
      />
      <Tab.Screen
        name="Data"
        component={DataScreen}
        options={{ title: 'Dữ liệu' }}
      />
    </>
  );
}

// ── Icon Map ────────────────────────────────────────────────────

function getTabIcon(routeName: string): string {
  const icons: Record<string, string> = {
    OnlineExplore: '🧭',
    OnlineAI: '🪐',
    LocalFood: '📥',
    LocalAI: '🤖',
    Data: '📊',
  };
  return icons[routeName] || '❓';
}
