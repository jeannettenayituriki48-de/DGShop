import { Image } from 'expo-image';
import { Href, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ErrorView } from '../components/ErrorView';
import { LoadingView } from '../components/LoadingView';
import { Product } from '../api/products.api';
import { useAuthStore } from '../store/authStore';

// Base URL reused from the env var (same as axios client)
const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8081') + '/api';

/**
 * Fetch products without going through the axios interceptor that
 * gates every request on NetInfo — which can incorrectly report
 * "no internet" on Android emulators and at first mount.
 */
async function fetchPublicProductsRaw(
  params: Record<string, string | number>
): Promise<Product[]> {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();
  const url = `${BASE_URL}/products${qs ? '?' + qs : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  const data: Product[] = await res.json();
  return data.map((p) => ({ ...p, price: Number(p.price) }));
}

const CATEGORIES = ['All', 'Clothes', 'Shoes', 'Bags', 'Household Equipment', 'Jewellery', 'Cosmetics'];

const CATEGORY_ICONS: Record<string, string> = {
  All: '🛍️',
  Clothes: '👕',
  Shoes: '👟',
  Bags: '🎒',
  'Household Equipment': '🏠',
  Jewellery: '💍',
  Cosmetics: '✨',
};

const PRICE_TIERS = [
  { label: 'All Prices', max: null },
  { label: '< 15,000 RWF', max: 15000 },
  { label: '< 25,000 RWF', max: 25000 },
  { label: '< 40,000 RWF', max: 40000 },
];

// ─── Minimal public ProductCard (no auth needed) ────────────────────────────
function PublicProductCard({ product }: { product: Product }) {
  const icon = CATEGORY_ICONS[product.category] || '🛍️';
  const formattedPrice = new Intl.NumberFormat('en-RW', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(product.price);

  const handlePress = () => {
    // Prompt guest to login to see details / add to cart
    router.push('/login' as Href);
  };

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      <View style={styles.cardImageContainer}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.cardImage}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={styles.cardPlaceholder}>
            <Text style={styles.cardPlaceholderIcon}>{icon}</Text>
          </View>
        )}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{product.category}</Text>
        </View>
        {/* Lock overlay hint */}
        <View style={styles.lockHint}>
          <Text style={styles.lockHintText}>🔒 Login to buy</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.cardPrice}>
          {formattedPrice} <Text style={styles.cardCurrency}>RWF</Text>
        </Text>
        <View style={styles.stockRow}>
          <View
            style={[
              styles.stockDot,
              product.stock > 0 ? styles.stockDotGreen : styles.stockDotRed,
            ]}
          />
          <Text style={styles.stockText}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main Welcome Screen ─────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const { token, role } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const bannerAnim = useRef(new Animated.Value(0)).current;

  // Redirect already-authenticated users to their dashboard
  useEffect(() => {
    if (token && role === 'customer') {
      router.replace('/(customer)' as Href);
    } else if (token && role === 'seller') {
      router.replace('/(seller)' as Href);
    }
  }, [token, role]);

  // Animate banner in
  useEffect(() => {
    Animated.timing(bannerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [bannerAnim]);

  const fetchPublicProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = {};
      if (searchText.trim()) params.search = searchText.trim();
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (maxPrice !== null) params.maxPrice = maxPrice;
      const data = await fetchPublicProductsRaw(params);
      setProducts(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.warn('[WelcomeScreen] fetchPublicProducts failed:', msg);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, maxPrice]);

  const handleSearch = () => fetchPublicProducts();

  const handleClearFilters = () => {
    setSearchText('');
    setSelectedCategory('All');
    setMaxPrice(null);
  };

  const isFiltered = selectedCategory !== 'All' || maxPrice !== null || searchText !== '';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Hero Banner ── */}
      <Animated.View
        style={[
          styles.heroBanner,
          {
            opacity: bannerAnim,
            transform: [
              {
                translateY: bannerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroLocation}>📍 Rwamagana, Rwanda</Text>
            <Text style={styles.heroTitle}>D&G Shop</Text>
            <Text style={styles.heroSubtitle}>Browse our collection</Text>
          </View>
          <View style={styles.heroActions}>
            <Pressable
              style={styles.loginBtn}
              onPress={() => router.push('/login' as Href)}
            >
              <Text style={styles.loginBtnText}>Login</Text>
            </Pressable>
            <Pressable
              style={styles.registerBtn}
              onPress={() => router.push('/register' as Href)}
            >
              <Text style={styles.registerBtnText}>Register</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>

      {/* ── Search Bar ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products…"
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <Pressable style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>🔍</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Category Chips ── */}
      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={styles.categoryChipIcon}>{CATEGORY_ICONS[cat] ?? '🛍️'}</Text>
                <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Price Filter Chips ── */}
      <View style={styles.priceSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.priceScroll}
        >
          {PRICE_TIERS.map((tier) => {
            const isSelected = maxPrice === tier.max;
            return (
              <Pressable
                key={tier.label}
                style={[styles.priceChip, isSelected && styles.priceChipActive]}
                onPress={() => setMaxPrice(tier.max)}
              >
                <Text style={[styles.priceChipText, isSelected && styles.priceChipTextActive]}>
                  {tier.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Product Grid ── */}
      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} onRetry={fetchPublicProducts} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.countRow}>
              <Text style={styles.countText}>{products.length} products found</Text>
              {isFiltered && (
                <Pressable onPress={handleClearFilters}>
                  <Text style={styles.clearText}>Clear filters</Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={({ item }) => <PublicProductCard product={item} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Pressable style={styles.resetButton} onPress={handleClearFilters}>
                <Text style={styles.resetButtonText}>Clear filters</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* ── Floating CTA banner for guests ── */}
      <View style={styles.guestCta}>
        <Text style={styles.guestCtaText}>
          🛒 Login or Register to add items to cart & place orders
        </Text>
        <Pressable style={styles.guestCtaBtn} onPress={() => router.push('/register' as Href)}>
          <Text style={styles.guestCtaBtnText}>Get Started →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Hero
  heroBanner: {
    backgroundColor: '#0052cc',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTextBlock: {
    flex: 1,
  },
  heroLocation: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: '#bfdbfe',
    fontSize: 13,
    marginTop: 2,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  loginBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  registerBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  registerBtnText: {
    color: '#0052cc',
    fontSize: 13,
    fontWeight: '700',
  },

  // Search
  searchSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchBtn: {
    backgroundColor: '#0052cc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  searchBtnText: {
    fontSize: 16,
  },

  // Categories
  categoriesSection: {
    backgroundColor: '#ffffff',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  categoryScroll: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 6,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  categoryChipActive: {
    backgroundColor: '#0052cc',
  },
  categoryChipIcon: {
    fontSize: 13,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryTextActive: {
    color: '#ffffff',
  },

  // Price
  priceSection: {
    backgroundColor: '#ffffff',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  priceScroll: {
    paddingHorizontal: 12,
    paddingTop: 6,
    gap: 6,
  },
  priceChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  priceChipActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0052cc',
  },
  priceChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  priceChipTextActive: {
    color: '#0052cc',
    fontWeight: '700',
  },

  // Product Grid
  listContent: {
    padding: 10,
    paddingBottom: 90,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  countText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  clearText: {
    fontSize: 12,
    color: '#0052cc',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#0052cc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Product Card
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardImageContainer: {
    height: 130,
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
  },
  cardPlaceholderIcon: {
    fontSize: 40,
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  lockHint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,82,204,0.7)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  lockHintText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  cardContent: {
    padding: 10,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    height: 36,
    lineHeight: 18,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0052cc',
    marginTop: 4,
  },
  cardCurrency: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
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

  // Guest CTA Footer
  guestCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  guestCtaText: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 16,
  },
  guestCtaBtn: {
    backgroundColor: '#0052cc',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  guestCtaBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
