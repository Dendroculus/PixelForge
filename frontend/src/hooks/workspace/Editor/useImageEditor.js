import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  renderPreviewDataUrl,
  processImageEditing,
} from '@/utils/image/editorUtils';
import { generateSafeFilename } from '@/utils/file/fileUtils';

export const DEFAULT_FILTERS = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  blur: 0,
  vignette: 0,
  fade: 0,
};

/**
 * @param {object} workspaceFile - From useWorkspaceFile
 * @returns Editor state and handlers
 */
export function useImageEditor(workspaceFile) {
  const { file, previewUrl, setError, cleanupResult, resetAll } = workspaceFile;

  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [isProcessing, setIsProcessing] = useState(false);
  const [fitMode, setFitMode] = useState('contain');
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const debounceRef = useRef(null);

  // Rebuild the canvas preview whenever the source image or filters change.
  useEffect(() => {
    if (!previewUrl) {
      setPreviewDataUrl(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsPreviewing(true);
      try {
        const dataUrl = await renderPreviewDataUrl(previewUrl, filters);
        setPreviewDataUrl(dataUrl);
      } catch (e) {
        console.error('Preview render failed:', e);
      } finally {
        setIsPreviewing(false);
      }
    }, 80);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [previewUrl, filters]);

  // Reset everything when a new image is loaded.
  useEffect(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, [previewUrl]);

  const handleFilterChange = useCallback(
    (key, value) => {
      setFilters((prev) => ({ ...prev, [key]: Number(value) }));
      cleanupResult();
    },
    [cleanupResult],
  );

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
    cleanupResult();
  }, [cleanupResult]);

  const handleReset = useCallback(() => {
    resetAll();
    setFilters({ ...DEFAULT_FILTERS });
    setPreviewDataUrl(null);
    setIsProcessing(false);
  }, [resetAll]);

  const toggleFitMode = useCallback((e) => {
    if (e) e.stopPropagation();
    setFitMode((prev) => (prev === 'contain' ? 'cover' : 'contain'));
  }, []);

  /**
   * Exports the image using the same canvas pipeline as the preview, then
   * triggers a browser download.
   */
  const applyFilters = useCallback(async () => {
    if (!file || !previewUrl) return;

    setIsProcessing(true);
    setError('');
    cleanupResult();

    try {
      const exportOpts = { mimeType: file.type || 'image/jpeg' };
      const blob = await processImageEditing(previewUrl, filters, exportOpts);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = generateSafeFilename(file?.name, 'edited', 'jpg');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      console.error(e);
      setError('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [file, previewUrl, filters, cleanupResult, setError]);

  const canProcess = useMemo(
    () => Boolean(file) && !isProcessing,
    [file, isProcessing],
  );

  return {
    filters,
    isProcessing,
    isPreviewing,
    fitMode,
    previewDataUrl,
    canProcess,
    handleFilterChange,
    resetFilters,
    handleReset,
    toggleFitMode,
    applyFilters,
  };
}
