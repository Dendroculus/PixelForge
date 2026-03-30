import { useEffect } from 'react';

export function useSimulatedProgress(isProcessing, setProgress, turnstileToken) {
  /**
   * Simulates upload/processing progress.
   * Progress starts only after bot verification succeeds and caps at 95% until completion.
   */
  useEffect(() => {
    let interval;

    if (isProcessing) {
      if (!turnstileToken) {
        setProgress(0);
        return;
      }

      setProgress(15);

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return 95;
          const increment = (95 - prev) * 0.1;
          return prev + increment;
        });
      }, 500);
    } else {
      setProgress(0);
    }

    return () => clearInterval(interval);
  }, [isProcessing, setProgress, turnstileToken]);
}