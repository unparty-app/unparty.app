-- AlterEnum
ALTER TYPE "MilestoneType" ADD VALUE 'ALL_UNPPPS_VISITED';

-- CreateTable
CREATE TABLE "user_unppp_visits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unpppId" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_unppp_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "email" TEXT,
    "firstName" TEXT,
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connect_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_unppp_visits_userId_idx" ON "user_unppp_visits"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_unppp_visits_userId_unpppId_key" ON "user_unppp_visits"("userId", "unpppId");

-- CreateIndex
CREATE INDEX "connect_messages_userId_idx" ON "connect_messages"("userId");

