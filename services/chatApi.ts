/**
 * services/chatApi.ts
 * Chat API — sử dụng centralized apiClient (401 queue pattern).
 * Không gọi fetch trực tiếp nữa.
 */
import { apiPost } from './apiClient';
import { FoodItem } from './cityApi';

export interface ChatResponse {
  reply?: string;
  error?: string;
  model_used?: string;
  query_type?: string;
  results?: FoodItem[];
}

export const chatApi = {
  async sendMessage(
    message: string,
    city: string = 'ha_noi',
  ): Promise<ChatResponse> {
    return apiPost<ChatResponse>('/chat', { message, city });
  },
};
