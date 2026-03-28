/**
 * screens/styles/onlineHomeStyles.ts
 * Why: Tách toàn bộ StyleSheet + constants ra khỏi OnlineHomeScreen
 * để giảm dòng và tuân thủ SRP (UI config riêng biệt).
 */
import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../constants/colors';

export const CITIES: { key: string; label: string }[] = [
    { key: 'ha_noi', label: '🏛️ Hà Nội' },
    { key: 'ho_chi_minh', label: '🌆 Hồ Chí Minh' },
    { key: 'da_nang', label: '🌊 Đà Nẵng' },
    { key: 'hai_phong', label: '⚓ Hải Phòng' },
    { key: 'ha_long', label: '🛥️ Hạ Long' },
    { key: 'thanh_hoa', label: '🌿 Thanh Hoá' },
];

/** Why: Hàm format giá tái sử dụng ở nhiều section */
export const formatPrice = (p: number) =>
    p >= 1000 ? `${Math.round(p / 1000)}k` : `${p}`;

export const createExploreStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    section: { marginBottom: 28 },

    // Header
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 48, paddingBottom: 16,
        backgroundColor: colors.background,
    },
    subtitle: { fontSize: 13, color: colors.textSecondary, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
    title: { fontSize: 26, fontWeight: '900', color: colors.text, marginTop: 4 },
    userNameText: { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: 2 },
    iconBtn: {
        backgroundColor: colors.card, width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
    },

    // Cache note
    cacheNoteContainer: {
        backgroundColor: colors.card, marginHorizontal: 20, marginBottom: 20,
        paddingVertical: 10, borderRadius: 20, alignItems: 'center',
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
    },
    cacheNote: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },

    // Section Titles
    sectionIconBg: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.text },

    // Loading / Error
    loadingText: { marginTop: 12, color: colors.textSecondary },
    errorEmoji: { fontSize: 48, marginBottom: 12 },
    errorText: { color: colors.text, textAlign: 'center', marginBottom: 16, fontSize: 15 },
    retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
    retryText: { color: 'white', fontWeight: 'bold' },

    // Top Clicks horizontal card
    hCard: {
        width: 170, backgroundColor: colors.card, borderRadius: 20, padding: 16,
        borderWidth: 1, position: 'relative',
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 3,
    },
    rankBadge: {
        position: 'absolute', top: 12, right: 12,
        backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4,
    },
    rankText: { color: 'white', fontWeight: 'bold', fontSize: 11 },
    hCardName: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 6, lineHeight: 22 },
    hCardSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    hCardClick: { fontSize: 11, color: colors.primary, marginTop: 12, fontWeight: '700' },
    hCardPrice: { fontSize: 13, color: colors.text, marginTop: 4, fontWeight: '600' },

    // Price
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    priceBubble: {
        flex: 1, borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1,
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    priceCount: { fontSize: 26, fontWeight: '900', marginTop: 8 },
    priceLabel: { fontSize: 13, fontWeight: '800', marginTop: 4 },
    priceSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    pricePctPill: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    pricePct: { fontSize: 12, fontWeight: '700' },
    pillTb: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    pillTbText: { fontSize: 13, fontWeight: 'bold' },

    // District bar
    districtRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    districtName: { width: 100, fontSize: 14, color: colors.text, fontWeight: '600' },
    barTrack: { flex: 1, height: 8, backgroundColor: colors.card, borderRadius: 4, marginHorizontal: 12, overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4 },
    districtCount: { fontSize: 14, color: colors.textSecondary, width: 36, textAlign: 'right', fontWeight: '700' },

    // Trending
    trendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: colors.card, padding: 12, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
    trendRank: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    trendRankText: { fontWeight: 'bold', fontSize: 14 },
    trendName: { fontSize: 15, fontWeight: '800', color: colors.text },
    trendSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    trendClick: { fontWeight: '800', fontSize: 14, marginLeft: 8 },
    emptyText: { color: colors.textSecondary, fontStyle: 'italic', fontSize: 14 },

    // Random
    randomCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'flex-start', shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
    randomInfo: { flex: 1, paddingRight: 8 },
    randomName: { fontSize: 16, fontWeight: '800', color: colors.text },
    randomMon: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    randomAddr: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
    pricePill: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 4, alignSelf: 'flex-start', marginTop: 2 },
    pricePillText: { fontSize: 13, fontWeight: '800' },
    refreshMini: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },

    // City Picker Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: {
        backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: 24, paddingBottom: 50,
        shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
    },
    modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 20, textAlign: 'center' },
    cityOption: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16, marginBottom: 10,
    },
    cityOptionText: { fontSize: 16, color: colors.text, fontWeight: '500' },

    // AI Blocks
    suggestCard: { padding: 20, borderRadius: 24, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
    suggestText: { fontSize: 15, lineHeight: 24, fontWeight: '500', marginBottom: 16 },
    suggestItemCard: { padding: 16, borderRadius: 16, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
    suggestItemName: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
    suggestItemAddr: { fontSize: 13, lineHeight: 20 },

    // Notif
    notifBadge: {
        position: 'absolute', top: 8, right: 8,
        width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444',
        borderWidth: 2, borderColor: colors.card
    },
    notifItem: {
        backgroundColor: colors.background, padding: 16, borderRadius: 16, marginBottom: 12,
        borderWidth: 1, borderColor: colors.border
    },
    notifTitle: { fontWeight: '800', color: colors.text, fontSize: 16 },
    notifTime: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
    notifBody: { color: colors.textSecondary, fontSize: 14, marginTop: 6, lineHeight: 22 },
});
