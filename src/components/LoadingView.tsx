import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoadingViewProps {
  message?: string;
}

export function LoadingView({ message }: LoadingViewProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0066cc" />
      <Text style={styles.text}>{message || t('common.loading')}</Text>
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
  text: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
