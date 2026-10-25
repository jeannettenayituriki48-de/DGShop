import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useOrderStore } from '../../../store/orderStore';
import { StatusBadge } from '../../../components/StatusBadge';
import { TrackingTimeline } from '../../../components/TrackingTimeline';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { selectedOrder, isDetailLoading, error, fetchOrderById } =
    useOrderStore();

  const orderId = Number(id);

  useEffect(() => {
    if (orderId) {
      fetchOrderById(orderId);
    }
  }, [orderId, fetchOrderById]);

  if (isDetailLoading && !selectedOrder) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (error && !selectedOrder) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => fetchOrderById(orderId)}
        >
          <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!selectedOrder) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.retryBtnText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formattedDate = new Date(selectedOrder.created_at).toLocaleString(
    undefined,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Navigation Bar */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>← {t('common.back')}</Text>
      </TouchableOpacity>

      {/* Header Card */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.orderIdText}>
              {t('orders.orderNumber', { id: selectedOrder.id })}
            </Text>
            <Text style={styles.orderDateText}>{formattedDate}</Text>
          </View>
          <StatusBadge status={selectedOrder.status} size="medium" />
        </View>
      </View>

      {/* Tracking Timeline */}
      <TrackingTimeline
        status={selectedOrder.status}
        createdAt={selectedOrder.created_at}
      />

      {/* Delivery Information Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('orders.deliveryInfo')}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📍</Text>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>{t('orders.destination')}</Text>
            <Text style={styles.infoValue}>
              {selectedOrder.address || 'Rwamagana Town'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📞</Text>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>{t('orders.contactPhone')}</Text>
            <Text style={styles.infoValue}>
              {selectedOrder.phone || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>💳</Text>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>{t('orders.paymentMethod')}</Text>
            <Text style={styles.infoValue}>
              {selectedOrder.payment_method || 'Cash on Delivery'}
            </Text>
          </View>
        </View>
      </View>

      {/* Ordered Items Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          {t('orders.orderItems', {
            count: (selectedOrder.items || []).length,
          })}
        </Text>

        {(selectedOrder.items || []).map((item, index) => {
          const itemTotal = item.quantity * item.unit_price;
          return (
            <View key={`${item.product_id}-${index}`} style={styles.itemRow}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.itemImage}
                />
              ) : (
                <View style={styles.itemImagePlaceholder}>
                  <Text style={styles.placeholderIcon}>🛍️</Text>
                </View>
              )}

              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.category ? (
                  <Text style={styles.itemCategory}>{item.category}</Text>
                ) : null}
                <Text style={styles.itemUnitPrice}>
                  {item.quantity} × {item.unit_price.toLocaleString()}{' '}
                  {t('common.currency')}
                </Text>
              </View>

              <Text style={styles.itemTotal}>
                {itemTotal.toLocaleString()} {t('common.currency')}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Price Summary Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('orders.priceSummary')}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{t('orders.subtotal')}</Text>
          <Text style={styles.priceValue}>
            {selectedOrder.total.toLocaleString()} {t('common.currency')}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{t('orders.deliveryFee')}</Text>
          <Text style={styles.freeBadge}>{t('orders.freeDelivery')}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.priceRow}>
          <Text style={styles.totalRowLabel}>{t('orders.total')}</Text>
          <Text style={styles.totalRowValue}>
            {selectedOrder.total.toLocaleString()} {t('common.currency')}
          </Text>
        </View>
      </View>

      {/* Support / Help Card */}
      <View style={styles.supportCard}>
        <Text style={styles.supportIcon}>ℹ️</Text>
        <Text style={styles.supportText}>{t('orders.supportNotice')}</Text>
      </View>
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
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0066cc',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  orderDateText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  itemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 22,
  },
  itemInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 18,
  },
  itemCategory: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  itemUnitPrice: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 3,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 13,
    color: '#4b5563',
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  freeBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  totalRowLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  totalRowValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0066cc',
  },
  supportCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  supportIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  supportText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f4f6f8',
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
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
