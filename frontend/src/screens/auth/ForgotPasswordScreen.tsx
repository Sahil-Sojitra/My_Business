import React, { useState } from 'react';
import {
  Platform,
  StatusBar,
  Text,
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

export const ForgotPasswordScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { forgotPassword, error: authError, clearError } = useAuth();

  const [email, setEmail] = useState<string>(
    navigation.params?.initialEmail || ''
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string | undefined>();

  const validate = (): boolean => {
    const clean = email.trim();
    if (!clean) {
      setEmailError('Email address is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(undefined);
    return true;
  };

  const handleSubmit = async () => {
    if (loading) {
      return;
    }
    clearError();
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      await forgotPassword({ email: cleanEmail });
      navigation.navigate('ResetPassword', { email: cleanEmail });
    } catch {
      // Error handled and shown via authError in AuthContext
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your registered email and we will send you a recovery code to reset your password
          </Text>
        </View>

        <View style={styles.card}>
          {authError ? (
            <View style={styles.errorAlert}>
              <Text style={styles.errorAlertText}>{authError}</Text>
            </View>
          ) : null}

          <Input
            label="Email Address"
            value={email}
            onChangeText={val => {
              setEmail(val);
              if (emailError) {
                setEmailError(undefined);
              }
              clearError();
            }}
            placeholder="e.g. broker@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
            required
          />

          <Button
            title="Send Recovery Code"
            onPress={handleSubmit}
            loading={loading}
            size="lg"
            style={styles.submitBtn}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Remember your password? </Text>
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
