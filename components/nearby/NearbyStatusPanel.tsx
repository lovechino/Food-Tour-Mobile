/**
 * components/nearby/NearbyStatusPanel.tsx
 * Why: Panel loading/error/radar states, tách từ AiNearbyScreen (SRP).
 */
import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ThemeColors } from '../../constants/colors';
import { AiSuggestResponse } from '../../services/cityApi';
import { GeoLocation } from '../../hooks/useGeolocation';

interface Props {
    isLoadingLocation: boolean;
    isAiLoading: boolean;
    errorMsg: string | null;
    aiData: AiSuggestResponse | null;
    location: GeoLocation | null;
    colors: ThemeColors;
    styles: Record<string, unknown>;
    onDismissError: () => void;
}

export function NearbyStatusPanel(props: Props) {
    const { isLoadingLocation, isAiLoading, errorMsg, aiData, location, colors, styles: s, onDismissError } = props;

    if (isLoadingLocation) {
        return (
            <View style={s.center as object}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={s.statusText as object}>Đang quét vệ tinh định vị bạn...</Text>
            </View>
        );
    }
    if (errorMsg) {
        return (
            <View style={s.center as object}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>📡</Text>
                <Text style={s.errorText as object}>{errorMsg}</Text>
                <TouchableOpacity style={s.retryBtn as object} onPress={onDismissError}>
                    <Text style={s.retryText as object}>Đã hiểu</Text>
                </TouchableOpacity>
            </View>
        );
    }
    if (isAiLoading) {
        return (
            <View style={s.center as object}>
                <View style={[s.radarCircle as object, { borderColor: colors.primary }]} />
                <Text style={s.statusText as object}>Đang tìm món ngon quanh tọa độ...</Text>
                {location && (
                    <Text style={s.subStatusText as object}>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</Text>
                )}
            </View>
        );
    }
    if (aiData?.reply) {
        return (
            <View style={s.successHeader as object}>
                <Text style={s.aiReplyText as object}>✨ {aiData.reply}</Text>
            </View>
        );
    }
    return null;
}
