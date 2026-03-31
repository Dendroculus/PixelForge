import { useEffect } from 'react';

export function useSimulatedProgress(isProcessing, setProgress, turnstileToken) {
  /**
   * Simulates upload/processing progress.
   * Progress starts only after bot verification succeeds and caps at 95% until completion.
   */
  useEffect(() => {
    let interval;

    if (isProcessing) {
      const savedProgress = localStorage.getItem('pf_progress');
      
      if (savedProgress) {
        setProgress(Number(savedProgress));
      } else if (!turnstileToken && !localStorage.getItem('pf_job_id')) {
        setProgress(0);
        return;
      } else {
        setProgress(15);
      }

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return 95;
          const increment = (95 - prev) * 0.1;
          const nextValue = prev + increment;
          localStorage.setItem('pf_progress', nextValue.toString());
          return nextValue;
        });
      }, 500);
    } else {
      setProgress(0);
    }

    return () => clearInterval(interval);
  }, [isProcessing, setProgress, turnstileToken]);
}