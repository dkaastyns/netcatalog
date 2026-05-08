-- Migration: Add image column to products
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "image" TEXT;
