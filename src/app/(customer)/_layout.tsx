import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

export default function CustomerTabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontWeight: '700', fontSize: 18, color: '#1a1a1a' },
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          headerTitle: 'D&G Shop Rwamagana',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t('nav.cart'),
          headerTitle: t('cart.title'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🛒</Text>,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('nav.orders'),
          headerTitle: t('nav.orders'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📦</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          headerTitle: t('profile.title'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
        }}
      />
      <Tabs.Screen
        name="product/[id]"
        options={{
          href: null,
          title: t('product.details'),
          headerTitle: t('product.details'),
        }}
      />
      <Tabs.Screen
        name="checkout"
        options={{
          href: null,
          title: t('checkout.title'),
          headerTitle: t('checkout.title'),
        }}
      />
      <Tabs.Screen
        name="orders/[id]"
        options={{
          href: null,
          title: t('orders.detailTitle'),
          headerTitle: t('orders.detailTitle'),
        }}
      />
    </Tabs>
  );
}
