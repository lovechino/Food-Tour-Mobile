/**
 * hooks/useChatMessages.ts
 * Why: Tách AI messaging pipeline khỏi ChatContext (SRP).
 * Chứa: sendMessage flow, ensureAIReady, switchCity.
 */
import { useState, useCallback } from 'react';
import { loadModel } from '../ai/model';
import { loadTokenizer } from '../ai/tokenizer';
import { useVectorStore } from './useVectorStore';
import { searchFoodsWithLogic } from '../ai/searchLogic';
import { generateResponse } from '../ai/responseGenerator';
import { saveMessage, updateSessionCity } from '../services/userDatabase';
import { Message } from '../contexts/ChatContext';
import { FoodItem } from '../services/cityApi';

interface Dependencies {
    currentCity: string;
    currentSessionId: string | null;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setCurrentCity: (city: string) => void;
}

export function useChatMessages(deps: Dependencies) {
    const { currentCity, currentSessionId, setMessages, setCurrentCity } = deps;
    const [isThinking, setIsThinking] = useState(false);
    const [latestBotMessageId, setLatestBotMessageId] = useState<string | null>(null);
    const [lastFoodResults, setLastFoodResults] = useState<FoodItem[]>([]);

    const ensureAIReady = async (): Promise<boolean> => {
        try {
            await Promise.all([loadModel(), loadTokenizer(), useVectorStore.getState().loadCity(currentCity)]);
            return true;
        } catch { return false; }
    };

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || !currentSessionId) return;

        const userMsg = buildUserMsg(text);
        setMessages(prev => [...prev, userMsg]);
        setIsThinking(true);
        await saveMessage({ id: userMsg.id, session_id: currentSessionId, sender: 'user', text: userMsg.text, timestamp: userMsg.timestamp });

        try {
            if (!await ensureAIReady()) throw new Error("Không thể tải mô hình AI.");

            const { foods, intent } = await searchFoodsWithLogic(text, currentCity, lastFoodResults);
            if (!intent.isFollowUp || foods.length > 0) setLastFoodResults(foods);

            const botMsgId = (Date.now() + 1).toString();
            const responseText = generateResponse(intent, foods, currentCity);
            const botMsg: Message = { id: botMsgId, text: responseText, sender: 'bot', foods, timestamp: Date.now() };

            setMessages(prev => [...prev, botMsg]);
            setLatestBotMessageId(botMsgId);
            await saveMessage({
                id: botMsgId, session_id: currentSessionId, sender: 'bot', text: botMsg.text,
                meta: foods.length > 0 ? JSON.stringify(foods) : undefined, timestamp: botMsg.timestamp,
            });
        } catch (e) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: `Lỗi: ${e instanceof Error ? e.message : String(e)}`,
                sender: 'bot', timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally { setIsThinking(false); }
    }, [currentSessionId, currentCity]);

    const switchCity = useCallback(async (city: string) => {
        if (city === currentCity) return;
        setCurrentCity(city);
        await useVectorStore.getState().loadCity(city);

        if (currentSessionId) {
            await updateSessionCity(currentSessionId, city);
            const sysMsg: Message = { id: Date.now().toString(), text: `Đã chuyển sang dữ liệu ${city}.`, sender: 'bot', timestamp: Date.now() };
            setMessages(prev => [...prev, sysMsg]);
            await saveMessage({ id: sysMsg.id, session_id: currentSessionId, sender: 'bot', text: sysMsg.text, timestamp: sysMsg.timestamp });
        }
    }, [currentSessionId, currentCity]);

    const resetLatestMessageId = () => setLatestBotMessageId(null);

    return { isThinking, latestBotMessageId, resetLatestMessageId, sendMessage, switchCity };
}

function buildUserMsg(text: string): Message {
    return { id: Date.now().toString(), text, sender: 'user', timestamp: Date.now() };
}
