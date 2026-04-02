import { useEffect, useRef } from 'react';
import { loadFileFromIDB } from '../utils/idb';
import { clearAppSession } from '../utils/session';
import { APP_CONFIG as config } from '../config';

/**
 * Manages restoring jobs on page load and handling the live expiration timer.
 * * @param {Object} context - The shared state setters and API actions.
 */
export function useSessionPersistence({
  setSelectedFile,
  setPreviewUrl,
  setResultUrl,
  setIsProcessing,
  setJobId,
  setAppAlert,
  appAlert,
  pollForResult,
  handleUpscale,
  resultUrl,
  previewUrl
}) {
  const sessionRestored = useRef(false);

  useEffect(() => {
    if (sessionRestored.current) return;
    sessionRestored.current = true;

    const restoreSession = async () => {
      try {
        const savedFile = await loadFileFromIDB();
        if (!savedFile) return;

        setSelectedFile(savedFile);
        setPreviewUrl(URL.createObjectURL(savedFile));

        const savedResult = localStorage.getItem('pf_result_url');
        const savedTimestamp = localStorage.getItem('pf_result_timestamp');

        if (savedResult) {
            if (savedTimestamp && Date.now() - parseInt(savedTimestamp) > config.RESULT_EXPIRATION_TIME) {
                await clearAppSession();
                setSelectedFile(null); 
                setPreviewUrl(null);
                
                localStorage.setItem('pf_alert', 'expired');
                setAppAlert({ show: true, type: 'expired' });
                return;
            } else {
                setResultUrl(savedResult);
                setIsProcessing(false);
                localStorage.removeItem('pf_is_processing');
                localStorage.removeItem('pf_progress');
                
                if (!appAlert.show) {
                  setAppAlert({ show: true, type: 'reserved_warning' });
                }
                return;
            }
        }

        const savedJobId = localStorage.getItem('pf_job_id');
        const isProcessingStored = localStorage.getItem('pf_is_processing') === 'true';

        if (savedJobId || isProcessingStored) {
            let refreshCount = parseInt(localStorage.getItem('pf_refresh_count') || '0', 10);
            refreshCount++;
            localStorage.setItem('pf_refresh_count', refreshCount.toString());

            if (refreshCount === 3) {
                localStorage.setItem('pf_alert', 'potato'); 
                setAppAlert({ show: true, type: 'potato' });
            }

            if (savedJobId) {
              setIsProcessing(true);
              pollForResult(savedJobId);
            } else if (isProcessingStored) {
              setIsProcessing(true);
              handleUpscale(savedFile);
            }
        } else {
            setIsProcessing(false);
            localStorage.removeItem('pf_is_processing');
            localStorage.removeItem('pf_progress');
        }
      } catch (error) {
        console.error("Session restoration failed:", error);
      }
    };
    restoreSession();
  }, [pollForResult, handleUpscale, appAlert.show, setAppAlert, setIsProcessing, setPreviewUrl, setResultUrl, setSelectedFile]);

  useEffect(() => {
    let interval;
    if (resultUrl) {
      interval = setInterval(async () => {
        const savedTimestamp = localStorage.getItem('pf_result_timestamp');
        
        if (savedTimestamp && Date.now() - parseInt(savedTimestamp) > config.RESULT_EXPIRATION_TIME) {
          await clearAppSession(previewUrl);
          setSelectedFile(null);
          setPreviewUrl(null);
          setResultUrl(null);
          setJobId(null);
          
          localStorage.setItem('pf_alert', 'expired');
          setAppAlert({ show: true, type: 'expired' });
        }
      }, 5000); 
    }
    return () => clearInterval(interval);
  }, [resultUrl, previewUrl, setAppAlert, setJobId, setPreviewUrl, setResultUrl, setSelectedFile]);
}