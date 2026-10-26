import { api } from './client';

export interface OrderItem {
  product_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  image_url?: string | null;
  category?: string;
}

export interface Order {
  id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  address?: string;
  phone?: string;
  payment_method?: string;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  items: OrderItem[];
}

export interface CheckoutPayload {
  address: string;
  phone: string;
  paymentMethod: string;
  items?: { product_id: number; quantity: number }[];
}

export interface CreateOrderResponse {
  orderId: number;
  total: number;
}

export const ordersApi = {
  createOrder: async (payload: CheckoutPayload): Promise<CreateOrderResponse> => {
    const { data } = await api.post<CreateOrderResponse>('/orders', payload);
    return data;
  },

  getOrders: async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/orders');
    return data.map((order) => ({
      ...order,
      total: Number(order.total),
      items: (order.items || []).map((item) => ({
        ...item,
        unit_price: Number(item.unit_price),
      })),
    }));
  },

  getOrderById: async (id: number): Promise<Order> => {
    const { data } = await api.get<Order>(`/orders?id=${id}`);
    return {
      ...data,
      total: Number(data.total),
      items: (data.items || []).map((item) => ({
        ...item,
        unit_price: Number(item.unit_price),
      })),
    };
  },

  updateOrderStatus: async (
    id: number,
    status: Order['status']
  ): Promise<Order> => {
    const { data } = await api.patch<Order>('/orders', { id, status });
    return {
      ...data,
      total: Number(data.total),
      items: (data.items || []).map((item) => ({
        ...item,
        unit_price: Number(item.unit_price),
      })),
    };
  },
};
