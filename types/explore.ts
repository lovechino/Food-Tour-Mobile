/**
 * types/explore.ts
 * Typed interfaces cho Explore screen components.
 * Why: Thay thế mọi `any` trong props của section components.
 */
import { ThemeColors } from '../constants/colors';
import { FoodItemRanked, DistrictStat, FoodItem, AiSuggestResponse } from '../services/cityApi';
import { ExploreData } from '../services/exploreCache';

/** Why: ReturnType<typeof StyleSheet.create> không đủ specific → dùng generic */
export type ExploreStyles = ReturnType<typeof import('../screens/styles/onlineHomeStyles').createExploreStyles>;

export interface SectionBaseProps {
    styles: ExploreStyles;
    colors: ThemeColors;
}

export interface CacheNoteProps extends SectionBaseProps {
    fetchedAt: string;
}

export interface AiSuggestSectionProps extends SectionBaseProps {
    suggestData?: AiSuggestResponse;
}

export interface TopClicksSectionProps extends SectionBaseProps {
    items: FoodItemRanked[];
}

export interface PriceSectionProps extends SectionBaseProps {
    data: PriceData | null;
}

export interface PriceData {
    total: number;
    under_50k: number;
    mid_range: number;
    premium: number;
    avg_price: number;
}

export interface DistrictSectionProps extends SectionBaseProps {
    items: DistrictStat[];
}

export interface TrendingSectionProps extends SectionBaseProps {
    items: FoodItemRanked[];
}

export interface RandomSectionProps extends SectionBaseProps {
    items: FoodItem[];
    onRefresh: () => void;
}
