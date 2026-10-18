import React from 'react';
import { Text, View } from 'react-native';
import { Badge } from '../../../components/common/Badge';
import { Card } from '../../../components/common/Card';
import { Transaction } from '../../../types/transaction';
import { formatCurrency } from '../../../utils/formatters';
import { styles } from '../TransactionDetailsStyles';

interface HeroDalaliCardProps {
  bill: Transaction;
  dalaliRate: number;
  dalaliAmount: number;
}

export const HeroDalaliCard: React.FC<HeroDalaliCardProps> = ({
  bill,
  dalaliRate,
  dalaliAmount,
}) => {
  return (
    <Card style={styles.heroCard}>
      <View style={styles.badgeRow}>
        <Badge status={bill.status} />
        <View style={styles.ratePill}>
          <Text style={styles.ratePillText}>{dalaliRate}% Dalali</Text>
        </View>
      </View>

      <Text style={styles.totalPayableLabel}>Broker Dalali Commission</Text>
      <Text style={styles.totalPayableValue}>
        {formatCurrency(dalaliAmount)}
      </Text>

      <View style={styles.heroBreakdownRow}>
        <View style={styles.heroBreakdownItem}>
          <Text style={styles.heroSubLabel}>Invoice Bill Value</Text>
          <Text style={styles.heroSubVal}>{formatCurrency(bill.amount)}</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroBreakdownItem}>
          <Text style={styles.heroSubLabel}>Commission Rate</Text>
          <Text style={[styles.heroSubVal, styles.interestHighlight]}>
            {dalaliRate}% Rate
          </Text>
        </View>
      </View>
    </Card>
  );
};
