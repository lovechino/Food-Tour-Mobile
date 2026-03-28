/**
 * components/explore/CacheNote.tsx
 * Why: Hiển thị thời gian dữ liệu cache, tách nhỏ từ OnlineHomeScreen.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { CacheNoteProps } from '../../types/explore';

export function CacheNote({ fetchedAt, styles }: CacheNoteProps) {
    const date = new Date(fetchedAt);
    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return (
        <View style={styles.cacheNoteContainer}>
            <Text style={styles.cacheNote}>
                📦 Dữ liệu hôm nay · Cập nhật lúc {timeStr} · Kéo xuống để làm mới
            </Text>
        </View>
    );
}
