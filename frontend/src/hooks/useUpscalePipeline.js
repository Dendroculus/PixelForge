import { useState, useRef } from 'react';
import { apiService } from '../services/apiService';

/**
 * Manages the full image upscaling pipeline including file handling,
 * Turnstile verification, upload, and result polling.
 *
 * @param {Function} setProgress - Updates progress state in the UI.
 */
export function useUpscalePipeline(setProgress) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [modelType, setModelType] = useState('general');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);

  /**
   * Resets Turnstile widget instance and clears associated token.
   */
  const resetTurnstile = () => {
    if (turnstileRef.current) {
      turnstileRef.current.reset();
    }
    setTurnstileToken(null);
  };

  /**
   * Stores selected file and creates a temporary preview URL.
   *
   * @param {File} file
   */
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null);
  };

  /**
   * Clears pipeline state and aborts any ongoing process.
   */
  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setIsProcessing(false);
    resetTurnstile();
  };

  /**
   * Polls backend until processing completes or fails.
   *
   * @param {string} jobId
   */
  const pollForResult = (jobId) => {
    const interval = setInterval(async () => {
      try {
        const result = await apiService.pollResult(jobId);

        if (result.success) {
          clearInterval(interval);
          setProgress(100);

          setTimeout(() => {
            setResultUrl(result.data.url);
            setIsProcessing(false);
            resetTurnstile();
          }, 400);
        } else if (result.error) {
          clearInterval(interval);
          setIsProcessing(false);
          resetTurnstile();
          alert("Server error processing image.");
        }
      } catch (err) {
        console.error("Polling error:", err);
        clearInterval(interval);
        setIsProcessing(false);
        resetTurnstile();
      }
    }, 1500);
  };

  /**
   * Initiates upscale flow:
   * - Ensures Turnstile verification
   * - Uploads file securely
   * - Starts result polling
   */
  const handleUpscale = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);

    let currentToken = turnstileToken;
    if (!currentToken && turnstileRef.current) {
      currentToken = turnstileRef.current.getResponse();
    }

    if (!currentToken) {
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        if (turnstileRef.current) {
          currentToken = turnstileRef.current.getResponse();
          if (currentToken) {
            setTurnstileToken(currentToken);
            break;
          }
        }
      }
    }

    if (!currentToken) {
      console.error("Security verification timed out.");
      setIsProcessing(false);
      resetTurnstile();
      return;
    }

    try {
      const data = await apiService.uploadImage(selectedFile, modelType, currentToken);
      pollForResult(data.job_id);
    } catch (error) {
      console.error("Error:", error);
      alert(error.message);
      setIsProcessing(false);
      resetTurnstile();
    }
  };

  return {
    selectedFile,
    previewUrl,
    isProcessing,
    resultUrl,
    modelType,
    setModelType,
    turnstileToken,
    setTurnstileToken,
    turnstileRef,
    handleFileSelect,
    handleCancel,
    handleUpscale
  };
}