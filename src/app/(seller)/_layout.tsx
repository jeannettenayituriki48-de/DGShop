import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

export default function SellerTabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontWeight: '700', fontSize: 18, color: '#1a1a1a' },
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.dashboard'),
          headerTitle: t('seller.dashboardTitle'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: t('nav.products'),
          headerTitle: t('seller.inventoryTitle'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏷️</Text>,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('nav.orders'),
          headerTitle: t('seller.viewOrders'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          headerTitle: 'User Accounts',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👥</Text>,
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
    </Tabs>
  );
}
