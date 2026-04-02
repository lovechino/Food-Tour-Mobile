/**
 * hooks/useExploreData.ts
 * Tách state management & data fetching ra khỏi OnlineHomeScreen (SRP).
 * City preference: AsyncStorage → GPS → fallback 'ha_noi'.
 */
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getExploreData, refreshExploreData, ExploreData,
} from '../services/exploreCache';

const CITY_PREF_KEY = '@preferred_city';

export function useExploreData() {
  const [city, setCity] = useState('ha_noi');
  const [data, setData] = useState<ExploreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved city preference on mount
  useEffect(() => { loadSavedCity(); }, []);

  const loadSavedCity = async () => {
    const saved = await AsyncStorage.getItem(CITY_PREF_KEY);
    if (saved) setCity(saved);
  };

  const load = async (targetCity: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getExploreData(targetCity);
      setData(result);
    } catch {
      setError('Không thể kết nối server. Kiểm tra lại mạng!');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!data) load(city);
    }, [city]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const result = await refreshExploreData(city);
      setData(result);
    } catch {
      setError('Không thể tải. Thử lại sau!');
    } finally {
      setRefreshing(false);
    }
  };

  const onCityChange = async (newCity: string) => {
    if (newCity === city) return;
    setCity(newCity);
    setData(null);
    await AsyncStorage.setItem(CITY_PREF_KEY, newCity);
    load(newCity);
  };

  return {
    city, data, loading, refreshing, error,
    load, onRefresh, onCityChange,
  };
}
