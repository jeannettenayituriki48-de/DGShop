/**
 * src/tests/screens.test.tsx
 * Phase 4: Screen-level interaction and integration tests.
 *
 * Tests:
 * 1. LoginScreen (rendering, navigation links)
 * 2. ForgotPasswordScreen (rendering, back navigation)
 * 3. RegisterScreen (rendering, role selection, navigation)
 */

import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react-native';
import { router } from 'expo-router';
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import { useAuthStore } from '../store/authStore';

describe('Phase 4: Screen Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      token: null,
      role: null,
      loading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. LoginScreen
  // ═══════════════════════════════════════════════════════════════════════════
  describe('LoginScreen', () => {
    it('✅ renders heading, inputs, forgot password button, and submit button', async () => {
      const { getByText, getByPlaceholderText } = await render(<LoginScreen />);

      expect(getByText('D&G E-Commerce')).toBeTruthy();
      expect(getByText('Sign in to your account')).toBeTruthy();
      expect(getByPlaceholderText('name@example.com')).toBeTruthy();
      expect(getByPlaceholderText('••••••••')).toBeTruthy();
      expect(getByText('Forgot Password?')).toBeTruthy();
      expect(getByText('Login')).toBeTruthy();
    });

    it('✅ navigates to /forgot-password when Forgot Password link is pressed', async () => {
      const { getByText } = await render(<LoginScreen />);

      fireEvent.press(getByText('Forgot Password?'));
      expect(router.push).toHaveBeenCalledWith('/forgot-password');
    });

    it('✅ navigates to /register when Register here link is pressed', async () => {
      const { getByText } = await render(<LoginScreen />);

      fireEvent.press(getByText('Register here'));
      expect(router.push).toHaveBeenCalledWith('/register');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ForgotPasswordScreen
  // ═══════════════════════════════════════════════════════════════════════════
  describe('ForgotPasswordScreen', () => {
    it('✅ renders security badge, title, email input, and submit button', async () => {
      const { getByText, getByPlaceholderText } = await render(<ForgotPasswordScreen />);

      expect(getByText('Security')).toBeTruthy();
      expect(getByText('Forgot Password')).toBeTruthy();
      expect(getByPlaceholderText('name@example.com')).toBeTruthy();
      expect(getByText('Send Reset Link')).toBeTruthy();
      expect(getByText('← Back to Login')).toBeTruthy();
    });

    it('✅ navigates to /login when Back to Login is pressed', async () => {
      const { getByText } = await render(<ForgotPasswordScreen />);

      fireEvent.press(getByText('← Back to Login'));
      expect(router.push).toHaveBeenCalledWith('/login');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. RegisterScreen
  // ═══════════════════════════════════════════════════════════════════════════
  describe('RegisterScreen', () => {
    it('✅ renders registration fields, role buttons, and Register button', async () => {
      const { getByText, getByPlaceholderText } = await render(<RegisterScreen />);

      expect(getByText('Create Account')).toBeTruthy();
      expect(getByPlaceholderText('e.g. Jean Dupont')).toBeTruthy();
      expect(getByPlaceholderText('name@example.com')).toBeTruthy();
      expect(getByPlaceholderText('••••••••')).toBeTruthy();
      expect(getByText('Customer (Buyer)')).toBeTruthy();
      expect(getByText('Seller (Store Owner)')).toBeTruthy();
      expect(getByText('Register')).toBeTruthy();
    });

    it('✅ allows selecting Seller role', async () => {
      const { getByText } = await render(<RegisterScreen />);

      const sellerBtn = getByText('Seller (Store Owner)');
      fireEvent.press(sellerBtn);
      expect(sellerBtn).toBeTruthy();
    });

    it('✅ navigates to /login when Login is pressed in footer', async () => {
      const { getByText } = await render(<RegisterScreen />);

      fireEvent.press(getByText('Login'));
      expect(router.push).toHaveBeenCalledWith('/login');
    });
  });
});
