export default function ImageWatermarkControls({ watermarkImageRef, handleWatermarkImageUpload, imgWm, setImgWm }) {
  return (
    <div className="space-y-4 pb-2">
      <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer shadow-sm">
        <input
          type="file"
          ref={watermarkImageRef}
          onChange={handleWatermarkImageUpload}
          accept="image/png, image/jpeg, image/webp"
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />
        <span className="text-xs font-semibold text-slate-700">
          {imgWm.url ? 'Replace logo image' : 'Upload logo image (.png)'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">Scale</label>
          <input type="range" min="0.1" max="2" step="0.1" value={imgWm.scale} onChange={(e) => setImgWm((prev) => ({ ...prev, scale: Number(e.target.value) }))} className="h-1.5 w-full appearance-none rounded-lg bg-indigo-100 accent-indigo-600" />
        </div>
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide">
            <span>Opacity</span>
            <span className="text-indigo-600">{Math.round(imgWm.opacity * 100)}%</span>
          </label>
          <input type="range" min="0.1" max="1" step="0.05" value={imgWm.opacity} onChange={(e) => setImgWm((prev) => ({ ...prev, opacity: Number(e.target.value) }))} className="h-1.5 w-full appearance-none rounded-lg bg-indigo-100 accent-indigo-600" />
        </div>
      </div>
    </div>
  );
}