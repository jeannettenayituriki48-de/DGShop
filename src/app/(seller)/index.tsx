import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useProductStore, CATEGORIES } from '../../store/productStore';
import { useOrderStore } from '../../store/orderStore';

export default function SellerDashboardScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { products, loading: productsLoading, fetchProducts } = useProductStore();
  const { orders, isLoading: ordersLoading, fetchOrders } = useOrderStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [fetchProducts, fetchOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchOrders()]);
    setRefreshing(false);
  };

  // Live inventory and sales statistics calculated dynamically
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;

    // Sales metrics
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter((o) => o.status === 'delivered');
    const totalSalesRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrdersCount = orders.filter((o) =>
      ['pending', 'processing', 'shipped'].includes(o.status)
    ).length;

    // Distribution by category
    const catCounts: Record<string, { count: number; units: number }> = {};
    CATEGORIES.filter((c) => c !== 'All').forEach((cat) => {
      catCounts[cat] = { count: 0, units: 0 };
    });

    products.forEach((p) => {
      if (catCounts[p.category]) {
        catCounts[p.category].count += 1;
        catCounts[p.category].units += p.stock;
      }
    });

    return {
      totalProducts,
      totalUnits,
      lowStockCount,
      outOfStockCount,
      totalOrders,
      totalSalesRevenue,
      pendingOrdersCount,
      catCounts,
    };
  }, [products, orders]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#7c3aed']}
        />
      }
    >
      {/* Header Store Card */}
      <View style={styles.headerCard}>
        <Text style={styles.welcome}>{t('seller.dashboardTitle')}</Text>
        <Text style={styles.name}>{user?.name || 'Store Owner'}</Text>
        <Text style={styles.subtitle}>D&G Shop • Rwamagana, Rwanda</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('seller.roleBadge')}</Text>
        </View>
      </View>

      {/* Revenue Banner */}
      <View style={styles.revenueBanner}>
        <Text style={styles.revenueBannerLabel}>Total Delivered Revenue</Text>
        <Text style={styles.revenueBannerAmount}>
          {stats.totalSalesRevenue.toLocaleString()} {t('common.currency')}
        </Text>
        <Text style={styles.revenueBannerSub}>
          {stats.totalOrders} total orders placed in Rwamagana
        </Text>
      </View>

      {/* Primary KPI Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>📦</Text>
          <Text style={styles.statValue}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>{t('seller.totalProducts')}</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statIcon}>🔢</Text>
          <Text style={styles.statValue}>{stats.totalUnits}</Text>
          <Text style={styles.statLabel}>{t('seller.totalUnits')}</Text>
        </View>

        <View style={[styles.statBox, stats.pendingOrdersCount > 0 && styles.statBoxActive]}>
          <Text style={styles.statIcon}>🚚</Text>
          <Text style={[styles.statValue, stats.pendingOrdersCount > 0 && styles.statValueActive]}>
            {stats.pendingOrdersCount}
          </Text>
          <Text style={styles.statLabel}>{t('seller.activeOrders')}</Text>
        </View>

        <View style={[styles.statBox, stats.lowStockCount > 0 && styles.statBoxWarning]}>
          <Text style={styles.statIcon}>⚠️</Text>
          <Text style={[styles.statValue, stats.lowStockCount > 0 && styles.statValueWarning]}>
            {stats.lowStockCount}
          </Text>
          <Text style={styles.statLabel}>{t('seller.lowStock')}</Text>
        </View>
      </View>

      {/* Quick Action Shortcuts */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('seller.quickActions')}</Text>
      </View>

      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(seller)/products' as unknown as Href)}
        >
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionTitle}>{t('seller.addProduct')}</Text>
          <Text style={styles.actionSubtitle}>Add item to catalog</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(seller)/products' as unknown as Href)}
        >
          <Text style={styles.actionIcon}>🏷️</Text>
          <Text style={styles.actionTitle}>{t('seller.manageProducts')}</Text>
          <Text style={styles.actionSubtitle}>Adjust stock & prices</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(seller)/orders' as unknown as Href)}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionTitle}>{t('seller.viewOrders')}</Text>
          <Text style={styles.actionSubtitle}>Process & report sales</Text>
        </TouchableOpacity>
      </View>

      {/* Category Inventory Breakdown */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('seller.categoryBreakdown')}</Text>
      </View>

      <View style={styles.categoryCard}>
        {CATEGORIES.filter((c) => c !== 'All').map((cat) => {
          const item = stats.catCounts[cat] || { count: 0, units: 0 };
          return (
            <View key={cat} style={styles.categoryRow}>
              <View style={styles.catLeft}>
                <Text style={styles.catName}>{cat}</Text>
                <Text style={styles.catSubtitle}>
                  {item.count} items listed
                </Text>
              </View>
              <View style={styles.catRight}>
                <Text style={styles.catUnits}>{item.units} units</Text>
              </View>
            </View>
          );
        })}
      </View>

      {(productsLoading || ordersLoading) && products.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#7c3aed" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  welcome: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    color: '#7c3aed',
    fontSize: 11,
    fontWeight: '700',
  },
  revenueBanner: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  revenueBannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e9d5ff',
    textTransform: 'uppercase',
  },
  revenueBannerAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 4,
  },
  revenueBannerSub: {
    fontSize: 12,
    color: '#f3e8ff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  statBox: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  statBoxActive: {
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  statBoxWarning: {
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 2,
  },
  statValueActive: {
    color: '#1d4ed8',
  },
  statValueWarning: {
    color: '#d97706',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionHeader: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 2,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  catLeft: {
    flex: 1,
  },
  catName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
  catSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  catRight: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  catUnits: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7c3aed',
  },
  loadingOverlay: {
    marginVertical: 12,
    alignItems: 'center',
  },
});
