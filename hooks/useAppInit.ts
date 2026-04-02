/**
 * hooks/useAppInit.ts
 * Extracts FCM push notification initialization from App.tsx.
 * Handles permission, token registration, and message listeners.
 */
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { initPushNotifications } from '../services/pushService';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

export function useAppInit() {
    const unsubscribeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        initPushNotifications({
            topics: 'all',
            onMessage: (msg: FirebaseMessagingTypes.RemoteMessage) => {
                const { title, body } = msg.notification ?? {};
                console.log('[useAppInit] Foreground notification:', title, body);
                if (title && body) {
                    Alert.alert(title, body);
                }
            },
            onOpen: (msg: FirebaseMessagingTypes.RemoteMessage) => {
                console.log('[useAppInit] Notification opened:', msg.data);
            },
        }).then(({ unsubscribe }) => {
            unsubscribeRef.current = unsubscribe;
        });

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, []);
}
