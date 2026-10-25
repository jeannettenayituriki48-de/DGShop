/**
 * PUT /api/auth/profile
 * Authenticated user: update own name and/or password
 * Body: { name?: string; currentPassword?: string; newPassword?: string }
 */
import bcrypt from 'bcryptjs';
import { sql } from '../../../db/index';
import { requireAuthUser } from '../../../server/auth';

export async function PUT(request: Request): Promise<Response> {
  const user = requireAuthUser(request);
  if (user instanceof Response) return user;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    const { name, currentPassword, newPassword } = body;

    if (!name && !newPassword) {
      return Response.json({ message: 'Nothing to update' }, { status: 400 });
    }

    // Validate name
    if (name !== undefined && name.trim().length < 2) {
      return Response.json({ message: 'Name must be at least 2 characters' }, { status: 400 });
    }

    // If changing password, verify current password first
    if (newPassword !== undefined) {
      if (!currentPassword) {
        return Response.json({ message: 'Current password is required to set a new one' }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return Response.json({ message: 'New password must be at least 8 characters' }, { status: 400 });
      }

      const rows = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`;
      if (rows.length === 0) {
        return Response.json({ message: 'User not found' }, { status: 404 });
      }
      const hash = rows[0].password_hash as string;
      const valid = await bcrypt.compare(currentPassword, hash);
      if (!valid) {
        return Response.json({ message: 'Current password is incorrect' }, { status: 401 });
      }
    }

    // Apply updates
    if (name && newPassword) {
      const newHash = await bcrypt.hash(newPassword, 12);
      await sql`UPDATE users SET name = ${name.trim()}, password_hash = ${newHash} WHERE id = ${user.id}`;
    } else if (name) {
      await sql`UPDATE users SET name = ${name.trim()} WHERE id = ${user.id}`;
    } else if (newPassword) {
      const newHash = await bcrypt.hash(newPassword, 12);
      await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${user.id}`;
    }

    const updated = await sql`SELECT id, name, email, role FROM users WHERE id = ${user.id}`;
    return Response.json({ user: updated[0] });
  } catch (err) {
    console.error('[PUT /api/auth/profile]', err);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
