import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

/**
 * Base URL for all API calls.
 * Set EXPO_PUBLIC_API_BASE_URL in .env.local:
 *   Web / iOS Simulator : http://localhost:8081
 *   Android Emulator    : http://10.0.2.2:8081
 *   Physical device     : http://<machine-local-ip>:8081
 */
const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8081') + '/api';

// eslint-disable-next-line import/no-named-as-default-member
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const net = await NetInfo.fetch();
  if (!net.isConnected) throw new Error('NO_INTERNET');
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
    }
    return Promise.reject(error);
  }
);