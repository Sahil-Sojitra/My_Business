import React, { useCallback, useEffect, useState } from 'react';
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
import { useNavigation } from '../../navigation/NavigationContext';
import { companyService } from '../../services';
import { Company } from '../../types/company';
import { CompanyListItemCard } from './components/CompanyListItemCard';
import { styles } from './CompanyListStyles';

export const CompanyListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadCompanies = useCallback(async () => {
    try {
      const data = await companyService.getAll();
      setCompanies(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCompanies();
  };

  const filteredCompanies = companies.filter(company => {
    if (!searchQuery.trim()) {
      return true;
    }
    const query = searchQuery.toLowerCase();
    return (
      company.name.toLowerCase().includes(query) ||
      (company.ownerName && company.ownerName.toLowerCase().includes(query)) ||
      company.contactNumber.includes(query) ||
      (company.gstin && company.gstin.toLowerCase().includes(query))
    );
  });

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Companies"
        subtitle={`${companies.length} clients registered`}
        showBack={true}
      />

      <View style={styles.searchContainer}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by company name, contact, GSTIN..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          clearButtonMode="while-editing"
        />
        {searchQuery ? (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearSearchBtn}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading && !refreshing ? (
        <LoadingSpinner message="Loading companies..." />
      ) : (
        <FlatList
          data={filteredCompanies}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              title={
                searchQuery
                  ? 'No matching companies'
                  : 'No companies added yet'
              }
              description={
                searchQuery
                  ? `No company matches "${searchQuery}". Check the name or phone number.`
                  : 'Add your first company to track bills, transactions, and payments.'
              }
              icon="🏢"
              actionTitle={searchQuery ? 'Clear Search' : '+ Add Company'}
              onAction={
                searchQuery
                  ? () => setSearchQuery('')
                  : () => navigation.navigate('CompanyForm')
              }
            />
          }
          renderItem={({ item }) => (
            <CompanyListItemCard
              item={item}
              onPress={() =>
                navigation.navigate('CompanyDetails', { companyId: item.id })
              }
            />
          )}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fabButton,
          { bottom: Math.max(insets.bottom, 16) + 16 },
        ]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('CompanyForm')}
        accessibilityRole="button"
        accessibilityLabel="Add new company">
        <PlusIcon size={18} color="#FFFFFF" strokeWidth={2.6} />
        <Text style={styles.fabButtonText}>Add Company</Text>
      </TouchableOpacity>
    </View>
  );
};
