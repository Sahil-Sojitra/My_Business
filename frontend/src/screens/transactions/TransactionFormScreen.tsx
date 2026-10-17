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
  const [monthlyInterestRate, setMonthlyInterestRate] = useState<string>('1.5');
  const [billNumber, setBillNumber] = useState<string>('');
  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>('');
  const [interestStartDate, setInterestStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState<string>('');

  // Built-in Calculator helper state for credit duration estimation
  const [calcDuration, setCalcDuration] = useState<string>('30');
  const [calcUnit, setCalcUnit] = useState<'days' | 'months'>('days');

  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    company?: string;
    amount?: string;
    monthlyInterestRate?: string;
    date?: string;
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
            const rate =
              tx.monthlyInterestRate ??
              (tx.interestRate ? tx.interestRate / 12 : 1.5);
            setMonthlyInterestRate(String(rate));
            setBillNumber(tx.billNumber || '');
            setDate(tx.date);
            setInterestStartDate(tx.interestStartDate || tx.date);
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

    const numRate = parseFloat(monthlyInterestRate);
    if (!monthlyInterestRate.trim()) {
      newErrors.monthlyInterestRate = 'Monthly interest rate is required';
    } else if (isNaN(numRate) || numRate < 0) {
      newErrors.monthlyInterestRate = 'Interest rate cannot be negative';
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
      const parsedRate = parseFloat(monthlyInterestRate);
      const payload = {
        companyId: selectedCompany.id,
        companyName: selectedCompany.name,
        amount: parseFloat(amount),
        monthlyInterestRate: parsedRate,
        interestRate: parsedRate * 12,
        billNumber: billNumber.trim() || undefined,
        date: date.trim(),
        interestStartDate: interestStartDate.trim() || date.trim(),
        dueDate: dueDate.trim() || undefined,
        status: 'PENDING' as const, // Status defaults to PENDING
        description: description.trim() || undefined,
      };

      if (isEditing && transactionId) {
        await transactionService.update(transactionId, payload);
        Alert.alert('Success', 'Bill updated successfully');
        navigation.navigate('TransactionDetails', { transactionId });
      } else {
        const created = await transactionService.create(payload);
        Alert.alert('Success', 'Bill created with status Pending');
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

  // Live Interest Calculations
  const numAmt = parseFloat(amount) || 0;
  const numMonthlyRate = parseFloat(monthlyInterestRate) || 0;

  // Monthly & daily interest
  const monthlyInterest = (numAmt * numMonthlyRate) / 100;
  const dailyInterest = (numAmt * numMonthlyRate) / 3000;

  // Credit period interest from calculator duration input
  const numDur = parseFloat(calcDuration) || 0;
  const creditPeriodInterest =
    calcUnit === 'days'
      ? (numAmt * numMonthlyRate * numDur) / 3000
      : (numAmt * numMonthlyRate * numDur) / 100;
  const totalPayableWithCredit = numAmt + creditPeriodInterest;

  // Live accrued interest to today
  const accruedStats = calculateAccruedBillInterest(
    numAmt,
    numMonthlyRate,
    interestStartDate || date
  );

  if (loadingInitial) {
    return <LoadingSpinner message="Loading bill form..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <AppHeader
        title={isEditing ? 'Edit Bill' : 'Record Bill'}
        subtitle="Sales invoice & live interest calculator"
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

          {/* Amount */}
          <Input
            label="Bill Amount (₹) *"
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

          {/* Monthly Interest Rate User Input */}
          <Input
            label="Monthly Interest Rate (% per month) *"
            value={monthlyInterestRate}
            onChangeText={val => {
              setMonthlyInterestRate(val);
              if (errors.monthlyInterestRate) {
                setErrors(prev => ({
                  ...prev,
                  monthlyInterestRate: undefined,
                }));
              }
            }}
            placeholder="e.g. 1.5 (for 1.5% / month)"
            keyboardType="numeric"
            error={errors.monthlyInterestRate}
            helperText="Broker interest per month (e.g. 1.0%, 1.5%, 2.0% per month)"
            required
          />

          {/* Built-in Interactive Interest Calculator Section */}
          <View style={styles.calculatorSection}>
            <View style={styles.calcHeaderRow}>
              <Text style={styles.calcTitle}>🧮 Live Interest Calculator</Text>
              <Text style={styles.calcRateBadge}>
                {numMonthlyRate}% / month ({numMonthlyRate * 12}% p.a.)
              </Text>
            </View>

            <View style={styles.calcMetricsRow}>
              <View style={styles.calcMetricBox}>
                <Text style={styles.calcMetricLabel}>Monthly Interest</Text>
                <Text style={styles.calcMetricVal}>
                  {formatCurrency(monthlyInterest)}
                </Text>
              </View>
              <View style={styles.calcMetricBox}>
                <Text style={styles.calcMetricLabel}>Daily Interest</Text>
                <Text style={styles.calcMetricVal}>
                  {formatCurrency(dailyInterest)}
                </Text>
              </View>
            </View>

            {/* Credit Duration Estimator */}
            <View style={styles.calcPeriodRow}>
              <View style={styles.calcDurationInputWrapper}>
                <Text style={styles.calcSmallLabel}>Credit Duration</Text>
                <Input
                  value={calcDuration}
                  onChangeText={setCalcDuration}
                  placeholder="30"
                  keyboardType="numeric"
                  style={styles.noMarginInput}
                />
              </View>

              <View style={styles.calcUnitSwitchWrapper}>
                <Text style={styles.calcSmallLabel}>Duration Unit</Text>
                <View style={styles.unitToggleGroup}>
                  <TouchableOpacity
                    onPress={() => setCalcUnit('days')}
                    style={[
                      styles.unitToggleBtn,
                      calcUnit === 'days' && styles.unitToggleBtnActive,
                    ]}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.unitToggleText,
                        calcUnit === 'days' && styles.unitToggleTextActive,
                      ]}>
                      Days
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setCalcUnit('months')}
                    style={[
                      styles.unitToggleBtn,
                      calcUnit === 'months' && styles.unitToggleBtnActive,
                    ]}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.unitToggleText,
                        calcUnit === 'months' && styles.unitToggleTextActive,
                      ]}>
                      Months
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Credit Interest Result Banner */}
            {numAmt > 0 && numMonthlyRate > 0 && numDur > 0 ? (
              <View style={styles.calcResultBanner}>
                <Text style={styles.calcResultLabel}>
                  Estimated Interest for {numDur} {calcUnit}:
                </Text>
                <Text style={styles.calcResultVal}>
                  +{formatCurrency(creditPeriodInterest)}
                </Text>
                <Text style={styles.calcTotalText}>
                  Total Payable at maturity:{' '}
                  <Text style={styles.calcTotalBold}>
                    {formatCurrency(totalPayableWithCredit)}
                  </Text>
                </Text>
              </View>
            ) : null}

            {accruedStats.daysElapsed > 0 ? (
              <Text style={styles.liveAccruedText}>
                Live Accrued to Date ({accruedStats.daysElapsed} days):{' '}
                <Text style={styles.liveAccruedBold}>
                  +{formatCurrency(accruedStats.accruedInterest)}
                </Text>{' '}
                · Current Total:{' '}
                <Text style={styles.liveAccruedBold}>
                  {formatCurrency(accruedStats.totalWithInterest)}
                </Text>
              </Text>
            ) : null}
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

          {/* Payment Due Date */}
          <Input
            label="Payment Due Date (YYYY-MM-DD)"
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2026-11-13"
            helperText="Settlement deadline (closest due date appears first on firm list)"
          />

          {/* Interest Start Date */}
          <Input
            label="Interest Start Date (YYYY-MM-DD)"
            value={interestStartDate}
            onChangeText={setInterestStartDate}
            placeholder="2026-10-13"
            helperText="Date from which monthly interest begins counting (defaults to bill date)"
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
  calculatorSection: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  calcHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calcTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#166534',
  },
  calcRateBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  calcMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  calcMetricBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  calcMetricLabel: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '500',
  },
  calcMetricVal: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#166534',
    marginTop: 2,
  },
  calcPeriodRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  calcDurationInputWrapper: {
    flex: 1,
  },
  calcUnitSwitchWrapper: {
    width: 135,
  },
  calcSmallLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 5,
  },
  noMarginInput: {
    marginBottom: 0,
  },
  unitToggleGroup: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 3,
  },
  unitToggleBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  unitToggleBtnActive: {
    backgroundColor: '#16A34A',
  },
  unitToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  unitToggleTextActive: {
    color: '#FFFFFF',
  },
  calcResultBanner: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    padding: 12,
    marginTop: 2,
  },
  calcResultLabel: {
    fontSize: 13,
    color: '#15803D',
  },
  calcResultVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#15803D',
    marginVertical: 3,
  },
  calcTotalText: {
    fontSize: 13,
    color: '#166534',
  },
  calcTotalBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  liveAccruedText: {
    fontSize: 12,
    color: '#15803D',
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    paddingTop: 9,
    marginTop: 9,
  },
  liveAccruedBold: {
    fontWeight: '700',
  },
  inputMargin: {
    marginTop: 4,
  },
  saveBtn: {
    marginTop: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
    marginBottom: 8,
  },
});
