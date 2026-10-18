import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../../../components/common/Card';
import { ChevronRight } from '../../../components/common/Icon';
import { DalaliResult } from '../../../types/calculator';
import { formatCurrency } from '../../../utils/formatters';
import { styles } from '../InterestCalculatorStyles';

interface CalculatorResultsCardProps {
  result: DalaliResult;
  onRecordBillWithDalali: () => void;
}

export const CalculatorResultsCard: React.FC<CalculatorResultsCardProps> = ({
  result,
  onRecordBillWithDalali,
}) => {
  return (
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
        onPress={onRecordBillWithDalali}
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
  );
};
