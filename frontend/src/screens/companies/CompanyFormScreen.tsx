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
              form.setName(val.slice(0, 100));
              if (form.errors.name) {
                form.setErrors(prev => ({ ...prev, name: undefined }));
              }
            }}
            placeholder="e.g. Acme Textile Mills"
            maxLength={100}
            error={form.errors.name}
            required
          />

          <Input
            label="Primary Contact Number"
            value={form.contactNumber}
            onChangeText={val => {
              const clean = val.replace(/\D/g, '').slice(0, 10);
              form.setContactNumber(clean);
              if (form.errors.contactNumber) {
                form.setErrors(prev => ({ ...prev, contactNumber: undefined }));
              }
            }}
            placeholder="9876543210"
            keyboardType="phone-pad"
            maxLength={10}
            error={form.errors.contactNumber}
            required
          />

          <Input
            label="Owner / Contact Person"
            value={form.ownerName}
            onChangeText={val => form.setOwnerName(val.slice(0, 60))}
            placeholder="e.g. Ramesh Patel"
            maxLength={60}
            helperText="Key person for trading negotiations"
          />

          <Input
            label="Email Address"
            value={form.email}
            onChangeText={val => {
              form.setEmail(val.trim().slice(0, 80));
              if (form.errors.email) {
                form.setErrors(prev => ({ ...prev, email: undefined }));
              }
            }}
            placeholder="account@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={80}
            error={form.errors.email}
          />

          <Input
            label="GSTIN / Tax Identification"
            value={form.gstin}
            onChangeText={val => {
              const clean = val.toUpperCase().slice(0, 15);
              form.setGstin(clean);
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
            onChangeText={val => form.setAddress(val.slice(0, 250))}
            placeholder="Office / Factory address"
            maxLength={250}
            multiline
            numberOfLines={2}
          />

          <Input
            label="Notes / Terms"
            value={form.notes}
            onChangeText={val => form.setNotes(val.slice(0, 300))}
            placeholder="Payment terms, broker commission rate, special terms"
            maxLength={300}
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
