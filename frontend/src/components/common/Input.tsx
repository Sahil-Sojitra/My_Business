import React, { useRef, useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useKeyboardScroll } from './KeyboardAwareScrollView';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
  required?: boolean;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  required = false,
  maxLength,
  autoCapitalize = 'sentences',
  style,
  onFocus,
  onBlur,
}) => {
  const containerRef = useRef<any>(null);
  const keyboardScroll = useKeyboardScroll();

  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isPasswordVisible, setIsPasswordVisible] =
    useState<boolean>(!secureTextEntry);

  const hasError = Boolean(error);

  const handleFocus = () => {
    setIsFocused(true);
    keyboardScroll?.scrollToInput(containerRef);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <View ref={containerRef} style={[styles.wrapper, style]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required ? <Text style={styles.requiredMark}> *</Text> : null}
        </View>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          multiline && styles.multilineContainer,
          isFocused && styles.inputFocused,
          hasError && styles.inputError,
        ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[styles.input, multiline && styles.multilineInput]}
        />

        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(prev => !prev)}
            style={styles.eyeButton}
            activeOpacity={0.7}
            accessibilityLabel={
              isPasswordVisible ? 'Hide password' : 'Show password'
            }>
            <Text style={styles.eyeText}>
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  requiredMark: {
    color: colors.error,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  multilineContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
    minHeight: 96,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.champagneLight,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    padding: 0,
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  eyeButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  eyeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  errorText: {
    marginTop: 5,
    fontSize: 12.5,
    color: colors.errorText,
    fontWeight: '500',
  },
  helperText: {
    marginTop: 5,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
});
