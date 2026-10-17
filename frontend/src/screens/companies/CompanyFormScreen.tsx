import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppHeader } from '../../components/common/AppHeader';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useNavigation } from '../../navigation/NavigationContext';
import { companyService } from '../../services';

export const CompanyFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const companyId = navigation.params?.companyId as string | undefined;
  const isEditing = Boolean(companyId);

  const [name, setName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [gstin, setGstin] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loadingInitial, setLoadingInitial] = useState<boolean>(isEditing);
  const [saving, setSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    name?: string;
    contactNumber?: string;
    email?: string;
    gstin?: string;
  }>({});

  useEffect(() => {
    if (companyId) {
      companyService
        .getById(companyId)
        .then(company => {
          if (company) {
            setName(company.name);
            setOwnerName(company.ownerName || '');
            setContactNumber(company.contactNumber);
            setEmail(company.email || '');
            setGstin(company.gstin || '');
            setAddress(company.address || '');
            setNotes(company.notes || '');
          }
        })
        .finally(() => {
          setLoadingInitial(false);
        });
    }
  }, [companyId]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Company name is required';
    }

    const cleanPhone = contactNumber.replace(/\D/g, '');
    if (!cleanPhone) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (cleanPhone.length < 10) {
      newErrors.contactNumber = 'Please enter a valid 10-digit contact number';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (gstin.trim() && gstin.trim().length !== 15) {
      newErrors.gstin = 'GSTIN should be 15 characters (e.g. 24AAACA1234A1Z5)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        ownerName: ownerName.trim() || undefined,
        contactNumber: contactNumber.trim(),
        email: email.trim() || undefined,
        gstin: gstin.trim().toUpperCase() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (isEditing && companyId) {
        await companyService.update(companyId, payload);
        Alert.alert('Success', 'Company profile updated successfully.');
        navigation.navigate('CompanyDetails', { companyId });
      } else {
        const created = await companyService.create(payload);
        Alert.alert('Success', 'New company created successfully.');
        navigation.navigate('CompanyDetails', { companyId: created.id });
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to save company profile'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return <LoadingSpinner message="Loading company details..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <AppHeader
        title={isEditing ? 'Edit Company' : 'Add New Company'}
        subtitle={isEditing ? name : 'Register client company'}
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <Input
            label="Company Name"
            value={name}
            onChangeText={val => {
              setName(val);
              if (errors.name) {
                setErrors(prev => ({ ...prev, name: undefined }));
              }
            }}
            placeholder="e.g. Acme Textile Mills"
            error={errors.name}
            required
          />

          <Input
            label="Primary Contact Number"
            value={contactNumber}
            onChangeText={val => {
              setContactNumber(val);
              if (errors.contactNumber) {
                setErrors(prev => ({ ...prev, contactNumber: undefined }));
              }
            }}
            placeholder="9876543210"
            keyboardType="phone-pad"
            error={errors.contactNumber}
            required
          />

          <Input
            label="Owner / Contact Person"
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="e.g. Ramesh Patel"
            helperText="Key person for trading negotiations"
          />

          <Input
            label="Email Address"
            value={email}
            onChangeText={val => {
              setEmail(val);
              if (errors.email) {
                setErrors(prev => ({ ...prev, email: undefined }));
              }
            }}
            placeholder="account@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="GSTIN / Tax Identification"
            value={gstin}
            onChangeText={val => {
              setGstin(val);
              if (errors.gstin) {
                setErrors(prev => ({ ...prev, gstin: undefined }));
              }
            }}
            placeholder="24AAACA1234A1Z5"
            autoCapitalize="characters"
            maxLength={15}
            error={errors.gstin}
          />

          <Input
            label="Business Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Office / Factory address"
            multiline
            numberOfLines={2}
          />

          <Input
            label="Notes / Terms"
            value={notes}
            onChangeText={setNotes}
            placeholder="Payment terms, broker commission rate, special terms"
            multiline
            numberOfLines={3}
          />

          <Button
            title={isEditing ? 'Save Changes' : 'Create Company'}
            onPress={handleSave}
            loading={saving}
            size="lg"
            style={styles.saveBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveBtn: {
    marginTop: 14,
  },
});
