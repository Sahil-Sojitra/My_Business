import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/common/AppHeader';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { EmptyState } from '../../components/common/EmptyState';
import { PlusIcon } from '../../components/common/Icon';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { NativeAdCard } from '../../components/common/NativeAdCard';
import { alertService } from '../../context/AlertContext';
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

/**
 * Sorts bills logically by due date urgency rather than random creation timestamp:
 * 1. OVERDUE tab: Earliest overdue date first (most urgent, oldest past-due).
 * 2. PENDING tab: Closest upcoming deadline first.
 * 3. ALL tab: Overdue bills at top, then upcoming active bills, then bills without due date, then settled.
 * 4. PAID tab: Most recent date first.
 */
function sortBillsByDueDate(
  bills: Transaction[],
  tab: FilterTab,
  todayIso: string
): Transaction[] {
  return [...bills].sort((a, b) => {
    const isOverdueA =
      a.status === 'OVERDUE' ||
      (a.status !== 'PAID' && Boolean(a.dueDate && a.dueDate < todayIso));
    const isOverdueB =
      b.status === 'OVERDUE' ||
      (b.status !== 'PAID' && Boolean(b.dueDate && b.dueDate < todayIso));
    const isPaidA = a.status === 'PAID';
    const isPaidB = b.status === 'PAID';

    if (tab === 'OVERDUE') {
      const dueA = a.dueDate || a.date;
      const dueB = b.dueDate || b.date;
      return dueA.localeCompare(dueB);
    }

    if (tab === 'PENDING') {
      if (a.dueDate && b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.date.localeCompare(a.date);
    }

    if (tab === 'OUTSTANDING') {
      const dateA = a.dueDate || a.date;
      const dateB = b.dueDate || b.date;
      return dateB.localeCompare(dateA);
    }

    if (tab === 'PAID') {
      return b.date.localeCompare(a.date);
    }

    // ALL tab hierarchy:
    // 1. Overdue bills at top
    if (isOverdueA && !isOverdueB) return -1;
    if (!isOverdueA && isOverdueB) return 1;
    if (isOverdueA && isOverdueB) {
      const dueA = a.dueDate || a.date;
      const dueB = b.dueDate || b.date;
      return dueA.localeCompare(dueB);
    }

    // 2. Active upcoming bills before settled
    if (!isPaidA && isPaidB) return -1;
    if (isPaidA && !isPaidB) return 1;

    // Both are active pending
    if (!isPaidA && !isPaidB) {
      if (a.dueDate && b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.date.localeCompare(a.date);
    }

    // Both are paid
    return b.date.localeCompare(a.date);
  });
}

export const TransactionListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const filterCompanyId = navigation.params?.companyId as string | undefined;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [billToSettle, setBillToSettle] = useState<Transaction | null>(null);
  const [settling, setSettling] = useState<boolean>(false);

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
    if (navigation.currentScreen === 'TransactionList') {
      loadTransactions();
    }
  }, [loadTransactions, navigation.currentScreen]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const handleConfirmSettle = async () => {
    if (!billToSettle) return;
    setSettling(true);
    try {
      await transactionService.settleBill(billToSettle.id);
      alertService.showSuccess(
        'Bill Settled Successfully!',
        `Bill for ${billToSettle.companyName} is marked complete and moved to the Settled tab.`
      );
      setBillToSettle(null);
      loadTransactions();
    } catch (err: unknown) {
      alertService.showError(
        'Failed to Settle Bill',
        err instanceof Error ? err.message : 'Please try again later.'
      );
    } finally {
      setSettling(false);
    }
  };

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Dynamically resolve bill status so overdue bills are immediately recognized
  const resolvedTransactions = useMemo(() => {
    return transactions.map(item => {
      if (item.status !== 'PAID' && item.dueDate && item.dueDate < todayIso) {
        return { ...item, status: 'OVERDUE' as const };
      }
      return item;
    });
  }, [transactions, todayIso]);

  const filteredBills = useMemo(() => {
    const list = resolvedTransactions.filter(item => {
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

    return sortBillsByDueDate(list, filterTab, todayIso);
  }, [resolvedTransactions, filterTab, searchQuery, todayIso]);

  const listData: TransactionListItem[] = useMemo(() => {
    // Only show ad slots when there are at least 6 actual transaction records available
    if (filteredBills.length < 6) {
      return filteredBills.map(b => ({ type: 'transaction', data: b }));
    }

    const items: TransactionListItem[] = [];
    for (let i = 0; i < filteredBills.length; i++) {
      if (i === 5) {
        // Place first ad after the 5th transaction (between index 4 and index 5)
        items.push({ type: 'native_ad', id: 'tx-list-native-ad-1' });
      } else if (i === 15 && filteredBills.length >= 16) {
        // Place second ad after the 15th transaction (between index 14 and index 15)
        items.push({ type: 'native_ad', id: 'tx-list-native-ad-2' });
      } else if (i === 25 && filteredBills.length >= 26) {
        // Place third ad after the 25th transaction (between index 24 and index 25)
        items.push({ type: 'native_ad', id: 'tx-list-native-ad-3' });
      }
      items.push({ type: 'transaction', data: filteredBills[i] });
    }
    return items;
  }, [filteredBills]);

  const totalPrincipal = transactions.reduce((acc, t) => acc + t.amount, 0);
  const totalDalali = transactions.reduce((acc, t) => {
    const rate = t.dalaliRate ?? t.monthlyInterestRate ?? 1.0;
    return acc + (t.dalaliAmount ?? (t.amount * rate) / 100);
  }, 0);

  const fabStyle = useMemo(
    () => [
      styles.fabButton,
      { bottom: Math.max(insets.bottom, 16) + 16 },
    ],
    [insets.bottom],
  );

  const handleItemPress = useCallback(
    (id: string) => {
      navigation.navigate('TransactionDetails', {
        transactionId: id,
      });
    },
    [navigation],
  );

  const handleItemSettle = useCallback((item: Transaction) => {
    setBillToSettle(item);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: TransactionListItem }) => {
      if (item.type === 'native_ad') {
        return <NativeAdCard />;
      }
      return (
        <TransactionListItemCard
          item={item.data}
          onPress={() => handleItemPress(item.data.id)}
          onSettle={
            item.data.status !== 'PAID'
              ? () => handleItemSettle(item.data)
              : undefined
          }
        />
      );
    },
    [handleItemPress, handleItemSettle],
  );

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

      {/* Status Filter Tabs (Horizontal scrollable overflow with larger buttons) */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}>
          {(['ALL', 'PENDING', 'OVERDUE', 'OUTSTANDING', 'PAID'] as FilterTab[]).map(tab => (
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
                  ? 'Pending'
                  : tab === 'OVERDUE'
                  ? 'Overdue'
                  : tab === 'OUTSTANDING'
                  ? 'Outstanding'
                  : 'Settled'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              title={
                searchQuery
                  ? 'No matching bills'
                  : filterTab === 'PAID'
                  ? 'No settled bills yet'
                  : filterTab === 'OVERDUE'
                  ? 'No overdue bills'
                  : filterTab === 'OUTSTANDING'
                  ? 'No outstanding bills'
                  : filterTab === 'PENDING'
                  ? 'No pending bills'
                  : 'No bills recorded yet'
              }
              description={
                searchQuery
                  ? `No entry found for "${searchQuery}".`
                  : filterTab === 'PAID'
                  ? 'Bills you mark as settled will appear here in the Settled tab.'
                  : filterTab === 'OUTSTANDING'
                  ? 'Bills marked as ready to be settled will appear here.'
                  : filterTab === 'PENDING'
                  ? 'Bills that are pending payment will appear here.'
                  : 'Record client sales bills to track amounts and accrued interest.'
              }
              icon={
                filterTab === 'PAID'
                  ? '✅'
                  : filterTab === 'OUTSTANDING'
                  ? '⏳'
                  : '🧾'
              }
              actionTitle={
                searchQuery
                  ? 'Clear Search'
                  : filterTab === 'PAID' || filterTab === 'OUTSTANDING'
                  ? 'View All Bills'
                  : '+ Record New Bill'
              }
              onAction={
                searchQuery
                  ? () => setSearchQuery('')
                  : filterTab === 'PAID' || filterTab === 'OUTSTANDING'
                  ? () => setFilterTab('ALL')
                  : () =>
                      navigation.navigate('TransactionForm', {
                        defaultCompanyId: filterCompanyId,
                      })
              }
            />
          }
          renderItem={renderItem}
        />
      )}

      {/* Settle Bill Confirmation Modal */}
      <ConfirmModal
        visible={Boolean(billToSettle)}
        title="Settle Bill?"
        message={`Are you sure you want to settle this bill for ${billToSettle?.companyName}? The bill status will be marked complete and moved to the Settled tab.`}
        confirmText="Mark as Settled"
        confirmVariant="success"
        destructive={false}
        loading={settling}
        onConfirm={handleConfirmSettle}
        onCancel={() => setBillToSettle(null)}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={fabStyle}
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
