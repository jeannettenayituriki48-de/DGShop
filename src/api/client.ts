import Constants from 'expo-constants';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { storage } from '../utils/storage';

/**
 * Base URL for all API calls.
 * Set EXPO_PUBLIC_API_BASE_URL in .env.local:
 *   Web / iOS Simulator : http://localhost:8081
 *   Android Emulator    : http://10.0.2.2:8081
 *   Physical device     : http://<machine-local-ip>:8081
 *   Production (Render) : https://dgshop-backend.onrender.com
 */
export function getBaseApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  // 1. On Web:
  // If explicitly configured with a remote production HTTPS URL (e.g. Render https://...)
  if (Platform.OS === 'web') {
    if (envUrl && envUrl.startsWith('https://')) {
      return envUrl.replace(/\/+$/, '') + '/api';
    }
    // In local development on Web, ALWAYS match the browser window's origin:
    // If you visit http://localhost:8081, API is http://localhost:8081/api
    // If you visit http://192.168.10.181:8081, API is http://192.168.10.181:8081/api
    // This eliminates any cross-origin issues or firewall blocks between localhost and LAN IP.
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/api`;
    }
  }

  // 2. If configured with a production HTTPS cloud URL (Render):
  if (envUrl && envUrl.startsWith('https://')) {
    return envUrl.replace(/\/+$/, '') + '/api';
  }

  // 3. On Mobile (iOS / Android) in Expo Go:
  // Dynamically extract the Metro host IP and port that served the bundle to the device.
  // In Expo Go, hostUri looks like "192.168.10.181:8081".
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } })
      ?.manifest2?.extra?.expoGo?.debuggerHost ??
    (Constants as unknown as { manifest?: { debuggerHost?: string } })?.manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8081/api`;
    }
  }

  // 4. If EXPO_PUBLIC_API_BASE_URL was configured with a LAN IP
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/+$/, '') + '/api';
  }

  // 5. Android emulator fallback (10.0.2.2 is the emulator's alias for the host computer loopback)
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8081/api';
  }

  // 6. iOS Simulator / default fallback
  return 'http://localhost:8081/api';
}

export const BASE_URL = getBaseApiUrl();

// eslint-disable-next-line import/no-named-as-default-member
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  if (Platform.OS !== 'web') {
    const net = await NetInfo.fetch();
    // Only throw if NetInfo explicitly reports false (not during initial null/undefined state)
    if (net && net.isConnected === false) {
      throw new Error('NO_INTERNET');
    }
  } else if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
    throw new Error('NO_INTERNET');
  }

  const token = await storage.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.deleteItemAsync('token');
      await storage.deleteItemAsync('user');
    }
    return Promise.reject(error);
  }
);