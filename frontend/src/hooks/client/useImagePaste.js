import { useEffect } from 'react';

/**
 * Custom hook to intercept global paste events and extract image files.
 * @param {Function} onImagePasted - Callback function triggered with the File object.
 */
export const useImagePaste = (onImagePasted) => {
useEffect(() => {
    const handlePaste = (e) => {
      const activeEl = document.activeElement;
      
      const isInputOrTextArea = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA';
      const isContentEditable = activeEl.isContentEditable;

      if (isInputOrTextArea || isContentEditable) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          
          if (file) {
            e.preventDefault(); 
            onImagePasted(file);
            break; 
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onImagePasted]);
};