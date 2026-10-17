import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppHeader } from '../../components/common/AppHeader';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useNavigation } from '../../navigation/NavigationContext';
import { companyService, transactionService } from '../../services';
import { Company } from '../../types/company';
import { formatCurrency } from '../../utils/formatters';

export const TransactionFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const transactionId = navigation.params?.transactionId as string | undefined;
  const defaultCompanyId = navigation.params?.defaultCompanyId as
    | string
    | undefined;
  const isEditing = Boolean(transactionId);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    defaultCompanyId || ''
  );
  const [amount, setAmount] = useState<string>('');
  const [dalaliRate, setDalaliRate] = useState<string>('1.5');
  const [dalaliAmount, setDalaliAmount] = useState<string>('');
  const [billNumber, setBillNumber] = useState<string>('');
  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    company?: string;
    amount?: string;
    dalaliRate?: string;
    date?: string;
  }>({});

  const recalculateDalali = (amtStr: string, rateStr: string) => {
    const numA = parseFloat(amtStr) || 0;
    const numR = parseFloat(rateStr) || 0;
    if (numA > 0 && numR > 0) {
      const val = (numA * numR) / 100;
      setDalaliAmount(val % 1 === 0 ? String(val) : val.toFixed(2));
    } else {
      setDalaliAmount('');
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const fetchedCompanies = await companyService.getAll();
        setCompanies(fetchedCompanies);

        if (transactionId) {
          const tx = await transactionService.getById(transactionId);
          if (tx) {
            setSelectedCompanyId(tx.companyId);
            const amtStr = String(tx.amount);
            setAmount(amtStr);
            const rate =
              tx.dalaliRate ??
              tx.monthlyInterestRate ??
              (tx.interestRate ? tx.interestRate / 12 : 1.5);
            const rateStr = String(rate);
            setDalaliRate(rateStr);

            if (tx.dalaliAmount !== undefined) {
              setDalaliAmount(String(tx.dalaliAmount));
            } else {
              const val = (Number(tx.amount) * Number(rate)) / 100;
              setDalaliAmount(val % 1 === 0 ? String(val) : val.toFixed(2));
            }

            setBillNumber(tx.billNumber || '');
            setDate(tx.date);
            setDueDate(tx.dueDate || '');
            setDescription(tx.description || '');
          }
        } else if (defaultCompanyId) {
          setSelectedCompanyId(defaultCompanyId);
        } else if (fetchedCompanies.length > 0) {
          setSelectedCompanyId(fetchedCompanies[0].id);
        }
      } finally {
        setLoadingInitial(false);
      }
    };

    init();
  }, [transactionId, defaultCompanyId]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!selectedCompanyId) {
      newErrors.company = 'Please select a buyer firm';
    }

    const numAmount = parseFloat(amount);
    if (!amount.trim()) {
      newErrors.amount = 'Bill amount is required';
    } else if (isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    const numRate = parseFloat(dalaliRate);
    if (!dalaliRate.trim()) {
      newErrors.dalaliRate = 'Dalali / commission percentage is required';
    } else if (isNaN(numRate) || numRate < 0) {
      newErrors.dalaliRate = 'Dalali percentage cannot be negative';
    }

    if (!date.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      newErrors.date = 'Date must be in YYYY-MM-DD format (e.g. 2026-10-13)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    const selectedCompany = companies.find(c => c.id === selectedCompanyId);
    if (!selectedCompany) {
      Alert.alert('Error', 'Selected company could not be found');
      return;
    }

    setSaving(true);
    try {
      const parsedDalaliRate = parseFloat(dalaliRate);
      const parsedAmount = parseFloat(amount);
      const calculatedDalaliAmount =
        parseFloat(dalaliAmount) || (parsedAmount * parsedDalaliRate) / 100;

      const payload = {
        companyId: selectedCompany.id,
        companyName: selectedCompany.name,
        amount: parsedAmount,
        dalaliRate: parsedDalaliRate,
        dalaliAmount: calculatedDalaliAmount,
        monthlyInterestRate: parsedDalaliRate, // kept for backward compatibility
        interestRate: parsedDalaliRate * 12,
        billNumber: billNumber.trim() || undefined,
        date: date.trim(),
        interestStartDate: date.trim(),
        dueDate: dueDate.trim() || undefined,
        status: 'PENDING' as const,
        description: description.trim() || undefined,
      };

      if (isEditing && transactionId) {
        await transactionService.update(transactionId, payload);
        Alert.alert('Success', 'Bill updated successfully');
        navigation.navigate('TransactionDetails', { transactionId });
      } else {
        const created = await transactionService.create(payload);
        Alert.alert('Success', 'Bill recorded successfully');
        navigation.navigate('TransactionDetails', {
          transactionId: created.id,
        });
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to save bill'
      );
    } finally {
      setSaving(false);
    }
  };

  const numAmt = parseFloat(amount) || 0;
  const numDalaliRate = parseFloat(dalaliRate) || 0;

  if (loadingInitial) {
    return <LoadingSpinner message="Loading bill form..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <AppHeader
        title={isEditing ? 'Edit Bill' : 'Record Bill'}
        subtitle="Record bill & calculate Dalali commission"
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          {/* Buyer Firm / Client Picker */}
          <Text style={styles.fieldLabel}>Buyer Company / Firm *</Text>
          {companies.length === 0 ? (
            <View style={styles.noCompaniesWarning}>
              <Text style={styles.noCompText}>
                No buyer firms registered. Please create a company first.
              </Text>
              <Button
                title="+ Add Company"
                size="sm"
                onPress={() => navigation.navigate('CompanyForm')}
                style={styles.addCompBtn}
              />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.companyPillsScroll}
              contentContainerStyle={styles.companyPillsContainer}>
              {companies.map(c => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => {
                    setSelectedCompanyId(c.id);
                    if (errors.company) {
                      setErrors(prev => ({ ...prev, company: undefined }));
                    }
                  }}
                  style={[
                    styles.companyPill,
                    selectedCompanyId === c.id && styles.companyPillSelected,
                  ]}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.companyPillText,
                      selectedCompanyId === c.id &&
                        styles.companyPillTextSelected,
                    ]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {errors.company ? (
            <Text style={styles.errorText}>{errors.company}</Text>
          ) : null}

          {/* Bill Amount */}
          <Input
            label="Bill Amount (₹) *"
            value={amount}
            onChangeText={val => {
              setAmount(val);
              recalculateDalali(val, dalaliRate);
              if (errors.amount) {
                setErrors(prev => ({ ...prev, amount: undefined }));
              }
            }}
            placeholder="e.g. 145000"
            keyboardType="numeric"
            error={errors.amount}
            required
            style={styles.inputMargin}
          />

          {/* Dalali / Commission Percentage User Input */}
          <View style={styles.dalaliInputWrapper}>
            <Input
              label="Dalali / Commission Rate (%) *"
              value={dalaliRate}
              onChangeText={val => {
                setDalaliRate(val);
                recalculateDalali(amount, val);
                if (errors.dalaliRate) {
                  setErrors(prev => ({
                    ...prev,
                    dalaliRate: undefined,
                  }));
                }
              }}
              placeholder="e.g. 1.0, 1.5, 2.0"
              keyboardType="numeric"
              error={errors.dalaliRate}
              helperText="Broker commission percentage on this bill amount"
              required
            />

            {/* Quick preset pills for non-tech broker convenience */}
            <View style={styles.presetsRow}>
              <Text style={styles.presetLabel}>Quick Select:</Text>
              {['1.0', '1.5', '2.0', '2.5'].map(pRate => (
                <TouchableOpacity
                  key={pRate}
                  onPress={() => {
                    setDalaliRate(pRate);
                    recalculateDalali(amount, pRate);
                    if (errors.dalaliRate) {
                      setErrors(prev => ({ ...prev, dalaliRate: undefined }));
                    }
                  }}
                  style={[
                    styles.presetPill,
                    dalaliRate === pRate && styles.presetPillActive,
                  ]}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.presetPillText,
                      dalaliRate === pRate && styles.presetPillTextActive,
                    ]}>
                    {pRate}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Simple Green Input: Dalali Amount (Auto-Calculated) */}
          <View style={styles.dalaliGreenSection}>
            <Text style={styles.dalaliGreenLabel}>
              Dalali Amount (Brokerage) (₹) *
            </Text>
            <View style={styles.dalaliGreenInputWrapper}>
              <Text style={styles.dalaliGreenSymbol}>₹</Text>
              <TextInput
                style={styles.dalaliGreenInput}
                value={dalaliAmount}
                onChangeText={setDalaliAmount}
                placeholder="0.00"
                placeholderTextColor="#15803D"
                keyboardType="numeric"
              />
              <View style={styles.dalaliAutoBadge}>
                <Text style={styles.dalaliAutoBadgeText}>
                  {numDalaliRate > 0 ? `${numDalaliRate}% auto` : 'Auto'}
                </Text>
              </View>
            </View>
            <Text style={styles.dalaliGreenHelper}>
              {numAmt > 0 && numDalaliRate > 0
                ? `Auto-calculated: ${numDalaliRate}% of ${formatCurrency(numAmt)}`
                : 'Calculates automatically from bill amount & Dalali %'}
            </Text>
          </View>

          {/* Bill / Invoice Number */}
          <Input
            label="Bill / Invoice Number"
            value={billNumber}
            onChangeText={setBillNumber}
            placeholder="e.g. INV-2026-104 or LOT-409"
            autoCapitalize="characters"
          />

          {/* Bill Date */}
          <Input
            label="Bill Date (YYYY-MM-DD) *"
            value={date}
            onChangeText={val => {
              setDate(val);
              if (errors.date) {
                setErrors(prev => ({ ...prev, date: undefined }));
              }
            }}
            placeholder="2026-10-13"
            error={errors.date}
            required
          />

          {/* Payment Due Date */}
          <Input
            label="Payment Due Date (YYYY-MM-DD)"
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2026-11-13"
            helperText="Settlement deadline (closest due date appears first on firm list)"
          />

          {/* Description */}
          <Input
            label="Consignment / Deal Notes"
            value={description}
            onChangeText={setDescription}
            placeholder="Yarn counts, meter quantity, buyer payment agreement..."
            multiline
            numberOfLines={3}
            style={styles.inputMargin}
          />

          <Button
            title={isEditing ? 'Save Changes' : 'Record Bill (Status: Pending)'}
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
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldLabel: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  noCompaniesWarning: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  noCompText: {
    fontSize: 13.5,
    color: '#92400E',
    marginBottom: 8,
  },
  addCompBtn: {
    alignSelf: 'flex-start',
  },
  companyPillsScroll: {
    marginBottom: 8,
  },
  companyPillsContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  companyPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  companyPillSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  companyPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  companyPillTextSelected: {
    color: '#FFFFFF',
  },
  dalaliInputWrapper: {
    marginBottom: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  presetPill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  presetPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  presetPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  presetPillTextActive: {
    color: '#FFFFFF',
  },
  dalaliGreenSection: {
    marginBottom: 16,
  },
  dalaliGreenLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 7,
  },
  dalaliGreenInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#16A34A',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 54,
  },
  dalaliGreenSymbol: {
    fontSize: 20,
    fontWeight: '800',
    color: '#166534',
    marginRight: 6,
  },
  dalaliGreenInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#15803D',
    paddingVertical: 0,
  },
  dalaliAutoBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  dalaliAutoBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  dalaliGreenHelper: {
    fontSize: 12.5,
    color: '#15803D',
    fontWeight: '500',
    marginTop: 6,
  },
  inputMargin: {
    marginTop: 4,
  },
  saveBtn: {
    marginTop: 10,
  },
  errorText: {
    fontSize: 12.5,
    color: '#DC2626',
    fontWeight: '500',
    marginBottom: 8,
  },
});
