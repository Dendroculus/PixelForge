import { useRef, useCallback } from 'react';

export function useTextWatermarkEditor(textWm, setTextWm) {
  const textareaRef = useRef(null);

  const handleTextChange = useCallback((e) => {
    const newText = e.target.value;
    const oldText = textWm.text || '';
    const newStyles = [...(textWm.charStyles || [])];

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

    const insertedStyles = Array(addedLen).fill({
      b: textWm.isBold,
      i: textWm.isItalic,
      u: textWm.isUnderline,
    });

    newStyles.splice(p, removedLen, ...insertedStyles);

    setTextWm((prev) => ({
      ...prev,
      text: newText,
      charStyles: newStyles,
    }));
  }, [textWm, setTextWm]);

  const updateActiveToggles = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    
    const start = el.selectionStart;
    const end = el.selectionEnd;

    if (start !== end && textWm.charStyles?.length > 0) {
      const firstCharStyle = textWm.charStyles[start];
      if (firstCharStyle) {
        setTextWm((prev) => ({
          ...prev,
          isBold: firstCharStyle.b,
          isItalic: firstCharStyle.i,
          isUnderline: firstCharStyle.u,
        }));
      }
    } else if (start > 0 && textWm.charStyles?.length >= start) {
      const prevCharStyle = textWm.charStyles[start - 1];
      if (prevCharStyle) {
        setTextWm((prev) => ({
          ...prev,
          isBold: prevCharStyle.b,
          isItalic: prevCharStyle.i,
          isUnderline: prevCharStyle.u,
        }));
      }
    }
  }, [textWm.charStyles, setTextWm]);

  const toggleStyle = useCallback((styleKey) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    
    const styleMap = { b: 'isBold', i: 'isItalic', u: 'isUnderline' };
    const stateKey = styleMap[styleKey];
    const newValue = !textWm[stateKey];

    if (start !== end) {
      const newStyles = [...(textWm.charStyles || [])];
      for (let i = start; i < end; i++) {
        if (newStyles[i]) {
          newStyles[i] = { ...newStyles[i], [styleKey]: newValue };
        }
      }
      setTextWm((prev) => ({
        ...prev,
        charStyles: newStyles,
        [stateKey]: newValue,
      }));
    } else {
      setTextWm((prev) => ({ ...prev, [stateKey]: newValue }));
    }

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start, end);
    }, 0);
  }, [textWm, setTextWm]);

  return { textareaRef, handleTextChange, updateActiveToggles, toggleStyle };
}