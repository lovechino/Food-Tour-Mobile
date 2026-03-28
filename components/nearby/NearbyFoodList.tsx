/**
 * components/nearby/NearbyFoodList.tsx
 * Why: FlatList view mode cho nearby results, tách từ AiNearbyScreen (SRP).
 */
import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { ThemeColors } from '../../constants/colors';
import { FoodItem } from '../../services/cityApi';

interface Props {
    items: FoodItem[];
    colors: ThemeColors;
    styles: Record<string, unknown>;
}

export function NearbyFoodList({ items, colors, styles: s }: Props) {
    return (
        <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={s.listContent as object}
            renderItem={({ item }) => (
                <View style={[s.card as object, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={s.cardInfo as object}>
                        <Text style={[s.cardName as object, { color: colors.text }]} numberOfLines={1}>{item.ten_quan}</Text>
                        <Text style={s.cardMon as object} numberOfLines={1}>{item.ten_mon}</Text>
                        {item.note ? <Text style={s.groundingNote as object} numberOfLines={2}>{item.note}</Text> : null}
                        <Text style={s.cardAddr as object} numberOfLines={2}>📍 {item.dia_chi}</Text>
                    </View>
                    <View style={[s.pricePill as object, { backgroundColor: colors.primary + '22' }]}>
                        <Text style={[s.pricePillText as object, { color: colors.primary }]}>
                            {item.gia_min >= 1000 ? Math.round(item.gia_min / 1000) : item.gia_min}k
                        </Text>
                    </View>
                </View>
            )}
        />
    );
}
