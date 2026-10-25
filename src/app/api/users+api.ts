/**
 * GET /api/users
 * Seller-only: list all registered users with stats
 *
 * DELETE /api/users?id=<number>
 * Seller-only: delete a user account
 */
import { sql } from '../../db/index';
import { requireAuthUser } from '../../server/auth';
import { jsonResponse, handleCorsOptions } from '../../server/cors';

export async function OPTIONS(): Promise<Response> {
  return handleCorsOptions();
}

export async function GET(request: Request): Promise<Response> {
  const user = requireAuthUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'seller') {
    return jsonResponse({ message: 'Forbidden: Seller role required' }, { status: 403 });
  }

  try {
    const rows = await sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        COUNT(DISTINCT o.id)::int AS order_count
      FROM users u
      LEFT JOIN orders o ON o.customer_id = u.id
      GROUP BY u.id, u.name, u.email, u.role, u.created_at
      ORDER BY u.created_at DESC
    `;
    return jsonResponse(rows);
  } catch (err) {
    console.error('[GET /api/users]', err);
    return jsonResponse({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const user = requireAuthUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'seller') {
    return jsonResponse({ message: 'Forbidden: Seller role required' }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return jsonResponse({ message: 'User ID is required' }, { status: 400 });
    }
    const targetId = Number(id);
    if (targetId === user.id) {
      return jsonResponse({ message: 'Cannot delete your own account' }, { status: 400 });
    }

    await sql`DELETE FROM orders WHERE customer_id = ${targetId}`;
    await sql`DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE customer_id = ${targetId})`;
    await sql`DELETE FROM carts WHERE customer_id = ${targetId}`;
    await sql`DELETE FROM users WHERE id = ${targetId}`;

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('[DELETE /api/users]', err);
    return jsonResponse({ message: 'Internal server error' }, { status: 500 });
  }
}
