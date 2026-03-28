/**
 * hooks/useChatSessions.ts
 * Why: Tách session CRUD (create/select/delete) khỏi ChatContext (SRP).
 * Context chỉ nên là "Provider shell", logic nặng nằm ở hooks.
 */
import { useState } from 'react';
import { ToastAndroid } from 'react-native';
import { Message, Session } from '../contexts/ChatContext';
import { initUserDB, createSession, getSessions, saveMessage, getMessages, deleteSession as deleteSessionDB } from '../services/userDatabase';
import { getDownloadedPacks } from '../services/pack';
import { getCityConfig } from '../services/cityConfig';

export function useChatSessions() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [currentCity, setCurrentCity] = useState('');

    /** Why: Gọi 1 lần khi mount → init DB, load sessions, chọn session hợp lệ */
    const initSessions = async () => {
        try {
            const [, packs] = await Promise.all([initUserDB(), getDownloadedPacks()]);
            const loaded = await getSessions();
            setSessions(loaded);

            const validSession = loaded.find(s => packs.includes(s.city));
            if (validSession) {
                await loadSessionData(validSession);
            } else {
                const initialCity = pickInitialCity(packs);
                setCurrentCity(initialCity);
                showCityToast(initialCity);
                await createNewSession(initialCity);
            }
        } catch {
            setCurrentCity('ho_chi_minh');
        }
    };

    const loadSessionData = async (session: Session) => {
        setCurrentSessionId(session.id);
        setCurrentCity(session.city);
        const msgs = await getMessages(session.id);
        setMessages(parseMessages(msgs));
    };

    const createNewSession = async (cityOverride?: string) => {
        try {
            const cityToUse = cityOverride || currentCity;
            const newSession = await createSession(cityToUse, "Đoạn chat mới");
            setSessions(prev => [newSession, ...prev]);
            setCurrentSessionId(newSession.id);
            setCurrentCity(newSession.city);

            const greeting = buildGreeting(newSession.city);
            setMessages([greeting]);
            await saveMessage({
                id: greeting.id, session_id: newSession.id,
                sender: 'bot', text: greeting.text, timestamp: greeting.timestamp
            });
        } catch (e) { console.error("Error creating session:", e); }
    };

    const selectSession = async (sessionId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;
        setCurrentSessionId(sessionId);
        setCurrentCity(session.city);
        const msgs = await getMessages(sessionId);
        setMessages(parseMessages(msgs));
    };

    const deleteSession = async (sessionId: string) => {
        await deleteSessionDB(sessionId);
        const remaining = sessions.filter(s => s.id !== sessionId);
        setSessions(remaining);
        if (sessionId === currentSessionId) {
            remaining.length > 0 ? await selectSession(remaining[0].id) : await createNewSession();
        }
    };

    const prepareFreshSession = async () => {
        if (!currentSessionId) { await createNewSession(); return; }
        const hasUserMessage = messages.some(m => m.sender === 'user');
        if (hasUserMessage) await createNewSession();
    };

    return {
        messages, setMessages, sessions, currentSessionId, currentCity, setCurrentCity,
        initSessions, createNewSession, selectSession, deleteSession, prepareFreshSession,
    };
}

/** Why: Chọn city ban đầu — random nếu có nhiều packs */
function pickInitialCity(packs: string[]): string {
    if (!packs.length) return 'ho_chi_minh';
    if (packs.length === 1) return packs[0];
    return packs[Math.floor(Math.random() * packs.length)];
}

function showCityToast(city: string) {
    const name = getCityConfig(city)?.name || city;
    ToastAndroid.show(`Đang ở ${name}`, ToastAndroid.SHORT);
}

function buildGreeting(city: string): Message {
    const name = getCityConfig(city)?.name || city;
    return {
        id: Date.now().toString(),
        text: `Chào bạn! Mình là AI thổ địa ${name}. Bạn muốn tìm món gì?`,
        sender: 'bot', timestamp: Date.now(),
    };
}

function parseMessages(msgs: { id: string; text: string; sender: string; timestamp: number; meta?: string }[]): Message[] {
    return msgs.map(m => ({
        id: m.id, text: m.text,
        sender: m.sender as 'user' | 'bot',
        timestamp: m.timestamp,
        foods: m.meta ? JSON.parse(m.meta) : undefined,
    }));
}
