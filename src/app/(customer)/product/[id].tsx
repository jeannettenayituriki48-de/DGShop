import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ErrorView } from '../../../components/ErrorView';
import { LoadingView } from '../../../components/LoadingView';
import { useCartStore } from '../../../store/cartStore';
import { useProductStore } from '../../../store/productStore';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { selectedProduct, detailLoading, detailError, fetchProductById } =
    useProductStore();
  const addToCart = useCartStore((s) => s.addToCart);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProductById(Number(id));
    }
  }, [id, fetchProductById]);

  if (detailLoading) {
    return <LoadingView message={t('common.loading')} />;
  }

  if (detailError || !selectedProduct) {
    return (
      <ErrorView
        message={detailError || t('product.outOfStock')}
        onRetry={() => {
          if (id) fetchProductById(Number(id));
        }}
      />
    );
  }

  const formattedPrice = new Intl.NumberFormat('en-RW', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(selectedProduct.price);

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      await addToCart(selectedProduct.id, quantity);
      Alert.alert(
        t('product.addToCart'),
        `${quantity}x ${selectedProduct.name} - ${t('product.addedToCart')}`,
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert(t('common.error'), 'Failed to add item to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {selectedProduct.image_url ? (
          <Image
            source={{ uri: selectedProduct.image_url }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>🛍️</Text>
          </View>
        )}
      </View>

      {/* Main Info Box */}
      <View style={styles.infoCard}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{selectedProduct.category}</Text>
        </View>

        <Text style={styles.title}>{selectedProduct.name}</Text>

        <Text style={styles.price}>
          {formattedPrice} {t('common.currency')}
        </Text>

        <View style={styles.stockRow}>
          <View
            style={[
              styles.stockDot,
              selectedProduct.stock > 0 ? styles.stockDotGreen : styles.stockDotRed,
            ]}
          />
          <Text style={styles.stockText}>
            {selectedProduct.stock > 0
              ? t('product.inStock', { count: selectedProduct.stock })
              : t('product.outOfStock')}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Description */}
        <Text style={styles.sectionTitle}>{t('product.description')}</Text>
        <Text style={styles.description}>
          {selectedProduct.description || 'Quality product available in store.'}
        </Text>

        <View style={styles.divider} />

        {/* Quantity and Add to Cart */}
        <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>Quantity:</Text>
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Text style={styles.stepperText}>-</Text>
            </Pressable>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <Pressable
              style={styles.stepperBtn}
              onPress={() =>
                setQuantity((q) => Math.min(selectedProduct.stock || 10, q + 1))
              }
            >
              <Text style={styles.stepperText}>+</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[
            styles.addCartBtn,
            (selectedProduct.stock <= 0 || adding) ? styles.addCartBtnDisabled : null,
          ]}
          disabled={selectedProduct.stock <= 0 || adding}
          onPress={handleAddToCart}
        >
          <Text style={styles.addCartText}>
            {adding
              ? t('common.loading')
              : selectedProduct.stock > 0
              ? `🛒 ${t('product.addToCart')}`
              : t('product.outOfStock')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 280,
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
    fontSize: 64,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 3,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369a1',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 28,
    marginBottom: 6,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0066cc',
    marginBottom: 8,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  stockDotGreen: {
    backgroundColor: '#16a34a',
  },
  stockDotRed: {
    backgroundColor: '#dc2626',
  },
  stockText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
  },
  stepperText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  quantityValue: {
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  addCartBtn: {
    backgroundColor: '#0066cc',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  addCartBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  addCartText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
