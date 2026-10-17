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
import { transactionService } from '../../services';
import { Transaction } from '../../types/transaction';
import { calculateAccruedBillInterest } from '../../utils/calculator';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const TransactionDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const transactionId = navigation.params?.transactionId as string | undefined;

  const [bill, setBill] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const loadBill = useCallback(async () => {
    if (!transactionId) {
      setLoading(false);
      return;
    }
    try {
      const data = await transactionService.getById(transactionId);
      setBill(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    loadBill();
  }, [loadBill]);

  const handleDelete = async () => {
    if (!transactionId) {
      return;
    }
    setDeleting(true);
    try {
      await transactionService.delete(transactionId);
      setShowDeleteModal(false);
      Alert.alert('Deleted', 'Bill has been deleted successfully.');
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to delete bill'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading bill & interest calculations..." />;
  }

  if (!bill) {
    return (
      <View style={styles.screen}>
        <AppHeader title="Bill Details" showBack={true} />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Bill record not found</Text>
          <Button
            title="Back to Bills"
            onPress={() => navigation.navigate('TransactionList')}
            style={styles.backBtn}
          />
        </View>
      </View>
    );
  }

  // Calculate interest tracking to date based on monthly interest rate
  const startDate = bill.interestStartDate || bill.date;
  const monthlyRate =
    bill.monthlyInterestRate ?? (bill.interestRate ? bill.interestRate / 12 : 1.5);
  const interestStats = calculateAccruedBillInterest(
    bill.amount,
    monthlyRate,
    startDate
  );

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Bill & Interest"
        subtitle={bill.billNumber || 'Invoice Details'}
        showBack={true}
        rightAction={{
          label: 'Edit',
          onPress: () =>
            navigation.navigate('TransactionForm', {
              transactionId: bill.id,
            }),
          variant: 'primary',
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Total Outstanding with Interest Hero Card */}
        <Card style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <Badge status={bill.status} />
            <View style={styles.ratePill}>
              <Text style={styles.ratePillText}>
                {monthlyRate}% / month
              </Text>
            </View>
          </View>

          <Text style={styles.totalPayableLabel}>
            Total Outstanding (Principal + Interest)
          </Text>
          <Text style={styles.totalPayableValue}>
            {formatCurrency(interestStats.totalWithInterest)}
          </Text>

          <View style={styles.heroBreakdownRow}>
            <View style={styles.heroBreakdownItem}>
              <Text style={styles.heroSubLabel}>Principal Billed</Text>
              <Text style={styles.heroSubVal}>
                {formatCurrency(bill.amount)}
              </Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroBreakdownItem}>
              <Text style={styles.heroSubLabel}>Accrued Interest</Text>
              <Text style={[styles.heroSubVal, styles.interestHighlight]}>
                +{formatCurrency(interestStats.accruedInterest)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Live Interest Accrual Card */}
        <Card style={styles.interestCard}>
          <View style={styles.interestCardHeader}>
            <Text style={styles.sectionHeading}>Interest Accrual Summary</Text>
            <Text style={styles.daysBadge}>
              {interestStats.daysElapsed} days elapsed
            </Text>
          </View>

          <View style={styles.accrualGrid}>
            <View style={styles.accrualItem}>
              <Text style={styles.accrualLabel}>Daily Charge</Text>
              <Text style={styles.accrualVal}>
                {formatCurrency(interestStats.dailyInterest)}/day
              </Text>
            </View>
            <View style={styles.accrualItem}>
              <Text style={styles.accrualLabel}>Monthly Charge</Text>
              <Text style={styles.accrualVal}>
                {formatCurrency(interestStats.monthlyInterest)}/month
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.calcShortcutBtn}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('TransactionForm', {
                transactionId: bill.id,
              })
            }>
            <Text style={styles.calcShortcutText}>
              🧮 Open Interactive Calculator in Bill →
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Bill & Client Details Card */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionHeading}>Bill & Buyer Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Buyer Firm / Client</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('CompanyDetails', {
                  companyId: bill.companyId,
                })
              }
              activeOpacity={0.7}>
              <Text style={styles.companyLink}>
                {bill.companyName} →
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Invoice / Bill Number</Text>
            <Text style={styles.infoValue}>
              {bill.billNumber || 'None specified'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bill Date</Text>
            <Text style={styles.infoValue}>{formatDate(bill.date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Interest Starts From</Text>
            <Text style={styles.infoValue}>{formatDate(startDate)}</Text>
          </View>

          {bill.dueDate ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Agreed Due Date</Text>
              <Text style={styles.infoValue}>{formatDate(bill.dueDate)}</Text>
            </View>
          ) : null}

          {bill.description ? (
            <View style={styles.descContainer}>
              <Text style={styles.descLabel}>Goods & Consignment Notes</Text>
              <Text style={styles.descText}>{bill.description}</Text>
            </View>
          ) : null}
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <Button
            title="Delete Bill"
            onPress={() => setShowDeleteModal(true)}
            variant="danger"
            size="md"
          />
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Bill?"
        message="Are you sure you want to remove this bill and its interest tracking? This cannot be undone."
        confirmText="Delete"
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
  heroCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  ratePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  ratePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  totalPayableLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  totalPayableValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  heroBreakdownRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  heroBreakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  heroSubLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 3,
  },
  heroSubVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  interestHighlight: {
    color: '#15803D',
  },
  interestCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  interestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  daysBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  accrualGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  accrualItem: {
    flex: 1,
  },
  accrualLabel: {
    fontSize: 13,
    color: '#15803D',
    marginBottom: 2,
  },
  accrualVal: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#166534',
  },
  calcShortcutBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  calcShortcutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  detailsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  companyLink: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '700',
  },
  descContainer: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
  },
  descLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  descText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  buttonGroup: {
    marginTop: 8,
  },
});
