import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { authApi, User, UserRole } from '../api/auth.api';

type AuthState = {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
  /** Patch the stored user (e.g. after a profile update) and persist to SecureStore */
  updateUser: (patch: Partial<User>) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  role: null,
  loading: true,

  login: async (email, password) => {
    const data = await authApi.login(email, password);
    await SecureStore.setItemAsync('token', data.token);
    await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    set({ token: data.token, user: data.user, role: data.user.role });
  },

  register: async (name, email, password, role) => {
    const data = await authApi.register(name, email, password, role);
    await SecureStore.setItemAsync('token', data.token);
    await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    set({ token: data.token, user: data.user, role: data.user.role });
  },

  forgotPassword: async (email) => {
    const res = await authApi.forgotPassword(email);
    return res.message;
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    set({ token: null, user: null, role: null });
  },

  restore: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const userStr = await SecureStore.getItemAsync('user');
      const user: User | null = userStr ? (JSON.parse(userStr) as User) : null;
      set({
        token,
        user,
        role: user?.role ?? null,
        loading: false,
      });
    } catch {
      set({ token: null, user: null, role: null, loading: false });
    }
  },

  updateUser: async (patch) => {
    // Merge patch into current user, update state and SecureStore
    const current = useAuthStore.getState().user;
    if (!current) return;
    const updated: User = { ...current, ...patch };
    await SecureStore.setItemAsync('user', JSON.stringify(updated));
    set({ user: updated });
  },
}));