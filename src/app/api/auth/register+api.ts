/**
 * POST /api/auth/register
 * Body: { name: string; email: string; password: string; role?: 'customer' | 'seller' }
 * Returns: { token: string; user: { id, name, email, role } }
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '../../../db/index';
import { jsonResponse, handleCorsOptions } from '../../../server/cors';

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret-do-not-use-in-prod';

export async function OPTIONS(): Promise<Response> {
  return handleCorsOptions();
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { name, email, password, role } = (await request.json().catch(() => ({}))) as {
      name?: string;
      email?: string;
      password?: string;
      role?: 'customer' | 'seller';
    };

    if (!name || !email || !password) {
      return jsonResponse({ message: 'Name, email and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return jsonResponse({ message: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const assignedRole = role === 'seller' ? 'seller' : 'customer';

    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (existing.length > 0) {
      return jsonResponse({ message: 'Email already in use' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const rows = await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (${name}, ${email}, ${password_hash}, ${assignedRole})
      RETURNING id, name, email, role
    `;
    const user = rows[0] as { id: number; name: string; email: string; role: string };

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return jsonResponse({ token, user }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/auth/register]', err);
    return jsonResponse({ message: 'Internal server error' }, { status: 500 });
  }
}
