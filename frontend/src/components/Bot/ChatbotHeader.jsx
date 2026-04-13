/**
 * Renders chatbot header with title, avatar, close, and search.
 */
export default function ChatbotHeader({
  img,
  query,
  setQuery,
  setView,
  searchFocused,
  setSearchFocused,
  handleClose,
}) {
  return (
    <div
      className="relative shrink-0 p-4 pb-4 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.3)',
      }}
    >
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div
              className="absolute -inset-0.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #d946ef)', opacity: 0.8 }}
            />
            <img
              src={img.chatbotIcon}
              alt="PixelForge Assistant"
              className="relative w-10 h-10 rounded-full object-cover z-10"
            />
            <span
              className="fw-online absolute bottom-0 right-0 z-20 w-2.5 h-2.5 rounded-full"
              style={{ background: '#34d399', border: '2px solid #ffffff' }}
            />
          </div>
          <div className="min-w-2">
            <h3 className="fw-display text-sm font-bold leading-tight text-slate-800 truncate tracking-tight">
              PixelForge Assistant
            </h3>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all bg-white/40 hover:bg-white/60 border border-white/50"
          aria-label="Close chatbot"
        >
          <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="relative mt-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setSearchFocused(true);
            setView('search');
          }}
          onBlur={() => setSearchFocused(false)}
          placeholder="Ask anything about PixelForge..."
          className="w-full rounded-2xl text-sm pl-10 pr-14 py-2.5 outline-none text-slate-800 transition-all placeholder:text-slate-500"
          style={{
            background: 'rgba(255,255,255,0.6)',
            border: searchFocused ? '1px solid rgba(139,92,246,0.7)' : '1px solid rgba(255,255,255,0.8)',
            boxShadow: searchFocused ? '0 0 0 3px rgba(124,58,237,0.15)' : 'none',
          }}
        />
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.85-4.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
        </svg>
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setView('home');
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all text-slate-600 bg-white/50 hover:bg-white/80"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}