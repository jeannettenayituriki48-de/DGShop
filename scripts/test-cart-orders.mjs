const BASE_URL = 'http://localhost:8081/api';

async function testCartAndOrders() {
  console.log('Testing Cart and Orders API...');

  // 1. Register or login a test customer
  const email = `cart_test_${Date.now()}@example.com`;
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Cart Customer',
      email,
      password: 'Password123!',
      role: 'customer',
    }),
  });
  const regData = await regRes.json();
  console.log('Register status:', regRes.status, 'User:', regData.user?.email);
  const token = regData.token;

  // 2. Fetch a product to add to cart
  const prodRes = await fetch(`${BASE_URL}/products`);
  const products = await prodRes.json();
  const testProduct = products[0];
  console.log('Test product:', testProduct.id, testProduct.name, testProduct.price);

  // 3. Add to cart
  const addRes = await fetch(`${BASE_URL}/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      productId: testProduct.id,
      quantity: 2,
    }),
  });
  console.log('Add to cart status:', addRes.status, await addRes.text());

  // 4. Get cart
  const getCartRes = await fetch(`${BASE_URL}/cart`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const cartItems = await getCartRes.json();
  console.log('Get cart items:', cartItems);

  // 5. Place order
  const orderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      address: 'Rwamagana Sector 1',
      phone: '0788123456',
      paymentMethod: 'MTN Mobile Money',
    }),
  });
  console.log('Place order status:', orderRes.status, await orderRes.text());

  // 6. Get orders
  const getOrdersRes = await fetch(`${BASE_URL}/orders`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  console.log('Get orders status:', getOrdersRes.status, await getOrdersRes.text());
}

testCartAndOrders().catch(console.error);
