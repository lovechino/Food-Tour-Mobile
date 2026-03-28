import { SearchIntent } from "./searchLogic";
import { getCityConfig } from "../services/cityConfig";
import { FoodItem } from "../services/cityApi";

const TEMPLATES = {
    SUCCESS_MANY: [
        "Trời ơi, {district} là 'thánh địa' {query} nè! Thử mấy quán này xem, bảo đảm dính! 🔥",
        "Tìm thấy cả đống {query} ngon nhức nách cho bạn đây 👇",
        "Dạ, em lục tung {district} lên thì thấy mấy quán này ổn áp nhất nè:",
        "Huhu nhìn danh sách này mà thèm ngang lun á! 🤤 Mời bạn chọn:",
        "Alo alo! 📢 Phát hiện {count} tọa độ {query} siêu hot, check ngay kẻo lỡ:"
    ],
    SUCCESS_FEW: [
        "Hơi hiếm nha, nhưng mình vẫn tìm được {count} quán {query} chất lượng này:",
        "Mình tìm thấy {count} lựa chọn uy tín cho bạn đây:",
        "Kèo này hơi khó nhưng không làm khó được mình! Đây là {count} quán {query} ngon nhất:"
    ],
    FILTER_PRICE: [
        "Dạ đây, {query} giá 'hạt dẻ' cho team sinh viên nghèo vượt khó: 💸",
        "Mấy quán này giá mềm xèo mà chất lượng ok nè:",
        "List {query} ngon - bổ - rẻ đúng ý bạn luôn:"
    ],
    NO_RESULT: [
        "Hic, tìm nát cả {district} mà không thấy quán {query} nào ưng ý... 😭",
        "Ca này khó! Hay bạn thử đổi món khác xem? Chứ món này ở đây hơi hiếm.",
        "Mình chịu thua kèo này rồi... Hay là đi ăn món khác đi? 🥺",
        "Ops! Không tìm thấy dữ liệu nào. Hay là bạn thử tìm ở quận khác xem?"
    ],
    FOLLOW_UP: [
        "Dạ đây, lọc lại theo ý bạn rồi nè:",
        "Ok luôn, danh sách đã được cập nhật 👇",
        "Chiều lòng bạn hết nấc, đây là kết quả mới:"
    ]
};

const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export const generateResponse = (intent: SearchIntent, foods: FoodItem[], city: string): string => {
    const count = foods.length;
    let template = "";

    // 1. NO RESULTS
    if (count === 0) {
        template = getRandom(TEMPLATES.NO_RESULT);
    }
    // 2. FOLLOW UP (Filtering existing list)
    else if (intent.isFollowUp) {
        template = getRandom(TEMPLATES.FOLLOW_UP);
    }
    // 3. PRICE FILTER
    else if (intent.filters.minPrice || intent.filters.maxPrice) {
        template = getRandom(TEMPLATES.FILTER_PRICE);
    }
    // 4. NORMAL SEARCH
    else {
        if (count < 3) {
            template = getRandom(TEMPLATES.SUCCESS_FEW);
        } else {
            template = getRandom(TEMPLATES.SUCCESS_MANY);
        }
    }

    // Replace Placeholders
    // {query} -> Intent query (e.g. "bún bò")
    // {district} -> Intent district or Current City
    // {count} -> Number of items

    let queryText = intent.query;
    // Clean query text for display (remove "tôi muốn ăn")
    queryText = queryText.replace(/tôi muốn ăn|tôi muốn tìm|cho tôi|ở|tại/gi, "").trim();
    if (!queryText) queryText = "món này";

    // ...

    const loc = intent.filters.district || getCityConfig(city)?.name || city; // Use district or city name

    return template
        .replace("{query}", queryText)
        .replace("{district}", loc)
        .replace("{count}", count.toString());
};
