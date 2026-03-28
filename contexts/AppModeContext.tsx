// contexts/AppModeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isModelDownloaded } from '../services/model';
import { isCityPackDownloaded, getDownloadedPacks } from '../services/pack';

export type AppMode = 'online' | 'offline' | 'pending';

interface AppModeContextType {
    mode: AppMode;
    setAppMode: (mode: AppMode) => Promise<void>;
    isDataReady: boolean;
    refreshDataStatus: () => Promise<void>;
    isLoading: boolean; // Add this
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

const MODE_STORAGE_KEY = '@app_mode';

export const AppModeProvider = ({ children }: { children: ReactNode }) => {
    const [mode, setMode] = useState<AppMode>('pending');
    const [isDataReady, setIsDataReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Default true

    const refreshDataStatus = async () => {
        const modelReady = await isModelDownloaded();
        // Check if ANY city pack is downloaded
        const packs = await getDownloadedPacks();
        const cityReady = packs.length > 0;
        setIsDataReady(modelReady && cityReady);
    };

    useEffect(() => {
        const loadMode = async () => {
            try {
                const savedMode = await AsyncStorage.getItem(MODE_STORAGE_KEY);
                if (savedMode) {
                    setMode(savedMode as AppMode);
                }
                await refreshDataStatus();
            } finally {
                setIsLoading(false); // Done loading
            }
        };
        loadMode();
    }, []);

    const setAppMode = async (newMode: AppMode) => {
        console.log(`Setting app mode to: ${newMode}`);
        try {
            setMode(newMode);
            await AsyncStorage.setItem(MODE_STORAGE_KEY, newMode);
            console.log("AsyncStorage updated. Refreshing data status...");
            await refreshDataStatus();
            console.log("Data status refreshed.");
        } catch (e) {
            console.error("Error inside setAppMode:", e);
        }
    };

    return (
        <AppModeContext.Provider value={{ mode, setAppMode, isDataReady, refreshDataStatus, isLoading }}>
            {children}
        </AppModeContext.Provider>
    );
};

export const useAppMode = () => {
    const context = useContext(AppModeContext);
    if (!context) throw new Error('useAppMode must be used within an AppModeProvider');
    return context;
};
