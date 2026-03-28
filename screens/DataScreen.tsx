// screens/DataScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { CITY_PACKS, CityPackConfig, getCityList } from '../services/cityConfig';
import { downloadCityPack, deleteCityPack, isCityPackDownloaded } from '../services/pack';
import { OfflineGuard } from '../components/OfflineGuard';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeColors } from '../constants/colors';

export default function DataScreen() {
  const [packs, setPacks] = useState<CityPackConfig[]>(getCityList());
  const [downloadedStatus, setDownloadedStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});

  const { colors, theme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Kiểm tra trạng thái tải về khi vào màn hình
  const checkStatus = async () => {
    const status: Record<string, boolean> = {};
    for (const city of packs) {
      status[city.id] = await isCityPackDownloaded(city.id);
    }
    setDownloadedStatus(status);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleDownload = async (cityId: string) => {
    setLoading((prev) => ({ ...prev, [cityId]: true }));
    setProgress((prev) => ({ ...prev, [cityId]: 0 }));

    const success = await downloadCityPack(cityId, (p) => {
      setProgress((prev) => ({ ...prev, [cityId]: p }));
    });

    if (success) {
      Alert.alert('Thành công', `Đã tải gói ${CITY_PACKS[cityId].name}`);
      await checkStatus();
    } else {
      Alert.alert('Lỗi', 'Tải xuống thất bại. Vui lòng thử lại.');
    }

    setLoading((prev) => ({ ...prev, [cityId]: false }));
  };

  const handleDelete = async (cityId: string) => {
    Alert.alert(
      'Xóa dữ liệu',
      `Bạn có chắc muốn xóa gói ${CITY_PACKS[cityId].name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            await deleteCityPack(cityId);
            await checkStatus();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: CityPackConfig }) => {
    const isDownloaded = downloadedStatus[item.id];
    const isLoading = loading[item.id];
    const currentProgress = progress[item.id] || 0;

    return (
      <View style={styles.card}>
        <View style={styles.info}>
          <Text style={styles.cityName}>{item.name}</Text>
          <Text style={styles.version}>v{item.version}</Text>
          <Text style={styles.desc}>{item.description}</Text>
        </View>

        <View style={styles.actions}>
          {isLoading ? (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.progressText}>{Math.round(currentProgress * 100)}%</Text>
            </View>
          ) : isDownloaded ? (
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.btnDelete}>
              <Text style={styles.btnTextDelete}>Xóa</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => handleDownload(item.id)} style={styles.btnDownload}>
              <Text style={styles.btnTextDownload}>Tải về</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <OfflineGuard>
      <View style={styles.container}>
        <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <Text style={styles.header}>Quản lý dữ liệu thành phố</Text>
        <FlatList
          data={packs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      </View>
    </OfflineGuard>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
    backgroundColor: colors.background,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  list: { padding: 15 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: colors.border || 'transparent'
  },
  info: { flex: 1, paddingRight: 10 },
  cityName: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  version: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  desc: { fontSize: 13, color: colors.textSecondary },
  actions: { justifyContent: 'center', minWidth: 80, alignItems: 'center' },

  btnDownload: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  btnTextDownload: { color: colors.background, fontWeight: 'bold', fontSize: 14 },

  btnDelete: { backgroundColor: '#FF3B30', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 }, // Keep red for danger
  btnTextDelete: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  progressContainer: { alignItems: 'center' },
  progressText: { fontSize: 12, color: colors.primary, marginTop: 4 },
});
