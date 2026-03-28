import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppMode } from '../contexts/AppModeContext';
import { useNavigation } from '@react-navigation/native';

interface OfflineGuardProps {
    children: React.ReactNode;
}

export const OfflineGuard: React.FC<OfflineGuardProps> = ({ children }) => {
    const { mode, isDataReady } = useAppMode();
    const navigation = useNavigation<any>();

    if (mode === 'online' && !isDataReady) {
        return (
            <View style={styles.container}>
                <View style={[styles.content, StyleSheet.absoluteFill, { zIndex: 10, backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                    <View style={styles.card}>
                        <Text style={styles.icon}>📶</Text>
                        <Text style={styles.title}>Tính năng Offline</Text>
                        <Text style={styles.desc}>
                            Bạn đang ở chế độ Online. Để sử dụng tính năng này không cần mạng, bạn cần tải xuống model AI và dữ liệu thành phố.
                        </Text>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => navigation.navigate('Welcome')}
                        >
                            <Text style={styles.buttonText}>Tải ngay</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {/* Still show the UI behind (blurred/disabled) as per user request "vẫn có thể chuyển qua xem" */}
                <View style={{ flex: 1, opacity: 0.3 }} pointerEvents="none">
                    {children}
                </View>
            </View>
        );
    }

    return <>{children}</>;
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    icon: { fontSize: 40, marginBottom: 15 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    desc: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
    button: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
