import { Image } from 'expo-image';
import { Href, router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ErrorView } from '../../components/ErrorView';
import { LoadingView } from '../../components/LoadingView';
import { useCartStore } from '../../store/cartStore';

export default function CustomerCartScreen() {
  const { t } = useTranslation();
  const {
    items,
    loading,
    error,
    fetchCart,
    updateQuantity,
    removeItem,
    getTotalPrice,
    getTotalCount,
  } = useCartStore();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleRemove = (id: number, name: string) => {
    Alert.alert(t('cart.remove'), `${t('cart.confirmRemove')} (${name})`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('cart.remove'),
        style: 'destructive',
        onPress: () => removeItem(id),
      },
    ]);
  };

  const formattedTotal = new Intl.NumberFormat('en-RW', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(getTotalPrice());

  if (loading && items.length === 0) {
    return <LoadingView message={t('common.loading')} />;
  }

  if (error && items.length === 0) {
    return <ErrorView message={error} onRetry={fetchCart} />;
  }

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>{t('cart.emptyTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('cart.emptySubtitle')}</Text>
          <Pressable
            style={styles.shopBtn}
            onPress={() => router.push('/' as Href)}
          >
            <Text style={styles.shopBtnText}>{t('cart.startShopping')}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.headerRow}>
                <Text style={styles.itemsCount}>
                  {t('cart.itemsCount', { count: getTotalCount() })}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const itemTotal = new Intl.NumberFormat('en-RW', {
                style: 'decimal',
                maximumFractionDigits: 0,
              }).format(item.price * item.quantity);

              return (
                <View style={styles.cartCard}>
                  <View style={styles.imageWrap}>
                    {item.image_url ? (
                      <Image
                        source={{ uri: item.image_url }}
                        style={styles.image}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View style={styles.placeholder}>
                        <Text style={styles.placeholderIcon}>🛍️</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.infoWrap}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {itemTotal} {t('common.currency')}
                    </Text>

                    <View style={styles.actionRow}>
                      <View style={styles.stepper}>
                        <Pressable
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Text style={styles.stepperText}>-</Text>
                        </Pressable>
                        <Text style={styles.stepperValue}>{item.quantity}</Text>
                        <Pressable
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Text style={styles.stepperText}>+</Text>
                        </Pressable>
                      </View>

                      <Pressable
                        style={styles.trashBtn}
                        onPress={() => handleRemove(item.id, item.name)}
                      >
                        <Text style={styles.trashText}>🗑️</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            }}
          />

          {/* Checkout Sticky Bottom Bar */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('cart.subtotal')}:</Text>
              <Text style={styles.summaryValue}>
                {formattedTotal} {t('common.currency')}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('cart.delivery')}:</Text>
              <Text style={styles.deliveryFree}>{t('cart.free')}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRowTotal}>
              <Text style={styles.totalLabel}>{t('cart.total')}:</Text>
              <Text style={styles.totalValue}>
                {formattedTotal} {t('common.currency')}
              </Text>
            </View>

            <Pressable
              style={styles.checkoutBtn}
              onPress={() => router.push('/checkout' as Href)}
            >
              <Text style={styles.checkoutBtnText}>
                {t('cart.checkout')} →
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 16,
    paddingBottom: 220,
  },
  headerRow: {
    marginBottom: 12,
  },
  itemsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  imageWrap: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
  },
  infoWrap: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0066cc',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
  },
  stepperText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  stepperValue: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  trashBtn: {
    padding: 6,
  },
  trashText: {
    fontSize: 18,
  },
  summaryCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 10,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  deliveryFree: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16a34a',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 8,
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0066cc',
  },
  checkoutBtn: {
    backgroundColor: '#0066cc',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  shopBtn: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  shopBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
