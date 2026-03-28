/**
 * screens/OnlineHomeScreen.tsx
 * Màn hình Khám Phá – dữ liệu thực từ backend, cache theo ngày.
 * Why: Chỉ giữ orchestration + layout JSX, logic/styles/components đã tách.
 */
import React, { useState, useMemo } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    ActivityIndicator, StatusBar, RefreshControl, Modal,
    FlatList, Pressable, Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { OnlineGuard } from '../components/OnlineGuard';
import { useExploreData } from '../hooks/useExploreData';
import { useAuth } from '../contexts/AuthContext';
import { CITIES, createExploreStyles } from './styles/onlineHomeStyles';
import {
    CacheNote, AiSuggestSection, TopClicksSection,
    PriceSection, DistrictSection, TrendingSection, RandomSection,
} from '../components/explore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Notification {
    id: string; title: string; body: string; time: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    { id: '1', title: '✨ AI Tips hôm nay', body: 'Bạn đã thử Bún Chả vào buổi trưa chưa? Đang là xu hướng tại Hà Nội đấy!', time: 'Vừa xong' },
    { id: '2', title: '🚀 Cập nhật hệ thống', body: 'AI Food Tour hiện đã hỗ trợ thêm 2 mô hình AI dự phòng giúp bạn tìm quán mượt mà hơn.', time: '1 giờ trước' },
];

export default function OnlineHomeScreen({ navigation }: { navigation: NativeStackNavigationProp<Record<string, undefined>> }) {
    const { colors, theme } = useTheme();
    const styles = useMemo(() => createExploreStyles(colors), [colors]);
    const { city, data, loading, refreshing, error, load, onRefresh, onCityChange } = useExploreData();
    const { user, logout } = useAuth();

    const [cityPickerVisible, setCityPickerVisible] = useState(false);
    const [notifVisible, setNotifVisible] = useState(false);
    const [notifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

    const cityLabel = CITIES.find(c => c.key === city)?.label ?? city;

    const handleCityChange = (newCity: string) => {
        setCityPickerVisible(false);
        onCityChange(newCity);
    };

    return (
        <OnlineGuard>
            <View style={styles.container}>
                <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

                {/* ── Header ── */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.subtitle}>KHÁM PHÁ ẨM THỰC</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.title}>FoodTour <Text style={{ color: colors.primary }}>Online</Text> 🌐</Text>
                        </View>
                        {user && <Text style={styles.userNameText}>Chào, {user.name} 👋</Text>}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => setNotifVisible(true)}>
                            <Text style={{ fontSize: 18 }}>🔔</Text>
                            {notifications.length > 0 && <View style={styles.notifBadge} />}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('AiNearby')}>
                            <Text style={{ fontSize: 18 }}>📍</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => setCityPickerVisible(true)}>
                            <Text style={{ fontSize: 18 }}>🏢</Text>
                        </TouchableOpacity>
                        {user && (
                            <TouchableOpacity
                                style={[styles.iconBtn, { backgroundColor: colors.primary + '22' }]}
                                onPress={() => Alert.alert("Đăng xuất", "Bạn có muốn đăng xuất không?", [
                                    { text: "Huỷ", style: "cancel" },
                                    { text: "Đăng xuất", onPress: logout, style: "destructive" }
                                ])}
                            >
                                <Text style={{ fontSize: 18 }}>👤</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {data && <CacheNote fetchedAt={data.fetchedAt} styles={styles} colors={colors} />}

                {/* ── Notification Modal ── */}
                <Modal visible={notifVisible} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalSheet, { maxHeight: '70%' }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <Text style={styles.modalTitle}>Thông báo 🔔</Text>
                                <TouchableOpacity onPress={() => setNotifVisible(false)}>
                                    <Text style={{ color: colors.primary, fontWeight: '700' }}>Đóng</Text>
                                </TouchableOpacity>
                            </View>
                            {notifications.length > 0 ? (
                                <FlatList
                                    data={notifications}
                                    keyExtractor={item => item.id}
                                    renderItem={({ item }) => (
                                        <View style={styles.notifItem}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                <Text style={styles.notifTitle}>{item.title}</Text>
                                                <Text style={styles.notifTime}>{item.time}</Text>
                                            </View>
                                            <Text style={styles.notifBody}>{item.body}</Text>
                                        </View>
                                    )}
                                />
                            ) : (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <Text style={{ color: colors.textSecondary }}>Không có thông báo mới</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </Modal>

                {/* ── Content ── */}
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Đang tải dữ liệu…</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centered}>
                        <Text style={styles.errorEmoji}>🔌</Text>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={() => load(city)}>
                            <Text style={styles.retryText}>Thử lại</Text>
                        </TouchableOpacity>
                    </View>
                ) : data ? (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
                        <AiSuggestSection suggestData={data.aiSuggest} styles={styles} colors={colors} />
                        <TopClicksSection items={data.topClicks} styles={styles} colors={colors} />
                        <PriceSection data={data.priceRange} styles={styles} colors={colors} />
                        <DistrictSection items={data.districts.slice(0, 8)} styles={styles} colors={colors} />
                        <TrendingSection items={data.trending} styles={styles} colors={colors} />
                        <RandomSection items={data.random} onRefresh={onRefresh} styles={styles} colors={colors} />
                    </ScrollView>
                ) : null}

                {/* ── City Picker Modal ── */}
                <Modal visible={cityPickerVisible} transparent animationType="slide" onRequestClose={() => setCityPickerVisible(false)}>
                    <Pressable style={styles.modalOverlay} onPress={() => setCityPickerVisible(false)}>
                        <View style={styles.modalSheet}>
                            <Text style={styles.modalTitle}>Chọn thành phố</Text>
                            {CITIES.map(c => (
                                <TouchableOpacity key={c.key}
                                    style={[styles.cityOption, c.key === city && { backgroundColor: colors.primary + '22' }]}
                                    onPress={() => handleCityChange(c.key)}>
                                    <Text style={[styles.cityOptionText, c.key === city && { color: colors.primary, fontWeight: 'bold' }]}>
                                        {c.label}
                                    </Text>
                                    {c.key === city && <Text style={{ color: colors.primary }}>✓</Text>}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Pressable>
                </Modal>
            </View>
        </OnlineGuard>
    );
}
