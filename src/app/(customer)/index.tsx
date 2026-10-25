import { Href, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ErrorView } from '../../components/ErrorView';
import { LoadingView } from '../../components/LoadingView';
import { ProductCard } from '../../components/ProductCard';
import { SearchBar } from '../../components/SearchBar';
import { CATEGORIES, CategoryType, useProductStore } from '../../store/productStore';

const PRICE_TIERS = [
  { label: 'All Prices', max: null },
  { label: '< 15,000 RWF', max: 15000 },
  { label: '< 25,000 RWF', max: 25000 },
  { label: '< 40,000 RWF', max: 40000 },
];

export default function CustomerCatalogScreen() {
  const { t } = useTranslation();
  const {
    products,
    loading,
    error,
    searchQuery,
    selectedCategory,
    maxPrice,
    fetchProducts,
    setSearchQuery,
    setSelectedCategory,
    setMaxPrice,
    clearFilters,
  } = useProductStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, selectedCategory, maxPrice]);

  const handleSearchSubmit = () => {
    setSearchQuery(localSearch);
    fetchProducts();
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    clearFilters();
    fetchProducts();
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchSection}>
        <SearchBar
          value={localSearch}
          onChangeText={(text) => setLocalSearch(text)}
          onSubmitEditing={handleSearchSubmit}
          onClear={() => {
            setSearchQuery('');
            fetchProducts();
          }}
          placeholder={t('home.searchPlaceholder')}
        />
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <Pressable
                key={category}
                style={[
                  styles.categoryChip,
                  isSelected ? styles.categoryChipActive : null,
                ]}
                onPress={() => setSelectedCategory(category as CategoryType)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isSelected ? styles.categoryTextActive : null,
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Price Filter Chips */}
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
                style={[
                  styles.priceChip,
                  isSelected ? styles.priceChipActive : null,
                ]}
                onPress={() => setMaxPrice(tier.max)}
              >
                <Text
                  style={[
                    styles.priceChipText,
                    isSelected ? styles.priceChipTextActive : null,
                  ]}
                >
                  {tier.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Product List Content */}
      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} onRetry={fetchProducts} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.countRow}>
              <Text style={styles.countText}>
                {t('home.itemsFound', { count: products.length })}
              </Text>
              {(selectedCategory !== 'All' || maxPrice !== null || searchQuery !== '') && (
                <Pressable onPress={handleClearFilters}>
                  <Text style={styles.clearText}>{t('home.clearFilter')}</Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}` as Href)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>{t('home.noProductsFound')}</Text>
              <Pressable style={styles.resetButton} onPress={handleClearFilters}>
                <Text style={styles.resetButtonText}>{t('home.clearFilter')}</Text>
              </Pressable>
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
    backgroundColor: '#f8fafc',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  categoriesSection: {
    backgroundColor: '#ffffff',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  categoryChipActive: {
    backgroundColor: '#0066cc',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  priceSection: {
    backgroundColor: '#ffffff',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  priceScroll: {
    paddingHorizontal: 16,
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
    borderColor: '#0066cc',
  },
  priceChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  priceChipTextActive: {
    color: '#0066cc',
    fontWeight: '700',
  },
  listContent: {
    padding: 10,
    paddingBottom: 30,
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
    color: '#0066cc',
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
    lineHeight: 22,
  },
  resetButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
