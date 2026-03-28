import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Alert, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useChat } from '../contexts/ChatContext';
import { getDownloadedPacks } from '../services/pack';
import { getCityConfig, getCityList, CITY_PACKS } from '../services/cityConfig';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeColors } from '../constants/colors';

export const CitySwitcher = () => {
    const { currentCity, switchCity, isThinking } = useChat();
    const navigation = useNavigation<any>();
    const [modalVisible, setModalVisible] = useState(false);
    const [downloadedCities, setDownloadedCities] = useState<string[]>([]);

    // Theme Hook
    const { colors, theme, toggleTheme } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    // Load available cities (all + download status)
    useEffect(() => {
        if (modalVisible) {
            checkDownloads();
        }
    }, [modalVisible]);

    const checkDownloads = async () => {
        const packs = await getDownloadedPacks();
        setDownloadedCities(packs);
    };

    const handleSelect = (cityId: string) => {
        setModalVisible(false);

        if (downloadedCities.includes(cityId)) {
            if (cityId !== currentCity) {
                switchCity(cityId);
            }
        } else {
            Alert.alert(
                "Chưa có dữ liệu",
                `Bạn cần tải dữ liệu cho ${CITY_PACKS[cityId].name} để sử dụng.`,
                [
                    { text: "Hủy", style: "cancel" },
                    {
                        text: "Tải ngay",
                        onPress: () => navigation.navigate('Data')
                    }
                ]
            );
        }
    };

    const cityName = getCityConfig(currentCity)?.name || currentCity || '...';
    const allCities = getCityList();

    // Custom Header Button Component
    const HeaderButton = () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setModalVisible(true)}
                disabled={isThinking}
                activeOpacity={0.7}
            >
                <View style={styles.iconContainer}>
                    <Text style={{ fontSize: 14 }}>📍</Text>
                </View>
                <Text style={styles.headerText}>
                    {cityName}
                </Text>
                <Text style={{ fontSize: 10, color: colors.textSecondary, marginLeft: 6 }}>▼</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.headerButton, { marginLeft: 8, paddingHorizontal: 8 }]}
                onPress={toggleTheme}
                activeOpacity={0.7}
            >
                <Text style={{ fontSize: 16 }}>{theme === 'dark' ? '🌙' : '☀️'}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View>
            <HeaderButton />

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Chọn địa điểm 🗺️</Text>
                        <FlatList
                            data={allCities}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ paddingVertical: 8 }}
                            renderItem={({ item }) => {
                                const isSelected = item.id === currentCity;
                                const isDownloaded = downloadedCities.includes(item.id);

                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.cityItem,
                                            isSelected && styles.selectedItem
                                        ]}
                                        onPress={() => handleSelect(item.id)}
                                    >
                                        <View>
                                            <Text style={[styles.cityText, isSelected && styles.selectedText]}>
                                                {item.name}
                                            </Text>
                                            {!isDownloaded && (
                                                <Text style={styles.notDownloadedText}>Chưa tải dữ liệu ⬇️</Text>
                                            )}
                                        </View>

                                        {isSelected && <Text style={styles.checkMark}>✓</Text>}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    headerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: colors.border || 'rgba(255,255,255,0.1)',
    },
    iconContainer: {
        marginRight: 6
    },
    headerText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: colors.background,
        borderRadius: 24,
        padding: 24,
        maxHeight: '60%',
        borderWidth: 1,
        borderColor: colors.card,
        elevation: 10,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 20,
        textAlign: 'center',
        color: colors.text,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    cityItem: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: colors.card,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    selectedItem: {
        backgroundColor: 'rgba(3, 218, 198, 0.15)', // Tint of secondary
        borderColor: colors.secondary,
        borderWidth: 1
    },
    cityText: {
        fontSize: 16,
        color: colors.textSecondary,
        fontWeight: '600'
    },
    selectedText: {
        color: colors.secondary,
        fontWeight: 'bold',
    },
    notDownloadedText: {
        fontSize: 12,
        color: colors.accent,
        marginTop: 4,
        fontStyle: 'italic'
    },
    checkMark: {
        color: colors.secondary,
        fontWeight: 'bold',
        fontSize: 18
    }
});
