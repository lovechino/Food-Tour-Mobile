/**
 * components/explore/TrendingSection.tsx
 * Why: Trending list rows, tách từ OnlineHomeScreen theo SRP.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { TrendingSectionProps } from '../../types/explore';
import { SectionHeader } from './SectionHeader';

export function TrendingSection({ items, styles, colors }: TrendingSectionProps) {
    if (!items.length) return (
        <View style={styles.section}>
            <SectionHeader title="Trending" icon="⚡" iconColor="#f59e0b" styles={styles} />
            <Text style={styles.emptyText}>Chưa có dữ liệu trending – hãy click vào các quán!</Text>
        </View>
    );
    return (
        <View style={styles.section}>
            <SectionHeader title="Trending" icon="⚡" iconColor="#f59e0b" styles={styles} />
            {items.map(item => (
                <View key={item.id} style={styles.trendRow}>
                    <View style={[styles.trendRank, { backgroundColor: colors.primary + '22' }]}>
                        <Text style={[styles.trendRankText, { color: colors.primary }]}>#{item.rank}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.trendName} numberOfLines={1}>{item.ten_quan}</Text>
                        <Text style={styles.trendSub} numberOfLines={1}>{item.ten_mon} · {item.dia_chi}</Text>
                    </View>
                    <Text style={[styles.trendClick, { color: colors.primary }]}>
                        🔥 {item.so_lan_click}
                    </Text>
                </View>
            ))}
        </View>
    );
}
