import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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
import { TransactionStatus } from '../../types/transaction';
import { calculateAccruedBillInterest } from '../../utils/calculator';
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
  const [interestRate, setInterestRate] = useState<string>('12');
  const [billNumber, setBillNumber] = useState<string>('');
  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [interestStartDate, setInterestStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>('');
  const [status, setStatus] = useState<TransactionStatus>('PENDING');
  const [description, setDescription] = useState<string>('');

  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    company?: string;
    amount?: string;
    interestRate?: string;
    date?: string;
    interestStartDate?: string;
  }>({});

  useEffect(() => {
    const init = async () => {
      try {
        const fetchedCompanies = await companyService.getAll();
        setCompanies(fetchedCompanies);

        if (transactionId) {
          const tx = await transactionService.getById(transactionId);
          if (tx) {
            setSelectedCompanyId(tx.companyId);
            setAmount(String(tx.amount));
            setInterestRate(String(tx.interestRate ?? 12));
            setBillNumber(tx.billNumber || '');
            setDate(tx.date);
            setInterestStartDate(tx.interestStartDate || tx.date);
            setDueDate(tx.dueDate || '');
            setStatus(tx.status);
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

    const numRate = parseFloat(interestRate);
    if (!interestRate.trim()) {
      newErrors.interestRate = 'Interest rate is required';
    } else if (isNaN(numRate) || numRate < 0) {
      newErrors.interestRate = 'Interest rate cannot be negative';
    }

    if (!date.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      newErrors.date = 'Date must be in YYYY-MM-DD format (e.g. 2026-10-13)';
    }

    if (
      interestStartDate.trim() &&
      !/^\d{4}-\d{2}-\d{2}$/.test(interestStartDate.trim())
    ) {
      newErrors.interestStartDate = 'Date must be in YYYY-MM-DD format';
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
      const payload = {
        companyId: selectedCompany.id,
        companyName: selectedCompany.name,
        amount: parseFloat(amount),
        interestRate: parseFloat(interestRate),
        billNumber: billNumber.trim() || undefined,
        date: date.trim(),
        interestStartDate: interestStartDate.trim() || date.trim(),
        dueDate: dueDate.trim() || undefined,
        status,
        description: description.trim() || undefined,
      };

      if (isEditing && transactionId) {
        await transactionService.update(transactionId, payload);
        Alert.alert('Success', 'Bill & interest terms updated successfully');
        navigation.navigate('TransactionDetails', { transactionId });
      } else {
        const created = await transactionService.create(payload);
        Alert.alert('Success', 'Bill recorded and interest tracking activated');
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

  // Dynamic preview calculation
  const numAmt = parseFloat(amount) || 0;
  const numRt = parseFloat(interestRate) || 0;
  const preview = calculateAccruedBillInterest(
    numAmt,
    numRt,
    interestStartDate || date
  );

  if (loadingInitial) {
    return <LoadingSpinner message="Loading form data..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <AppHeader
        title={isEditing ? 'Edit Bill' : 'Record Bill'}
        subtitle="Broker sales bill with interest tracking"
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          {/* Buyer Firm / Client Picker */}
          <Text style={styles.fieldLabel}>Buyer Firm / Company *</Text>
          {companies.length === 0 ? (
            <View style={styles.noCompaniesWarning}>
              <Text style={styles.noCompText}>
                No companies registered. Please create a client company first.
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

          {/* Amount */}
          <Input
            label="Bill / Invoice Amount (₹) *"
            value={amount}
            onChangeText={val => {
              setAmount(val);
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

          {/* Interest Rate */}
          <Input
            label="Annual Interest Rate (% p.a.) *"
            value={interestRate}
            onChangeText={val => {
              setInterestRate(val);
              if (errors.interestRate) {
                setErrors(prev => ({ ...prev, interestRate: undefined }));
              }
            }}
            placeholder="12"
            keyboardType="numeric"
            error={errors.interestRate}
            helperText="Broker interest charged on credit sales (e.g. 12% or 18% p.a.)"
            required
          />

          {/* Live Interest Rate Preview Card */}
          {numAmt > 0 && numRt > 0 ? (
            <View style={styles.previewCard}>
              <View style={styles.previewHeaderRow}>
                <Text style={styles.previewTitle}>⚡ Interest Accrual Rate</Text>
                <Text style={styles.previewRateBadge}>{numRt}% p.a.</Text>
              </View>
              <View style={styles.previewMetricsRow}>
                <View style={styles.previewMetricItem}>
                  <Text style={styles.previewMetricLabel}>Monthly Accrual</Text>
                  <Text style={styles.previewMetricVal}>
                    {formatCurrency(preview.monthlyInterest)}/mo
                  </Text>
                </View>
                <View style={styles.previewMetricItem}>
                  <Text style={styles.previewMetricLabel}>Daily Accrual</Text>
                  <Text style={styles.previewMetricVal}>
                    {formatCurrency(preview.dailyInterest)}/day
                  </Text>
                </View>
              </View>
              {preview.daysElapsed > 0 ? (
                <Text style={styles.previewElapsedText}>
                  Accrued to date ({preview.daysElapsed} days):{' '}
                  <Text style={styles.previewElapsedBold}>
                    {formatCurrency(preview.accruedInterest)}
                  </Text>{' '}
                  · Total:{' '}
                  <Text style={styles.previewElapsedBold}>
                    {formatCurrency(preview.totalWithInterest)}
                  </Text>
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Bill / Ref Number */}
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
              // default interest start date to bill date if unchanged
              if (interestStartDate === date) {
                setInterestStartDate(val);
              }
              if (errors.date) {
                setErrors(prev => ({ ...prev, date: undefined }));
              }
            }}
            placeholder="2026-10-13"
            error={errors.date}
            required
          />

          {/* Interest Start Date */}
          <Input
            label="Interest Start Date (YYYY-MM-DD)"
            value={interestStartDate}
            onChangeText={val => {
              setInterestStartDate(val);
              if (errors.interestStartDate) {
                setErrors(prev => ({ ...prev, interestStartDate: undefined }));
              }
            }}
            placeholder="2026-10-13"
            helperText="Date from which interest begins accumulating (defaults to bill date)"
            error={errors.interestStartDate}
          />

          {/* Payment Due Date */}
          <Input
            label="Payment Due Date (Optional, YYYY-MM-DD)"
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2026-11-13"
            helperText="Agreed settlement deadline"
          />

          {/* Status Selection */}
          <Text style={styles.fieldLabel}>Bill Status</Text>
          <View style={styles.statusRow}>
            {(['PENDING', 'OVERDUE', 'PAID'] as TransactionStatus[]).map(st => (
              <TouchableOpacity
                key={st}
                onPress={() => setStatus(st)}
                style={[
                  styles.statusBtn,
                  status === st && styles.statusBtnActive,
                ]}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.statusBtnText,
                    status === st && styles.statusBtnTextActive,
                  ]}>
                  {st}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <Input
            label="Consignment / Goods Details"
            value={description}
            onChangeText={setDescription}
            placeholder="Quality grade, weight, truck number, buyer agreement notes..."
            multiline
            numberOfLines={3}
            style={styles.inputMargin}
          />

          <Button
            title={isEditing ? 'Update Bill' : 'Record Bill & Track Interest'}
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
    fontSize: 14,
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
    fontSize: 13,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  companyPillTextSelected: {
    color: '#FFFFFF',
  },
  previewCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  previewRateBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  previewMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  previewMetricItem: {
    flex: 1,
  },
  previewMetricLabel: {
    fontSize: 11,
    color: '#15803D',
  },
  previewMetricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
    marginTop: 2,
  },
  previewElapsedText: {
    fontSize: 12,
    color: '#15803D',
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
    paddingTop: 6,
    marginTop: 4,
  },
  previewElapsedBold: {
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  statusBtnTextActive: {
    color: '#FFFFFF',
  },
  inputMargin: {
    marginTop: 4,
  },
  saveBtn: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
    marginBottom: 8,
  },
});
