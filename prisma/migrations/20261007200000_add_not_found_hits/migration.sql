-- CreateTable
CREATE TABLE "not_found_hits" (
    "id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "path" TEXT NOT NULL,
    "referrerPath" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "not_found_hits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "not_found_hits_day_idx" ON "not_found_hits"("day");

-- CreateIndex
CREATE UNIQUE INDEX "not_found_hits_day_path_referrerPath_key" ON "not_found_hits"("day", "path", "referrerPath");
