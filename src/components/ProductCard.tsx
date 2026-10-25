import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Product } from '../api/products.api';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Clothes: '👕',
  Shoes: '👟',
  Bags: '🎒',
  'Household Equipment': '🏠',
  Jewellery: '💍',
  Cosmetics: '✨',
};

export function ProductCard({ product, onPress }: ProductCardProps) {
  const { t } = useTranslation();
  const icon = CATEGORY_ICONS[product.category] || '🛍️';

  const formattedPrice = new Intl.NumberFormat('en-RW', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(product.price);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>{icon}</Text>
          </View>
        )}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{product.category}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <Text style={styles.price}>
          {formattedPrice} {t('common.currency')}
        </Text>

        <View style={styles.stockRow}>
          <View
            style={[
              styles.stockDot,
              product.stock > 0 ? styles.stockDotGreen : styles.stockDotRed,
            ]}
          />
          <Text style={styles.stockText}>
            {product.stock > 0
              ? t('product.inStock', { count: product.stock })
              : t('product.outOfStock')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  imageContainer: {
    height: 130,
    backgroundColor: '#f8fafc',
    position: 'relative',
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
    backgroundColor: '#e2e8f0',
  },
  placeholderIcon: {
    fontSize: 40,
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  content: {
    padding: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    height: 36,
    lineHeight: 18,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0066cc',
    marginTop: 4,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  stockDotGreen: {
    backgroundColor: '#16a34a',
  },
  stockDotRed: {
    backgroundColor: '#dc2626',
  },
  stockText: {
    fontSize: 11,
    color: '#64748b',
  },
});
