/**
 * screens/styles/aiNearbyStyles.ts
 * Why: Tách toàn bộ StyleSheet của AiNearbyScreen ra file riêng (SRP).
 */
import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../constants/colors';

export const createNearbyStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
        backgroundColor: '#1a1a1a',
    },
    title: { fontSize: 20, fontWeight: '800', color: 'white' },
    backBtn: { paddingVertical: 8, paddingRight: 10 },
    backBtnText: { color: colors.primary, fontWeight: 'bold' },

    radarContainer: {
        padding: 24, alignItems: 'center', justifyContent: 'center', minHeight: 180,
    },
    center: { alignItems: 'center' },
    radarCircle: {
        width: 80, height: 80, borderWidth: 4, borderRadius: 40,
        marginBottom: 16, borderStyle: 'dashed'
    },
    statusText: { color: colors.text, fontWeight: 'bold', fontSize: 15, textAlign: 'center' },
    subStatusText: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
    errorText: { color: '#E91E63', textAlign: 'center', fontWeight: 'bold', lineHeight: 22 },
    retryBtn: { marginTop: 16, backgroundColor: colors.card, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    retryText: { color: colors.text, fontWeight: 'bold' },

    successHeader: {
        backgroundColor: colors.primary + '11',
        padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.primary,
        width: '100%'
    },
    aiReplyText: { color: colors.text, fontStyle: 'italic', fontSize: 14, lineHeight: 22 },

    listContent: { padding: 16, paddingBottom: 40 },
    card: {
        flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1,
        alignItems: 'center'
    },
    cardInfo: { flex: 1, paddingRight: 12 },
    cardName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    cardMon: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
    groundingNote: { fontSize: 12, color: colors.success || '#10b981', fontStyle: 'italic', marginBottom: 6 },
    cardAddr: { fontSize: 12, color: colors.textSecondary },
    pricePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    pricePillText: { fontWeight: '900', fontSize: 13 },

    toggleBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.card, borderRadius: 16 },
    toggleText: { color: colors.text, fontSize: 13, fontWeight: 'bold' },

    mapContainer: { flex: 1, width: '100%' },
    map: { ...StyleSheet.absoluteFillObject },
    floatingCardContainer: {
        position: 'absolute', bottom: 20, left: 0, right: 0,
        paddingHorizontal: 16, alignItems: 'center'
    },
    floatingCard: {
        flexDirection: 'row', padding: 16, borderRadius: 16, borderWidth: 1,
        width: '100%', alignItems: 'center',
        elevation: 5, shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5,
    },
    foodImagePlaceholder: {
        width: 60, height: 60, borderRadius: 6,
        backgroundColor: colors.border || '#e1e1e1',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
});
