import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '../../api/client';
import { setAppLanguage } from '../../i18n';
import { useAuthStore } from '../../store/authStore';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'rw', label: 'Ikinyarwanda', flag: '🇷🇼' },
] as const;

export default function CustomerProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const { t, i18n } = useTranslation();

  // ── Edit name state ──────────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name ?? '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  // ── Change password state ────────────────────────────────────────────────
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleLogout = () => {
    Alert.alert(t('common.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.logout'), style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleLanguageChange = async (lang: 'en' | 'fr' | 'rw') => {
    await setAppLanguage(lang);
  };

  const handleSaveName = async () => {
    setNameError('');
    if (newName.trim().length < 2) {
      setNameError('Name must be at least 2 characters.');
      return;
    }
    try {
      setNameLoading(true);
      const { data } = await api.put<{ user: { id: number; name: string; email: string; role: string } }>(
        '/auth/profile',
        { name: newName.trim() }
      );
      await updateUser({ name: data.user.name });
      setEditingName(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setNameError(e.response?.data?.message ?? 'Failed to update name.');
    } finally {
      setNameLoading(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordError('');
    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    try {
      setPasswordLoading(true);
      await api.put('/auth/profile', { currentPassword, newPassword });
      setEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password updated successfully.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setPasswordError(e.response?.data?.message ?? 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar & identity ── */}
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>CUSTOMER ACCOUNT</Text>
          </View>
        </View>

        {/* ── Account info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Info</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account ID</Text>
            <Text style={styles.infoValue}>#{user?.id ?? '—'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{t('common.rwanda')}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email ?? '—'}</Text>
          </View>
        </View>

        {/* ── Edit name ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Display Name</Text>
            {!editingName && (
              <Pressable onPress={() => { setNewName(user?.name ?? ''); setNameError(''); setEditingName(true); }}>
                <Text style={styles.editLink}>Edit</Text>
              </Pressable>
            )}
          </View>

          {editingName ? (
            <View>
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                value={newName}
                onChangeText={setNewName}
                placeholder="Your display name"
                placeholderTextColor="#94a3b8"
                autoFocus
              />
              {!!nameError && <Text style={styles.fieldError}>{nameError}</Text>}
              <View style={styles.actionRow}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => { setEditingName(false); setNameError(''); }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveBtn, nameLoading && styles.btnDisabled]}
                  disabled={nameLoading}
                  onPress={handleSaveName}
                >
                  {nameLoading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.saveBtnText}>Save Name</Text>}
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={styles.currentValue}>{user?.name || '—'}</Text>
          )}
        </View>

        {/* ── Change password ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Password</Text>
            {!editingPassword && (
              <Pressable onPress={() => { setPasswordError(''); setEditingPassword(true); }}>
                <Text style={styles.editLink}>Change</Text>
              </Pressable>
            )}
          </View>

          {editingPassword ? (
            <View>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Current password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                autoFocus
              />
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 8 characters"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat new password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
              {!!passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}
              <View style={styles.actionRow}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => {
                    setEditingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveBtn, passwordLoading && styles.btnDisabled]}
                  disabled={passwordLoading}
                  onPress={handleSavePassword}
                >
                  {passwordLoading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.saveBtnText}>Update Password</Text>}
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={styles.currentValue}>••••••••</Text>
          )}
        </View>

        {/* ── Language ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 {t('profile.language')}</Text>
          <View style={styles.langRow}>
            {LANGUAGES.map((item) => {
              const isActive = i18n.language === item.code;
              return (
                <Pressable
                  key={item.code}
                  style={[styles.langButton, isActive && styles.langButtonActive]}
                  onPress={() => handleLanguageChange(item.code)}
                >
                  <Text style={styles.langFlag}>{item.flag}</Text>
                  <Text style={[styles.langText, isActive && styles.langTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Logout ── */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 {t('common.logout')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#ffffff', fontSize: 28, fontWeight: '800' },
  userName: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  userEmail: { fontSize: 13, color: '#64748b', marginBottom: 10 },
  roleBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleBadgeText: { color: '#0369a1', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  editLink: { fontSize: 13, color: '#0066cc', fontWeight: '600' },
  currentValue: { fontSize: 14, color: '#475569', paddingVertical: 4 },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: { fontSize: 13, color: '#94a3b8' },
  infoValue: { fontSize: 13, color: '#1e293b', fontWeight: '500' },

  inputLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 11,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  inputError: { borderColor: '#ef4444' },
  fieldError: { color: '#ef4444', fontSize: 12, marginTop: 4 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelBtnText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  saveBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#0066cc',
    alignItems: 'center',
  },
  saveBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.65 },

  langRow: { flexDirection: 'row', gap: 8 },
  langButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  langButtonActive: { borderColor: '#0066cc', backgroundColor: '#e0f2fe' },
  langFlag: { fontSize: 18, marginBottom: 3 },
  langText: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  langTextActive: { color: '#0066cc', fontWeight: '700' },

  logoutButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: '700' },
});
