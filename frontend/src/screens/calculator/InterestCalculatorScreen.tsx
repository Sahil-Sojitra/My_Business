import React, { useState } from 'react';
import {
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
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { InterestResult, TimeUnit } from '../../types/calculator';
import {
  calculateSimpleInterest,
  validateInterestInput,
} from '../../utils/calculator';
import { formatCurrency } from '../../utils/formatters';

import { useNavigation } from '../../navigation/NavigationContext';

export const InterestCalculatorScreen: React.FC = () => {
  const navigation = useNavigation();
  const navParams = navigation.params as
    | {
        initialPrincipal?: number;
        initialRate?: number;
        initialTime?: number;
        initialUnit?: TimeUnit;
      }
    | undefined;

  const [principal, setPrincipal] = useState<string>(
    navParams?.initialPrincipal !== undefined
      ? String(navParams.initialPrincipal)
      : '100000'
  );
  const [annualRate, setAnnualRate] = useState<string>(
    navParams?.initialRate !== undefined
      ? String(navParams.initialRate)
      : '12'
  );
  const [time, setTime] = useState<string>(
    navParams?.initialTime !== undefined
      ? String(navParams.initialTime)
      : '12'
  );
  const [unit, setUnit] = useState<TimeUnit>(
    navParams?.initialUnit || 'months'
  );

  const [result, setResult] = useState<InterestResult | null>(null);
  const [errors, setErrors] = useState<{
    principal?: string;
    annualRate?: string;
    time?: string;
  }>({});

  React.useEffect(() => {
    if (navParams?.initialPrincipal) {
      try {
        const numP = Number(navParams.initialPrincipal);
        const numR = Number(navParams.initialRate ?? 12);
        const numT = Number(navParams.initialTime ?? 12);
        const u = navParams.initialUnit || 'months';
        const calc = calculateSimpleInterest({
          principal: numP,
          annualRate: numR,
          time: numT,
          unit: u,
        });
        setResult(calc);
      } catch {
        // ignore
      }
    }
  }, [navParams]);

  const handleCalculate = () => {
    const numPrincipal = parseFloat(principal);
    const numRate = parseFloat(annualRate);
    const numTime = parseFloat(time);

    const validation = validateInterestInput({
      principal: numPrincipal,
      annualRate: numRate,
      time: numTime,
      unit,
    });

    setErrors(validation.errors);

    if (!validation.isValid) {
      setResult(null);
      return;
    }

    try {
      const calc = calculateSimpleInterest({
        principal: numPrincipal,
        annualRate: numRate,
        time: numTime,
        unit,
      });
      setResult(calc);
    } catch (err) {
      setResult(null);
      setErrors({
        principal: err instanceof Error ? err.message : 'Calculation error',
      });
    }
  };

  const handleReset = () => {
    setPrincipal('');
    setAnnualRate('');
    setTime('');
    setUnit('months');
    setResult(null);
    setErrors({});
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <AppHeader
        title="Interest Calculator"
        subtitle="Simple Interest Engine"
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Intro */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Brokerage Interest Estimator</Text>
          <Text style={styles.bannerSub}>
            Estimate financing charge and total payable amount for credit period
          </Text>
        </View>

        {/* Inputs Card */}
        <Card style={styles.inputCard}>
          <Input
            label="Principal Amount (₹)"
            value={principal}
            onChangeText={val => {
              setPrincipal(val);
              if (errors.principal) {
                setErrors(prev => ({ ...prev, principal: undefined }));
              }
            }}
            placeholder="e.g. 100000"
            keyboardType="numeric"
            error={errors.principal}
            required
          />

          <Input
            label="Annual Interest Rate (%)"
            value={annualRate}
            onChangeText={val => {
              setAnnualRate(val);
              if (errors.annualRate) {
                setErrors(prev => ({ ...prev, annualRate: undefined }));
              }
            }}
            placeholder="e.g. 12 (for 12% p.a.)"
            keyboardType="numeric"
            error={errors.annualRate}
            required
          />

          {/* Time period + Unit */}
          <View style={styles.timeSection}>
            <View style={styles.timeInputWrapper}>
              <Input
                label="Time Period"
                value={time}
                onChangeText={val => {
                  setTime(val);
                  if (errors.time) {
                    setErrors(prev => ({ ...prev, time: undefined }));
                  }
                }}
                placeholder={unit === 'months' ? 'e.g. 6' : 'e.g. 1'}
                keyboardType="numeric"
                error={errors.time}
                required
              />
            </View>

            <View style={styles.unitWrapper}>
              <Text style={styles.unitLabel}>Unit</Text>
              <View style={styles.unitRow}>
                <TouchableOpacity
                  onPress={() => setUnit('months')}
                  style={[
                    styles.unitBtn,
                    unit === 'months' && styles.unitBtnActive,
                  ]}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.unitBtnText,
                      unit === 'months' && styles.unitBtnTextActive,
                    ]}>
                    Months
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setUnit('years')}
                  style={[
                    styles.unitBtn,
                    unit === 'years' && styles.unitBtnActive,
                  ]}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.unitBtnText,
                      unit === 'years' && styles.unitBtnTextActive,
                    ]}>
                    Years
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Button
              title="Reset"
              onPress={handleReset}
              variant="outline"
              size="md"
              style={styles.resetBtn}
            />
            <Button
              title="Calculate Interest"
              onPress={handleCalculate}
              variant="primary"
              size="md"
              style={styles.calcBtn}
            />
          </View>
        </Card>

        {/* Calculation Result */}
        {result ? (
          <Card style={styles.resultCard}>
            <Text style={styles.resultTitle}>Calculation Breakdown</Text>

            <View style={styles.metricHero}>
              <Text style={styles.resultLabel}>Calculated Interest</Text>
              <Text style={styles.interestValue}>
                {formatCurrency(result.interest)}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Payable Amount</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(result.totalPayable)}
              </Text>
            </View>

            <View style={styles.breakdownDetails}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownKey}>Principal Borrowed</Text>
                <Text style={styles.breakdownVal}>
                  {formatCurrency(result.principal)}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownKey}>Interest Rate</Text>
                <Text style={styles.breakdownVal}>
                  {result.annualRate}% per annum
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownKey}>Duration</Text>
                <Text style={styles.breakdownVal}>
                  {result.timeInput} {result.unit} (
                  {result.timeInYears} year
                  {result.timeInYears !== 1 ? 's' : ''})
                </Text>
              </View>
            </View>

            <View style={styles.formulaBanner}>
              <Text style={styles.formulaText}>
                Formula: Simple Interest = (Principal × Rate × Time in Years) /
                100
              </Text>
            </View>
          </Card>
        ) : null}
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
  banner: {
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  bannerSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 3,
  },
  inputCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  timeSection: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInputWrapper: {
    flex: 1,
  },
  unitWrapper: {
    width: 135,
    marginBottom: 16,
  },
  unitLabel: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  unitRow: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  unitBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  unitBtnActive: {
    backgroundColor: '#2563EB',
  },
  unitBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  unitBtnTextActive: {
    color: '#FFFFFF',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  resetBtn: {
    flex: 1,
  },
  calcBtn: {
    flex: 2,
  },
  resultCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
  },
  resultTitle: {
    fontSize: 17.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  metricHero: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    marginBottom: 14,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  interestValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  breakdownDetails: {
    paddingVertical: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  breakdownKey: {
    fontSize: 14,
    color: '#64748B',
  },
  breakdownVal: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#334155',
  },
  formulaBanner: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  formulaText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
