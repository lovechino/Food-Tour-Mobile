export interface CityPackConfig {
    id: string;
    name: string;
    url: string;
    version: string;
    description?: string;
    thumbnail?: string; // Link ảnh đại diện thành phố nếu cần
}

export const CITY_PACKS: Record<string, CityPackConfig> = {
    hai_phong: {
        id: "hai_phong",
        name: "Hải Phòng",
        url: "https://github.com/lovechino/food-ai-city-packs/releases/download/v1.0.5/hai_phong.zip",
        version: "1.0.5",
        description: "Thành phố hoa phượng đỏ với food tour nổi tiếng thế giới.",
    },
    thanh_hoa: {
        id: "thanh_hoa",
        name: "Thanh Hóa",
        url: "https://github.com/lovechino/food-ai-city-packs/releases/download/v1.0.6/thanh_hoa.zip",
        version: "1.0.6",
        description: "Nem chua, chả tôm và những đặc sản xứ Thanh.",
    },
    ha_noi: {
        id: "ha_noi",
        name: "Hà Nội",
        url: "https://github.com/lovechino/food-ai-city-packs/releases/download/v1.0.4/ha_noi.zip",
        version: "1.0.4",
        description: "Phở, bún chả và ẩm thực Tràng An nghìn năm văn hiến.",
    },
    da_nang: {
        id: "da_nang",
        name: "Đà Nẵng",
        url: "https://github.com/lovechino/food-ai-city-packs/releases/download/v1.0.2/da_nang.zip",
        version: "1.0.2",
        description: "Mì quảng, bánh tráng cuốn thịt heo và hải sản tươi sống.",
    },
    ho_chi_minh: {
        id: "ho_chi_minh",
        name: "Hồ Chí Minh",
        url: "https://github.com/lovechino/food-ai-city-packs/releases/download/v1.0/ho_chi_minh.zip",
        version: "1.0",
        description: "Sài Gòn năng động với cơm tấm, hủ tiếu và street food đa dạng.",
    },
};

// Hàm helper để lấy danh sách thành phố dạng mảng cho UI (FlatList)
export const getCityList = () => Object.values(CITY_PACKS);

export const getCityConfig = (cityId: string) => CITY_PACKS[cityId];
