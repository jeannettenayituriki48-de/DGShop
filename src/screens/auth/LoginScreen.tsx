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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [apiError, setApiError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setApiError('');
      await login(data.email, data.password);
    } catch (err: unknown) {
      console.error('[LoginScreen] Login error:', err);
      const error = err as { message?: string; response?: { data?: { message?: string } } };
      if (error.message === 'NO_INTERNET') {
        setApiError('No internet connection. Please check your network.');
      } else if (error.response?.data?.message) {
        setApiError(error.response.data.message);
      } else if (error.message) {
        setApiError(error.message);
      } else {
        setApiError('Login failed. Please check your credentials.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.badge}>Rwamagana, Rwanda</Text>
        <Text style={styles.title}>D&G E-Commerce</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {!!apiError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{apiError}</Text>
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

        <Text style={styles.label}>Password</Text>
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextInput
              style={[styles.input, errors.password ? styles.inputError : null]}
              placeholder="••••••••"
              placeholderTextColor="#999"
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
        {errors.password && <Text style={styles.fieldError}>{errors.password.message}</Text>}

        <Pressable
          style={styles.forgotBtn}
          onPress={() => router.push('/forgot-password' as Href)}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </Pressable>

        <Pressable
          style={[styles.button, isSubmitting ? styles.buttonDisabled : null]}
          disabled={isSubmitting}
          onPress={() => handleSubmit(onSubmit)()}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{"Don't have an account? "}</Text>
          <Pressable onPress={() => router.push('/register' as Href)}>
            <Text style={styles.linkText}>Register here</Text>
          </Pressable>
        </View>
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
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 8,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  forgotText: {
    color: '#0066cc',
    fontSize: 13,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#555',
  },
  linkText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '600',
  },
});