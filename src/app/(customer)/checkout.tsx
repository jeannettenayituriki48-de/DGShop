import { zodResolver } from '@hookform/resolvers/zod';
import { Href, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';
import { ordersApi } from '../../api/orders.api';
import { useCartStore } from '../../store/cartStore';

const PAYMENT_METHODS = [
  { id: 'MTN Mobile Money', labelKey: 'checkout.momoMTN', icon: '📱', color: '#f59e0b' },
  { id: 'Airtel Money', labelKey: 'checkout.momoAirtel', icon: '🔴', color: '#ef4444' },
  { id: 'Cash on Delivery', labelKey: 'checkout.cod', icon: '💵', color: '#10b981' },
] as const;

const checkoutSchema = z.object({
  address: z
    .string()
    .min(5, 'Please provide a detailed delivery address in Rwamagana (Sector, Street/Landmark)'),
  phone: z
    .string()
    .regex(
      /^(?:\+?250|0)?7[2389]\d{7}$/,
      'Enter a valid Rwandan mobile number (e.g. 0788123456 or 0728123456)'
    ),
  paymentMethod: z.string().min(1, 'Please select a payment method'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutScreen() {
  const { t } = useTranslation();
  const { items, getTotalPrice, getTotalCount, clearCart } = useCartStore();
  const [selectedPayment, setSelectedPayment] = useState<string>('MTN Mobile Money');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<{ id: number; phone: string } | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      address: '',
      phone: '',
      paymentMethod: 'MTN Mobile Money',
    },
  });

  const totalFormatted = new Intl.NumberFormat('en-RW', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(getTotalPrice());

  const handleSelectPayment = (methodId: string) => {
    setSelectedPayment(methodId);
    setValue('paymentMethod', methodId);
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      setErrorMessage(t('cart.emptyTitle'));
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const result = await ordersApi.createOrder({
        address: data.address.trim(),
        phone: data.phone.trim(),
        paymentMethod: selectedPayment,
      });

      await clearCart();
      setOrderSuccess({ id: result.orderId, phone: data.phone.trim() });
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { data?: { message?: string } } };
      if (error.message === 'NO_INTERNET') {
        setErrorMessage(t('common.noInternet'));
      } else {
        setErrorMessage(error.response?.data?.message || t('common.error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order was successfully placed, display the confirmation screen
  if (orderSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>{t('checkout.orderSuccessTitle')}</Text>
          <Text style={styles.successMsg}>
            {t('checkout.orderSuccessMessage', {
              id: orderSuccess.id,
              phone: orderSuccess.phone,
            })}
          </Text>

          <View style={styles.orderBadge}>
            <Text style={styles.orderBadgeText}>
              Order #{orderSuccess.id} • Rwamagana
            </Text>
          </View>

          <Pressable
            style={styles.ordersBtn}
            onPress={() => router.push('/orders' as Href)}
          >
            <Text style={styles.ordersBtnText}>{t('checkout.viewOrders')} →</Text>
          </Pressable>

          <Pressable
            style={styles.continueBtn}
            onPress={() => router.push('/' as Href)}
          >
            <Text style={styles.continueBtnText}>
              {t('checkout.continueShopping')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.badge}>{t('common.rwanda')}</Text>
        <Text style={styles.headerTitle}>{t('checkout.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('checkout.subtitle')}</Text>

        {!!errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Order Summary Mini-Bar */}
        <View style={styles.orderSummaryBox}>
          <Text style={styles.summaryTitle}>{t('checkout.orderSummary')}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {t('cart.itemsCount', { count: getTotalCount() })}
            </Text>
            <Text style={styles.summaryAmount}>
              {totalFormatted} {t('common.currency')}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('cart.delivery')}</Text>
            <Text style={styles.freeBadge}>{t('cart.free')}</Text>
          </View>
        </View>

        {/* Delivery Address Field */}
        <Text style={styles.inputLabel}>{t('checkout.deliveryAddress')} *</Text>
        <Controller
          control={control}
          name="address"
          render={({ field }) => (
            <TextInput
              style={[styles.input, errors.address ? styles.inputError : null]}
              placeholder={t('checkout.addressPlaceholder')}
              placeholderTextColor="#999"
              value={field.value}
              onChangeText={field.onChange}
              multiline
              numberOfLines={2}
            />
          )}
        />
        {errors.address && (
          <Text style={styles.fieldError}>{errors.address.message}</Text>
        )}

        {/* Phone Number Field */}
        <Text style={styles.inputLabel}>{t('checkout.phoneNumber')} *</Text>
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <TextInput
              style={[styles.input, errors.phone ? styles.inputError : null]}
              placeholder={t('checkout.phonePlaceholder')}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
        {errors.phone && (
          <Text style={styles.fieldError}>{errors.phone.message}</Text>
        )}

        {/* Payment Method Selector */}
        <Text style={styles.inputLabel}>{t('checkout.paymentMethod')}</Text>
        <View style={styles.paymentMethodsCol}>
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedPayment === method.id;
            return (
              <Pressable
                key={method.id}
                style={[
                  styles.paymentOption,
                  isSelected ? styles.paymentOptionActive : null,
                ]}
                onPress={() => handleSelectPayment(method.id)}
              >
                <Text style={styles.paymentIcon}>{method.icon}</Text>
                <View style={styles.paymentInfo}>
                  <Text
                    style={[
                      styles.paymentName,
                      isSelected ? styles.paymentNameActive : null,
                    ]}
                  >
                    {t(method.labelKey)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioDot,
                    isSelected ? styles.radioDotActive : null,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        {/* Submit Order Button */}
        <Pressable
          style={[styles.submitBtn, isSubmitting ? styles.submitBtnDisabled : null]}
          disabled={isSubmitting}
          onPress={() => handleSubmit(onSubmit)()}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>
              {t('checkout.placeOrder')} ({totalFormatted} {t('common.currency')})
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    textAlign: 'center',
  },
  orderSummaryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0066cc',
  },
  freeBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  fieldError: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
  paymentMethodsCol: {
    gap: 8,
    marginTop: 4,
    marginBottom: 18,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  paymentOptionActive: {
    borderColor: '#0066cc',
    backgroundColor: '#f0f7ff',
  },
  paymentIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  paymentNameActive: {
    color: '#0066cc',
    fontWeight: '700',
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  radioDotActive: {
    borderColor: '#0066cc',
    backgroundColor: '#0066cc',
  },
  submitBtn: {
    backgroundColor: '#0066cc',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  successIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  successMsg: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  orderBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 24,
  },
  orderBadgeText: {
    color: '#0284c7',
    fontWeight: '700',
    fontSize: 13,
  },
  ordersBtn: {
    backgroundColor: '#0066cc',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  ordersBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  continueBtn: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
});
