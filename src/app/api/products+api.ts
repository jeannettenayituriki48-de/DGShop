/**
 * GET /api/products
 * Query params:
 *   - id: number (single product detail)
 *   - search: string (search by product name or description)
 *   - category: string (filter by category)
 *   - minPrice: number
 *   - maxPrice: number
 */
import { sql } from '../../db/index';
import { requireAuthUser } from '../../server/auth';

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const search = url.searchParams.get('search')?.trim();
    const category = url.searchParams.get('category')?.trim();
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');

    if (id) {
      const rows = await sql`
        SELECT id, name, description, price, image_url, category, stock, created_at
        FROM products
        WHERE id = ${Number(id)}
        LIMIT 1
      `;
      if (rows.length === 0) {
        return Response.json({ message: 'Product not found' }, { status: 404 });
      }
      return Response.json(rows[0]);
    }

    // Dynamic filtering query
    const rows = await sql`
      SELECT id, name, description, price, image_url, category, stock, created_at
      FROM products
      WHERE (
        ${search ? sql`name ILIKE ${'%' + search + '%'} OR description ILIKE ${'%' + search + '%'}` : sql`TRUE`}
      )
      AND (
        ${category && category !== 'All' ? sql`category = ${category}` : sql`TRUE`}
      )
      AND (
        ${minPrice ? sql`price >= ${Number(minPrice)}` : sql`TRUE`}
      )
      AND (
        ${maxPrice ? sql`price <= ${Number(maxPrice)}` : sql`TRUE`}
      )
      ORDER BY id ASC
    `;

    return Response.json(rows);
  } catch (err) {
    console.error('[GET /api/products]', err);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  const user = requireAuthUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'seller') {
    return Response.json({ message: 'Forbidden: Seller role required' }, { status: 403 });
  }

  try {
    const { name, description = '', price, image_url = null, category = 'Clothes', stock = 0 } =
      (await request.json().catch(() => ({}))) as {
        name?: string;
        description?: string;
        price?: number;
        image_url?: string | null;
        category?: string;
        stock?: number;
      };

    if (!name || name.trim() === '' || price === undefined || price < 0) {
      return Response.json(
        { message: 'Valid product name and price are required' },
        { status: 400 }
      );
    }

    const rows = await sql`
      INSERT INTO products (name, description, price, image_url, category, stock)
      VALUES (
        ${name.trim()},
        ${description?.trim() || ''},
        ${Number(price)},
        ${image_url?.trim() || null},
        ${category || 'Clothes'},
        ${Math.max(0, Number(stock) || 0)}
      )
      RETURNING id, name, description, price, image_url, category, stock, created_at
    `;

    return Response.json(rows[0], { status: 201 });
  } catch (err) {
    console.error('[POST /api/products]', err);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request): Promise<Response> {
  const user = requireAuthUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'seller') {
    return Response.json({ message: 'Forbidden: Seller role required' }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      id?: number;
      name?: string;
      description?: string;
      price?: number;
      image_url?: string | null;
      category?: string;
      stock?: number;
    };

    const id = body.id;
    if (!id) {
      return Response.json({ message: 'Product ID is required' }, { status: 400 });
    }

    // Check existing
    const existing = await sql`SELECT id FROM products WHERE id = ${Number(id)} LIMIT 1`;
    if (existing.length === 0) {
      return Response.json({ message: 'Product not found' }, { status: 404 });
    }

    const rows = await sql`
      UPDATE products
      SET
        name = COALESCE(${body.name?.trim() ?? null}, name),
        description = COALESCE(${body.description?.trim() ?? null}, description),
        price = CASE WHEN ${body.price !== undefined} THEN ${Number(body.price)} ELSE price END,
        image_url = CASE WHEN ${body.image_url !== undefined} THEN ${body.image_url?.trim() || null} ELSE image_url END,
        category = COALESCE(${body.category ?? null}, category),
        stock = CASE WHEN ${body.stock !== undefined} THEN ${Math.max(0, Number(body.stock))} ELSE stock END
      WHERE id = ${Number(id)}
      RETURNING id, name, description, price, image_url, category, stock, created_at
    `;

    return Response.json(rows[0]);
  } catch (err) {
    console.error('[PUT /api/products]', err);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const user = requireAuthUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'seller') {
    return Response.json({ message: 'Forbidden: Seller role required' }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    let id = url.searchParams.get('id');

    if (!id) {
      const body = (await request.json().catch(() => ({}))) as { id?: number };
      if (body.id) id = String(body.id);
    }

    if (!id) {
      return Response.json({ message: 'Product ID is required' }, { status: 400 });
    }

    const productId = Number(id);

    // Check if referenced in order_items
    const orderRef = await sql`
      SELECT COUNT(*)::int AS count FROM order_items WHERE product_id = ${productId}
    `;
    const count = Number(orderRef[0]?.count || 0);

    if (count > 0) {
      // Safely zero-out inventory instead of breaking foreign keys
      await sql`UPDATE products SET stock = 0 WHERE id = ${productId}`;
      return Response.json({
        success: true,
        archived: true,
        message: 'Product is linked to customer orders. Inventory stock was set to 0 (out of stock).',
      });
    }

    // Clean from carts and delete product
    await sql`DELETE FROM cart_items WHERE product_id = ${productId}`;
    await sql`DELETE FROM products WHERE id = ${productId}`;

    return Response.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('[DELETE /api/products]', err);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
