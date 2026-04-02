/**
 * services/suggestionApi.ts
 * API client for batch suggestion submission.
 * Uses direct fetch (not apiClient) because this is background sync,
 * no 401 queue needed — if token expired, sync will fail gracefully.
 */
import { API_BASE_URL } from '../constants/api';

interface BatchSuggestionPayload {
    suggestions: {
        client_idempotency_key: string;
        ten_quan: string;
        ten_mon?: string;
        dia_chi: string;
        thanh_pho: string;
        latitude?: number;
        longitude?: number;
        raw_ai_data?: Record<string, unknown>;
        client_created_at: string;
    }[];
}

interface BatchSuggestionResponse {
    status: string;
    accepted_count: number;
    duplicate_count: number;
    message: string;
}

export async function submitBatchSuggestions(
    authToken: string,
    payload: BatchSuggestionPayload,
): Promise<{ status: number; data?: BatchSuggestionResponse }> {
    const url = `${API_BASE_URL}/api/v1/food/suggestions/batch`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 202 || response.status === 200) {
        const data = await response.json() as BatchSuggestionResponse;
        return { status: response.status, data };
    }

    return { status: response.status };
}
