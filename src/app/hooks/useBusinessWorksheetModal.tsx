"use client";

import { useState } from 'react';
import BusinessWorksheet from '../components/BusinessWorksheet';

export const useBusinessWorksheetModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string>('core');

  const openModal = (category?: string) => {
    if (category) {
      setCurrentCategory(category);
    }
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const BusinessWorksheetModal = isOpen ? (
    <BusinessWorksheet
      isOpen={isOpen}
      onClose={closeModal}
      initialCategory={currentCategory}
    />
  ) : null;

  return {
    isOpen,
    openModal,
    closeModal,
    currentCategory,
    setCurrentCategory,
    BusinessWorksheetModal
  };
};