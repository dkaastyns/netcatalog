-- Migration: Restore account token columns
ALTER TABLE "account" 
ADD COLUMN IF NOT EXISTS "accessToken" TEXT,
ADD COLUMN IF NOT EXISTS "refreshToken" TEXT,
ADD COLUMN IF NOT EXISTS "idToken" TEXT,
ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "scope" TEXT;
