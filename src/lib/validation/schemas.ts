/**
 * Zod Validation Schemas for Question System
 * 
 * These schemas mirror the TypeScript types in src/types/questions.ts
 * and provide runtime validation when enabled.
 * 
 * Usage:
 * - Local JSON files: TypeScript-only validation (no runtime overhead)
 * - API uploads: Full Zod validation (data integrity guaranteed)
 * - Admin interfaces: Detailed validation errors for user feedback
 * 
 * Enable runtime validation:
 * Set ENABLE_QUESTION_VALIDATION=true in environment variables
 */

import { z } from 'zod';

/**
 * Question type enum schema
 */
export const QuestionTypeSchema = z.enum([
  'text',
  'multipleChoice',
  'ranking',
  'scale'
]);

/**
 * Question model enum schema
 */
export const QuestionModelSchema = z.enum([
  'about',
  'build',
  'connect',
  'unparty'
]);

/**
 * Question audience enum schema
 */
export const QuestionAudienceSchema = z.enum(['published', 'private']);

/**
 * Scale label schema
 */
export const ScaleLabelSchema = z.object({
  value: z.number(),
  label: z.string().min(1)
});

/**
 * Base question schema with comprehensive validation rules
 */
export const QuestionSchema = z
  .object({
    id: z.string().min(1, 'Question ID is required'),
    text: z.string().min(1, 'Question text is required'),
    type: QuestionTypeSchema,
    model: z.string().min(1, 'Model field is required for categorization'),
    
    // Optional fields
    choices: z.array(z.string().min(1)).optional(),
    scaleMin: z.number().optional(),
    scaleMax: z.number().optional(),
    scaleStep: z.number().positive().optional(),
    scalePrefix: z.string().optional(),
    scaleSuffix: z.string().optional(),
    scaleLabels: z.array(ScaleLabelSchema).optional(),
    audience: QuestionAudienceSchema.optional(),
    order: z.number().int().nonnegative().optional()
  })
  .refine(
    (data) => {
      // Validate scale questions have required numeric fields
      if (data.type === 'scale') {
        return (
          typeof data.scaleMin === 'number' &&
          typeof data.scaleMax === 'number' &&
          data.scaleMax > data.scaleMin
        );
      }
      return true;
    },
    {
      message: 'Scale questions must have valid scaleMin and scaleMax where scaleMax > scaleMin',
      path: ['scaleMin', 'scaleMax']
    }
  )
  .refine(
    (data) => {
      // Validate choice-based questions have choices array
      if (data.type === 'multipleChoice' || data.type === 'ranking') {
        return data.choices && data.choices.length > 0;
      }
      return true;
    },
    {
      message: 'Multiple choice and ranking questions must have at least one choice',
      path: ['choices']
    }
  )
  .refine(
    (data) => {
      // Validate scale step is reasonable
      if (data.type === 'scale' && data.scaleStep) {
        const range = (data.scaleMax ?? 0) - (data.scaleMin ?? 0);
        return data.scaleStep <= range;
      }
      return true;
    },
    {
      message: 'Scale step must be less than or equal to the scale range',
      path: ['scaleStep']
    }
  );

/**
 * Question category schema
 */
export const QuestionCategorySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  step: z.string().min(1),
  audience: QuestionAudienceSchema,
  questions: z.array(QuestionSchema).min(1, 'Category must have at least one question')
});

/**
 * Questions data root schema
 * Validates entire foundersquestions.json structure
 */
export const QuestionsDataSchema = z.object({
  categories: z.array(QuestionCategorySchema).min(1, 'Must have at least one category')
});

/**
 * Question response data schema
 * Validates user-submitted answers
 */
export const QuestionResponseDataSchema = z.union([
  z.string(),           // text questions
  z.array(z.string()),  // ranking questions
  z.number()            // scale questions
]);

/**
 * Question response request schema
 * Validates API request body for submitting answers
 */
export const QuestionResponseRequestSchema = z.object({
  questionId: z.string().min(1),
  responseData: QuestionResponseDataSchema,
  organizationId: z.string().optional()
});

/**
 * Schema for admin question upload
 * Stricter validation for user-uploaded content
 * Uses base object instead of extending ZodEffects
 */
const BaseQuestionObjectSchema = z.object({
  id: z.string().min(1, 'Question ID is required'),
  text: z.string().min(1, 'Question text is required'),
  type: QuestionTypeSchema,
  model: QuestionModelSchema, // Require strict model enum
  choices: z.array(z.string().min(1)).optional(),
  scaleMin: z.number().optional(),
  scaleMax: z.number().optional(),
  scaleStep: z.number().positive().optional(),
  scalePrefix: z.string().optional(),
  scaleSuffix: z.string().optional(),
  scaleLabels: z.array(ScaleLabelSchema).optional(),
  audience: QuestionAudienceSchema.optional(),
  order: z.number().int().nonnegative().optional()
});

export const QuestionUploadSchema = BaseQuestionObjectSchema.refine(
  (data) => {
    // Validate scale questions have required numeric fields
    if (data.type === 'scale') {
      return (
        typeof data.scaleMin === 'number' &&
        typeof data.scaleMax === 'number' &&
        data.scaleMax > data.scaleMin
      );
    }
    return true;
  },
  {
    message: 'Scale questions must have valid scaleMin and scaleMax',
    path: ['scaleMin']
  }
).refine(
  (data) => {
    // Validate choice-based questions have choices array
    if (data.type === 'multipleChoice' || data.type === 'ranking') {
      return data.choices && data.choices.length > 0;
    }
    return true;
  },
  {
    message: 'Multiple choice and ranking questions must have choices',
    path: ['choices']
  }
);

/**
 * Schema for updating existing questions
 * Makes all fields optional except ID
 */
export const QuestionUpdateSchema = BaseQuestionObjectSchema.partial().required({
  id: true
});

/**
 * Batch upload schema for multiple questions
 */
export const BatchQuestionUploadSchema = z.object({
  categoryId: z.string().min(1),
  questions: z.array(QuestionUploadSchema).min(1).max(50, 'Maximum 50 questions per batch')
});

/**
 * Export types inferred from Zod schemas
 * These should match the types in src/types/questions.ts
 */
export type QuestionSchemaType = z.infer<typeof QuestionSchema>;
export type QuestionCategorySchemaType = z.infer<typeof QuestionCategorySchema>;
export type QuestionsDataSchemaType = z.infer<typeof QuestionsDataSchema>;
export type QuestionResponseRequestSchemaType = z.infer<typeof QuestionResponseRequestSchema>;
