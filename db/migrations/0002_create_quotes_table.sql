-- Migration: Create quotation_requests table
CREATE TABLE IF NOT EXISTS "quotation_requests" (
  "id" SERIAL PRIMARY KEY,
  "productId" INTEGER NOT NULL REFERENCES products("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "user"("id") ON DELETE SET NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "customerPhone" TEXT,
  "companyName" TEXT,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'contacted', 'completed', 'cancelled'
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_product ON quotation_requests("productId");
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotation_requests("status");
CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotation_requests("createdAt");
