import { useEffect } from 'react';
import { STORAGE_KEYS } from '../config';

/**
 * React hook to simulate progressive loading during processing state.
 * Progress increases smoothly up to 95% and persists in localStorage.
 * @param {boolean} isProcessing
 * @param {(value: number | ((prev: number) => number)) => void} setProgress
 * @param {string|null} turnstileToken
 */
export function useSimulatedProgress(isProcessing, setProgress, turnstileToken) {
  useEffect(() => {
    let interval;

    if (isProcessing) {
      const savedJobId = localStorage.getItem(STORAGE_KEYS.JOB_ID);
      const savedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      const isProcessingStored = localStorage.getItem(STORAGE_KEYS.IS_PROCESSING) === 'true';

      if (!turnstileToken && !savedJobId && !isProcessingStored) {
        setProgress(0);
        return;
      }

      if (savedProgress) {
        setProgress(Number(savedProgress));
      } else {
        setProgress(0);
      }

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return 95;
          const increment = (95 - prev) * 0.1;
          const nextValue = prev + increment;
          localStorage.setItem(STORAGE_KEYS.PROGRESS, nextValue.toString());
          return nextValue;
        });
      }, 500);
    } else {
      setProgress(0);
    }

    return () => clearInterval(interval);
  }, [isProcessing, setProgress, turnstileToken]);
}