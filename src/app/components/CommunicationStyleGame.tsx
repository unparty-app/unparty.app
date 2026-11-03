'use client';

import { useState } from 'react';

import { MessageSquare, Eye, Book, Microwave } from '@/app/components/icons';

import type { HandDrawnIconComponent } from '@/app/components/icons';
// Define types for the data structures
interface Answer {
  text: string;
  icon: HandDrawnIconComponent;
}

interface ProblemAnswers {
  direct: Answer;
  story: Answer;
  visual: Answer;
  practical: Answer;
}

interface Problem {
  question: string;
  answers: ProblemAnswers;
}

interface Problems {
  math: Problem;
  science: Problem;
}

type ProblemType = keyof Problems;
type StyleType = keyof ProblemAnswers;

const CommunicationStyleGame = () => {
  const [style, setStyle] = useState<StyleType>('direct');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  const problems: Problems = {
    math: {
      question: "How would you explain adding fractions?",
      answers: {
        direct: {
          text: "First, find a common denominator. Then add the numerators.",
          icon: MessageSquare
        },
        story: {
          text: "This is not something I would do.",
          icon: Book
        },
        visual: {
          text: "Let's draw two rectangles. We'll divide them into equal parts to see how they combine.",
          icon: Eye
        },
        practical: {
          text: "When cooking, if you need 1/3 cup sugar and 2/3 cup sugar, you'll need 3/3 or 1 full cup.",
          icon: Microwave
        }
      }
    },
    science: {
      question: "How would you explain photosynthesis?",
      answers: {
        direct: {
          text: "Plants convert sunlight, water, and CO2 into glucose and oxygen.",
          icon: MessageSquare
        },
        story: {
          text: "Plants are like tiny factories that turn sunlight into food they can use.",
          icon: Book
        },
        visual: {
          text: "I am not interested in this.",
          icon: Eye
        },
        practical: {
          text: "It's like how solar panels convert sunlight into usable energy for our homes.",
          icon: Microwave
        }
      }
    }
  };

  const [currentProblem, setCurrentProblem] = useState<ProblemType>('math');

  const handleStyleSelect = (newStyle: StyleType) => {
    setStyle(newStyle);
    setFeedback('');
  };

  const handleSubmit = () => {
    setScore(score + 1);
    setFeedback('vote to make this feature a DEV. priority.');
    setCurrentProblem(currentProblem === 'math' ? 'science' : 'math');
  };

  const baseButtonStyles = "w-full text-left p-4 rounded-lg font-google-sans-code transition-colors duration-200 flex items-start gap-3";
  const selectedButtonStyles = "bg-blue-500 font-google-sans-code text-white hover:bg-blue-600";
  const unselectedButtonStyles = "bg-blurhover:bg-slate-100 text-slate-700";

  return (
    <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl  shadow-lg">
      <div className="p-6">
        <h2 className="mb-4 text-2xl font-bold ">
          PARTNER.
        </h2>
        
        <div className="space-y-6">
          <div className="rounded-lg p-6">
            <h3 className="mb-4 text-lg font-google-sans-code ">
              {problems[currentProblem].question}
            </h3>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(Object.entries(problems[currentProblem].answers) as [StyleType, Answer][]).map(([key, { text, icon: Icon }]) => (
                <button
                  key={key}
                  onClick={() => handleStyleSelect(key)}
                  className={`${baseButtonStyles} ${
                    style === key ? selectedButtonStyles : unselectedButtonStyles
                  }`}
                >
                  <Icon 
                    size={24} 
                    className={style === key ? "text-white" : "text-slate-500"}
                  />
                  <span>{text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={handleSubmit}
              className="w-full rounded-lg backdrop-brightness-200 px-6 py-3 text-white transition-colors duration-200 hover:backdrop-brightness-600 md:w-auto"
            >
              🗄️
            </button>
            
            {feedback && (
              <p className="text-center text-sm text-slate-600">
                {feedback}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationStyleGame;