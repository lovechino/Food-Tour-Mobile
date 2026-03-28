/**
 * contexts/ChatContext.tsx
 * Why: Thin Provider shell — gộp 2 custom hooks và expose single Context.
 * Mọi logic session + messaging đã tách ra hooks/ (SRP).
 */
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useChatSessions } from '../hooks/useChatSessions';
import { useChatMessages } from '../hooks/useChatMessages';
import { FoodItem } from '../services/cityApi';

// ── Published Types ──────────────────────────────────────────────────────────

export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    foods?: FoodItem[];
    timestamp: number;
}

export interface Session {
    id: string;
    title: string;
    city: string;
    created_at: number;
    updated_at: number;
}

interface ChatContextType {
    messages: Message[];
    isThinking: boolean;
    sendMessage: (text: string) => Promise<void>;
    latestBotMessageId: string | null;
    resetLatestMessageId: () => void;
    isChatActive: boolean;
    setChatActive: (active: boolean) => void;
    currentCity: string;
    switchCity: (city: string) => Promise<void>;
    sessions: Session[];
    currentSessionId: string | null;
    createNewSession: (cityOverride?: string) => Promise<void>;
    selectSession: (sessionId: string) => Promise<void>;
    deleteSession: (sessionId: string) => Promise<void>;
    prepareFreshSession: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────────────────────

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const sessionHook = useChatSessions();
    const msgHook = useChatMessages({
        currentCity: sessionHook.currentCity,
        currentSessionId: sessionHook.currentSessionId,
        messages: sessionHook.messages,
        setMessages: sessionHook.setMessages,
        setCurrentCity: sessionHook.setCurrentCity,
    });

    const [isChatActive, setChatActive] = React.useState(false);

    useEffect(() => { sessionHook.initSessions(); }, []);

    return (
        <ChatContext.Provider value={{
            messages: sessionHook.messages,
            isThinking: msgHook.isThinking,
            sendMessage: msgHook.sendMessage,
            latestBotMessageId: msgHook.latestBotMessageId,
            resetLatestMessageId: msgHook.resetLatestMessageId,
            isChatActive, setChatActive,
            currentCity: sessionHook.currentCity,
            switchCity: msgHook.switchCity,
            sessions: sessionHook.sessions,
            currentSessionId: sessionHook.currentSessionId,
            createNewSession: sessionHook.createNewSession,
            selectSession: sessionHook.selectSession,
            deleteSession: sessionHook.deleteSession,
            prepareFreshSession: sessionHook.prepareFreshSession,
        }}>
            {children}
        </ChatContext.Provider>
    );
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error('useChat must be used within a ChatProvider');
    return context;
};
