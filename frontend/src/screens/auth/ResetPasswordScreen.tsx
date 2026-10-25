import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/common/Button';
import { ArrowLeft } from '../../components/common/Icon';
import { Input } from '../../components/common/Input';
import { KeyboardAwareScrollView } from '../../components/common/KeyboardAwareScrollView';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigation } from '../../navigation/NavigationContext';
import { colors } from '../../theme/colors';
import { styles } from './AuthStyles';

const COOLDOWN_SECONDS = 60;

export const ResetPasswordScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { resetPassword, resendOtp, error: authError, clearError } = useAuth();

  const emailParam = navigation.params?.email || '';
  const [email] = useState<string>(emailParam);
  const [otp, setOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(COOLDOWN_SECONDS);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const [validationErrors, setValidationErrors] = useState<{
    otp?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const otpInputRef = useRef<any>(null);

  // Focus OTP input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      otpInputRef.current?.focus();
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  const handleOtpChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 6);
    setOtp(clean);
    if (validationErrors.otp) {
      setValidationErrors(prev => ({ ...prev, otp: undefined }));
    }
    clearError();
  };

  const validate = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!otp || otp.length !== 6) {
      errors.otp = 'Please enter the 6-digit recovery code';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleResetPassword = async () => {
    if (loading) {
      return;
    }
    clearError();
    setResendSuccess(null);

    if (!validate()) {
      return;
    }

    if (!email) {
      setValidationErrors({ otp: 'Missing email address. Please start again.' });
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        email: email.trim().toLowerCase(),
        otp,
        newPassword,
      });

      // On success, navigate to Login with success banner
      navigation.reset('Login', {
        message: 'Password reset successfully. Please sign in with your new password.',
      });
    } catch {
      // Error message set in AuthContext and shown in errorAlert
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) {
      return;
    }
    clearError();
    setResendSuccess(null);

    if (!email) {
      setValidationErrors({ otp: 'Missing email address. Please start again.' });
      return;
    }

    setResending(true);
    try {
      const response = await resendOtp({
        email: email.trim().toLowerCase(),
        purpose: 'PASSWORD_RESET',
      });
      setResendSuccess(
        response.message || 'A new recovery code has been sent to your email.'
      );
      setCooldown(COOLDOWN_SECONDS);
      setOtp('');
      otpInputRef.current?.focus();
    } catch {
      // Error set in AuthContext
    } finally {
      setResending(false);
    }
  };

  const otpDigits = otp.padEnd(6, ' ').split('').slice(0, 6);

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        extraScrollHeight={90}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop:
              Math.max(
                insets.top,
                Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 24
              ) + 24,
            paddingBottom: Math.max(insets.bottom, 24) + 20,
          },
        ]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.backBtn}
            activeOpacity={0.7}>
            <ArrowLeft size={16} color={colors.primary} strokeWidth={2.4} />
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit recovery code and choose a new password
          </Text>
        </View>

        <View style={styles.card}>
          {email ? (
            <View style={styles.emailBadge}>
              <Text style={styles.emailBadgeText}>{email}</Text>
            </View>
          ) : null}

          {resendSuccess ? (
            <View style={styles.successAlert}>
              <Text style={styles.successAlertText}>{resendSuccess}</Text>
            </View>
          ) : null}

          {authError || validationErrors.otp ? (
            <View style={styles.errorAlert}>
              <Text style={styles.errorAlertText}>
                {validationErrors.otp || authError}
              </Text>
            </View>
          ) : null}

          {/* 6-digit visual OTP boxes */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => otpInputRef.current?.focus()}
            style={styles.otpContainer}>
            {otpDigits.map((digit, index) => {
              const isFilled = digit.trim().length > 0;
              const isCurrent =
                index === otp.length || (otp.length === 6 && index === 5);
              return (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    isFilled && styles.otpBoxFilled,
                    isCurrent && styles.otpBoxFocused,
                  ]}>
                  <Text style={styles.otpDigit}>{digit.trim()}</Text>
                </View>
              );
            })}

            {/* Invisible TextInput for native keyboard and paste handling */}
            <TextInput
              ref={otpInputRef}
              value={otp}
              onChangeText={handleOtpChange}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="next"
              style={styles.hiddenInput}
              caretHidden
            />
          </TouchableOpacity>

          {/* Resend Cooldown Section */}
          <View style={styles.cooldownContainer}>
            {cooldown > 0 ? (
              <Text style={styles.cooldownText}>
                Resend code in <Text style={{ fontWeight: '700' }}>{cooldown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResend}
                disabled={resending}
                activeOpacity={0.7}
                style={styles.resendBtn}>
                <Text
                  style={[
                    styles.resendText,
                    resending && styles.resendTextDisabled,
                  ]}>
                  {resending ? 'Sending...' : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Input
            label="New Password"
            value={newPassword}
            onChangeText={val => {
              setNewPassword(val);
              if (validationErrors.newPassword) {
                setValidationErrors(prev => ({
                  ...prev,
                  newPassword: undefined,
                }));
              }
              clearError();
            }}
            placeholder="Min 6 characters"
            secureTextEntry
            error={validationErrors.newPassword}
            required
          />

          <Input
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={val => {
              setConfirmPassword(val);
              if (validationErrors.confirmPassword) {
                setValidationErrors(prev => ({
                  ...prev,
                  confirmPassword: undefined,
                }));
              }
              clearError();
            }}
            placeholder="Re-enter new password"
            secureTextEntry
            error={validationErrors.confirmPassword}
            required
          />

          <Button
            title="Reset Password"
            onPress={handleResetPassword}
            loading={loading}
            size="lg"
            style={styles.submitBtn}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Know your password? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};
