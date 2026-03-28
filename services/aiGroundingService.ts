/**
 * services/aiGroundingService.ts
 * Why: Tách logic reverse geocoding + AI grounding khỏi AiNearbyScreen (SRP).
 * Screen chỉ nên render, logic nghiệp vụ nằm ở Service layer.
 */
import { fetchAiNearby, AiSuggestResponse, FoodItem } from './cityApi';
import { GoogleGenerativeAI } from "@google/generative-ai";
import AsyncStorage from '@react-native-async-storage/async-storage';

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

/** Why: Xử lý hybrid grounding khi backend yêu cầu local AI */
async function groundLocally(res: AiSuggestResponse, detectedCity: string): Promise<AiSuggestResponse | null> {
    const userApiKey = await AsyncStorage.getItem('@gemini_api_key');
    if (!userApiKey) {
        if (res.db_results?.length) return { ...res, results: res.db_results };
        return null;
    }

    try {
        const genAI = new GoogleGenerativeAI(userApiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: res.system_instruction,
            tools: [{ googleSearch: {} }]
        } as Record<string, unknown>);

        const result = await model.generateContent(res.grounding_prompt!);
        const text = result.response.text();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return null;

        const parsed = JSON.parse(jsonMatch[0]);
        const mapped = mapAiResults(parsed, detectedCity);
        return { ...res, results: mapped, reply: "Tôi đã tìm kiếm thực tế và thấy một số quán mới quanh bạn:" };
    } catch {
        if (res.db_results?.length) return { ...res, results: res.db_results };
        return null;
    }
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
            const grounded = await groundLocally(res, city);
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
