import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
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
import { companyService } from '../../services';
import { Company } from '../../types/company';
import { CompanyListItemCard } from './components/CompanyListItemCard';
import { styles } from './CompanyListStyles';

type CompanyListItem =
  | { type: 'company'; data: Company }
  | { type: 'native_ad'; id: string };

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

  const listData: CompanyListItem[] = useMemo(() => {
    // Only show ad slots when there are at least 6 actual companies available
    if (filteredCompanies.length < 6) {
      return filteredCompanies.map(c => ({ type: 'company', data: c }));
    }

    const items: CompanyListItem[] = [];
    for (let i = 0; i < filteredCompanies.length; i++) {
      if (i === 5) {
        // Place first ad after the fifth company (between index 4 and index 5)
        items.push({ type: 'native_ad', id: 'company-list-native-ad-1' });
      } else if (i === 15 && filteredCompanies.length >= 16) {
        // Place second ad after the 15th company (between index 14 and index 15)
        items.push({ type: 'native_ad', id: 'company-list-native-ad-2' });
      } else if (i === 25 && filteredCompanies.length >= 26) {
        // Place third ad after the 25th company (between index 24 and index 25)
        items.push({ type: 'native_ad', id: 'company-list-native-ad-3' });
      }
      items.push({ type: 'company', data: filteredCompanies[i] });
    }
    return items;
  }, [filteredCompanies]);

  const fabStyle = useMemo(
    () => [
      styles.fabButton,
      { bottom: Math.max(insets.bottom, 16) + 16 },
    ],
    [insets.bottom],
  );

  const handleItemPress = useCallback(
    (id: string) => {
      navigation.navigate('CompanyDetails', {
        companyId: id,
      });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: CompanyListItem }) => {
      if (item.type === 'native_ad') {
        return <NativeAdCard />;
      }
      return (
        <CompanyListItemCard
          item={item.data}
          onPress={() => handleItemPress(item.data.id)}
        />
      );
    },
    [handleItemPress],
  );

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
          data={listData}
          keyExtractor={item =>
            item.type === 'company' ? item.data.id : item.id
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
          renderItem={renderItem}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={fabStyle}
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
