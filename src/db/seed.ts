/**
 * Seed script to populate D&G Shop products across all 6 categories.
 * Run with:
 *   npx tsx --env-file=.env.local src/db/seed.ts
 */
import { sql } from './index';

async function seed() {
  console.log('Seeding D&G Shop Rwamagana inventory...');

  await sql`
    INSERT INTO products (name, description, price, image_url, category, stock)
    VALUES
      -- Clothes
      ('Traditional Kitenge Shirt', 'Handcrafted vibrant African wax print casual shirt, tailored in Rwamagana.', 18000, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600', 'Clothes', 25),
      ('Cotton Denim Jeans', 'Durable, stylish blue denim pants suitable for all-day comfort.', 22000, 'https://images.unsplash.com/photo-1542272604-780c96856592?w=600', 'Clothes', 30),
      
      -- Shoes
      ('Classic Leather Loafers', 'Genuine brown leather slip-on shoes for formal and office wear.', 35000, 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600', 'Shoes', 15),
      ('Urban Sport Sneakers', 'Lightweight breathable sneakers for casual sports and daily walking.', 28000, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', 'Shoes', 20),
      
      -- Bags
      ('Rwandan Agaseke Basket Bag', 'Traditional handwoven sisal basket bag crafted by Eastern Province artisans.', 15000, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600', 'Bags', 12),
      ('Waterproof Laptop Backpack', 'Padded multi-compartment travel backpack for 15.6 inch laptops.', 26000, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', 'Bags', 18),
      
      -- Household Equipment
      ('Stainless Steel Electric Kettle', 'Rapid-boil 1.8-liter automatic shut-off kettle for home and office.', 16000, 'https://images.unsplash.com/photo-1594213114663-ddf4f24cf242?w=600', 'Household Equipment', 22),
      ('Solar Emergency LED Lamp', 'Rechargeable dual-mode solar lantern ideal for night lighting and power outages.', 14000, 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600', 'Household Equipment', 40),
      
      -- Jewellery
      ('Handmade Brass Cow Horn Earrings', 'Eco-friendly polished brass and upcycled Ankole cow horn earrings.', 8000, 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600', 'Jewellery', 35),
      ('Beaded African Choker Necklace', 'Intricate geometric glass bead necklace reflecting Rwandan cultural motifs.', 12000, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600', 'Jewellery', 28),
      
      -- Cosmetics
      ('Pure Raw Shea Butter Cream (250g)', 'Unrefined natural moisturizing balm for hair and skin hydration.', 7500, 'https://images.unsplash.com/photo-1608248597359-2f22295fa944?w=600', 'Cosmetics', 50),
      ('Organic Virgin Coconut Body Oil', 'Cold-pressed glowing skin and scalp nourishing oil with vitamin E.', 9000, 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600', 'Cosmetics', 45)
    ON CONFLICT DO NOTHING
  `;

  console.log('✅ Inventory seeded successfully.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
