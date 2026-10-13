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
import { calculateAccruedBillInterest } from '../../utils/calculator';
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
    return <LoadingSpinner message="Loading company profile & ledger..." />;
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
  const totalAccruedInterest = bills.reduce((acc, b) => {
    if (b.status === 'PAID') {
      return acc;
    }
    const stats = calculateAccruedBillInterest(
      b.amount,
      b.interestRate ?? 12,
      b.interestStartDate || b.date
    );
    return acc + stats.accruedInterest;
  }, 0);
  const totalPayableWithInterest = totalPrincipal + totalAccruedInterest;

  return (
    <View style={styles.screen}>
      <AppHeader
        title={company.name}
        subtitle="Buyer Firm Profile"
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

        {/* Ledger & Interest Summary */}
        <Card style={styles.ledgerCard}>
          <Text style={styles.ledgerTitle}>
            Financial Ledger & Interest Due
          </Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Principal Billed</Text>
              <Text style={styles.metricVal}>
                {formatCurrency(totalPrincipal)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Accrued Interest</Text>
              <Text style={[styles.metricVal, styles.interestVal]}>
                +{formatCurrency(totalAccruedInterest)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Due</Text>
              <Text style={[styles.metricVal, styles.dueVal]}>
                {formatCurrency(totalPayableWithInterest)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Bills for this company */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Bills & Invoices ({bills.length})
          </Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('TransactionForm', {
                defaultCompanyId: company.id,
              })
            }
            activeOpacity={0.7}
            style={styles.addTxBtn}>
            <Text style={styles.addTxText}>+ Record New Bill</Text>
          </TouchableOpacity>
        </View>

        {bills.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No bills recorded for this company yet.
            </Text>
          </Card>
        ) : (
          bills.map(item => {
            const stats = calculateAccruedBillInterest(
              item.amount,
              item.interestRate ?? 12,
              item.interestStartDate || item.date
            );

            return (
              <Card
                key={item.id}
                onPress={() =>
                  navigation.navigate('TransactionDetails', {
                    transactionId: item.id,
                  })
                }
                style={styles.txCard}>
                <View style={styles.txRow}>
                  <View style={styles.txLeft}>
                    <View style={styles.badgeRow}>
                      <Badge status={item.status} />
                      <View style={styles.rateTag}>
                        <Text style={styles.rateTagText}>
                          {item.interestRate ?? 12}% p.a.
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.txNumber}>
                      {item.billNumber ? `Bill #${item.billNumber}` : 'Direct bill'}
                    </Text>
                    <Text style={styles.txDate}>
                      {formatDate(item.date)} · {stats.daysElapsed} days
                    </Text>
                  </View>

                  <View style={styles.txRight}>
                    <Text style={styles.txTotalAmount}>
                      {formatCurrency(stats.totalWithInterest)}
                    </Text>
                    <Text style={styles.txInterest}>
                      +{formatCurrency(stats.accruedInterest)} int.
                    </Text>
                    <Text style={styles.txChevron}>→</Text>
                  </View>
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
    padding: 18,
    marginBottom: 12,
  },
  nameHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  ownerText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    maxWidth: '65%',
    textAlign: 'right',
  },
  infoValueBold: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  notesContainer: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  ledgerCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  ledgerTitle: {
    fontSize: 14,
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
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 14,
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
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  addTxBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addTxText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  txCard: {
    padding: 14,
    marginBottom: 8,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txLeft: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  rateTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rateTagText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '700',
  },
  txNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  txDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txTotalAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 1,
  },
  txInterest: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
    marginBottom: 2,
  },
  txChevron: {
    fontSize: 14,
    color: '#94A3B8',
  },
  deleteBtn: {
    marginTop: 20,
  },
});
