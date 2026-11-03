"use client";
import React, { useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useTheme } from '../contexts/ThemeContext';

import { User, DollarSign, TrendingUp, CheckCircle, Circle, Target, Building2, Shield } from '@/app/components/icons';

// Response data can be various types depending on question type
type UserResponseData = string | number | string[] | number[] | boolean;

interface Question {
  id: string;
  text: string;
  type: string;
  model?: string;
  choices?: string[];
  userResponse?: {
    responseData: UserResponseData;
    completedAt: string;
  } | null;
}

interface Category {
  id: string;
  label: string;
  step: string;
  audience: string;
  questionCount: number;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

interface QuestionCategory {
  category: {
    id: string;
    label: string;
    step: string;
    audience: string;
  };
  questions: Question[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

const categoryIcons = {
  core: User,
  budget: DollarSign,
  brand: Target,
  product: Building2,
  risk: Shield,
  grow: TrendingUp
};

const FounderProfiler = () => {
  const { colorValue } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('core');
  const categoriesQuery = useFetch<{
    categories: Category[];
    overallProgress: { completed: number; total: number; percentage: number };
  }>('/api/questions/categories');
  const questionsQuery = useFetch<QuestionCategory>(
    selectedCategory ? `/api/questions?category=${selectedCategory}` : null
  );
  const categories = categoriesQuery.data?.categories ?? [];
  const overallProgress = categoriesQuery.data?.overallProgress ?? { completed: 0, total: 0, percentage: 0 };
  const currentQuestions = questionsQuery.data ?? null;
  // Full-page loading only on first load; refreshes after saving keep the page up
  const loading = categoriesQuery.loading && !categoriesQuery.data;

  const checkStepCompletion = async (categoryId: string) => {
    try {
      // Find the step that corresponds to this category
      const stepId = categoryId; // Assuming step ID matches category ID
      
      const response = await fetch('/api/steps/check-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stepId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Step completion checked:', result);
      }
    } catch (error) {
      console.error('Failed to check step completion:', error);
    }
  };

  const saveResponse = async (questionId: string, responseData: UserResponseData) => {
    try {
      const question = currentQuestions?.questions.find(q => q.id === questionId);
      if (!question) return;

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          categoryId: selectedCategory,
          questionType: question.type,
          responseData
        })
      });

      if (response.ok) {
        // Refresh progress and answers
        categoriesQuery.refetch();
        questionsQuery.refetch();

        // Check if this question completion affects any step completion
        if (currentQuestions?.category) {
          await checkStepCompletion(currentQuestions.category.id);
        }
      }
    } catch (error) {
      console.error('Failed to save response:', error);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4">
      {/* Header */}
      <div className="space-y-2 text-left">
        <h1 className="font-google-sans-code upppercase text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          Founder.
        </h1>
        <p className="font-google-sans-code text-sm text-gray-600 sm:text-base dark:text-gray-400">
          Help us understand your entrepreneurial journey
        </p>
        
        {/* Overall Progress */}
        <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-gray-100 p-4 dark:border-gray-700 dark:bg-black/20">
          <div className="mb-2 flex items-center justify-between font-google-sans-code text-sm">
            <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {overallProgress.completed}/{overallProgress.total}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${overallProgress.percentage}%`,
                backgroundColor: colorValue 
              }}
            />
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {categories.map((category) => {
          const Icon = categoryIcons[category.id as keyof typeof categoryIcons] || User;
          const isSelected = selectedCategory === category.id;
          const isCompleted = category.progress.percentage === 100;
          
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`relative rounded-xl border p-3 transition-all duration-200 sm:p-4 ${
                isSelected
                  ? 'scale-105 font-bold text-black shadow-lg'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-100/50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
              style={isSelected ? { 
                backgroundColor: colorValue, 
                borderColor: colorValue,
                boxShadow: `0 4px 20px ${colorValue}20`
              } : {}}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  <Icon size={20} className="sm:size-6" />
                  {isCompleted && (
                    <CheckCircle 
                      size={12} 
                      className="absolute -right-1 -top-1 rounded-full bg-white text-green-500 dark:bg-gray-900" 
                    />
                  )}
                </div>
                <div className="text-center">
                  <div className="font-google-sans-code text-xs font-medium sm:text-sm">
                    {category.label}
                  </div>
                  <div className="font-google-sans-code text-xs opacity-70">
                    {category.progress.completed}/{category.progress.total}
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="absolute inset-x-1 bottom-1">
                <div className="h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div 
                    className="h-1 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${category.progress.percentage}%`,
                      backgroundColor: isSelected ? '#000' : colorValue
                    }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Questions Section */}
      {currentQuestions && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-google-sans-code text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
              {currentQuestions.category.label} Questions
            </h2>
            <div className="font-google-sans-code text-sm text-gray-600 dark:text-gray-400">
              {currentQuestions.progress.completed}/{currentQuestions.progress.total} complete
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6">
            {currentQuestions.questions.map((question) => {
              const existingResponse = question.userResponse?.responseData;
              const isAnswered = existingResponse !== null && existingResponse !== undefined;
              
              return (
                <div 
                  key={question.id} 
                  className={`rounded-xl border bg-gray-50 p-4 transition-all sm:p-6 dark:bg-black/20 ${
                    isAnswered 
                      ? 'border-green-500/30 bg-green-50/50 dark:bg-green-900/10' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="mb-4 flex items-start gap-3">
                    <div className={`mt-1 shrink-0 ${isAnswered ? 'text-green-500' : 'text-gray-400'}`}>
                      {isAnswered ? <CheckCircle size={20} /> : <Circle size={20} />}
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-3 font-google-sans-code text-sm font-medium text-gray-900 sm:text-base dark:text-white">
                        {question.text}
                      </h3>
                      
                      {/* Text Input */}
                      {question.type === 'text' && (
                        <textarea
                          className="w-full resize-none rounded-lg border border-gray-300 bg-white p-3 font-google-sans-code text-sm text-gray-900 transition-all focus:ring-2 focus:ring-blue-500/50 dark:border-gray-600 dark:bg-black/40 dark:text-white"
                          style={{ '--tw-ring-color': colorValue } as React.CSSProperties}
                          rows={3}
                          placeholder="Share your thoughts..."
                          defaultValue={typeof existingResponse === 'string' ? existingResponse : ''}
                          onBlur={(e) => {
                            if (e.target.value.trim() !== (existingResponse || '')) {
                              saveResponse(question.id, e.target.value.trim());
                            }
                          }}
                        />
                      )}
                      
                      {/* Multiple Choice */}
                      {question.type === 'multiple_choice' && question.choices && (
                        <div className="space-y-2">
                          {question.choices.map((choice, choiceIndex) => (
                            <button
                              key={choiceIndex}
                              onClick={() => saveResponse(question.id, choiceIndex)}
                              className={`w-full rounded-lg p-3 text-left font-google-sans-code text-sm transition-all ${
                                existingResponse === choiceIndex
                                  ? 'border-2 font-medium text-black'
                                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-black/40 dark:text-gray-300 dark:hover:bg-white/5'
                              }`}
                              style={existingResponse === choiceIndex ? { 
                                backgroundColor: `${colorValue}20`,
                                borderColor: colorValue 
                              } : {}}
                            >
                              {choice}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Ranking */}
                      {question.type === 'ranking' && question.choices && (
                        <div className="space-y-2">
                          <p className="mb-3 font-google-sans-code text-xs text-gray-600 sm:text-sm dark:text-gray-400">
                            Tap to rank in order of preference
                          </p>
                          {question.choices.map((choice, choiceIndex) => {
                            const currentRanking = Array.isArray(existingResponse) ? 
                              existingResponse.map(item => typeof item === 'number' ? item : parseInt(String(item), 10)).filter(item => !isNaN(item)) : [];
                            const rankPosition = currentRanking.indexOf(choiceIndex);
                            
                            return (
                              <button
                                key={choiceIndex}
                                onClick={() => {
                                  const newRanking = [...(Array.isArray(currentRanking) ? currentRanking : [])];
                                  if (rankPosition >= 0) {
                                    newRanking.splice(rankPosition, 1);
                                  } else {
                                    newRanking.push(choiceIndex);
                                  }
                                  saveResponse(question.id, newRanking);
                                }}
                                className={`flex w-full items-center justify-between rounded-lg p-3 text-left font-google-sans-code text-sm transition-all ${
                                  rankPosition >= 0
                                    ? 'border-2 font-medium text-black'
                                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-black/40 dark:text-gray-300 dark:hover:bg-white/5'
                                }`}
                                style={rankPosition >= 0 ? { 
                                  backgroundColor: `${colorValue}20`,
                                  borderColor: colorValue 
                                } : {}}
                              >
                                <span className="flex-1">{choice}</span>
                                {rankPosition >= 0 && (
                                  <span 
                                    className="rounded-full px-2 py-1 text-xs font-bold"
                                    style={{ backgroundColor: colorValue, color: '#000' }}
                                  >
                                    #{rankPosition + 1}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      
                      {isAnswered && question.userResponse?.completedAt && (
                        <div className="mt-3 font-google-sans-code text-xs text-gray-500 dark:text-gray-400">
                          Last updated: {new Date(question.userResponse.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FounderProfiler;