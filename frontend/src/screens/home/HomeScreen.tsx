import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { AppHeader } from '../../components/common/AppHeader';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigation } from '../../navigation/NavigationContext';
import { companyService, transactionService } from '../../services';
import { Company } from '../../types/company';
import { Transaction } from '../../types/transaction';
import { HomeActionCards } from './components/HomeActionCards';
import { HomeDalaliToolCard } from './components/HomeDalaliToolCard';
import { HomeHeroCard } from './components/HomeHeroCard';
import { HomeSummaryGrid } from './components/HomeSummaryGrid';
import { styles } from './HomeStyles';

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
        <HomeHeroCard
          totalDalali={totalDalali}
          totalPrincipal={totalPrincipal}
          activeBillsCount={activeBills.length}
        />

        {/* Clickable Counts Grid */}
        <HomeSummaryGrid
          companiesCount={companies.length}
          totalBillsCount={bills.length}
          activeBillsCount={activeBills.length}
          onCompaniesPress={() => navigation.navigate('CompanyList')}
          onBillsPress={() => navigation.navigate('TransactionList')}
        />

        {/* Large Action Cards */}
        <HomeActionCards
          onRecordBillPress={() => navigation.navigate('TransactionForm')}
          onAddCompanyPress={() => navigation.navigate('CompanyForm')}
        />

        {/* Quick Tools: Standalone Dalali Calculator */}
        <HomeDalaliToolCard
          onPress={() => navigation.navigate('DalaliCalculator')}
        />
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
