import React from 'react';
import { Text, View } from 'react-native';
import { formatCurrency } from '../../../utils/formatters';
import { styles } from '../TransactionListStyles';

interface TransactionListSummaryBarProps {
  totalPrincipal: number;
  totalDalali: number;
}

export const TransactionListSummaryBar: React.FC<TransactionListSummaryBarProps> = ({
  totalPrincipal,
  totalDalali,
}) => {
  return (
    <View style={styles.summaryBar}>
      <View style={styles.summaryCol}>
        <Text style={styles.summaryLabel}>Total Bill Turnover</Text>
        <Text style={styles.summaryVal}>{formatCurrency(totalPrincipal)}</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryCol}>
        <Text style={styles.summaryLabel}>Total Dalali Receivable</Text>
        <Text style={[styles.summaryVal, styles.interestVal]}>
          +{formatCurrency(totalDalali)}
        </Text>
      </View>
    </View>
  );
};
