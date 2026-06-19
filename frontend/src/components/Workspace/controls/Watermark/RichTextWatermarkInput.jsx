import PropTypes from 'prop-types';
import { useRef } from 'react';
import { getTextSegmentStyle } from '../../../../utils/image/watermarkUtils';

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
 * @param {Object} props
 * @param {Object} props.textWm - Current text watermark state
 * @param {React.RefObject} props.textareaRef - Ref to the underlying textarea
 * @param {Function} props.onTextChange - Text change handler
 * @param {Function} props.onInteraction - General interaction handler (select, click, keyup)
 * @returns {JSX.Element}
 */
export default function RichTextWatermarkInput({
  textWm,
  textareaRef,
  onTextChange,
  onInteraction,
}) {
  const backdropRef = useRef(null);

  /**
   * @param {React.UIEvent<HTMLTextAreaElement>} e
   */
  const handleScroll = (e) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.target.scrollTop;
      backdropRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const renderBackdropText = () => {
    if (!textWm.text) {
      return (
        <span className="text-slate-400">
          Enter watermark text{'\n'}Press Enter for new line
        </span>
      );
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
      <span key={idx} style={getTextSegmentStyle(seg)}>
        {seg.text}
      </span>
    ));
  };

  return (
    <div>
      <style>{CustomStyles}</style>
      <label
        htmlFor="watermark-text"
        className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide"
      >
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
          onChange={onTextChange}
          onSelect={onInteraction}
          onKeyUp={onInteraction}
          onClick={onInteraction}
          onScroll={handleScroll}
          spellCheck={false}
          className="rich-text-input absolute inset-0 w-full h-full p-3 resize-none bg-transparent text-transparent caret-slate-900 outline-none custom-textarea-scroll"
          style={{ lineHeight: '1.5rem', fontFamily: 'inherit' }}
        />
      </div>
    </div>
  );
}

RichTextWatermarkInput.propTypes = {
  textWm: PropTypes.object.isRequired,
  textareaRef: PropTypes.object,
  onTextChange: PropTypes.func.isRequired,
  onInteraction: PropTypes.func.isRequired,
};
