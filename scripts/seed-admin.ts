/**
 * seed-admin.ts
 * Creates/resets admin accounts with password Admin.3669
 * Uses better-auth's signUpEmail for proper password hashing.
 * Run with: bun run db:seed-admin
 */

import "dotenv/config";
import { auth } from "../lib/auth";
import { query } from "../lib/db";

const ADMIN_ACCOUNTS = [
    { name: "Admin Netcatalog", email: "admin@netcatalog.com", password: "Admin.3669" },
    { name: "Reviewer Admin", email: "reviewer@netcatalog.com", password: "Admin.3669" },
];

async function seedAdmins() {
    console.log("🔌 Connecting to Supabase...");

    try {
        await query("SELECT NOW()");
        console.log("✅ Connected to database\n");
    } catch (e) {
        console.error("❌ Cannot connect to database:", e);
        process.exit(1);
    }

    for (const admin of ADMIN_ACCOUNTS) {
        console.log(`\n👤 Processing: ${admin.email}`);

        // Check if user already exists
        const existing = await query<{ id: string; role: string }>(
            `SELECT id, role FROM "user" WHERE email = $1`,
            [admin.email]
        );

        if (existing.length > 0) {
            const userId = existing[0].id;
            console.log(`   ↪ User exists (id: ${userId})`);

            // Delete existing credential account entry so we can recreate with new password
            await query(
                `DELETE FROM account WHERE "userId" = $1 AND "providerId" = 'credential'`,
                [userId]
            );
            console.log(`   ↪ Cleared old credential, re-creating with new password...`);

            // Use better-auth internal to hash & create credential
            // We call signUpEmail but then override the userId
            const tempEmail = `temp_${Date.now()}@seed.local`;
            const tempResult = await auth.api.signUpEmail({
                body: { name: admin.name, email: tempEmail, password: admin.password },
            });

            if (tempResult?.user?.id) {
                // Copy the password hash from temp account to real account
                const tempId = tempResult.user.id;
                const [tempAccount] = await query<{ password: string }>(
                    `SELECT password FROM account WHERE "userId" = $1 AND "providerId" = 'credential'`,
                    [tempId]
                );

                if (tempAccount?.password) {
                    // Insert credential for original user with hashed password
                    await query(
                        `INSERT INTO account (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
                         VALUES (gen_random_uuid()::text, $1, $2, 'credential', $3, NOW(), NOW())
                         ON CONFLICT DO NOTHING`,
                        [userId, admin.email, tempAccount.password]
                    );
                    console.log(`   ✅ Password updated successfully`);
                }

                // Cleanup temp user
                await query(`DELETE FROM account WHERE "userId" = $1`, [tempId]);
                await query(`DELETE FROM "user" WHERE id = $1`, [tempId]);
            }

            // Ensure role is admin
            await query(
                `UPDATE "user" SET role = 'admin', "emailVerified" = TRUE, "updatedAt" = NOW() WHERE id = $1`,
                [userId]
            );
            console.log(`   ✅ Role = admin, email verified`);

        } else {
            console.log(`   ↪ Creating new admin account...`);

            const result = await auth.api.signUpEmail({
                body: { name: admin.name, email: admin.email, password: admin.password },
            });

            if (result?.user?.id) {
                await query(
                    `UPDATE "user" SET role = 'admin', "emailVerified" = TRUE, "updatedAt" = NOW() WHERE id = $1`,
                    [result.user.id]
                );
                console.log(`   ✅ Admin created (id: ${result.user.id})`);
            } else {
                console.warn(`   ⚠️  signUpEmail returned no user for ${admin.email}`);
            }
        }
    }

    console.log("\n🎉 Admin seed complete!");
    console.log("\n📋 Admin accounts:");
    for (const a of ADMIN_ACCOUNTS) {
        console.log(`  📧 ${a.email}  🔑 ${a.password}`);
    }

    process.exit(0);
}

seedAdmins().catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
});
