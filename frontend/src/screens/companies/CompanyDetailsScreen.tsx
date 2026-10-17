import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppHeader } from '../../components/common/AppHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useNavigation } from '../../navigation/NavigationContext';
import { companyService, transactionService } from '../../services';
import { Company } from '../../types/company';
import { Transaction } from '../../types/transaction';
import {
  formatCurrency,
  formatDate,
  formatPhone,
} from '../../utils/formatters';

export const CompanyDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const companyId = navigation.params?.companyId as string | undefined;

  const [company, setCompany] = useState<Company | null>(null);
  const [bills, setBills] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    try {
      const [comp, txs] = await Promise.all([
        companyService.getById(companyId),
        transactionService.getAll(companyId),
      ]);
      setCompany(comp);
      setBills(txs);
    } catch {
      // error handled
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!companyId) {
      return;
    }
    setDeleting(true);
    try {
      await Promise.all([
        companyService.delete(companyId),
        transactionService.deleteByCompanyId(companyId),
      ]);
      setShowDeleteModal(false);
      Alert.alert(
        'Company Deleted',
        'The company and associated bill records were removed.'
      );
      navigation.navigate('CompanyList');
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to delete company'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading buyer firm profile & ledger..." />;
  }

  if (!company) {
    return (
      <View style={styles.screen}>
        <AppHeader title="Company Details" showBack={true} />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Company not found</Text>
          <Button
            title="Back to Companies"
            onPress={() => navigation.navigate('CompanyList')}
            style={styles.backBtn}
          />
        </View>
      </View>
    );
  }

  // Calculate company financial totals
  const totalPrincipal = bills.reduce((acc, b) => acc + b.amount, 0);
  const totalDalali = bills.reduce((acc, b) => {
    const rate = b.dalaliRate ?? b.monthlyInterestRate ?? 1.5;
    return acc + (b.dalaliAmount ?? (b.amount * rate) / 100);
  }, 0);

  // Sort bills by closest Due Date first (ascending by due date)
  const sortedBills = [...bills].sort((a, b) => {
    const timeA = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.date).getTime();
    const timeB = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.date).getTime();
    return timeA - timeB;
  });

  const getDueDaysLabel = (dueDateStr?: string) => {
    if (!dueDateStr) {
      return null;
    }
    const target = new Date(dueDateStr);
    const now = new Date();
    // Normalize to midnight
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
    }
    if (diffDays === 0) {
      return { text: 'Due today', isOverdue: false, isNear: true };
    }
    if (diffDays <= 7) {
      return { text: `Due in ${diffDays}d`, isOverdue: false, isNear: true };
    }
    return { text: `Due in ${diffDays}d`, isOverdue: false, isNear: false };
  };

  return (
    <View style={styles.screen}>
      <AppHeader
        title={company.name}
        subtitle="Buyer Firm Ledger & Dalali"
        showBack={true}
        rightAction={{
          label: 'Edit',
          onPress: () =>
            navigation.navigate('CompanyForm', { companyId: company.id }),
          variant: 'primary',
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card style={styles.mainCard}>
          <Text style={styles.nameHeader}>{company.name}</Text>
          {company.ownerName ? (
            <Text style={styles.ownerText}>Contact: {company.ownerName}</Text>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>
              {formatPhone(company.contactNumber)}
            </Text>
          </View>

          {company.email ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{company.email}</Text>
            </View>
          ) : null}

          {company.gstin ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>GSTIN / Tax ID</Text>
              <Text style={styles.infoValueBold}>{company.gstin}</Text>
            </View>
          ) : null}

          {company.address ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{company.address}</Text>
            </View>
          ) : null}

          {company.notes ? (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes & Terms</Text>
              <Text style={styles.notesText}>{company.notes}</Text>
            </View>
          ) : null}
        </Card>

        {/* Ledger & Total Dalali Summary */}
        <Card style={styles.ledgerCard}>
          <Text style={styles.ledgerTitle}>
            Firm Ledger & Total Dalali
          </Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Bill Turnover</Text>
              <Text style={styles.metricVal}>
                {formatCurrency(totalPrincipal)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Dalali Receivable</Text>
              <Text style={[styles.metricVal, styles.interestVal]}>
                +{formatCurrency(totalDalali)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Bills for this company (Sorted by Nearest Due Date First) */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Bills & Invoices ({bills.length})
            </Text>
            <Text style={styles.sortHint}>
              Sorted by nearest payment due date first
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('TransactionForm', {
                defaultCompanyId: company.id,
              })
            }
            activeOpacity={0.7}
            style={styles.addTxBtn}>
            <Text style={styles.addTxText}>+ Record Bill</Text>
          </TouchableOpacity>
        </View>

        {sortedBills.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No bills recorded for this company yet.
            </Text>
          </Card>
        ) : (
          sortedBills.map(item => {
            const dalaliRate =
              item.dalaliRate ??
              item.monthlyInterestRate ??
              (item.interestRate ? item.interestRate / 12 : 1.5);
            const dalaliAmount =
              item.dalaliAmount ?? (item.amount * dalaliRate) / 100;
            const dueInfo = getDueDaysLabel(item.dueDate);

            return (
              <Card
                key={item.id}
                onPress={() =>
                  navigation.navigate('TransactionDetails', {
                    transactionId: item.id,
                  })
                }
                style={[
                  styles.txCard,
                  dueInfo?.isOverdue && styles.txCardOverdue,
                  dueInfo?.isNear && styles.txCardNear,
                ]}>
                <View style={styles.txHeaderRow}>
                  <View style={styles.txHeaderLeft}>
                    <Text style={styles.txNumber}>
                      {item.billNumber ? `Bill #${item.billNumber}` : 'Direct Bill'}
                    </Text>
                    <Text style={styles.txDate}>
                      Billed: {formatDate(item.date)}
                    </Text>
                  </View>

                  <View style={styles.txHeaderRight}>
                    <Badge status={item.status} />
                    {dueInfo ? (
                      <View
                        style={[
                          styles.dueBadge,
                          dueInfo.isOverdue && styles.dueBadgeOverdue,
                          dueInfo.isNear && styles.dueBadgeNear,
                        ]}>
                        <Text
                          style={[
                            styles.dueBadgeText,
                            dueInfo.isOverdue && styles.dueBadgeTextOverdue,
                            dueInfo.isNear && styles.dueBadgeTextNear,
                          ]}>
                          {dueInfo.text}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {item.dueDate ? (
                  <View style={styles.dueDateRow}>
                    <Text style={styles.dueDateLabel}>
                      Payment Due:{' '}
                      <Text style={styles.dueDateVal}>
                        {formatDate(item.dueDate)}
                      </Text>
                    </Text>
                  </View>
                ) : null}

                {/* Explicit Dalali and Principal Breakdown in Card */}
                <View style={styles.cardFinancialsRow}>
                  <View style={styles.cardFinancialCol}>
                    <Text style={styles.cardFinLabel}>Bill Amount</Text>
                    <Text style={styles.cardFinVal}>
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>

                  <View style={styles.cardFinancialDivider} />

                  <View style={styles.cardFinancialCol}>
                    <Text style={styles.cardFinLabel}>
                      Dalali ({dalaliRate}%)
                    </Text>
                    <Text style={[styles.cardFinVal, styles.cardInterestVal]}>
                      +{formatCurrency(dalaliAmount)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardDaysText}>
                    {dalaliRate}% Dalali commission
                  </Text>
                  <Text style={styles.viewLink}>View details →</Text>
                </View>
              </Card>
            );
          })
        )}

        {/* Delete action */}
        <Button
          title="Delete Company"
          onPress={() => setShowDeleteModal(true)}
          variant="danger"
          size="md"
          style={styles.deleteBtn}
        />
      </ScrollView>

      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Company?"
        message={`Are you sure you want to delete "${company.name}"? This will remove all associated bills and interest tracking for this firm.`}
        confirmText="Delete Company"
        destructive={true}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
  viewLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  deleteBtn: {
    marginTop: 20,
  },
});
