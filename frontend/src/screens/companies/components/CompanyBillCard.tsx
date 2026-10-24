import React from 'react';
import { Text, View } from 'react-native';
import { Badge } from '../../../components/common/Badge';
import { Card } from '../../../components/common/Card';
import { ChevronRight } from '../../../components/common/Icon';
import { Transaction } from '../../../types/transaction';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { styles } from '../CompanyDetailsStyles';

interface DueDaysInfo {
  text: string;
  isOverdue: boolean;
  isNear: boolean;
}

interface CompanyBillCardProps {
  item: Transaction;
  dueInfo: DueDaysInfo | null;
  onPress: () => void;
}

export const CompanyBillCard: React.FC<CompanyBillCardProps> = React.memo(({
  item,
  dueInfo,
  onPress,
}) => {
  const dalaliRate =
    item.dalaliRate ??
    item.monthlyInterestRate ??
    (item.interestRate ? item.interestRate / 12 : 1.0);
  const dalaliAmount =
    item.dalaliAmount ?? (item.amount * dalaliRate) / 100;

  return (
    <Card
      onPress={onPress}
      style={[
        styles.txCard,
        dueInfo?.isOverdue && styles.txCardOverdue,
        dueInfo?.isNear && styles.txCardNear,
      ]}>
      <View style={styles.txHeaderRow}>
        <View style={styles.txHeaderLeft}>
          <Text style={styles.txNumber}>
            {item.billNumber ? `Bill #${item.billNumber}` : 'Direct Bill'}
          </Text>
          <Text style={styles.txDate}>Billed: {formatDate(item.date)}</Text>
        </View>

        <View style={styles.txHeaderRight}>
          <Badge status={item.status} />
          {dueInfo ? (
            <View
              style={[
                styles.dueBadge,
                dueInfo.isOverdue && styles.dueBadgeOverdue,
                dueInfo.isNear && styles.dueBadgeNear,
              ]}>
              <Text
                style={[
                  styles.dueBadgeText,
                  dueInfo.isOverdue && styles.dueBadgeTextOverdue,
                  dueInfo.isNear && styles.dueBadgeTextNear,
                ]}>
                {dueInfo.text}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {item.dueDate ? (
        <View style={styles.dueDateRow}>
          <Text style={styles.dueDateLabel}>
            Payment Due:{' '}
            <Text style={styles.dueDateVal}>{formatDate(item.dueDate)}</Text>
          </Text>
        </View>
      ) : null}

      <View style={styles.cardFinancialsRow}>
        <View style={styles.cardFinancialCol}>
          <Text style={styles.cardFinLabel}>Bill Amount</Text>
          <Text style={styles.cardFinVal}>{formatCurrency(item.amount)}</Text>
        </View>

        <View style={styles.cardFinancialDivider} />

        <View style={styles.cardFinancialCol}>
          <Text style={styles.cardFinLabel}>Dalali ({dalaliRate}%)</Text>
          <Text style={[styles.cardFinVal, styles.cardInterestVal]}>
            +{formatCurrency(dalaliAmount)}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardDaysText}>{dalaliRate}% Dalali commission</Text>
        <View style={styles.viewLinkRow}>
          <Text style={styles.viewLink}>View details</Text>
          <ChevronRight size={13} color="#2563EB" strokeWidth={2.4} />
        </View>
      </View>
    </Card>
  );
});
