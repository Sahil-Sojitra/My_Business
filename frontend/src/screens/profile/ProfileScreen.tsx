import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppHeader } from '../../components/common/AppHeader';
import { Button } from '../../components/common/Button';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Input } from '../../components/common/Input';
import { KeyboardAwareScrollView } from '../../components/common/KeyboardAwareScrollView';
import { TrashIcon, UserIcon } from '../../components/common/Icon';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigation } from '../../navigation/NavigationContext';
import {
  showPrivacyOptionsForm,
  useAdConsent,
} from '../../services/adMobService';

export const ProfileScreen: React.FC = () => {
  const { user, updateProfile, deleteAccount, logout } = useAuth();
  const navigation = useNavigation();
  const { privacyOptionsRequired } = useAdConsent();

  // Profile Form state
  const [name, setName] = useState<string>(user?.name || '');
  const [businessName, setBusinessName] = useState<string>(
    user?.businessName || ''
  );
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [email, setEmail] = useState<string>(user?.email || '');

  // Password state
  const [showPasswordSection, setShowPasswordSection] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Status & feedback
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Logout modal state
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  // UMP Privacy options state
  const [openingPrivacyOptions, setOpeningPrivacyOptions] = useState<boolean>(false);

  // Initials for avatar
  const initials = (name || user?.name || 'B')
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleOpenPrivacyOptions = async () => {
    setOpeningPrivacyOptions(true);
    setErrorMessage(null);
    try {
      await showPrivacyOptionsForm();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to display privacy options.';
      if (__DEV__) {
        console.warn('[Profile] showPrivacyOptionsForm error:', message);
      }
      setErrorMessage(message);
    } finally {
      setOpeningPrivacyOptions(false);
    }
  };

  const handleSaveProfile = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);

    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Full name must be at least 2 characters.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please provide a valid 10-digit mobile number.');
      return;
    }

    if (email && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setErrorMessage('Please provide a valid email address.');
        return;
      }
    }

    if (showPasswordSection && (newPassword || currentPassword || confirmPassword)) {
      if (!currentPassword) {
        setErrorMessage('Current password is required to change password.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMessage('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('New password and confirm password do not match.');
        return;
      }
    }

    setSaving(true);
    try {
      await updateProfile({
        name: cleanName,
        businessName: businessName.trim() || undefined,
        phone: cleanPhone,
        email: email.trim() || undefined,
        currentPassword:
          showPasswordSection && newPassword ? currentPassword : undefined,
        newPassword:
          showPasswordSection && newPassword ? newPassword : undefined,
      });

      setSuccessMessage('Account profile updated successfully!');
      if (newPassword) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update profile.';
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      // AuthContext will clear user and redirect to Login
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete account.';
      setErrorMessage(message);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <View style={styles.screen}>
      <AppHeader
        title="My Profile"
        subtitle="Manage your broker credentials"
        showBack={true}
        onBack={() => navigation.navigate('Home')}
      />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        extraScrollHeight={80}
        showsVerticalScrollIndicator={false}>
        {/* Profile Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.avatarDetails}>
            <Text style={styles.profileName}>{name || user?.name || 'Broker'}</Text>
            <Text style={styles.profileBusiness}>
              {businessName || user?.businessName || 'Brokerage Firm'}
            </Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Verified Broker</Text>
              </View>
              {user?.createdAt && (
                <Text style={styles.memberSince}>
                  Member since {new Date(user.createdAt).getFullYear()}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Feedback Alerts */}
        {successMessage ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Account Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <UserIcon size={18} color="#2563EB" />
            <Text style={styles.cardTitle}>Account Details</Text>
          </View>

          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Sahil Sojitra"
            autoCapitalize="words"
          />

          <Input
            label="Business / Brokerage Name"
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="e.g. Shree Ram Dalali Firm"
            autoCapitalize="words"
          />

          <Input
            label="Mobile Number (Login Identifier)"
            value={phone}
            onChangeText={val => setPhone(val.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            helperText="Primary unique ID for authentication"
          />

          <Input
            label="Email Address (Optional)"
            value={email}
            onChangeText={setEmail}
            placeholder="broker@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Security Card */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardHeaderToggle}
            onPress={() => setShowPasswordSection(!showPasswordSection)}
            activeOpacity={0.7}>
            <View>
              <Text style={styles.cardTitle}>Change Password</Text>
              <Text style={styles.cardSubtitle}>
                {showPasswordSection
                  ? 'Tap to hide password fields'
                  : 'Tap to update account password'}
              </Text>
            </View>
            <Text style={styles.toggleBtnText}>
              {showPasswordSection ? 'Hide' : 'Edit'}
            </Text>
          </TouchableOpacity>

          {showPasswordSection && (
            <View style={styles.passwordFieldsContainer}>
              <Input
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry
              />

              <Input
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 6 characters"
                secureTextEntry
              />

              <Input
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                secureTextEntry
              />
            </View>
          )}
        </View>

        {/* Save Button */}
        <Button
          title={saving ? 'Saving Changes...' : 'Save Profile Changes'}
          onPress={handleSaveProfile}
          variant="primary"
          size="lg"
          loading={saving}
          style={styles.saveBtn}
        />

        {/* Privacy Options (Shown ONLY when UMP reports privacy options entry point is required) */}
        {privacyOptionsRequired && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <UserIcon size={18} color="#2563EB" />
              <Text style={styles.cardTitle}>Privacy & Preferences</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              Review or adjust your consent choices regarding advertising and data collection.
            </Text>
            <Button
              title="Privacy & Ad Preferences"
              onPress={handleOpenPrivacyOptions}
              variant="outline"
              size="md"
              loading={openingPrivacyOptions}
              style={styles.privacyBtn}
            />
          </View>
        )}

        {/* Session Management */}
        <Button
          title="Log Out"
          onPress={() => setShowLogoutModal(true)}
          variant="outline"
          size="md"
          style={styles.logoutBtn}
        />

        {/* Danger Zone: Account Deletion */}
        <View style={styles.dangerCard}>
          <View style={styles.dangerHeader}>
            <TrashIcon size={18} color="#DC2626" />
            <Text style={styles.dangerTitle}>Danger Zone</Text>
          </View>
          <Text style={styles.dangerDesc}>
            Deleting your account permanently removes all your registered
            companies, sales bills, dalali commission records, and uploaded
            documents. This action cannot be reversed.
          </Text>
          <Button
            title="Delete Account Permanently"
            onPress={() => setShowDeleteModal(true)}
            variant="danger"
            size="md"
            style={styles.deleteBtn}
          />
        </View>
      </KeyboardAwareScrollView>

      {/* Delete Account Modal */}
      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Broker Account"
        message="Are you sure you want to permanently delete your account? All company portfolios, transaction invoices, and commissions will be destroyed immediately."
        confirmText="Yes, Delete Permanently"
        cancelText="Keep Account"
        destructive={true}
        loading={deleting}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Log Out Modal */}
      <ConfirmModal
        visible={showLogoutModal}
        title="Log Out"
        message="Are you sure you want to log out of your account?"
        confirmText="Log Out"
        cancelText="Cancel"
        destructive={true}
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatarDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  profileBusiness: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  badge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  memberSince: {
    fontSize: 11,
    color: '#94A3B8',
  },
  successBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  successText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardHeaderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  passwordFieldsContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveBtn: {
    marginBottom: 12,
  },
  privacyBtn: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  logoutBtn: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  dangerCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FED7D7',
    marginTop: 6,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  dangerDesc: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
    marginBottom: 14,
  },
  deleteBtn: {
    backgroundColor: '#DC2626',
  },
});
