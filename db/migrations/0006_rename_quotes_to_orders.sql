-- Migration: Rename Quotations to Orders and add Payment Proof
ALTER TABLE IF EXISTS "quotation_items" RENAME TO "order_items";
ALTER TABLE IF EXISTS "quotation_requests" RENAME TO "orders";

-- Rename foreign key column
ALTER TABLE "order_items" RENAME COLUMN "quotationId" TO "orderId";

-- Add paymentProof column
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentProof" TEXT;

-- Update status options (we'll just use a check constraint if it was text, or just be aware of the new strings)
-- In the original migration it was likely TEXT. Let's check types.ts and handle it in the app logic.
-- Actually, let's make sure the status column is TEXT.
ALTER TABLE "orders" ALTER COLUMN "status" TYPE TEXT;
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending';
