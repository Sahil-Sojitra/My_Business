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
import { styles } from './AuthStyles';

export const RegisterScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { register, error: authError, clearError } = useAuth();

  const [name, setName] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!name.trim()) {
      errors.name = 'Full name is required';
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone) {
      errors.phone = 'Mobile number is required';
    } else if (cleanPhone.length !== 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number';
    }

    const emailTrimmed = email.trim();
    if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    clearError();
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        phone: phone.trim().replace(/\D/g, ''),
        email: email.trim() || undefined,
        businessName: businessName.trim() || undefined,
        password,
      });
    } catch {
      // error set in AuthContext
    } finally {
      setLoading(false);
    }
  };

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
            <ArrowLeft size={16} color="#2563EB" strokeWidth={2.4} />
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Register your business profile to get started
          </Text>
        </View>

        <View style={styles.card}>
          {authError ? (
            <View style={styles.errorAlert}>
              <Text style={styles.errorAlertText}>{authError}</Text>
            </View>
          ) : null}

          <Input
            label="Your Name"
            value={name}
            onChangeText={val => {
              setName(val);
              if (validationErrors.name) {
                setValidationErrors(prev => ({ ...prev, name: undefined }));
              }
            }}
            placeholder="e.g. Sahil Sojitra"
            error={validationErrors.name}
            required
          />

          <Input
            label="Mobile Number"
            value={phone}
            onChangeText={val => {
              const numeric = val.replace(/\D/g, '').slice(0, 10);
              setPhone(numeric);
              if (validationErrors.phone) {
                setValidationErrors(prev => ({ ...prev, phone: undefined }));
              }
            }}
            placeholder="e.g. 9876543210"
            keyboardType="phone-pad"
            maxLength={10}
            error={validationErrors.phone}
            required
          />

          <Input
            label="Business / Firm Name"
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="e.g. Sojitra Trade & Brokerage"
            helperText="Optional name of your brokerage agency"
          />

          <Input
            label="Email Address (Optional)"
            value={email}
            onChangeText={val => {
              setEmail(val);
              if (validationErrors.email) {
                setValidationErrors(prev => ({ ...prev, email: undefined }));
              }
            }}
            placeholder="name@business.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={validationErrors.email}
            helperText="Optional email for statement exports"
          />

          <Input
            label="Password"
            value={password}
            onChangeText={val => {
              setPassword(val);
              if (validationErrors.password) {
                setValidationErrors(prev => ({ ...prev, password: undefined }));
              }
            }}
            placeholder="Min 6 characters"
            secureTextEntry
            error={validationErrors.password}
            required
          />

          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={val => {
              setConfirmPassword(val);
              if (validationErrors.confirmPassword) {
                setValidationErrors(prev => ({
                  ...prev,
                  confirmPassword: undefined,
                }));
              }
            }}
            placeholder="Re-enter password"
            secureTextEntry
            error={validationErrors.confirmPassword}
            required
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            style={styles.submitBtn}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already registered? </Text>
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
