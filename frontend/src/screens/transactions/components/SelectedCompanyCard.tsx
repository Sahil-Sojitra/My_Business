import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import {
  BuildingIcon,
  ChevronDown,
  ChevronRight,
  PlusIcon,
} from '../../../components/common/Icon';
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
        <View style={styles.labelRow}>
          <Text style={styles.fieldLabel}>Buyer Company / Firm</Text>
          <Text style={styles.requiredMark}> *</Text>
        </View>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          style={styles.browseAllBtn}
          accessibilityRole="button"
          accessibilityLabel="Search buyer firms">
          <Text style={styles.browseAllText}>
            {companiesCount > 0 ? `Search ${companiesCount} Firms` : '+ Add Firm'}
          </Text>
          {companiesCount > 0 ? (
            <ChevronDown size={13} color="#2563EB" strokeWidth={2.4} />
          ) : (
            <PlusIcon size={12} color="#2563EB" strokeWidth={2.4} />
          )}
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
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Select buyer firm">
          <View style={styles.selectBtnLeft}>
            <View style={styles.buildingIconBadge}>
              <BuildingIcon size={18} color="#2563EB" />
            </View>
            <Text style={styles.companySelectPlaceholder} numberOfLines={1}>
              Select Buyer Firm (from {companiesCount} registered clients)...
            </Text>
          </View>
          <ChevronDown size={16} color="#64748B" strokeWidth={2.2} />
        </TouchableOpacity>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );
};
