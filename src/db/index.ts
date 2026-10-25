import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

/** Tagged-template SQL client connected to Neon via the HTTP driver. */
export const sql = neon(process.env.DATABASE_URL);
