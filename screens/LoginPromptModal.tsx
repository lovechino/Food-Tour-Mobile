/**
 * screens/LoginPromptModal.tsx
 * Bottom sheet modal hiện khi Guest bấm vào protected feature.
 * Giải thích lợi ích đăng nhập + CTA đăng nhập Google.
 */
import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ThemeColors } from '../constants/colors';

const BENEFIT_MAP: Record<string, string> = {
  default: 'Đăng nhập để mở khoá tính năng này nhé!',
  chat: 'Đăng nhập để chat với AI và lưu lịch sử trò chuyện ✨',
  nearby: 'Đăng nhập để tìm quán ăn quanh bạn bằng GPS 📍',
  offline: 'Đăng nhập để tải gói Offline và dùng mọi lúc mọi nơi 📦',
};

export default function LoginPromptModal({ route, navigation }: any) {
  const reason = route?.params?.reason || 'default';
  const { colors } = useTheme();
  const { loginWithGoogle } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const benefitText = BENEFIT_MAP[reason] || BENEFIT_MAP.default;

  const handleGoogleLogin = async () => {
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      const idToken = result?.data?.idToken;
      if (!idToken) throw new Error('Không lấy được token');
      await loginWithGoogle(idToken);
      navigation.goBack();
    } catch (error: any) {
      if (error.code === 'SIGN_IN_CANCELLED') return;
      Alert.alert('Lỗi', error.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <View style={styles.overlay}>
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" />
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={() => navigation.goBack()}
      />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.emoji}>🔐</Text>
        <Text style={styles.title}>Cần đăng nhập</Text>
        <Text style={styles.desc}>{benefitText}</Text>

        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleLogin}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>Đăng nhập bằng Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.skipText}>Để sau</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────

const createStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: c.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    alignItems: 'center',
    paddingBottom: 40,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: c.border, marginBottom: 20,
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: {
    fontSize: 22, fontWeight: '800',
    color: c.text, marginBottom: 8,
  },
  desc: {
    fontSize: 15, color: c.textSecondary,
    textAlign: 'center', lineHeight: 22,
    marginBottom: 24, paddingHorizontal: 10,
  },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: 28, width: '100%',
    justifyContent: 'center', marginBottom: 16,
  },
  googleIcon: {
    fontSize: 18, fontWeight: '900', color: '#fff',
    marginRight: 10, backgroundColor: 'rgba(255,255,255,0.2)',
    width: 28, height: 28, borderRadius: 14,
    textAlign: 'center', lineHeight: 28,
  },
  googleText: {
    fontSize: 16, fontWeight: '700', color: '#fff',
  },
  skipText: {
    fontSize: 14, color: c.textSecondary,
    textDecorationLine: 'underline',
  },
});
