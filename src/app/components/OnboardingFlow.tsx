'use client';

import React, { useState } from 'react';
import { useUserTracking } from '../hooks/useUserTracking';
import { useTheme } from '../contexts/ThemeContext';

import { Check, ChevronRight, ChevronLeft, User, Lightbulb, Users, Rocket } from '@/app/components/icons';
import Badge from './Badge';
import HStack from './HStack';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const OnboardingFlow = () => {
  const { trackPillarUsage } = useUserTracking();
  const { colorValue } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [userType, setUserType] = useState<string>('');
  const [ideaTitle, setIdeaTitle] = useState<string>('');
  const [experience, setExperience] = useState<string>('');
  const [goals, setGoals] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'unparty-app',
      description: 'there is no such thing as vibe coding.',
      icon: <Rocket size={24} style={{ color: colorValue }} />,
      content: (
        <div className="space-y-6 text-left">
          <HStack>
          <h2 className="font-google-sans-code text-3xl text-left font-bold" style={{ color: colorValue }}>
            HELLO,
          </h2>
          <Badge>thinking...</Badge>

          
          
          <div className="mx-auto grid max-w-2xl grid-cols-3 gap-4">
            
           
              <HStack>
                {/* BADGE_ABOUT  */}
                <Badge>
              <Lightbulb size={30} className="mx-auto" style={{ color: colorValue }} />
              </Badge>
              </HStack>
            
            
            
              <HStack>
                {/* BADGE_BUILD  */}
                <Badge>
              <Rocket size={30} className="mx-auto" style={{ color: colorValue }} />
              </Badge>
              
              </HStack>
            
            <HStack>
              {/* BADGE_CONNECT  */}
              <Badge>
              <Users size={30} className="mx-auto" style={{ color: colorValue }} />
              </Badge>
              
            </HStack>
          </div>
          </HStack>
        </div>
      )
    },
    {
      id: 'profile',
      title: 'USER.',
      description: 'Control your experience on unparty-app.',
      icon: <User size={24} style={{ color: colorValue }} />,
      content: (
        <div className="space-y-6">
          <h2 className="font-vt323 uppercase text-2xl font-bold text-left" style={{ color: colorValue }}>
            Who do you think you are?
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              { value: 'NON_TECHNICAL_FOUNDER', label: 'Non-Technical Founder', desc: 'I have an idea and can explain it.' },
              { value: 'TECHNICAL_FOUNDER', label: 'Technical Founder', desc: 'I have an idea and can build it.' },
              { value: 'BUSINESS_OWNER', label: 'BUSINESS OWNER', desc: 'I have an idea that solves a problem.' },
              { value: 'ENTREPRENEUR', label: 'Entrepreneur', desc: 'I have many ideas at all times.' },
              { value: 'CONSUMER', label: 'Consumer', desc: 'I have a problem that needs a solution.' },
              { value: 'OTHER', label: 'Other', desc: 'I am just here.' }
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setUserType(type.value)}
                className={`rounded-lg border p-4 text-left transition-all ${
                  userType === type.value
                    ? 'border-2 bg-opacity-10'
                    : 'border-gray-200 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
                style={userType === type.value ? { 
                  borderColor: colorValue,
                  backgroundColor: `${colorValue}20`
                } : {}}
              >
                <h3 className="font-google-sans-code text-sm font-bold uppercase"style={{ color: colorValue }}>{type.label}</h3>
                <p className="font-google-sans-code text-xs">{type.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'idea',
      title: 'Your first idea',
      description: 'What are you working on or thinking about?',
      icon: <Lightbulb size={24} style={{ color: colorValue }} />,
      content: (
        <div className="space-y-6">
          <h2 className="font-google-sans-code text-2xl font-bold text-left" style={{ color: colorValue }}>
            What&apos;s your favorite word?
          </h2>
          <div className="space-y-4">
            <div>
              <label className="font-google-sans-code text-sm font-medium">
                FAVORITE WORD:
              </label>
              <input
                type="text"
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
                placeholder="e.g., PARTY."
                className="mt-1 w-full rounded-lg border border-gray-300 p-3 font-google-sans-code focus:border-opacity-50 focus:outline-none focus:ring-2 dark:border-gray-600 dark:bg-black/20"
                style={{ '--tw-ring-color': colorValue } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="font-google-sans-code text-sm font-medium"style={{ color: colorValue }}>
                when do you use this word?
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-3 font-google-sans-code focus:border-opacity-50 focus:outline-none focus:ring-2 dark:border-gray-600 dark:bg-black/20"
              >
                <option value="">pick the best match...</option>
                <option value="first-time">I use this word when I am frustrated.</option>
                <option value="some-experience">I use this word when I am motivated.</option>
                <option value="experienced">I use this word when I am losing.</option>
                <option value="serial-entrepreneur">Mind your business.</option>
              </select>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'goals',
      title: 'Your goals',
      description: 'What do you want to achieve with unparty?',
      icon: <Check size={24} style={{ color: colorValue }} />,
      content: (
        <div className="space-y-6">
          <h2 className="font-google-sans-code text-2xl font-bold text-center" style={{ color: colorValue }}>
            GOAL.
          </h2>
          <p className="text-center font-google-sans-code text-gray-600 dark:text-gray-400">
            Select all that apply
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              'Learn.',
              'Build.',
              'Connect.'
            ].map((goal) => (
              <button
                key={goal}
                onClick={() => {
                  setGoals(prev => 
                    prev.includes(goal) 
                      ? prev.filter(g => g !== goal)
                      : [...prev, goal]
                  );
                }}
                className={`rounded-lg border p-3 text-left font-google-sans-code text-sm transition-all ${
                  goals.includes(goal)
                    ? 'border-2 bg-opacity-10'
                    : 'border-gray-200 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
                style={goals.includes(goal) ? { 
                  borderColor: colorValue,
                  backgroundColor: `${colorValue}20`
                } : {}}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      // Save onboarding data
      const onboardingData = {
        userType,
        ideaTitle,
        experience,
        goals,
        completedAt: new Date()
      };

      // Track onboarding completion
      await trackPillarUsage({
        action: 'onboarding_completed',
        metadata: onboardingData
      });

      // Create first idea progression if they provided an idea
      if (ideaTitle) {
        await fetch('/api/analytics/idea-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ideaTitle,
            currentStage: 'CONCEPTION',
            stepsCompleted: 0,
            totalSteps: 10 // Default estimate
          }),
        });
      }

      setIsComplete(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true;
      case 1: return userType !== '';
      case 2: return ideaTitle !== '' && experience !== '';
      case 3: return goals.length > 0;
      default: return true;
    }
  };

  if (isComplete) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-black/20">
        <div className="mb-6">
          <div 
            className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${colorValue}20` }}
          >
            <Check size={32} style={{ color: colorValue }} />
          </div>
          <h2 className="font-vt323 text-2xl font-bold" style={{ color: colorValue }}>
            share.
          </h2>
          
        </div>
        <div className="grid grid-cols-3 gap-4">
          <a 
            href="/about"
            className="rounded-lg border border-gray-200 p-4 transition hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600"
          >
            <Lightbulb size={24} className="mx-auto mb-2" style={{ color: colorValue }} />
            <h3 className="font-google-sans-code text-sm font-bold">ABOUT</h3>
            <p className="font-google-sans-code text-xs text-gray-600 dark:text-gray-400">Start here</p>
          </a>
          <a 
            href="/build"
            className="rounded-lg border border-gray-200 p-4 transition hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600"
          >
            <Rocket size={24} className="mx-auto mb-2" style={{ color: colorValue }} />
            <h3 className="font-google-sans-code text-sm font-bold">BUILD</h3>
            <p className="font-google-sans-code text-xs text-gray-600 dark:text-gray-400">Learn & create</p>
          </a>
          <a 
            href="/connect"
            className="rounded-lg border border-gray-200 p-4 transition hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600"
          >
            <Users size={24} className="mx-auto mb-2" style={{ color: colorValue }} />
            <h3 className="font-google-sans-code text-sm font-bold">CONNECT</h3>
            <p className="font-google-sans-code text-xs text-gray-600 dark:text-gray-400">Find community</p>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between font-vt323 text-sm text-gray-600 dark:text-gray-400">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${((currentStep + 1) / steps.length) * 100}%`,
              backgroundColor: colorValue
            }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-xl p-8">
        <div className="mb-6 flex items-center gap-3">
          {steps[currentStep].icon}
          <div>
            <h1 className="font-google-sans-code text-xl font-bold">{steps[currentStep].title}</h1>
            <p className="font-google-sans-code text-sm text-gray-600 dark:text-gray-400">
              {steps[currentStep].description}
            </p>
          </div>
        </div>

        {steps[currentStep].content}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-google-sans-code text-sm transition disabled:opacity-50 dark:border-gray-600"
          >
            <ChevronLeft size={16} />
            back
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2 rounded-lg px-4 py-2 font-google-sans-code text-sm text-white transition disabled:opacity-50"
            style={{ backgroundColor: canProceed() ? colorValue : '#9CA3AF' }}
          >
            {currentStep === steps.length - 1 ? 'done.' : 'next.'}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;