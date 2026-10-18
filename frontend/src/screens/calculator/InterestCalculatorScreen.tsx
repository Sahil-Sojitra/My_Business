import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { AppHeader } from '../../components/common/AppHeader';
import { useNavigation } from '../../navigation/NavigationContext';
import { DalaliResult } from '../../types/calculator';
import { calculateDalali, validateDalaliInput } from '../../utils/calculator';
import { CalculatorInputsCard } from './components/CalculatorInputsCard';
import { CalculatorResultsCard } from './components/CalculatorResultsCard';
import { styles } from './InterestCalculatorStyles';

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
        <CalculatorInputsCard
          billAmount={billAmount}
          onBillAmountChange={handleBillAmountChange}
          dalaliRate={dalaliRate}
          onDalaliRateChange={handleRateChange}
          deductTds={deductTds}
          onTdsToggle={handleTdsToggle}
          errors={errors}
          onReset={handleReset}
          onRecalculate={() => computeDalali(billAmount, dalaliRate, deductTds)}
        />

        {/* Calculation Result */}
        {result ? (
          <CalculatorResultsCard
            result={result}
            onRecordBillWithDalali={handleCreateBillWithDalali}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export const DalaliCalculatorScreen = InterestCalculatorScreen;
