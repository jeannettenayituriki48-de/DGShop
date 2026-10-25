import { api } from './client';

export interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  image_url: string | null;
  category?: string;
  stock?: number;
  quantity: number;
}

export const cartApi = {
  getCart: async (): Promise<CartItem[]> => {
    const { data } = await api.get<CartItem[]>('/cart');
    return data.map((item) => ({ ...item, price: Number(item.price) }));
  },

  addItem: async (productId: number, quantity: number = 1): Promise<{ ok: boolean }> => {
    const { data } = await api.post<{ ok: boolean }>('/cart', { productId, quantity });
    return data;
  },

  updateQuantity: async (id: number, quantity: number): Promise<{ ok: boolean }> => {
    const { data } = await api.patch<{ ok: boolean }>('/cart', { id, quantity });
    return data;
  },

  removeItem: async (id: number): Promise<{ ok: boolean }> => {
    const { data } = await api.delete<{ ok: boolean }>('/cart', { params: { id } });
    return data;
  },

  clearCart: async (): Promise<{ ok: boolean }> => {
    const { data } = await api.delete<{ ok: boolean }>('/cart');
    return data;
  },
};
