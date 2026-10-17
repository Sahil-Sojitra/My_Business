import React from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '../../navigation/NavigationContext';

import { ArrowLeft } from './Icon';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'danger' | 'ghost';
  };
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const topInset = Math.max(insets.top, statusBarHeight);
  // Add 14dp of comfortable breathing room below status bar
  const headerPaddingTop = topInset + 14;

  return (
    <View style={[styles.headerContainer, { paddingTop: headerPaddingTop }]}>
      <View style={styles.contentRow}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Go back"
              accessibilityRole="button">
              <ArrowLeft size={19} color="#0F172A" strokeWidth={2.4} />
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {rightAction && (
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={[
              styles.rightButton,
              rightAction.variant === 'primary' && styles.rightButtonPrimary,
              rightAction.variant === 'danger' && styles.rightButtonDanger,
            ]}
            activeOpacity={0.8}
            accessibilityRole="button">
            <Text
              style={[
                styles.rightButtonText,
                rightAction.variant === 'primary' && styles.rightButtonTextPrimary,
                rightAction.variant === 'danger' && styles.rightButtonTextDanger,
              ]}>
              {rightAction.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  backButton: {
    marginRight: 12,
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  rightButton: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  rightButtonPrimary: {
    backgroundColor: '#2563EB',
  },
  rightButtonDanger: {
    backgroundColor: '#FEE2E2',
  },
  rightButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  rightButtonTextPrimary: {
    color: '#FFFFFF',
  },
  rightButtonTextDanger: {
    color: '#DC2626',
  },
});
