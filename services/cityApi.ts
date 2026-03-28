/**
 * services/cityApi.ts
 * Fetch 6 city insight endpoints từ FastAPI backend.
 */
import { API_BASE_URL } from '../constants/api';
import { getAuthHeader } from './authService';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FoodItem {
    id: number;
    ten_quan: string;
    ten_mon: string;
    dia_chi: string;
    quan: string;
    thanh_pho: string;
    gia_min: number;
    gia_max: number;
    note: string;
    lat?: number;
    lng?: number;
    dist?: number;
    loai_hinh?: string;
    mo_ta?: string;
}

export interface FoodItemRanked extends FoodItem {
    so_lan_click: number;
    rank: number;
}

export interface DistrictStat {
    quan: string;
    total: number;
}

export interface PriceDistResponse {
    under_50k: number;
    mid_range: number;
    premium: number;
    avg_price: number;
    total: number;
}

// ── API helpers ────────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
    const authHeader = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}${path}`, {
        headers: { ...authHeader }
    });
    if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
    return res.json() as Promise<T>;
}

// ── Exports ────────────────────────────────────────────────────────────────────

export const fetchTopClicks = (city: string, limit = 10) =>
    get<FoodItemRanked[]>(`/city/${city}/top-clicks?limit=${limit}`);

export const fetchDistricts = (city: string) =>
    get<DistrictStat[]>(`/city/${city}/districts`);

export const fetchPriceRange = (city: string) =>
    get<PriceDistResponse>(`/city/${city}/price-range`);

export const fetchTrending = (city: string, limit = 10) =>
    get<FoodItemRanked[]>(`/city/${city}/trending?limit=${limit}`);

export const fetchRandom = (
    city: string,
    opts?: { district?: string; max_price?: number; limit?: number }
) => {
    const parts: string[] = [];
    if (opts?.district) parts.push(`district=${encodeURIComponent(opts.district)}`);
    if (opts?.max_price) parts.push(`max_price=${opts.max_price}`);
    if (opts?.limit) parts.push(`limit=${opts.limit}`);
    const qs = parts.length ? `?${parts.join('&')}` : '';
    return get<FoodItem[]>(`/city/${city}/random${qs}`);
};

// ── AI Endpoints ──────────────────────────────────────────────────────────────
export interface AiSuggestResponse {
    reply: string;
    model_used: string;
    results: FoodItem[];
    should_ground_locally?: boolean;
    grounding_prompt?: string;
    system_instruction?: string;
    db_results?: FoodItem[];
}

export const fetchAiSuggest = (city: string, query?: string) => {
    const qs = query ? `&query=${encodeURIComponent(query)}` : '';
    return get<AiSuggestResponse>(`/ai/suggest?city=${city}${qs}`);
};

export const fetchAiNearby = async (
    city: string,
    userAddress: string,
    lat?: number,
    lng?: number,
    query: string = 'quán ăn',
    options?: { grounding?: boolean; radius?: number }
) => {
    console.log('[AiApi] fetchAiNearby Request:', { city, userAddress, lat, lng, query, options });
    try {
        const authHeader = await getAuthHeader();
        const res = await fetch(`${API_BASE_URL}/ai/nearby`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...authHeader
            },
            body: JSON.stringify({
                city,
                user_address: userAddress,
                query,
                lat,
                lng,
                grounding: options?.grounding ?? false,
                radius: options?.radius ?? 1000,
            }),
        });
        if (!res.ok) {
            console.error('[AiApi] fetchAiNearby Error Status:', res.status);
            throw new Error(`API error ${res.status}: /ai/nearby`);
        }
        const data = (await res.json()) as AiSuggestResponse;
        console.log('[AiApi] fetchAiNearby Success:', data?.results?.length, 'results');
        return data;
    } catch (error) {
        console.error('[AiApi] fetchAiNearby Exception:', error);
        throw error;
    }
};
