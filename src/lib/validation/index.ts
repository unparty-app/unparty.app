/**
 * Validation Layer Entry Point
 * 
 * Exports all validation functions and schemas for use across the application.
 * 
 * Usage Examples:
 * 
 * // TypeScript-only mode (default)
 * import { validateQuestion } from '@/lib/validation';
 * const question = validateQuestion(data); // No runtime overhead
 * 
 * // Strict mode (for admin uploads)
 * import { validateQuestionUpload } from '@/lib/validation';
 * const question = validateQuestionUpload(userData); // Always validates
 * 
 * // Soft validation (for monitoring)
 * import { logValidationIssues, QuestionSchema } from '@/lib/validation';
 * logValidationIssues(data, QuestionSchema, 'loading foundersquestions.json');
 */

// Export validation functions
export {
  validateQuestion,
  validateQuestionsData,
  validateQuestionResponse,
  validateQuestionUpload,
  validateQuestionUpdate,
  validateBatchQuestionUpload,
  softValidate,
  logValidationIssues,
  assertQuestionComplete,
  QuestionValidationError,
  ENABLE_RUNTIME_VALIDATION
} from './validators';

// Export Zod schemas
export {
  QuestionSchema,
  QuestionTypeSchema,
  QuestionModelSchema,
  QuestionAudienceSchema,
  ScaleLabelSchema,
  QuestionCategorySchema,
  QuestionsDataSchema,
  QuestionResponseDataSchema,
  QuestionResponseRequestSchema,
  QuestionUploadSchema,
  QuestionUpdateSchema,
  BatchQuestionUploadSchema,
  type QuestionSchemaType,
  type QuestionCategorySchemaType,
  type QuestionsDataSchemaType,
  type QuestionResponseRequestSchemaType
} from './schemas';

// Re-export types for convenience
export type {
  Question,
  QuestionType,
  QuestionModel,
  QuestionAudience,
  ScaleLabel,
  QuestionWithResponse,
  QuestionCategory,
  QuestionsData,
  QuestionResponseData,
  QuestionResponseRequest,
  QuestionsApiResponse,
  ValidationError
} from '@/types/questions';
