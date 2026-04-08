import WorkspaceLayout from './WorkspaceLayout';

export default function ToolWorkspaceShell({
  leftHeader,
  leftBody,
  leftFooter,
  rightHeader,
  rightBody,
  minHeight = 'min-h-96',
}) {
  return (
    <WorkspaceLayout
      minHeight={minHeight}
      leftPanel={
        <div className="flex h-full flex-col">
          <div className="mb-4">{leftHeader}</div>
          <div className="flex-1 min-h-0">{leftBody}</div>
          <div className="mt-auto pt-2">{leftFooter}</div>
        </div>
      }
      rightPanel={
        <div className="flex h-full w-full flex-col">
          <div className="mb-4">{rightHeader}</div>
          <div className="relative flex min-h-72 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/50 bg-white/30 p-2 shadow-inner">
            {rightBody}
          </div>
        </div>
      }
    />
  );
}