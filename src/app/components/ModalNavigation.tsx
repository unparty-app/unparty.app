'use client';

import { ChevronRight, ChevronLeft } from '@/app/components/icons';

interface ModalNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  previousLabel?: string;
  nextLabel?: string;
  accentColor?: string;
  className?: string;
}

export default function ModalNavigation({
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  previousLabel = 'Previous question',
  nextLabel = 'Next question',
  className = ''
}: ModalNavigationProps) {
  return (
    <div className={`absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between items-center pointer-events-none px-2 sm:px-4 ${className}`}>
      <button
        onClick={onPrevious}
        disabled={!hasPrevious}
        className="pointer-events-auto page-navigation-arrow"
        aria-label={previousLabel}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <button
        onClick={onNext}
        disabled={!hasNext}
        className="pointer-events-auto page-navigation-arrow"
        aria-label={nextLabel}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
