-- CreateEnum (if not exists — already live on production via db:push)
DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable books — add columns pushed directly without a migration
ALTER TABLE "books"
  ADD COLUMN IF NOT EXISTS "sku" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "shippingAddress" JSONB,
  ADD COLUMN IF NOT EXISTS "stripePaymentId" TEXT;
