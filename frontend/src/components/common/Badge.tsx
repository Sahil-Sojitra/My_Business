import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
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
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  defaultBg: {
    backgroundColor: colors.backgroundSubtle,
    borderColor: colors.border,
  },
  defaultText: {
    color: colors.textSecondary,
  },
  paidBg: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  paidText: {
    color: colors.successText,
  },
  pendingBg: {
    backgroundColor: colors.champagneLight,
    borderColor: colors.champagneBorder,
  },
  pendingText: {
    color: colors.textOnChampagne,
  },
  overdueBg: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
  },
  overdueText: {
    color: colors.errorText,
  },
  outstandingBg: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warningBorder,
  },
  outstandingText: {
    color: colors.warningText,
  },
  billBg: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLightBorder,
  },
  billText: {
    color: colors.primary,
  },
  paymentBg: {
    backgroundColor: colors.champagneLight,
    borderColor: colors.champagneBorder,
  },
  paymentText: {
    color: colors.textOnChampagne,
  },
});

const STATUS_CONFIG: Record<
  TransactionStatus,
  { text: string; bg: ViewStyle; textStyle: TextStyle }
> = {
  PAID: { text: 'Settled', bg: styles.paidBg, textStyle: styles.paidText },
  PENDING: { text: 'Pending', bg: styles.pendingBg, textStyle: styles.pendingText },
  OVERDUE: { text: 'Overdue', bg: styles.overdueBg, textStyle: styles.overdueText },
  OUTSTANDING: { text: 'Outstanding', bg: styles.outstandingBg, textStyle: styles.outstandingText },
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
