import React from 'react';
import { View } from 'react-native';
import { AppHeader } from '../../components/common/AppHeader';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { KeyboardAwareScrollView } from '../../components/common/KeyboardAwareScrollView';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { styles } from './CompanyFormStyles';
import { useCompanyForm } from './hooks/useCompanyForm';

export const CompanyFormScreen: React.FC = () => {
  const form = useCompanyForm();

  if (form.loadingInitial) {
    return <LoadingSpinner message="Loading company details..." />;
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        title={form.isEditing ? 'Edit Company' : 'Add New Company'}
        subtitle={form.isEditing ? form.name : 'Register client company'}
        showBack={true}
      />

      <KeyboardAwareScrollView
        extraScrollHeight={90}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          <Input
            label="Company Name"
            value={form.name}
            onChangeText={val => {
              form.setName(val);
              if (form.errors.name) {
                form.setErrors(prev => ({ ...prev, name: undefined }));
              }
            }}
            placeholder="e.g. Acme Textile Mills"
            error={form.errors.name}
            required
          />

          <Input
            label="Primary Contact Number"
            value={form.contactNumber}
            onChangeText={val => {
              form.setContactNumber(val);
              if (form.errors.contactNumber) {
                form.setErrors(prev => ({ ...prev, contactNumber: undefined }));
              }
            }}
            placeholder="9876543210"
            keyboardType="phone-pad"
            error={form.errors.contactNumber}
            required
          />

          <Input
            label="Owner / Contact Person"
            value={form.ownerName}
            onChangeText={form.setOwnerName}
            placeholder="e.g. Ramesh Patel"
            helperText="Key person for trading negotiations"
          />

          <Input
            label="Email Address"
            value={form.email}
            onChangeText={val => {
              form.setEmail(val);
              if (form.errors.email) {
                form.setErrors(prev => ({ ...prev, email: undefined }));
              }
            }}
            placeholder="account@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={form.errors.email}
          />

          <Input
            label="GSTIN / Tax Identification"
            value={form.gstin}
            onChangeText={val => {
              form.setGstin(val);
              if (form.errors.gstin) {
                form.setErrors(prev => ({ ...prev, gstin: undefined }));
              }
            }}
            placeholder="24AAACA1234A1Z5"
            autoCapitalize="characters"
            maxLength={15}
            error={form.errors.gstin}
          />

          <Input
            label="Business Address"
            value={form.address}
            onChangeText={form.setAddress}
            placeholder="Office / Factory address"
            multiline
            numberOfLines={2}
          />

          <Input
            label="Notes / Terms"
            value={form.notes}
            onChangeText={form.setNotes}
            placeholder="Payment terms, broker commission rate, special terms"
            multiline
            numberOfLines={3}
          />

          <Button
            title={form.isEditing ? 'Save Changes' : 'Create Company'}
            onPress={form.handleSave}
            loading={form.saving}
            size="lg"
            style={styles.saveBtn}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};
