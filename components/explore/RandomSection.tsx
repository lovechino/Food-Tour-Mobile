/**
 * components/explore/RandomSection.tsx
 * Why: Random food discovery cards, tách từ OnlineHomeScreen theo SRP.
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { RandomSectionProps } from '../../types/explore';
import { formatPrice } from '../../screens/styles/onlineHomeStyles';

export function RandomSection({ items, onRefresh, styles, colors }: RandomSectionProps) {
    return (
        <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.sectionIconBg, { backgroundColor: '#8b5cf622' }]}>
                        <Text style={{ fontSize: 20 }}>🎲</Text>
                    </View>
                    <Text style={styles.sectionTitle}>Khám Phá Ngẫu Nhiên</Text>
                </View>
                <TouchableOpacity onPress={onRefresh} style={[styles.refreshMini, { borderColor: colors.primary }]}>
                    <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12 }}>🔄 Đổi</Text>
                </TouchableOpacity>
            </View>
            {items.map(item => (
                <View key={item.id} style={[styles.randomCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.randomInfo}>
                        <Text style={styles.randomName} numberOfLines={1}>{item.ten_quan}</Text>
                        <Text style={styles.randomMon} numberOfLines={1}>{item.ten_mon}</Text>
                        <Text style={styles.randomAddr} numberOfLines={2}>📍 {item.dia_chi}</Text>
                    </View>
                    <View style={[styles.pricePill, { backgroundColor: colors.primary + '22' }]}>
                        <Text style={[styles.pricePillText, { color: colors.primary }]}>
                            {formatPrice(item.gia_min)}–{formatPrice(item.gia_max)}k
                        </Text>
                    </View>
                </View>
            ))}
        </View>
    );
}
