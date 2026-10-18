import React from 'react';
import { Text, View } from 'react-native';
import { formatCurrency } from '../../../utils/formatters';
import { styles } from '../HomeStyles';

interface HomeHeroCardProps {
  totalDalali: number;
  totalPrincipal: number;
  activeBillsCount: number;
}

export const HomeHeroCard: React.FC<HomeHeroCardProps> = ({
  totalDalali,
  totalPrincipal,
  activeBillsCount,
}) => {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroHeader}>
        <View style={styles.heroTagRow}>
          <View style={styles.heroLiveDot} />
          <Text style={styles.heroLabel}>Total Dalali Receivable</Text>
        </View>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>
            {activeBillsCount} Active Bills
          </Text>
        </View>
      </View>

      <Text style={styles.heroValue}>{formatCurrency(totalDalali)}</Text>

      <View style={styles.heroMetricsRow}>
        <View style={styles.heroMetricCol}>
          <Text style={styles.heroSubLabel}>Total Bill Turnover</Text>
          <Text style={styles.heroSubVal}>{formatCurrency(totalPrincipal)}</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroMetricCol}>
          <Text style={styles.heroSubLabel}>Active Consignments</Text>
          <Text style={[styles.heroSubVal, styles.interestVal]}>
            {activeBillsCount} Pending Bills
          </Text>
        </View>
      </View>
    </View>
  );
};
