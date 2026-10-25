/**
 * Automated Comprehensive Test Suite for D&G Shop Rwamagana
 * Run with: npx tsx --env-file=.env.local src/tests/test-suite.ts
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '../db/index';

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret-do-not-use-in-prod';

interface TestCase {
  id: string;
  name: string;
  category: 'Security & Auth' | 'Catalog & Search' | 'Cart & Checkout' | 'Orders & Tracking' | 'Seller & Inventory' | 'Data Integrity';
  status: 'PASS' | 'FAIL';
  durationMs: number;
  details?: string;
}

const testResults: TestCase[] = [];

async function test(
  id: string,
  name: string,
  category: TestCase['category'],
  fn: () => Promise<void>
) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    testResults.push({ id, name, category, status: 'PASS', durationMs });
    console.log(`  ✅ [${id}] ${name} (${durationMs}ms)`);
  } catch (err: unknown) {
    const durationMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    testResults.push({ id, name, category, status: 'FAIL', durationMs, details: msg });
    console.error(`  ❌ [${id}] ${name} (${durationMs}ms): ${msg}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log('       D&G SHOP RWAMAGANA — AUTOMATED TEST SUITE (PHASE 7)      ');
  console.log('===============================================================\n');

  // --- Category 1: Security & Auth ---
  console.log('▶ Category: Security & Auth');

  await test('SEC-01', 'Bcrypt password hashing (12 rounds) & verification', 'Security & Auth', async () => {
    const rawPass = 'Rwamagana@2026';
    const hash = await bcrypt.hash(rawPass, 12);
    assert(hash.startsWith('$2'), 'Hash must follow standard bcrypt format');
    const valid = await bcrypt.compare(rawPass, hash);
    const invalid = await bcrypt.compare('WrongPassword', hash);
    assert(valid === true, 'Correct password must compare true');
    assert(invalid === false, 'Incorrect password must compare false');
  });

  await test('SEC-02', 'JWT Token issuance, role payload, and expiration', 'Security & Auth', async () => {
    const payload = { sub: 9999, email: 'owner@dgshop.rw', role: 'seller' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    assert(decoded.sub === 9999, 'Decoded sub must match user ID');
    assert(decoded.role === 'seller', 'Decoded role must be seller');
    assert(typeof decoded.exp === 'number', 'Expiration must be present');
  });

  await test('SEC-03', 'Rwandan Phone Number format validation', 'Security & Auth', async () => {
    const rwandaPhoneRegex = /^(?:\+?250|0)?7[2389]\d{7}$/;
    assert(rwandaPhoneRegex.test('0788123456'), 'MTN local number must pass');
    assert(rwandaPhoneRegex.test('+250788123456'), 'MTN international number must pass');
    assert(rwandaPhoneRegex.test('0728123456'), 'Airtel local number must pass');
    assert(rwandaPhoneRegex.test('0738123456'), 'Airtel secondary prefix must pass');
    assert(!rwandaPhoneRegex.test('0712345678'), 'Invalid prefix 071 must fail');
    assert(!rwandaPhoneRegex.test('1234567'), 'Short number must fail');
  });

  // --- Category 2: Catalog & Search ---
  console.log('\n▶ Category: Catalog & Search');

  await test('CAT-01', 'Fetch all products & verify active Rwamagana categories', 'Catalog & Search', async () => {
    const rows = await sql`SELECT id, name, category, price, stock FROM products`;
    assert(rows.length >= 6, 'Must have at least 6 seeded products');
    const categories = new Set(rows.map((r: any) => r.category));
    assert(categories.has('Clothes'), 'Must have Clothes category');
    assert(categories.has('Shoes'), 'Must have Shoes category');
    assert(categories.has('Household Equipment'), 'Must have Household Equipment category');
  });

  await test('CAT-02', 'Search query ILIKE case-insensitivity test', 'Catalog & Search', async () => {
    const queryUpper = 'KITENGE';
    const queryLower = 'kitenge';
    const rows1 = await sql`SELECT id FROM products WHERE name ILIKE ${'%' + queryUpper + '%'}`;
    const rows2 = await sql`SELECT id FROM products WHERE name ILIKE ${'%' + queryLower + '%'}`;
    assert(rows1.length === rows2.length, 'Search must be case insensitive');
    assert(rows1.length > 0, 'Search for kitenge should return items');
  });

  await test('CAT-03', 'Price boundary filtering', 'Catalog & Search', async () => {
    const minP = 5000;
    const maxP = 25000;
    const rows = await sql`
      SELECT id, price FROM products WHERE price >= ${minP} AND price <= ${maxP}
    `;
    assert(rows.length > 0, 'Items should be found in 5,000 - 25,000 RWF range');
    for (const r of rows as any[]) {
      assert(Number(r.price) >= minP && Number(r.price) <= maxP, 'Price must be in range');
    }
  });

  // --- Category 3: Cart & Checkout ---
  console.log('\n▶ Category: Cart & Checkout');

  const testUserEmail = `test_runner_${Date.now()}@dgshop.rw`;
  let testUserId = 0;

  await test('CRT-01', 'Create test customer and verify cart upsert', 'Cart & Checkout', async () => {
    const hash = await bcrypt.hash('Secret123!', 10);
    const userRes = await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ('Automated Test Customer', ${testUserEmail}, ${hash}, 'customer')
      RETURNING id
    `;
    testUserId = (userRes[0] as any).id;

    const prod = (await sql`SELECT id FROM products LIMIT 1`)[0] as any;
    await sql`
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES (${testUserId}, ${prod.id}, 2)
      ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = 2
    `;

    const cart = await sql`SELECT * FROM cart_items WHERE user_id = ${testUserId}`;
    assert(cart.length === 1, 'Cart should contain exactly 1 item');
    assert(Number((cart[0] as any).quantity) === 2, 'Quantity should be 2');
  });

  let createdOrderId = 0;
  await test('CRT-02', 'Order checkout with stock deduction & cart wipe', 'Cart & Checkout', async () => {
    const prod = (await sql`SELECT id, price, stock FROM products LIMIT 1`)[0] as any;
    const initialStock = Number(prod.stock);
    const qty = 1;
    const total = Number(prod.price) * qty;

    // Create order
    const orderRes = await sql`
      INSERT INTO orders (user_id, total, address, phone, payment_method, status)
      VALUES (${testUserId}, ${total}, 'Kigabiro, Near Rwamagana Market', '0788123456', 'MTN Mobile Money', 'pending')
      RETURNING id
    `;
    createdOrderId = (orderRes[0] as any).id;

    // Insert order items & reduce stock
    await sql`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price)
      VALUES (${createdOrderId}, ${prod.id}, ${qty}, ${prod.price})
    `;
    await sql`
      UPDATE products SET stock = stock - ${qty} WHERE id = ${prod.id}
    `;

    // Clear cart
    await sql`DELETE FROM cart_items WHERE user_id = ${testUserId}`;

    const checkStock = (await sql`SELECT stock FROM products WHERE id = ${prod.id}`)[0] as any;
    assert(Number(checkStock.stock) === initialStock - qty, 'Stock must decrease by ordered quantity');

    const checkCart = await sql`SELECT * FROM cart_items WHERE user_id = ${testUserId}`;
    assert(checkCart.length === 0, 'Cart must be wiped after order creation');
  });

  // --- Category 4: Orders & Tracking ---
  console.log('\n▶ Category: Orders & Tracking');

  await test('ORD-01', 'Fetch customer order details & aggregated items', 'Orders & Tracking', async () => {
    const orders = await sql`
      SELECT o.id, o.status, o.total, o.address, o.phone,
        COALESCE(
          json_agg(json_build_object(
            'product_id', oi.product_id,
            'name', p.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price
          )) FILTER (WHERE oi.product_id IS NOT NULL), '[]'
        ) as items
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      WHERE o.id = ${createdOrderId}
      GROUP BY o.id
    `;
    assert(orders.length === 1, 'Order must be retrieved');
    const order = orders[0] as any;
    assert(order.status === 'pending', 'Initial status must be pending');
    assert(Array.isArray(order.items) && order.items.length > 0, 'Must have items array');
  });

  await test('ORD-02', 'Lifecycle progression: pending -> processing -> shipped -> delivered', 'Orders & Tracking', async () => {
    for (const st of ['processing', 'shipped', 'delivered']) {
      await sql`UPDATE orders SET status = ${st} WHERE id = ${createdOrderId}`;
      const check = (await sql`SELECT status FROM orders WHERE id = ${createdOrderId}`)[0] as any;
      assert(check.status === st, `Status must advance to ${st}`);
    }
  });

  // --- Category 5: Seller & Inventory ---
  console.log('\n▶ Category: Seller & Inventory');

  let testProdId = 0;
  await test('SLR-01', 'Seller CRUD: Create new product in catalog', 'Seller & Inventory', async () => {
    const res = await sql`
      INSERT INTO products (name, description, price, image_url, category, stock)
      VALUES ('Test Rwamagana Basket', 'Handwoven sisal basket', 8500, NULL, 'Household Equipment', 15)
      RETURNING id, name, stock
    `;
    testProdId = (res[0] as any).id;
    assert(testProdId > 0, 'Product must receive valid serial ID');
    assert((res[0] as any).name === 'Test Rwamagana Basket', 'Name must match');
  });

  await test('SLR-02', 'Seller CRUD: Live stock adjustment', 'Seller & Inventory', async () => {
    await sql`UPDATE products SET stock = 25 WHERE id = ${testProdId}`;
    const check = (await sql`SELECT stock FROM products WHERE id = ${testProdId}`)[0] as any;
    assert(Number(check.stock) === 25, 'Stock must update to 25');
  });

  await test('SLR-03', 'Seller CRUD: Safe product deletion', 'Seller & Inventory', async () => {
    await sql`DELETE FROM products WHERE id = ${testProdId}`;
    const check = await sql`SELECT id FROM products WHERE id = ${testProdId}`;
    assert(check.length === 0, 'Product must be deleted from catalog');
  });

  // Clean test user and order
  await sql`DELETE FROM order_items WHERE order_id = ${createdOrderId}`;
  await sql`DELETE FROM orders WHERE id = ${createdOrderId}`;
  await sql`DELETE FROM users WHERE id = ${testUserId}`;

  // --- Summary ---
  console.log('\n===============================================================');
  console.log('                     TEST EXECUTION SUMMARY                    ');
  console.log('===============================================================');

  const passed = testResults.filter((r) => r.status === 'PASS').length;
  const failed = testResults.filter((r) => r.status === 'FAIL').length;
  const total = testResults.length;
  const totalDuration = testResults.reduce((acc, r) => acc + r.durationMs, 0);

  console.log(`Total Tests Run:  ${total}`);
  console.log(`Passed:           ${passed} (${Math.round((passed / total) * 100)}%)`);
  console.log(`Failed:           ${failed}`);
  console.log(`Total Duration:   ${totalDuration}ms`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Test Suite error:', err);
  process.exit(1);
});
