import { api } from './client';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string;
  stock: number;
  created_at: string;
}

export interface ProductFilterParams {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export const productsApi = {
  getProducts: async (params?: ProductFilterParams): Promise<Product[]> => {
    const { data } = await api.get<Product[]>('/products', { params });
    // Normalize numerical price from postgres string
    return data.map((p) => ({ ...p, price: Number(p.price) }));
  },

  getProductById: async (id: number): Promise<Product> => {
    const { data } = await api.get<Product>('/products', { params: { id } });
    return { ...data, price: Number(data.price) };
  },

  createProduct: async (
    payload: Omit<Product, 'id' | 'created_at'>
  ): Promise<Product> => {
    const { data } = await api.post<Product>('/products', payload);
    return { ...data, price: Number(data.price), stock: Number(data.stock) };
  },

  updateProduct: async (
    id: number,
    payload: Partial<Omit<Product, 'id' | 'created_at'>>
  ): Promise<Product> => {
    const { data } = await api.put<Product>('/products', { id, ...payload });
    return { ...data, price: Number(data.price), stock: Number(data.stock) };
  },

  updateStock: async (id: number, stock: number): Promise<Product> => {
    const { data } = await api.put<Product>('/products', { id, stock });
    return { ...data, price: Number(data.price), stock: Number(data.stock) };
  },

  deleteProduct: async (
    id: number
  ): Promise<{ success: boolean; message?: string; archived?: boolean }> => {
    const { data } = await api.delete<{
      success: boolean;
      message?: string;
      archived?: boolean;
    }>(`/products?id=${id}`);
    return data;
  },
};
