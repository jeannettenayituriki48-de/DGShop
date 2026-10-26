import React, { useEffect, useState, useMemo } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { router, Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useOrderStore } from '../../store/orderStore';
import { StatusBadge } from '../../components/StatusBadge';
import { Order } from '../../api/orders.api';

type FilterTab = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered';

export default function CustomerOrdersScreen() {
  const { t } = useTranslation();
  const { orders, isLoading, error, fetchOrders } = useOrderStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: t('orders.filterAll') },
    { key: 'pending', label: t('orders.status.pending') },
    { key: 'processing', label: t('orders.status.processing') },
    { key: 'shipped', label: t('orders.status.shipped') },
    { key: 'delivered', label: t('orders.status.delivered') },
  ];

  const renderOrderItem = ({ item }: { item: Order }) => {
    const formattedDate = new Date(item.created_at).toLocaleDateString(
      undefined,
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    );

    const totalItems = (item.items || []).reduce(
      (sum, it) => sum + (it.quantity || 1),
      0
    );

    const itemsPreview = (item.items || [])
      .map((it) => `${it.name} (x${it.quantity})`)
      .join(', ');

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => {
          router.push({
            pathname: '/(customer)/orders/[id]',
            params: { id: String(item.id) },
          } as unknown as Href);
        }}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNumber}>
              {t('orders.orderNumber', { id: item.id })}
            </Text>
            <Text style={styles.orderDate}>
              {t('orders.orderDate', { date: formattedDate })}
            </Text>
          </View>
          <StatusBadge status={item.status} size="small" />
        </View>

        {/* Items Preview */}
        <View style={styles.itemsPreviewContainer}>
          <Text style={styles.itemsCountText}>
            {t('orders.orderItems', { count: totalItems })}:
          </Text>
          <Text style={styles.itemsPreviewText} numberOfLines={2}>
            {itemsPreview || 'Order items'}
          </Text>
        </View>

        {/* Address snippet */}
        {item.address ? (
          <View style={styles.addressRow}>
            <Text style={styles.addressIcon}>📍</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        ) : null}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>{t('orders.total')}</Text>
            <Text style={styles.totalPrice}>
              {item.total.toLocaleString()} {t('common.currency')}
            </Text>
          </View>
          <View style={styles.detailsBtn}>
            <Text style={styles.detailsBtnText}>
              {t('orders.viewDetails')} →
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs Header */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterTabs}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.tabsContainer}
          renderItem={({ item }) => {
            const isActive = activeTab === item.key;
            return (
              <TouchableOpacity
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(item.key)}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    isActive && styles.tabButtonTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main Content */}
      {isLoading && orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : error && orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>{t('orders.emptyTitle')}</Text>
              <Text style={styles.emptySubtitle}>
                {t('orders.emptySubtitle')}
              </Text>
              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => router.push('/(customer)' as unknown as Href)}
              >
                <Text style={styles.shopButtonText}>
                  {t('orders.startShopping')}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  tabsWrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 6,
  },
  tabButtonActive: {
    backgroundColor: '#0066cc',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  orderDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  itemsPreviewContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  itemsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4b5563',
    marginBottom: 3,
  },
  itemsPreviewText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  addressIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  addressText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0066cc',
    marginTop: 2,
  },
  detailsBtn: {
    backgroundColor: '#eff6ff',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0066cc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 54,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  shopButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
