import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../HomeStyles';

interface HomeActionCardsProps {
  onRecordBillPress: () => void;
  onAddCompanyPress: () => void;
}

export const HomeActionCards: React.FC<HomeActionCardsProps> = ({
  onRecordBillPress,
  onAddCompanyPress,
}) => {
  return (
    <View style={styles.actionButtonsRow}>
      <TouchableOpacity
        style={[styles.actionBtn, styles.actionBtnPrimary]}
        activeOpacity={0.8}
        onPress={onRecordBillPress}>
        <View style={styles.actionBtnTopRow}>
          <View style={styles.actionBtnIconBoxPrimary}>
            <Text style={styles.actionBtnIconPrimary}>+</Text>
          </View>
          <View style={styles.actionBtnBadgePrimary}>
            <Text style={styles.actionBtnBadgeTextPrimary}>New Deal</Text>
          </View>
        </View>
        <View>
          <Text style={styles.actionBtnTitlePrimary}>Record New Bill</Text>
          <Text style={styles.actionBtnSubPrimary}>Record bill & Dalali %</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionBtn, styles.actionBtnSecondary]}
        activeOpacity={0.8}
        onPress={onAddCompanyPress}>
        <View style={styles.actionBtnTopRow}>
          <View style={styles.actionBtnIconBoxSecondary}>
            <Text style={styles.actionBtnIconSecondary}>+</Text>
          </View>
          <View style={styles.actionBtnBadgeSecondary}>
            <Text style={styles.actionBtnBadgeTextSecondary}>New Client</Text>
          </View>
        </View>
        <View>
          <Text style={styles.actionBtnTitleSecondary}>Add Company</Text>
          <Text style={styles.actionBtnSubSecondary}>
            Register buyer firm & ledger
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};
