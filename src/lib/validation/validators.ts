/**
 * Question Validation Functions
 * 
 * Provides validation with feature flag support for gradual Zod adoption.
 * 
 * Current Mode (Default): TypeScript-only validation
 * - No runtime overhead
 * - Compile-time type safety
 * - Suitable for local JSON files
 * 
 * Future Mode (When Enabled): Full Zod validation
 * - Runtime data validation
 * - Detailed error messages
 * - Required for user uploads
 * 
 * Enable runtime validation:
 * Set ENABLE_QUESTION_VALIDATION=true in environment variables
 */

import { z } from 'zod';
import {
  QuestionSchema,
  QuestionsDataSchema,
  QuestionResponseRequestSchema,
  QuestionUploadSchema,
  QuestionUpdateSchema,
  BatchQuestionUploadSchema
} from './schemas';
import type {
  Question,
  QuestionsData,
  QuestionResponseRequest
} from '@/types/questions';

/**
 * Feature flag for runtime validation
 * Default: false (TypeScript-only mode)
 * Set ENABLE_QUESTION_VALIDATION=true to enable Zod validation
 */
export const ENABLE_RUNTIME_VALIDATION = 
  process.env.ENABLE_QUESTION_VALIDATION === 'true' ||
  process.env.NEXT_PUBLIC_ENABLE_QUESTION_VALIDATION === 'true';

/**
 * Custom validation error class
 */
export class QuestionValidationError extends Error {
  constructor(
    message: string,
    public errors?: Array<{ path: string; message: string }>,
    public code: string = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'QuestionValidationError';
  }

  /**
   * Convert Zod error to structured format
   */
  static fromZodError(error: z.ZodError): QuestionValidationError {
    const errors = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message
    }));

    return new QuestionValidationError(
      'Question validation failed',
      errors,
      'VALIDATION_ERROR'
    );
  }

  /**
   * Format errors for API response
   */
  toJSON() {
    return {
      error: this.message,
      code: this.code,
      details: this.errors
    };
  }
}

/**
 * Validate single question
 * 
 * @param data - Question data to validate
 * @param strict - Force Zod validation regardless of feature flag
 * @returns Validated Question object
 * @throws QuestionValidationError if validation fails
 */
export function validateQuestion(
  data: unknown,
  strict: boolean = false
): Question {
  if (!ENABLE_RUNTIME_VALIDATION && !strict) {
    // TypeScript-only mode: trust the type system
    return data as Question;
  }

  // Zod validation mode
  const result = QuestionSchema.safeParse(data);

  if (!result.success) {
    throw QuestionValidationError.fromZodError(result.error);
  }

  return result.data;
}

/**
 * Validate entire questions data structure
 * Used when loading foundersquestions.json or validating uploads
 * 
 * @param data - Questions data to validate
 * @param strict - Force Zod validation regardless of feature flag
 * @returns Validated QuestionsData object
 * @throws QuestionValidationError if validation fails
 */
export function validateQuestionsData(
  data: unknown,
  strict: boolean = false
): QuestionsData {
  if (!ENABLE_RUNTIME_VALIDATION && !strict) {
    return data as QuestionsData;
  }

  const result = QuestionsDataSchema.safeParse(data);

  if (!result.success) {
    throw QuestionValidationError.fromZodError(result.error);
  }

  return result.data;
}

/**
 * Validate question response
 * Used when users submit answers
 * 
 * @param data - Response data to validate
 * @param strict - Force Zod validation regardless of feature flag
 * @returns Validated QuestionResponseRequest object
 * @throws QuestionValidationError if validation fails
 */
export function validateQuestionResponse(
  data: unknown,
  strict: boolean = false
): QuestionResponseRequest {
  if (!ENABLE_RUNTIME_VALIDATION && !strict) {
    return data as QuestionResponseRequest;
  }

  const result = QuestionResponseRequestSchema.safeParse(data);

  if (!result.success) {
    throw QuestionValidationError.fromZodError(result.error);
  }

  return result.data;
}

/**
 * Validate question for admin upload
 * Always uses strict validation for user-uploaded content
 * 
 * @param data - Question data from admin upload
 * @returns Validated Question object
 * @throws QuestionValidationError if validation fails
 */
export function validateQuestionUpload(data: unknown): Question {
  const result = QuestionUploadSchema.safeParse(data);

  if (!result.success) {
    throw QuestionValidationError.fromZodError(result.error);
  }

  return result.data;
}

/**
 * Validate question update
 * Always uses strict validation for updates
 * 
 * @param data - Partial question data for update
 * @returns Validated partial Question object
 * @throws QuestionValidationError if validation fails
 */
export function validateQuestionUpdate(data: unknown): Partial<Question> & { id: string } {
  const result = QuestionUpdateSchema.safeParse(data);

  if (!result.success) {
    throw QuestionValidationError.fromZodError(result.error);
  }

  return result.data;
}

/**
 * Validate batch question upload
 * Always uses strict validation
 * 
 * @param data - Batch upload data
 * @returns Validated batch upload object
 * @throws QuestionValidationError if validation fails
 */
export function validateBatchQuestionUpload(data: unknown) {
  const result = BatchQuestionUploadSchema.safeParse(data);

  if (!result.success) {
    throw QuestionValidationError.fromZodError(result.error);
  }

  return result.data;
}

/**
 * Soft validation - returns errors without throwing
 * Useful for logging validation issues without breaking functionality
 * 
 * @param data - Data to validate
 * @param schema - Zod schema to validate against
 * @returns Validation result with success flag and errors
 */
export function softValidate<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: boolean; errors?: Array<{ path: string; message: string }> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true };
  }

  return {
    success: false,
    errors: result.error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message
    }))
  };
}

/**
 * Log validation issues without throwing
 * Useful for monitoring data quality in production
 * 
 * @param data - Data to validate
 * @param schema - Zod schema to validate against
 * @param context - Context for logging (e.g., "foundersquestions.json load")
 */
export function logValidationIssues<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context: string
): void {
  const validation = softValidate(data, schema);

  if (!validation.success) {
    console.warn(`[Validation Issues] ${context}:`, validation.errors);
  }
}

/**
 * Assert question has required fields for its type
 * Runtime type guard with detailed error messages
 * 
 * @param question - Question to validate
 * @throws QuestionValidationError if question is invalid
 */
export function assertQuestionComplete(question: Question): void {
  // Check type-specific required fields
  switch (question.type) {
    case 'multipleChoice':
    case 'ranking':
      if (!question.choices || question.choices.length === 0) {
        throw new QuestionValidationError(
          `${question.type} question must have choices array`,
          [{ path: 'choices', message: 'Choices array is required and must not be empty' }],
          'MISSING_CHOICES'
        );
      }
      break;

    case 'scale':
      if (typeof question.scaleMin !== 'number' || typeof question.scaleMax !== 'number') {
        throw new QuestionValidationError(
          'Scale question must have scaleMin and scaleMax',
          [
            { path: 'scaleMin', message: 'scaleMin is required for scale questions' },
            { path: 'scaleMax', message: 'scaleMax is required for scale questions' }
          ],
          'MISSING_SCALE_FIELDS'
        );
      }
      if (question.scaleMax <= question.scaleMin) {
        throw new QuestionValidationError(
          'Scale question scaleMax must be greater than scaleMin',
          [{ path: 'scaleMax', message: 'scaleMax must be greater than scaleMin' }],
          'INVALID_SCALE_RANGE'
        );
      }
      break;

    case 'text':
      // No special validation for text questions
      break;

    default:
      throw new QuestionValidationError(
        `Unknown question type: ${question.type}`,
        [{ path: 'type', message: 'Question type is not recognized' }],
        'UNKNOWN_TYPE'
      );
  }
}
