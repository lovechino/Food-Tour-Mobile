/**
 * components/explore/TopClicksSection.tsx
 * Why: Horizontal card list cho top clicks, tách từ OnlineHomeScreen (SRP).
 */
import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { TopClicksSectionProps } from '../../types/explore';
import { SectionHeader } from './SectionHeader';
import { formatPrice } from '../../screens/styles/onlineHomeStyles';

export function TopClicksSection({ items, styles, colors }: TopClicksSectionProps) {
    if (!items.length) return null;
    return (
        <View style={styles.section}>
            <SectionHeader title="Top Click Nhiều Nhất" icon="🔥" iconColor="#ef4444" styles={styles} />
            <FlatList
                data={items}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={i => String(i.id)}
                renderItem={({ item }) => (
                    <View style={[styles.hCard, { borderColor: colors.border }]}>
                        <View style={styles.rankBadge}>
                            <Text style={styles.rankText}>#{item.rank}</Text>
                        </View>
                        <Text style={styles.hCardName} numberOfLines={2}>{item.ten_quan}</Text>
                        <Text style={styles.hCardSub} numberOfLines={1}>{item.ten_mon}</Text>
                        <Text style={styles.hCardClick}>👆 {item.so_lan_click} lượt</Text>
                        <Text style={styles.hCardPrice}>
                            {formatPrice(item.gia_min)}–{formatPrice(item.gia_max)}k
                        </Text>
                    </View>
                )}
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                contentContainerStyle={{ paddingBottom: 4 }}
            />
        </View>
    );
}
