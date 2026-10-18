import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight } from '../../../components/common/Icon';
import { styles } from '../HomeStyles';

interface HomeSummaryGridProps {
  companiesCount: number;
  totalBillsCount: number;
  activeBillsCount: number;
  onCompaniesPress: () => void;
  onBillsPress: () => void;
}

export const HomeSummaryGrid: React.FC<HomeSummaryGridProps> = ({
  companiesCount,
  totalBillsCount,
  activeBillsCount,
  onCompaniesPress,
  onBillsPress,
}) => {
  return (
    <View style={styles.summaryGrid}>
      <TouchableOpacity
        style={styles.summaryCard}
        activeOpacity={0.7}
        onPress={onCompaniesPress}>
        <View style={styles.summaryTopRow}>
          <View style={[styles.iconBox, styles.iconBoxBlue]}>
            <Text style={styles.iconBoxText}>🏢</Text>
          </View>
          <View style={styles.arrowPill}>
            <ChevronRight size={14} color="#64748B" strokeWidth={2.4} />
          </View>
        </View>
        <Text style={styles.summaryValue}>{companiesCount}</Text>
        <Text style={styles.summaryLabel}>Buyer Companies</Text>
        <Text style={styles.summaryHint}>
          {companiesCount}{' '}
          {companiesCount === 1 ? 'registered firm' : 'registered firms'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.summaryCard}
        activeOpacity={0.7}
        onPress={onBillsPress}>
        <View style={styles.summaryTopRow}>
          <View style={[styles.iconBox, styles.iconBoxGreen]}>
            <Text style={styles.iconBoxText}>🧾</Text>
          </View>
          <View style={styles.arrowPill}>
            <ChevronRight size={14} color="#64748B" strokeWidth={2.4} />
          </View>
        </View>
        <Text style={styles.summaryValue}>{totalBillsCount}</Text>
        <Text style={styles.summaryLabel}>Total Bills</Text>
        <Text style={styles.summaryHint}>
          {activeBillsCount} pending · {totalBillsCount - activeBillsCount} settled
        </Text>
      </TouchableOpacity>
    </View>
  );
};
