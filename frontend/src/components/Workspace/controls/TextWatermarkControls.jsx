import PropTypes from 'prop-types';
import FormatDropdown from '../../../components/Workspace/controls/FormatDropdown';
import { useTextWatermarkEditor } from '../../../hooks/workspace/useTextWatermarkEditor';
import RichTextWatermarkInput from './RichTextWatermarkInput';
import TextStyleToggles from './common/TextStyleToggles';
import ColorSwatches from './common/ColorSwatches';
import RangeSlider from './common/RangeSlider';

/**
 * Watermark text editor with rich-text formatting support.
 * Serves as the layout composer for the watermark editor components.
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

  return (
    <div className="space-y-3 pb-1">
      
      <RichTextWatermarkInput 
        textWm={textWm} 
        textareaRef={textareaRef} 
        onTextChange={handleTextChange} 
        onInteraction={updateActiveToggles} 
      />

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
          <TextStyleToggles 
            isBold={textWm.isBold}
            isItalic={textWm.isItalic}
            isUnderline={textWm.isUnderline}
            onToggle={toggleStyle}
          />
        </div>
      </div>

      <ColorSwatches 
        colors={watermarkColors} 
        selectedColor={textWm.color} 
        onColorChange={(color) => setTextWm((prev) => ({ ...prev, color }))} 
      />

      <div className="grid grid-cols-2 gap-4">
        <RangeSlider
          id="wm-font-size"
          label="Size"
          min={12}
          max={120}
          value={textWm.fontSize}
          onChange={(val) => setTextWm((prev) => ({ ...prev, fontSize: val }))}
          displayValue={`${textWm.fontSize}px`}
        />

        <RangeSlider
          id="wm-text-opacity"
          label="Opacity"
          min={0.1}
          max={1}
          step={0.05}
          value={textWm.opacity}
          onChange={(val) => setTextWm((prev) => ({ ...prev, opacity: val }))}
          displayValue={`${Math.round(textWm.opacity * 100)}%`}
        />
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