import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { useTheme } from '../contexts/ThemeContext';

interface OnlineGuardProps {
    children: React.ReactNode;
    onRetry?: () => void;
}

export const OnlineGuard: React.FC<OnlineGuardProps> = ({ children, onRetry }) => {
    const netInfo = useNetInfo();
    const { colors } = useTheme();
    const [isRetrying, setIsRetrying] = useState(false);

    // Optional: Manual retry handler if needed, though useNetInfo updates automatically
    const handleRetry = () => {
        setIsRetrying(true);
        // NetInfo usually updates auto, but we can force a fetch
        NetInfo.fetch().then(() => {
            setTimeout(() => setIsRetrying(false), 500); // Fake delay for UX
            if (onRetry) onRetry();
        });
    };

    // If connected or initial state is null (unknown), show content? 
    // Usually we want to block if explicitly false.
    // netInfo.isConnected can be null initially.
    if (netInfo.isConnected === false) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={styles.icon}>📶</Text>
                    <Text style={[styles.title, { color: colors.text }]}>Không có kết nối Internet</Text>
                    <Text style={[styles.desc, { color: colors.textSecondary }]}>
                        Tính năng này yêu cầu kết nối mạng để hoạt động. Vui lòng kiểm tra lại đường truyền.
                    </Text>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={handleRetry}
                        disabled={isRetrying}
                    >
                        {isRetrying ? (
                            <ActivityIndicator color={colors.background} size="small" />
                        ) : (
                            <Text style={[styles.buttonText, { color: colors.background }]}>Thử lại</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return <>{children}</>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 340,
        padding: 30,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    icon: { fontSize: 48, marginBottom: 16 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
    desc: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    button: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
        minWidth: 120,
        alignItems: 'center',
    },
    buttonText: { fontWeight: 'bold', fontSize: 16 }
});
