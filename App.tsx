/**
 * FoodTourAI - Root App Component
 * Clean architecture: providers + hooks for side effects.
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { GlobalToast } from './components/GlobalToast';
import { useAppInit } from './hooks/useAppInit';
import { useSuggestionSync } from './hooks/useSuggestionSync';
import { detectLowEndDevice } from './utils/deviceCapability';

import Config from 'react-native-config';

// ── Configure Google Sign-In once at module load ─────────────────────────────
try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    GoogleSignin.configure({
        webClientId: Config.GOOGLE_WEB_CLIENT_ID || 'PLACEHOLDER_GOOGLE_WEB_CLIENT_ID',
        offlineAccess: true,
    });
} catch (e) {
    console.warn('[App] Google Sign-In not configured:', e);
}

/**
 * SideEffects — runs FCM init + suggestion sync on mount.
 * Extracted to keep App() pure and readable.
 */
function SideEffects() {
    useAppInit();
    useSuggestionSync();

    // Device capability detection (cached, runs once)
    React.useEffect(() => {
        detectLowEndDevice();
    }, []);

    return null;
}

function App() {
    const isDarkMode = useColorScheme() === 'dark';

    return (
        <SafeAreaProvider>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <SideEffects />
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
