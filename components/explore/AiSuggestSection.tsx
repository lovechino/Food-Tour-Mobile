/**
 * components/explore/AiSuggestSection.tsx
 * Why: Section hiển thị gợi ý AI, tách từ OnlineHomeScreen theo SRP.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { AiSuggestSectionProps } from '../../types/explore';
import { SectionHeader } from './SectionHeader';

export function AiSuggestSection({ suggestData, styles, colors }: AiSuggestSectionProps) {
    if (!suggestData) return null;
    return (
        <View style={styles.section}>
            <SectionHeader title="AI Gợi Ý" icon="✨" iconColor={colors.primary} styles={styles} />
            <View style={[styles.suggestCard, { backgroundColor: colors.cardSuggest, borderColor: colors.primary + '22' }]}>
                <Text style={[styles.suggestText, { color: colors.primary }]}>{suggestData.reply}</Text>
                {suggestData.results?.map((item, index) => (
                    <View key={item.id} style={[styles.suggestItemCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.suggestItemName, { color: colors.text }]}>{index + 1}. {item.ten_quan}</Text>
                        <Text style={[styles.suggestItemAddr, { color: colors.textSecondary }]}>{item.ten_mon} - {item.dia_chi}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}
