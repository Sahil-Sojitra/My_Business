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
import { KeyboardAwareScrollView } from '../../components/common/KeyboardAwareScrollView';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigation } from '../../navigation/NavigationContext';
import { colors } from '../../theme/colors';
import { styles } from './AuthStyles';

const COOLDOWN_SECONDS = 60;

export const EmailVerificationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { verifyEmail, resendOtp, error: authError, clearError } = useAuth();

  const emailParam = navigation.params?.email || '';
  const [email] = useState<string>(emailParam);
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(COOLDOWN_SECONDS);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const inputRef = useRef<any>(null);

  // Focus input automatically on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
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
    if (localError) {
      setLocalError(null);
    }
    clearError();
  };

  const handleVerify = async () => {
    if (loading) {
      return;
    }
    clearError();
    setLocalError(null);
    setResendSuccess(null);

    if (otp.length !== 6) {
      setLocalError('Please enter the full 6-digit verification code.');
      return;
    }

    if (!email) {
      setLocalError('Missing email address. Please return to login.');
      return;
    }

    setLoading(true);
    try {
      await verifyEmail({
        email: email.trim().toLowerCase(),
        otp,
      });
      // Verification successful. AuthContext will update isAuthenticated to true,
      // which automatically navigates to authenticated Home.
    } catch (err: any) {
      // Handled in AuthContext / local state
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) {
      return;
    }
    clearError();
    setLocalError(null);
    setResendSuccess(null);

    if (!email) {
      setLocalError('Missing email address. Please return to login.');
      return;
    }

    setResending(true);
    try {
      const response = await resendOtp({
        email: email.trim().toLowerCase(),
        purpose: 'EMAIL_VERIFICATION',
      });
      setResendSuccess(response.message || 'A new code has been sent to your email.');
      setCooldown(COOLDOWN_SECONDS);
      setOtp('');
      inputRef.current?.focus();
    } catch (err: any) {
      // Error message set in AuthContext and displayed
    } finally {
      setResending(false);
    }
  };

  const otpDigits = otp.padEnd(6, ' ').split('').slice(0, 6);

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        extraScrollHeight={80}
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
          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit verification code sent to your registered email
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

          {authError || localError ? (
            <View style={styles.errorAlert}>
              <Text style={styles.errorAlertText}>
                {localError || authError}
              </Text>
            </View>
          ) : null}

          {/* 6-digit visual OTP boxes */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
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
              ref={inputRef}
              value={otp}
              onChangeText={handleOtpChange}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={handleVerify}
              style={styles.hiddenInput}
              caretHidden
            />
          </TouchableOpacity>

          <Button
            title="Verify Email"
            onPress={handleVerify}
            loading={loading}
            disabled={otp.length !== 6 || loading}
            size="lg"
            style={styles.submitBtn}
          />

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
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Wrong email address? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}>
            <Text style={styles.footerLink}>Register again</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};
