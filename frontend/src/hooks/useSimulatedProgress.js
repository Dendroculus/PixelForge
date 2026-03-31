// hooks/useSimulatedProgress.js
import { useEffect } from 'react';

export function useSimulatedProgress(isProcessing, setProgress, turnstileToken) {
  useEffect(() => {
    let interval;

    if (isProcessing) {
      const savedJobId = localStorage.getItem('pf_job_id');
      const savedProgress = localStorage.getItem('pf_progress');
      
      if (!turnstileToken && !savedJobId) {
        setProgress(0);
        return;
      }

      if (savedProgress) {
        setProgress(Number(savedProgress));
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