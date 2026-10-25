import { zodResolver } from '@hookform/resolvers/zod';
import { Href, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const [successMessage, setSuccessMessage] = useState('');
  const [apiError, setApiError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setApiError('');
      setSuccessMessage('');
      const message = await forgotPassword(data.email);
      setSuccessMessage(message || 'Password reset instructions have been sent to your email.');
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { data?: { message?: string } } };
      if (error.message === 'NO_INTERNET') {
        setApiError('No internet connection. Please check your network.');
      } else {
        setApiError(error.response?.data?.message || 'Failed to submit request. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.badge}>Security</Text>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your registered email and we will send you instructions to reset your password.
        </Text>

        {!!apiError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{apiError}</Text>
          </View>
        )}

        {!!successMessage && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        <Text style={styles.label}>Email Address</Text>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              placeholder="name@example.com"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
        {errors.email && <Text style={styles.fieldError}>{errors.email.message}</Text>}

        <Pressable
          style={[styles.button, isSubmitting ? styles.buttonDisabled : null]}
          disabled={isSubmitting}
          onPress={() => handleSubmit(onSubmit)()}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Send Reset Link</Text>
          )}
        </Pressable>

        <Pressable style={styles.backBtn} onPress={() => router.push('/login' as Href)}>
          <Text style={styles.backText}>← Back to Login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f4f6f8',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: '#e3f2fd',
    color: '#0d47a1',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 4,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fafafa',
    color: '#111',
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  fieldError: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#c62828',
    fontSize: 13,
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  successText: {
    color: '#2e7d32',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backBtn: {
    alignItems: 'center',
    marginTop: 18,
  },
  backText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '600',
  },
});
