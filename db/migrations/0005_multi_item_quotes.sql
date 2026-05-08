-- Migration: Support multi-item quotations
CREATE TABLE IF NOT EXISTS "quotation_items" (
  "id" SERIAL PRIMARY KEY,
  "quotationId" INTEGER NOT NULL REFERENCES "quotation_requests" ("id") ON DELETE CASCADE,
  "productId" INTEGER NOT NULL REFERENCES "products" ("id") ON DELETE CASCADE,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(10, 2) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- We might want to keep the single productId in quotation_requests for backward compatibility or 
-- just migrate existing data if any. For now, we'll allow multiple items in the new table.
