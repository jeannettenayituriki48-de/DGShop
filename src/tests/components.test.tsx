/**
 * src/tests/components.test.tsx
 * Phase 4: Component unit and interaction tests.
 *
 * Tests:
 * 1. ProductCard (props, formatting, in-stock/out-of-stock, press interaction, image vs placeholder)
 * 2. SearchBar (text input, clear button visibility and interaction, submit event)
 * 3. StatusBadge (statuses, icons, sizes, fallback)
 * 4. LoadingView (spinner, default and custom message)
 * 5. ErrorView (generic error vs NO_INTERNET, retry button press)
 * 6. TrackingTimeline (standard timeline steps, cancelled state, formatted date)
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProductCard } from '../components/ProductCard';
import { SearchBar } from '../components/SearchBar';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';
import { TrackingTimeline } from '../components/TrackingTimeline';
import { Product } from '../api/products.api';

describe('Phase 4: Component Tests', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. ProductCard
  // ═══════════════════════════════════════════════════════════════════════════
  describe('ProductCard', () => {
    const mockProduct: Product = {
      id: 10,
      name: 'Rwandan Single Origin Coffee',
      description: 'Bourbon Arabica from Huye Mountain',
      price: 8500,
      image_url: 'https://example.com/coffee.jpg',
      category: 'Household Equipment',
      stock: 15,
      created_at: '2026-01-01',
    };

    it('✅ renders product title, category, formatted price, and stock indicator', async () => {
      const onPressMock = jest.fn();
      const { getByText } = await render(
        <ProductCard product={mockProduct} onPress={onPressMock} />
      );

      expect(getByText('Rwandan Single Origin Coffee')).toBeTruthy();
      expect(getByText('Household Equipment')).toBeTruthy();
      // Price format: "8,500 common.currency" (t('common.currency') returns key)
      expect(getByText(/8[,.]500/)).toBeTruthy();
      expect(getByText('product.inStock')).toBeTruthy();
    });

    it('✅ shows out of stock indicator when stock is 0', async () => {
      const outOfStockProduct: Product = {
        ...mockProduct,
        stock: 0,
      };

      const { getByText } = await render(
        <ProductCard product={outOfStockProduct} onPress={jest.fn()} />
      );

      expect(getByText('product.outOfStock')).toBeTruthy();
    });

    it('✅ shows category icon placeholder when image_url is null', async () => {
      const noImageProduct: Product = {
        ...mockProduct,
        image_url: null,
        category: 'Clothes',
      };

      const { getByText } = await render(
        <ProductCard product={noImageProduct} onPress={jest.fn()} />
      );

      // Clothes icon is 👕
      expect(getByText('👕')).toBeTruthy();
    });

    it('✅ fires onPress callback when clicked', async () => {
      const onPressMock = jest.fn();
      const { getByText } = await render(
        <ProductCard product={mockProduct} onPress={onPressMock} />
      );

      fireEvent.press(getByText('Rwandan Single Origin Coffee'));
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SearchBar
  // ═══════════════════════════════════════════════════════════════════════════
  describe('SearchBar', () => {
    it('✅ renders placeholder and search icon', async () => {
      const { getByPlaceholderText, getByText } = await render(
        <SearchBar
          value=""
          onChangeText={jest.fn()}
          placeholder="Search products..."
        />
      );

      expect(getByPlaceholderText('Search products...')).toBeTruthy();
      expect(getByText('🔍')).toBeTruthy();
    });

    it('✅ calls onChangeText when user types', async () => {
      const onChangeMock = jest.fn();
      const { getByPlaceholderText } = await render(
        <SearchBar
          value=""
          onChangeText={onChangeMock}
          placeholder="Search..."
        />
      );

      const input = getByPlaceholderText('Search...');
      fireEvent.changeText(input, 'coffee');

      expect(onChangeMock).toHaveBeenCalledWith('coffee');
    });

    it('✅ shows clear button only when value is not empty and clears text on press', async () => {
      const onChangeMock = jest.fn();
      const onClearMock = jest.fn();

      const { getByText, rerender, queryByText } = await render(
        <SearchBar
          value=""
          onChangeText={onChangeMock}
          onClear={onClearMock}
        />
      );

      // Clear button '✕' should NOT be visible when input is empty
      expect(queryByText('✕')).toBeNull();

      // Rerender with value
      await rerender(
        <SearchBar
          value="basket"
          onChangeText={onChangeMock}
          onClear={onClearMock}
        />
      );

      const clearBtn = getByText('✕');
      expect(clearBtn).toBeTruthy();

      fireEvent.press(clearBtn);
      expect(onChangeMock).toHaveBeenCalledWith('');
      expect(onClearMock).toHaveBeenCalledTimes(1);
    });

    it('✅ triggers onSubmitEditing on enter/submit', async () => {
      const onSubmitMock = jest.fn();
      const { getByPlaceholderText } = await render(
        <SearchBar
          value="tea"
          onChangeText={jest.fn()}
          onSubmitEditing={onSubmitMock}
          placeholder="Search items..."
        />
      );

      const input = getByPlaceholderText('Search items...');
      fireEvent(input, 'submitEditing');

      expect(onSubmitMock).toHaveBeenCalledTimes(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. StatusBadge
  // ═══════════════════════════════════════════════════════════════════════════
  describe('StatusBadge', () => {
    it('✅ renders pending status with hourglass icon', async () => {
      const { getByText } = await render(<StatusBadge status="pending" />);
      expect(getByText('⏳')).toBeTruthy();
      expect(getByText('orders.status.pending')).toBeTruthy();
    });

    it('✅ renders delivered status with checkmark icon', async () => {
      const { getByText } = await render(<StatusBadge status="delivered" />);
      expect(getByText('✅')).toBeTruthy();
      expect(getByText('orders.status.delivered')).toBeTruthy();
    });

    it('✅ renders shipped status with truck icon', async () => {
      const { getByText } = await render(<StatusBadge status="shipped" />);
      expect(getByText('🚚')).toBeTruthy();
      expect(getByText('orders.status.shipped')).toBeTruthy();
    });

    it('✅ renders cancelled status with cross icon', async () => {
      const { getByText } = await render(<StatusBadge status="cancelled" />);
      expect(getByText('❌')).toBeTruthy();
      expect(getByText('orders.status.cancelled')).toBeTruthy();
    });

    it('✅ supports small and medium sizes without error', async () => {
      const { getByText: getSmall } = await render(<StatusBadge status="processing" size="small" />);
      expect(getSmall('⚙️')).toBeTruthy();

      const { getByText: getMedium } = await render(<StatusBadge status="processing" size="medium" />);
      expect(getMedium('⚙️')).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. LoadingView
  // ═══════════════════════════════════════════════════════════════════════════
  describe('LoadingView', () => {
    it('✅ renders default loading text', async () => {
      const { getByText } = await render(<LoadingView />);
      expect(getByText('common.loading')).toBeTruthy();
    });

    it('✅ renders custom loading message when provided', async () => {
      const { getByText } = await render(<LoadingView message="Loading your orders..." />);
      expect(getByText('Loading your orders...')).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. ErrorView
  // ═══════════════════════════════════════════════════════════════════════════
  describe('ErrorView', () => {
    it('✅ renders generic error message and retry button', async () => {
      const onRetryMock = jest.fn();
      const { getByText } = await render(
        <ErrorView message="Failed to load items" onRetry={onRetryMock} />
      );

      expect(getByText('⚠️')).toBeTruthy();
      expect(getByText('Failed to load items')).toBeTruthy();
      expect(getByText('common.retry')).toBeTruthy();

      fireEvent.press(getByText('common.retry'));
      expect(onRetryMock).toHaveBeenCalledTimes(1);
    });

    it('✅ renders special offline/connection UI when message is NO_INTERNET', async () => {
      const onRetryMock = jest.fn();
      const { getByText } = await render(
        <ErrorView message="NO_INTERNET" onRetry={onRetryMock} />
      );

      expect(getByText('📡')).toBeTruthy();
      expect(getByText('Connection Issue')).toBeTruthy();
      expect(getByText('common.noInternet')).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. TrackingTimeline
  // ═══════════════════════════════════════════════════════════════════════════
  describe('TrackingTimeline', () => {
    it('✅ renders all 4 tracking steps for active orders', async () => {
      const { getByText } = await render(
        <TrackingTimeline
          status="shipped"
          createdAt="2026-02-15T10:00:00Z"
        />
      );

      expect(getByText('orders.timeline.placedTitle')).toBeTruthy();
      expect(getByText('orders.timeline.processingTitle')).toBeTruthy();
      expect(getByText('orders.timeline.shippedTitle')).toBeTruthy();
      expect(getByText('orders.timeline.deliveredTitle')).toBeTruthy();
    });

    it('✅ renders special cancelled alert view when order is cancelled', async () => {
      const { getByText } = await render(
        <TrackingTimeline
          status="cancelled"
          createdAt="2026-02-15T10:00:00Z"
        />
      );

      expect(getByText('orders.timeline.cancelledTitle')).toBeTruthy();
      expect(getByText('orders.timeline.cancelledDesc')).toBeTruthy();
    });
  });
});
