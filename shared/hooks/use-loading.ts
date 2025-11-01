import { useState, useCallback, useRef } from 'react';

interface UseLoadingReturn {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
  withLoadingAndRetry: <T>(asyncFn: () => Promise<T>, maxRetries?: number) => Promise<T>;
}

export const useLoading = (initialState: boolean = false): UseLoadingReturn => {
  const [isLoading, setIsLoading] = useState(initialState);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    // Safety timeout - giảm từ 33s xuống 10s
    timeoutRef.current = setTimeout(() => {
      console.warn('Loading timeout reached, forcing stop');
      setIsLoading(false);
    }, 10000);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    try {
      startLoading();
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // Thêm retry mechanism với exponential backoff
  const withLoadingAndRetry = useCallback(async <T>(
    asyncFn: () => Promise<T>, 
    maxRetries: number = 2
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt === 0) startLoading();
        const result = await asyncFn();
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt + 1} failed:`, error);
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff: 1s, 2s, 4s...
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      } finally {
        if (attempt === maxRetries) {
          stopLoading();
        }
      }
    }
    
    throw lastError!;
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
    withLoadingAndRetry,
  };
}; 