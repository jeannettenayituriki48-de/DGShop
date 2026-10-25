import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useProductStore, CATEGORIES, CategoryType } from '../../store/productStore';
import { Product } from '../../api/products.api';
import { ProductFormModal } from '../../components/ProductFormModal';

export default function SellerProductsScreen() {
  const { t } = useTranslation();
  const {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    updateStock,
    deleteProduct,
  } = useProductStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        selectedCategory === 'All' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setModalVisible(true);
  };

  const handleSaveProduct = async (payload: {
    name: string;
    description: string;
    price: number;
    image_url: string | null;
    category: string;
    stock: number;
  }) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
    } else {
      await createProduct(payload);
    }
  };

  const handleStockChange = async (p: Product, delta: number) => {
    const newStock = Math.max(0, p.stock + delta);
    setActionLoadingId(p.id);
    try {
      await updateStock(p.id, newStock);
    } catch {
      Alert.alert('Error', 'Failed to update stock');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = (p: Product) => {
    Alert.alert(
      t('seller.deleteConfirmTitle'),
      t('seller.deleteConfirmMessage', { name: p.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('seller.deleteBtn'),
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(p.id);
            try {
              const res = await deleteProduct(p.id);
              if (res.archived) {
                Alert.alert(
                  'Archived',
                  res.message || 'Product stock set to 0 due to order history.'
                );
              }
            } catch (err: unknown) {
              const msg =
                err instanceof Error ? err.message : 'Failed to delete';
              Alert.alert('Error', msg);
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const isOutOfStock = item.stock <= 0;
    const isLowStock = item.stock > 0 && item.stock <= 5;
    const isBusy = actionLoadingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.productImg} />
          ) : (
            <View style={styles.imgPlaceholder}>
              <Text style={styles.placeholderIcon}>🛍️</Text>
            </View>
          )}

          <View style={styles.productMeta}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{item.category}</Text>
            </View>
            <Text style={styles.priceText}>
              {item.price.toLocaleString()} {t('common.currency')}
            </Text>
          </View>
        </View>

        {/* Stock management row */}
        <View style={styles.stockRow}>
          <View style={styles.stockStatusContainer}>
            <View
              style={[
                styles.stockBadge,
                isOutOfStock
                  ? styles.stockBadgeOut
                  : isLowStock
                  ? styles.stockBadgeLow
                  : styles.stockBadgeOk,
              ]}
            >
              <Text
                style={[
                  styles.stockBadgeText,
                  isOutOfStock
                    ? styles.stockBadgeTextOut
                    : isLowStock
                    ? styles.stockBadgeTextLow
                    : styles.stockBadgeTextOk,
                ]}
              >
                {isOutOfStock
                  ? t('seller.stockStatus.outOfStock')
                  : isLowStock
                  ? t('seller.stockStatus.lowStock', { count: item.stock })
                  : t('seller.stockStatus.inStock', { count: item.stock })}
              </Text>
            </View>
          </View>

          {/* Stepper buttons */}
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={[
                styles.stepBtn,
                (isOutOfStock || isBusy) && styles.stepBtnDisabled,
              ]}
              onPress={() => handleStockChange(item, -1)}
              disabled={isOutOfStock || isBusy}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>

            <Text style={styles.stockCountText}>{item.stock}</Text>

            <TouchableOpacity
              style={[styles.stepBtn, isBusy && styles.stepBtnDisabled]}
              onPress={() => handleStockChange(item, 1)}
              disabled={isBusy}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => handleOpenEdit(item)}
          >
            <Text style={styles.editBtnText}>✏️ {t('seller.editBtn')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
          >
            <Text style={styles.deleteBtnText}>
              🗑️ {t('seller.deleteBtn')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header & Search */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('seller.searchPlaceholder')}
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Category Chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryChipsList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main Product List */}
      {loading && products.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : error && products.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProducts}>
            <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#7c3aed']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏷️</Text>
              <Text style={styles.emptyText}>
                {t('seller.emptyInventory')}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={handleOpenAdd}
              >
                <Text style={styles.emptyAddBtnText}>
                  {t('seller.addProduct')}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Product Add / Edit Modal */}
      <ProductFormModal
        visible={modalVisible}
        product={editingProduct}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveProduct}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1f2937',
  },
  addBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  categoryChipsList: {
    paddingHorizontal: 14,
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 6,
  },
  filterChipSelected: {
    backgroundColor: '#7c3aed',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  filterChipTextSelected: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImg: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  imgPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 26,
  },
  productMeta: {
    flex: 1,
    paddingLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 19,
  },
  categoryPill: {
    backgroundColor: '#f3e8ff',
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginVertical: 4,
  },
  categoryPillText: {
    fontSize: 10,
    color: '#7c3aed',
    fontWeight: '700',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1f2937',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  stockStatusContainer: {
    flex: 1,
  },
  stockBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  stockBadgeOk: {
    backgroundColor: '#d1fae5',
  },
  stockBadgeLow: {
    backgroundColor: '#fef3c7',
  },
  stockBadgeOut: {
    backgroundColor: '#fee2e2',
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockBadgeTextOk: {
    color: '#047857',
  },
  stockBadgeTextLow: {
    color: '#b45309',
  },
  stockBadgeTextOut: {
    color: '#b91c1c',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
  stepBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  stockCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1f2937',
    minWidth: 24,
    textAlign: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  editBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f3e8ff',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7c3aed',
  },
  deleteBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
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
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyAddBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
