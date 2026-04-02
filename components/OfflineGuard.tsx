/**
 * components/OfflineGuard.tsx
 * Guard khi user Online chưa tải pack Offline.
 * Sửa microcopy + thêm deep-link Cài đặt Bộ nhớ.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { useAppMode } from '../contexts/AppModeContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

interface OfflineGuardProps {
  children: React.ReactNode;
}

export const OfflineGuard: React.FC<OfflineGuardProps> = ({ children }) => {
  const { mode, isDataReady } = useAppMode();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  if (mode === 'online' && !isDataReady) {
    return (
      <View style={styles.container}>
        <OverlayContent
          navigation={navigation}
          colors={colors}
        />
        <View style={styles.backdrop} pointerEvents="none">
          {children}
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

// ── Overlay ─────────────────────────────────────────────────────

function OverlayContent({ navigation, colors }: any) {
  return (
    <View style={[styles.overlay, { backgroundColor: colors.overlay || 'rgba(255,255,255,0.9)' }]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.icon}>📦</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Cần tải gói Offline
        </Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          Dùng được không cần mạng — cần tải ~100MB lần đầu.
          Vào Cài đặt để tải gói dữ liệu nhé!
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.btnText}>Tải trong Cài đặt</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={openStorageSettings}>
          <Text style={[styles.linkText, { color: colors.primary }]}>
            Kiểm tra dung lượng điện thoại →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Deep link OS Storage ────────────────────────────────────────

function openStorageSettings() {
  if (Platform.OS === 'android') {
    Linking.openSettings();
  } else {
    Linking.openURL('App-Prefs:STORAGE_AND_BACKUP');
  }
}

// ── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: { flex: 1, opacity: 0.3 },
  card: {
    padding: 30, borderRadius: 24,
    alignItems: 'center', width: '100%', maxWidth: 340,
    borderWidth: 1, elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10,
  },
  icon: { fontSize: 48, marginBottom: 12 },
  title: {
    fontSize: 20, fontWeight: 'bold', marginBottom: 10,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14, textAlign: 'center',
    lineHeight: 22, marginBottom: 24,
  },
  primaryBtn: {
    paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 24, marginBottom: 12,
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkText: {
    fontSize: 13, fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
