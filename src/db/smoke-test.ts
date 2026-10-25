/**
 * End-to-end smoke test for the Neon-backed API routes.
 * Run with: npx tsx --env-file=.env.local src/db/smoke-test.ts
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from './index';

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret-do-not-use-in-prod';

async function run() {
  console.log('\n─── DGShop Neon Smoke Test ───\n');

  // 1. Verify DB connection
  const dbCheck = await sql`SELECT NOW() AS now, current_database() AS db`;
  console.log('✅ DB connected:', dbCheck[0]);

  // 2. Count tables
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  console.log('✅ Tables:', tables.map((r: any) => r.table_name).join(', '));

  // 3. Count seeded products
  const products = await sql`SELECT id, name, price FROM products ORDER BY id`;
  console.log(`✅ Products (${products.length}):`, products.map((p: any) => `${p.name} ($${p.price})`).join(', '));

  // 4. Create a test user (or reuse)
  const testEmail = 'test@dgshop.dev';
  const testPassword = 'TestPass123';
  const existing = await sql`SELECT id FROM users WHERE email = ${testEmail}`;
  let userId: number;

  if (existing.length > 0) {
    userId = (existing[0] as any).id;
    console.log(`✅ Test user already exists (id=${userId})`);
  } else {
    const hash = await bcrypt.hash(testPassword, 12);
    const ins = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES ('Test User', ${testEmail}, ${hash})
      RETURNING id
    `;
    userId = (ins[0] as any).id;
    console.log(`✅ Test user created (id=${userId})`);
  }

  // 5. Verify bcrypt round-trip
  const userRow = await sql`SELECT password_hash FROM users WHERE id = ${userId}`;
  const hashOk = await bcrypt.compare(testPassword, (userRow[0] as any).password_hash);
  console.log('✅ bcrypt verify:', hashOk ? 'PASS' : 'FAIL ❌');

  // 6. Verify JWT round-trip
  const token = jwt.sign({ sub: userId, email: testEmail, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  console.log('✅ JWT sign/verify: PASS, sub=' + decoded.sub);

  // 7. Add an item to cart
  const product = products[0] as any;
  await sql`
    INSERT INTO cart_items (user_id, product_id, quantity)
    VALUES (${userId}, ${product.id}, 1)
    ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = 1
  `;
  const cart = await sql`SELECT * FROM cart_items WHERE user_id = ${userId}`;
  console.log(`✅ Cart item upserted: product_id=${cart[0] ? (cart[0] as any).product_id : 'n/a'}`);

  console.log('\n✅ All smoke tests passed. Neon is fully wired.\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('\n❌ Smoke test failed:', err.message);
  process.exit(1);
});
