/**
 * services/aiGroundingService.ts
 * Server-side Gemini grounding via backend proxy.
 * Key NEVER leaves the server — user's encrypted Gemini key is decrypted
 * on the backend, used for the API call, then discarded.
 */
import { fetchAiNearby, AiSuggestResponse, FoodItem } from './cityApi';
import { getAuthHeader } from './authService';
import { addToPendingQueue } from './suggestionQueue';
import { getStoredAuth } from './authService';
import { API_BASE_URL } from '../constants/api';

/** Why: Reverse geocode tọa độ GPS thành địa chỉ tiếng Việt */
async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; city: string }> {
    let address = `Tọa độ GPS: ${lat}, ${lng}`;
    let city = 'ha_noi';

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        const res = await fetch(url, {
            headers: { 'Accept-Language': 'vi', 'User-Agent': 'FoodTourAI-App' }
        });
        if (!res.ok) return { address, city };
        const data = await res.json();
        if (data?.display_name) {
            address = `${data.display_name} (Tọa độ: ${lat}, ${lng})`;
        }
        if (data?.address) {
            const raw = data.address.city || data.address.state || data.address.province || '';
            if (raw) city = raw.replace(/Thành phố /g, '').replace(/Tỉnh /g, '').trim();
        }
    } catch { /* Fallback to GPS coords */ }
    return { address, city };
}

/**
 * Server-side grounding via backend proxy.
 * User's Gemini key is decrypted on server — key never reaches device.
 */
async function groundViaServer(userAddress: string, city: string, query: string): Promise<{
    reply: string;
    results: Record<string, unknown>[];
    model_used: string;
} | null> {
    try {
        const authHeader = await getAuthHeader();
        const res = await fetch(`${API_BASE_URL}/api/v1/ai/grounding`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader,
            },
            body: JSON.stringify({
                city,
                user_address: userAddress,
                query,
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({})) as any;
            if (err.needs_key) {
                console.warn('[Grounding] User has no Gemini key configured.');
            }
            return null;
        }

        return await res.json();
    } catch (e) {
        console.error('[Grounding] Server-side grounding failed:', e);
        return null;
    }
}

/** Why: Xử lý hybrid grounding khi backend yêu cầu local AI */
async function groundLocally(res: AiSuggestResponse, detectedCity: string, userAddress: string): Promise<AiSuggestResponse | null> {
    // Use server-side grounding instead of direct Gemini call
    const serverResult = await groundViaServer(userAddress, detectedCity, 'quán ăn');

    if (!serverResult || !serverResult.results?.length) {
        if (res.db_results?.length) return { ...res, results: res.db_results };
        return null;
    }

    const mapped = mapAiResults(serverResult.results, detectedCity);

    const { user } = await getStoredAuth();
    if (user?.userId) {
        for (const item of mapped) {
            const existingIds = (res.db_results || []).map((r: FoodItem) => r.id);
            if (!existingIds.includes(item.id)) {
                await addToPendingQueue(user.userId, {
                    ten_quan: item.ten_quan,
                    ten_mon: item.ten_mon,
                    dia_chi: item.dia_chi,
                    thanh_pho: item.thanh_pho,
                    latitude: item.lat,
                    longitude: item.lng,
                    raw_data: { source: 'gemini_grounding_server', city: detectedCity },
                });
            }
        }
    }

    return { ...res, results: mapped, reply: serverResult.reply || "Tôi đã tìm kiếm thực tế và thấy một số quán mới quanh bạn:" };
}

/** Why: Map raw AI response thành FoodItem[] chuẩn */
function mapAiResults(items: Record<string, unknown>[], city: string): FoodItem[] {
    return items.map((item, index) => ({
        id: (item.id && index === 0) ? String(item.id) : `g_${Date.now()}_${index}`,
        ten_quan: String(item.name || ''),
        ten_mon: String(item.dish || ''),
        dia_chi: String(item.addr || ''),
        lat: parseFloat(String(item.lat)),
        lng: parseFloat(String(item.lng)),
        dist: item.dist as string | undefined,
        note: `[🌐 AI] 📍 ${item.dist || 'Gần đây'} - ${item.note || ''}`,
        thanh_pho: city,
        quan: "", gia_min: 0, gia_max: 0, so_lan_click: 0,
    }));
}

/** Why: Entry point gom tất cả bước: geocode → fetch → grounding */
export async function fetchNearbyAI(lat: number, lng: number): Promise<{
    data: AiSuggestResponse | null; error: string | null;
}> {
    try {
        const { address, city } = await reverseGeocode(lat, lng);
        const res = await fetchAiNearby(city, address, lat, lng, 'quán ăn', { radius: 1000 });

        if (res.should_ground_locally && res.grounding_prompt && res.system_instruction) {
            const grounded = await groundLocally(res, city, address);
            if (grounded) return { data: grounded, error: null };
        }

        if (res.results?.length) return { data: res, error: null };
        return {
            data: res,
            error: "Hiện tại không tìm thấy quán nào trong phạm vi 1km quanh đây. Bạn thử xem gợi ý phía trên của AI nhé!"
        };
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return { data: null, error: "Không thể tìm kiếm AI lúc này: " + msg };
    }
}
