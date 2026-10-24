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

import { colors } from '../../theme/colors';
import { ArrowLeft } from './Icon';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    label?: string;
    icon?: React.ReactNode;
    onPress: () => void;
    variant?: 'primary' | 'danger' | 'ghost' | 'icon';
    accessibilityLabel?: string;
  };
  rightComponent?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = React.memo(({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  rightComponent,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleBack = React.useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  }, [onBack, navigation]);

  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const topInset = Math.max(insets.top, statusBarHeight);
  // Add 14dp of comfortable breathing room below status bar
  const headerPaddingTop = topInset + 14;

  const containerStyle = React.useMemo(
    () => [styles.headerContainer, { paddingTop: headerPaddingTop }],
    [headerPaddingTop],
  );

  return (
    <View style={containerStyle}>
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
              <ArrowLeft size={19} color={colors.textPrimary} strokeWidth={2.4} />
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

        {rightComponent ? (
          rightComponent
        ) : rightAction ? (
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={[
              rightAction.icon || rightAction.variant === 'icon'
                ? styles.rightIconButton
                : styles.rightButton,
              rightAction.variant === 'primary' && styles.rightButtonPrimary,
              rightAction.variant === 'danger' && styles.rightButtonDanger,
            ]}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={
              rightAction.accessibilityLabel || rightAction.label || 'Action'
            }>
            {rightAction.icon ? (
              rightAction.icon
            ) : (
              <Text
                style={[
                  styles.rightButtonText,
                  rightAction.variant === 'primary' &&
                    styles.rightButtonTextPrimary,
                  rightAction.variant === 'danger' &&
                    styles.rightButtonTextDanger,
                ]}>
                {rightAction.label}
              </Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightButton: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  rightButtonPrimary: {
    backgroundColor: colors.primary,
  },
  rightButtonDanger: {
    backgroundColor: colors.errorBg,
  },
  rightButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rightButtonTextPrimary: {
    color: colors.textInverse,
  },
  rightButtonTextDanger: {
    color: colors.errorText,
  },
  rightIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.champagneLight,
    borderWidth: 1.5,
    borderColor: colors.champagne,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.champagneDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
});
