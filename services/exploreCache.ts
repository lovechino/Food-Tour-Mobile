/**
 * services/exploreCache.ts
 * Cache cho Explore screen với TTL 3 giờ.
 *
 * Quy tắc:
 *  - Key: `@explore/{city}`
 *  - TTL: 3 giờ (10800000ms) — cân bằng giữa freshness và performance
 *  - Khi crowdsourcing hoạt động, user sẽ thấy quán mới approve trong vòng 3h
 *  - Pull-to-refresh: gọi refreshExploreData() → invalidate → fetch mới
 *  - Random luôn fetch mới bất kể cache
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
    aiSuggest?: AiSuggestResponse;
    fetchedAt: string;       // ISO timestamp để check TTL
}

// ── Config ────────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

// ── Helpers ──────────────────────────────────────────────────────────────────

const cacheKey = (city: string) => `@explore/${city}`;

function isCacheValid(fetchedAt: string): boolean {
    const age = Date.now() - new Date(fetchedAt).getTime();
    return age < CACHE_TTL_MS;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Lấy explore data: đọc cache nếu còn trong TTL (3h), fetch mới nếu không.
 * Random section luôn được fetch mới dù từ cache.
 */
export async function getExploreData(city: string): Promise<ExploreData> {
    const key = cacheKey(city);

    try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
            const cached: ExploreData = JSON.parse(raw);

            if (!Array.isArray(cached.districts)) {
                throw new Error("Corrupted cache: districts is not an array");
            }

            if (isCacheValid(cached.fetchedAt)) {
                // Cache còn valid → dùng + fetch random mới
                const random = await fetchRandom(city, { limit: 5 }).catch(() => []);
                return { ...cached, random };
            }
            // Cache hết hạn → fetch mới
        }
    } catch (_) {
        // Cache corrupt hoặc không tồn tại → fetch mới
    }

    return fetchAndCache(city);
}

/**
 * Fetch mới từ API, ghi vào cache.
 * Gọi khi pull-to-refresh hoặc cache miss/expired.
 */
export async function refreshExploreData(city: string): Promise<ExploreData> {
    await invalidateCache(city);
    return fetchAndCache(city);
}

/**
 * Xoá cache của một city.
 */
export async function invalidateCache(city: string): Promise<void> {
    try {
        await AsyncStorage.removeItem(cacheKey(city));
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
            fetchAiSuggest(city, 'món ăn').catch(() => undefined),
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

    // Ghi cache (không cache random)
    const toCache: ExploreData = { ...data, random: [] };
    try {
        await AsyncStorage.setItem(cacheKey(city), JSON.stringify(toCache));
    } catch (_) { }

    return data;
}
