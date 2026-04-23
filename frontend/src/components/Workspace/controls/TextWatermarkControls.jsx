import PropTypes from 'prop-types';
import { useRef } from 'react';
import FormatDropdown from '../../../components/Workspace/controls/FormatDropdown';

const CustomScrollbarStyle = `
  .custom-textarea-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .custom-textarea-scroll::-webkit-scrollbar-track {
    background: transparent;
    margin: 4px 0;
  }
  .custom-textarea-scroll::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.4); /* slate-400 */
    border-radius: 10px;
  }
  .custom-textarea-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.8); /* indigo-500 */
  }
`;

/**
 * Control inputs specifically for styling and configuring text watermarks.
 * @param {Object} props - The component props.
 * @param {Object} props.textWm - State holding text watermark configuration including character styles.
 * @param {Function} props.setTextWm - State setter for text watermark properties.
 * @param {string[]} props.fontFamilies - Array of available font family strings.
 * @param {string[]} props.watermarkColors - Array of standard hex colors for quick selection.
 * @returns {JSX.Element}
 */
export default function TextWatermarkControls({ textWm, setTextWm, fontFamilies, watermarkColors }) {
  const textareaRef = useRef(null);

  const handleTextChange = (e) => {
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
  };

  const updateActiveToggles = () => {
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
  };

  const toggleStyle = (styleKey) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    
    const stateKey = styleKey === 'b' ? 'isBold' : styleKey === 'i' ? 'isItalic' : 'isUnderline';
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
      setTextWm((prev) => ({
        ...prev,
        [stateKey]: newValue,
      }));
    }

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start, end);
    }, 0);
  };

  return (
    <div className="space-y-3 pb-1">
      <style>{CustomScrollbarStyle}</style>

      <div>
        <label htmlFor="watermark-text" className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">
          Watermark Text
        </label>
        <textarea
          id="watermark-text"
          ref={textareaRef}
          value={textWm.text}
          onChange={handleTextChange}
          onSelect={updateActiveToggles}
          onKeyUp={updateActiveToggles}
          onClick={updateActiveToggles}
          placeholder="Enter watermark text&#10;Press Enter for new line"
          className="custom-textarea-scroll min-h-20 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col justify-end">
          <FormatDropdown
            value={textWm.fontFamily}
            options={fontFamilies}
            onChange={(val) => setTextWm((prev) => ({ ...prev, fontFamily: val }))}
            label="Font Family"
            transform="none"
            labelClassName="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide"
            buttonClassName="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 h-9 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all hover:bg-slate-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            getOptionStyle={(opt) => ({ fontFamily: opt })}
          />
        </div>

        <div className="flex flex-col justify-end pb-0.5">
          <div className="grid h-9 grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); toggleStyle('b'); }}
              className={`rounded-md text-sm font-bold transition-colors ${
                textWm.isBold ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              B
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); toggleStyle('i'); }}
              className={`rounded-md text-sm transition-colors ${
                textWm.isItalic ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="italic">I</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); toggleStyle('u'); }}
              className={`rounded-md text-sm transition-colors ${
                textWm.isUnderline ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="underline">U</span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">Text Color</h3>
        <div className="flex flex-wrap items-center gap-2">
          {watermarkColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setTextWm((prev) => ({ ...prev, color }))}
              className={`h-7 w-7 shrink-0 rounded-full shadow-sm transition-all ${
                textWm.color === color ? 'ring-2 ring-indigo-500 ring-offset-2' : 'border border-slate-200 hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}

          <div
            className={`relative h-7 w-7 shrink-0 rounded-full shadow-sm transition-all flex items-center justify-center cursor-pointer ${
              !watermarkColors.includes(textWm.color)
                ? 'ring-2 ring-indigo-500 ring-offset-2'
                : 'hover:scale-105 border border-slate-200'
            }`}
            style={{
              background: watermarkColors.includes(textWm.color)
                ? 'linear-gradient(to top right, #fb7185, #d946ef, #6366f1)'
                : textWm.color,
            }}
            title="Custom color"
          >
            <input
              aria-label="Custom text color"
              type="color"
              value={textWm.color}
              onChange={(e) => setTextWm((prev) => ({ ...prev, color: e.target.value }))}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              title="Custom color"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="wm-font-size" className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide">
            <span>Size</span>
            <span className="text-indigo-600">{textWm.fontSize}px</span>
          </label>
          <input
            id="wm-font-size"
            type="range"
            min="12"
            max="120"
            value={textWm.fontSize}
            onChange={(e) => setTextWm((prev) => ({ ...prev, fontSize: Number(e.target.value) }))}
            className="h-1.5 w-full appearance-none rounded-lg bg-indigo-100 accent-indigo-600"
          />
        </div>
        <div>
          <label htmlFor="wm-text-opacity" className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide">
            <span>Opacity</span>
            <span className="text-indigo-600">{Math.round(textWm.opacity * 100)}%</span>
          </label>
          <input
            id="wm-text-opacity"
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={textWm.opacity}
            onChange={(e) => setTextWm((prev) => ({ ...prev, opacity: Number(e.target.value) }))}
            className="h-1.5 w-full appearance-none rounded-lg bg-indigo-100 accent-indigo-600"
          />
        </div>
      </div>
    </div>
  );
}

TextWatermarkControls.propTypes = {
  textWm: PropTypes.shape({
    text: PropTypes.string,
    charStyles: PropTypes.arrayOf(
      PropTypes.shape({
        b: PropTypes.bool,
        i: PropTypes.bool,
        u: PropTypes.bool,
      })
    ),
    fontFamily: PropTypes.string,
    color: PropTypes.string,
    fontSize: PropTypes.number,
    isBold: PropTypes.bool,
    isItalic: PropTypes.bool,
    isUnderline: PropTypes.bool,
    opacity: PropTypes.number,
  }).isRequired,
  setTextWm: PropTypes.func.isRequired,
  fontFamilies: PropTypes.arrayOf(PropTypes.string).isRequired,
  watermarkColors: PropTypes.arrayOf(PropTypes.string).isRequired,
};