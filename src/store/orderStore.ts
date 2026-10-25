import { create } from 'zustand';
import { ordersApi, Order } from '../api/orders.api';

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  isLoading: boolean;
  isDetailLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  fetchOrderById: (id: number) => Promise<Order | null>;
  updateOrderStatus: (id: number, status: Order['status']) => Promise<Order>;
  setSelectedOrder: (order: Order | null) => void;
  clearError: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  selectedOrder: null,
  isLoading: false,
  isDetailLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const orders = await ordersApi.getOrders();
      set({ orders, isLoading: false });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to load order history';
      set({ error: msg, isLoading: false });
    }
  },

  fetchOrderById: async (id: number): Promise<Order | null> => {
    // Check if order already in memory to show instantly
    const existing = get().orders.find((o) => o.id === id);
    if (existing) {
      set({ selectedOrder: existing, error: null });
    }

    set({ isDetailLoading: true, error: null });
    try {
      const order = await ordersApi.getOrderById(id);
      set({ selectedOrder: order, isDetailLoading: false });
      return order;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to fetch order details';
      set({ isDetailLoading: false, error: msg });
      return existing || null;
    }
  },

  updateOrderStatus: async (id, status) => {
    // Optimistic update
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
      selectedOrder:
        state.selectedOrder?.id === id
          ? { ...state.selectedOrder, status }
          : state.selectedOrder,
    }));

    try {
      const updated = await ordersApi.updateOrderStatus(id, status);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? { ...o, ...updated } : o)),
        selectedOrder:
          state.selectedOrder?.id === id
            ? { ...state.selectedOrder, ...updated }
            : state.selectedOrder,
      }));
      return updated;
    } catch (err: unknown) {
      // Revert if error
      await get().fetchOrders();
      throw err;
    }
  },

  setSelectedOrder: (order) => set({ selectedOrder: order }),

  clearError: () => set({ error: null }),
}));
