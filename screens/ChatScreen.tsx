// screens/ChatScreen.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Modal,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat, Message, Session } from '../contexts/ChatContext';
import { TypewriterText } from '../components/TypewriterText';
import { useIsFocused } from '@react-navigation/native';
import { CitySwitcher } from '../components/CitySwitcher';
import { OfflineGuard } from '../components/OfflineGuard';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeColors } from '../constants/colors';

export default function ChatScreen() {
  const { messages, isThinking, sendMessage, setChatActive, sessions, createNewSession, selectSession, currentSessionId, deleteSession, prepareFreshSession } = useChat();
  const [input, setInput] = useState('');
  const [historyVisible, setHistoryVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const isFocused = useIsFocused();

  const { colors, theme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Set active state for Toast logic
  useEffect(() => {
    setChatActive(isFocused);

    // Auto-prepare fresh session on focus
    if (isFocused && !isThinking) {
      prepareFreshSession();
    }

    return () => setChatActive(false);
  }, [isFocused]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleNewChat = () => {
    createNewSession();
    setHistoryVisible(false);
  };

  const handleSelectSession = (sessionId: string) => {
    selectSession(sessionId);
    setHistoryVisible(false);
  };

  const renderFoodItem = (item: any) => (
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

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.sender === 'user';
    const isLastMessage = index === messages.length - 1;
    const shouldAnimate = !isUser && isLastMessage;

    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
        {!isUser && <View style={styles.botAvatar}><Text>🤖</Text></View>}

        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          {shouldAnimate ? (
            <TypewriterText
              style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextBot]}
              text={item.text}
              speed={20}
            />
          ) : (
            <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextBot]}>
              {item.text}
            </Text>
          )}

          {item.foods && item.foods.length > 0 && (
            <View style={styles.foodList}>
              {item.foods.map((food) => renderFoodItem(food))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert(
      "Xóa đoạn chat?",
      "Bạn có chắc muốn xóa cuộc trò chuyện này không? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: 'destructive',
          onPress: () => deleteSession(sessionId)
        }
      ]
    );
  };

  const renderSessionItem = ({ item }: { item: Session }) => (
    <View style={[styles.sessionItem, item.id === currentSessionId && styles.activeSession]}>
      <TouchableOpacity
        style={styles.sessionContent}
        onPress={() => handleSelectSession(item.id)}
      >
        <View style={styles.sessionIcon}><Text>💬</Text></View>
        <View style={styles.sessionInfo}>
          <Text style={[styles.sessionTitle, item.id === currentSessionId && styles.activeSessionText]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.sessionDate}>
            {new Date(item.updated_at || item.created_at).toLocaleDateString('vi-VN')} • {item.city}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDeleteSession(item.id)}
      >
        <Text style={{ fontSize: 14 }}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isThinking]);

  return (
    <OfflineGuard>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} backgroundColor={colors.background} />

        {/* ... existing header logic ... */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.historyBtn} onPress={() => setHistoryVisible(true)}>
            <Text style={{ fontSize: 20 }}>📜</Text>
          </TouchableOpacity>
          <CitySwitcher />
          <TouchableOpacity style={styles.newChatBtn} onPress={handleNewChat}>
            <Text style={{ fontSize: 20 }}>➕</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
        />

        {isThinking && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>AI đang suy nghĩ...</Text>
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Bạn muốn ăn gì? (vd: Bún đậu mắm tôm...)"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendButton} disabled={isThinking}>
              <Text style={styles.sendButtonText}>Gửi</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* History Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={historyVisible}
          onRequestClose={() => setHistoryVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setHistoryVisible(false)}
          >
            <View style={styles.historyContainer}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Lịch sử Chat</Text>
                <TouchableOpacity onPress={handleNewChat} style={styles.newChatBtnModal}>
                  <Text style={styles.newChatText}>+ Cuộc trò chuyện mới</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={sessions}
                keyExtractor={(item) => item.id}
                renderItem={renderSessionItem}
                contentContainerStyle={styles.sessionList}
                ListEmptyComponent={<Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào.</Text>}
              />
            </View>
          </TouchableOpacity>
        </Modal>

      </SafeAreaView>
    </OfflineGuard>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: 15,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  historyBtn: { padding: 5 },
  newChatBtn: { padding: 5 },

  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },

  chatContent: { padding: 15, paddingBottom: 30 },

  msgRow: { flexDirection: 'row', marginBottom: 15 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },

  botAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.border || '#ddd', alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },

  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleBot: { backgroundColor: colors.card, borderTopLeftRadius: 4, borderWidth: 1, borderColor: colors.border || '#e5e5e5' },

  msgText: { fontSize: 16, lineHeight: 22 },
  msgTextUser: { color: colors.background }, // Usually white on primary
  msgTextBot: { color: colors.text },

  // Food card styles
  foodList: { marginTop: 10, gap: 10 },
  foodCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border || '#eee',
  },
  foodImagePlaceholder: {
    width: 60, height: 60, borderRadius: 6,
    backgroundColor: colors.border || '#e1e1e1', alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  foodInfo: { flex: 1, justifyContent: 'center' },
  foodName: { fontWeight: 'bold', fontSize: 14, color: colors.text },
  foodSubTitle: { fontWeight: '600', fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  foodDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  foodPrice: { fontSize: 12, color: colors.primary, fontWeight: 'bold', marginTop: 4 },

  loadingContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, alignSelf: 'center' },
  loadingText: { marginLeft: 8, color: colors.textSecondary, fontSize: 13 },

  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: colors.card, // Input area slightly distinguished from bg
    borderTopWidth: 1,
    borderTopColor: colors.border || '#eee',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.input || '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: colors.text,
  },
  sendButton: { marginLeft: 10, padding: 10 },
  sendButtonText: { color: colors.primary, fontWeight: 'bold', fontSize: 16 },

  // History Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  historyContainer: {
    backgroundColor: colors.background,
    height: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  historyTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  newChatBtnModal: {
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newChatText: { color: colors.background, fontWeight: 'bold', fontSize: 14 },
  sessionList: { paddingBottom: 20 },
  sessionItem: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  sessionContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center'
  },
  deleteBtn: {
    padding: 15,
    borderLeftWidth: 1,
    borderLeftColor: colors.border || '#eee',
    justifyContent: 'center',
    alignItems: 'center'
  },
  activeSession: {
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  sessionIcon: { marginRight: 15 },
  sessionInfo: { flex: 1 },
  sessionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  activeSessionText: { color: colors.primary },
  sessionDate: { fontSize: 12, color: colors.textSecondary },
  emptyText: { textAlign: 'center', marginTop: 20, color: colors.textSecondary },
});
