import { useEffect, useState } from 'react';
import { alertService } from '../../../context/AlertContext';
import { useNavigation } from '../../../navigation/NavigationContext';
import { companyService, interstitialService } from '../../../services';

export function useCompanyForm() {
  const navigation = useNavigation();
  const companyId = navigation.params?.companyId as string | undefined;
  const isEditing = Boolean(companyId);

  const [name, setName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [gstin, setGstin] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loadingInitial, setLoadingInitial] = useState<boolean>(isEditing);
  const [saving, setSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    name?: string;
    contactNumber?: string;
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
        gstin: gstin.trim().toUpperCase() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (isEditing && companyId) {
        await companyService.update(companyId, payload);
        alertService.showSuccess('Success', 'Company profile updated successfully.');
        navigation.navigate('CompanyDetails', { companyId });
        setTimeout(() => {
          interstitialService.showIfEligible();
        }, 350);
      } else {
        const created = await companyService.create(payload);
        alertService.showSuccess('Success', 'New company created successfully.');
        navigation.navigate('CompanyDetails', { companyId: created.id });
        setTimeout(() => {
          interstitialService.showIfEligible();
        }, 350);
      }
    } catch (err) {
      alertService.showError(
        'Failed to Save Profile',
        err instanceof Error ? err.message : 'Failed to save company profile'
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    isEditing,
    name,
    setName,
    ownerName,
    setOwnerName,
    contactNumber,
    setContactNumber,
    gstin,
    setGstin,
    address,
    setAddress,
    notes,
    setNotes,
    loadingInitial,
    saving,
    errors,
    setErrors,
    handleSave,
  };
}
