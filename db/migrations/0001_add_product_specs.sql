-- Migration: Add technical specifications to products
ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "formFactor" TEXT,
ADD COLUMN IF NOT EXISTS "connectivity" TEXT,
ADD COLUMN IF NOT EXISTS "management" TEXT,
ADD COLUMN IF NOT EXISTS "warranty" TEXT;
