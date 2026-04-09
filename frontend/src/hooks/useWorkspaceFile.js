import { useState, useCallback, useEffect } from 'react';

export function useWorkspaceFile(inputRef) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [resultBlob, setResultBlob] = useState(null);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');

  const revokeUrl = useCallback((url) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  const cleanupPreview = useCallback(() => {
    revokeUrl(previewUrl);
    setPreviewUrl('');
  }, [previewUrl, revokeUrl]);

  const cleanupResult = useCallback(() => {
    revokeUrl(resultUrl);
    setResultUrl('');
    setResultBlob(null);
  }, [resultUrl, revokeUrl]);

  const resetAll = useCallback(() => {
    cleanupPreview();
    cleanupResult();
    setFile(null);
    setError('');
    if (inputRef?.current) {
      inputRef.current.value = '';
    }
  }, [cleanupPreview, cleanupResult, inputRef]);

  const onFileChange = useCallback((event) => {
    const picked = event.target.files?.[0];
    if (!picked) return;

    setError('');
    cleanupResult();
    cleanupPreview();

    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
  }, [cleanupResult, cleanupPreview]);

  useEffect(() => {
    return () => {
      revokeUrl(previewUrl);
      revokeUrl(resultUrl);
    };
  }, [previewUrl, resultUrl, revokeUrl]);

  return {
    file,
    previewUrl,
    resultBlob,
    setResultBlob,
    resultUrl,
    setResultUrl,
    error,
    setError,
    onFileChange,
    resetAll,
    cleanupResult
  };
}