-- Migration: Remove redundant account columns
ALTER TABLE "account" 
DROP COLUMN IF EXISTS "accessToken",
DROP COLUMN IF EXISTS "refreshToken",
DROP COLUMN IF EXISTS "idToken",
DROP COLUMN IF EXISTS "accessTokenExpiresAt",
DROP COLUMN IF EXISTS "refreshTokenExpiresAt",
DROP COLUMN IF EXISTS "scope";
