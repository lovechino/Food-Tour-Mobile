import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { getCityList, CityPackConfig } from '../services/cityConfig';
import { downloadCityPack } from '../services/pack';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeColors } from '../constants/colors';

export default function CitySelectScreen({ navigation }: any) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const { colors, theme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const cities = getCityList();

  const handleSelectCity = async (city: CityPackConfig) => {
    if (loadingId) return; // Đang tải cái khác thì chặn

    setLoadingId(city.id);
    setProgress(0);

    try {
      const success = await downloadCityPack(city.id, (p) => {
        setProgress(p);
      });

      if (success) {
        // Tải xong -> Vào app luôn
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Lỗi', 'Không thể tải dữ liệu thành phố này. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải dữ liệu.');
    } finally {
      setLoadingId(null);
    }
  };

  const renderItem = ({ item }: { item: CityPackConfig }) => {
    const isDownloading = loadingId === item.id;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleSelectCity(item)}
        disabled={!!loadingId}
      >
        <View style={styles.info}>
          <Text style={styles.cityName}>{item.name}</Text>
          <Text style={styles.desc}>{item.description}</Text>
        </View>

        {isDownloading ? (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>
        ) : (
          <Text style={styles.arrow}>➜</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.title}>Chọn thành phố</Text>
        <Text style={styles.subtitle}>Để bắt đầu, hãy tải dữ liệu địa phương</Text>
      </View>

      <FlatList
        data={cities}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: 30,
    paddingTop: 60,
    backgroundColor: colors.background,
    alignItems: 'center'
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: colors.text },
  subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },

  list: { padding: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: colors.border
  },
  info: { flex: 1, paddingRight: 15 },
  cityName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, color: colors.text },
  desc: { fontSize: 14, color: colors.textSecondary },
  arrow: { fontSize: 20, color: colors.textSecondary },

  progressContainer: { alignItems: 'center', minWidth: 40 },
  progressText: { fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: 'bold' }
});