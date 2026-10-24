import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { TransactionStatus, TransactionType } from '../../types/transaction';

interface BadgeProps {
  label?: string;
  status?: TransactionStatus;
  type?: TransactionType;
  style?: ViewStyle;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  defaultBg: {
    backgroundColor: '#F1F5F9',
  },
  defaultText: {
    color: '#475569',
  },
  paidBg: {
    backgroundColor: '#DCFCE7',
  },
  paidText: {
    color: '#166534',
  },
  pendingBg: {
    backgroundColor: '#FEF3C7',
  },
  pendingText: {
    color: '#92400E',
  },
  overdueBg: {
    backgroundColor: '#FEE2E2',
  },
  overdueText: {
    color: '#B91C1C',
  },
  partialBg: {
    backgroundColor: '#E0E7FF',
  },
  partialText: {
    color: '#3730A3',
  },
  billBg: {
    backgroundColor: '#F3E8FF',
  },
  billText: {
    color: '#6B21A8',
  },
  paymentBg: {
    backgroundColor: '#CCFBF1',
  },
  paymentText: {
    color: '#115E59',
  },
});

const STATUS_CONFIG: Record<
  TransactionStatus,
  { text: string; bg: ViewStyle; textStyle: TextStyle }
> = {
  PAID: { text: 'Settled', bg: styles.paidBg, textStyle: styles.paidText },
  PENDING: { text: 'Pending', bg: styles.pendingBg, textStyle: styles.pendingText },
  OVERDUE: { text: 'Overdue', bg: styles.overdueBg, textStyle: styles.overdueText },
  PARTIAL: { text: 'Partial', bg: styles.partialBg, textStyle: styles.partialText },
};

const TYPE_CONFIG: Record<
  TransactionType,
  { text: string; bg: ViewStyle; textStyle: TextStyle }
> = {
  BILL: { text: 'Bill', bg: styles.billBg, textStyle: styles.billText },
  PAYMENT: { text: 'Payment', bg: styles.paymentBg, textStyle: styles.paymentText },
};

export const Badge: React.FC<BadgeProps> = React.memo(({
  label,
  status,
  type,
  style,
}) => {
  const config = status
    ? STATUS_CONFIG[status]
    : type
    ? TYPE_CONFIG[type]
    : undefined;

  const text = label || config?.text;
  const bgStyle = config?.bg || styles.defaultBg;
  const textStyle = config?.textStyle || styles.defaultText;

  return (
    <View style={[styles.badge, bgStyle, style]}>
      <Text style={[styles.text, textStyle]}>{text}</Text>
    </View>
  );
});
