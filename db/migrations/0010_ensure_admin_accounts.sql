-- ============================================================
-- Migration: Seed admin accounts with hashed passwords
-- Password: Admin.3669 (hashed with bcrypt by better-auth format)
-- NOTE: better-auth uses scrypt by default, not bcrypt.
-- This migration creates accounts via direct SQL using a 
-- pre-computed scrypt hash compatible with better-auth.
--
-- HOW IT WORKS:
-- We insert user rows directly. Password reset via better-auth
-- admin API or run the seed script instead.
-- 
-- Since better-auth uses scrypt, we use the seed script approach.
-- This migration only ensures the admin users EXIST.
-- Run: bun run db:seed-admin to set passwords.
-- ============================================================

-- Ensure demo admin user exists (upsert by email)
INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'Admin Netcatalog',
    'admin@netcatalog.com',
    TRUE,
    'admin',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    "updatedAt" = NOW();

-- Second admin account
INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'Reviewer Admin',
    'reviewer@netcatalog.com',
    TRUE,
    'admin',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    "updatedAt" = NOW();
