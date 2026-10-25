/**
 * POST /api/auth/forgot-password
 * Body: { email: string }
 * Returns: { message: string }
 */
import { sql } from '../../../db/index';
import { jsonResponse, handleCorsOptions } from '../../../server/cors';

export async function OPTIONS(): Promise<Response> {
  return handleCorsOptions();
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { email } = (await request.json().catch(() => ({}))) as { email?: string };

    if (!email) {
      return jsonResponse({ message: 'Email is required' }, { status: 400 });
    }

    // Check if user exists (fail silently to prevent email enumeration)
    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;

    if (existing.length === 0) {
      // Return success message anyway for security
      return jsonResponse({
        message: 'If an account with that email exists, reset instructions have been sent.',
      });
    }

    // In a production backend, a reset token would be emailed here.
    return jsonResponse({
      message: 'Password reset link and instructions have been sent to your email.',
    });
  } catch (err) {
    console.error('[POST /api/auth/forgot-password]', err);
    return jsonResponse({ message: 'Internal server error' }, { status: 500 });
  }
}
