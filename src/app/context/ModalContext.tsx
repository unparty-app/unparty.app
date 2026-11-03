// context/ModalContext.tsx
'use client';
import { createContext, useContext } from 'react';

export const ModalContext = createContext(false);
export const useInModal = () => useContext(ModalContext);
