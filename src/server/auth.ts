/**
 * Shared JWT auth helper for API routes.
 * Usage:
 *   const userId = requireAuth(request);
 *   if (userId instanceof Response) return userId;
 */
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret-do-not-use-in-prod';

export interface AuthUser {
  id: number;
  email: string;
  role: 'customer' | 'seller';
}

export function requireAuth(request: Request): number | Response {
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as { sub: number };
    return payload.sub;
  } catch {
    return Response.json({ message: 'Invalid or expired token' }, { status: 401 });
  }
}

export function requireAuthUser(request: Request): AuthUser | Response {
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as {
      sub: number;
      email: string;
      role: 'customer' | 'seller';
    };
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return Response.json({ message: 'Invalid or expired token' }, { status: 401 });
  }
}
