import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppHeader } from '../../components/common/AppHeader';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useNavigation } from '../../navigation/NavigationContext';
import { transactionService } from '../../services';
import { Transaction, TransactionStatus } from '../../types/transaction';
import { calculateAccruedBillInterest } from '../../utils/calculator';
import { formatCurrency, formatDate } from '../../utils/formatters';

type FilterTab = 'ALL' | TransactionStatus;

export const TransactionListScreen: React.FC = () => {
  const navigation = useNavigation();
  const filterCompanyId = navigation.params?.companyId as string | undefined;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await transactionService.getAll(filterCompanyId);
      setTransactions(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterCompanyId]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const filteredBills = transactions.filter(item => {
    // Status filter
    if (filterTab !== 'ALL' && item.status !== filterTab) {
      return false;
    }

    // Search query
    if (!searchQuery.trim()) {
      return true;
    }
    const q = searchQuery.toLowerCase();
    return (
      item.companyName.toLowerCase().includes(q) ||
      (item.billNumber && item.billNumber.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  // Calculate overall metrics
  const totalPrincipal = transactions.reduce((acc, t) => acc + t.amount, 0);
  const totalAccruedInterest = transactions.reduce((acc, t) => {
    if (t.status === 'PAID') {
      return acc;
    }
    const monthlyRate =
      t.monthlyInterestRate ?? (t.interestRate ? t.interestRate / 12 : 1.5);
    const stats = calculateAccruedBillInterest(
      t.amount,
      monthlyRate,
      t.interestStartDate || t.date
    );
    return acc + stats.accruedInterest;
  }, 0);
  const grandTotalWithInterest = totalPrincipal + totalAccruedInterest;

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Bills & Invoices"
        subtitle={`${transactions.length} sales bills tracked`}
        showBack={true}
        rightAction={{
          label: '+ Add Bill',
          onPress: () =>
            navigation.navigate('TransactionForm', {
              defaultCompanyId: filterCompanyId,
            }),
          variant: 'primary',
        }}
      />

      {/* Aggregate Interest Summary Card */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Total Principal</Text>
          <Text style={styles.summaryVal}>
            {formatCurrency(totalPrincipal)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Accrued Interest</Text>
          <Text style={[styles.summaryVal, styles.interestVal]}>
            +{formatCurrency(totalAccruedInterest)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Total Payable</Text>
          <Text style={styles.summaryVal}>
            {formatCurrency(grandTotalWithInterest)}
          </Text>
        </View>
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.tabsContainer}>
        {(['ALL', 'PENDING', 'OVERDUE', 'PAID'] as FilterTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilterTab(tab)}
            style={[styles.tabButton, filterTab === tab && styles.tabButtonActive]}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.tabText,
                filterTab === tab && styles.tabTextActive,
              ]}>
              {tab === 'ALL'
                ? 'All'
                : tab === 'PENDING'
                ? 'Active'
                : tab === 'OVERDUE'
                ? 'Overdue'
                : 'Settled'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by buyer company, invoice #, note..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
        />
        {searchQuery ? (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading && !refreshing ? (
        <LoadingSpinner message="Loading bills & interest..." />
      ) : (
        <FlatList
          data={filteredBills}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              title={
                searchQuery ? 'No matching bills' : 'No bills recorded yet'
              }
              description={
                searchQuery
                  ? `No entry found for "${searchQuery}".`
                  : 'Record client sales bills to track amounts and accrued interest.'
              }
              icon="🧾"
              actionTitle={searchQuery ? 'Clear Search' : '+ Record New Bill'}
              onAction={
                searchQuery
                  ? () => setSearchQuery('')
                  : () =>
                      navigation.navigate('TransactionForm', {
                        defaultCompanyId: filterCompanyId,
                      })
              }
            />
          }
          renderItem={({ item }) => {
            const monthlyRate =
              item.monthlyInterestRate ??
              (item.interestRate ? item.interestRate / 12 : 1.5);
            const stats = calculateAccruedBillInterest(
              item.amount,
              monthlyRate,
              item.interestStartDate || item.date
            );

            return (
              <Card
                onPress={() =>
                  navigation.navigate('TransactionDetails', {
                    transactionId: item.id,
                  })
                }
                style={styles.txCard}>
                <View style={styles.txHeader}>
                  <View style={styles.companyInfo}>
                    <Text style={styles.companyName} numberOfLines={1}>
                      {item.companyName}
                    </Text>
                    <Text style={styles.billNumber}>
                      {item.billNumber ? `Inv: ${item.billNumber} · ` : ''}
                      {formatDate(item.date)}
                    </Text>
                  </View>

                  <View style={styles.amountContainer}>
                    <Text style={styles.totalAmount}>
                      {formatCurrency(stats.totalWithInterest)}
                    </Text>
                    <Text style={styles.interestSub}>
                      +{formatCurrency(stats.accruedInterest)} int.
                    </Text>
                  </View>
                </View>

                <View style={styles.txFooter}>
                  <View style={styles.badgeRow}>
                    <Badge status={item.status} />
                    <View style={styles.rateTag}>
                      <Text style={styles.rateTagText}>
                        {monthlyRate}% / mo · {stats.daysElapsed}d
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.viewLink}>View breakdown →</Text>
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  interestVal: {
    color: '#15803D',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#2563EB',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 38,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  clearBtn: {
    paddingHorizontal: 8,
  },
  clearBtnText: {
    fontSize: 14,
    color: '#64748B',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  txCard: {
    padding: 16,
    marginBottom: 10,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  companyInfo: {
    flex: 1,
    marginRight: 12,
  },
  companyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  billNumber: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  interestSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
    marginTop: 2,
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rateTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rateTagText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  viewLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
});
