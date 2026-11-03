-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('WAITING', 'READY', 'INVITED', 'DONE');

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "shortNo" INTEGER NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readyAt" TIMESTAMP(3),
    "invitedAt" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_state" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nowServingMin" INTEGER NOT NULL DEFAULT 1,
    "nowServingMax" INTEGER NOT NULL DEFAULT 1,
    "message" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tickets_token_key" ON "tickets"("token");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_shortNo_key" ON "tickets"("shortNo");

-- AlterTable - Add unique constraint to books.sku (this was part of the db:push)
ALTER TABLE "books" ADD CONSTRAINT "books_sku_key" UNIQUE ("sku");