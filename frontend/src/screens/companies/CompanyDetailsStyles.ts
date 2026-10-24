import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  notFoundContainer: {
    padding: 24,
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  backBtn: {
    minWidth: 160,
  },
  mainCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nameHeader: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  ownerText: {
    fontSize: 14.5,
    color: colors.textSecondary,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    maxWidth: '65%',
    textAlign: 'right',
  },
  infoValueBold: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  notesContainer: {
    marginTop: 10,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13.5,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  ledgerCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ledgerTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  interestVal: {
    color: colors.champagneDark,
    fontWeight: '800',
  },
  dueVal: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 17.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sortHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addTxBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.champagneLight,
    borderWidth: 1,
    borderColor: colors.champagneBorder,
  },
  addTxText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyCard: {
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  txCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  txCardNear: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  txHeaderLeft: {
    flex: 1,
  },
  txHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  txDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dueBadge: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  dueBadgeNear: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warningBorder,
  },
  dueBadgeOverdue: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
  },
  dueBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dueBadgeTextNear: {
    color: colors.warningText,
  },
  dueBadgeTextOverdue: {
    color: colors.errorText,
  },
  dueDateRow: {
    backgroundColor: colors.background,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dueDateLabel: {
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  dueDateVal: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardFinancialsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  cardFinancialCol: {
    flex: 1,
    alignItems: 'center',
  },
  cardFinancialDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  cardFinLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  cardFinVal: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardInterestVal: {
    color: colors.champagneDark,
    fontWeight: '800',
  },
  cardTotalVal: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  cardDaysText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  viewLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  deleteBtn: {
    marginTop: 20,
  },
});
