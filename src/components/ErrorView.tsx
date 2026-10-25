import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ErrorViewProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  const { t } = useTranslation();

  const isNoInternet = message === 'NO_INTERNET';
  const displayMessage = isNoInternet
    ? t('common.noInternet')
    : message || t('common.error');

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{isNoInternet ? '📡' : '⚠️'}</Text>
      <Text style={styles.title}>
        {isNoInternet ? 'Connection Issue' : t('common.error')}
      </Text>
      <Text style={styles.message}>{displayMessage}</Text>
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>{t('common.retry')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f4f6f8',
  },
  icon: {
    fontSize: 42,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
