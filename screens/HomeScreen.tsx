// screens/HomeScreen.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, StatusBar, TouchableOpacity } from 'react-native';
import { openDB } from '../services/database';
import { useChat } from '../contexts/ChatContext';
import { getCityConfig } from '../services/cityConfig';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeColors } from '../constants/colors';

// ... (other imports)

export default function HomeScreen() {
  const [foods, setFoods] = useState<any[]>([]);
  const { currentCity } = useChat();

  const { colors, theme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const cityName = getCityConfig(currentCity)?.name || currentCity;

  useEffect(() => {
    const loadFoods = async () => {
      try {
        const db = await openDB(currentCity);
        // Load random foods for recommendation
        const [results] = await db.executeSql(
          `SELECT * FROM food ORDER BY RANDOM() LIMIT 20`
        );

        const loadedFoods = [];
        for (let i = 0; i < results.rows.length; i++) {
          loadedFoods.push(results.rows.item(i));
        }
        setFoods(loadedFoods);
      } catch (error) {
        console.error('Failed to load home foods:', error);
      }
    };

    loadFoods();
  }, [currentCity]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    return (
      <TouchableOpacity style={styles.card}>
        <View style={styles.imagePlaceholder}>
          <Text style={{ fontSize: 30 }}>🍲</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item?.ten_mon}</Text>
          <Text style={styles.subTitle} numberOfLines={1}>{item?.dia_chi}</Text>

          <View style={styles.row}>
            <View style={styles.badge}>
              <Text style={styles.price}>{item?.gia_min || 'Đang cập nhật'}</Text>
            </View>
            {/* District Badge if available, assume it's part of address or separate field */}
          </View>

          <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [styles]);

  return (
    <View style={styles.container}>
      {/* ... */}
      <View style={styles.header}>
        {/* ... */}
        <Text style={styles.subtext}>Gợi ý "cháy phố" tại {cityName}</Text>
      </View>

      <FlatList
        data={foods}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <Text style={styles.sectionTitle}>🔥 Hot Pick Hôm Nay</Text>
        )}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: 24,
    paddingTop: 40,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || 'rgba(255,255,255,0.05)'
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 20, color: colors.textSecondary, fontWeight: '600' },
  greetingHighlight: { fontSize: 32, fontWeight: '900', color: colors.text, lineHeight: 40 },
  subtext: { fontSize: 14, color: colors.secondary, marginTop: 5, fontWeight: 'bold' },

  list: { padding: 16 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
    marginTop: 8
  },
  card: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border || 'rgba(255,255,255,0.05)'
  },
  imagePlaceholder: {
    width: 80, height: 80, borderRadius: 16,
    backgroundColor: colors.border || 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16
  },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 17, fontWeight: '800', marginBottom: 4, color: colors.text },
  subTitle: { fontSize: 15, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  badge: {
    backgroundColor: 'rgba(187, 134, 252, 0.15)', // Keep strict purple tint or make dynamic? kept static for now as primary is purple
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8
  },
  price: { fontSize: 13, color: colors.primary, fontWeight: 'bold' },
  districtBadge: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },

  desc: { fontSize: 13, color: colors.textSecondary }
});
