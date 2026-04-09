export default function EmptyWorkspaceState() {
  return (
    <div className="px-4 text-center">
      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-white bg-white/50 shadow-sm">
        <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-400">Workspace is empty</p>
    </div>
  );
}