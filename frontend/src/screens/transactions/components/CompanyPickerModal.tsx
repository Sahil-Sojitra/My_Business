import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardEvent,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  CheckIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from '../../../components/common/Icon';
import { Company } from '../../../types/company';
import { styles } from '../TransactionFormStyles';

interface CompanyPickerModalProps {
  visible: boolean;
  onClose: () => void;
  companies: Company[];
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddNewCompany: () => void;
}

export const CompanyPickerModal: React.FC<CompanyPickerModalProps> = ({
  visible,
  onClose,
  companies,
  selectedCompanyId,
  onSelectCompany,
  searchQuery,
  onSearchChange,
  onAddNewCompany,
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => {
        setKeyboardHeight(e?.endCoordinates?.height || 280);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const filteredCompanies = companies.filter(c => {
    if (!searchQuery.trim()) {
      return true;
    }
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.ownerName && c.ownerName.toLowerCase().includes(q)) ||
      (c.contactNumber && c.contactNumber.includes(q))
    );
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdropDismiss} />
        </TouchableWithoutFeedback>
        <View style={styles.companyModalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Select Buyer Company / Firm</Text>
              <Text style={styles.modalSub}>
                {companies.length} registered mandi clients
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseBtn}
              activeOpacity={0.7}>
              <XIcon size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.modalSearchRow}>
            <SearchIcon size={16} color="#64748B" />
            <TextInput
              style={styles.modalSearchInput}
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholder="Search by firm name, owner or phone..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                onPress={() => onSearchChange('')}
                activeOpacity={0.7}>
                <XIcon size={14} color="#64748B" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Quick Add Company Button */}
          <TouchableOpacity
            style={styles.modalAddCompBtn}
            onPress={onAddNewCompany}
            activeOpacity={0.7}>
            <PlusIcon size={15} color="#2563EB" strokeWidth={2.6} />
            <Text style={styles.modalAddCompText}>Add New Buyer Firm</Text>
          </TouchableOpacity>

          {/* Company List Scroll */}
          <ScrollView
            style={styles.companyListScroll}
            contentContainerStyle={{
              paddingBottom: keyboardHeight > 0 ? keyboardHeight + 24 : 32,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {filteredCompanies.length === 0 ? (
              <View style={styles.emptySearchWrap}>
                <Text style={styles.emptySearchEmoji}>🔍</Text>
                <Text style={styles.emptySearchTitle}>No buyer firms match</Text>
                <Text style={styles.emptySearchSub}>
                  Try a different search keyword
                </Text>
              </View>
            ) : (
              filteredCompanies.map(comp => {
                const isSelected = comp.id === selectedCompanyId;
                return (
                  <TouchableOpacity
                    key={comp.id}
                    style={[
                      styles.companyListItem,
                      isSelected && styles.companyListItemActive,
                    ]}
                    onPress={() => {
                      onSelectCompany(comp.id);
                      onClose();
                    }}
                    activeOpacity={0.7}>
                    <View style={styles.companyListAvatar}>
                      <Text style={styles.companyListAvatarText}>
                        {comp.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.companyListInfo}>
                      <Text
                        style={[
                          styles.companyListName,
                          isSelected && styles.companyListNameActive,
                        ]}
                        numberOfLines={1}>
                        {comp.name}
                      </Text>
                      <Text style={styles.companyListSub} numberOfLines={1}>
                        {comp.ownerName ? `${comp.ownerName} • ` : ''}
                        {comp.contactNumber}
                      </Text>
                      {comp.gstin ? (
                        <Text style={styles.companyListGstin}>
                          GST: {comp.gstin}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <View style={styles.selectedCheckWrap}>
                        <CheckIcon size={16} color="#2563EB" />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
