/**
 * screens/WelcomeScreen.tsx
 * Clean auth-only screen: Google Sign-In + Guest.
 * Mode selection đã chuyển sang SettingsScreen.
 * Online là mặc định — user vào thẳng MainTabs sau login/guest.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, ActivityIndicator, StyleSheet,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppPhase } from '../contexts/AppModeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeColors } from '../constants/colors';

export default function WelcomeScreen({ navigation }: any) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { dispatch } = useAppPhase();
  const { loginWithGoogle, continueAsGuest } = useAuth();
  const { colors, theme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const idToken = await performGoogleSignIn();
      if (!idToken) throw new Error('Không lấy được token');
      await loginWithGoogle(idToken);
      await onAuthSuccess();
    } catch (error: any) {
      handleSignInError(error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSkipLogin = () => {
    continueAsGuest();
    dispatch({ type: 'GUEST_ENTER' });
    navigation.replace('MainTabs');
  };

  const onAuthSuccess = async () => {
    await AsyncStorage.setItem('@app_mode', 'online');
    dispatch({ type: 'LOGIN_SUCCESS' });
    navigation.replace('MainTabs');
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <View style={styles.header}>
        <Text style={styles.emoji}>👻</Text>
        <Text style={styles.title}>Hé lô! 👋</Text>
        <Text style={styles.subtitle}>
          Đói chưa? FoodTourAI giúp bạn tìm quán ngon nhanh gọn lẹ!
        </Text>
      </View>

      {/* ── Auth Buttons ── */}
      <View style={styles.authSection}>
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          activeOpacity={0.8}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color="#fff" size="small" style={{ marginRight: 12 }} />
          ) : (
            <Text style={styles.googleIcon}>G</Text>
          )}
          <Text style={styles.googleButtonText}>Đăng nhập bằng Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkipLogin} activeOpacity={0.7}>
          <Text style={styles.skipText}>Dùng không đăng nhập →</Text>
        </TouchableOpacity>
      </View>

      {/* ── Footer ── */}
      <Text style={styles.footerNote}>
        Đăng nhập để mở khoá AI Chat, tìm quán quanh đây, và nhiều hơn nữa ✨
      </Text>
    </View>
  );
}

// ── Helpers ─────────────────────────────────────────────────────

async function performGoogleSignIn(): Promise<string | null> {
  const { GoogleSignin } = require('@react-native-google-signin/google-signin');
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  return result?.data?.idToken || null;
}

function handleSignInError(error: any) {
  if (error.code === 'SIGN_IN_CANCELLED') return;
  if (error.code === 'IN_PROGRESS') return;
  if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
    Alert.alert('Lỗi', 'Google Play Services không khả dụng.');
    return;
  }
  Alert.alert(
    'Đăng nhập thất bại',
    error.message || 'Có lỗi xảy ra khi đăng nhập Google.',
  );
}

// ── Styles ──────────────────────────────────────────────────────

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1, backgroundColor: c.background,
    padding: 24, justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: 32 },
  emoji: {
    fontSize: 80, marginBottom: 20,
    textShadowColor: 'rgba(255,255,255,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  title: {
    fontSize: 32, fontWeight: '900', color: c.text,
    marginBottom: 10, textAlign: 'center', letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16, color: c.textSecondary,
    textAlign: 'center', lineHeight: 24,
  },
  authSection: { alignItems: 'center', marginBottom: 28 },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: 30, width: '100%',
    elevation: 3,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6,
  },
  googleIcon: {
    fontSize: 22, fontWeight: '900', color: '#FFFFFF',
    marginRight: 12, backgroundColor: 'rgba(255,255,255,0.2)',
    width: 32, height: 32, borderRadius: 16,
    textAlign: 'center', lineHeight: 32, overflow: 'hidden',
  },
  googleButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  skipText: {
    fontSize: 14, color: c.textSecondary,
    marginTop: 14, textDecorationLine: 'underline',
  },
  footerNote: {
    fontSize: 13, color: c.textSecondary, textAlign: 'center',
    lineHeight: 20, paddingHorizontal: 20, marginTop: 16,
  },
});
