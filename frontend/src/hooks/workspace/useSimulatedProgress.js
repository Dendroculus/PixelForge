import { useEffect } from 'react';
import { makeStorageKeys } from '../../utils/storageKeys';

/**
 * React hook to simulate progressive loading during processing state.
 * Progress increases smoothly up to 95% and persists in localStorage.
 * @param {boolean} isProcessing
 * @param {(value: number | ((prev: number) => number)) => void} setProgress
 * @param {string|null} turnstileToken
 * @param {string} featureName
 */
export function useSimulatedProgress(isProcessing, setProgress, turnstileToken, featureName) {
  useEffect(() => {
    let interval;
    const storageKeys = makeStorageKeys(featureName);

    if (isProcessing) {
      const savedJobId = localStorage.getItem(storageKeys.JOB_ID);
      const savedProgress = localStorage.getItem(storageKeys.PROGRESS);
      const isProcessingStored = localStorage.getItem(storageKeys.IS_PROCESSING) === 'true';

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
          localStorage.setItem(storageKeys.PROGRESS, nextValue.toString());
          return nextValue;
        });
      }, 500);
    } else {
      setProgress(0);
    }

    return () => clearInterval(interval);
  }, [isProcessing, setProgress, turnstileToken, featureName]);
}