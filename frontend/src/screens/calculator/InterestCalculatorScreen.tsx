import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppHeader } from '../../components/common/AppHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ChevronRight } from '../../components/common/Icon';
import { Input } from '../../components/common/Input';
import { useNavigation } from '../../navigation/NavigationContext';
import { DalaliResult } from '../../types/calculator';
import { calculateDalali, validateDalaliInput } from '../../utils/calculator';
import { formatCurrency } from '../../utils/formatters';

const PRESET_RATES = ['1.0', '1.5', '2.0', '2.5', '3.0'];

export const InterestCalculatorScreen: React.FC = () => {
  const navigation = useNavigation();
  const navParams = navigation.params as
    | {
        initialBillAmount?: number;
        initialDalaliRate?: number;
        initialPrincipal?: number;
        initialRate?: number;
      }
    | undefined;

  const [billAmount, setBillAmount] = useState<string>(() => {
    if (navParams?.initialBillAmount !== undefined) {
      return String(navParams.initialBillAmount);
    }
    if (navParams?.initialPrincipal !== undefined) {
      return String(navParams.initialPrincipal);
    }
    return '100000';
  });

  const [dalaliRate, setDalaliRate] = useState<string>(() => {
    if (navParams?.initialDalaliRate !== undefined) {
      return String(navParams.initialDalaliRate);
    }
    if (navParams?.initialRate !== undefined) {
      return String(navParams.initialRate);
    }
    return '1.5';
  });

  const [deductTds, setDeductTds] = useState<boolean>(false);
  const [result, setResult] = useState<DalaliResult | null>(null);
  const [errors, setErrors] = useState<{
    billAmount?: string;
    dalaliRate?: string;
  }>({});

  const computeDalali = (amtStr: string, rateStr: string, withTds: boolean) => {
    const numAmt = parseFloat(amtStr);
    const numRate = parseFloat(rateStr);

    const validation = validateDalaliInput({
      billAmount: numAmt,
      dalaliRate: numRate,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      setResult(null);
      return;
    }

    setErrors({});
    try {
      const res = calculateDalali({
        billAmount: numAmt,
        dalaliRate: numRate,
        deductTds: withTds,
        tdsRate: 5,
      });
      setResult(res);
    } catch {
      setResult(null);
    }
  };

  useEffect(() => {
    computeDalali(billAmount, dalaliRate, deductTds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBillAmountChange = (val: string) => {
    setBillAmount(val);
    computeDalali(val, dalaliRate, deductTds);
  };

  const handleRateChange = (val: string) => {
    setDalaliRate(val);
    computeDalali(billAmount, val, deductTds);
  };

  const handleSelectPreset = (rate: string) => {
    setDalaliRate(rate);
    computeDalali(billAmount, rate, deductTds);
  };

  const handleTdsToggle = (val: boolean) => {
    setDeductTds(val);
    computeDalali(billAmount, dalaliRate, val);
  };

  const handleReset = () => {
    setBillAmount('');
    setDalaliRate('1.5');
    setDeductTds(false);
    setResult(null);
    setErrors({});
  };

  const handleCreateBillWithDalali = () => {
    if (!result) {
      return;
    }
    navigation.navigate('TransactionForm', {
      initialAmount: result.billAmount,
      initialDalaliRate: result.dalaliRate,
      initialDalaliAmount: result.grossDalaliAmount,
    });
  };

  const parsedAmount = parseFloat(billAmount) || 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <AppHeader
        title="Dalali Calculator"
        subtitle="Brokerage commission computation"
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Intro Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Brokerage (Dalali) Engine</Text>
          <Text style={styles.bannerSub}>
            Instant brokerage computation based on consignment turnover and
            agreed commission percentage. No interest or credit period.
          </Text>
        </View>

        {/* Inputs Card */}
        <Card style={styles.inputCard}>
          <Input
            label="Consignment / Bill Amount (₹)"
            value={billAmount}
            onChangeText={handleBillAmountChange}
            placeholder="e.g. 100000"
            keyboardType="numeric"
            error={errors.billAmount}
            required
          />
          {parsedAmount > 0 ? (
            <View style={styles.amountPreview}>
              <Text style={styles.amountPreviewLabel}>Turnover Value:</Text>
              <Text style={styles.amountPreviewVal}>
                {formatCurrency(parsedAmount)}
              </Text>
            </View>
          ) : null}

          {/* Dalali Rate Input & Presets */}
          <View style={styles.rateSection}>
            <Input
              label="Dalali Commission Rate (%)"
              value={dalaliRate}
              onChangeText={handleRateChange}
              placeholder="e.g. 1.5"
              keyboardType="numeric"
              error={errors.dalaliRate}
              required
            />

            <Text style={styles.presetHeading}>Standard Brokerage Rates</Text>
            <View style={styles.presetRow}>
              {PRESET_RATES.map(preset => {
                const isActive = dalaliRate === preset;
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetPill,
                      isActive && styles.presetPillActive,
                    ]}
                    onPress={() => handleSelectPreset(preset)}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.presetText,
                        isActive && styles.presetTextActive,
                      ]}>
                      {preset}%
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Optional TDS 194H Toggle */}
          <View style={styles.tdsToggleContainer}>
            <View style={styles.tdsTextWrap}>
              <Text style={styles.tdsTitle}>Deduct TDS (5% u/s 194H)</Text>
              <Text style={styles.tdsSub}>
                Applicable when annual brokerage exceeds ₹15,000
              </Text>
            </View>
            <Switch
              value={deductTds}
              onValueChange={handleTdsToggle}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={deductTds ? '#2563EB' : '#FFFFFF'}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Button
              title="Reset"
              onPress={handleReset}
              variant="outline"
              size="md"
              style={styles.resetBtn}
            />
            <Button
              title="Re-calculate"
              onPress={() => computeDalali(billAmount, dalaliRate, deductTds)}
              variant="primary"
              size="md"
              style={styles.calcBtn}
            />
          </View>
        </Card>

        {/* Calculation Result */}
        {result ? (
          <Card style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Brokerage Commission</Text>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>Broker's Earning</Text>
              </View>
            </View>

            {/* Primary Hero Metric */}
            <View style={styles.metricHero}>
              <Text style={styles.resultLabel}>
                {result.deductTds
                  ? 'Net In-Hand Dalali (After TDS)'
                  : 'Total Dalali Receivable'}
              </Text>
              <Text style={styles.interestValue}>
                {formatCurrency(result.netDalaliAmount)}
              </Text>
              <Text style={styles.heroSubText}>
                Calculated at {result.dalaliRate}% on{' '}
                {formatCurrency(result.billAmount)}
              </Text>
            </View>

            {/* Breakdown Details */}
            <View style={styles.breakdownDetails}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownKey}>Consignment Bill Value</Text>
                <Text style={styles.breakdownVal}>
                  {formatCurrency(result.billAmount)}
                </Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownKey}>Agreed Dalali Rate</Text>
                <Text style={styles.breakdownVal}>{result.dalaliRate}%</Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownKey}>Gross Dalali Commission</Text>
                <Text style={[styles.breakdownVal, styles.grossVal]}>
                  {formatCurrency(result.grossDalaliAmount)}
                </Text>
              </View>

              {result.deductTds ? (
                <>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownKey}>
                      Less TDS ({result.tdsRate}% u/s 194H)
                    </Text>
                    <Text style={[styles.breakdownVal, styles.tdsVal]}>
                      -{formatCurrency(result.tdsAmount)}
                    </Text>
                  </View>

                  <View style={[styles.breakdownRow, styles.netRow]}>
                    <Text style={styles.netLabel}>Net In-Hand Dalali</Text>
                    <Text style={styles.netVal}>
                      {formatCurrency(result.netDalaliAmount)}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>

            {/* Practical Broker Domain Callout */}
            <View style={styles.domainNoteBox}>
              <Text style={styles.domainNoteText}>
                💡 Broker Rule: You receive strictly the Dalali commission (
                {formatCurrency(result.netDalaliAmount)}). The bill principal (
                {formatCurrency(result.billAmount)}) is settled between buyer and
                supplier.
              </Text>
            </View>

            {/* Quick Action to record bill */}
            <TouchableOpacity
              style={styles.recordBillBtn}
              onPress={handleCreateBillWithDalali}
              activeOpacity={0.8}>
              <View style={styles.recordBillTextWrap}>
                <Text style={styles.recordBillTitle}>
                  + Record Bill with this Dalali
                </Text>
                <Text style={styles.recordBillSub}>
                  Populate ₹{result.billAmount.toLocaleString()} & {result.dalaliRate}% into a new entry
                </Text>
              </View>
              <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          </Card>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export const DalaliCalculatorScreen = InterestCalculatorScreen;

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
    letterSpacing: -0.3,
  },
  bannerSub: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 19,
  },
  inputCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  amountPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  amountPreviewLabel: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  amountPreviewVal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  rateSection: {
    marginTop: 4,
    marginBottom: 14,
  },
  presetHeading: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    marginTop: -4,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  presetPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  presetText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  tdsToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    marginBottom: 16,
  },
  tdsTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  tdsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  tdsSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  resetBtn: {
    flex: 1,
  },
  calcBtn: {
    flex: 2,
  },
  resultCard: {
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#FFFFFF',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  heroBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  metricHero: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  interestValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: -0.8,
    marginVertical: 4,
  },
  heroSubText: {
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '600',
  },
  breakdownDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginBottom: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownKey: {
    fontSize: 14,
    color: '#64748B',
  },
  breakdownVal: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  grossVal: {
    color: '#15803D',
    fontWeight: '800',
  },
  tdsVal: {
    color: '#DC2626',
    fontWeight: '700',
  },
  netRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 6,
    paddingTop: 10,
  },
  netLabel: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  netVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  domainNoteBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  domainNoteText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  recordBillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  recordBillTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  recordBillTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recordBillSub: {
    fontSize: 11.5,
    color: '#BFDBFE',
    marginTop: 2,
  },
});
