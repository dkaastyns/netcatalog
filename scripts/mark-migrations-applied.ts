/**
 * mark-migrations-applied.ts
 * Marks existing migrations as applied in the _migrations tracking table.
 * Run once to bootstrap tracking on an existing database.
 */
import "dotenv/config";
import { Pool } from "pg";

const EXISTING_MIGRATIONS = [
    "0000_init_supabase.sql",
    "0001_add_product_specs.sql",
    "0002_create_quotes_table.sql",
    "0003_add_product_image.sql",
    "0004_cleanup_account_table.sql",
    "0005_multi_item_quotes.sql",
    "0006_rename_quotes_to_orders.sql",
    "0007_restore_account_tokens.sql",
    "0008_add_customer_address_to_orders.sql",
    "0009_add_notification_columns_to_orders.sql",
];

async function markApplied() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
        await pool.query("SELECT NOW()");
        console.log("✅ Connected");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                filename TEXT UNIQUE NOT NULL,
                applied_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        for (const f of EXISTING_MIGRATIONS) {
            await pool.query(
                `INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING`,
                [f]
            );
            console.log(`✅ Marked: ${f}`);
        }

        console.log("\n🎉 Migration tracking bootstrapped!");
    } finally {
        await pool.end();
    }
}

markApplied().catch(e => { console.error(e); process.exit(1); });
