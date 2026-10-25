import { api } from './client';

export type UserRole = 'customer' | 'seller';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  register: async (
    name: string,
    email: string,
    password: string,
    role: UserRole = 'customer'
  ): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
      role,
    });
    return data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return data;
  },
};
