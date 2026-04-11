import FormatDropdown from '../../../components/Workspace/controls/FormatDropdown';

export default function TextWatermarkControls({ textWm, setTextWm, fontFamilies, watermarkColors }) {
  return (
    <div className="space-y-3 pb-1">
      <div>
        <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">Watermark Text</label>
        <input
          type="text"
          value={textWm.text}
          onChange={(e) => setTextWm((prev) => ({ ...prev, text: e.target.value }))}
          placeholder="Enter watermark text"
          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
              onClick={() => setTextWm((prev) => ({ ...prev, isBold: !prev.isBold }))}
              className={`rounded-md text-sm font-bold transition-colors ${
                textWm.isBold ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => setTextWm((prev) => ({ ...prev, isItalic: !prev.isItalic }))}
              className={`rounded-md text-sm transition-colors ${
                textWm.isItalic ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="italic">I</span>
            </button>
            <button
              type="button"
              onClick={() => setTextWm((prev) => ({ ...prev, isUnderline: !prev.isUnderline }))}
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
        <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">Text Color</label>
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
            {watermarkColors.includes(textWm.color) && (
              <svg
                className="w-3.5 h-3.5 text-white drop-shadow-md pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            )}
            <input
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
          <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide">
            <span>Size</span>
            <span className="text-indigo-600">{textWm.fontSize}px</span>
          </label>
          <input
            type="range"
            min="12"
            max="120"
            value={textWm.fontSize}
            onChange={(e) => setTextWm((prev) => ({ ...prev, fontSize: Number(e.target.value) }))}
            className="h-1.5 w-full appearance-none rounded-lg bg-indigo-100 accent-indigo-600"
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide">
            <span>Opacity</span>
            <span className="text-indigo-600">{Math.round(textWm.opacity * 100)}%</span>
          </label>
          <input
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