/**
 * components/explore/SectionHeader.tsx
 * Why: Component tái sử dụng cho tiêu đề mỗi section trong Explore.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { ExploreStyles } from '../../types/explore';

interface Props {
    title: string;
    icon: string;
    iconColor: string;
    styles: ExploreStyles;
}

export function SectionHeader({ title, icon, iconColor, styles }: Props) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={[styles.sectionIconBg, { backgroundColor: iconColor + '22' }]}>
                <Text style={{ fontSize: 20 }}>{icon}</Text>
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );
}
