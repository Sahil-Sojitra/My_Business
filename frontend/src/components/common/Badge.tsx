import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { TransactionStatus, TransactionType } from '../../types/transaction';

interface BadgeProps {
  label?: string;
  status?: TransactionStatus;
  type?: TransactionType;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  status,
  type,
  style,
}) => {
  let text = label;
  let bgStyle = styles.defaultBg;
  let textStyle = styles.defaultText;

  if (status) {
    switch (status) {
      case 'PAID':
        text = text || 'Paid';
        bgStyle = styles.paidBg;
        textStyle = styles.paidText;
        break;
      case 'PENDING':
        text = text || 'Pending';
        bgStyle = styles.pendingBg;
        textStyle = styles.pendingText;
        break;
      case 'OVERDUE':
        text = text || 'Overdue';
        bgStyle = styles.overdueBg;
        textStyle = styles.overdueText;
        break;
      case 'PARTIAL':
        text = text || 'Partial';
        bgStyle = styles.partialBg;
        textStyle = styles.partialText;
        break;
    }
  } else if (type) {
    switch (type) {
      case 'BILL':
        text = text || 'Bill';
        bgStyle = styles.billBg;
        textStyle = styles.billText;
        break;
      case 'PAYMENT':
        text = text || 'Payment';
        bgStyle = styles.paymentBg;
        textStyle = styles.paymentText;
        break;
    }
  }

  return (
    <View style={[styles.badge, bgStyle, style]}>
      <Text style={[styles.text, textStyle]}>{text}</Text>
    </View>
  );
};

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
