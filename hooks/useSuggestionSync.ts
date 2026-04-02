/**
 * hooks/useSuggestionSync.ts
 * Extracts suggestion queue sync logic from App.tsx.
 * Syncs pending suggestions on app foreground via AppState listener.
 */
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { syncPendingSuggestions } from '../services/suggestionQueue';
import { getStoredAuth } from '../services/authService';

export function useSuggestionSync() {
    useEffect(() => {
        const runSync = async () => {
            try {
                const { token } = await getStoredAuth();
                if (token) {
                    await syncPendingSuggestions(token);
                }
            } catch (e) {
                console.warn('[useSuggestionSync] Sync failed:', e);
            }
        };

        // Sync on mount
        runSync();

        // Sync on foreground
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') runSync();
        });

        return () => subscription.remove();
    }, []);
}
