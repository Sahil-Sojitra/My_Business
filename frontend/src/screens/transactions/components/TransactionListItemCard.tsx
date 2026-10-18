import React from 'react';
import { Text, View } from 'react-native';
import { Badge } from '../../../components/common/Badge';
import { Card } from '../../../components/common/Card';
import { ChevronRight } from '../../../components/common/Icon';
import { Transaction } from '../../../types/transaction';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { styles } from '../TransactionListStyles';

interface TransactionListItemCardProps {
  item: Transaction;
  onPress: () => void;
}

export const TransactionListItemCard: React.FC<TransactionListItemCardProps> = ({
  item,
  onPress,
}) => {
  const dalaliRate =
    item.dalaliRate ??
    item.monthlyInterestRate ??
    (item.interestRate ? item.interestRate / 12 : 1.5);
  const dalaliAmount =
    item.dalaliAmount ?? (item.amount * dalaliRate) / 100;

  return (
    <Card onPress={onPress} style={styles.txCard}>
      <View style={styles.txHeader}>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName} numberOfLines={1}>
            {item.companyName}
          </Text>
          <Text style={styles.billNumber}>
            {item.billNumber ? `Inv: ${item.billNumber} · ` : ''}
            {formatDate(item.date)}
          </Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.totalAmount}>
            {formatCurrency(dalaliAmount)}
          </Text>
          <Text style={styles.interestSub}>
            {dalaliRate}% on {formatCurrency(item.amount)}
          </Text>
        </View>
      </View>

      <View style={styles.txFooter}>
        <View style={styles.badgeRow}>
          <Badge status={item.status} />
          <View style={styles.rateTag}>
            <Text style={styles.rateTagText}>{dalaliRate}% Dalali</Text>
          </View>
        </View>
        <View style={styles.viewLinkRow}>
          <Text style={styles.viewLink}>View details</Text>
          <ChevronRight size={13} color="#2563EB" strokeWidth={2.4} />
        </View>
      </View>
    </Card>
  );
};
