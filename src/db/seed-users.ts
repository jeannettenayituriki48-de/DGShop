/**
 * Seed script — sample user accounts (customers & sellers)
 *
 * Run with:
 *   npx tsx --env-file=.env.local src/db/seed-users.ts
 *
 * Safe to run multiple times — uses ON CONFLICT DO NOTHING.
 * All sample accounts use the password:  DGShop2024!
 */
import bcrypt from 'bcryptjs';
import { sql } from './index';

const PASSWORD = 'DGShop2024!';

const SAMPLE_USERS: Array<{
  name: string;
  email: string;
  role: 'customer' | 'seller';
}> = [
  // ── Sellers ────────────────────────────────────────────────────────────────
  { name: 'Diane Uwase',     email: 'diane.seller@dgshop.rw',   role: 'seller'   },
  { name: 'Gerard Habimana', email: 'gerard.seller@dgshop.rw',  role: 'seller'   },

  // ── Customers ──────────────────────────────────────────────────────────────
  { name: 'Alice Mukamana',  email: 'alice@example.rw',         role: 'customer' },
  { name: 'Bob Nshimiyimana',email: 'bob@example.rw',           role: 'customer' },
  { name: 'Claire Ingabire', email: 'claire@example.rw',        role: 'customer' },
  { name: 'David Hakizimana',email: 'david@example.rw',         role: 'customer' },
  { name: 'Eva Uwimana',     email: 'eva@example.rw',           role: 'customer' },
];

async function seedUsers() {
  console.log('🔐 Hashing passwords…');
  const hash = await bcrypt.hash(PASSWORD, 12);

  console.log('👥 Inserting sample users…');

  for (const u of SAMPLE_USERS) {
    const result = await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (${u.name}, ${u.email}, ${hash}, ${u.role})
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, email, role
    `;

    if (result.length > 0) {
      const icon = u.role === 'seller' ? '🏪' : '🛍️';
      console.log(`  ${icon} Created ${u.role}: ${u.name} <${u.email}>`);
    } else {
      console.log(`  ⚠️  Skipped (already exists): ${u.email}`);
    }
  }

  console.log('\n✅ Users seeded successfully!');
  console.log('─────────────────────────────────────────');
  console.log('  Shared password for all accounts:');
  console.log('  👉  DGShop2024!');
  console.log('─────────────────────────────────────────\n');

  console.log('Sample login credentials:');
  for (const u of SAMPLE_USERS) {
    const tag = u.role === 'seller' ? '[SELLER]  ' : '[CUSTOMER]';
    console.log(`  ${tag} ${u.email.padEnd(32)} / DGShop2024!`);
  }

  process.exit(0);
}

seedUsers().catch((err) => {
  console.error('❌ User seeding failed:', err);
  process.exit(1);
});
