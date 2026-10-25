/**
 * src/tests/api.test.ts
 * Phase 3: Comprehensive API layer unit tests.
 *
 * Tests:
 * 1. Request Interceptor (Network check, NO_INTERNET throw, Auth header injection)
 * 2. Response Interceptor (Pass-through, 401 SecureStore cleanup, rejection)
 * 3. authApi (login, register, forgotPassword, error handling)
 * 4. productsApi (getProducts, filtering, getProductById, createProduct, updateProduct, updateStock, deleteProduct)
 * 5. ordersApi (createOrder, getOrders, getOrderById, updateOrderStatus)
 * 6. cartApi (getCart, addItem, updateQuantity, removeItem, clearCart)
 */

import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { api } from '../api/client';
import { authApi } from '../api/auth.api';
import { productsApi } from '../api/products.api';
import { ordersApi } from '../api/orders.api';
import { cartApi } from '../api/cart.api';

describe('Phase 3: API Layer Tests', () => {
  // Extract interceptors registered on api in client.ts
  const requestInterceptor = (api.interceptors.request.use as jest.Mock).mock.calls[0]?.[0];
  const responseSuccessInterceptor = (api.interceptors.response.use as jest.Mock).mock.calls[0]?.[0];
  const responseErrorInterceptor = (api.interceptors.response.use as jest.Mock).mock.calls[0]?.[1];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Client Interceptors
  // ═══════════════════════════════════════════════════════════════════════════
  describe('api client interceptors', () => {
    describe('request interceptor', () => {
      it('✅ passes config through when device is online and no token exists', async () => {
        (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: true });
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

        const config = { headers: {} as Record<string, string> };
        const result = await requestInterceptor(config);

        expect(result).toBe(config);
        expect(config.headers.Authorization).toBeUndefined();
      });

      it('🔒 attaches Bearer token when stored in SecureStore', async () => {
        (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: true });
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('my-jwt-token-123');

        const config = { headers: {} as Record<string, string> };
        const result = await requestInterceptor(config);

        expect(result.headers.Authorization).toBe('Bearer my-jwt-token-123');
      });

      it('❌ throws NO_INTERNET error when device has no connection', async () => {
        (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: false });

        const config = { headers: {} };
        await expect(requestInterceptor(config)).rejects.toThrow('NO_INTERNET');
      });
    });

    describe('response interceptor', () => {
      it('✅ passes successful response through without modification', () => {
        const mockResponse = { data: { success: true }, status: 200 };
        const result = responseSuccessInterceptor(mockResponse);
        expect(result).toBe(mockResponse);
      });

      it('🔒 clears token and user from SecureStore on 401 Unauthorized', async () => {
        const error401 = {
          response: { status: 401, data: { message: 'Unauthorized' } },
        };

        await expect(responseErrorInterceptor(error401)).rejects.toEqual(error401);

        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('token');
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user');
      });

      it('⚠️ preserves SecureStore on non-401 errors (e.g. 500 Internal Server Error)', async () => {
        const error500 = {
          response: { status: 500, data: { message: 'Internal Server Error' } },
        };

        await expect(responseErrorInterceptor(error500)).rejects.toEqual(error500);

        expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. authApi
  // ═══════════════════════════════════════════════════════════════════════════
  describe('authApi', () => {
    it('✅ login sends POST /auth/login with credentials and returns user & token', async () => {
      const mockAuthResponse = {
        token: 'token-abc',
        user: { id: 1, name: 'Alice', email: 'alice@example.rw', role: 'customer' as const },
      };
      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockAuthResponse });

      const result = await authApi.login('alice@example.rw', 'Password123');

      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'alice@example.rw',
        password: 'Password123',
      });
      expect(result).toEqual(mockAuthResponse);
    });

    it('✅ register sends POST /auth/register with user info and default role "customer"', async () => {
      const mockAuthResponse = {
        token: 'token-reg',
        user: { id: 2, name: 'Bob', email: 'bob@example.rw', role: 'customer' as const },
      };
      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockAuthResponse });

      const result = await authApi.register('Bob', 'bob@example.rw', 'SecurePass1');

      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Bob',
        email: 'bob@example.rw',
        password: 'SecurePass1',
        role: 'customer',
      });
      expect(result).toEqual(mockAuthResponse);
    });

    it('✅ register accepts explicit "seller" role', async () => {
      const mockAuthResponse = {
        token: 'token-seller',
        user: { id: 3, name: 'Seller Sam', email: 'sam@seller.rw', role: 'seller' as const },
      };
      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockAuthResponse });

      const result = await authApi.register('Seller Sam', 'sam@seller.rw', 'SellerPass1', 'seller');

      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Seller Sam',
        email: 'sam@seller.rw',
        password: 'SellerPass1',
        role: 'seller',
      });
      expect(result.user.role).toBe('seller');
    });

    it('✅ forgotPassword sends POST /auth/forgot-password with email', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { message: 'Reset email sent if account exists' },
      });

      const result = await authApi.forgotPassword('alice@example.rw');

      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'alice@example.rw',
      });
      expect(result.message).toContain('Reset email');
    });

    it('❌ login propagates network or API error', async () => {
      const apiError = new Error('Invalid credentials');
      (api.post as jest.Mock).mockRejectedValueOnce(apiError);

      await expect(authApi.login('wrong@email.rw', 'badpass')).rejects.toThrow('Invalid credentials');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. productsApi
  // ═══════════════════════════════════════════════════════════════════════════
  describe('productsApi', () => {
    it('✅ getProducts fetches /products and converts string prices to numbers', async () => {
      const rawProducts = [
        { id: 1, name: 'Inzovu T-Shirt', price: '12000', stock: 10, category: 'Clothing', description: 'Cotton', image_url: null, created_at: '2026-01-01' },
        { id: 2, name: 'Coffee Mug', price: '4500.5', stock: 5, category: 'Home', description: 'Ceramic', image_url: null, created_at: '2026-01-02' },
      ];
      (api.get as jest.Mock).mockResolvedValueOnce({ data: rawProducts });

      const products = await productsApi.getProducts();

      expect(api.get).toHaveBeenCalledWith('/products', { params: undefined });
      expect(products[0].price).toBe(12000);
      expect(products[1].price).toBe(4500.5);
    });

    it('✅ getProducts passes filter parameters (search, category, price range)', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      const filters = { search: 'coffee', category: 'Drinkware', minPrice: 1000, maxPrice: 10000 };
      await productsApi.getProducts(filters);

      expect(api.get).toHaveBeenCalledWith('/products', { params: filters });
    });

    it('✅ getProductById fetches /products with id parameter and normalizes price', async () => {
      const rawProduct = {
        id: 7,
        name: 'Single Product',
        price: '25000',
        stock: 4,
        category: 'Electronics',
        description: 'Quality device',
        image_url: null,
        created_at: '2026-01-01',
      };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: rawProduct });

      const product = await productsApi.getProductById(7);

      expect(api.get).toHaveBeenCalledWith('/products', { params: { id: 7 } });
      expect(product.id).toBe(7);
      expect(product.price).toBe(25000);
    });

    it('✅ createProduct sends POST /products and normalizes numerical fields', async () => {
      const payload = {
        name: 'New Craft Bag',
        description: 'Handmade Rwandan basket bag',
        price: 18000,
        image_url: 'https://example.com/bag.jpg',
        category: 'Accessories',
        stock: 8,
      };
      const apiResponse = { ...payload, id: 99, price: '18000', stock: '8', created_at: '2026-02-01' };
      (api.post as jest.Mock).mockResolvedValueOnce({ data: apiResponse });

      const result = await productsApi.createProduct(payload);

      expect(api.post).toHaveBeenCalledWith('/products', payload);
      expect(result.price).toBe(18000);
      expect(result.stock).toBe(8);
      expect(result.id).toBe(99);
    });

    it('✅ updateProduct sends PUT /products with merged id and payload', async () => {
      const updateData = { name: 'Updated Name', price: 20000 };
      const apiResponse = {
        id: 10,
        name: 'Updated Name',
        description: 'Old desc',
        price: '20000',
        stock: '15',
        category: 'Clothing',
        image_url: null,
        created_at: '2026-01-01',
      };
      (api.put as jest.Mock).mockResolvedValueOnce({ data: apiResponse });

      const result = await productsApi.updateProduct(10, updateData);

      expect(api.put).toHaveBeenCalledWith('/products', { id: 10, ...updateData });
      expect(result.price).toBe(20000);
      expect(result.stock).toBe(15);
    });

    it('✅ updateStock sends PUT /products with id and new stock count', async () => {
      const apiResponse = {
        id: 12,
        name: 'Item',
        description: 'Desc',
        price: '5000',
        stock: '30',
        category: 'General',
        image_url: null,
        created_at: '2026-01-01',
      };
      (api.put as jest.Mock).mockResolvedValueOnce({ data: apiResponse });

      const result = await productsApi.updateStock(12, 30);

      expect(api.put).toHaveBeenCalledWith('/products', { id: 12, stock: 30 });
      expect(result.stock).toBe(30);
    });

    it('✅ deleteProduct sends DELETE /products?id=15 and returns result', async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce({
        data: { success: true, message: 'Product deleted' },
      });

      const result = await productsApi.deleteProduct(15);

      expect(api.delete).toHaveBeenCalledWith('/products?id=15');
      expect(result.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ordersApi
  // ═══════════════════════════════════════════════════════════════════════════
  describe('ordersApi', () => {
    it('✅ createOrder sends POST /orders with checkout payload', async () => {
      const checkoutPayload = {
        address: 'KG 123 St, Nyarutarama, Kigali',
        phone: '+250788123456',
        paymentMethod: 'momo',
      };
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { orderId: 501, total: 25000 } });

      const result = await ordersApi.createOrder(checkoutPayload);

      expect(api.post).toHaveBeenCalledWith('/orders', checkoutPayload);
      expect(result.orderId).toBe(501);
      expect(result.total).toBe(25000);
    });

    it('✅ getOrders fetches /orders and normalizes total and item unit_price to numbers', async () => {
      const rawOrders = [
        {
          id: 101,
          status: 'pending',
          total: '45000',
          created_at: '2026-02-10',
          items: [
            { product_id: 1, name: 'Item A', quantity: 2, unit_price: '15000' },
            { product_id: 2, name: 'Item B', quantity: 1, unit_price: '15000' },
          ],
        },
      ];
      (api.get as jest.Mock).mockResolvedValueOnce({ data: rawOrders });

      const orders = await ordersApi.getOrders();

      expect(api.get).toHaveBeenCalledWith('/orders');
      expect(orders[0].total).toBe(45000);
      expect(orders[0].items[0].unit_price).toBe(15000);
      expect(orders[0].items[1].unit_price).toBe(15000);
    });

    it('✅ getOrderById fetches /orders?id=101 with formatted numeric values', async () => {
      const rawOrder = {
        id: 101,
        status: 'shipped',
        total: '32000',
        created_at: '2026-02-10',
        items: [{ product_id: 3, name: 'Item C', quantity: 2, unit_price: '16000' }],
      };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: rawOrder });

      const order = await ordersApi.getOrderById(101);

      expect(api.get).toHaveBeenCalledWith('/orders?id=101');
      expect(order.total).toBe(32000);
      expect(order.items[0].unit_price).toBe(16000);
    });

    it('✅ updateOrderStatus sends PATCH /orders with id and status', async () => {
      const updatedOrder = {
        id: 101,
        status: 'delivered',
        total: '32000',
        created_at: '2026-02-10',
        items: [],
      };
      (api.patch as jest.Mock).mockResolvedValueOnce({ data: updatedOrder });

      const result = await ordersApi.updateOrderStatus(101, 'delivered');

      expect(api.patch).toHaveBeenCalledWith('/orders', { id: 101, status: 'delivered' });
      expect(result.status).toBe('delivered');
      expect(result.total).toBe(32000);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. cartApi
  // ═══════════════════════════════════════════════════════════════════════════
  describe('cartApi', () => {
    it('✅ getCart fetches /cart and normalizes item price to number', async () => {
      const rawCart = [
        { id: 1, product_id: 10, name: 'T-Shirt', price: '12000', quantity: 2, image_url: null },
      ];
      (api.get as jest.Mock).mockResolvedValueOnce({ data: rawCart });

      const cart = await cartApi.getCart();

      expect(api.get).toHaveBeenCalledWith('/cart');
      expect(cart[0].price).toBe(12000);
    });

    it('✅ addItem sends POST /cart with productId and quantity (default 1)', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { ok: true } });

      const result = await cartApi.addItem(5);

      expect(api.post).toHaveBeenCalledWith('/cart', { productId: 5, quantity: 1 });
      expect(result.ok).toBe(true);
    });

    it('✅ addItem accepts custom quantity', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { ok: true } });

      await cartApi.addItem(5, 3);

      expect(api.post).toHaveBeenCalledWith('/cart', { productId: 5, quantity: 3 });
    });

    it('✅ updateQuantity sends PATCH /cart with id and new quantity', async () => {
      (api.patch as jest.Mock).mockResolvedValueOnce({ data: { ok: true } });

      const result = await cartApi.updateQuantity(22, 5);

      expect(api.patch).toHaveBeenCalledWith('/cart', { id: 22, quantity: 5 });
      expect(result.ok).toBe(true);
    });

    it('✅ removeItem sends DELETE /cart with params id', async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce({ data: { ok: true } });

      const result = await cartApi.removeItem(22);

      expect(api.delete).toHaveBeenCalledWith('/cart', { params: { id: 22 } });
      expect(result.ok).toBe(true);
    });

    it('✅ clearCart sends DELETE /cart with no params', async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce({ data: { ok: true } });

      const result = await cartApi.clearCart();

      expect(api.delete).toHaveBeenCalledWith('/cart');
      expect(result.ok).toBe(true);
    });
  });
});
