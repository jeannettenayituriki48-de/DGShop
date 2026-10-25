/**
 * GET   /api/orders           — list user's orders (customer: own orders; seller: all store orders)
 * POST  /api/orders           — place order from current cart { address, phone, paymentMethod }
 * PATCH /api/orders           — update order status (seller only) { id, status }
 */
import { sql } from '../../db/index';
import { requireAuthUser } from '../../server/auth';

export async function GET(request: Request): Promise<Response> {
  const user = requireAuthUser(request);
  if (user instanceof Response) return user;

  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('id');
    const isSeller = user.role === 'seller';

    if (orderId) {
      const orders = await sql`
        SELECT o.id, o.status, o.total, o.address, o.phone, o.payment_method, o.created_at,
          u.name AS customer_name, u.email AS customer_email,
          COALESCE(
            json_agg(json_build_object(
              'product_id', oi.product_id,
              'name', p.name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'image_url', p.image_url,
              'category', p.category
            )) FILTER (WHERE oi.product_id IS NOT NULL),
            '[]'
          ) AS items
        FROM orders o
        JOIN users u             ON u.id = o.user_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN products p     ON p.id = oi.product_id
        WHERE o.id = ${Number(orderId)}
          ${isSeller ? sql`` : sql`AND o.user_id = ${user.id}`}
        GROUP BY o.id, u.name, u.email
      `;
      if (orders.length === 0) {
        return Response.json({ message: 'Order not found' }, { status: 404 });
      }
      return Response.json(orders[0]);
    }

    const orders = await sql`
      SELECT o.id, o.status, o.total, o.address, o.phone, o.payment_method, o.created_at,
        u.name AS customer_name, u.email AS customer_email,
        COALESCE(
          json_agg(json_build_object(
            'product_id', oi.product_id,
            'name', p.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'image_url', p.image_url,
            'category', p.category
          )) FILTER (WHERE oi.product_id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      JOIN users u             ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p     ON p.id = oi.product_id
      WHERE (${isSeller ? sql`TRUE` : sql`o.user_id = ${user.id}`})
      GROUP BY o.id, u.name, u.email
      ORDER BY o.created_at DESC
    `;
    return Response.json(orders);
  } catch (err) {
    console.error('[GET /api/orders]', err);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  const user = requireAuthUser(request);
  if (user instanceof Response) return user;
  const userId = user.id;

  try {
    const {
      address = 'Rwamagana Town',
      phone = '',
      paymentMethod = 'Cash on Delivery',
    } = (await request.json().catch(() => ({}))) as {
      address?: string;
      phone?: string;
      paymentMethod?: string;
    };

    // Fetch cart items
    const cartItems = (await sql`
      SELECT ci.product_id, ci.quantity, p.price, p.stock
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.user_id = ${userId}
    `) as { product_id: number; quantity: number; price: string; stock: number }[];

    if (cartItems.length === 0) {
      return Response.json({ message: 'Cart is empty' }, { status: 400 });
    }

    const total = cartItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    // Create order with delivery and payment details
    const orderRows = await sql`
      INSERT INTO orders (user_id, total, address, phone, payment_method)
      VALUES (${userId}, ${total}, ${address}, ${phone}, ${paymentMethod})
      RETURNING id, status, total, address, phone, payment_method, created_at
    `;
    const newOrder = orderRows[0] as { id: number };

    // Insert order items & reduce inventory
    for (const item of cartItems) {
      await sql`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (${newOrder.id}, ${item.product_id}, ${item.quantity}, ${item.price})
      `;
      await sql`
        UPDATE products
        SET stock = GREATEST(0, stock - ${item.quantity})
        WHERE id = ${item.product_id}
      `;
    }

    // Clear cart
    await sql`DELETE FROM cart_items WHERE user_id = ${userId}`;

    return Response.json({ orderId: newOrder.id, total }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/orders]', err);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<Response> {
  const user = requireAuthUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'seller') {
    return Response.json({ message: 'Forbidden: Seller role required' }, { status: 403 });
  }

  try {
    const { id, status } = (await request.json().catch(() => ({}))) as {
      id?: number;
      status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    };

    if (!id || !status) {
      return Response.json({ message: 'Order ID and status are required' }, { status: 400 });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return Response.json({ message: 'Invalid status value' }, { status: 400 });
    }

    // If changing to cancelled, restore stock
    if (status === 'cancelled') {
      const items = (await sql`
        SELECT product_id, quantity FROM order_items WHERE order_id = ${Number(id)}
      `) as { product_id: number; quantity: number }[];

      for (const item of items) {
        await sql`
          UPDATE products
          SET stock = stock + ${item.quantity}
          WHERE id = ${item.product_id}
        `;
      }
    }

    const updated = await sql`
      UPDATE orders
      SET status = ${status}
      WHERE id = ${Number(id)}
      RETURNING id, status, total, address, phone, payment_method, created_at
    `;

    if (updated.length === 0) {
      return Response.json({ message: 'Order not found' }, { status: 404 });
    }

    return Response.json(updated[0]);
  } catch (err) {
    console.error('[PATCH /api/orders]', err);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
