import { API_BASE_URL } from '../constants/api';
import { FoodItem } from './cityApi';
import { getAuthHeader } from './authService';

export interface ChatResponse {
    reply?: string;
    error?: string;
    model_used?: string;
    query_type?: string;
    results?: FoodItem[];
}

export const chatApi = {
    async sendMessage(message: string, city: string = 'ha_noi'): Promise<ChatResponse> {
        try {
            const authHeader = await getAuthHeader();
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...authHeader 
                },
                body: JSON.stringify({ message, city })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("chatApi error:", error);
            throw error;
        }
    }
};
