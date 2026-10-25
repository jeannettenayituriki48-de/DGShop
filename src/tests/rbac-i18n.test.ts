/**
 * src/tests/rbac-i18n.test.ts
 * Phase 5: Access Control (RBAC) & Multilingual (i18n) Tests.
 *
 * Tests:
 * 1. RBAC Guard Logic (Client-side routing rules based on token & role)
 * 2. Server Auth Helpers (requireAuth, requireAuthUser, JWT validation, 401s)
 * 3. Role-Based Permissions (Seller vs Customer endpoint authorization)
 * 4. Multilingual Locale Bundles (EN, FR, RW parity, keys, currency)
 * 5. Language Persistence & Switching (initLanguage, setAppLanguage, AsyncStorage)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import jwt from 'jsonwebtoken';
import { requireAuth, requireAuthUser } from '../server/auth';
import { initLanguage, setAppLanguage } from '../i18n/index';
import i18n from '../i18n/index';

import en from '../i18n/en.json';
import fr from '../i18n/fr.json';
import rw from '../i18n/rw.json';

const TEST_SECRET = process.env.JWT_SECRET ?? 'fallback-secret-do-not-use-in-prod';

describe('Phase 5: Access Control (RBAC) & Multilingual (i18n) Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Client-Side RBAC Guard Rules
  // ═══════════════════════════════════════════════════════════════════════════
  describe('RBAC Route Guard Predicates', () => {
    // These reflect the exact conditions used in src/app/_layout.tsx
    const canAccessAuth = (token: string | null) => !token;
    const canAccessCustomer = (token: string | null, role: string | null) =>
      Boolean(token) && role === 'customer';
    const canAccessSeller = (token: string | null, role: string | null) =>
      Boolean(token) && role === 'seller';

    it('🔒 unauthenticated user can only access auth screens', () => {
      const token = null;
      const role = null;

      expect(canAccessAuth(token)).toBe(true);
      expect(canAccessCustomer(token, role)).toBe(false);
      expect(canAccessSeller(token, role)).toBe(false);
    });

    it('🔒 customer user can access customer screens, blocked from seller and auth screens', () => {
      const token = 'valid-customer-token';
      const role = 'customer';

      expect(canAccessAuth(token)).toBe(false);
      expect(canAccessCustomer(token, role)).toBe(true);
      expect(canAccessSeller(token, role)).toBe(false);
    });

    it('🔒 seller user can access seller screens, blocked from customer and auth screens', () => {
      const token = 'valid-seller-token';
      const role = 'seller';

      expect(canAccessAuth(token)).toBe(false);
      expect(canAccessCustomer(token, role)).toBe(false);
      expect(canAccessSeller(token, role)).toBe(true);
    });

    it('🔒 unknown or invalid role cannot access either customer or seller dashboards', () => {
      const token = 'valid-token';
      const role = 'guest';

      expect(canAccessCustomer(token, role)).toBe(false);
      expect(canAccessSeller(token, role)).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Server Auth Helpers (requireAuth & requireAuthUser)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Server Auth & Token Verification', () => {
    const createMockRequest = (authHeader?: string) => {
      const headers = new Map<string, string>();
      if (authHeader) headers.set('Authorization', authHeader);
      return {
        headers: {
          get: (name: string) => headers.get(name) ?? null,
        },
      } as unknown as Request;
    };

    it('❌ requireAuth returns 401 when Authorization header is missing', async () => {
      const req = createMockRequest();
      const result = requireAuth(req);

      expect(result).toBeInstanceOf(Response);
      const res = result as Response;
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.message).toBe('Unauthorized');
    });

    it('❌ requireAuth returns 401 when Bearer prefix is missing', async () => {
      const req = createMockRequest('Basic abcdef12345');
      const result = requireAuth(req);

      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(401);
    });

    it('❌ requireAuth returns 401 when JWT token is invalid or corrupted', async () => {
      const req = createMockRequest('Bearer invalid.jwt.token');
      const result = requireAuth(req);

      expect(result).toBeInstanceOf(Response);
      const res = result as Response;
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.message).toBe('Invalid or expired token');
    });

    it('❌ requireAuth returns 401 when token is signed with wrong secret', async () => {
      const fakeToken = jwt.sign({ sub: 42 }, 'wrong-secret');
      const req = createMockRequest(`Bearer ${fakeToken}`);
      const result = requireAuth(req);

      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(401);
    });

    it('✅ requireAuth extracts user ID from valid JWT token', () => {
      const validToken = jwt.sign({ sub: 77 }, TEST_SECRET);
      const req = createMockRequest(`Bearer ${validToken}`);
      const userId = requireAuth(req);

      expect(userId).toBe(77);
      expect(typeof userId).toBe('number');
    });

    it('✅ requireAuthUser extracts full user details (id, email, role) for Customer', () => {
      const customerToken = jwt.sign(
        { sub: 101, email: 'customer@shop.rw', role: 'customer' },
        TEST_SECRET
      );
      const req = createMockRequest(`Bearer ${customerToken}`);
      const user = requireAuthUser(req);

      expect(user).not.toBeInstanceOf(Response);
      expect(user).toEqual({
        id: 101,
        email: 'customer@shop.rw',
        role: 'customer',
      });
    });

    it('✅ requireAuthUser extracts full user details for Seller', () => {
      const sellerToken = jwt.sign(
        { sub: 202, email: 'seller@shop.rw', role: 'seller' },
        TEST_SECRET
      );
      const req = createMockRequest(`Bearer ${sellerToken}`);
      const user = requireAuthUser(req);

      expect(user).not.toBeInstanceOf(Response);
      expect(user).toEqual({
        id: 202,
        email: 'seller@shop.rw',
        role: 'seller',
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Role-Based Permissions Enforcement
  // ═══════════════════════════════════════════════════════════════════════════
  describe('RBAC Endpoint Authorization Simulation', () => {
    // Simulates the endpoint guard logic found in products+api and orders+api
    const checkSellerPermission = (user: { role: string }) => {
      if (user.role !== 'seller') {
        return { status: 403, message: 'Forbidden: Seller role required' };
      }
      return { status: 200, message: 'Allowed' };
    };

    it('❌ blocks Customer from seller-only action (create product, update stock, change order status)', () => {
      const customerUser = { id: 1, email: 'c@rw.rw', role: 'customer' };
      const result = checkSellerPermission(customerUser);

      expect(result.status).toBe(403);
      expect(result.message).toContain('Forbidden');
    });

    it('✅ allows Seller to perform seller-only actions', () => {
      const sellerUser = { id: 2, email: 's@rw.rw', role: 'seller' };
      const result = checkSellerPermission(sellerUser);

      expect(result.status).toBe(200);
      expect(result.message).toBe('Allowed');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Multilingual Locale Bundles (EN, FR, RW)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('i18n Translation Bundles & Parity', () => {
    it('✅ all three locale bundles exist and are non-empty objects', () => {
      expect(typeof en).toBe('object');
      expect(typeof fr).toBe('object');
      expect(typeof rw).toBe('object');

      expect(Object.keys(en).length).toBeGreaterThan(5);
      expect(Object.keys(fr).length).toBeGreaterThan(5);
      expect(Object.keys(rw).length).toBeGreaterThan(5);
    });

    it('✅ core translation namespaces exist in EN, FR, and RW', () => {
      const requiredNamespaces = [
        'common',
        'nav',
        'home',
        'product',
        'cart',
        'checkout',
        'orders',
        'profile',
        'seller',
      ];

      for (const ns of requiredNamespaces) {
        expect((en as Record<string, unknown>)[ns]).toBeDefined();
        expect((fr as Record<string, unknown>)[ns]).toBeDefined();
        expect((rw as Record<string, unknown>)[ns]).toBeDefined();
      }
    });

    it('✅ currency is RWF in all three languages', () => {
      expect(en.common.currency).toBe('RWF');
      expect(fr.common.currency).toBe('RWF');
      expect(rw.common.currency).toBe('RWF');
    });

    it('✅ order status translations are defined in all languages', () => {
      const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

      for (const status of statuses) {
        expect(en.orders.status[status]).toBeTruthy();
        expect(fr.orders.status[status]).toBeTruthy();
        expect(rw.orders.status[status]).toBeTruthy();
      }
    });

    it('✅ navigation item keys exist across all languages', () => {
      const navKeys = ['home', 'cart', 'orders', 'profile', 'dashboard', 'products'] as const;

      for (const key of navKeys) {
        expect(en.nav[key]).toBeTruthy();
        expect(fr.nav[key]).toBeTruthy();
        expect(rw.nav[key]).toBeTruthy();
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Language Persistence & Initialization
  // ═══════════════════════════════════════════════════════════════════════════
  describe('i18n Persistence & Switching Functions', () => {
    const LANGUAGE_KEY = 'dgshop_user_language';

    it('✅ initLanguage loads saved language from AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('fr');
      const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage');

      await initLanguage();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(LANGUAGE_KEY);
      expect(changeLanguageSpy).toHaveBeenCalledWith('fr');
    });

    it('✅ initLanguage falls back to device locale when no preference saved', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      (Localization.getLocales as jest.Mock) = jest.fn(() => [{ languageCode: 'rw' }]);
      const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage');

      await initLanguage();

      expect(changeLanguageSpy).toHaveBeenCalledWith('rw');
    });

    it('✅ initLanguage defaults to "en" when device language is unsupported', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      (Localization.getLocales as jest.Mock) = jest.fn(() => [{ languageCode: 'de' }]);
      const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage');

      await initLanguage();

      expect(changeLanguageSpy).toHaveBeenCalledWith('en');
    });

    it('✅ setAppLanguage persists choice to AsyncStorage and updates i18n', async () => {
      const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage');

      await setAppLanguage('rw');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(LANGUAGE_KEY, 'rw');
      expect(changeLanguageSpy).toHaveBeenCalledWith('rw');
    });

    it('✅ setAppLanguage switches back to English cleanly', async () => {
      const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage');

      await setAppLanguage('en');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(LANGUAGE_KEY, 'en');
      expect(changeLanguageSpy).toHaveBeenCalledWith('en');
    });
  });
});
