import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    ScrollView
} from 'react-native';
import { OnlineGuard } from '../components/OnlineGuard';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeColors } from '../constants/colors';
import { chatApi } from '../services/chatApi';
import { FoodItem } from '../services/cityApi';
import { useRequireAuth } from '../hooks/useRequireAuth';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    foods?: FoodItem[];
    modelUsed?: string;
}

export default function OnlineChatScreen() {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: 'Chào bạn! Mình là AI Online. Bạn muốn tìm món gì hôm nay?', sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    const { colors, theme } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { guard } = useRequireAuth();

    const QUICK_ACTIONS = [
        { id: '1', label: '🍜 Món sáng ngon', query: 'Tìm món ăn sáng ngon ở đây' },
        { id: '2', label: '☕ Cafe chill', query: 'Tìm quán cafe vibe đẹp' },
        { id: '3', label: '🍨 Tráng miệng', query: 'Tìm quán quà vặt tráng miệng' },
        { id: '4', label: '🍱 Cơm văn phòng', query: 'Gợi ý quán cơm trưa' },
    ];

    const handleSend = (textOverride?: string) => {
        const query = textOverride || input;
        if (!query.trim()) return;

        // Guest user → hiện modal đăng nhập, không gọi API
        guard(() => sendChatMessage(query), 'chat');
    };

    const sendChatMessage = (query: string) => {

        const userMsg: Message = { id: Date.now().toString(), text: query, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        chatApi.sendMessage(query, 'ha_noi')
            .then(data => {
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: data.reply || data.error || "Không nhận được phản hồi.",
                    sender: 'bot',
                    foods: data.results,
                    modelUsed: data.model_used
                };
                setMessages(prev => [...prev, botMsg]);
            })
            .catch(err => {
                setMessages(prev => [...prev, { id: Date.now().toString(), text: "Lỗi kết nối server.", sender: 'bot' }]);
            })
            .finally(() => setIsThinking(false));
    };

    const renderFoodItem = (item: FoodItem) => (
        <View key={item.id} style={styles.foodCard}>
            <View style={styles.foodImagePlaceholder}>
                <Text style={{ fontSize: 30 }}>🍜</Text>
            </View>
            <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{item.ten_quan}</Text>
                <Text style={styles.foodSubTitle}>{item.ten_mon}</Text>
                <Text style={styles.foodDesc} numberOfLines={2}>{item.dia_chi}</Text>
                <Text style={styles.foodPrice}>
                    {item.gia_min ? `${item.gia_min.toLocaleString()}đ` : '??'} - {item.gia_max ? `${item.gia_max.toLocaleString()}đ` : '??'}
                </Text>
            </View>
        </View>
    );

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
                    <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextBot]}>{item.text}</Text>
                    {item.foods && item.foods.length > 0 && (
                        <View style={styles.foodList}>
                            {item.foods.map((food) => renderFoodItem(food))}
                        </View>
                    )}
                    {!isUser && (item.modelUsed === 'semantic-cache' || item.modelUsed === 'gemini-2.0-flash') && (
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>
                                {item.modelUsed === 'semantic-cache' ? '⚡ Phản hồi nhanh từ Cache' : '🔍 Dữ liệu thực tế từ Google Search'}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderHeader = () => (
        <View style={styles.welcomeContainer}>
            <View style={styles.botAvatar}>
                <Text style={{ fontSize: 40 }}>🤖</Text>
                <View style={styles.statusDot} />
            </View>
            <Text style={styles.welcomeTitle}>AI Online Assistant</Text>
            <Text style={styles.welcomeSub}>Bạn cần tìm quán ăn hay món ngon nào? Mình có thể tra cứu thông tin thực tế cho bạn.</Text>
            
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.actionsScroll}
                contentContainerStyle={{ paddingHorizontal: 20 }}
            >
                {QUICK_ACTIONS.map(action => (
                    <TouchableOpacity 
                        key={action.id} 
                        style={styles.actionChip}
                        onPress={() => handleSend(action.query)}
                    >
                        <Text style={styles.actionChipText}>{action.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <OnlineGuard>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} backgroundColor={colors.background} />
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerSubtitle}>TRỢ LÝ ỔN ĐỊNH</Text>
                        <Text style={styles.headerTitle}>AI Online</Text>
                    </View>
                    <View style={styles.onlineStatus}>
                        <View style={[styles.statusIndicator, { backgroundColor: '#10b981' }]} />
                        <Text style={styles.statusIndicatorText}>Trực tuyến</Text>
                    </View>
                </View>

                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.chatContent}
                    ListHeaderComponent={renderHeader}
                />

                {isThinking && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.loadingText}>AI đang tra cứu...</Text>
                    </View>
                )}

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Hỏi AI Online..."
                                value={input}
                                onChangeText={setInput}
                                onSubmitEditing={() => handleSend()}
                                placeholderTextColor={colors.textSecondary}
                            />
                            <TouchableOpacity onPress={() => handleSend()} style={styles.sendButton}>
                                <Text style={styles.sendIcon}>🚀</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </OnlineGuard>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 48, paddingBottom: 16,
        backgroundColor: colors.background,
    },
    headerSubtitle: { fontSize: 13, color: colors.textSecondary, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
    headerTitle: { fontSize: 26, fontWeight: '900', color: colors.text, marginTop: 4 },
    onlineStatus: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b98115', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusIndicator: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusIndicatorText: { fontSize: 11, color: '#10b981', fontWeight: 'bold' },

    welcomeContainer: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 },
    botAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.primary + '22', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4 },
    statusDot: { position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10b981', borderWidth: 2, borderColor: colors.card },
    welcomeTitle: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: 8 },
    welcomeSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20, marginBottom: 24 },
    actionsScroll: { marginVertical: 10, width: '100%' },
    actionChip: { backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: colors.primary + '22', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 },
    actionChipText: { fontSize: 13, fontWeight: '700', color: colors.text },

    chatContent: { paddingBottom: 20 },
    msgRow: { flexDirection: 'row', marginBottom: 16, paddingHorizontal: 16 },
    msgRowUser: { justifyContent: 'flex-end' },
    msgRowBot: { justifyContent: 'flex-start' },
    bubble: { maxWidth: '85%', padding: 16, borderRadius: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
    bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    bubbleBot: { backgroundColor: colors.card, borderTopLeftRadius: 4, borderWidth: 1, borderColor: colors.primary + '11' },
    msgText: { fontSize: 15, lineHeight: 22 },
    msgTextUser: { color: 'white', fontWeight: '500' },
    msgTextBot: { color: colors.text },
    
    foodList: { marginTop: 12, gap: 10 },
    foodCard: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: 16,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    foodImagePlaceholder: {
        width: 70, height: 70, borderRadius: 12,
        backgroundColor: colors.input, alignItems: 'center', justifyContent: 'center',
        marginRight: 10,
    },
    foodInfo: { flex: 1, justifyContent: 'center' },
    foodName: { fontWeight: '800', fontSize: 14, color: colors.text },
    foodSubTitle: { fontWeight: '600', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    foodDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    foodPrice: { fontSize: 12, color: colors.primary, fontWeight: '800', marginTop: 4 },
    badgeContainer: {
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    badgeText: {
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },

    loadingContainer: { flexDirection: 'row', alignItems: 'center', paddingBottom: 15, justifyContent: 'center' },
    loadingText: { marginLeft: 8, color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    inputContainer: {
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 20 : 16,
        paddingTop: 8,
        backgroundColor: colors.background,
    },
    inputWrapper: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 28,
        paddingHorizontal: 16,
        paddingVertical: 4,
        alignItems: 'center',
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5,
        borderWidth: 1,
        borderColor: colors.primary + '11'
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 15,
        color: colors.text,
    },
    sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
    sendIcon: { fontSize: 18 },
});
