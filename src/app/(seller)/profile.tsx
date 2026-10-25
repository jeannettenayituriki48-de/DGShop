import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { setAppLanguage } from '../../i18n';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
] as const;

export default function SellerProfileScreen() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      t('common.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.logout'),
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleLanguageChange = async (lang: 'en' | 'fr' | 'rw') => {
    await setAppLanguage(lang);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </Text>
        </View>

        <Text style={styles.name}>{user?.name || 'Seller'}</Text>
        <Text style={styles.email}>{user?.email || 'No email'}</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>STORE OWNER (SELLER)</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Store Name:</Text>
          <Text style={styles.infoValue}>D&G Shop Rwamagana</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Account ID:</Text>
          <Text style={styles.infoValue}>#{user?.id || '—'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Permissions:</Text>
          <Text style={styles.infoValue}>Products, Orders, Reports</Text>
        </View>

        {/* Language Selection */}
        <View style={styles.langSection}>
          <Text style={styles.langTitle}>🌐 {t('profile.language')}</Text>
          <View style={styles.langButtonsRow}>
            {LANGUAGES.map((item) => {
              const isActive = i18n.language === item.code;
              return (
                <Pressable
                  key={item.code}
                  style={[
                    styles.langButton,
                    isActive && styles.langButtonActive,
                  ]}
                  onPress={() => handleLanguageChange(item.code)}
                >
                  <Text style={styles.langFlag}>{item.flag}</Text>
                  <Text
                    style={[
                      styles.langText,
                      isActive && styles.langTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f6f8',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 16,
  },
  badgeText: {
    color: '#7c3aed',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 13,
    color: '#777',
  },
  infoValue: {
    fontSize: 13,
    color: '#222',
    fontWeight: '600',
  },
  langSection: {
    width: '100%',
    marginTop: 18,
    marginBottom: 8,
  },
  langTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  langButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  langButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  langButtonActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  langFlag: {
    fontSize: 16,
    marginBottom: 2,
  },
  langText: {
    fontSize: 10,
    color: '#555',
    fontWeight: '600',
  },
  langTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '600',
  },
});
