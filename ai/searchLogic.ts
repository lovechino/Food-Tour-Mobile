import { searchTopK } from "./searchTopK";
import { getFoodsByIds, getAllFoodIds, getDistricts, searchByName } from "../services/foodRepo";
import { embedText } from "./embed";
import { FoodItem } from "../services/cityApi";

export interface SearchFilters {
    minPrice?: number;
    maxPrice?: number;
    district?: string;
}

export interface SearchIntent {
    query: string;
    filters: SearchFilters;
    isFollowUp: boolean;
}

// Map common districts variants to standard "Quận X"
const normalizeDistrict = (text: string, availableDistricts: string[] = []): string | undefined => {
    const lower = text.toLowerCase();

    // 1. Check known abbreviations first (High priority)
    if (lower.includes("quận 1") || lower.includes("q1") || lower.includes("quan 1")) return "Quận 1";
    if (lower.includes("quận 2") || lower.includes("q2") || lower.includes("quan 2")) return "Quận 2";
    if (lower.includes("quận 3") || lower.includes("q3") || lower.includes("quan 3")) return "Quận 3";
    if (lower.includes("quận 4") || lower.includes("q4") || lower.includes("quan 4")) return "Quận 4";
    if (lower.includes("quận 5") || lower.includes("q5") || lower.includes("quan 5")) return "Quận 5";
    if (lower.includes("quận 6") || lower.includes("q6") || lower.includes("quan 6")) return "Quận 6";
    if (lower.includes("quận 7") || lower.includes("q7") || lower.includes("quan 7")) return "Quận 7";
    if (lower.includes("quận 8") || lower.includes("q8") || lower.includes("quan 8")) return "Quận 8";
    if (lower.includes("quận 9") || lower.includes("q9") || lower.includes("quan 9")) return "Quận 9";
    if (lower.includes("quận 10") || lower.includes("q10") || lower.includes("quan 10")) return "Quận 10";
    if (lower.includes("quận 11") || lower.includes("q11") || lower.includes("quan 11")) return "Quận 11";
    if (lower.includes("quận 12") || lower.includes("q12") || lower.includes("quan 12")) return "Quận 12";

    // 2. Dynamic check from DB list (e.g. Cầu Giấy, Hoàn Kiếm...)
    for (const dist of availableDistricts) {
        const distLower = dist.toLowerCase();
        // Check if query contains the district name
        // Use simple includes for now, assumes district names are distinct enough
        if (lower.includes(distLower)) {
            return dist;
        }
    }

    return undefined;
};

export const extractSearchIntent = (text: string, availableDistricts: string[] = []): SearchIntent => {
    const filters: SearchFilters = {};
    let query = text;

    // Detect Follow-up intent
    const followUpKeywords = ["ở trên", "trong số đó", "vừa rồi", "nãy", "đó", "này"];
    const isFollowUp = followUpKeywords.some(kw => text.toLowerCase().includes(kw));

    // 1. Detect Price Range
    const rangeRegex = /(\d+)(?:k|000)?\s*-\s*(\d+)(?:k|000)?/i;
    const matchRange = text.match(rangeRegex);
    if (matchRange) {
        filters.minPrice = parseInt(matchRange[1]) * (matchRange[0].includes("000") && !matchRange[1].includes("000") ? 1 : 1000);
        filters.maxPrice = parseInt(matchRange[2]) * (matchRange[0].includes("000") && !matchRange[2].includes("000") ? 1 : 1000);
        if (filters.minPrice < 1000) filters.minPrice *= 1000;
        if (filters.maxPrice < 1000) filters.maxPrice *= 1000;
    } else {
        const belowRegex = /(?:dưới|tầm|khoảng)\s*(\d+)(?:k|000)?/i;
        const matchBelow = text.match(belowRegex);
        if (matchBelow) {
            let val = parseInt(matchBelow[1]);
            if (val < 1000) val *= 1000;
            filters.maxPrice = val;
        }

        const aboveRegex = /(?:trên|hơn)\s*(\d+)(?:k|000)?/i;
        const matchAbove = text.match(aboveRegex);
        if (matchAbove) {
            let val = parseInt(matchAbove[1]);
            if (val < 1000) val *= 1000;
            filters.minPrice = val;
        }
    }

    // 2. Detect District (Dynamic)
    filters.district = normalizeDistrict(text, availableDistricts);

    return { query, filters, isFollowUp };
};

// Helper to check if text contains any of the known D1 wards
const isDistrict1Ward = (text: string) => {
    const d1Wards = [
        "bến nghé", "bến thành", "cô giang", "cầu kho",
        "cầu ông lãnh", "đa kao", "nguyễn cư trinh",
        "nguyễn thái bình", "phạm ngũ lão", "tân định"
    ];
    return d1Wards.some(w => text.includes(w));
};


// Helper to checking if the food item is relevant to the keyword
const verifyRelevance = (food: FoodItem, keyword: string): boolean => {
    if (!keyword || keyword.length < 2) return true; // Too short to strict filter

    const kw = keyword.toLowerCase();

    // Split into words, avoiding empty strings
    // Also filter out common stop words that might have slipped through
    const ignoredWords = [
        // Vietnamese
        "ở", "tại", "của", "và", "là", "thì", "mà", "bị", "bởi", "với",
        // English
        "in", "at", "of", "and", "is", "are", "by", "with", "the", "a", "an", "to", "for"
    ];
    const words = kw.split(/\s+/).filter(w => w.length > 0 && !ignoredWords.includes(w));

    if (words.length === 0) return true; // If effective keyword is empty after filtering

    // Prepare text content from the food item
    const textFields = [
        (food.ten_mon || "").toLowerCase(),
        (food.ten_quan || "").toLowerCase(),
        (food.loai_hinh || "").toLowerCase(),
        (food.mo_ta || "").toLowerCase()
    ];
    const fullText = textFields.join(" ");

    // Check if ALL words from the query exist in the food's text
    // RELAXED: Allow match if 50% of words are found, OR if it's likely English (by checking basic ASCII)
    if (/^[a-zA-Z0-9\s]+$/.test(keyword)) {
        // English-like query: Don't be strict, trust vector search more
        return true;
    }

    return words.every(word => fullText.includes(word));
};

export const filterFoods = (foods: FoodItem[], filters: SearchFilters) => {
    // console.log(`Filtering ${foods.length} candidates with filters: `, filters);
    const result = foods.filter(food => {
        // Price Filter
        if (filters.minPrice && (food.gia_max || food.gia_min) < filters.minPrice) return false;
        if (filters.maxPrice && (food.gia_min || food.gia_max) > filters.maxPrice) return false;

        // District Filter
        if (filters.district) {
            const filterDist = filters.district.toLowerCase();
            const foodQuan = (food.quan || "").toLowerCase();
            const address = (food.dia_chi || "").toLowerCase();

            // 1. Check strict match on 'quan' column
            if (foodQuan && foodQuan.includes(filterDist)) return true;

            // 2. Special handling for Quận 1
            if (filterDist === "quận 1") {
                if (/\bquận 1\b/.test(address) || /\bq\.?1\b/.test(address)) {
                    // Exclude Quận 10, 11, 12 if matching "Quận 1"
                    if (!address.includes("quận 10") && !address.includes("quận 11") && !address.includes("quận 12")) return true;
                }
                if (isDistrict1Ward(address)) return true;
            }

            // 3. Fallback address check
            if (address.includes(filterDist)) return true;

            // console.log(`❌ Reject ${food.ten_quan}: '${foodQuan}' / '${address}' != '${filters.district}'`);
            return false;
        }
        return true;
    });
    // console.log(`✅ Filtered down to ${result.length} items.`);
    return result;
};

export const searchFoodsWithLogic = async (
    text: string,
    city: string,
    previousFoods: FoodItem[] = []
): Promise<{ foods: FoodItem[], intent: SearchIntent }> => {

    // 1. Fetch available districts for this city
    const districts = await getDistricts(city);
    // console.log(`🏙️ Loaded ${districts.length} districts for ${city}`);

    const intent = extractSearchIntent(text, districts);
    console.log("🔍 Search Intent:", intent);

    let candidates: FoodItem[] = [];

    if (intent.isFollowUp && previousFoods.length > 0) {
        console.log("↪️ Follow-up detected, filtering previous results...");
        candidates = previousFoods;
    } else {
        console.log("🔎 Starting Hybrid Search...");

        // 0. Clean Query for Keyword Search
        // Use token-based filtering instead of Regex \b which fails on Vietnamese chars sometimes
        let cleanQuery = intent.query.toLowerCase();

        // Remove district first if detected
        if (intent.filters.district) {
            cleanQuery = cleanQuery.replace(new RegExp(intent.filters.district.toLowerCase(), 'gi'), " ");
        }

        const stopWords = ["tôi", "muốn", "ăn", "tìm", "thèm", "cho", "ở", "tại", "quận", "huyện", "thành", "phố", "có", "nào", "quán", "ngon", "review", "đâu"];

        // Split by non-word characters (spaces, punctuation)
        let tokens = cleanQuery.split(/[\s,.;!?()]+/);

        // Filter out stop words
        tokens = tokens.filter(t => t.length > 0 && !stopWords.includes(t));

        cleanQuery = tokens.join(" ");
        console.log(`🧹 Cleaned query for keyword search: "${cleanQuery}"`);

        // 1. Keyword Search (Fast & Exact)
        // Only perform if we have a meaningful keyword left
        let keywordResults: any[] = [];
        if (cleanQuery.length > 1) { // Avoid single char searches
            console.log(`🔤 Keyword searching for: "${cleanQuery}"`);
            keywordResults = await searchByName(city, cleanQuery);
            console.log(`   Found ${keywordResults.length} keyword matches.`);
        } else {
            console.log("🔤 Skipping keyword search (query too short/generic).");
        }

        // 2. Vector Search (Semantic)
        console.log("🧠 Vector searching...");

        const allIds = await getAllFoodIds(city);
        const qVec = await embedText(intent.query); // Use full query for semantics

        // Increase TopK to 100 to find enough candidates after filtering
        const topK = await searchTopK(qVec, city, 100);

        let vectorResults: any[] = [];
        if (topK.length > 0) {
            // Map vector index (0...N) to actual DB ID
            const foodIds = topK.map((item) => {
                if (item.index < allIds.length) {
                    return allIds[item.index];
                }
                return -1;
            }).filter(id => id !== -1);

            vectorResults = await getFoodsByIds(city, foodIds);
        }
        console.log(`   Found ${vectorResults.length} vector matches before verification.`);

        // --- STRICT VERIFICATION STEP ---
        // If we have a strong keyword, enforce it on vector results
        // This prevents "bún" query returning "vịt quay"
        if (cleanQuery.length > 1) {
            const originalCount = vectorResults.length;
            vectorResults = vectorResults.filter(item => verifyRelevance(item, cleanQuery));
            console.log(`   📉 Filtered vector results from ${originalCount} to ${vectorResults.length} using keyword "${cleanQuery}"`);
        }
        // --------------------------------

        // 3. Combine & Deduplicate
        // Priority: Keyword matches first, then Vector matches
        const combined = [...keywordResults];
        const existingIds = new Set(keywordResults.map(i => i.id));

        for (const item of vectorResults) {
            if (!existingIds.has(item.id)) {
                combined.push(item);
                existingIds.add(item.id);
            }
        }

        // Reranking: Put items that contain the keyword in Title (ten_mon) to the VERY TOP
        if (cleanQuery.length > 1) {
            combined.sort((a, b) => {
                const aName = (a.ten_mon || "").toLowerCase();
                const bName = (b.ten_mon || "").toLowerCase();
                const kw = cleanQuery.toLowerCase();

                // Exact start match gets highest priority
                const aStarts = aName.startsWith(kw);
                const bStarts = bName.startsWith(kw);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;

                // Contains match gets second priority
                const aHas = aName.includes(kw);
                const bHas = bName.includes(kw);
                if (aHas && !bHas) return -1;
                if (!aHas && bHas) return 1;

                return 0; // Default order (vector score or DB order)
            });
        }

        candidates = combined;
        console.log(`🎉 Total unique candidates: ${candidates.length} `);
    }

    // Apply Filter
    const filtered = filterFoods(candidates, intent.filters);

    // Fallback if empty result on follow-up
    if (intent.isFollowUp && filtered.length === 0 && (intent.filters.district || intent.filters.minPrice || intent.filters.maxPrice)) {
        console.log("⚠️ Follow-up yielded 0 results, falling back to global search...");
        const qVec = await embedText(intent.query);
        const allIds = await getAllFoodIds(city);
        const topK = await searchTopK(qVec, city, 100);
        if (topK.length > 0) {
            const foodIds = topK.map((item) => {
                if (item.index < allIds.length) {
                    return allIds[item.index];
                }
                return -1;
            }).filter(id => id !== -1);

            const globalCandidates = await getFoodsByIds(city, foodIds);

            // Apply strict verification on fallback too if possible, but maybe relax it? 
            // Lets apply it to be safe.
            // if (cleanQuery.length > 1) {
            //      globalCandidates = globalCandidates.filter(item => verifyRelevance(item, cleanQuery));
            // }

            const globalFiltered = filterFoods(globalCandidates, intent.filters);
            return { foods: globalFiltered.slice(0, 10), intent };
        }
    }

    return { foods: filtered.slice(0, 10), intent };
};
