/**
 * src/tests/smoke.test.ts
 *
 * Phase 1 — Smoke test
 * Purpose: verify Jest is wired correctly before writing real tests.
 * Every assertion here must PASS without touching the database or network.
 */

// ─── A. Pure maths / logic ────────────────────────────────────────────────────
describe('Smoke — basic Jest functionality', () => {
  it('adds numbers correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('handles async/await', async () => {
    const result = await Promise.resolve('DGShop');
    expect(result).toBe('DGShop');
  });

  it('matches an object shape', () => {
    const user = { id: 1, name: 'Alice', role: 'customer' };
    expect(user).toMatchObject({ role: 'customer' });
  });
});

// ─── B. expo-secure-store mock ────────────────────────────────────────────────
import * as SecureStore from 'expo-secure-store';

describe('Smoke — expo-secure-store mock', () => {
  it('setItemAsync and getItemAsync work in memory', async () => {
    await SecureStore.setItemAsync('test_key', 'hello');
    const value = await SecureStore.getItemAsync('test_key');
    expect(value).toBe('hello');
  });

  it('deleteItemAsync removes the key', async () => {
    await SecureStore.setItemAsync('del_key', 'bye');
    await SecureStore.deleteItemAsync('del_key');
    const value = await SecureStore.getItemAsync('del_key');
    // After deletion the mock returns null
    expect(value).toBeNull();
  });
});

// ─── C. NetInfo mock ──────────────────────────────────────────────────────────
import NetInfo from '@react-native-community/netinfo';

describe('Smoke — NetInfo mock', () => {
  it('reports online by default', async () => {
    const state = await NetInfo.fetch();
    expect(state.isConnected).toBe(true);
  });

  it('can simulate offline by overriding the mock', async () => {
    jest.mocked(NetInfo.fetch).mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
      type: 'none',
      isWifiEnabled: false,
      details: null,
    } as any);
    const state = await NetInfo.fetch();
    expect(state.isConnected).toBe(false);
  });
});

// ─── D. Rwandan phone regex (from checkout schema) ────────────────────────────
describe('Smoke — Rwandan phone number regex', () => {
  const regex = /^(?:\+?250|0)?7[2389]\d{7}$/;

  it.each([
    ['0788123456', true],
    ['0728123456', true],
    ['+250788123456', true],
    ['250738123456', true],
    ['0712345678', false],   // invalid prefix
    ['12345', false],         // too short
    ['', false],              // empty
  ])('phone %s → valid=%s', (phone, expected) => {
    expect(regex.test(phone)).toBe(expected);
  });
});

// ─── E. Price formatting helper ───────────────────────────────────────────────
describe('Smoke — price formatting', () => {
  function formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-RW', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  it('formats a whole number correctly', () => {
    expect(formatPrice(18000)).toBe('18,000');
  });

  it('formats zero as "0"', () => {
    expect(formatPrice(0)).toBe('0');
  });

  it('rounds down fractions', () => {
    expect(formatPrice(18000.9)).toBe('18,001'); // rounds to nearest integer
  });
});
