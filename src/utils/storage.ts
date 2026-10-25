import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Universal key-value storage adapter for DGShop:
 * - On Native (iOS / Android): uses expo-secure-store for encrypted Keychain / Keystore storage.
 * - On Web: uses window.localStorage / AsyncStorage (since expo-secure-store has no web native module).
 */
export const storage = {
  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch {
        // Fallback to AsyncStorage if localStorage access is restricted
      }
      return await AsyncStorage.getItem(key);
    }

    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return await AsyncStorage.getItem(key);
    }
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
          return;
        }
      } catch {
        // Fallback to AsyncStorage
      }
      await AsyncStorage.setItem(key, value);
      return;
    }

    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  },

  async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
          return;
        }
      } catch {
        // Fallback to AsyncStorage
      }
      await AsyncStorage.removeItem(key);
      return;
    }

    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      await AsyncStorage.removeItem(key);
    }
  },
};
