import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppHeader } from '../../components/common/AppHeader';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigation } from '../../navigation/NavigationContext';
import { companyService, transactionService } from '../../services';
import { Company } from '../../types/company';
import { Transaction } from '../../types/transaction';
import { calculateAccruedBillInterest } from '../../utils/calculator';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [bills, setBills] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const [fetchedCompanies, fetchedBills] = await Promise.all([
        companyService.getAll(),
        transactionService.getAll(),
      ]);
      setCompanies(fetchedCompanies);
      setBills(fetchedBills);
    } catch {
      // fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  // Metrics: Calculate bill totals and accrued interest using monthly rate
  const activeBills = bills.filter(b => b.status !== 'PAID');
  const totalPrincipal = activeBills.reduce((acc, b) => acc + b.amount, 0);

  const totalAccruedInterest = activeBills.reduce((acc, b) => {
    const monthlyRate =
      b.monthlyInterestRate ?? (b.interestRate ? b.interestRate / 12 : 1.5);
    const stats = calculateAccruedBillInterest(
      b.amount,
      monthlyRate,
      b.interestStartDate || b.date
    );
    return acc + stats.accruedInterest;
  }, 0);

  const grandTotalReceivable = totalPrincipal + totalAccruedInterest;

  if (loading && !refreshing) {
    return <LoadingSpinner message="Loading broker portfolio..." />;
  }

  const hasData = companies.length > 0 || bills.length > 0;

  return (
    <View style={styles.screen}>
      <AppHeader
        title="My Business"
        subtitle={user?.businessName || 'Brokerage Portfolio'}
        rightAction={{
          label: 'Logout',
          onPress: () => setShowLogoutModal(true),
          variant: 'danger',
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Welcome Section */}
        <View style={styles.welcomeBanner}>
          <Text style={styles.greeting}>Welcome, {user?.name || 'Broker'}</Text>
          <Text style={styles.greetingSub}>
            Brokerage deal & bill interest management
          </Text>
        </View>

        {/* Hero Card: Total Receivable with Interest */}
        <Card style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroLabel}>Total Receivable (With Interest)</Text>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>
                {activeBills.length} Active Bills
              </Text>
            </View>
          </View>

          <Text style={styles.heroValue}>
            {formatCurrency(grandTotalReceivable)}
          </Text>

          <View style={styles.heroMetricsRow}>
            <View style={styles.heroMetricCol}>
              <Text style={styles.heroSubLabel}>Principal Billed</Text>
              <Text style={styles.heroSubVal}>
                {formatCurrency(totalPrincipal)}
              </Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetricCol}>
              <Text style={styles.heroSubLabel}>Accrued Interest</Text>
              <Text style={[styles.heroSubVal, styles.interestVal]}>
                +{formatCurrency(totalAccruedInterest)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Counts Grid */}
        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Buyer Companies</Text>
            <Text style={styles.summaryValue}>{companies.length}</Text>
            <Text style={styles.summaryHint}>Registered firms</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Bills</Text>
            <Text style={styles.summaryValue}>{bills.length}</Text>
            <Text style={styles.summaryHint}>
              {activeBills.length} pending · {bills.length - activeBills.length}{' '}
              settled
            </Text>
          </Card>
        </View>

        {/* Quick Actions (Interest calculator removed from here as requested) */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CompanyList')}>
            <View style={[styles.actionIconCircle, styles.actionIconBlue]}>
              <Text style={styles.actionIcon}>🏢</Text>
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Buyer Companies</Text>
              <Text style={styles.actionSubtitle}>
                Manage client firms, GST & ledger
              </Text>
            </View>
            <Text style={styles.actionChevron}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('TransactionList')}>
            <View style={[styles.actionIconCircle, styles.actionIconGreen]}>
              <Text style={styles.actionIcon}>🧾</Text>
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Bills & Interest Tracking</Text>
              <Text style={styles.actionSubtitle}>
                Track sales bills and live accrued interest
              </Text>
            </View>
            <Text style={styles.actionChevron}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Bills with Interest */}
        <Text style={styles.sectionTitle}>Recent Bills & Interest</Text>
        {!hasData ? (
          <EmptyState
            title="No Companies or Bills Yet"
            description="Add your first client firm and record sales bills to start tracking interest."
            actionTitle="+ Add Buyer Company"
            onAction={() => navigation.navigate('CompanyForm')}
          />
        ) : (
          <View style={styles.recentList}>
            {bills.slice(0, 3).map(item => {
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
                  key={item.id}
                  onPress={() =>
                    navigation.navigate('TransactionDetails', {
                      transactionId: item.id,
                    })
                  }
                  style={styles.recentCard}>
                  <View style={styles.recentRow}>
                    <View style={styles.recentMain}>
                      <Text style={styles.recentCompany} numberOfLines={1}>
                        {item.companyName}
                      </Text>
                      <Text style={styles.recentMeta}>
                        {item.billNumber ? `${item.billNumber} · ` : ''}
                        {formatDate(item.date)} · {monthlyRate}% / month
                      </Text>
                    </View>
                    <View style={styles.recentRight}>
                      <Text style={styles.recentAmount}>
                        {formatCurrency(stats.totalWithInterest)}
                      </Text>
                      <Text style={styles.recentInterest}>
                        +{formatCurrency(stats.accruedInterest)} int.
                      </Text>
                      <Badge status={item.status} />
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        destructive={true}
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
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
    paddingBottom: 32,
  },
  welcomeBanner: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  greetingSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
    padding: 16,
    marginBottom: 12,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  heroValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  heroMetricCol: {
    flex: 1,
  },
  heroDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  heroSubLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  heroSubVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  interestVal: {
    color: '#15803D',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 4,
  },
  summaryHint: {
    fontSize: 11,
    color: '#94A3B8',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 12,
  },
  actionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionIconBlue: {
    backgroundColor: '#EFF6FF',
  },
  actionIconGreen: {
    backgroundColor: '#F0FDF4',
  },
  actionIcon: {
    fontSize: 20,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionChevron: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '600',
  },
  recentList: {
    marginBottom: 16,
  },
  recentCard: {
    padding: 14,
    marginBottom: 8,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentMain: {
    flex: 1,
    marginRight: 12,
  },
  recentCompany: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  recentMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  recentRight: {
    alignItems: 'flex-end',
  },
  recentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  recentInterest: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
    marginBottom: 4,
  },
});
