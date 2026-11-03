/**
 * Unified Question Type System
 * 
 * Single source of truth for question types across the application.
 * Replaces duplicate interfaces in:
 * - src/app/components/editorial/FoundersQuestionEmbed.tsx
 * - src/app/components/BusinessWorksheet.tsx
 * 
 * This type system is designed to scale from local JSON files to 
 * runtime validation when questions become user-uploaded content.
 * 
 * Migration Path:
 * 1. Current: TypeScript-only validation (foundersquestions.json is local)
 * 2. Future: Zod runtime validation (when admin upload is enabled)
 * 
 * To enable runtime validation:
 * Set ENABLE_QUESTION_VALIDATION=true in environment variables
 */

/**
 * Question types supported by the application
 */
export type QuestionType = 'text' | 'multipleChoice' | 'ranking' | 'scale';

/**
 * Question models that categorize questions by domain
 * - about: Personal/founder questions
 * - build: Product/technical questions
 * - connect: Network/community questions
 * - unparty: Platform-specific questions
 */
export type QuestionModel = 'about' | 'build' | 'connect' | 'unparty';

/**
 * Audience visibility for questions
 */
export type QuestionAudience = 'published' | 'private';

/**
 * Scale label for providing context at specific values
 */
export interface ScaleLabel {
  value: number;
  label: string;
}

/**
 * Base Question interface
 * 
 * All question types extend this base interface with required fields:
 * - id: Unique identifier (e.g., "core_q1")
 * - text: Question prompt displayed to users
 * - type: Determines input UI (text area, multiple choice, etc.)
 * - model: Categorizes question domain (REQUIRED for data organization)
 * 
 * Optional fields are type-specific:
 * - choices: Required for multipleChoice and ranking
 * - scale*: Required for scale questions
 */
export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  model: string; // REQUIRED: Categorizes question (about, build, connect, unparty)
  
  // Multiple choice / ranking fields
  choices?: string[];
  
  // Scale question fields
  scaleMin?: number;
  scaleMax?: number;
  scaleStep?: number;
  scalePrefix?: string;
  scaleSuffix?: string;
  scaleLabels?: ScaleLabel[];
  
  // Metadata
  audience?: QuestionAudience;
  order?: number;
}

/**
 * Question with user response attached
 * Used when fetching questions with saved answers
 */
export interface QuestionWithResponse extends Question {
  userResponse?: {
    responseData: string | string[] | number;
    completedAt: string;
    organizationId?: string | null;
  };
}

/**
 * Category grouping for questions
 * Matches structure in foundersquestions.json
 */
export interface QuestionCategory {
  id: string;
  label: string;
  step: string;
  audience: QuestionAudience;
  questions: Question[];
}

/**
 * Root structure for questions data file
 * Matches foundersquestions.json schema
 */
export interface QuestionsData {
  categories: QuestionCategory[];
}

/**
 * Question response data submitted by users
 * Type varies based on question type:
 * - text: string
 * - multipleChoice: string (single choice)
 * - ranking: string[] (ordered array)
 * - scale: number (numeric value)
 */
export type QuestionResponseData = string | string[] | number;

/**
 * API request body for submitting question responses
 */
export interface QuestionResponseRequest {
  questionId: string;
  responseData: QuestionResponseData;
  organizationId?: string;
}

/**
 * API response for question queries
 */
export interface QuestionsApiResponse {
  questions: QuestionWithResponse[];
  category?: QuestionCategory;
  totalQuestions?: number;
}

/**
 * Validation error structure
 */
export interface ValidationError {
  path: string;
  message: string;
}

/**
 * Type guards for question types
 */
export function isTextQuestion(question: Question): boolean {
  return question.type === 'text';
}

export function isMultipleChoiceQuestion(question: Question): boolean {
  return question.type === 'multipleChoice';
}

export function isRankingQuestion(question: Question): boolean {
  return question.type === 'ranking';
}

export function isScaleQuestion(question: Question): boolean {
  return question.type === 'scale';
}

/**
 * Type assertions for narrowing question types
 */
export function assertTextQuestion(question: Question): asserts question is Question & { type: 'text' } {
  if (!isTextQuestion(question)) {
    throw new Error(`Expected text question, got ${question.type}`);
  }
}

export function assertScaleQuestion(
  question: Question
): asserts question is Question & {
  type: 'scale';
  scaleMin: number;
  scaleMax: number;
} {
  if (!isScaleQuestion(question)) {
    throw new Error(`Expected scale question, got ${question.type}`);
  }
  if (typeof question.scaleMin !== 'number' || typeof question.scaleMax !== 'number') {
    throw new Error('Scale question missing required scaleMin or scaleMax');
  }
}

export function assertChoiceQuestion(
  question: Question
): asserts question is Question & {
  type: 'multipleChoice' | 'ranking';
  choices: string[];
} {
  if (!isMultipleChoiceQuestion(question) && !isRankingQuestion(question)) {
    throw new Error(`Expected choice question, got ${question.type}`);
  }
  if (!question.choices || question.choices.length === 0) {
    throw new Error('Choice question missing required choices array');
  }
}

/**
 * Backward compatibility exports
 * Allows gradual migration from old interface names
 */
export type BusinessQuestion = Question;
export type FounderQuestion = Question;
export type EditorialQuestion = Question;
