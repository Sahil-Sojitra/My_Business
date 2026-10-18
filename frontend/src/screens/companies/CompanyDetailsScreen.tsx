import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AppHeader } from '../../components/common/AppHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useNavigation } from '../../navigation/NavigationContext';
import { companyService, transactionService } from '../../services';
import { Company } from '../../types/company';
import { Transaction } from '../../types/transaction';
import { CompanyBillCard } from './components/CompanyBillCard';
import { CompanyLedgerCard } from './components/CompanyLedgerCard';
import { CompanyProfileCard } from './components/CompanyProfileCard';
import { styles } from './CompanyDetailsStyles';

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
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isNear: false };
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
        <CompanyProfileCard company={company} />

        {/* Ledger & Total Dalali Summary */}
        <CompanyLedgerCard
          totalPrincipal={totalPrincipal}
          totalDalali={totalDalali}
        />

        {/* Bills for this company */}
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
          sortedBills.map(item => (
            <CompanyBillCard
              key={item.id}
              item={item}
              dueInfo={getDueDaysLabel(item.dueDate)}
              onPress={() =>
                navigation.navigate('TransactionDetails', {
                  transactionId: item.id,
                })
              }
            />
          ))
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
