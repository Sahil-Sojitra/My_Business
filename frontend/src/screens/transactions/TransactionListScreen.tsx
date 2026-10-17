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

  // Calculate overall Dalali metrics
  const totalPrincipal = transactions.reduce((acc, t) => acc + t.amount, 0);
  const totalDalali = transactions.reduce((acc, t) => {
    const rate = t.dalaliRate ?? t.monthlyInterestRate ?? 1.5;
    return acc + (t.dalaliAmount ?? (t.amount * rate) / 100);
  }, 0);

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

      {/* Aggregate Dalali Summary Card */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Total Bill Turnover</Text>
          <Text style={styles.summaryVal}>
            {formatCurrency(totalPrincipal)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Total Dalali Receivable</Text>
          <Text style={[styles.summaryVal, styles.interestVal]}>
            +{formatCurrency(totalDalali)}
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
            const dalaliRate =
              item.dalaliRate ??
              item.monthlyInterestRate ??
              (item.interestRate ? item.interestRate / 12 : 1.5);
            const dalaliAmount =
              item.dalaliAmount ?? (item.amount * dalaliRate) / 100;

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
                      {formatCurrency(dalaliAmount)}
                    </Text>
                    <Text style={styles.interestSub}>
                      {dalaliRate}% on {formatCurrency(item.amount)}
                    </Text>
                  </View>
                </View>

                <View style={styles.txFooter}>
                  <View style={styles.badgeRow}>
                    <Badge status={item.status} />
                    <View style={styles.rateTag}>
                      <Text style={styles.rateTagText}>
                        {dalaliRate}% Dalali
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
    paddingVertical: 14,
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
    fontSize: 12,
    color: '#64748B',
    marginBottom: 3,
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 15,
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
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#2563EB',
  },
  tabText: {
    fontSize: 13,
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
    height: 46,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  clearBtn: {
    paddingHorizontal: 8,
  },
  clearBtnText: {
    fontSize: 15,
    color: '#64748B',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  txCard: {
    padding: 17,
    borderRadius: 14,
    marginBottom: 12,
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
    fontSize: 16.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  billNumber: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  interestSub: {
    fontSize: 12.5,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  rateTagText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  viewLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
});
