import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/common/Button';
import { ArrowLeft } from '../../components/common/Icon';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigation } from '../../navigation/NavigationContext';

export const RegisterScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { register, error: authError, clearError } = useAuth();

  const [name, setName] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!name.trim()) {
      errors.name = 'Full name is required';
    }

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errors.email = 'Please enter a valid email address';
    }

    if (phone.trim() && phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Please enter a valid 10-digit phone number';
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
        email: email.trim(),
        phone: phone.trim(),
        businessName: businessName.trim() || undefined,
        password,
      });
      // Auth state changes to authenticated, navigator handles transition
    } catch {
      // error set in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24) + 12,
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          },
        ]}
        keyboardShouldPersistTaps="handled">
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
            label="Business / Firm Name"
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="e.g. Sojitra Trade & Brokerage"
            helperText="Optional name of your brokerage agency"
          />

          <Input
            label="Email Address"
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
            required
          />

          <Input
            label="Phone Number"
            value={phone}
            onChangeText={val => {
              setPhone(val);
              if (validationErrors.phone) {
                setValidationErrors(prev => ({ ...prev, phone: undefined }));
              }
            }}
            placeholder="9876543210"
            keyboardType="phone-pad"
            error={validationErrors.phone}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  header: {
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  errorAlert: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorAlertText: {
    color: '#B91C1C',
    fontSize: 13.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 15,
    color: '#64748B',
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
  },
});
