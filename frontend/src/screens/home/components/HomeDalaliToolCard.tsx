import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight } from '../../../components/common/Icon';
import { styles } from '../HomeStyles';

interface HomeDalaliToolCardProps {
  onPress: () => void;
}

export const HomeDalaliToolCard: React.FC<HomeDalaliToolCardProps> = ({
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.calcToolCard}
      activeOpacity={0.8}
      onPress={onPress}>
      <View style={styles.calcToolLeft}>
        <View style={styles.calcToolIconWrap}>
          <Text style={styles.calcToolIcon}>💼</Text>
        </View>
        <View style={styles.calcToolTextWrap}>
          <Text style={styles.calcToolTitle}>Dalali Calculator</Text>
          <Text style={styles.calcToolSubtitle}>
            Calculate brokerage commission instantly on bill amounts
          </Text>
        </View>
      </View>
      <View style={styles.calcToolBadge}>
        <Text style={styles.calcToolBadgeText}>Calculate</Text>
        <ChevronRight size={13} color="#2563EB" strokeWidth={2.4} />
      </View>
    </TouchableOpacity>
  );
};
