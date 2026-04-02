/**
 * screens/SettingsScreen.tsx
 * Tập trung: City preference, Offline Pack, Mode switch, Account.
 * Dùng icon ⚙️ ở header HomeScreen để navigate vào đây.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, StatusBar, Linking, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ThemeColors } from '../constants/colors';
import { getCityList, CityPackConfig } from '../services/cityConfig';
import {
  downloadCityPack, deleteCityPack, isCityPackDownloaded,
} from '../services/pack';

const CITY_PREF_KEY = '@preferred_city';

export default function SettingsScreen({ navigation }: any) {
  const { colors, theme, toggleTheme } = useTheme();
  const { user, logout, isGuest } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedCity, setSelectedCity] = useState('ha_noi');
  const [packStatus, setPackStatus] = useState<Record<string, boolean>>({});
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const cities = getCityList();

  useEffect(() => { loadPreferences(); }, []);

  const loadPreferences = async () => {
    const saved = await AsyncStorage.getItem(CITY_PREF_KEY);
    if (saved) setSelectedCity(saved);
    await refreshPackStatus();
  };

  const refreshPackStatus = async () => {
    const status: Record<string, boolean> = {};
    for (const c of cities) {
      status[c.id] = await isCityPackDownloaded(c.id);
    }
    setPackStatus(status);
  };

  const handleCityChange = async (cityId: string) => {
    setSelectedCity(cityId);
    await AsyncStorage.setItem(CITY_PREF_KEY, cityId);
  };

  const handleDownload = useCallback(async (cityId: string) => {
    setDownloading(cityId);
    setProgress(0);
    const ok = await downloadCityPack(cityId, setProgress);
    if (ok) {
      Alert.alert('Thành công! 🎉', 'Đã tải xong gói Offline');
      await refreshPackStatus();
    } else {
      Alert.alert('Lỗi', 'Tải thất bại. Thử lại sau nhé!');
    }
    setDownloading(null);
  }, []);

  const handleDelete = useCallback((cityId: string, name: string) => {
    Alert.alert('Xóa gói Offline', `Xóa dữ liệu ${name}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          await deleteCityPack(cityId);
          await refreshPackStatus();
        },
      },
    ]);
  }, []);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Text style={styles.pageTitle}>Cài đặt ⚙️</Text>

      {/* ── Account ── */}
      <SectionTitle text="Tài khoản" styles={styles} />
      {renderAccountSection(user, isGuest, styles, handleLogout, navigation)}

      {/* ── City Preference ── */}
      <SectionTitle text="Thành phố mặc định" styles={styles} />
      {renderCityPicker(cities, selectedCity, handleCityChange, styles, colors)}

      {/* ── Offline Packs ── */}
      <SectionTitle text="Gói Offline" styles={styles} />
      {renderOfflinePacks(
        cities, packStatus, downloading, progress,
        handleDownload, handleDelete, styles, colors,
      )}

      {/* ── Appearance ── */}
      <SectionTitle text="Giao diện" styles={styles} />
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Chế độ tối</Text>
        <Switch
          value={theme === 'dark'}
          onValueChange={toggleTheme}
          trackColor={{ true: colors.primary }}
        />
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

// ── Sub-Components ──────────────────────────────────────────────

function SectionTitle({ text, styles }: any) {
  return <Text style={styles.sectionTitle}>{text}</Text>;
}

function renderAccountSection(
  user: any, isGuest: boolean, styles: any,
  onLogout: () => void, navigation: any,
) {
  if (isGuest || !user) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('LoginPromptModal', { reason: 'default' })}
      >
        <Text style={styles.cardText}>👤 Đăng nhập để mở khoá đầy đủ</Text>
      </TouchableOpacity>
    );
  }
  return (
    <View style={styles.card}>
      <Text style={styles.cardText}>👤 {user.name}</Text>
      <Text style={styles.cardSub}>{user.email}</Text>
      <TouchableOpacity style={styles.dangerBtn} onPress={onLogout}>
        <Text style={styles.dangerText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

function renderCityPicker(
  cities: CityPackConfig[], selectedCity: string,
  onChange: (id: string) => void, styles: any, colors: any,
) {
  return (
    <View style={styles.card}>
      {cities.map(c => (
        <TouchableOpacity
          key={c.id}
          style={[
            styles.cityRow,
            c.id === selectedCity && { backgroundColor: colors.primary + '22' },
          ]}
          onPress={() => onChange(c.id)}
        >
          <Text style={[
            styles.cityLabel,
            c.id === selectedCity && { color: colors.primary, fontWeight: '800' },
          ]}>
            {c.name}
          </Text>
          {c.id === selectedCity && <Text style={{ color: colors.primary }}>✓</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function renderOfflinePacks(
  cities: CityPackConfig[], status: Record<string, boolean>,
  downloading: string | null, progress: number,
  onDownload: (id: string) => void, onDelete: (id: string, name: string) => void,
  styles: any, colors: any,
) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardSub}>
        Dùng được không cần mạng — cần tải ~100MB lần đầu
      </Text>
      {cities.map(c => (
        <View key={c.id} style={styles.packRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.packName}>{c.name}</Text>
            <Text style={styles.packVer}>v{c.version}</Text>
          </View>
          {renderPackAction(
            c, status[c.id], downloading, progress,
            onDownload, onDelete, styles, colors,
          )}
        </View>
      ))}
    </View>
  );
}

function renderPackAction(
  city: CityPackConfig, isDownloaded: boolean,
  downloading: string | null, progress: number,
  onDownload: (id: string) => void,
  onDelete: (id: string, name: string) => void,
  styles: any, colors: any,
) {
  if (downloading === city.id) {
    return (
      <View style={styles.progressWrap}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.progressTxt}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
    );
  }
  if (isDownloaded) {
    return (
      <TouchableOpacity
        style={styles.dangerBtn}
        onPress={() => onDelete(city.id, city.name)}
      >
        <Text style={styles.dangerText}>Xóa</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      style={styles.primaryBtn}
      onPress={() => onDownload(city.id)}
    >
      <Text style={styles.primaryBtnText}>Tải về</Text>
    </TouchableOpacity>
  );
}

// ── Styles ───────────────────────────────────────────────────────

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background, padding: 20 },
  pageTitle: {
    fontSize: 26, fontWeight: '900', color: c.text,
    marginTop: 50, marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: c.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1,
    marginTop: 24, marginBottom: 12,
  },
  card: {
    backgroundColor: c.card, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: c.border,
  },
  cardText: { fontSize: 16, fontWeight: '700', color: c.text },
  cardSub: {
    fontSize: 13, color: c.textSecondary, marginTop: 4, lineHeight: 20,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', backgroundColor: c.card,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: c.border,
  },
  rowLabel: { fontSize: 16, fontWeight: '600', color: c.text },
  cityRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8,
    borderRadius: 10,
  },
  cityLabel: { fontSize: 15, color: c.text },
  packRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderTopWidth: 1,
    borderTopColor: c.border,
  },
  packName: { fontSize: 15, fontWeight: '700', color: c.text },
  packVer: { fontSize: 12, color: c.textSecondary },
  primaryBtn: {
    backgroundColor: c.primary, paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 10,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  dangerBtn: {
    backgroundColor: '#FF3B30', paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 10, marginTop: 10,
  },
  dangerText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  progressWrap: { alignItems: 'center', minWidth: 50 },
  progressTxt: {
    fontSize: 11, color: c.primary, fontWeight: '700', marginTop: 4,
  },
});
