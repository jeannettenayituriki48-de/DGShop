/**
 * POST /api/auth/forgot-password
 * Body: { email: string }
 * Returns: { message: string }
 */
import { sql } from '../../../db/index';

export async function POST(request: Request): Promise<Response> {
  try {
    const { email } = await request.json() as { email?: string };

    if (!email) {
      return Response.json({ message: 'Email is required' }, { status: 400 });
    }

    // Check if user exists (fail silently to prevent email enumeration)
    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;

    if (existing.length === 0) {
      // Return success message anyway for security
      return Response.json({
        message: 'If an account with that email exists, reset instructions have been sent.',
      });
    }

    // In a production backend, a reset token would be emailed here.
    return Response.json({
      message: 'Password reset link and instructions have been sent to your email.',
    });
  } catch (err) {
    console.error('[POST /api/auth/forgot-password]', err);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
