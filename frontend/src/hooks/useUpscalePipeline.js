import { useState, useRef } from 'react';
import { apiService } from '../services/apiService';

export function useUpscalePipeline(setProgress) {
  /**
   * Manages the full client-side image upscaling pipeline:
   * file selection, preview, upload, polling, and result handling.
   */
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [modelType, setModelType] = useState('general');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);

  const resetTurnstile = () => {
    if (turnstileRef.current) {
      turnstileRef.current.reset();
    }
    setTurnstileToken(null);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null); 
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setIsProcessing(false);
    resetTurnstile();
  };

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
    }, 3000);
  };

  const handleUpscale = async () => {
    if (!selectedFile) return;
    
    if (!turnstileToken) {
      alert("Please wait for security verification to complete.");
      return;
    }

    setIsProcessing(true);

    try {
      const data = await apiService.uploadImage(selectedFile, modelType, turnstileToken);
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