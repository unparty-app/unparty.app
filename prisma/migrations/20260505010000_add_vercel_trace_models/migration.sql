-- CreateTable
CREATE TABLE "vercel_traces" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "rootSpanId" TEXT NOT NULL,
    "startTime" BIGINT NOT NULL,
    "endTime" BIGINT NOT NULL,
    "totalDuration" BIGINT NOT NULL,
    "spanCount" INTEGER NOT NULL,
    "hasErrors" BOOLEAN NOT NULL DEFAULT false,
    "projectId" TEXT NOT NULL,
    "deploymentId" TEXT,
    "requestPath" TEXT,
    "requestMethod" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vercel_traces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vercel_trace_spans" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "spanId" TEXT NOT NULL,
    "parentSpanId" TEXT,
    "operationName" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "spanKind" TEXT NOT NULL,
    "startTime" BIGINT NOT NULL,
    "duration" BIGINT NOT NULL,
    "statusCode" TEXT NOT NULL,
    "statusMessage" TEXT,
    "attributes" JSONB,
    "events" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vercel_trace_spans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vercel_traces_traceId_key" ON "vercel_traces"("traceId");

-- CreateIndex
CREATE INDEX "vercel_traces_traceId_idx" ON "vercel_traces"("traceId");

-- CreateIndex
CREATE INDEX "vercel_traces_projectId_startTime_idx" ON "vercel_traces"("projectId", "startTime");

-- CreateIndex
CREATE INDEX "vercel_traces_requestPath_idx" ON "vercel_traces"("requestPath");

-- CreateIndex
CREATE INDEX "vercel_traces_hasErrors_idx" ON "vercel_traces"("hasErrors");

-- CreateIndex
CREATE INDEX "vercel_traces_createdAt_idx" ON "vercel_traces"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "vercel_trace_spans_traceId_spanId_key" ON "vercel_trace_spans"("traceId", "spanId");

-- CreateIndex
CREATE INDEX "vercel_trace_spans_traceId_idx" ON "vercel_trace_spans"("traceId");

-- CreateIndex
CREATE INDEX "vercel_trace_spans_operationName_idx" ON "vercel_trace_spans"("operationName");

-- CreateIndex
CREATE INDEX "vercel_trace_spans_startTime_idx" ON "vercel_trace_spans"("startTime");

-- CreateIndex
CREATE INDEX "vercel_trace_spans_statusCode_idx" ON "vercel_trace_spans"("statusCode");

-- AddForeignKey
ALTER TABLE "vercel_trace_spans" ADD CONSTRAINT "vercel_trace_spans_traceId_fkey" FOREIGN KEY ("traceId") REFERENCES "vercel_traces"("traceId") ON DELETE CASCADE ON UPDATE CASCADE;
