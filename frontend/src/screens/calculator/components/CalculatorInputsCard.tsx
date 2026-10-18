import React from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { formatCurrency } from '../../../utils/formatters';
import { styles } from '../InterestCalculatorStyles';

const PRESET_RATES = ['1.0', '1.5', '2.0', '2.5', '3.0'];

interface CalculatorInputsCardProps {
  billAmount: string;
  onBillAmountChange: (val: string) => void;
  dalaliRate: string;
  onDalaliRateChange: (val: string) => void;
  deductTds: boolean;
  onTdsToggle: (val: boolean) => void;
  errors: { billAmount?: string; dalaliRate?: string };
  onReset: () => void;
  onRecalculate: () => void;
}

export const CalculatorInputsCard: React.FC<CalculatorInputsCardProps> = ({
  billAmount,
  onBillAmountChange,
  dalaliRate,
  onDalaliRateChange,
  deductTds,
  onTdsToggle,
  errors,
  onReset,
  onRecalculate,
}) => {
  const parsedAmount = parseFloat(billAmount) || 0;

  return (
    <Card style={styles.inputCard}>
      <Input
        label="Consignment / Bill Amount (₹)"
        value={billAmount}
        onChangeText={onBillAmountChange}
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
          onChangeText={onDalaliRateChange}
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
                onPress={() => onDalaliRateChange(preset)}
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
          onValueChange={onTdsToggle}
          trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
          thumbColor={deductTds ? '#2563EB' : '#FFFFFF'}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <Button
          title="Reset"
          onPress={onReset}
          variant="outline"
          size="md"
          style={styles.resetBtn}
        />
        <Button
          title="Re-calculate"
          onPress={onRecalculate}
          variant="primary"
          size="md"
          style={styles.calcBtn}
        />
      </View>
    </Card>
  );
};
