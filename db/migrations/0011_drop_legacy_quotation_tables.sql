-- Migration: Drop legacy quotation tables
-- These tables were renamed to orders/order_items in migration 0006
-- but the original tables still exist in the database.
-- Safe to drop since all application code uses orders & order_items.

DROP TABLE IF EXISTS quotation_items;
DROP TABLE IF EXISTS quotation_requests;
