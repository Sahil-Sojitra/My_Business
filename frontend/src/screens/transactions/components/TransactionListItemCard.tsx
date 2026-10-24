import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Badge } from '../../../components/common/Badge';
import { Card } from '../../../components/common/Card';
import { CheckIcon, ChevronRight } from '../../../components/common/Icon';
import { colors } from '../../../theme/colors';
import { Transaction } from '../../../types/transaction';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { styles } from '../TransactionListStyles';

interface TransactionListItemCardProps {
  item: Transaction;
  onPress: () => void;
  onSettle?: () => void;
}

export const TransactionListItemCard: React.FC<TransactionListItemCardProps> =
  React.memo(({ item, onPress, onSettle }) => {
  const dalaliRate =
    item.dalaliRate ??
    item.monthlyInterestRate ??
    (item.interestRate ? item.interestRate / 12 : 1.0);
  const dalaliAmount =
    item.dalaliAmount ?? (item.amount * dalaliRate) / 100;

  return (
    <Card onPress={onPress} style={styles.txCard}>
      <View style={styles.txHeader}>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName} numberOfLines={1}>
            {item.companyName}
          </Text>
          <Text style={styles.billNumber} numberOfLines={1}>
            {formatDate(item.date)}
            {item.dueDate ? (
              <Text
                style={
                  item.status === 'OVERDUE'
                    ? styles.overdueDueText
                    : styles.normalDueText
                }>
                {` · ${item.status === 'OVERDUE' ? 'Overdue' : 'Due'}: ${formatDate(item.dueDate)}`}
              </Text>
            ) : null}
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

        <View style={styles.actionRow}>
          {item.status !== 'PAID' && onSettle ? (
            <TouchableOpacity
              style={styles.quickSettleBtn}
              onPress={onSettle}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Settle bill ${item.billNumber || ''}`}>
              <CheckIcon size={12} color={colors.successText} strokeWidth={2.4} />
              <Text style={styles.quickSettleBtnText}>Settle</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.viewLinkRow}>
            <Text style={styles.viewLink}>View</Text>
            <ChevronRight size={13} color={colors.primary} strokeWidth={2.4} />
          </View>
        </View>
      </View>
    </Card>
  );
});
