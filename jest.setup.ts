/**
 * jest.setup.ts
 * Global mocks for all Jest tests in DGShop.
 * This file is referenced by "setupFilesAfterFramework" in jest config.
 */

// ─── 1. expo-secure-store ─────────────────────────────────────────────────────
// Simulates the secure key-value store used to persist tokens.
const secureStoreData: Record<string, string> = {};

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string) =>
    Promise.resolve(secureStoreData[key] ?? null)
  ),
  setItemAsync: jest.fn((key: string, value: string) => {
    secureStoreData[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    delete secureStoreData[key];
    return Promise.resolve();
  }),
}));

// ─── 2. @react-native-async-storage/async-storage ────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// ─── 3. @react-native-community/netinfo ──────────────────────────────────────
// Default: device is online. Override per-test with jest.mocked(...).mockResolvedValueOnce
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  addEventListener: jest.fn(() => jest.fn()), // returns unsubscribe function
}));

// ─── 4. axios ────────────────────────────────────────────────────────────────
// Auto-mock: all methods (get, post, put, delete) become jest.fn()
// Individual tests can configure them with .mockResolvedValueOnce / .mockRejectedValueOnce
jest.mock('axios', () => {
  const mockAxios: any = {
    create: jest.fn((): any => mockAxios),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: { headers: { common: {} } },
  };
  return { default: mockAxios, ...mockAxios };
});

// ─── 5. expo-router ──────────────────────────────────────────────────────────
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: { Screen: () => null, Protected: () => null },
  Tabs: { Screen: () => null },
  Href: {},
}));

// ─── 6. react-i18next ────────────────────────────────────────────────────────
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,          // returns the key as-is for easy assertions
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(() => Promise.resolve()),
    },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// ─── 7. expo-image ────────────────────────────────────────────────────────────
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// ─── 8. Silence noisy React Native warnings in test output ────────────────────
const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);

beforeAll(() => {
  console.warn = (msg: string, ...args: unknown[]) => {
    if (
      typeof msg === 'string' &&
      (msg.includes('Animated:') ||
        msg.includes('useNativeDriver') ||
        msg.includes('act('))
    ) {
      return;
    }
    originalWarn(msg, ...args);
  };

  console.error = (msg: string, ...args: unknown[]) => {
    if (
      typeof msg === 'string' &&
      (msg.includes('Warning:') ||
        msg.includes('React.act') ||
        msg.includes('overlapping act()') ||
        msg.includes('not wrapped in act'))
    ) {
      return;
    }
    originalError(msg, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// ─── 9. Reset all mocks between tests ─────────────────────────────────────────
afterEach(() => {
  jest.clearAllMocks();
});
