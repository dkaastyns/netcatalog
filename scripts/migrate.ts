import "dotenv/config";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log("🔌 Connecting to Supabase...");

  try {
    // Test connection
    await pool.query("SELECT NOW()");
    console.log("✅ Connected to database");

    // Create migration tracking table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Get already applied migrations
    const { rows: applied } = await pool.query<{ filename: string }>(
      `SELECT filename FROM _migrations ORDER BY filename`
    );
    const appliedSet = new Set(applied.map((r) => r.filename));

    // Read migration files
    const migrationsDir = path.join(process.cwd(), "db", "migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("⚠️  No migration files found");
      return;
    }

    let skipped = 0;
    let applied_count = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`⏭️  Skipping (already applied): ${file}`);
        skipped++;
        continue;
      }

      console.log(`\n📄 Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

      await pool.query("BEGIN");
      try {
        await pool.query(sql);
        await pool.query(
          `INSERT INTO _migrations (filename) VALUES ($1)`,
          [file]
        );
        await pool.query("COMMIT");
        console.log(`✅ ${file} applied successfully`);
        applied_count++;
      } catch (err) {
        await pool.query("ROLLBACK");
        throw err;
      }
    }

    console.log(`\n🎉 Migration complete! Applied: ${applied_count}, Skipped: ${skipped}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
