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
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigation } from '../../navigation/NavigationContext';
import { companyService, transactionService } from '../../services';
import { Company } from '../../types/company';
import { Transaction } from '../../types/transaction';
import { formatCurrency } from '../../utils/formatters';
import { ChevronRight } from '../../components/common/Icon';

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

  // Metrics: Calculate total Dalali commission and bill volume
  const activeBills = bills.filter(b => b.status !== 'PAID');
  const totalPrincipal = activeBills.reduce((acc, b) => acc + b.amount, 0);

  const totalDalali = activeBills.reduce((acc, b) => {
    const rate = b.dalaliRate ?? b.monthlyInterestRate ?? 1.5;
    return acc + (b.dalaliAmount ?? (b.amount * rate) / 100);
  }, 0);

  if (loading && !refreshing) {
    return <LoadingSpinner message="Loading broker portfolio..." />;
  }

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
        bounces={false}
        alwaysBounceVertical={false}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Welcome Section */}
        <View style={styles.welcomeBanner}>
          <Text style={styles.greeting}>Welcome, {user?.name || 'Broker'}</Text>
          <Text style={styles.greetingSub}>
            Brokerage deal & Dalali commission tracking
          </Text>
        </View>

        {/* Hero Card: Brokerage / Dalali Receivable */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroTagRow}>
              <View style={styles.heroLiveDot} />
              <Text style={styles.heroLabel}>Total Dalali Receivable</Text>
            </View>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>
                {activeBills.length} Active Bills
              </Text>
            </View>
          </View>

          <Text style={styles.heroValue}>
            {formatCurrency(totalDalali)}
          </Text>

          <View style={styles.heroMetricsRow}>
            <View style={styles.heroMetricCol}>
              <Text style={styles.heroSubLabel}>Total Bill Turnover</Text>
              <Text style={styles.heroSubVal}>
                {formatCurrency(totalPrincipal)}
              </Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetricCol}>
              <Text style={styles.heroSubLabel}>Active Consignments</Text>
              <Text style={[styles.heroSubVal, styles.interestVal]}>
                {activeBills.length} Pending Bills
              </Text>
            </View>
          </View>
        </View>

        {/* Clickable Counts Grid */}
        <View style={styles.summaryGrid}>
          <TouchableOpacity
            style={styles.summaryCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CompanyList')}>
            <View style={styles.summaryTopRow}>
              <View style={[styles.iconBox, styles.iconBoxBlue]}>
                <Text style={styles.iconBoxText}>🏢</Text>
              </View>
              <View style={styles.arrowPill}>
                <ChevronRight size={14} color="#64748B" strokeWidth={2.4} />
              </View>
            </View>
            <Text style={styles.summaryValue}>{companies.length}</Text>
            <Text style={styles.summaryLabel}>Buyer Companies</Text>
            <Text style={styles.summaryHint}>
              {companies.length} {companies.length === 1 ? 'registered firm' : 'registered firms'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.summaryCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('TransactionList')}>
            <View style={styles.summaryTopRow}>
              <View style={[styles.iconBox, styles.iconBoxGreen]}>
                <Text style={styles.iconBoxText}>🧾</Text>
              </View>
              <View style={styles.arrowPill}>
                <ChevronRight size={14} color="#64748B" strokeWidth={2.4} />
              </View>
            </View>
            <Text style={styles.summaryValue}>{bills.length}</Text>
            <Text style={styles.summaryLabel}>Total Bills</Text>
            <Text style={styles.summaryHint}>
              {activeBills.length} pending · {bills.length - activeBills.length} settled
            </Text>
          </TouchableOpacity>
        </View>

        {/* Large Action Cards */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('TransactionForm')}>
            <View style={styles.actionBtnTopRow}>
              <View style={styles.actionBtnIconBoxPrimary}>
                <Text style={styles.actionBtnIconPrimary}>+</Text>
              </View>
              <View style={styles.actionBtnBadgePrimary}>
                <Text style={styles.actionBtnBadgeTextPrimary}>New Deal</Text>
              </View>
            </View>
            <View>
              <Text style={styles.actionBtnTitlePrimary}>Record New Bill</Text>
              <Text style={styles.actionBtnSubPrimary}>
                Record bill & Dalali %
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CompanyForm')}>
            <View style={styles.actionBtnTopRow}>
              <View style={styles.actionBtnIconBoxSecondary}>
                <Text style={styles.actionBtnIconSecondary}>+</Text>
              </View>
              <View style={styles.actionBtnBadgeSecondary}>
                <Text style={styles.actionBtnBadgeTextSecondary}>New Client</Text>
              </View>
            </View>
            <View>
              <Text style={styles.actionBtnTitleSecondary}>Add Company</Text>
              <Text style={styles.actionBtnSubSecondary}>
                Register buyer firm & ledger
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Tools: Standalone Dalali Calculator */}
        <TouchableOpacity
          style={styles.calcToolCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('DalaliCalculator')}>
          <View style={styles.calcToolLeft}>
            <View style={styles.calcToolIconWrap}>
              <Text style={styles.calcToolIcon}>💼</Text>
            </View>
            <View style={styles.calcToolTextWrap}>
              <Text style={styles.calcToolTitle}>Dalali Calculator</Text>
              <Text style={styles.calcToolSubtitle}>
                Calculate brokerage commission instantly on bill amounts
              </Text>
            </View>
          </View>
          <View style={styles.calcToolBadge}>
            <Text style={styles.calcToolBadgeText}>Calculate</Text>
            <ChevronRight size={13} color="#2563EB" strokeWidth={2.4} />
          </View>
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 22,
  },
  welcomeBanner: {
    marginBottom: 14,
  },
  greeting: {
    fontSize: 23,
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
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 7,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activePill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60A5FA',
  },
  heroValue: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  heroMetricCol: {
    flex: 1,
  },
  heroDivider: {
    width: 1,
    backgroundColor: '#334155',
    marginHorizontal: 12,
  },
  heroSubLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 3,
  },
  heroSubVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  interestVal: {
    color: '#34D399',
    fontSize: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 132,
    justifyContent: 'space-between',
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxBlue: {
    backgroundColor: '#EFF6FF',
  },
  iconBoxGreen: {
    backgroundColor: '#F0FDF4',
  },
  iconBoxText: {
    fontSize: 19,
  },
  arrowPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 3,
  },
  summaryHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    minHeight: 132,
    justifyContent: 'space-between',
  },
  actionBtnPrimary: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
  },
  actionBtnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
  },
  actionBtnTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionBtnIconBoxPrimary: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnIconPrimary: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 23,
  },
  actionBtnBadgePrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  actionBtnBadgeTextPrimary: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnIconBoxSecondary: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnIconSecondary: {
    fontSize: 21,
    fontWeight: '800',
    color: '#2563EB',
    lineHeight: 23,
  },
  actionBtnBadgeSecondary: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  actionBtnBadgeTextSecondary: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  actionBtnTitlePrimary: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  actionBtnSubPrimary: {
    fontSize: 12,
    color: '#BFDBFE',
    fontWeight: '500',
    lineHeight: 16,
  },
  actionBtnTitleSecondary: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  actionBtnSubSecondary: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 16,
  },
  calcToolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 6,
  },
  calcToolLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  calcToolIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  calcToolIcon: {
    fontSize: 20,
  },
  calcToolTextWrap: {
    flex: 1,
  },
  calcToolTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  calcToolSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  calcToolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  calcToolBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
});
