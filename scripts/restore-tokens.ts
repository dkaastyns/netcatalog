import "dotenv/config";
import { Pool } from "pg";

async function restore() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    console.log("🔌 Connecting to Supabase...");

    try {
        await pool.query("SELECT NOW()");
        console.log("✅ Connected to database");

        console.log("📄 Running restore SQL...");
        const sql = `
      ALTER TABLE "account" 
      ADD COLUMN IF NOT EXISTS "accessToken" TEXT,
      ADD COLUMN IF NOT EXISTS "refreshToken" TEXT,
      ADD COLUMN IF NOT EXISTS "idToken" TEXT,
      ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "scope" TEXT;
    `;
        await pool.query(sql);
        console.log("✅ Account token columns restored successfully");

    } catch (error) {
        console.error("❌ Restore failed:", error);
    } finally {
        await pool.end();
    }
}

restore();
