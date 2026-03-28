/**
 * screens/AiNearbyScreen.tsx
 * Màn hình tìm quán ăn quanh đây bằng GPS + AI.
 * Why: Chỉ giữ orchestration, logic/map/styles đã tách ra modules riêng.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { AiSuggestResponse, FoodItem } from '../services/cityApi';
import { useGeolocation, GeoLocation } from '../hooks/useGeolocation';
import { fetchNearbyAI } from '../services/aiGroundingService';
import { createNearbyStyles } from './styles/aiNearbyStyles';
import { NearbyStatusPanel } from '../components/nearby/NearbyStatusPanel';
import { NearbyFoodList } from '../components/nearby/NearbyFoodList';
import { NearbyMap } from '../components/nearby/NearbyMap';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function AiNearbyScreen({ navigation }: { navigation: NativeStackNavigationProp<Record<string, undefined>> }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createNearbyStyles(colors), [colors]);

    const [aiLoading, setAiLoading] = useState(false);
    const [aiData, setAiData] = useState<AiSuggestResponse | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
    const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const onLocated = useCallback(async (loc: GeoLocation) => {
        setAiLoading(true);
        const { data, error } = await fetchNearbyAI(loc.latitude, loc.longitude);
        if (data) setAiData(data);
        if (error) { data ? setErrorMsg(error) : Alert.alert("Lỗi", error); }
        setAiLoading(false);
    }, []);

    const geo = useGeolocation(onLocated);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>← Quay lại</Text>
                </TouchableOpacity>
                <Text style={styles.title}>📍 Quanh Đây</Text>
                {aiData ? (
                    <TouchableOpacity onPress={() => setViewMode(v => v === 'list' ? 'map' : 'list')} style={styles.toggleBtn}>
                        <Text style={styles.toggleText}>{viewMode === 'list' ? '🗺️ Bản đồ' : '📄 Danh sách'}</Text>
                    </TouchableOpacity>
                ) : <View style={{ width: 80 }} />}
            </View>

            {/* Status Panel (loading / error / radar) */}
            {(!aiData || viewMode === 'list') && (
                <View style={styles.radarContainer}>
                    <NearbyStatusPanel
                        isLoadingLocation={geo.isLoading} isAiLoading={aiLoading}
                        errorMsg={geo.errorMsg || errorMsg} aiData={aiData}
                        location={geo.location} colors={colors} styles={styles}
                        onDismissError={() => navigation.goBack()} />
                </View>
            )}

            {/* List View */}
            {aiData?.results && viewMode === 'list' && (
                <NearbyFoodList items={aiData.results} colors={colors} styles={styles} />
            )}

            {/* Map View */}
            {aiData?.results && viewMode === 'map' && geo.location && (
                <NearbyMap items={aiData.results} location={geo.location}
                    selectedFood={selectedFood} onSelectFood={setSelectedFood}
                    colors={colors} styles={styles} />
            )}
        </View>
    );
}
