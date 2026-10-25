/**
 * GET    /api/cart         — get current user's cart
 * POST   /api/cart         — add/increment item  { productId, quantity }
 * PATCH  /api/cart         — set exact item quantity { id, quantity }
 * DELETE /api/cart?id=X    — remove item by cart_item id (or all if id is omitted)
 */
import { sql } from '../../db/index';
import { requireAuth } from '../../server/auth';

export async function GET(request: Request): Promise<Response> {
  const userId = requireAuth(request);
  if (userId instanceof Response) return userId;

  try {
    const rows = await sql`
      SELECT ci.id, ci.quantity,
             p.id AS product_id, p.name, p.price, p.image_url, p.category, p.stock
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.user_id = ${userId}
      ORDER BY ci.created_at ASC
    `;
    return Response.json(rows);
  } catch (err) {
    console.error('[GET /api/cart]', err);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  const userId = requireAuth(request);
  if (userId instanceof Response) return userId;

  try {
    const { productId, quantity = 1 } = await request.json() as {
      productId?: number;
      quantity?: number;
    };

    if (!productId) {
      return Response.json({ message: 'productId is required' }, { status: 400 });
    }

    await sql`
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES (${userId}, ${productId}, ${quantity})
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
    `;

    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/cart]', err);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<Response> {
  const userId = requireAuth(request);
  if (userId instanceof Response) return userId;

  try {
    const { id, quantity } = await request.json() as { id?: number; quantity?: number };

    if (!id || quantity === undefined) {
      return Response.json({ message: 'Cart item id and quantity are required' }, { status: 400 });
    }

    if (quantity <= 0) {
      await sql`DELETE FROM cart_items WHERE id = ${id} AND user_id = ${userId}`;
    } else {
      await sql`
        UPDATE cart_items
        SET quantity = ${quantity}
        WHERE id = ${id} AND user_id = ${userId}
      `;
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/cart]', err);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const userId = requireAuth(request);
  if (userId instanceof Response) return userId;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (id) {
      await sql`
        DELETE FROM cart_items
        WHERE id = ${Number(id)} AND user_id = ${userId}
      `;
    } else {
      await sql`DELETE FROM cart_items WHERE user_id = ${userId}`;
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/cart]', err);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
