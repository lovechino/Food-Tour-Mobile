/**
 * components/explore/DistrictSection.tsx
 * Why: Bar chart quận/huyện, tách từ OnlineHomeScreen theo SRP.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { DistrictSectionProps } from '../../types/explore';
import { SectionHeader } from './SectionHeader';

export function DistrictSection({ items, styles, colors }: DistrictSectionProps) {
    if (!items.length) return null;
    const max = items[0]?.total || 1;
    return (
        <View style={styles.section}>
            <SectionHeader title="Quận / Huyện" icon="🗺️" iconColor="#3b82f6" styles={styles} />
            {items.map((d, i) => (
                <View key={d.quan + i} style={styles.districtRow}>
                    <Text style={styles.districtName} numberOfLines={1}>{d.quan}</Text>
                    <View style={styles.barTrack}>
                        <View style={[
                            styles.barFill,
                            { width: `${Math.round(d.total / max * 100)}%`, backgroundColor: colors.primary }
                        ]} />
                    </View>
                    <Text style={styles.districtCount}>{d.total}</Text>
                </View>
            ))}
        </View>
    );
}
