'use client'

import { useState, useCallback } from 'react';
import { ProgressStep, StepStatus } from '@/shared/components/ui/progressive-loading';

interface UseProgressiveSessionReturn {
  steps: ProgressStep[];
  updateStep: (stepId: string, status: StepStatus, description?: string) => void;
  resetSteps: () => void;
  hasError: boolean;
  isCompleted: boolean;
  currentStep: ProgressStep | null;
}

export const useProgressiveSession = (): UseProgressiveSessionReturn => {
  const [steps, setSteps] = useState<ProgressStep[]>([
    {
      id: 'validate',
      label: 'Validating session filters',
      status: 'pending',
      description: 'Checking if enough cards match your criteria'
    },
    {
      id: 'generate',
      label: 'Generating flashcards',
      status: 'pending',
      description: 'Fetching and preparing your cards'
    },
    {
      id: 'save',
      label: 'Creating session',
      status: 'pending',
      description: 'Saving session data to database'
    },
    {
      id: 'redirect',
      label: 'Preparing review interface',
      status: 'pending',
      description: 'Loading your flashcard session'
    }
  ]);

  const updateStep = useCallback((stepId: string, status: StepStatus, description?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, ...(description && { description }) }
        : step
    ));
  }, []);

  const resetSteps = useCallback(() => {
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as StepStatus })));
  }, []);

  const hasError = steps.some(step => step.status === 'error');
  const isCompleted = steps.every(step => step.status === 'completed');
  const currentStep = steps.find(step => step.status === 'loading') || null;

  return {
    steps,
    updateStep,
    resetSteps,
    hasError,
    isCompleted,
    currentStep,
  };
};
