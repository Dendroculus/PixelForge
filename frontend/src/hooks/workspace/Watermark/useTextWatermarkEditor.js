import { useRef, useCallback } from 'react';

/**
 * Manages rich-text editing behavior for text watermarks.
 * Handles character-level style tracking, selection state updates,
 * and formatting actions for bold, italic, and underline styles.
 *
 * @param {Object} textWm - Current text watermark state.
 * @param {Function} setTextWm - Watermark state updater.
 * @returns {{
 *   textareaRef: React.RefObject<HTMLTextAreaElement>,
 *   handleTextChange: Function,
 *   updateActiveToggles: Function,
 *   toggleStyle: Function
 * }}
 */
export function useTextWatermarkEditor(textWm, setTextWm) {
  const textareaRef = useRef(null);

  /**
   * Updates watermark text while preserving per-character style metadata.
   * Newly inserted characters inherit the currently active formatting state.
   *
   * @param {React.ChangeEvent<HTMLTextAreaElement>} e - Text change event.
   */
  const handleTextChange = useCallback((e) => {
    const newText = e.target.value;

    setTextWm((prev) => {
      const oldText = prev.text || '';
      const newStyles = [...(prev.charStyles || [])];

      let p = 0;
      while (p < oldText.length && p < newText.length && oldText[p] === newText[p]) p++;

      let s = 0;
      while (
        s < oldText.length - p &&
        s < newText.length - p &&
        oldText[oldText.length - 1 - s] === newText[newText.length - 1 - s]
      ) {
        s++;
      }

      const addedLen = newText.length - p - s;
      const removedLen = oldText.length - p - s;

      const insertedStyles = Array.from({ length: addedLen }, () => ({
        b: prev.isBold,
        i: prev.isItalic,
        u: prev.isUnderline,
      }));

      newStyles.splice(p, removedLen, ...insertedStyles);

      return {
        ...prev,
        text: newText,
        charStyles: newStyles,
      };
    });
  }, [setTextWm]);

  /**
   * Updates active formatting toggle states based on the current
   * text selection or cursor position.
   */
  const updateActiveToggles = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;

    setTextWm((prev) => {
      const styles = prev.charStyles || [];

      if (start !== end && styles.length > 0) {
        const selectedStyles = styles.slice(start, end);
        const isBold = selectedStyles.every((s) => s?.b);
        const isItalic = selectedStyles.every((s) => s?.i);
        const isUnderline = selectedStyles.every((s) => s?.u);

        if (prev.isBold === isBold && prev.isItalic === isItalic && prev.isUnderline === isUnderline) {
          return prev;
        }

        return { ...prev, isBold, isItalic, isUnderline };
      }

      if (start > 0 && styles.length >= start) {
        const prevCharStyle = styles[start - 1];

        if (prevCharStyle) {
          if (
            prev.isBold === prevCharStyle.b &&
            prev.isItalic === prevCharStyle.i &&
            prev.isUnderline === prevCharStyle.u
          ) {
            return prev;
          }

          return {
            ...prev,
            isBold: prevCharStyle.b,
            isItalic: prevCharStyle.i,
            isUnderline: prevCharStyle.u,
          };
        }
      }

      return prev;
    });
  }, [setTextWm]);

  /**
   * Toggles a formatting style for the current selection or typing state.
   * Applies the style to all selected characters or updates the active
   * formatting state when no text is selected.
   *
   * @param {'b'|'i'|'u'} styleKey - Style key to toggle.
   */
  const toggleStyle = useCallback((styleKey) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;

    const styleMap = { b: 'isBold', i: 'isItalic', u: 'isUnderline' };
    const stateKey = styleMap[styleKey];

    setTextWm((prev) => {
      if (start !== end) {
        const newStyles = [...(prev.charStyles || [])];
        const selectedStyles = newStyles.slice(start, end);

        const isAllApplied = selectedStyles.every((s) => s?.[styleKey]);
        const newValue = !isAllApplied;

        for (let i = start; i < end; i++) {
          if (newStyles[i]) {
            newStyles[i] = { ...newStyles[i], [styleKey]: newValue };
          }
        }

        return {
          ...prev,
          charStyles: newStyles,
          [stateKey]: newValue,
        };
      }

      return {
        ...prev,
        [stateKey]: !prev[stateKey],
      };
    });

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start, end);
    }, 0);
  }, [setTextWm]);

  return {
    textareaRef,
    handleTextChange,
    updateActiveToggles,
    toggleStyle,
  };
}