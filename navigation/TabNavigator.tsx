import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import DataScreen from '../screens/DataScreen';
import OnlineChatScreen from '../screens/OnlineChatScreen';
import OnlineHomeScreen from '../screens/OnlineHomeScreen';
import { useTheme } from '../contexts/ThemeContext';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    const { colors, theme } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName = '❓';

                    if (route.name === 'OnlineExplore') {
                        iconName = '🧭'; // Online Explore
                    } else if (route.name === 'OnlineAI') {
                        iconName = '🪐'; // Online Chat
                    } else if (route.name === 'LocalFood') {
                        iconName = '📥'; // Local Food (Old Home)
                    } else if (route.name === 'LocalAI') {
                        iconName = '🤖'; // Local Chat
                    } else if (route.name === 'Data') {
                        iconName = '📊'; // Data
                    }

                    return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>{iconName}</Text>;
                },
            })}
        >
            <Tab.Screen name="OnlineExplore" component={OnlineHomeScreen} options={{ title: 'Khám phá' }} />
            <Tab.Screen name="OnlineAI" component={OnlineChatScreen} options={{ title: 'AI Online' }} />

            <Tab.Screen name="LocalFood" component={HomeScreen} options={{ title: 'Trong máy' }} />
            <Tab.Screen name="LocalAI" component={ChatScreen} options={{ title: 'Trợ lý Ảo' }} />

            <Tab.Screen name="Data" component={DataScreen} options={{ title: 'Dữ liệu' }} />
        </Tab.Navigator>
    );
}
