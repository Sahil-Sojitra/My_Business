import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight } from '../../../components/common/Icon';
import { Company } from '../../../types/company';
import { styles } from '../TransactionFormStyles';

interface SelectedCompanyCardProps {
  companiesCount: number;
  selectedCompany?: Company;
  error?: string;
  onPress: () => void;
}

export const SelectedCompanyCard: React.FC<SelectedCompanyCardProps> = ({
  companiesCount,
  selectedCompany,
  error,
  onPress,
}) => {
  return (
    <>
      <View style={styles.companySectionHeader}>
        <Text style={styles.fieldLabel}>Buyer Company / Firm *</Text>
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          <Text style={styles.browseAllText}>
            {companiesCount > 0 ? `Search ${companiesCount} Firms ▾` : '+ Add'}
          </Text>
        </TouchableOpacity>
      </View>

      {selectedCompany ? (
        <TouchableOpacity
          style={styles.selectedCompanyCard}
          onPress={onPress}
          activeOpacity={0.8}>
          <View style={styles.selectedCompanyAvatar}>
            <Text style={styles.selectedCompanyAvatarText}>
              {selectedCompany.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.selectedCompanyDetails}>
            <Text style={styles.selectedCompanyName} numberOfLines={1}>
              {selectedCompany.name}
            </Text>
            <Text style={styles.selectedCompanySub} numberOfLines={1}>
              {selectedCompany.ownerName ? `${selectedCompany.ownerName} • ` : ''}
              {selectedCompany.contactNumber}
            </Text>
          </View>
          <View style={styles.changeCompanyBadge}>
            <Text style={styles.changeCompanyBadgeText}>Change</Text>
            <ChevronRight size={13} color="#2563EB" strokeWidth={2.4} />
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.companySelectBtn, Boolean(error) && styles.inputErrorBorder]}
          onPress={onPress}
          activeOpacity={0.8}>
          <View style={styles.selectBtnLeft}>
            <Text style={styles.buildingIcon}>🏢</Text>
            <Text style={styles.companySelectPlaceholder}>
              Select Buyer Firm (from {companiesCount} registered clients)...
            </Text>
          </View>
          <Text style={styles.dropdownCaret}>▾</Text>
        </TouchableOpacity>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );
};
