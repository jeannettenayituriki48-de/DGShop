/**
 * POST /api/auth/login
 * Body: { email: string; password: string }
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
    const { email, password } = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return jsonResponse({ message: 'Email and password are required' }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, name, email, role, password_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    const user = rows[0] as
      | { id: number; name: string; email: string; role: string; password_hash: string }
      | undefined;

    if (!user) {
      return jsonResponse({ message: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return jsonResponse({ message: 'Invalid email or password' }, { status: 401 });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash: _ph, ...publicUser } = user;

    return jsonResponse({ token, user: publicUser });
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return jsonResponse({ message: 'Internal server error' }, { status: 500 });
  }
}
