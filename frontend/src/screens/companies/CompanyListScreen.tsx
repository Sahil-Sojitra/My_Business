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
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useNavigation } from '../../navigation/NavigationContext';
import { companyService } from '../../services';
import { Company } from '../../types/company';
import { formatPhone } from '../../utils/formatters';

export const CompanyListScreen: React.FC = () => {
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
        rightAction={{
          label: '+ Add',
          onPress: () => navigation.navigate('CompanyForm'),
          variant: 'primary',
        }}
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
            <Card
              onPress={() =>
                navigation.navigate('CompanyDetails', { companyId: item.id })
              }
              style={styles.companyCard}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <Text style={styles.companyName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.ownerName ? (
                    <Text style={styles.ownerName}>
                      Contact person: {item.ownerName}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.chevron}>→</Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.infoBadge}>
                  <Text style={styles.infoBadgeText}>
                    📞 {formatPhone(item.contactNumber)}
                  </Text>
                </View>
                {item.gstin ? (
                  <View style={styles.gstBadge}>
                    <Text style={styles.gstBadgeText}>GST: {item.gstin}</Text>
                  </View>
                ) : null}
              </View>
            </Card>
          )}
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
    height: 40,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  clearSearchBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#64748B',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  companyCard: {
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  ownerName: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  chevron: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  infoBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  infoBadgeText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  gstBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gstBadgeText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600',
  },
});
