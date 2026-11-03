'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';

import { X, AlertCircle, Lightbulb, DollarSign, TrendingUp, CheckCircle, Palette, Package, ShieldCheck, Download } from '@/app/components/icons';
import type { QuestionCategory as BusinessCategory } from '@/types/questions';

// Import the questions data
import { foundersQuestions } from '../founders/foundersquestions';

// Import export utilities
import { downloadBusinessWorksheet, shareBusinessWorksheet, ShareResult } from '../utils/exportBusiness';

import ModalNavigation from './ModalNavigation';
import { useHydrated } from '@/hooks/useHydrated';

import type { HandDrawnIconComponent, HandDrawnIconProps } from '@/app/components/icons';
interface BusinessWorksheetProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialCategory?: string;
}

interface BusinessWorksheetContentProps {
  initialCategory?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  singleCategory?: boolean;
}

// Category icon mapping for visual hierarchy
const CATEGORY_ICONS: Record<string, HandDrawnIconComponent> = {
  core: Lightbulb,
  budget: DollarSign,
  brand: Palette,
  product: Package,
  risk: ShieldCheck,
  grow: TrendingUp,
};

function CategoryIcon({ categoryId, ...props }: { categoryId: string } & HandDrawnIconProps) {
  const Icon = CATEGORY_ICONS[categoryId] ?? Lightbulb;
  return <Icon {...props} />;
}

// Category color mapping for brand consistency
const getCategoryColor = (categoryId: string) => {
  const colors = {
    core: '#F9C22E',// cover-001-primary
    budget: '#CD7179', // cover-001-secondary
    brand: '#889654', // cover-003-primary
    product: '#5283CF', // cover-004-primary
    risk: '#427544', // cover-004-quarternary
    grow: '#FFF1D6', // cover-002-secondary

  };
  return colors[categoryId as keyof typeof colors] || '#F9C22E';
};

export const BusinessWorksheetContent: React.FC<BusinessWorksheetContentProps> = ({
  initialCategory = 'core',
  onClose,
  showCloseButton = false,
  singleCategory = false,
}) => {
  const [currentCategory, setCurrentCategory] = useState(initialCategory);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Get business categories from foundersquestions.json
  const businessCategories = useMemo(() => {
    return foundersQuestions.categories.filter(cat =>
      ['core', 'budget', 'brand', 'product', 'risk', 'grow'].includes(cat.id)
    ) as BusinessCategory[];
  }, []);

  const visibleCategories = singleCategory
    ? businessCategories.filter(cat => cat.id === currentCategory)
    : businessCategories;

  const currentCategoryData = businessCategories.find(cat => cat.id === currentCategory);
  const currentQuestion = currentCategoryData?.questions[currentQuestionIndex];
  const categoryColor = getCategoryColor(currentCategory);

  // Handle answer updates
  const updateAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Handle ranking answers
  const updateRankingAnswer = (questionId: string, choices: string[]) => {
    updateAnswer(questionId, choices);
  };

  // Navigate between questions
  const goToNextQuestion = () => {
    if (currentCategoryData && currentQuestionIndex < currentCategoryData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Move to next category
      const currentCatIndex = visibleCategories.findIndex(cat => cat.id === currentCategory);
      if (currentCatIndex < visibleCategories.length - 1) {
        setCurrentCategory(visibleCategories[currentCatIndex + 1].id);
        setCurrentQuestionIndex(0);
      }
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      // Move to previous category
      const currentCatIndex = visibleCategories.findIndex(cat => cat.id === currentCategory);
      if (currentCatIndex > 0) {
        const prevCategory = visibleCategories[currentCatIndex - 1];
        setCurrentCategory(prevCategory.id);
        setCurrentQuestionIndex(prevCategory.questions.length - 1);
      }
    }
  };

  // Progress calculation
  const totalQuestions = visibleCategories.reduce((acc, cat) => acc + cat.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;
  const progressPercentage = Math.round((answeredQuestions / totalQuestions) * 100);

  // Share worksheet
  const shareWorksheet = async () => {
    setIsSharing(true);
    try {
      const result: ShareResult = await shareBusinessWorksheet(
        {
          answers,
          categories: businessCategories,
          completionPercentage: progressPercentage
        },
        {
          includeMetadata: true
        }
      );

      setShareMessage({
        text: result.message,
        type: result.success ? 'success' : 'error'
      });

      setTimeout(() => setShareMessage(null), 4000);
    } catch (error) {
      console.error('Failed to share worksheet:', error);
      setShareMessage({
        text: 'Failed to share worksheet. Please try again.',
        type: 'error'
      });
      setTimeout(() => setShareMessage(null), 4000);
    } finally {
      setIsSharing(false);
    }
  };

  // Export to HTML
  const exportToHTML = () => {
    downloadBusinessWorksheet(
      {
        answers,
        categories: businessCategories,
        completionPercentage: progressPercentage
      },
      {
        includeMetadata: true
      }
    );
  };

  // Render question input based on type
  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    const currentAnswer = answers[currentQuestion.id];

    switch (currentQuestion.type) {
      case 'text':
        return (
          <textarea
            value={currentAnswer as string || ''}
            onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full min-h-[160px] sm:min-h-[140px] p-5 sm:p-4 rounded-xl border-2 border-gray-200/20 bg-gray-50/20 focus:border-[#F9C22E] focus:ring-4 focus:ring-[#F9C22E]/20 transition-all duration-200 dark:border-gray-700/20 dark:bg-white/5 resize-none font-google-sans-code text-sm leading-relaxed"
            style={{ color: 'var(--foreground)' }}
          />
        );

      case 'multipleChoice':
        return (
          <div className="space-y-3 sm:space-y-3">
            {currentQuestion.choices?.map((choice, index) => (
              <button
                key={index}
                onClick={() => updateAnswer(currentQuestion.id, choice)}
                className={`w-full p-5 sm:p-4 text-left rounded-xl border-2 transition-colors duration-200 font-google-sans-code text-sm min-h-[56px] sm:min-h-[52px] ${
                  currentAnswer === choice
                    ? 'border-[#F9C22E] bg-[#F9C22E]/5'
                    : 'border-gray-200/20 dark:border-gray-700/20 hover:bg-gray-50/20 dark:hover:bg-white/5'
                }`}
                style={{ color: 'var(--foreground)' }}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                    currentAnswer === choice
                      ? 'border-[#F9C22E] bg-[#F9C22E]'
                      : 'border-gray-300 dark:border-gray-600'
                  }`} />
                  <span className="leading-relaxed">{choice}</span>
                </div>
              </button>
            ))}
          </div>
        );

      case 'ranking':
        const rankingChoices = (currentAnswer as string[]) || [];
        const availableChoices = currentQuestion.choices?.filter(choice =>
          !rankingChoices.includes(choice)
        ) || [];

        return (
          <div className="space-y-6">
            {/* Ranked items */}
            {rankingChoices.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-google-sans-code text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                  Your Ranking (drag to reorder)
                </h4>
                {rankingChoices.map((choice, index) => (
                  <div
                    key={`ranked-${index}`}
                    className="flex items-center space-x-4 p-4 sm:p-3 bg-[#F9C22E]/5 border-2 border-[#F9C22E]/20 rounded-xl min-h-[56px] sm:min-h-[52px]"
                  >
                    <span className="w-8 h-8 sm:w-7 sm:h-7 bg-[#F9C22E] text-white font-vt323 text-sm font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-google-sans-code text-sm leading-relaxed flex-1" style={{ color: 'var(--foreground)' }}>{choice}</span>
                    <button
                      onClick={() => {
                        const newRanking = rankingChoices.filter((_, i) => i !== index);
                        updateRankingAnswer(currentQuestion.id, newRanking);
                      }}
                      className="ml-auto text-gray-400 hover:text-gray-600 transition-colors p-2 min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Available choices */}
            {availableChoices.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-google-sans-code text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                  Available Options (click to rank)
                </h4>
                {availableChoices.map((choice, index) => (
                  <button
                    key={`available-${index}`}
                    onClick={() => {
                      const newRanking = [...rankingChoices, choice];
                      updateRankingAnswer(currentQuestion.id, newRanking);
                    }}
                    className="w-full p-5 sm:p-4 text-left border-2 border-gray-200/20 dark:border-gray-700/20 rounded-xl hover:bg-gray-50/20 dark:hover:bg-white/5 transition-colors duration-200 font-google-sans-code text-sm min-h-[56px] sm:min-h-[52px]"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <span className="leading-relaxed">{choice}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'scale':
        const scaleMin = currentQuestion.scaleMin ?? 0;
        const scaleMax = currentQuestion.scaleMax ?? 100;
        const scaleStep = currentQuestion.scaleStep ?? 1;
        const scalePrefix = currentQuestion.scalePrefix ?? '';
        const scaleSuffix = currentQuestion.scaleSuffix ?? '';
        const scaleLabels = currentQuestion.scaleLabels ?? [];
        const scaleValue = typeof currentAnswer === 'number' ? currentAnswer : (typeof currentAnswer === 'string' ? parseFloat(currentAnswer) : scaleMin);

        // Calculate fill percentage for visual feedback
        const fillPercentage = ((scaleValue - scaleMin) / (scaleMax - scaleMin)) * 100;

        // Format value - always 2 decimals for currency, otherwise based on step
        const formatScaleValue = (val: number) => {
          if (scalePrefix === '$') {
            return val.toFixed(2);
          }
          return val.toFixed(scaleStep < 1 ? 1 : 0);
        };

        return (
          <div className="space-y-6">
            {/* Current value display */}
            <div className="text-center">
              <div className="font-vt323 text-5xl sm:text-6xl font-bold tabular-nums" style={{ color: categoryColor }}>
                {scalePrefix}{formatScaleValue(scaleValue)}{scaleSuffix}
              </div>
            </div>

            {/* Slider with visual fill */}
            <div className="relative">
              <input
                type="range"
                min={scaleMin}
                max={scaleMax}
                step={scaleStep}
                value={scaleValue}
                onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                className="w-full h-3 sm:h-4 cursor-pointer appearance-none rounded-full transition-all"
                style={{
                  background: `linear-gradient(to right, ${categoryColor} 0%, ${categoryColor} ${fillPercentage}%, rgba(209, 213, 219, 0.3) ${fillPercentage}%, rgba(209, 213, 219, 0.3) 100%)`
                }}
              />

              {/* Custom slider styling */}
              <style jsx>{`
                input[type="range"]::-webkit-slider-thumb {
                  appearance: none;
                  width: 28px;
                  height: 28px;
                  border-radius: 50%;
                  background: ${categoryColor};
                  cursor: pointer;
                  border: 3px solid white;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                  transition: transform 0.15s ease;
                }

                input[type="range"]::-webkit-slider-thumb:hover {
                  transform: scale(1.15);
                }

                input[type="range"]::-webkit-slider-thumb:active {
                  transform: scale(1.05);
                }

                input[type="range"]::-moz-range-thumb {
                  width: 28px;
                  height: 28px;
                  border-radius: 50%;
                  background: ${categoryColor};
                  cursor: pointer;
                  border: 3px solid white;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                  transition: transform 0.15s ease;
                }

                input[type="range"]::-moz-range-thumb:hover {
                  transform: scale(1.15);
                }

                input[type="range"]::-moz-range-thumb:active {
                  transform: scale(1.05);
                }

                @media (min-width: 640px) {
                  input[type="range"]::-webkit-slider-thumb {
                    width: 24px;
                    height: 24px;
                  }
                  input[type="range"]::-moz-range-thumb {
                    width: 24px;
                    height: 24px;
                  }
                }
              `}</style>
            </div>

            {/* Scale labels if provided */}
            {scaleLabels.length > 0 && (
              <div className="flex justify-between px-1">
                {scaleLabels.map((label, index) => (
                  <div key={index} className="text-center">
                    <div className="font-vt323 text-xs sm:text-sm font-semibold" style={{ color: categoryColor }}>
                      {scalePrefix}{formatScaleValue(label.value)}{scaleSuffix}
                    </div>
                    <div className="font-google-sans-code text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {label.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Min/Max labels if no custom labels */}
            {scaleLabels.length === 0 && (
              <div className="flex justify-between px-1">
                <span className="font-vt323 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {scalePrefix}{formatScaleValue(scaleMin)}{scaleSuffix}
                </span>
                <span className="font-vt323 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {scalePrefix}{formatScaleValue(scaleMax)}{scaleSuffix}
                </span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      style={{
        backgroundColor: 'var(--background)',
        border: '1px solid rgba(249, 195, 46, 0)'
      }}
    >
      {/* Header */}
      <div
        className="px-5 sm:px-8 py-5 sm:py-6 border-b backdrop-blur-sm"
        style={{
          borderColor: 'rgba(249, 194, 46, 0.2)',
          background: 'var(--bg-modal)'  
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">

            <div>
              <h2 className="font-google-sans-code text-lg font-bold uppercase" style={{ color: 'var(--foreground)' }}>
                THINK.
              </h2>
              <div className="flex items-center space-x-2">
                <CategoryIcon categoryId={currentCategory} className="w-4 h-4" style={{ color: categoryColor }} />

                <span className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
                   {progressPercentage}% DONE
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Export button */}
            <button
              onClick={exportToHTML}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-[36px] rounded-lg border border-[#F9C22E] text-[#F9C22E] font-medium transition-all duration-200 hover:bg-[#F9C22E]/10 font-google-sans-code"
              title="Export to HTML"
            >
              <Download className="w-4 h-4" />

            </button>

            {/* Share button */}
            <button
              onClick={shareWorksheet}
              disabled={isSharing}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-[36px] rounded-lg bg-[#F9C22E] text-muted font-medium transition-all duration-200 hover:bg-[#F9C22E]/90 disabled:opacity-50 font-vt323"
              title="Share your worksheet"
            >
              
              <span className="text-xs uppercase hidden sm:inline">{isSharing ? 'connecting...' : 'CONNECT.'}</span>
            </button>

            {/* Close button — only shown in modal context */}
            {showCloseButton && onClose && (
              <button
                onClick={onClose}
                className="p-2.5 sm:p-2 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5 sm:mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: categoryColor
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Category Navigation - Horizontal Scroll */}
      {!singleCategory && (
      <div className="lg:hidden px-5 py-4 border-b" style={{ borderColor: 'rgba(249, 194, 46, 0.2)' }}>
        <div className="flex items-center gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-5 px-5">
          {visibleCategories.map((category) => {
            const color = getCategoryColor(category.id);
            const isActive = category.id === currentCategory;
            const categoryAnswers = category.questions.filter(q => answers[q.id]).length;
            const categoryProgress = Math.round((categoryAnswers / category.questions.length) * 100);

            return (
              <button
                key={category.id}
                onClick={() => {
                  setCurrentCategory(category.id);
                  setCurrentQuestionIndex(0);
                }}
                className="flex items-center gap-2.5 px-5 py-3 rounded-full font-google-sans-code text-xs font-bold uppercase tracking-wide transition-all flex-shrink-0 whitespace-nowrap min-h-[48px] snap-start"
                style={
                  isActive
                    ? {
                        backgroundColor: `${color}20`,
                        border: `2px solid ${color}`,
                        color: color,
                      }
                    : {
                        backgroundColor: 'transparent',
                        border: '2px solid rgba(209, 213, 219, 0.3)',
                        color: 'var(--text-muted)',
                      }
                }
              >
                <CategoryIcon categoryId={category.id} className="w-4 h-4" style={{ color: isActive ? color : 'var(--text-muted)' }} />
                <span>{category.label}</span>
                {categoryProgress === 100 && (
                  <CheckCircle className="w-4 h-4" style={{ color }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Category sidebar */}
        {!singleCategory && (
        <div
          className="hidden lg:flex lg:flex-col lg:w-64 border-r p-6 space-y-3"
          style={{ borderColor: 'rgba(249, 194, 46, 0.2)' }}
        >
          <h3 className="font-google-sans-code text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
            Categories
          </h3>
          {visibleCategories.map((category) => {
            const color = getCategoryColor(category.id);
            const isActive = category.id === currentCategory;
            const categoryAnswers = category.questions.filter(q => answers[q.id]).length;
            const categoryProgress = Math.round((categoryAnswers / category.questions.length) * 100);

            return (
              <button
                key={category.id}
                onClick={() => {
                  setCurrentCategory(category.id);
                  setCurrentQuestionIndex(0);
                }}
                className={`w-full p-4 rounded-xl text-left transition-colors duration-200 ${
                  isActive
                    ? ''
                    : 'hover:bg-gray-50/20 dark:hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: isActive ? `${color}10` : 'transparent',
                  border: isActive ? `1px solid ${color}20` : '1px solid transparent'
                }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <CategoryIcon categoryId={category.id} className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-google-sans-code font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                      {category.label}
                    </div>
                    <div className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
                      {categoryProgress}% • {categoryAnswers}/{category.questions.length}
                    </div>
                  </div>
                  {categoryAnswers === category.questions.length && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
        )}

        {/* Question area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 px-5 py-6 sm:px-8 sm:py-8 overflow-y-auto">
            {currentQuestion && (
              <div className="max-w-2xl mx-auto space-y-8 pb-6">
                {/* Question header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                      Question {currentQuestionIndex + 1} of {currentCategoryData?.questions.length}
                    </span>
                  </div>
                  <h3 className="font-google-sans-code text-md sm:text-l font-semibold leading-relaxed" style={{ color: 'var(--foreground)' }}>
                    {currentQuestion.text}
                  </h3>
                </div>

                {/* Question input */}
                <div className="space-y-5">
                  {renderQuestionInput()}
                </div>
              </div>
            )}
          </div>

          {/* Arrow Navigation */}
          <ModalNavigation
            onPrevious={goToPreviousQuestion}
            onNext={goToNextQuestion}
            hasPrevious={!(currentCategory === businessCategories[0]?.id && currentQuestionIndex === 0)}
            hasNext={!(
              currentCategory === businessCategories[businessCategories.length - 1]?.id &&
              currentQuestionIndex === (currentCategoryData?.questions.length || 0) - 1
            )}
          />
        </div>
      </div>

      {/* Share message */}
      {shareMessage && (
        <div
          className={`absolute top-4 right-4 px-5 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-2 duration-300 ${
            shareMessage.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            {shareMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{shareMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const BusinessWorksheet: React.FC<BusinessWorksheetProps> = ({
  isOpen = false,
  onClose,
  initialCategory = 'core'
}) => {
  const mounted = useHydrated();

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6" style={{ backgroundColor: 'var(--background)' }}>
      {/* Backdrop blur overlay */}
      <div className="absolute inset-0 backdrop-blur-md" onClick={onClose} />

      <BusinessWorksheetContent
        initialCategory={initialCategory}
        onClose={onClose}
        showCloseButton={true}
      />
    </div>,
    document.body
  );
};

export default BusinessWorksheet;
