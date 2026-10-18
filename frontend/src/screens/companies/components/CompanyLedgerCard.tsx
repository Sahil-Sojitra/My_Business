import React from 'react';
import { Text, View } from 'react-native';
import { Card } from '../../../components/common/Card';
import { formatCurrency } from '../../../utils/formatters';
import { styles } from '../CompanyDetailsStyles';

interface CompanyLedgerCardProps {
  totalPrincipal: number;
  totalDalali: number;
}

export const CompanyLedgerCard: React.FC<CompanyLedgerCardProps> = ({
  totalPrincipal,
  totalDalali,
}) => {
  return (
    <Card style={styles.ledgerCard}>
      <Text style={styles.ledgerTitle}>Firm Ledger & Total Dalali</Text>
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total Bill Turnover</Text>
          <Text style={styles.metricVal}>
            {formatCurrency(totalPrincipal)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total Dalali Receivable</Text>
          <Text style={[styles.metricVal, styles.interestVal]}>
            +{formatCurrency(totalDalali)}
          </Text>
        </View>
      </View>
    </Card>
  );
};
