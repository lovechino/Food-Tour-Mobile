import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useChat } from '../contexts/ChatContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const GlobalToast = () => {
    const { latestBotMessageId, isChatActive, resetLatestMessageId } = useChat();
    const [visible, setVisible] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (latestBotMessageId && !isChatActive) {
            showToast();
            resetLatestMessageId(); // Reset so it doesn't trigger again for same msg
        }
    }, [latestBotMessageId, isChatActive]);

    const showToast = () => {
        setVisible(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setTimeout(() => {
                hideToast();
            }, 3000);
        });
    };

    const hideToast = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
        });
    };

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim, top: insets.top + 10 }]}>
            <View style={styles.content}>
                <Text style={styles.icon}>🤖</Text>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>AI Thổ Địa</Text>
                    <Text style={styles.message}>Mình vừa trả lời câu hỏi của bạn!</Text>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 20,
        right: 20,
        backgroundColor: '#333',
        borderRadius: 12,
        zIndex: 9999,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    content: {
        flexDirection: 'row',
        padding: 15,
        alignItems: 'center',
    },
    icon: {
        fontSize: 24,
        marginRight: 10,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    message: {
        color: '#ddd',
        fontSize: 12,
    },
});
