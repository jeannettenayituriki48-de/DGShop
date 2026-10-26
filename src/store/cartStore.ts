import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { cartApi, CartItem } from '../api/cart.api';

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;

  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;

  getTotalPrice: () => number;
  getTotalCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      error: null,

      fetchCart: async () => {
        set({ loading: true, error: null });
        try {
          const items = await cartApi.getCart();
          set({ items, loading: false });
        } catch (err: unknown) {
          const error = err as { message?: string; response?: { data?: { message?: string } } };
          set({
            loading: false,
            error:
              error.message === 'NO_INTERNET'
                ? 'NO_INTERNET'
                : error.response?.data?.message || 'Failed to fetch cart',
          });
        }
      },

      addToCart: async (productId: number, quantity: number = 1) => {
        set({ loading: true, error: null });
        try {
          await cartApi.addItem(productId, quantity);
          // Refetch to sync database IDs and prices
          const items = await cartApi.getCart();
          set({ items, loading: false });
        } catch (err: unknown) {
          console.error('[cartStore] addToCart error:', err);
          const error = err as { message?: string; response?: { data?: { message?: string } } };
          set({
            loading: false,
            error:
              error.message === 'NO_INTERNET'
                ? 'NO_INTERNET'
                : error.response?.data?.message || error.message || 'Failed to add item to cart',
          });
          throw err;
        }
      },

      updateQuantity: async (id: number, quantity: number) => {
        // Optimistic local update
        const prevItems = get().items;
        if (quantity <= 0) {
          set({ items: prevItems.filter((i) => i.id !== id) });
        } else {
          set({
            items: prevItems.map((i) => (i.id === id ? { ...i, quantity } : i)),
          });
        }

        try {
          await cartApi.updateQuantity(id, quantity);
        } catch (err: unknown) {
          // Rollback on failure
          set({ items: prevItems });
          const error = err as { message?: string; response?: { data?: { message?: string } } };
          set({
            error:
              error.message === 'NO_INTERNET'
                ? 'NO_INTERNET'
                : error.response?.data?.message || 'Failed to update quantity',
          });
        }
      },

      removeItem: async (id: number) => {
        const prevItems = get().items;
        set({ items: prevItems.filter((i) => i.id !== id) });

        try {
          await cartApi.removeItem(id);
        } catch (err: unknown) {
          set({ items: prevItems });
          const error = err as { message?: string; response?: { data?: { message?: string } } };
          set({
            error:
              error.message === 'NO_INTERNET'
                ? 'NO_INTERNET'
                : error.response?.data?.message || 'Failed to remove item',
          });
        }
      },

      clearCart: async () => {
        set({ items: [] });
        try {
          await cartApi.clearCart();
        } catch (err) {
          console.warn('[cartStore] Failed to clear cart remotely', err);
        }
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getTotalCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'dgshop_cart_storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
