/**
 * components/explore/PriceSection.tsx
 * Why: Section phân bố giá, tách từ OnlineHomeScreen theo SRP.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { PriceSectionProps } from '../../types/explore';
import { formatPrice } from '../../screens/styles/onlineHomeStyles';

export function PriceSection({ data, styles, colors }: PriceSectionProps) {
    if (!data) return null;
    const total = data.total || 1;
    const buckets = [
        { label: 'Bình dân', sub: 'Dưới 50k', count: data.under_50k, color: '#10b981', icon: '💚' },
        { label: 'Tầm trung', sub: '50–150k', count: data.mid_range, color: '#f59e0b', icon: '🧡' },
        { label: 'Cao cấp', sub: 'Trên 150k', count: data.premium, color: '#8b5cf6', icon: '💜' },
    ];
    return (
        <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.sectionIconBg, { backgroundColor: '#f1f5f9' }]}>
                        <Text style={{ fontSize: 20 }}>💰</Text>
                    </View>
                    <Text style={styles.sectionTitle}>Phân Bố Giá</Text>
                </View>
                <View style={[styles.pillTb, { backgroundColor: colors.primary + '22' }]}>
                    <Text style={[styles.pillTbText, { color: colors.primary }]}>TB: {formatPrice(Math.round(data.avg_price))}k</Text>
                </View>
            </View>
            <View style={styles.priceRow}>
                {buckets.map(b => (
                    <View key={b.label} style={[styles.priceBubble, { borderColor: b.color + '22', backgroundColor: colors.card }]}>
                        <Text style={{ fontSize: 24 }}>{b.icon}</Text>
                        <Text style={[styles.priceCount, { color: b.color }]}>{b.count}</Text>
                        <Text style={[styles.priceLabel, { color: colors.text }]}>{b.label}</Text>
                        <Text style={styles.priceSub}>{b.sub}</Text>
                        <View style={[styles.pricePctPill, { backgroundColor: b.color + '22' }]}>
                            <Text style={[styles.pricePct, { color: b.color }]}>{Math.round(b.count / total * 100)}%</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}
