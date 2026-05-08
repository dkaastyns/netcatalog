-- ============================================================
-- Netcatalog — Initial Supabase Migration
-- Product Catalog & Inventory Management System
-- ============================================================

-- 1. Users Table (Integrated with Better Auth)
CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "image" TEXT,
  "role" TEXT DEFAULT 'user' NOT NULL, -- 'admin' or 'user'
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Sessions Table (Better Auth)
CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMP NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);

-- 3. Accounts Table (Better Auth)
CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP,
  "refreshTokenExpiresAt" TIMESTAMP,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. Verification Table (Better Auth)
CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 5. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 6. Products Table
DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS products (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "price" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "status" product_status DEFAULT 'draft',
  "categoryId" INTEGER REFERENCES categories ("id") ON DELETE SET NULL,
  "createdBy" TEXT REFERENCES "user" ("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 7. Inventory Movements Table (Source of truth for stock)
DO $$ BEGIN
  CREATE TYPE movement_type AS ENUM ('in', 'out', 'opname');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS inventory_movements (
  "id" SERIAL PRIMARY KEY,
  "productId" INTEGER NOT NULL REFERENCES products ("id") ON DELETE CASCADE,
  "quantity" INTEGER NOT NULL, -- Positive for 'in', Negative for 'out'
  "type" movement_type NOT NULL,
  "notes" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user" ("id"),
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products("categoryId");
CREATE INDEX IF NOT EXISTS idx_products_status ON products("status");
CREATE INDEX IF NOT EXISTS idx_products_slug ON products("slug");
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_movements("productId");
CREATE INDEX IF NOT EXISTS idx_inventory_created ON inventory_movements("createdAt");
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories("slug");
CREATE INDEX IF NOT EXISTS idx_session_token ON "session"("token");
CREATE INDEX IF NOT EXISTS idx_session_userId ON "session"("userId");
