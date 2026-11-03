-- CreateTable
CREATE TABLE "builds" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "card" JSONB NOT NULL,
    "token" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "email" TEXT,
    "version" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "builds_url_key" ON "builds"("url");

-- CreateIndex
CREATE UNIQUE INDEX "builds_number_key" ON "builds"("number");
