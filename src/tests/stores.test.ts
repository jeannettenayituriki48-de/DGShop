/**
 * src/tests/stores.test.ts
 * Phase 2B — Zustand store unit tests
 *
 * Strategy: reset every store to initial state before each test using
 * store.setState(). Mock the API modules so no real network calls happen.
 */

// ─── Mock the API layer ───────────────────────────────────────────────────────
jest.mock('../api/auth.api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    forgotPassword: jest.fn(),
  },
}));

jest.mock('../api/products.api', () => ({
  productsApi: {
    getProducts: jest.fn(),
    getProductById: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    updateStock: jest.fn(),
    deleteProduct: jest.fn(),
  },
}));

jest.mock('../api/cart.api', () => ({
  cartApi: {
    getCart: jest.fn(),
    addItem: jest.fn(),
    updateQuantity: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
  },
}));

jest.mock('../api/orders.api', () => ({
  ordersApi: {
    getOrders: jest.fn(),
    getOrderById: jest.fn(),
    updateOrderStatus: jest.fn(),
  },
}));

// ─── Imports (after mocks are declared) ──────────────────────────────────────
import { authApi } from '../api/auth.api';
import { productsApi } from '../api/products.api';
import { cartApi } from '../api/cart.api';
import { ordersApi } from '../api/orders.api';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useProductStore } from '../store/productStore';
import { useOrderStore } from '../store/orderStore';

// ─── Typed mock helpers ───────────────────────────────────────────────────────
const mockAuthApi   = authApi   as jest.Mocked<typeof authApi>;
const mockProductsApi = productsApi as jest.Mocked<typeof productsApi>;
const mockCartApi   = cartApi   as jest.Mocked<typeof cartApi>;
const mockOrdersApi = ordersApi as jest.Mocked<typeof ordersApi>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const MOCK_USER = { id: 1, name: 'Alice Mukamana', email: 'alice@example.rw', role: 'customer' as const };
const MOCK_TOKEN = 'mock.jwt.token';

const MOCK_PRODUCT = {
  id: 1, name: 'Kitenge Shirt', description: 'A vibrant shirt', price: 18000,
  image_url: null, category: 'Clothes', stock: 25, created_at: '2024-01-01T00:00:00Z',
};

const MOCK_CART_ITEM = {
  id: 10, product_id: 1, name: 'Kitenge Shirt', price: 18000, image_url: null, quantity: 2,
};

const MOCK_ORDER = {
  id: 100, status: 'pending' as const, total: 36000,
  address: 'Kigabiro, Rwamagana', phone: '0788123456',
  payment_method: 'MTN Mobile Money', created_at: '2024-01-01T00:00:00Z',
  customer_id: 1, items: [],
};

// ─── Reset stores before every test ──────────────────────────────────────────
beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, role: null, loading: false });
  useCartStore.setState({ items: [], loading: false, error: null });
  useProductStore.setState({
    products: [], selectedProduct: null, loading: false, detailLoading: false,
    error: null, detailError: null, searchQuery: '', selectedCategory: 'All', maxPrice: null,
  });
  useOrderStore.setState({
    orders: [], selectedOrder: null, isLoading: false, isDetailLoading: false, error: null,
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// B1. authStore
// ═════════════════════════════════════════════════════════════════════════════
describe('authStore — login', () => {
  it('✅ login success: sets token, user and role', async () => {
    mockAuthApi.login.mockResolvedValueOnce({ token: MOCK_TOKEN, user: MOCK_USER });

    await useAuthStore.getState().login('alice@example.rw', 'Password1');

    const state = useAuthStore.getState();
    expect(state.token).toBe(MOCK_TOKEN);
    expect(state.user).toEqual(MOCK_USER);
    expect(state.role).toBe('customer');
  });

  it('❌ login failure: throws and leaves state unchanged', async () => {
    mockAuthApi.login.mockRejectedValueOnce(new Error('Invalid credentials'));

    await expect(
      useAuthStore.getState().login('bad@example.rw', 'wrongpass')
    ).rejects.toThrow('Invalid credentials');

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('✅ seller login sets role to seller', async () => {
    const sellerUser = { ...MOCK_USER, role: 'seller' as const };
    mockAuthApi.login.mockResolvedValueOnce({ token: MOCK_TOKEN, user: sellerUser });

    await useAuthStore.getState().login('seller@dgshop.rw', 'Password1');

    expect(useAuthStore.getState().role).toBe('seller');
  });
});

describe('authStore — logout', () => {
  it('✅ logout clears token, user and role', async () => {
    // Seed a logged-in state
    useAuthStore.setState({ token: MOCK_TOKEN, user: MOCK_USER, role: 'customer' });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.role).toBeNull();
  });
});

describe('authStore — restore', () => {
  it('✅ restore loads token and user from SecureStore', async () => {
    // Pre-populate the SecureStore mock (set in jest.setup.ts)
    const SecureStore = require('expo-secure-store');
    SecureStore.getItemAsync.mockImplementation((key: string) => {
      if (key === 'token') return Promise.resolve(MOCK_TOKEN);
      if (key === 'user') return Promise.resolve(JSON.stringify(MOCK_USER));
      return Promise.resolve(null);
    });

    await useAuthStore.getState().restore();

    const state = useAuthStore.getState();
    expect(state.token).toBe(MOCK_TOKEN);
    expect(state.user?.name).toBe('Alice Mukamana');
    expect(state.loading).toBe(false);
  });

  it('⚡ restore with no stored data leaves user null', async () => {
    const SecureStore = require('expo-secure-store');
    SecureStore.getItemAsync.mockResolvedValue(null);

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().loading).toBe(false);
  });
});

describe('authStore — updateUser', () => {
  it('✅ updateUser patches name in state and SecureStore', async () => {
    useAuthStore.setState({ user: MOCK_USER, token: MOCK_TOKEN, role: 'customer' });

    await useAuthStore.getState().updateUser({ name: 'Alice Updated' });

    expect(useAuthStore.getState().user?.name).toBe('Alice Updated');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// B2. cartStore
// ═════════════════════════════════════════════════════════════════════════════
describe('cartStore — addToCart', () => {
  it('✅ adds item and syncs from server', async () => {
    mockCartApi.addItem.mockResolvedValueOnce({ ok: true });
    mockCartApi.getCart.mockResolvedValueOnce([MOCK_CART_ITEM]);

    await useCartStore.getState().addToCart(1, 2);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Kitenge Shirt');
    expect(items[0].quantity).toBe(2);
  });

  it('❌ addToCart sets error on API failure', async () => {
    mockCartApi.addItem.mockRejectedValueOnce({ message: 'Server error' });

    await expect(useCartStore.getState().addToCart(1)).rejects.toBeTruthy();

    expect(useCartStore.getState().error).toBeTruthy();
  });
});

describe('cartStore — updateQuantity', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [MOCK_CART_ITEM] });
  });

  it('✅ increases quantity optimistically', async () => {
    mockCartApi.updateQuantity.mockResolvedValueOnce({ ok: true });

    await useCartStore.getState().updateQuantity(10, 5);

    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('✅ setting quantity to 0 removes the item', async () => {
    mockCartApi.updateQuantity.mockResolvedValueOnce({ ok: true });

    await useCartStore.getState().updateQuantity(10, 0);

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('❌ rolls back on API failure', async () => {
    mockCartApi.updateQuantity.mockRejectedValueOnce(new Error('fail'));

    await useCartStore.getState().updateQuantity(10, 99);

    // Should roll back to original quantity of 2
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });
});

describe('cartStore — removeItem', () => {
  it('✅ removes item optimistically', async () => {
    useCartStore.setState({ items: [MOCK_CART_ITEM] });
    mockCartApi.removeItem.mockResolvedValueOnce({ ok: true });

    await useCartStore.getState().removeItem(10);

    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe('cartStore — clearCart', () => {
  it('✅ clears all items', async () => {
    useCartStore.setState({ items: [MOCK_CART_ITEM] });
    mockCartApi.clearCart.mockResolvedValueOnce({ ok: true });

    await useCartStore.getState().clearCart();

    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe('cartStore — totals', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [
        { ...MOCK_CART_ITEM, id: 10, price: 18000, quantity: 2 },
        { ...MOCK_CART_ITEM, id: 11, product_id: 2, name: 'Sneakers', price: 28000, quantity: 1 },
      ],
    });
  });

  it('✅ getTotalPrice sums price × quantity correctly', () => {
    // 18000×2 + 28000×1 = 64000
    expect(useCartStore.getState().getTotalPrice()).toBe(64000);
  });

  it('✅ getTotalCount sums all quantities', () => {
    // 2 + 1 = 3
    expect(useCartStore.getState().getTotalCount()).toBe(3);
  });

  it('⚡ edge: empty cart returns 0 for both totals', () => {
    useCartStore.setState({ items: [] });
    expect(useCartStore.getState().getTotalPrice()).toBe(0);
    expect(useCartStore.getState().getTotalCount()).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// B3. productStore
// ═════════════════════════════════════════════════════════════════════════════
describe('productStore — fetchProducts', () => {
  it('✅ loads products and sets loading false', async () => {
    mockProductsApi.getProducts.mockResolvedValueOnce([MOCK_PRODUCT]);

    await useProductStore.getState().fetchProducts();

    const state = useProductStore.getState();
    expect(state.products).toHaveLength(1);
    expect(state.products[0].name).toBe('Kitenge Shirt');
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('❌ sets error message on API failure', async () => {
    mockProductsApi.getProducts.mockRejectedValueOnce({
      response: { data: { message: 'Database error' } },
    });

    await useProductStore.getState().fetchProducts();

    expect(useProductStore.getState().error).toBe('Database error');
    expect(useProductStore.getState().loading).toBe(false);
  });

  it('❌ sets NO_INTERNET error when offline', async () => {
    mockProductsApi.getProducts.mockRejectedValueOnce({ message: 'NO_INTERNET' });

    await useProductStore.getState().fetchProducts();

    expect(useProductStore.getState().error).toBe('NO_INTERNET');
  });

  it('⚡ edge: empty product list is valid', async () => {
    mockProductsApi.getProducts.mockResolvedValueOnce([]);

    await useProductStore.getState().fetchProducts();

    expect(useProductStore.getState().products).toHaveLength(0);
    expect(useProductStore.getState().error).toBeNull();
  });
});

describe('productStore — search & filter setters', () => {
  it('✅ setSearchQuery updates searchQuery', () => {
    useProductStore.getState().setSearchQuery('kitenge');
    expect(useProductStore.getState().searchQuery).toBe('kitenge');
  });

  it('✅ setSelectedCategory updates category', () => {
    useProductStore.getState().setSelectedCategory('Shoes');
    expect(useProductStore.getState().selectedCategory).toBe('Shoes');
  });

  it('✅ setMaxPrice updates maxPrice', () => {
    useProductStore.getState().setMaxPrice(25000);
    expect(useProductStore.getState().maxPrice).toBe(25000);
  });

  it('✅ clearFilters resets all filters to defaults', () => {
    useProductStore.setState({ searchQuery: 'test', selectedCategory: 'Bags', maxPrice: 15000 });
    useProductStore.getState().clearFilters();

    const s = useProductStore.getState();
    expect(s.searchQuery).toBe('');
    expect(s.selectedCategory).toBe('All');
    expect(s.maxPrice).toBeNull();
  });
});

describe('productStore — createProduct', () => {
  it('✅ prepends new product to list', async () => {
    useProductStore.setState({ products: [MOCK_PRODUCT] });
    const newProduct = { ...MOCK_PRODUCT, id: 2, name: 'New Bag' };
    mockProductsApi.createProduct.mockResolvedValueOnce(newProduct);

    await useProductStore.getState().createProduct({
      name: 'New Bag', description: '', price: 15000,
      image_url: null, category: 'Bags', stock: 10,
    });

    const products = useProductStore.getState().products;
    expect(products[0].name).toBe('New Bag'); // prepended
    expect(products).toHaveLength(2);
  });
});

describe('productStore — deleteProduct', () => {
  it('✅ removes product from list when not archived', async () => {
    useProductStore.setState({ products: [MOCK_PRODUCT] });
    mockProductsApi.deleteProduct.mockResolvedValueOnce({ success: true, archived: false });

    await useProductStore.getState().deleteProduct(1);

    expect(useProductStore.getState().products).toHaveLength(0);
  });

  it('✅ sets stock to 0 when product is archived (linked to orders)', async () => {
    useProductStore.setState({ products: [MOCK_PRODUCT] });
    mockProductsApi.deleteProduct.mockResolvedValueOnce({ success: true, archived: true });

    await useProductStore.getState().deleteProduct(1);

    const product = useProductStore.getState().products[0];
    expect(product.stock).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// B4. orderStore
// ═════════════════════════════════════════════════════════════════════════════
describe('orderStore — fetchOrders', () => {
  it('✅ loads orders and clears loading', async () => {
    mockOrdersApi.getOrders.mockResolvedValueOnce([MOCK_ORDER]);

    await useOrderStore.getState().fetchOrders();

    const state = useOrderStore.getState();
    expect(state.orders).toHaveLength(1);
    expect(state.orders[0].id).toBe(100);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('❌ sets error on failure', async () => {
    mockOrdersApi.getOrders.mockRejectedValueOnce(new Error('Network error'));

    await useOrderStore.getState().fetchOrders();

    expect(useOrderStore.getState().error).toBe('Network error');
    expect(useOrderStore.getState().isLoading).toBe(false);
  });

  it('⚡ edge: empty orders list is valid', async () => {
    mockOrdersApi.getOrders.mockResolvedValueOnce([]);

    await useOrderStore.getState().fetchOrders();

    expect(useOrderStore.getState().orders).toHaveLength(0);
  });
});

describe('orderStore — fetchOrderById', () => {
  it('✅ fetches single order and sets selectedOrder', async () => {
    mockOrdersApi.getOrderById.mockResolvedValueOnce(MOCK_ORDER);

    await useOrderStore.getState().fetchOrderById(100);

    expect(useOrderStore.getState().selectedOrder?.id).toBe(100);
  });

  it('✅ returns cached order from memory if already loaded', async () => {
    useOrderStore.setState({ orders: [MOCK_ORDER] });
    mockOrdersApi.getOrderById.mockResolvedValueOnce(MOCK_ORDER);

    await useOrderStore.getState().fetchOrderById(100);

    // selectedOrder should be set immediately from cache
    expect(useOrderStore.getState().selectedOrder?.id).toBe(100);
  });
});

describe('orderStore — updateOrderStatus', () => {
  it('✅ optimistically updates status in orders list', async () => {
    useOrderStore.setState({ orders: [MOCK_ORDER] });
    const updated = { ...MOCK_ORDER, status: 'shipped' as const };
    mockOrdersApi.updateOrderStatus.mockResolvedValueOnce(updated);

    await useOrderStore.getState().updateOrderStatus(100, 'shipped');

    expect(useOrderStore.getState().orders[0].status).toBe('shipped');
  });

  it('❌ reverts optimistic update on failure', async () => {
    useOrderStore.setState({ orders: [MOCK_ORDER] });
    mockOrdersApi.updateOrderStatus.mockRejectedValueOnce(new Error('fail'));
    // fetchOrders will be called for rollback — return original
    mockOrdersApi.getOrders.mockResolvedValueOnce([MOCK_ORDER]);

    await expect(
      useOrderStore.getState().updateOrderStatus(100, 'delivered')
    ).rejects.toThrow();

    // After rollback, orders are refreshed from server
    expect(mockOrdersApi.getOrders).toHaveBeenCalled();
  });

  it('✅ setSelectedOrder sets the selected order directly', () => {
    useOrderStore.getState().setSelectedOrder(MOCK_ORDER);
    expect(useOrderStore.getState().selectedOrder?.id).toBe(100);
  });

  it('✅ clearError resets error to null', () => {
    useOrderStore.setState({ error: 'Something went wrong' });
    useOrderStore.getState().clearError();
    expect(useOrderStore.getState().error).toBeNull();
  });
});
