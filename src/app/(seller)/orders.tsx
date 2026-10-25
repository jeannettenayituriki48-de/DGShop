import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOrderStore } from '../../store/orderStore';
import { Order } from '../../api/orders.api';
import { StatusBadge } from '../../components/StatusBadge';

type ViewMode = 'orders' | 'report';
type StatusFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_OPTIONS: Order['status'][] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export default function SellerOrdersScreen() {
  const { t } = useTranslation();
  const { orders, isLoading, error, fetchOrders, updateOrderStatus } = useOrderStore();

  const [viewMode, setViewMode] = useState<ViewMode>('orders');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Status Change Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchFilter = statusFilter === 'all' || o.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        String(o.id).includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.phone?.toLowerCase().includes(q) ||
        o.address?.toLowerCase().includes(q) ||
        (o.items || []).some((it) => it.name.toLowerCase().includes(q));

      return matchFilter && matchSearch;
    });
  }, [orders, statusFilter, search]);

  // Analytics & Report Calculations
  const report = useMemo(() => {
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'delivered');
    const activeOrders = orders.filter((o) =>
      ['pending', 'processing', 'shipped'].includes(o.status)
    );
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled');

    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const grossPlaced = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    const avgOrderValue =
      completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

    // Counts by status
    const statusCounts: Record<Order['status'], number> = {
      pending: orders.filter((o) => o.status === 'pending').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      delivered: completedOrders.length,
      cancelled: cancelledOrders.length,
    };

    // Revenue by payment method
    const paymentBreakdown: Record<string, { count: number; total: number }> = {};
    orders
      .filter((o) => o.status !== 'cancelled')
      .forEach((o) => {
        const method = o.payment_method || 'Cash on Delivery';
        if (!paymentBreakdown[method]) {
          paymentBreakdown[method] = { count: 0, total: 0 };
        }
        paymentBreakdown[method].count += 1;
        paymentBreakdown[method].total += o.total;
      });

    // Top selling products
    const productSales: Record<
      string,
      { name: string; quantity: number; revenue: number; category?: string }
    > = {};

    orders
      .filter((o) => o.status !== 'cancelled')
      .forEach((o) => {
        (o.items || []).forEach((it) => {
          if (!productSales[it.name]) {
            productSales[it.name] = {
              name: it.name,
              quantity: 0,
              revenue: 0,
              category: it.category,
            };
          }
          productSales[it.name].quantity += it.quantity;
          productSales[it.name].revenue += it.quantity * it.unit_price;
        });
      });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalOrders,
      totalRevenue,
      grossPlaced,
      avgOrderValue,
      activeOrdersCount: activeOrders.length,
      completedOrdersCount: completedOrders.length,
      statusCounts,
      paymentBreakdown,
      topProducts,
    };
  }, [orders]);

  const handleOpenStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setStatusModalVisible(true);
  };

  const handleSelectStatus = async (newStatus: Order['status']) => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      await updateOrderStatus(selectedOrder.id, newStatus);
      setStatusModalVisible(false);
      Alert.alert(
        'Success',
        t('seller.statusUpdatedSuccess', {
          id: selectedOrder.id,
          status: t(`orders.status.${newStatus}`),
        })
      );
    } catch {
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t('orders.filterAll') },
    { key: 'pending', label: t('orders.status.pending') },
    { key: 'processing', label: t('orders.status.processing') },
    { key: 'shipped', label: t('orders.status.shipped') },
    { key: 'delivered', label: t('orders.status.delivered') },
    { key: 'cancelled', label: t('orders.status.cancelled') },
  ];

  const renderOrderItem = ({ item }: { item: Order }) => {
    const formattedDate = new Date(item.created_at).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNumber}>
              {t('orders.orderNumber', { id: item.id })}
            </Text>
            <Text style={styles.orderDate}>{formattedDate}</Text>
          </View>
          <StatusBadge status={item.status} size="small" />
        </View>

        {/* Customer Information */}
        <View style={styles.customerBox}>
          <Text style={styles.boxTitle}>👤 {t('seller.customer')}:</Text>
          <Text style={styles.customerName}>
            {item.customer_name || 'Customer'}{' '}
            {item.customer_email ? `(${item.customer_email})` : ''}
          </Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>
              {item.address || 'Rwamagana Town'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📞</Text>
            <Text style={styles.detailText}>{item.phone || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>💳</Text>
            <Text style={styles.detailText}>
              {item.payment_method || 'Cash on Delivery'}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.itemsBox}>
          <Text style={styles.boxTitle}>
            🛍️ {t('seller.itemsOrdered')} ({(item.items || []).length}):
          </Text>
          {(item.items || []).map((it, idx) => (
            <View key={`${it.product_id}-${idx}`} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                • {it.name}
              </Text>
              <Text style={styles.itemPrice}>
                {it.quantity} × {it.unit_price.toLocaleString()}{' '}
                {t('common.currency')}
              </Text>
            </View>
          ))}
        </View>

        {/* Total & Action Button */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>{t('orders.total')}</Text>
            <Text style={styles.totalPrice}>
              {item.total.toLocaleString()} {t('common.currency')}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.changeStatusBtn}
            onPress={() => handleOpenStatusModal(item)}
          >
            <Text style={styles.changeStatusBtnText}>
              ⚙️ {t('seller.changeStatus')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Segmented Navigation: Orders vs Report */}
      <View style={styles.segmentedBar}>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            viewMode === 'orders' && styles.segmentBtnActive,
          ]}
          onPress={() => setViewMode('orders')}
        >
          <Text
            style={[
              styles.segmentText,
              viewMode === 'orders' && styles.segmentTextActive,
            ]}
          >
            📋 {t('seller.tabOrders')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            viewMode === 'report' && styles.segmentBtnActive,
          ]}
          onPress={() => setViewMode('report')}
        >
          <Text
            style={[
              styles.segmentText,
              viewMode === 'report' && styles.segmentTextActive,
            ]}
          >
            📊 {t('seller.tabReport')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {viewMode === 'orders' ? (
        <View style={styles.ordersContent}>
          {/* Search bar */}
          <View style={styles.searchWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by customer, phone, or address..."
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Status Filter Tabs */}
          <View style={styles.filterTabsWrapper}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={filterTabs}
              keyExtractor={(it) => it.key}
              contentContainerStyle={styles.filterTabsList}
              renderItem={({ item }) => {
                const isSelected = statusFilter === item.key;
                return (
                  <TouchableOpacity
                    style={[
                      styles.filterTabChip,
                      isSelected && styles.filterTabChipSelected,
                    ]}
                    onPress={() => setStatusFilter(item.key)}
                  >
                    <Text
                      style={[
                        styles.filterTabChipText,
                        isSelected && styles.filterTabChipTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Order List */}
          {isLoading && orders.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#7c3aed" />
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          ) : error && orders.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
                <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredOrders}
              keyExtractor={(it) => String(it.id)}
              renderItem={renderOrderItem}
              contentContainerStyle={styles.ordersList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#7c3aed']}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyText}>
                    {t('seller.noOrdersFound')}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      ) : (
        /* Sales Analytics Report View */
        <ScrollView
          style={styles.reportScroll}
          contentContainerStyle={styles.reportContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#7c3aed']}
            />
          }
        >
          {/* Main Revenue Card */}
          <View style={styles.revenueHeroCard}>
            <Text style={styles.revenueHeroLabel}>
              {t('seller.totalRevenue')} (Delivered)
            </Text>
            <Text style={styles.revenueHeroAmount}>
              {report.totalRevenue.toLocaleString()} {t('common.currency')}
            </Text>
            <Text style={styles.revenueHeroSub}>
              Gross Placed Volume: {report.grossPlaced.toLocaleString()}{' '}
              {t('common.currency')}
            </Text>
          </View>

          {/* KPI Summary Grid */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Orders</Text>
              <Text style={styles.kpiValue}>{report.totalOrders}</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Delivered</Text>
              <Text style={[styles.kpiValue, { color: '#059669' }]}>
                {report.completedOrdersCount}
              </Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Active In-Transit</Text>
              <Text style={[styles.kpiValue, { color: '#2563eb' }]}>
                {report.activeOrdersCount}
              </Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{t('seller.avgOrderValue')}</Text>
              <Text style={[styles.kpiValue, { color: '#7c3aed' }]}>
                {report.avgOrderValue.toLocaleString()} {t('common.currency')}
              </Text>
            </View>
          </View>

          {/* Orders by Status Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Orders by Lifecycle Stage</Text>
            {STATUS_OPTIONS.map((st) => (
              <View key={st} style={styles.statusRow}>
                <StatusBadge status={st} size="small" />
                <Text style={styles.statusCount}>
                  {report.statusCounts[st]} orders
                </Text>
              </View>
            ))}
          </View>

          {/* Payment Method Distribution */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>
              {t('seller.revenueByPayment')}
            </Text>
            {Object.entries(report.paymentBreakdown).map(
              ([method, { count, total }]) => (
                <View key={method} style={styles.paymentRow}>
                  <View>
                    <Text style={styles.paymentMethodName}>{method}</Text>
                    <Text style={styles.paymentMethodCount}>
                      {count} orders
                    </Text>
                  </View>
                  <Text style={styles.paymentMethodTotal}>
                    {total.toLocaleString()} {t('common.currency')}
                  </Text>
                </View>
              )
            )}
            {Object.keys(report.paymentBreakdown).length === 0 && (
              <Text style={styles.emptyNotice}>No sales recorded yet.</Text>
            )}
          </View>

          {/* Top Products Leaderboard */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>{t('seller.topProducts')}</Text>
            {report.topProducts.map((p, index) => (
              <View key={p.name} style={styles.topProductRow}>
                <View style={styles.rankCircle}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.topProductMeta}>
                  <Text style={styles.topProductName}>{p.name}</Text>
                  {p.category ? (
                    <Text style={styles.topProductCat}>{p.category}</Text>
                  ) : null}
                </View>
                <View style={styles.topProductRight}>
                  <Text style={styles.topProductUnits}>
                    {p.quantity} units sold
                  </Text>
                  <Text style={styles.topProductRevenue}>
                    {p.revenue.toLocaleString()} {t('common.currency')}
                  </Text>
                </View>
              </View>
            ))}
            {report.topProducts.length === 0 && (
              <Text style={styles.emptyNotice}>
                No product sales recorded yet.
              </Text>
            )}
          </View>
        </ScrollView>
      )}

      {/* Status Update Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedOrder
                ? t('seller.updateStatusModalTitle', { id: selectedOrder.id })
                : 'Update Status'}
            </Text>

            <Text style={styles.modalSubtitle}>
              {t('seller.selectNewStatus')}
            </Text>

            {STATUS_OPTIONS.map((st) => {
              const isCurrent = selectedOrder?.status === st;
              return (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.statusOptionRow,
                    isCurrent && styles.statusOptionRowActive,
                  ]}
                  onPress={() => handleSelectStatus(st)}
                  disabled={updating}
                >
                  <StatusBadge status={st} size="small" />
                  {isCurrent && (
                    <Text style={styles.currentIndicator}>Current</Text>
                  )}
                </TouchableOpacity>
              );
            })}

            {updating && (
              <ActivityIndicator
                size="small"
                color="#7c3aed"
                style={{ marginTop: 12 }}
              />
            )}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setStatusModalVisible(false)}
              disabled={updating}
            >
              <Text style={styles.modalCloseBtnText}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  segmentedBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#7c3aed',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4b5563',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  ordersContent: {
    flex: 1,
  },
  searchWrapper: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#1f2937',
  },
  filterTabsWrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTabsList: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  filterTabChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 6,
  },
  filterTabChipSelected: {
    backgroundColor: '#7c3aed',
  },
  filterTabChipText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '600',
  },
  filterTabChipTextSelected: {
    color: '#ffffff',
  },
  ordersList: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  orderDate: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  customerBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  boxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4b5563',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  detailIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#4b5563',
    flex: 1,
  },
  itemsBox: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  itemName: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7c3aed',
  },
  changeStatusBtn: {
    backgroundColor: '#f3e8ff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  changeStatusBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7c3aed',
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
  retryBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  reportScroll: {
    flex: 1,
  },
  reportContent: {
    padding: 16,
    paddingBottom: 40,
  },
  revenueHeroCard: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
    alignItems: 'center',
  },
  revenueHeroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e9d5ff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  revenueHeroAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 6,
  },
  revenueHeroSub: {
    fontSize: 12,
    color: '#f3e8ff',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statusCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  paymentMethodName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
  paymentMethodCount: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  paymentMethodTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7c3aed',
  },
  topProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rankCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7c3aed',
  },
  topProductMeta: {
    flex: 1,
  },
  topProductName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
  topProductCat: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 1,
  },
  topProductRight: {
    alignItems: 'flex-end',
  },
  topProductUnits: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  topProductRevenue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  emptyNotice: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  statusOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  statusOptionRowActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#f9f5ff',
  },
  currentIndicator: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c3aed',
  },
  modalCloseBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
});
