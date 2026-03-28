import React, { useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { downloadModel } from "../services/model";
import { useAppMode } from '../contexts/AppModeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeColors } from '../constants/colors';

export default function WelcomeScreen({ navigation }: any) {
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { setAppMode } = useAppMode();
  const { loginWithGoogle, continueAsGuest, isLoggedIn } = useAuth();

  const { colors, theme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // ── Google Sign-In Handler ────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      // Sử dụng @react-native-google-signin/google-signin
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');

      // Kiểm tra xem Google Play Services có sẵn không
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Thực hiện đăng nhập Google
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult?.data?.idToken;

      if (!idToken) {
        throw new Error('Không lấy được ID Token từ Google.');
      }

      // Gửi token lên backend để xác thực
      await loginWithGoogle(idToken);

      console.log('✅ Đăng nhập Google thành công!');
      Alert.alert('Thành công! 🎉', 'Đã đăng nhập bằng Google. Chọn chế độ sử dụng nhé!');
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);

      // Xử lý các lỗi phổ biến
      if (error.code === 'SIGN_IN_CANCELLED') {
        // User huỷ đăng nhập, không cần thông báo
        return;
      }
      if (error.code === 'IN_PROGRESS') {
        return; // Đang xử lý rồi
      }
      if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        Alert.alert('Lỗi', 'Google Play Services không khả dụng trên thiết bị này.');
        return;
      }

      Alert.alert('Đăng nhập thất bại', error.message || 'Có lỗi xảy ra khi đăng nhập Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // ── Skip Login (Guest Mode) ───────────────────────────────────────────────
  const handleSkipLogin = () => {
    continueAsGuest();
  };

  // ── Mode Selection Handlers ───────────────────────────────────────────────
  const handleChooseOnline = async () => {
    console.log("👆 User chose ONLINE mode");
    try {
      await setAppMode('online');
      console.log("✅ setAppMode(online) done. Navigating...");
      navigation.replace('MainTabs');
    } catch (e) {
      console.error("❌ Error setting online mode:", e);
    }
  };

  const handleChooseOffline = async () => {
    console.log("👆 User chose OFFLINE mode");
    try {
      await setAppMode('offline');
      console.log("✅ setAppMode(offline) done. Starting download...");
      setIsDownloading(true);

      await downloadModel(p => setProgress(p));
      console.log("✅ downloadModel done. Navigating...");
      navigation.replace('CitySelect');
    } catch (e) {
      console.error("❌ Download or setup failed:", e);
      setIsDownloading(false);
    }
  };

  // ── Download Progress Screen ──────────────────────────────────────────────
  if (isDownloading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <Text style={styles.emoji}>🚀</Text>
        <Text style={styles.title}>Đang tải não cho AI...</Text>
        <Text style={styles.subtitle}>Chờ xíu nha, khoảng 100MB thôi!</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.floor(progress * 100)}%</Text>
        </View>
      </View>
    );
  }

  // ── Main Welcome UI ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.emoji}>👻</Text>
        <Text style={styles.title}>Hé lô! 👋</Text>
        <Text style={styles.subtitle}>Đói chưa? Chọn cách "chill" với FoodTourAI nhé!</Text>
      </View>

      {/* ── Google Sign-In Section ──────────────────────────────────────── */}
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
          <Text style={styles.googleButtonText}>
            {isLoggedIn ? '✅ Đã đăng nhập' : 'Đăng nhập bằng Google'}
          </Text>
        </TouchableOpacity>

        {!isLoggedIn && (
          <TouchableOpacity onPress={handleSkipLogin} activeOpacity={0.7}>
            <Text style={styles.skipText}>Dùng không đăng nhập →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Mode Selection ─────────────────────────────────────────────── */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.modeButton, { borderColor: colors.secondary }]}
          onPress={handleChooseOnline}
          activeOpacity={0.8}
        >
          <View style={[styles.modeIcon, { backgroundColor: 'rgba(3, 218, 198, 0.2)' }]}>
            <Text style={{ fontSize: 30 }}>🌐</Text>
          </View>
          <View style={styles.modeTextContainer}>
            <Text style={[styles.modeTitle, { color: colors.secondary }]}>Online Mode</Text>
            <Text style={styles.modeDesc}>Nhanh, gọn, lẹ. Không cần tải gì cả.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, { borderColor: colors.primary }]}
          onPress={handleChooseOffline}
          activeOpacity={0.8}
        >
          <View style={[styles.modeIcon, { backgroundColor: 'rgba(187, 134, 252, 0.2)' }]}>
            <Text style={{ fontSize: 30 }}>🔌</Text>
          </View>
          <View style={styles.modeTextContainer}>
            <Text style={[styles.modeTitle, { color: colors.primary }]}>Offline Mode</Text>
            <Text style={styles.modeDesc}>Cần tải data (~100MB). Dùng mọi lúc mọi nơi không cần mạng.</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 1
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24
  },

  // ── Auth Section ────────────────────────────────────────────────────
  authSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    width: '100%',
    elevation: 3,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  googleIcon: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 32,
    height: 32,
    borderRadius: 16,
    textAlign: 'center',
    lineHeight: 32,
    overflow: 'hidden',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 14,
    textDecorationLine: 'underline',
  },

  // ── Mode Selection ──────────────────────────────────────────────────
  actions: {
    width: '100%'
  },
  modeButton: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modeIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modeTextContainer: { flex: 1 },
  modeTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  modeDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20
  },

  progressContainer: { width: '100%', alignItems: 'center', marginTop: 20 },
  progressText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 10
  },
  progressBarBg: {
    width: '100%',
    height: 12,
    backgroundColor: colors.input || '#333',
    borderRadius: 6,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary
  }
});
