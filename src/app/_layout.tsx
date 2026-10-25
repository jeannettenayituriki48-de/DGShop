import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { initLanguage } from '../i18n';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const { token, role, loading, restore } = useAuthStore();

  useEffect(() => {
    restore();
    initLanguage();
  }, [restore]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Public welcome/browse screen — visible to everyone before login */}
      <Stack.Screen name="index" />

      {/* Auth screens — only reachable when NOT logged in */}
      <Stack.Protected guard={!token}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>

      {/* Authenticated customer dashboard */}
      <Stack.Protected guard={!!token && role === 'customer'}>
        <Stack.Screen name="(customer)" />
      </Stack.Protected>

      {/* Authenticated seller dashboard */}
      <Stack.Protected guard={!!token && role === 'seller'}>
        <Stack.Screen name="(seller)" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});