/**
 * services/suggestionQueue.ts
 * Local MMKV queue for pending food suggestions.
 * Stores suggestions locally, syncs to backend on app foreground.
 * Retry logic: max 5 retries, max 7 days age.
 */
import { createMMKV } from 'react-native-mmkv';
import { generateIdempotencyKey } from '../utils/idempotency';
import { submitBatchSuggestions } from './suggestionApi';

const storage = createMMKV({ id: 'pending_suggestions' });
const PENDING_KEY = 'queue';
const MAX_QUEUE_SIZE = 50;
const MAX_RETRY = 5;
const MAX_AGE_DAYS = 7;

export interface PendingItem {
    client_idempotency_key: string;
    ten_quan: string;
    ten_mon?: string;
    dia_chi: string;
    thanh_pho: string;
    latitude?: number;
    longitude?: number;
    raw_ai_data?: Record<string, unknown>;
    client_created_at: string;
    retry_count: number;
    last_retry_at: string | null;
}

function getPendingQueue(): PendingItem[] {
    const raw = storage.getString(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
}

function savePendingQueue(items: PendingItem[]): void {
    storage.set(PENDING_KEY, JSON.stringify(items));
}

export async function addToPendingQueue(
    userId: string,
    geminiResult: {
        ten_quan: string;
        ten_mon?: string;
        dia_chi: string;
        thanh_pho?: string;
        latitude?: number;
        longitude?: number;
        raw_data?: Record<string, unknown>;
    },
): Promise<void> {
    const timestamp = new Date().toISOString();
    const key = await generateIdempotencyKey(
        userId, geminiResult.ten_quan, geminiResult.dia_chi, timestamp,
    );

    const queue = getPendingQueue();

    if (queue.some(item => item.client_idempotency_key === key)) return;

    const newItem: PendingItem = {
        client_idempotency_key: key,
        ten_quan: geminiResult.ten_quan,
        ten_mon: geminiResult.ten_mon,
        dia_chi: geminiResult.dia_chi,
        thanh_pho: geminiResult.thanh_pho ?? 'Hanoi',
        latitude: geminiResult.latitude,
        longitude: geminiResult.longitude,
        raw_ai_data: geminiResult.raw_data,
        client_created_at: timestamp,
        retry_count: 0,
        last_retry_at: null,
    };

    const updatedQueue = [...queue, newItem].slice(-MAX_QUEUE_SIZE);
    savePendingQueue(updatedQueue);
}

export async function syncPendingSuggestions(authToken: string): Promise<void> {
    const now = new Date();
    const queue = getPendingQueue();

    if (queue.length === 0) return;

    const toSync = queue.filter(item => {
        const age = (now.getTime() - new Date(item.client_created_at).getTime()) / 86400000;
        return item.retry_count < MAX_RETRY && age < MAX_AGE_DAYS;
    });

    if (toSync.length === 0) {
        savePendingQueue([]);
        return;
    }

    try {
        const response = await submitBatchSuggestions(authToken, { suggestions: toSync });

        if (response.status === 202 || response.status === 200) {
            savePendingQueue([]);
        } else if (response.status === 400) {
            savePendingQueue([]);
        } else {
            incrementRetryCount(toSync);
        }
    } catch {
        incrementRetryCount(toSync);
    }
}

function incrementRetryCount(items: PendingItem[]): void {
    const now = new Date().toISOString();
    const queue = getPendingQueue();
    const updated = queue.map(item => {
        const matched = items.find(i => i.client_idempotency_key === item.client_idempotency_key);
        if (matched) {
            return {
                ...item,
                retry_count: item.retry_count + 1,
                last_retry_at: now,
            };
        }
        return item;
    });
    savePendingQueue(updated);
}

export function getPendingCount(): number {
    return getPendingQueue().length;
}

export function clearPendingQueue(): void {
    savePendingQueue([]);
}
