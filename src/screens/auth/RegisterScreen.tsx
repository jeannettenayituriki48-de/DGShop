import { zodResolver } from '@hookform/resolvers/zod';
import { Href, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { UserRole } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['customer', 'seller']),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const register = useAuthStore((s) => s.register);
  const [apiError, setApiError] = useState('');

  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'customer',
    },
  });

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setValue('role', role);
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setApiError('');
      await register(data.name, data.email, data.password, selectedRole);
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { data?: { message?: string } } };
      if (error.message === 'NO_INTERNET') {
        setApiError('No internet connection. Please check your network.');
      } else {
        setApiError(error.response?.data?.message || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.badge}>D&G E-Commerce</Text>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join D&G Shop in Rwamagana</Text>

        {!!apiError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{apiError}</Text>
          </View>
        )}

        <Text style={styles.label}>Full Name</Text>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              placeholder="e.g. Jean Dupont"
              placeholderTextColor="#999"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
        {errors.name && <Text style={styles.fieldError}>{errors.name.message}</Text>}

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

        <Text style={styles.label}>Password (minimum 8 characters)</Text>
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

        <Text style={styles.label}>I am registering as:</Text>
        <View style={styles.roleRow}>
          <Pressable
            style={[styles.roleOption, selectedRole === 'customer' ? styles.roleOptionActive : null]}
            onPress={() => handleRoleSelect('customer')}
          >
            <Text style={[styles.roleText, selectedRole === 'customer' ? styles.roleTextActive : null]}>
              Customer (Buyer)
            </Text>
          </Pressable>

          <Pressable
            style={[styles.roleOption, selectedRole === 'seller' ? styles.roleOptionActive : null]}
            onPress={() => handleRoleSelect('seller')}
          >
            <Text style={[styles.roleText, selectedRole === 'seller' ? styles.roleTextActive : null]}>
              Seller (Store Owner)
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.button, isSubmitting ? styles.buttonDisabled : null]}
          disabled={isSubmitting}
          onPress={() => handleSubmit(onSubmit)()}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.push('/login' as Href)}>
            <Text style={styles.linkText}>Login</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
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
    marginTop: 10,
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
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#dcdcdc',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  roleOptionActive: {
    borderColor: '#0066cc',
    backgroundColor: '#eaf3ff',
  },
  roleText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  roleTextActive: {
    color: '#0066cc',
    fontWeight: '700',
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
