import React, { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { KeyboardAwareScrollView } from '../../components/common/KeyboardAwareScrollView';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigation } from '../../navigation/NavigationContext';
import { ApiError } from '../../services/apiClient';
import { styles } from './AuthStyles';

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { login, error: authError, clearError } = useAuth();

  const [phone, setPhone] = useState<string>(
    navigation.params?.initialPhone || ''
  );
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(
    navigation.params?.message || null
  );

  const [validationErrors, setValidationErrors] = useState<{
    phone?: string;
    password?: string;
  }>({});

  useEffect(() => {
    if (navigation.params?.message) {
      setBannerMessage(navigation.params.message);
    }
  }, [navigation.params?.message]);

  const validate = (): boolean => {
    const errors: { phone?: string; password?: string } = {};
    const cleanPhone = phone.trim().replace(/\D/g, '');

    if (!cleanPhone) {
      errors.phone = 'Mobile number is required';
    } else if (cleanPhone.length !== 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (loading) {
      return;
    }
    clearError();
    setUnverifiedEmail(null);
    setBannerMessage(null);

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await login({ phone: phone.trim().replace(/\D/g, ''), password });
    } catch (err: any) {
      if (
        err instanceof ApiError &&
        err.statusCode === 403 &&
        err.data?.requiresVerification
      ) {
        setUnverifiedEmail(err.data.email || '');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.keyboardContainer}>
      <KeyboardAwareScrollView
        extraScrollHeight={80}
        contentContainerStyle={[
          styles.loginScrollContent,
          {
            paddingTop:
              Math.max(
                insets.top,
                Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 24
              ) + 24,
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          },
        ]}>
        <View style={styles.loginHeader}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>My Business Mobile</Text>
          </View>
          <Text style={styles.loginTitle}>Broker Portal</Text>
          <Text style={styles.loginSubtitle}>
            Sign in to manage companies, bills, and calculate interest
          </Text>
        </View>

        <View style={styles.loginCard}>
          {bannerMessage ? (
            <View style={styles.successAlert}>
              <Text style={styles.successAlertText}>{bannerMessage}</Text>
            </View>
          ) : null}

          {authError ? (
            <View style={styles.errorAlert}>
              <Text style={styles.errorAlertText}>{authError}</Text>
            </View>
          ) : null}

          {unverifiedEmail ? (
            <View style={styles.infoAlert}>
              <Text style={styles.infoAlertText}>
                Email verification is required before signing in.
              </Text>
              <TouchableOpacity
                style={[styles.resendBtn, { alignSelf: 'center', marginTop: 4 }]}
                onPress={() => {
                  clearError();
                  navigation.navigate('EmailVerification', {
                    email: unverifiedEmail,
                  });
                }}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.resendText,
                    { textDecorationLine: 'underline' },
                  ]}>
                  Verify Email Now
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <Input
            label="Mobile Number"
            value={phone}
            onChangeText={text => {
              const numeric = text.replace(/\D/g, '').slice(0, 10);
              setPhone(numeric);
              if (validationErrors.phone) {
                setValidationErrors(prev => ({ ...prev, phone: undefined }));
              }
              clearError();
            }}
            placeholder="e.g. 9876543210"
            keyboardType="phone-pad"
            maxLength={10}
            error={validationErrors.phone}
            required
          />

          <Input
            label="Password"
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (validationErrors.password) {
                setValidationErrors(prev => ({ ...prev, password: undefined }));
              }
              clearError();
            }}
            placeholder="Enter password"
            secureTextEntry
            error={validationErrors.password}
            required
          />

          <TouchableOpacity
            style={styles.forgotPasswordLink}
            onPress={() => {
              clearError();
              navigation.navigate('ForgotPassword');
            }}
            activeOpacity={0.7}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={styles.submitBtn}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account yet? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}>
            <Text style={styles.footerLink}>Register here</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};
