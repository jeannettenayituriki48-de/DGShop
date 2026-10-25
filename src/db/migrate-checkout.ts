/**
 * Migration to add delivery address, phone, and payment method to orders.
 * Run with:
 *   npx tsx --env-file=.env.local src/db/migrate-checkout.ts
 */
import { sql } from './index';

async function migrateCheckout() {
  console.log('Migrating orders table for checkout fields...');

  await sql`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash on Delivery';
  `;

  console.log('✅ Orders table updated successfully.');
  process.exit(0);
}

migrateCheckout().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
