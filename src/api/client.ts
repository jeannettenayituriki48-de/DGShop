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
  if (envUrl) {
    return envUrl.replace(/\/+$/, '') + '/api';
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8081/api';
  }
  return 'http://localhost:8081/api';
}

export const BASE_URL = getBaseApiUrl();

// eslint-disable-next-line import/no-named-as-default-member
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  if (Platform.OS !== 'web') {
    const net = await NetInfo.fetch();
    if (!net.isConnected) throw new Error('NO_INTERNET');
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