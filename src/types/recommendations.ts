/**
 * Recommendation System Types
 * 
 * Defines the type-safe structure for AI-driven recommendations
 * across the platform, supporting multiple content types and
 * extensible recommendation categories.
 */

export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type StepCategory = 
  | 'research' 
  | 'planning' 
  | 'focus' 
  | 'competitive-analysis' 
  | 'scaling'
  | 'leadership' 
  | 'technical' 
  | 'marketing' 
  | 'operations' 
  | 'adaptability'
  | 'financial-planning' 
  | 'brand-development' 
  | 'risk-management'
  | 'revenue-optimization' 
  | 'sustainability' 
  | 'brand-building'
  | 'purpose-alignment' 
  | 'social-impact' 
  | 'foundation';

export type ResourceType = 'course' | 'tool' | 'template' | 'guide' | 'community';

/**
 * Base recommendation interface with common properties
 */
interface BaseRecommendation {
  id: string;
  priority: RecommendationPriority;
  reason: string;
  confidence?: number; // 0-1 confidence score from AI analysis
  metadata?: {
    basedOnQuestions: string[]; // Question IDs that influenced this recommendation
    analysisSource: 'profile' | 'behavior' | 'hybrid';
    generatedAt: string; // ISO timestamp
    userId: string;
  };
}

/**
 * Step-based recommendations for actionable tasks
 */
export interface StepRecommendation extends BaseRecommendation {
  type: 'step';
  category: StepCategory;
  suggestedSteps: string[]; // Step identifiers or template names
  estimatedTimeMinutes?: number;
  dependencies?: string[]; // Other recommendations that should be completed first
}

/**
 * Article recommendations for educational content
 */
export interface ArticleRecommendation extends BaseRecommendation {
  type: 'article';
  articleSlugs: string[];
  readingTimeMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

/**
 * External resource recommendations
 */
export interface ExternalRecommendation extends BaseRecommendation {
  type: 'external';
  resourceUrl: string;
  resourceType: ResourceType;
  title: string;
  description: string;
  provider?: string;
  cost?: {
    type: 'free' | 'paid' | 'freemium';
    amount?: number;
    currency?: string;
  };
}

/**
 * Book recommendations from the platform's book inventory
 */
export interface BookRecommendation extends BaseRecommendation {
  type: 'book';
  bookId: string;
  relevantChapters?: string[];
  applicationContext: string; // How this book applies to their situation
}

/**
 * Community connection recommendations
 */
export interface CommunityRecommendation extends BaseRecommendation {
  type: 'community';
  communityType: 'founders' | 'technical' | 'industry-specific' | 'local';
  platform: string;
  connectionReason: string;
  memberCount?: number;
}

/**
 * Union type for all recommendation types
 */
export type Recommendation = 
  | StepRecommendation 
  | ArticleRecommendation 
  | ExternalRecommendation
  | BookRecommendation
  | CommunityRecommendation;

/**
 * API response structure for recommendations
 */
export interface RecommendationResponse {
  recommendations: Recommendation[];
  analysisMetadata: {
    responsesAnalyzed: number;
    totalStepsAvailable: number;
    recommendedItems: number;
    analysisVersion: string; // For tracking recommendation algorithm versions
    processingTimeMs: number;
  };
  userContext: {
    profileCompleteness: number; // 0-1 percentage
    primaryGoal?: string;
    experienceLevel?: 'first-time' | 'returning' | 'experienced';
  };
}

/**
 * Recommendation engine configuration
 */
export interface RecommendationConfig {
  maxRecommendations: number;
  priorityWeights: Record<RecommendationPriority, number>;
  categoryLimits?: Partial<Record<StepCategory | 'article' | 'external' | 'book' | 'community', number>>;
  diversityThreshold: number; // Ensure variety in recommendation types
  confidenceThreshold: number; // Minimum confidence score to include
}

/**
 * Recommendation tracking for analytics
 */
export interface RecommendationInteraction {
  recommendationId: string;
  userId: string;
  action: 'viewed' | 'clicked' | 'dismissed' | 'completed' | 'bookmarked';
  timestamp: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Type guards for recommendation discrimination
 */
export const isStepRecommendation = (rec: Recommendation): rec is StepRecommendation => 
  rec.type === 'step';

export const isArticleRecommendation = (rec: Recommendation): rec is ArticleRecommendation => 
  rec.type === 'article';

export const isExternalRecommendation = (rec: Recommendation): rec is ExternalRecommendation => 
  rec.type === 'external';

export const isBookRecommendation = (rec: Recommendation): rec is BookRecommendation => 
  rec.type === 'book';

export const isCommunityRecommendation = (rec: Recommendation): rec is CommunityRecommendation => 
  rec.type === 'community';

/**
 * Utility type for recommendation filters
 */
export type RecommendationFilter = {
  types?: Recommendation['type'][];
  priorities?: RecommendationPriority[];
  categories?: StepCategory[];
  minConfidence?: number;
  maxItems?: number;
};