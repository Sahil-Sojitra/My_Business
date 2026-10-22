import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/common/AppHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { PlusIcon } from '../../components/common/Icon';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { NativeAdCard } from '../../components/common/NativeAdCard';
import { useNavigation } from '../../navigation/NavigationContext';
import { transactionService } from '../../services';
import { Transaction, TransactionStatus } from '../../types/transaction';
import { TransactionListItemCard } from './components/TransactionListItemCard';
import { TransactionListSummaryBar } from './components/TransactionListSummaryBar';
import { styles } from './TransactionListStyles';

type FilterTab = 'ALL' | TransactionStatus;

type TransactionListItem =
  | { type: 'transaction'; data: Transaction }
  | { type: 'native_ad'; id: string };

export const TransactionListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
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
    if (filterTab !== 'ALL' && item.status !== filterTab) {
      return false;
    }
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

  const listData: TransactionListItem[] = useMemo(() => {
    // Only show an ad slot when there are at least 6 actual transaction records available
    if (filteredBills.length < 6) {
      return filteredBills.map(b => ({ type: 'transaction', data: b }));
    }

    const items: TransactionListItem[] = [];
    for (let i = 0; i < filteredBills.length; i++) {
      if (i === 5) {
        // Place it after the fifth transaction (between index 4 and index 5)
        items.push({ type: 'native_ad', id: 'tx-list-native-ad-1' });
      }
      items.push({ type: 'transaction', data: filteredBills[i] });
    }
    return items;
  }, [filteredBills]);

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
      />

      {/* Aggregate Dalali Summary Card */}
      <TransactionListSummaryBar
        totalPrincipal={totalPrincipal}
        totalDalali={totalDalali}
      />

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
          data={listData}
          keyExtractor={item =>
            item.type === 'transaction' ? item.data.id : item.id
          }
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
            if (item.type === 'native_ad') {
              return <NativeAdCard />;
            }
            return (
              <TransactionListItemCard
                item={item.data}
                onPress={() =>
                  navigation.navigate('TransactionDetails', {
                    transactionId: item.data.id,
                  })
                }
              />
            );
          }}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fabButton,
          { bottom: Math.max(insets.bottom, 16) + 16 },
        ]}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('TransactionForm', {
            defaultCompanyId: filterCompanyId,
          })
        }
        accessibilityRole="button"
        accessibilityLabel="Record new bill">
        <PlusIcon size={18} color="#FFFFFF" strokeWidth={2.6} />
        <Text style={styles.fabButtonText}>Record Bill</Text>
      </TouchableOpacity>
    </View>
  );
};
