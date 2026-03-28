/**
 * services/exploreCache.ts
 * Daily cache logic cho Explore screen.
 *
 * Quy tắc:
 *  - Key: `@explore/{city}/{YYYY-MM-DD}`
 *  - Load đầu ngày: so sánh date string → cache miss → fetch mới
 *  - Pull-to-refresh: gọi refreshExploreData() → invalidate key → fetch mới
 *  - Random luôn fetch mới bất kể cache (không cache)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    fetchTopClicks,
    fetchDistricts,
    fetchPriceRange,
    fetchTrending,
    fetchRandom,
    FoodItemRanked,
    DistrictStat,
    PriceDistResponse,
    FoodItem,
    fetchAiSuggest,
    AiSuggestResponse
} from './cityApi';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExploreData {
    topClicks: FoodItemRanked[];
    districts: DistrictStat[];
    priceRange: PriceDistResponse;
    trending: FoodItemRanked[];
    random: FoodItem[];      // Không cache – luôn fresh
    aiSuggest?: AiSuggestResponse; // Ai Suggestion (optional for backwards compatibility)
    fetchedAt: string;       // ISO date string để debug
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split('T')[0]; // YYYY-MM-DD

const cacheKey = (city: string) => `@explore/${city}/${todayStr()}`;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Lấy explore data: đọc cache nếu còn trong ngày, fetch mới nếu không.
 * Random section luôn được fetch mới dù từ cache.
 */
export async function getExploreData(city: string): Promise<ExploreData> {
    const key = cacheKey(city);

    // Thử đọc cache
    try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
            const cached: ExploreData = JSON.parse(raw);

            // Handle corrupted cache (e.g. from previous backend iteration)
            if (!Array.isArray(cached.districts)) {
                throw new Error("Corrupted cache: districts is not an array");
            }

            // Fetch random lại dù có cache
            const random = await fetchRandom(city, { limit: 5 }).catch(() => []);
            return { ...cached, random };
        }
    } catch (_) {
        // Cache corrupt → fetch mới
    }

    return fetchAndCache(city);
}

/**
 * Fetch mới từ API, ghi vào cache hôm nay.
 * Gọi khi pull-to-refresh hoặc cache miss.
 */
export async function refreshExploreData(city: string): Promise<ExploreData> {
    // Xoá cache cũ của city này trước
    await invalidateCache(city);
    return fetchAndCache(city);
}

/**
 * Xoá tất cả cache của một city (key prefix matching).
 */
export async function invalidateCache(city: string): Promise<void> {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        const cityKeys = allKeys.filter(k => k.startsWith(`@explore/${city}/`));
        if (cityKeys.length > 0) {
            await AsyncStorage.multiRemove(cityKeys);
        }
    } catch (_) { }
}

// ── Private ───────────────────────────────────────────────────────────────────

async function fetchAndCache(city: string): Promise<ExploreData> {
    const [topClicks, districts, priceRange, trending, random, aiSuggest] =
        await Promise.all([
            fetchTopClicks(city, 10),
            fetchDistricts(city),
            fetchPriceRange(city),
            fetchTrending(city, 10),
            fetchRandom(city, { limit: 5 }),
            fetchAiSuggest(city, 'món ăn').catch(() => undefined), // Fail gracefully if AI is down
        ]);

    const data: ExploreData = {
        topClicks,
        districts,
        priceRange,
        trending,
        random,
        aiSuggest,
        fetchedAt: new Date().toISOString(),
    };

    // Ghi cache (không cache phần random)
    const toCache: ExploreData = { ...data, random: [] };
    try {
        await AsyncStorage.setItem(cacheKey(city), JSON.stringify(toCache));
    } catch (_) { }

    return data;
}
