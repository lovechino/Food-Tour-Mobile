/**
 * components/nearby/NearbyMap.tsx
 * Why: MapView + Markers with jitter logic, tách từ AiNearbyScreen (SRP).
 * Thuật toán jitter: Fibonacci spiral angle để phân bố markers trùng tọa độ,
 * tránh stacking invisible. Offset ~15m (~0.00015 degrees).
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { ThemeColors } from '../../constants/colors';
import { FoodItem } from '../../services/cityApi';
import { GeoLocation } from '../../hooks/useGeolocation';

interface Props {
    items: FoodItem[];
    location: GeoLocation;
    selectedFood: FoodItem | null;
    onSelectFood: (food: FoodItem | null) => void;
    colors: ThemeColors;
    styles: Record<string, unknown>;
}

/** Why: Fibonacci angle phân bố markers trùng tọa độ tránh overlapping */
const FIBONACCI_ANGLE_DEG = 137.5;
const OFFSET_PER_UNIT = 0.00015;

function computeJitter(items: FoodItem[], index: number, lat: number, lng: number) {
    const dupeCount = items.filter((r, i) => i < index && Number(r.lat) === lat && Number(r.lng) === lng).length;
    if (dupeCount === 0) return { lat, lng };
    const angle = (dupeCount * FIBONACCI_ANGLE_DEG) * (Math.PI / 180);
    const radius = OFFSET_PER_UNIT * Math.sqrt(dupeCount);
    return { lat: lat + radius * Math.cos(angle), lng: lng + radius * Math.sin(angle) };
}

export function NearbyMap({ items, location, selectedFood, onSelectFood, colors, styles: s }: Props) {
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        if (!mapRef.current || !items.length) return;
        const coords = items
            .map(item => ({ latitude: Number(item.lat), longitude: Number(item.lng) }))
            .filter(c => !isNaN(c.latitude) && !isNaN(c.longitude) && c.latitude !== 0);
        coords.push({ latitude: location.latitude, longitude: location.longitude });
        if (coords.length > 0) {
            mapRef.current.fitToCoordinates(coords, {
                edgePadding: { top: 180, right: 50, bottom: 150, left: 50 }, animated: true,
            });
        }
    }, [items, location]);

    return (
        <View style={s.mapContainer as object}>
            <MapView ref={mapRef} provider={PROVIDER_GOOGLE} style={s.map as object}
                initialRegion={{ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 }}
                showsUserLocation showsMyLocationButton>
                {items.map((item, index) => {
                    const parsed = { lat: parseFloat(String(item.lat)), lng: parseFloat(String(item.lng)) };
                    if (isNaN(parsed.lat) || isNaN(parsed.lng) || parsed.lat === 0) return null;
                    const jittered = computeJitter(items, index, parsed.lat, parsed.lng);
                    return (
                        <Marker key={String(item.id)}
                            coordinate={{ latitude: jittered.lat, longitude: jittered.lng }}
                            title={item.ten_quan}
                            description={`${item.ten_mon}${item.dist ? ' • 📍 ' + item.dist : ''}`}
                            onPress={() => onSelectFood(item)}
                            pinColor={colors.primary} />
                    );
                })}
            </MapView>

            {/* Floating Card */}
            {selectedFood && (
                <TouchableOpacity style={s.floatingCardContainer as object} activeOpacity={1} onPress={() => onSelectFood(null)}>
                    <View style={[s.floatingCard as object, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={s.foodImagePlaceholder as object}>
                            <Text style={{ fontSize: 30 }}>🍜</Text>
                        </View>
                        <View style={s.cardInfo as object}>
                            <Text style={[s.cardName as object, { color: colors.text }]} numberOfLines={1}>{selectedFood.ten_quan}</Text>
                            <Text style={s.cardMon as object} numberOfLines={1}>{selectedFood.ten_mon}</Text>
                            {selectedFood.note ? <Text style={s.groundingNote as object} numberOfLines={2}>{selectedFood.note}</Text> : null}
                            <Text style={s.cardAddr as object} numberOfLines={2}>📍 {selectedFood.dia_chi}</Text>
                        </View>
                        <View style={[s.pricePill as object, { backgroundColor: colors.primary + '22' }]}>
                            <Text style={[s.pricePillText as object, { color: colors.primary }]}>
                                {selectedFood.gia_min >= 1000 ? Math.round(selectedFood.gia_min / 1000) : selectedFood.gia_min}k
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
}
