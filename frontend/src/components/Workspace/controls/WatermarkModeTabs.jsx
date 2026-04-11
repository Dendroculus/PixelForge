export default function WatermarkModeTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex rounded-lg bg-slate-100 p-1">
      <button
        type="button"
        onClick={() => setActiveTab('text')}
        className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-all ${
          activeTab === 'text' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        Text Overlay
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('image')}
        className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-all ${
          activeTab === 'image' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        Image Logo
      </button>
    </div>
  );
}