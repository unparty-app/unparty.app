import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-stub.server';
import { prisma } from '@/lib/prisma';
import { UserQuestionResponse, Step, UserStepProgress } from '@prisma/client';
import { 
  Recommendation, 
  StepRecommendation,
  RecommendationResponse,
  StepCategory,
  RecommendationPriority
} from '@/types/recommendations';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user responses to analyze their profile
    const userResponses = await prisma.userQuestionResponse.findMany({
      where: { userId }
    });

    // Get all available steps
    const allSteps = await prisma.step.findMany({
      where: {
        OR: [
          { organizationId: null }, // Public steps
          { visibility: 'ALL_USERS' }
        ]
      },
      include: {
        userProgress: {
          where: { userId },
          take: 1
        }
      }
    });

    // Analyze user responses to determine recommendations
    const recommendations = generateStepRecommendations(userResponses, allSteps, userId);

    const response: RecommendationResponse = {
      recommendations,
      analysisMetadata: {
        responsesAnalyzed: userResponses.length,
        totalStepsAvailable: allSteps.length,
        recommendedItems: recommendations.length,
        analysisVersion: '1.0.0',
        processingTimeMs: Date.now() - startTime
      },
      userContext: {
        profileCompleteness: Math.min(userResponses.length / 10, 1), // Assume 10 core questions
        experienceLevel: userResponses.length < 3 ? 'first-time' : 
                        userResponses.length < 8 ? 'returning' : 'experienced'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error generating step recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

function generateStepRecommendations(
  userResponses: UserQuestionResponse[], 
  _allSteps: (Step & { userProgress: UserStepProgress[] })[], 
  userId: string
): Recommendation[] {
  // Group responses by category
  const responsesByCategory = userResponses.reduce((acc, response) => {
    // Skip responses without categoryId (from old data)
    if (!response.categoryId) return acc;
    
    acc[response.categoryId] = acc[response.categoryId] || [];
    acc[response.categoryId].push(response);
    return acc;
  }, {} as Record<string, UserQuestionResponse[]>);

  const recommendations: Recommendation[] = [];

  // Helper function to create step recommendations with consistent metadata
  const createStepRecommendation = (
    category: StepCategory, 
    priority: RecommendationPriority, 
    reason: string, 
    suggestedSteps: string[],
    basedOnQuestions: string[],
    estimatedTime?: number,
    confidence: number = 0.75
  ): StepRecommendation => ({
    id: `step-${category}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type: 'step',
    category,
    priority,
    reason,
    suggestedSteps,
    estimatedTimeMinutes: estimatedTime,
    confidence,
    metadata: {
      basedOnQuestions,
      analysisSource: 'profile',
      generatedAt: new Date().toISOString(),
      userId
    }
  });

  // Core profile analysis
  const coreResponses = responsesByCategory.core || [];
  
  // Find core_idea response for relationship with idea
  const ideaResponse = coreResponses.find((r: UserQuestionResponse) => r.questionId === 'core_idea');
  if (ideaResponse) {
    const ranking = ideaResponse.responseData;
    if (Array.isArray(ranking)) {
      const topChoice = ranking[0];
      
      // Recommend steps based on idea relationship
      switch (topChoice) {
        case 0: // Pain point identification
          recommendations.push(createStepRecommendation(
            'research',
            'HIGH',
            'Focus on problem validation and market research',
            ['market-research', 'customer-interviews', 'problem-validation'],
            ['core_idea'],
            120,
            0.85
          ));
          break;
        case 1: // Clear vision, execution struggle
          recommendations.push(createStepRecommendation(
            'planning',
            'HIGH',
            'Break down your vision into actionable steps',
            ['project-planning', 'milestone-setting', 'mvp-definition'],
            ['core_idea'],
            90,
            0.85
          ));
          break;
        case 2: // Exploring multiple possibilities
          recommendations.push(createStepRecommendation(
            'focus',
            'HIGH',
            'Narrow down to one viable direction',
            ['idea-prioritization', 'feasibility-analysis', 'decision-framework'],
            ['core_idea'],
            60,
            0.85
          ));
          break;
        case 3: // Driven by frustration
          recommendations.push(createStepRecommendation(
            'competitive-analysis',
            'HIGH',
            'Analyze existing solutions and find your differentiator',
            ['competitor-research', 'value-proposition', 'differentiation-strategy'],
            ['core_idea'],
            150,
            0.85
          ));
          break;
        case 4: // Has traction, focused on growth
          recommendations.push(createStepRecommendation(
            'scaling',
            'HIGH',
            'Optimize and scale your existing success',
            ['growth-metrics', 'scaling-strategy', 'operational-optimization'],
            ['core_idea'],
            180,
            0.85
          ));
          break;
      }
    }
  }

  // Role-based recommendations
  const roleResponse = coreResponses.find((r: UserQuestionResponse) => r.questionId === 'roles_responsibilities');
  if (roleResponse && typeof roleResponse.responseData === 'number') {
    const roleChoice = roleResponse.responseData;
    
    switch (roleChoice) {
      case 0: // Visionary leader
        recommendations.push(createStepRecommendation(
          'leadership',
          'MEDIUM',
          'Develop leadership and team-building skills',
          ['team-building', 'vision-communication', 'leadership-development'],
          ['roles_responsibilities'],
          75,
          0.75
        ));
        break;
      case 1: // Technical architect
        recommendations.push(createStepRecommendation(
          'technical',
          'MEDIUM',
          'Focus on technical implementation and architecture',
          ['tech-stack-selection', 'architecture-design', 'technical-planning'],
          ['roles_responsibilities'],
          75,
          0.75
        ));
        break;
      case 2: // Storyteller
        recommendations.push(createStepRecommendation(
          'marketing',
          'MEDIUM',
          'Develop marketing and brand messaging skills',
          ['brand-development', 'content-strategy', 'audience-research'],
          ['roles_responsibilities'],
          75,
          0.75
        ));
        break;
      case 3: // Venture builder
        recommendations.push(createStepRecommendation(
          'operations',
          'MEDIUM',
          'Focus on scalable systems and processes',
          ['process-documentation', 'automation-setup', 'operational-efficiency'],
          ['roles_responsibilities'],
          75,
          0.75
        ));
        break;
      case 4: // Problem solver
        recommendations.push(createStepRecommendation(
          'adaptability',
          'MEDIUM',
          'Build versatile skills across multiple domains',
          ['skill-assessment', 'cross-functional-training', 'adaptability-practices'],
          ['roles_responsibilities'],
          75,
          0.75
        ));
        break;
    }
  }

  // Budget category analysis
  const budgetResponses = responsesByCategory.budget || [];
  if (budgetResponses.length > 0) {
    recommendations.push(createStepRecommendation(
      'financial-planning',
      'HIGH',
      'Strong financial planning foundation detected',
      ['financial-projections', 'funding-strategy', 'cash-flow-management'],
      budgetResponses.map((r: UserQuestionResponse) => r.questionId),
      120,
      0.8
    ));
  }

  // Brand category analysis
  const brandResponses = responsesByCategory.brand || [];
  if (brandResponses.length > 0) {
    recommendations.push(createStepRecommendation(
      'brand-development',
      'MEDIUM',
      'Focus on brand identity and protection',
      ['brand-identity-design', 'trademark-research', 'brand-guidelines'],
      brandResponses.map((r: UserQuestionResponse) => r.questionId),
      90,
      0.7
    ));
  }

  // Risk category analysis
  const riskResponses = responsesByCategory.risk || [];
  if (riskResponses.length > 0) {
    recommendations.push(createStepRecommendation(
      'risk-management',
      'HIGH',
      'Proactive risk assessment and mitigation',
      ['legal-structure-setup', 'insurance-evaluation', 'contract-templates'],
      riskResponses.map((r: UserQuestionResponse) => r.questionId),
      150,
      0.85
    ));
  }

  // Growth mindset analysis
  const growthResponses = responsesByCategory.grow || [];
  const growthVisionResponse = growthResponses.find((r: UserQuestionResponse) => r.questionId === 'grow_vision_ranking');
  if (growthVisionResponse && Array.isArray(growthVisionResponse.responseData)) {
    const topPriority = growthVisionResponse.responseData[0];
    
    switch (topPriority) {
      case 0: // Revenue growth
        recommendations.push(createStepRecommendation(
          'revenue-optimization',
          'HIGH',
          'Focus on revenue generation and optimization',
          ['pricing-strategy', 'sales-funnel', 'revenue-streams'],
          ['grow_vision_ranking'],
          100,
          0.75
        ));
        break;
      case 1: // Work-life balance
        recommendations.push(createStepRecommendation(
          'sustainability',
          'MEDIUM',
          'Build sustainable business practices',
          ['time-management', 'delegation-strategy', 'wellness-practices'],
          ['grow_vision_ranking'],
          100,
          0.75
        ));
        break;
      case 2: // Brand recognition
        recommendations.push(createStepRecommendation(
          'brand-building',
          'MEDIUM',
          'Focus on brand awareness and recognition',
          ['pr-strategy', 'thought-leadership', 'community-building'],
          ['grow_vision_ranking'],
          100,
          0.75
        ));
        break;
      case 3: // Personal fulfillment
        recommendations.push(createStepRecommendation(
          'purpose-alignment',
          'LOW',
          'Ensure business aligns with personal values',
          ['values-assessment', 'purpose-definition', 'mission-alignment'],
          ['grow_vision_ranking'],
          100,
          0.75
        ));
        break;
      case 4: // Community impact
        recommendations.push(createStepRecommendation(
          'social-impact',
          'LOW',
          'Develop social impact and community engagement',
          ['impact-measurement', 'community-partnerships', 'social-mission'],
          ['grow_vision_ranking'],
          100,
          0.75
        ));
        break;
    }
  }

  // Ensure we have foundational steps if user is just starting
  if (userResponses.length < 5) {
    recommendations.unshift(createStepRecommendation(
      'foundation',
      'HIGH',
      'Essential first steps for new entrepreneurs',
      ['business-model-canvas', 'target-audience', 'value-proposition'],
      [],
      60,
      0.9
    ));
  }

  // Sort by priority and confidence, limit to top 8 recommendations
  const priorityOrder: Record<RecommendationPriority, number> = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
  const sortedRecommendations = recommendations
    .sort((a, b) => {
      if (a.type === 'step' && b.type === 'step') {
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        if (aPriority !== bPriority) return bPriority - aPriority;
        return (b.confidence || 0) - (a.confidence || 0);
      }
      return 0;
    })
    .slice(0, 8);

  return sortedRecommendations;
}