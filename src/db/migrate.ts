/**
 * Database migration script — run once with:
 *   npx tsx src/db/migrate.ts
 *
 * Creates all tables if they don't already exist.
 */
import { sql } from './index';

async function migrate() {
  console.log('Running migrations…');

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'customer',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      price       NUMERIC(10,2) NOT NULL,
      image_url   TEXT,
      category    TEXT,
      stock       INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cart_items (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity    INTEGER NOT NULL DEFAULT 1,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status      TEXT NOT NULL DEFAULT 'pending',
      total       NUMERIC(10,2) NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id          SERIAL PRIMARY KEY,
      order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id  INTEGER NOT NULL REFERENCES products(id),
      quantity    INTEGER NOT NULL,
      unit_price  NUMERIC(10,2) NOT NULL
    )
  `;

  // Seed a sample product so the app has something to display
  await sql`
    INSERT INTO products (name, description, price, image_url, category, stock)
    VALUES
      ('Classic White Shirt', 'Premium cotton dress shirt', 129.99, NULL, 'Shirts', 50),
      ('Black Slim Chinos',   'Slim-fit cotton chinos',    89.99,  NULL, 'Pants',  30),
      ('Leather Belt',        'Full-grain leather belt',   49.99,  NULL, 'Accessories', 100)
    ON CONFLICT DO NOTHING
  `;

  console.log('✅ Migrations complete.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
