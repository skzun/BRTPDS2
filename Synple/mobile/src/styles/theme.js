import { createContext } from 'react';
import { StyleSheet } from 'react-native';

export function getThemeStyles(isDark = false) {
  const bg = isDark ? '#0B0F19' : '#F7F8FC';
  const cardBg = isDark ? '#171E2E' : '#FFFFFF';
  const cardBorder = isDark ? '#283347' : '#E2E8F0';
  const textPrimary = isDark ? '#F1F5F9' : '#1E293B';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const inputBg = isDark ? '#0F172A' : '#F8FAFC';
  const inputBorder = isDark ? '#334155' : '#CBD5E1';
  const choiceBg = isDark ? '#1E293B' : '#FFFFFF';
  const choiceBorder = isDark ? '#334155' : '#CBD5E1';
  const choiceText = isDark ? '#CBD5E1' : '#475569';
  const choiceActiveBg = isDark ? '#312E81' : '#EEF2FF';
  const choiceActiveBorder = isDark ? '#6366F1' : '#4F46E5';
  const choiceActiveText = isDark ? '#E0E7FF' : '#4338CA';
  const headerBg = isDark ? '#171E2E' : '#FFFFFF';
  const headerBorder = isDark ? '#283347' : '#E6E8F3';
  const brandColor = isDark ? '#818CF8' : '#4B43CF';
  const avatarBg = isDark ? '#312E81' : '#E7E6FF';
  const avatarText = isDark ? '#C7D2FE' : '#4B43CF';
  const reportNumber = isDark ? '#818CF8' : '#4F46E5';
  const reportBorder = isDark ? '#283347' : '#F1F5F9';
  const smallButtonBg = isDark ? '#312E81' : '#EEF2FF';
  const smallButtonText = isDark ? '#A5B4FC' : '#4338CA';
  const tagBg = isDark ? '#312E81' : '#EEF2FF';
  const tagText = isDark ? '#A5B4FC' : '#4338CA';
  const roleBadgeBg = isDark ? '#283347' : '#F1F5F9';
  const roleBadgeText = isDark ? '#CBD5E1' : '#475569';

  return StyleSheet.create({
    loginSurface: { flex: 1, backgroundColor: bg },
    loginContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    loginLogo: { width: 150, height: 130, alignSelf: 'center', marginBottom: 6 },
    loginTitle: { color: textPrimary, fontSize: 28, fontWeight: '800', textAlign: 'center' },
    loginSubtitle: { color: textSecondary, fontSize: 15, textAlign: 'center', marginTop: 8, marginBottom: 24 },
    loginCard: { backgroundColor: cardBg, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: cardBorder },
    loginModeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    loginNotice: { color: textSecondary, fontSize: 12, lineHeight: 17, marginTop: 14, textAlign: 'center' },
    forgotLink: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 6 },
    forgotLinkText: { color: brandColor, fontSize: 13, fontWeight: '700' },
    cancelOutlineButton: { marginTop: 10, borderWidth: 1, borderColor: inputBorder, alignItems: 'center', paddingVertical: 11, borderRadius: 9, backgroundColor: 'transparent' },
    cancelOutlineText: { color: textSecondary, fontWeight: '700', fontSize: 14 },
    safeArea: { flex: 1, backgroundColor: bg },
    darkSurface: { backgroundColor: bg },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, padding: 32 },
    splashLogo: { width: 230, height: 210 },
    loadingText: { color: brandColor, fontSize: 28, fontWeight: '800', marginTop: 2 },
    loadingCaption: { color: textSecondary, fontSize: 14, marginTop: 8 },
    header: { padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: headerBg, borderBottomWidth: 1, borderColor: headerBorder },
    headerIdentity: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerLogo: { width: 48, height: 44 },
    brand: { fontSize: 28, color: brandColor, fontWeight: '800' },
    subtitle: { color: textSecondary, marginTop: 2 },
    avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: avatarBg, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: avatarText, fontSize: 18, fontWeight: '800' },
    content: { padding: 18, paddingBottom: 40 },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: textPrimary, marginTop: 12, marginBottom: 9 },
    sessionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    logoutText: { color: isDark ? '#A5B4FC' : '#4338CA', fontSize: 13, fontWeight: '800' },
    navigation: { flexDirection: 'row', gap: 7, marginBottom: 8, flexWrap: 'wrap' },
    choice: { paddingVertical: 9, paddingHorizontal: 11, borderWidth: 1, borderColor: choiceBorder, borderRadius: 10, backgroundColor: choiceBg },
    choiceActive: { borderColor: choiceActiveBorder, backgroundColor: choiceActiveBg },
    choiceText: { color: choiceText, fontWeight: '700', fontSize: 12 },
    choiceTextActive: { color: choiceActiveText },
    card: { backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: cardBorder },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
    cardTitle: { color: textPrimary, fontSize: 17, fontWeight: '800' },
    hint: { color: textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 10 },
    muted: { color: textSecondary, fontSize: 13, marginTop: 3 },
    field: { marginTop: 10 },
    label: { color: isDark ? '#E2E8F0' : '#334155', fontSize: 13, fontWeight: '700', marginBottom: 6 },
    input: { backgroundColor: inputBg, color: textPrimary, borderWidth: 1, borderColor: inputBorder, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 10, fontSize: 15 },
    primaryButton: { backgroundColor: '#4F46E5', borderRadius: 10, alignItems: 'center', paddingVertical: 13, marginTop: 16 },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    approveButton: { flex: 1, backgroundColor: isDark ? '#059669' : '#10B981', alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
    actionText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
    rejectButton: { flex: 1, backgroundColor: isDark ? '#4C0519' : '#FFF1F2', alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
    rejectText: { color: isDark ? '#FECDD3' : '#BE123C', fontWeight: '800', fontSize: 13 },
    outlineButton: { marginTop: 14, borderWidth: 1, borderColor: isDark ? '#9F1239' : '#FDA4AF', alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
    outlineText: { color: isDark ? '#FDA4AF' : '#BE123C', fontWeight: '800', fontSize: 13 },
    badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, overflow: 'hidden', fontSize: 11, fontWeight: '800' },
    badgePENDING: { color: isDark ? '#FDE68A' : '#92400E', backgroundColor: isDark ? '#78350F' : '#FEF3C7' },
    badgeAPPROVED: { color: isDark ? '#A7F3D0' : '#047857', backgroundColor: isDark ? '#064E3B' : '#D1FAE5' },
    badgeREJECTED: { color: isDark ? '#FECDD3' : '#BE123C', backgroundColor: isDark ? '#881337' : '#FFE4E6' },
    badgeREVOKED: { color: isDark ? '#CBD5E1' : '#475569', backgroundColor: isDark ? '#334155' : '#E2E8F0' },
    badgeACTIVE: { color: isDark ? '#A7F3D0' : '#047857', backgroundColor: isDark ? '#064E3B' : '#D1FAE5' },
    badgeINACTIVE: { color: isDark ? '#94A3B8' : '#64748B', backgroundColor: isDark ? '#334155' : '#E2E8F0' },
    userChoices: { flexDirection: 'row', gap: 7, flexWrap: 'wrap', marginTop: 4 },
    member: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: cardBg, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: cardBorder, marginBottom: 8 },
    memberName: { color: textPrimary, fontWeight: '800' },
    memberDetail: { color: textSecondary, fontSize: 13, marginTop: 5 },
    ownerTag: { color: brandColor, fontWeight: '800', fontSize: 12 },
    selectedCard: { borderColor: isDark ? '#818CF8' : '#4F46E5', borderWidth: 2 },
    activeTag: { color: isDark ? '#34D399' : '#047857', fontWeight: '800', fontSize: 12 },
    inactiveTag: { color: textSecondary, fontWeight: '800', fontSize: 12 },
    removeText: { color: isDark ? '#FB7185' : '#BE123C', fontWeight: '800', fontSize: 12 },
    smallButton: { backgroundColor: smallButtonBg, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start', marginTop: 12 },
    smallButtonText: { color: smallButtonText, fontWeight: '800', fontSize: 12 },
    reportRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, borderBottomWidth: 1, borderColor: reportBorder, paddingVertical: 8 },
    reportNumber: { color: reportNumber, fontSize: 24, fontWeight: '800' },
    empty: { color: textSecondary, marginBottom: 14 },
    resetButton: { alignSelf: 'center', padding: 12, marginTop: 8 },
    resetText: { color: textSecondary, fontWeight: '700', fontSize: 12, textDecorationLine: 'underline' },
    typeTag: { color: tagText, backgroundColor: tagBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontSize: 11, fontWeight: '700' },
    tagRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4 },
    secondaryButton: { backgroundColor: smallButtonBg, borderRadius: 9, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12 },
    secondaryButtonText: { color: smallButtonText, fontWeight: '800', fontSize: 12 },
    cancelButton: { borderWidth: 1, borderColor: inputBorder, borderRadius: 9, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: cardBg },
    cancelButtonText: { color: textSecondary, fontWeight: '700', fontSize: 12 },
    roleBadge: { backgroundColor: roleBadgeBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 11, fontWeight: '700', color: roleBadgeText, overflow: 'hidden' },
    roleBadgeCoordinator: { backgroundColor: tagBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 11, fontWeight: '700', color: tagText, overflow: 'hidden' },
  });
}

export const styles = getThemeStyles(false);

export const ThemeContext = createContext({
  isDark: false,
  styles: getThemeStyles(false),
});
