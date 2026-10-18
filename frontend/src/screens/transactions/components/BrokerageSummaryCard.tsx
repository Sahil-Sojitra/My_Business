import React from 'react';
import { Text, View } from 'react-native';
import { Card } from '../../../components/common/Card';
import { formatCurrency } from '../../../utils/formatters';
import { styles } from '../TransactionDetailsStyles';

interface BrokerageSummaryCardProps {
  amount: number;
  dalaliRate: number;
  dalaliAmount: number;
}

export const BrokerageSummaryCard: React.FC<BrokerageSummaryCardProps> = ({
  amount,
  dalaliRate,
  dalaliAmount,
}) => {
  return (
    <Card style={styles.interestCard}>
      <View style={styles.interestCardHeader}>
        <Text style={styles.sectionHeading}>💼 Brokerage Summary</Text>
        <View style={styles.ratePill}>
          <Text style={styles.ratePillText}>{dalaliRate}% Commission</Text>
        </View>
      </View>

      <View style={styles.accrualGrid}>
        <View style={styles.accrualItem}>
          <Text style={styles.accrualLabel}>Bill Amount</Text>
          <Text style={styles.accrualVal}>{formatCurrency(amount)}</Text>
        </View>
        <View style={styles.accrualItem}>
          <Text style={styles.accrualLabel}>Dalali Receivable</Text>
          <Text style={[styles.accrualVal, styles.interestHighlight]}>
            {formatCurrency(dalaliAmount)}
          </Text>
        </View>
      </View>

      <View style={styles.dalaliCalcNote}>
        <Text style={styles.dalaliCalcNoteText}>
          Brokerage earned: {dalaliRate}% of {formatCurrency(amount)} ={' '}
          {formatCurrency(dalaliAmount)}
        </Text>
      </View>
    </Card>
  );
};
