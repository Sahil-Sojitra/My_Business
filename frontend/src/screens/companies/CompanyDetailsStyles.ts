import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    color: '#64748B',
    marginBottom: 16,
  },
  backBtn: {
    minWidth: 160,
  },
  mainCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 14,
  },
  nameHeader: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  ownerText: {
    fontSize: 14.5,
    color: '#64748B',
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    maxWidth: '65%',
    textAlign: 'right',
  },
  infoValueBold: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },
  notesContainer: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 19,
  },
  ledgerCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  ledgerTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1E293B',
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
    color: '#64748B',
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  interestVal: {
    color: '#15803D',
  },
  dueVal: {
    color: '#0F172A',
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
    color: '#0F172A',
  },
  sortHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addTxBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  addTxText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  emptyCard: {
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  txCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  txCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  txCardNear: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
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
    color: '#0F172A',
  },
  txDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  dueBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  dueBadgeNear: {
    backgroundColor: '#FEF3C7',
  },
  dueBadgeOverdue: {
    backgroundColor: '#FEE2E2',
  },
  dueBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  dueBadgeTextNear: {
    color: '#B45309',
  },
  dueBadgeTextOverdue: {
    color: '#B91C1C',
  },
  dueDateRow: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  dueDateLabel: {
    fontSize: 11.5,
    color: '#64748B',
  },
  dueDateVal: {
    fontWeight: '700',
    color: '#0F172A',
  },
  cardFinancialsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
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
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  cardFinLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  cardFinVal: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardInterestVal: {
    color: '#15803D',
  },
  cardTotalVal: {
    color: '#0F172A',
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
    color: '#64748B',
  },
  viewLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  deleteBtn: {
    marginTop: 20,
  },
});
