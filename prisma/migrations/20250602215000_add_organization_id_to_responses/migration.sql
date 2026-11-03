-- Add organizationId column to user_question_responses table
-- This allows tracking responses by user+organization context

-- First, add the organizationId column (nullable)
ALTER TABLE "user_question_responses" ADD COLUMN "organizationId" TEXT;

-- Find and drop the existing unique constraint (name may vary)
-- Query constraint name first
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT conname INTO constraint_name 
    FROM pg_constraint 
    WHERE conrelid = 'user_question_responses'::regclass 
    AND contype = 'u'
    AND array_length(conkey, 1) = 2;
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "user_question_responses" DROP CONSTRAINT "' || constraint_name || '"';
    END IF;
END $$;

-- Add new unique constraint that includes organizationId
-- This allows same user to have different responses per organization
ALTER TABLE "user_question_responses" ADD CONSTRAINT "user_question_responses_userId_questionId_organizationId_key" UNIQUE ("userId", "questionId", "organizationId");