/**
 * services/cityApi.ts
 * Fetch 6 city insight endpoints + AI endpoints via centralized apiClient.
 * Now uses apiClient for 401 queue pattern — all auth failures handled consistently.
 */
import { apiGet, apiPost } from './apiClient';

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
    gia_trung_binh?: number;
    tags?: string;
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

export const fetchTopClicks = (city: string, limit = 10) =>
    apiGet<FoodItemRanked[]>(`/city/${city}/top-clicks?limit=${limit}`);

export const fetchDistricts = (city: string) =>
    apiGet<DistrictStat[]>(`/city/${city}/districts`);

export const fetchPriceRange = (city: string) =>
    apiGet<PriceDistResponse>(`/city/${city}/price-range`);

export const fetchTrending = (city: string, limit = 10) =>
    apiGet<FoodItemRanked[]>(`/city/${city}/trending?limit=${limit}`);

export const fetchRandom = (
    city: string,
    opts?: { district?: string; max_price?: number; limit?: number }
) => {
    const parts: string[] = [];
    if (opts?.district) parts.push(`district=${encodeURIComponent(opts.district)}`);
    if (opts?.max_price) parts.push(`max_price=${opts.max_price}`);
    if (opts?.limit) parts.push(`limit=${opts.limit}`);
    const qs = parts.length ? `?${parts.join('&')}` : '';
    return apiGet<FoodItem[]>(`/city/${city}/random${qs}`);
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
    return apiGet<AiSuggestResponse>(`/ai/suggest?city=${city}${qs}`);
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
    const data = await apiPost<AiSuggestResponse>('/ai/nearby', {
        city,
        user_address: userAddress,
        query,
        lat,
        lng,
        grounding: options?.grounding ?? false,
        radius: options?.radius ?? 1000,
    });
    console.log('[AiApi] fetchAiNearby Success:', data?.results?.length, 'results');
    return data;
};
