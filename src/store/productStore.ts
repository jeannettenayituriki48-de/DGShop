import { create } from 'zustand';
import { Product, productsApi } from '../api/products.api';

export const CATEGORIES = [
  'All',
  'Clothes',
  'Shoes',
  'Bags',
  'Household Equipment',
  'Jewellery',
  'Cosmetics',
] as const;

export type CategoryType = (typeof CATEGORIES)[number];

interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  detailError: string | null;
  searchQuery: string;
  selectedCategory: CategoryType;
  maxPrice: number | null;

  fetchProducts: () => Promise<void>;
  fetchProductById: (id: number) => Promise<void>;
  createProduct: (payload: Omit<Product, 'id' | 'created_at'>) => Promise<Product>;
  updateProduct: (
    id: number,
    payload: Partial<Omit<Product, 'id' | 'created_at'>>
  ) => Promise<Product>;
  updateStock: (id: number, stock: number) => Promise<Product>;
  deleteProduct: (
    id: number
  ) => Promise<{ success: boolean; message?: string; archived?: boolean }>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: CategoryType) => void;
  setMaxPrice: (price: number | null) => void;
  clearFilters: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  selectedProduct: null,
  loading: false,
  detailLoading: false,
  error: null,
  detailError: null,
  searchQuery: '',
  selectedCategory: 'All',
  maxPrice: null,

  fetchProducts: async () => {
    const { searchQuery, selectedCategory, maxPrice } = get();
    set({ loading: true, error: null });
    try {
      const data = await productsApi.getProducts({
        search: searchQuery.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        maxPrice: maxPrice || undefined,
      });
      set({ products: data, loading: false });
    } catch (err: unknown) {
      console.error('[productStore] fetchProducts error:', err);
      const error = err as { message?: string; response?: { data?: { message?: string } } };
      set({
        loading: false,
        error:
          error.message === 'NO_INTERNET'
            ? 'NO_INTERNET'
            : error.response?.data?.message || error.message || 'Failed to load products',
      });
    }
  },

  fetchProductById: async (id: number) => {
    set({ detailLoading: true, detailError: null });
    try {
      const product = await productsApi.getProductById(id);
      set({ selectedProduct: product, detailLoading: false });
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { data?: { message?: string } } };
      set({
        detailLoading: false,
        detailError:
          error.message === 'NO_INTERNET'
            ? 'NO_INTERNET'
            : error.response?.data?.message || 'Failed to load product details',
      });
    }
  },

  createProduct: async (payload) => {
    const newProduct = await productsApi.createProduct(payload);
    set((state) => ({
      products: [newProduct, ...state.products],
    }));
    return newProduct;
  },

  updateProduct: async (id, payload) => {
    const updated = await productsApi.updateProduct(id, payload);
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? updated : p)),
      selectedProduct:
        state.selectedProduct?.id === id ? updated : state.selectedProduct,
    }));
    return updated;
  },

  updateStock: async (id, stock) => {
    const updated = await productsApi.updateStock(id, stock);
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? updated : p)),
      selectedProduct:
        state.selectedProduct?.id === id ? updated : state.selectedProduct,
    }));
    return updated;
  },

  deleteProduct: async (id) => {
    const res = await productsApi.deleteProduct(id);
    if (res.archived) {
      set((state) => ({
        products: state.products.map((p) =>
          p.id === id ? { ...p, stock: 0 } : p
        ),
      }));
    } else {
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      }));
    }
    return res;
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setSelectedCategory: (category: CategoryType) => {
    set({ selectedCategory: category });
  },

  setMaxPrice: (price: number | null) => {
    set({ maxPrice: price });
  },

  clearFilters: () => {
    set({ searchQuery: '', selectedCategory: 'All', maxPrice: null });
  },
}));
