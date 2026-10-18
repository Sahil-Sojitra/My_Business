import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../features/auth/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { InterestCalculatorScreen } from '../screens/calculator/dalaliCalculatorScreen';
import { CompanyDetailsScreen } from '../screens/companies/CompanyDetailsScreen';
import { CompanyFormScreen } from '../screens/companies/CompanyFormScreen';
import { CompanyListScreen } from '../screens/companies/CompanyListScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { TransactionDetailsScreen } from '../screens/transactions/TransactionDetailsScreen';
import { TransactionFormScreen } from '../screens/transactions/TransactionFormScreen';
import { TransactionListScreen } from '../screens/transactions/TransactionListScreen';
import { useNavigation } from './NavigationContext';

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentScreen } = useNavigation();

  if (isLoading) {
    return <LoadingSpinner message="Initializing My Business..." />;
  }

  // Unauthenticated flow
  if (!isAuthenticated) {
    if (currentScreen === 'Register') {
      return <RegisterScreen />;
    }
    return <LoginScreen />;
  }

  // Authenticated flow
  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return <HomeScreen />;
      case 'CompanyList':
        return <CompanyListScreen />;
      case 'CompanyDetails':
        return <CompanyDetailsScreen />;
      case 'CompanyForm':
        return <CompanyFormScreen />;
      case 'TransactionList':
        return <TransactionListScreen />;
      case 'TransactionDetails':
        return <TransactionDetailsScreen />;
      case 'TransactionForm':
        return <TransactionFormScreen />;
      case 'InterestCalculator':
      case 'DalaliCalculator':
        return <InterestCalculatorScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return <View style={styles.container}>{renderScreen()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
