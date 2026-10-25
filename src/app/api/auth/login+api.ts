/**
 * POST /api/auth/login
 * Body: { email: string; password: string }
 * Returns: { token: string; user: { id, name, email, role } }
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '../../../db/index';

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret-do-not-use-in-prod';

export async function POST(request: Request): Promise<Response> {
  try {
    const { email, password } = await request.json() as { email?: string; password?: string };

    if (!email || !password) {
      return Response.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, name, email, role, password_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    const user = rows[0] as { id: number; name: string; email: string; role: string; password_hash: string } | undefined;

    if (!user) {
      return Response.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return Response.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash: _ph, ...publicUser } = user;

    return Response.json({ token, user: publicUser });
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
