'use client'

import React from 'react';
import { CheckCircle, Circle, Loader2, XCircle } from 'lucide-react';

export type StepStatus = 'pending' | 'loading' | 'completed' | 'error';

export interface ProgressStep {
  id: string;
  label: string;
  status: StepStatus;
  description?: string;
}

interface ProgressiveLoadingProps {
  steps: ProgressStep[];
  title?: string;
  onCancel?: () => void;
  className?: string;
}

const StepIcon: React.FC<{ status: StepStatus }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return <Circle className="h-5 w-5 text-gray-400" />;
    case 'loading':
      return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'error':
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Circle className="h-5 w-5 text-gray-400" />;
  }
};

const ProgressBar: React.FC<{ steps: ProgressStep[] }> = ({ steps }) => {
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({ 
  steps, 
  title = "Processing...", 
  onCancel,
  className = "" 
}) => {
  const hasError = steps.some(step => step.status === 'error');
  const allCompleted = steps.every(step => step.status === 'completed');

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <ProgressBar steps={steps} />
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <StepIcon status={step.status} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  step.status === 'completed' ? 'text-green-700' :
                  step.status === 'loading' ? 'text-blue-700' :
                  step.status === 'error' ? 'text-red-700' :
                  'text-gray-600'
                }`}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        {(hasError || onCancel) && !allCompleted && (
          <div className="flex justify-end gap-2">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
            )}
            {hasError && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Success message */}
        {allCompleted && (
          <div className="text-center">
            <p className="text-sm text-green-700 font-medium">Ready to start your session!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressiveLoading;

