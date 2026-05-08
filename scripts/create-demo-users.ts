import "dotenv/config";
import { auth } from "../lib/auth";
import { Pool } from "pg";

const demoUsers = [
  { name: "Super Admin", email: "super@netcatalog.com", password: "password123", role: "admin" },
  { name: "Inventory Manager", email: "manager@netcatalog.com", password: "password123", role: "admin" },
  { name: "Staff Admin", email: "staff@netcatalog.com", password: "password123", role: "admin" },
  { name: "Reviewer Admin", email: "reviewer@netcatalog.com", password: "password123", role: "admin" },
];

async function createDemoUsers() {
  console.log("🚀 Creating demo admin users...");

  for (const user of demoUsers) {
    try {
      // Better Auth handles the account and user table entries
      const result = await auth.api.signUpEmail({
        body: {
          name: user.name,
          email: user.email,
          password: user.password,
        }
      });

      if (result) {
        // Manually update role to admin because signUpEmail defaults to 'user'
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        await pool.query('UPDATE "user" SET role = $1 WHERE email = $2', [user.role, user.email]);
        await pool.end();
        console.log(`✅ Created: ${user.email} (Admin)`);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message?.includes("already exists")) {
        console.log(`ℹ️ Skipped: ${user.email} (Already exists)`);
      } else {
        console.error(`❌ Failed: ${user.email}`, err.message);
      }
    }
  }

  console.log("\n✨ Done! You can now login with password 'password123'");
  process.exit(0);
}

createDemoUsers();
