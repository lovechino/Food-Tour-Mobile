// navigation/RootNavigator.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/WelcomeScreen';
import CitySelectScreen from '../screens/CitySelectScreen';
import TabNavigator from './TabNavigator';
import AiNearbyScreen from '../screens/AiNearbyScreen';

import { AppModeProvider, useAppMode } from '../contexts/AppModeContext';

export type RootStackParamList = {
  Welcome: undefined;
  CitySelect: undefined;
  MainTabs: undefined;
  AiNearby: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigatorContent() {
  const { mode, isDataReady, isLoading } = useAppMode();
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    if (isLoading) return; // Wait until loaded

    if (mode === 'pending') {
      setInitialRoute('Welcome');
    } else if (mode === 'online') {
      setInitialRoute('MainTabs');
    } else if (mode === 'offline') {
      if (!isDataReady) {
        setInitialRoute('CitySelect');
      } else {
        setInitialRoute('MainTabs');
      }
    }
  }, [mode, isDataReady, isLoading]);

  if (isLoading || !initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="CitySelect" component={CitySelectScreen} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="AiNearby" component={AiNearbyScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <AppModeProvider>
      <NavigationContainer>
        <RootNavigatorContent />
      </NavigationContainer>
    </AppModeProvider>
  );
}

