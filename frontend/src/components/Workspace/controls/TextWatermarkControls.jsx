import PropTypes from 'prop-types';
import { useRef } from 'react';
import FormatDropdown from '../../../components/Workspace/controls/FormatDropdown';
import { useTextWatermarkEditor } from '../../../hooks/workspace/useTextWatermarkEditor';

const CustomStyles = `
  .custom-textarea-scroll::-webkit-scrollbar { width: 6px; }
  .custom-textarea-scroll::-webkit-scrollbar-track { background: transparent; margin: 4px 0; }
  .custom-textarea-scroll::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }
  .custom-textarea-scroll::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.8); }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  .rich-text-input::selection { background: rgba(99, 102, 241, 0.25); color: transparent; }
  .rich-text-input::-moz-selection { background: rgba(99, 102, 241, 0.25); color: transparent; }
`;

/**
 * Watermark text editor with rich-text formatting support.
 * Uses a transparent textarea layered over a styled backdrop to provide
 * native text editing while visually rendering bold, italic, and underline styles.
 *
 * @param {Object} props
 * @param {Object} props.textWm - Current text watermark state.
 * @param {Function} props.setTextWm - Watermark state updater.
 * @param {string[]} props.fontFamilies - Available font family options.
 * @param {string[]} props.watermarkColors - Available color presets.
 * @returns {JSX.Element}
 */
export default function TextWatermarkControls({ textWm, setTextWm, fontFamilies, watermarkColors }) {
  const { textareaRef, handleTextChange, updateActiveToggles, toggleStyle } = useTextWatermarkEditor(textWm, setTextWm);
  const backdropRef = useRef(null);

  /**
   * Synchronizes backdrop scrolling with the textarea.
   *
   * @param {React.UIEvent<HTMLTextAreaElement>} e - Scroll event.
   */
  const handleScroll = (e) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.target.scrollTop;
      backdropRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  /**
   * Renders formatted text segments based on per-character style metadata.
   * Adjacent characters sharing identical formatting are grouped into a single span.
   *
   * @returns {JSX.Element[]|JSX.Element}
   */
  const renderBackdropText = () => {
    if (!textWm.text) {
      return <span className="text-slate-400">Enter watermark text{'\n'}Press Enter for new line</span>;
    }

    const segments = [];
    const chars = textWm.text;
    const styles = textWm.charStyles || [];

    let currentSegment = { text: chars[0], ...(styles[0] || {}) };

    for (let i = 1; i < chars.length; i++) {
      const char = chars[i];
      const style = styles[i] || {};

      if (
        style.b === currentSegment.b &&
        style.i === currentSegment.i &&
        style.u === currentSegment.u
      ) {
        currentSegment.text += char;
      } else {
        segments.push(currentSegment);
        currentSegment = { text: char, ...style };
      }
    }

    segments.push(currentSegment);

    return segments.map((seg, idx) => (
      <span
        key={idx}
        style={{
          fontWeight: seg.b ? 'bold' : 'normal',
          fontStyle: seg.i ? 'italic' : 'normal',
          textDecoration: seg.u ? 'underline' : 'none',
        }}
      >
        {seg.text}
      </span>
    ));
  };

  return (
    <div className="space-y-3 pb-1">
      <style>{CustomStyles}</style>

      <div>
        <label htmlFor="watermark-text" className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">
          Watermark Text
        </label>

        <div className="relative w-full h-24 rounded-lg border border-slate-200 bg-white shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 text-sm font-semibold text-slate-700">
          <div
            ref={backdropRef}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full p-3 whitespace-pre-wrap wrap-break-word overflow-y-auto pointer-events-none hide-scrollbar"
            style={{ lineHeight: '1.5rem', fontFamily: 'inherit' }}
          >
            {renderBackdropText()}
          </div>

          <textarea
            id="watermark-text"
            ref={textareaRef}
            value={textWm.text}
            onChange={handleTextChange}
            onSelect={updateActiveToggles}
            onKeyUp={updateActiveToggles}
            onClick={updateActiveToggles}
            onScroll={handleScroll}
            spellCheck={false}
            className="rich-text-input absolute inset-0 w-full h-full p-3 resize-none bg-transparent text-transparent caret-slate-900 outline-none custom-textarea-scroll"
            style={{ lineHeight: '1.5rem', fontFamily: 'inherit' }}
          />
        </div>
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
              onPointerDown={(e) => { e.preventDefault(); toggleStyle('b'); }}
              className={`rounded-md text-sm font-bold transition-colors ${textWm.isBold ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              B
            </button>

            <button
              type="button"
              onPointerDown={(e) => { e.preventDefault(); toggleStyle('i'); }}
              className={`rounded-md text-sm transition-colors ${textWm.isItalic ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="italic">I</span>
            </button>

            <button
              type="button"
              onPointerDown={(e) => { e.preventDefault(); toggleStyle('u'); }}
              className={`rounded-md text-sm transition-colors ${textWm.isUnderline ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="underline">U</span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">
          Text Color
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          {watermarkColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setTextWm((prev) => ({ ...prev, color }))}
              className={`h-7 w-7 shrink-0 rounded-full shadow-sm transition-all ${textWm.color === color ? 'ring-2 ring-indigo-500 ring-offset-2' : 'border border-slate-200 hover:scale-105'}`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}

          <div
            className={`relative h-7 w-7 shrink-0 rounded-full shadow-sm transition-all flex items-center justify-center cursor-pointer ${!watermarkColors.includes(textWm.color) ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:scale-105 border border-slate-200'}`}
            style={{ background: watermarkColors.includes(textWm.color) ? 'linear-gradient(to top right, #fb7185, #d946ef, #6366f1)' : textWm.color }}
            title="Custom color"
          >
            <input
              aria-label="Custom text color"
              type="color"
              value={textWm.color}
              onChange={(e) => setTextWm((prev) => ({ ...prev, color: e.target.value }))}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
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
  textWm: PropTypes.object.isRequired,
  setTextWm: PropTypes.func.isRequired,
  fontFamilies: PropTypes.arrayOf(PropTypes.string).isRequired,
  watermarkColors: PropTypes.arrayOf(PropTypes.string).isRequired,
};