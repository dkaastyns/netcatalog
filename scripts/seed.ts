import "dotenv/config";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log("🌱 Seeding database...");

  try {
    // 1. Seed categories
    console.log("\n📁 Seeding categories...");
    const categories = [
      { name: "Routers", slug: "routers", description: "Core & Edge routing devices" },
      { name: "Switches", slug: "switches", description: "High-density switching solutions" },
      { name: "Security", slug: "security", description: "Firewalls & VPN appliances" },
      { name: "Wireless", slug: "wireless", description: "Enterprise Access Points" },
      { name: "Cables & Accessories", slug: "cables-accessories", description: "Network cabling & accessories" },
    ];

    for (const cat of categories) {
      await pool.query(
        `INSERT INTO categories ("name", "slug", "description")
         VALUES ($1, $2, $3)
         ON CONFLICT ("slug") DO NOTHING`,
        [cat.name, cat.slug, cat.description]
      );
    }
    console.log("✅ Categories seeded");

    // 2. Fetch category IDs
    const catRows = await pool.query(`SELECT "id", "slug" FROM categories`);
    const catMap = new Map(catRows.rows.map((r: { id: number; slug: string }) => [r.slug, r.id]));

    // 3. Create a demo admin user
    console.log("\n👤 Seeding demo user...");
    const userId = uuidv4();
    await pool.query(
      `INSERT INTO "user" ("id", "name", "email", "emailVerified", "role", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT ("email") DO NOTHING`,
      [userId, "Admin Demo", "admin@netcatalog.com", true, "admin"]
    );
    console.log("✅ Demo user seeded");

    // Get the actual user ID (might already exist)
    const userRow = await pool.query(`SELECT "id" FROM "user" WHERE "email" = 'admin@netcatalog.com'`);
    const actualUserId = userRow.rows[0]?.id || userId;

    // 4. Seed products
    console.log("\n📦 Seeding products...");
    const products = [
      { name: "NexusCore 9000-X", slug: "nexuscore-9000x", description: "Enterprise core router with 100Gbps throughput", price: 12499.00, status: "published", categorySlug: "routers" },
      { name: "EtherSwitch Pro 48P", slug: "etherswitch-pro-48p", description: "48-port PoE+ managed switch with 740W budget", price: 3250.00, status: "published", categorySlug: "switches" },
      { name: "SecuriGate X5", slug: "securigate-x5", description: "Next-gen firewall with 5Gbps threat protection", price: 8900.00, status: "published", categorySlug: "security" },
      { name: "AirWave AP-360", slug: "airwave-ap-360", description: "Wi-Fi 6E tri-band access point", price: 450.00, status: "published", categorySlug: "wireless" },
      { name: "FlexRoute 2200", slug: "flexroute-2200", description: "Branch office router with SD-WAN capability", price: 1850.00, status: "draft", categorySlug: "routers" },
      { name: "MicroSwitch 8G", slug: "microswitch-8g", description: "8-port unmanaged gigabit switch", price: 89.00, status: "published", categorySlug: "switches" },
    ];

    for (const prod of products) {
      await pool.query(
        `INSERT INTO products ("name", "slug", "description", "price", "status", "categoryId", "createdBy")
         VALUES ($1, $2, $3, $4, $5::product_status, $6, $7)
         ON CONFLICT ("slug") DO NOTHING`,
        [prod.name, prod.slug, prod.description, prod.price, prod.status, catMap.get(prod.categorySlug) || null, actualUserId]
      );
    }
    console.log("✅ Products seeded");

    // 5. Seed inventory movements
    console.log("\n📊 Seeding inventory movements...");
    const prodRows = await pool.query(`SELECT "id", "slug" FROM products`);
    const prodMap = new Map(prodRows.rows.map((r: { id: number; slug: string }) => [r.slug, r.id]));

    const movements = [
      { productSlug: "nexuscore-9000x", quantity: 15, type: "in", notes: "Initial stock" },
      { productSlug: "nexuscore-9000x", quantity: -3, type: "out", notes: "Sold 3 units" },
      { productSlug: "etherswitch-pro-48p", quantity: 50, type: "in", notes: "Initial stock" },
      { productSlug: "etherswitch-pro-48p", quantity: -8, type: "out", notes: "Bulk order" },
      { productSlug: "securigate-x5", quantity: 20, type: "in", notes: "Initial stock" },
      { productSlug: "airwave-ap-360", quantity: 100, type: "in", notes: "Initial stock" },
      { productSlug: "airwave-ap-360", quantity: -25, type: "out", notes: "Enterprise deployment" },
      { productSlug: "flexroute-2200", quantity: 30, type: "in", notes: "Initial stock" },
      { productSlug: "microswitch-8g", quantity: 200, type: "in", notes: "Initial stock" },
      { productSlug: "microswitch-8g", quantity: -40, type: "out", notes: "Retail sales" },
    ];

    for (const mov of movements) {
      const pid = prodMap.get(mov.productSlug);
      if (!pid) continue;
      await pool.query(
        `INSERT INTO inventory_movements ("productId", "quantity", "type", "notes", "userId")
         VALUES ($1, $2, $3::movement_type, $4, $5)`,
        [pid, mov.quantity, mov.type, mov.notes, actualUserId]
      );
    }
    console.log("✅ Inventory movements seeded");

    console.log("\n🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
