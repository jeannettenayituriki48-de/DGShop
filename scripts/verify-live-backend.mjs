/**
 * scripts/verify-live-backend.mjs
 * Live End-to-End Verification of Backend APIs:
 * 1. GET /api/products (Homescreen products retrieval)
 * 2. POST /api/auth/login (Seller login & token retrieval)
 * 3. POST /api/auth/register (New user registration)
 * 4. POST /api/products (Seller product creation)
 * 5. PUT /api/products (Seller product update)
 * 6. DELETE /api/products (Seller product deletion)
 */

const BASE_URL = 'http://localhost:8081/api';

async function runVerification() {
  console.log('========================================================');
  console.log('🧪 LIVE BACKEND API VERIFICATION FOR DGSHOP');
  console.log('========================================================\n');

  let passed = 0;
  let total = 0;

  async function check(name, testFn) {
    total++;
    process.stdout.write(`[Test ${total}] ${name}... `);
    try {
      await testFn();
      console.log('✅ PASS');
      passed++;
    } catch (err) {
      console.log('❌ FAIL');
      console.error('   Error:', err.message);
    }
  }

  let sellerToken = '';
  let createdProductId = null;

  // 1. GET /api/products (Homescreen)
  await check('1. GET /api/products (Homescreen products retrieval)', async () => {
    const res = await fetch(`${BASE_URL}/products`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Expected an array of products');
    if (data.length === 0) throw new Error('Expected at least one product in database');
    console.log(`(Retrieved ${data.length} products, sample: "${data[0].name}" - ${data[0].price} RWF)`);
  });

  // 2. POST /api/auth/login (Seller login)
  await check('2. POST /api/auth/login (Seller authentication)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'diane.seller@dgshop.rw',
        password: 'DGShop2024!',
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`HTTP ${res.status}: ${errBody}`);
    }
    const data = await res.json();
    if (!data.token) throw new Error('Missing token in response');
    if (data.user?.role !== 'seller') throw new Error(`Expected role 'seller', got '${data.user?.role}'`);
    sellerToken = data.token;
    console.log(`(Logged in as: ${data.user.name}, Role: ${data.user.role})`);
  });

  // 3. POST /api/auth/register (New customer registration)
  const randomEmail = `testuser_${Date.now()}@example.rw`;
  await check(`3. POST /api/auth/register (New user: ${randomEmail})`, async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Customer',
        email: randomEmail,
        password: 'TestPassword123!',
        role: 'customer',
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`HTTP ${res.status}: ${errBody}`);
    }
    const data = await res.json();
    if (!data.token || !data.user) throw new Error('Invalid register response structure');
    console.log(`(Registered ID: ${data.user.id}, Role: ${data.user.role})`);
  });

  // 4. POST /api/products (Seller add product)
  await check('4. POST /api/products (Seller creates product)', async () => {
    if (!sellerToken) throw new Error('No seller token available');
    const newProduct = {
      name: `Rwamagana Special Coffee ${Date.now()}`,
      description: 'Bourbon Arabica from Muhazi lake shores',
      price: 13500,
      stock: 25,
      category: 'Household Equipment',
      image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600',
    };
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify(newProduct),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`HTTP ${res.status}: ${errBody}`);
    }
    const data = await res.json();
    if (!data.id) throw new Error('Created product has no ID');
    createdProductId = data.id;
    console.log(`(Created product ID: ${createdProductId}, Price: ${data.price} RWF)`);
  });

  // 5. PUT /api/products (Seller edit product)
  await check('5. PUT /api/products (Seller edits product price and stock)', async () => {
    if (!createdProductId) throw new Error('No product ID to edit');
    const updatePayload = {
      id: createdProductId,
      name: 'Rwamagana Special Coffee (Premium Roast)',
      price: 15000,
      stock: 40,
    };
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify(updatePayload),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`HTTP ${res.status}: ${errBody}`);
    }
    const data = await res.json();
    if (Number(data.price) !== 15000 || Number(data.stock) !== 40) {
      throw new Error(`Product update mismatch: price=${data.price}, stock=${data.stock}`);
    }
    console.log(`(Updated: new price = ${data.price} RWF, new stock = ${data.stock})`);
  });

  // 6. DELETE /api/products (Seller cleans up product)
  await check('6. DELETE /api/products (Seller removes test product)', async () => {
    if (!createdProductId) throw new Error('No product ID to delete');
    const res = await fetch(`${BASE_URL}/products?id=${createdProductId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${sellerToken}`,
      },
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`HTTP ${res.status}: ${errBody}`);
    }
    const data = await res.json();
    if (!data.success) throw new Error('Delete returned success: false');
    console.log(`(Cleaned up product ID: ${createdProductId})`);
  });

  console.log('\n========================================================');
  console.log(`🎉 SUMMARY: ${passed} / ${total} Live Backend API Tests PASSED!`);
  console.log('========================================================\n');
}

runVerification().catch(console.error);
