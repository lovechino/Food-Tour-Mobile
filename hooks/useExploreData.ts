/**
 * hooks/useExploreData.ts
 * Why: Tách state management & data fetching ra khỏi OnlineHomeScreen
 * để screen chỉ làm nhiệm vụ render (SRP).
 */
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getExploreData, refreshExploreData, ExploreData } from '../services/exploreCache';

export function useExploreData() {
    const [city, setCity] = useState('ha_noi');
    const [data, setData] = useState<ExploreData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        }, [city])
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

    const onCityChange = (newCity: string) => {
        if (newCity !== city) {
            setCity(newCity);
            setData(null);
            load(newCity);
        }
    };

    return {
        city, data, loading, refreshing, error,
        load, onRefresh, onCityChange,
    };
}
