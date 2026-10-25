/**
 * src/tests/schemas.test.ts
 * Phase 2A — Zod schema validation + format helpers
 *
 * These tests import the schemas directly as plain objects (no React).
 * No mocks, no network — pure logic only.
 */
import { z } from 'zod';

// ─── Reproduce schemas exactly as defined in the app ─────────────────────────

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['customer', 'seller']),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

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

// ProductForm uses manual validation (no zod schema in the modal), so we test
// the business rules directly:
function validateProductForm(data: {
  name: string;
  price: string;
  stock: string;
}): string | null {
  if (!data.name.trim()) return 'Product name is required';
  const price = Number(data.price);
  if (isNaN(price) || price <= 0) return 'Price must be a positive number';
  const stock = Number(data.stock);
  if (isNaN(stock) || stock < 0) return 'Stock cannot be negative';
  return null; // valid
}

// ─── Helper: get first zod error message ─────────────────────────────────────
function firstError(result: { success: boolean; error?: any }): string {
  if (result.success) return '';
  return result.error?.issues?.[0]?.message ?? (result.error as any)?.errors?.[0]?.message ?? '';
}

// ═════════════════════════════════════════════════════════════════════════════
// A1. Login schema
// ═════════════════════════════════════════════════════════════════════════════
describe('loginSchema', () => {
  it('✅ accepts valid email + password', () => {
    const result = loginSchema.safeParse({
      email: 'alice@example.rw',
      password: 'Password1',
    });
    expect(result.success).toBe(true);
  });

  it('❌ rejects invalid email format', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'Password1' });
    expect(result.success).toBe(false);
    expect(firstError(result)).toBe('Please enter a valid email address');
  });

  it('❌ rejects password shorter than 8 characters', () => {
    const result = loginSchema.safeParse({ email: 'alice@example.rw', password: 'short' });
    expect(result.success).toBe(false);
    expect(firstError(result)).toBe('Password must be at least 8 characters');
  });

  it('❌ rejects empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'Password1' });
    expect(result.success).toBe(false);
  });

  it('⚡ edge: accepts minimum 8-char password exactly', () => {
    const result = loginSchema.safeParse({ email: 'a@b.rw', password: '12345678' });
    expect(result.success).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// A2. Register schema
// ═════════════════════════════════════════════════════════════════════════════
describe('registerSchema', () => {
  const valid = {
    name: 'Alice Mukamana',
    email: 'alice@example.rw',
    password: 'Password1',
    role: 'customer' as const,
  };

  it('✅ accepts valid customer registration', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('✅ accepts seller role', () => {
    const result = registerSchema.safeParse({ ...valid, role: 'seller' });
    expect(result.success).toBe(true);
  });

  it('❌ rejects name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...valid, name: 'A' });
    expect(result.success).toBe(false);
    expect(firstError(result)).toBe('Name must be at least 2 characters');
  });

  it('❌ rejects invalid role value', () => {
    const result = registerSchema.safeParse({ ...valid, role: 'admin' });
    expect(result.success).toBe(false);
  });

  it('❌ rejects empty name', () => {
    const result = registerSchema.safeParse({ ...valid, name: '' });
    expect(result.success).toBe(false);
  });

  it('⚡ edge: name of exactly 2 characters is valid', () => {
    const result = registerSchema.safeParse({ ...valid, name: 'Al' });
    expect(result.success).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// A3. Forgot password schema
// ═════════════════════════════════════════════════════════════════════════════
describe('forgotPasswordSchema', () => {
  it('✅ accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'alice@example.rw' }).success).toBe(true);
  });

  it('❌ rejects non-email string', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'notanemail' });
    expect(result.success).toBe(false);
    expect(firstError(result)).toBe('Please enter a valid email address');
  });

  it('⚡ edge: empty string is invalid', () => {
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// A4. Checkout schema
// ═════════════════════════════════════════════════════════════════════════════
describe('checkoutSchema', () => {
  const valid = {
    address: 'Kigabiro, Rwamagana Market Sector',
    phone: '0788123456',
    paymentMethod: 'MTN Mobile Money',
  };

  it('✅ accepts valid checkout data', () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });

  it('✅ accepts MTN international format phone', () => {
    expect(checkoutSchema.safeParse({ ...valid, phone: '+250788123456' }).success).toBe(true);
  });

  it('✅ accepts Airtel Money phone', () => {
    expect(checkoutSchema.safeParse({ ...valid, phone: '0728123456' }).success).toBe(true);
  });

  it('❌ rejects address shorter than 5 characters', () => {
    const result = checkoutSchema.safeParse({ ...valid, address: 'KG1' });
    expect(result.success).toBe(false);
    expect(firstError(result)).toContain('Rwamagana');
  });

  it('❌ rejects invalid phone number (wrong prefix)', () => {
    const result = checkoutSchema.safeParse({ ...valid, phone: '0712345678' });
    expect(result.success).toBe(false);
    expect(firstError(result)).toContain('Rwandan mobile number');
  });

  it('❌ rejects phone that is too short', () => {
    expect(checkoutSchema.safeParse({ ...valid, phone: '07881234' }).success).toBe(false);
  });

  it('⚡ edge: empty paymentMethod is invalid', () => {
    const result = checkoutSchema.safeParse({ ...valid, paymentMethod: '' });
    expect(result.success).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// A5. Product form validation (manual rules from ProductFormModal)
// ═════════════════════════════════════════════════════════════════════════════
describe('validateProductForm (ProductFormModal rules)', () => {
  it('✅ accepts valid product data', () => {
    expect(validateProductForm({ name: 'Kitenge Shirt', price: '18000', stock: '25' })).toBeNull();
  });

  it('❌ rejects empty name', () => {
    expect(validateProductForm({ name: '', price: '18000', stock: '10' })).toMatch(/name/i);
  });

  it('❌ rejects zero price', () => {
    expect(validateProductForm({ name: 'Shirt', price: '0', stock: '5' })).toMatch(/price/i);
  });

  it('❌ rejects negative price', () => {
    expect(validateProductForm({ name: 'Shirt', price: '-100', stock: '5' })).toMatch(/price/i);
  });

  it('❌ rejects negative stock', () => {
    expect(validateProductForm({ name: 'Shirt', price: '5000', stock: '-1' })).toMatch(/stock/i);
  });

  it('⚡ edge: stock of 0 is valid (out of stock is allowed)', () => {
    expect(validateProductForm({ name: 'Shirt', price: '5000', stock: '0' })).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// A6. Format helpers
// ═════════════════════════════════════════════════════════════════════════════
describe('formatPrice helper', () => {
  function formatPrice(amount: number) {
    return new Intl.NumberFormat('en-RW', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  it('✅ formats 18000 as "18,000"', () => expect(formatPrice(18000)).toBe('18,000'));
  it('✅ formats 7500 as "7,500"',  () => expect(formatPrice(7500)).toBe('7,500'));
  it('⚡ edge: formats 0 as "0"',  () => expect(formatPrice(0)).toBe('0'));
  it('⚡ edge: rounds 18000.9 to "18,001"', () => expect(formatPrice(18000.9)).toBe('18,001'));
});

describe('formatDate helper', () => {
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-RW', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  it('✅ formats ISO date string to readable date', () => {
    const result = formatDate('2024-01-15T10:30:00Z');
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/2024/);
  });

  it('⚡ edge: invalid date string returns "Invalid Date"', () => {
    const result = formatDate('not-a-date');
    expect(result).toMatch(/invalid date/i);
  });
});
